//! Bounded file-event queue. The worker owns no workspace lock or WebView state.
use crate::file_index::FileIndex;
use notify::{EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use std::{
    collections::HashSet,
    fs,
    path::{Component, Path, PathBuf},
    sync::{
        atomic::{AtomicBool, Ordering},
        mpsc, Arc, Mutex, Weak,
    },
    thread,
    time::{Duration, Instant},
};
type SharedIndex = Arc<Mutex<Option<FileIndex>>>;
const CAPACITY: usize = 512;
const DEBOUNCE: Duration = Duration::from_millis(150);

pub struct IndexWorker {
    _watcher: RecommendedWatcher,
    stop: Arc<AtomicBool>,
}
impl Drop for IndexWorker {
    fn drop(&mut self) {
        self.stop.store(true, Ordering::Release);
    }
}
impl IndexWorker {
    #[cfg(test)]
    pub fn start(root: PathBuf, index: SharedIndex, gate: Arc<Mutex<()>>) -> Result<Self, String> {
        Self::start_notifying(root, index, gate, None)
    }
    pub fn start_notifying(root: PathBuf, index: SharedIndex, gate: Arc<Mutex<()>>, on_update: Option<Box<dyn Fn() + Send>>) -> Result<Self, String> {
        let (tx, rx) = mpsc::sync_channel(CAPACITY);
        let overflow = Arc::new(AtomicBool::new(false));
        let flag = Arc::clone(&overflow);
        let mut watcher =
            notify::recommended_watcher(move |event: notify::Result<notify::Event>| {
                if matches!(&event, Ok(event) if matches!(event.kind, EventKind::Access(_))) {
                    return;
                }
                if tx.try_send(event).is_err() {
                    flag.store(true, Ordering::Release);
                }
            })
            .map_err(|e| e.to_string())?;
        watcher
            .watch(&root, RecursiveMode::Recursive)
            .map_err(|e| e.to_string())?;
        let stop = Arc::new(AtomicBool::new(false));
        let worker_stop = Arc::clone(&stop);
        let index = Arc::downgrade(&index);
        thread::Builder::new()
            .name("file-index".into())
            .spawn(move || {
                run(root, index, rx, overflow, worker_stop, gate, on_update);
            })
            .map_err(|e| e.to_string())?;
        Ok(Self {
            _watcher: watcher,
            stop,
        })
    }
}
#[derive(Default)]
struct Dirty {
    paths: HashSet<PathBuf>,
    rescan: bool,
}
impl Dirty {
    fn add(&mut self, event: notify::Result<notify::Event>) {
        match event {
            Ok(event)
                if !event.need_rescan()
                    && !matches!(event.kind, EventKind::Any | EventKind::Other)
                    && !event.paths.is_empty() =>
            {
                self.paths.extend(event.paths);
                if self.paths.len() > CAPACITY {
                    self.paths.clear();
                    self.rescan = true;
                }
            }
            _ => self.rescan = true,
        }
    }
}
fn run(
    root: PathBuf,
    index: Weak<Mutex<Option<FileIndex>>>,
    rx: mpsc::Receiver<notify::Result<notify::Event>>,
    overflow: Arc<AtomicBool>,
    stop: Arc<AtomicBool>,
    gate: Arc<Mutex<()>>,
    on_update: Option<Box<dyn Fn() + Send>>,
) {
    // The watcher starts before this reconciliation, closing the initial-scan gap.
    let mut retry = true;
    let mut interval = Duration::from_millis(250);
    loop {
        if stop.load(Ordering::Acquire) {
            break;
        }
        let mut dirty = Dirty::default();
        match rx.recv_timeout(interval) {
            Ok(event) => {
                dirty.add(event);
                let deadline = Instant::now() + DEBOUNCE;
                while Instant::now() < deadline && !stop.load(Ordering::Acquire) {
                    match rx.recv_timeout(deadline.saturating_duration_since(Instant::now())) {
                        Ok(event) => dirty.add(event),
                        Err(_) => break,
                    }
                }
            }
            Err(mpsc::RecvTimeoutError::Disconnected) => break,
            Err(mpsc::RecvTimeoutError::Timeout) => {}
        }
        dirty.rescan |= overflow.swap(false, Ordering::AcqRel) || retry;
        if !dirty.rescan && dirty.paths.is_empty() {
            continue;
        }
        if stop.load(Ordering::Acquire) {
            break;
        }
        let Some(index) = index.upgrade() else {
            break;
        };
        let Ok(_gate) = gate.lock() else {
            break;
        };
        let result = index
            .lock()
            .map_err(|e| e.to_string())
            .and_then(|mut guard| {
                if stop.load(Ordering::Acquire) {
                    return Ok(());
                }
                if guard.is_none() {
                    *guard = Some(FileIndex::for_root(&root)?);
                }
                let index = guard.as_mut().ok_or("index-unavailable")?;
                match apply(&root, index, dirty) {
                    Ok(()) => Ok(()),
                    Err(error) => {
                        if index.recover_if_corrupt()? {
                            rebuild(&root, index)
                        } else {
                            Err(error)
                        }
                    }
                }
            });
        drop(_gate);
        if result.is_ok() { if let Some(notify) = &on_update { notify(); } }
        retry = result.is_err();
        interval = if retry {
            (interval * 2).min(Duration::from_secs(30))
        } else {
            Duration::from_millis(250)
        };
        if let Err(error) = result {
            log::warn!("File index background update: {error}");
        }
    }
}
fn relative(root: &Path, path: &Path) -> Option<String> {
    let relative = path.strip_prefix(root).ok()?;
    if relative
        .components()
        .any(|part| !matches!(part, Component::Normal(_)))
    {
        return None;
    }
    let mut current = root.to_path_buf();
    for part in relative.components() {
        current.push(part);
        if fs::symlink_metadata(&current).is_ok_and(|m| m.file_type().is_symlink()) {
            return None;
        }
    }
    relative
        .components()
        .map(|part| part.as_os_str().to_str())
        .collect::<Option<Vec<_>>>()
        .map(|parts| parts.join("/"))
}
fn collect(
    root: &Path,
    dir: &Path,
    files: &mut Vec<String>,
    directories: &mut Vec<String>,
) -> Result<(), String> {
    for entry in fs::read_dir(dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        let metadata = fs::symlink_metadata(&path).map_err(|e| e.to_string())?;
        if metadata.file_type().is_symlink() {
            continue;
        }
        let Some(relative) = relative(root, &path) else {
            continue;
        };
        if metadata.is_dir() {
            directories.push(relative);
            collect(root, &path, files, directories)?;
        } else if metadata.is_file() {
            files.push(relative);
        }
    }
    Ok(())
}
pub(crate) fn rebuild(root: &Path, index: &mut FileIndex) -> Result<(), String> {
    let (mut files, mut directories) = (Vec::new(), Vec::new());
    collect(root, root, &mut files, &mut directories)?;
    index.reconcile_with_directories(root, &files, &directories)
}
fn apply(root: &Path, index: &mut FileIndex, dirty: Dirty) -> Result<(), String> {
    let full = dirty.rescan
        || dirty
            .paths
            .iter()
            .any(|p| p == root || p.is_dir() || relative(root, p).is_none());
    if full {
        return rebuild(root, index);
    }
    for path in dirty.paths {
        let Some(relative) = relative(root, &path) else {
            continue;
        };
        match fs::symlink_metadata(&path) {
            Ok(metadata) if metadata.is_file() => index.update(root, &relative)?,
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
                index.remove_path(&relative)?
            }
            Err(error) => return Err(error.to_string()),
            _ => {}
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    fn event(path: PathBuf) -> notify::Result<notify::Event> {
        Ok(notify::Event::new(EventKind::Modify(notify::event::ModifyKind::Any)).add_path(path))
    }
    fn index() -> SharedIndex {
        Arc::new(Mutex::new(Some(
            FileIndex::for_root(Path::new("test-root")).unwrap(),
        )))
    }
    fn wait_for(index: &SharedIndex, check: impl Fn(&FileIndex) -> bool) {
        let deadline = Instant::now() + Duration::from_secs(5);
        loop {
            if index.lock().unwrap().as_ref().is_some_and(&check) {
                return;
            }
            assert!(
                Instant::now() < deadline,
                "background index did not converge"
            );
            thread::sleep(Duration::from_millis(20));
        }
    }
    #[test]
    fn dirty_paths_are_coalesced_and_overflow_requests_rescan() {
        let mut dirty = Dirty::default();
        dirty.add(event(PathBuf::from("a")));
        dirty.add(event(PathBuf::from("a")));
        assert_eq!(dirty.paths.len(), 1);
        for n in 0..=CAPACITY {
            dirty.add(event(PathBuf::from(format!("p{n}"))));
        }
        assert!(dirty.rescan);
        dirty.add(Err(notify::Error::generic("overflow")));
        assert!(dirty.rescan);
    }
    #[test]
    fn queue_updates_without_workspace_refresh_and_stops() {
        let dir = tempfile::tempdir().unwrap();
        let root = dir.path().to_path_buf();
        fs::write(root.join("one.md"), "old").unwrap();
        let index: SharedIndex = Arc::new(Mutex::new(None));
        let (tx, rx) = mpsc::sync_channel(CAPACITY);
        let stop = Arc::new(AtomicBool::new(false));
        let overflow = Arc::new(AtomicBool::new(false));
        let handle = {
            let root = root.clone();
            let weak = Arc::downgrade(&index);
            let stop = stop.clone();
            let overflow = overflow.clone();
            thread::spawn(move || run(root, weak, rx, overflow, stop, Arc::new(Mutex::new(())), None))
        };
        wait_for(&index, |i| i.search("old").unwrap().len() == 1);
        fs::write(root.join("one.md"), "new").unwrap();
        for _ in 0..10 {
            tx.send(event(root.join("one.md"))).unwrap();
        }
        wait_for(&index, |i| i.search("new").unwrap().len() == 1);
        fs::create_dir(root.join("folder")).unwrap();
        fs::write(root.join("folder/two.md"), "nested").unwrap();
        // An overflow forces reconciliation even when the individual event was lost.
        overflow.store(true, Ordering::Release);
        wait_for(&index, |i| i.search("nested").unwrap().len() == 1);
        fs::remove_dir_all(root.join("folder")).unwrap();
        tx.send(event(root.join("folder"))).unwrap();
        wait_for(&index, |i| i.search("nested").unwrap().is_empty());
        fs::remove_file(root.join("one.md")).unwrap();
        tx.send(event(root.join("one.md"))).unwrap();
        wait_for(&index, |i| {
            i.page(None, None, 100).unwrap().files.is_empty()
        });
        stop.store(true, Ordering::Release);
        handle.join().unwrap();
        fs::write(root.join("after.md"), "after").unwrap();
        assert!(tx.send(event(root.join("after.md"))).is_err());
        assert!(index
            .lock()
            .unwrap()
            .as_ref()
            .unwrap()
            .page(None, None, 100)
            .unwrap()
            .files
            .is_empty());
    }
    #[test]
    fn host_move_gate_preserves_identity_before_queued_events_run() {
        let dir = tempfile::tempdir().unwrap();
        let root = dir.path().to_path_buf();
        fs::write(root.join("before.md"), "body").unwrap();
        let index = index();
        index
            .lock()
            .unwrap()
            .as_mut()
            .unwrap()
            .reconcile_with_directories(&root, &["before.md".into()], &[])
            .unwrap();
        let id = index
            .lock()
            .unwrap()
            .as_ref()
            .unwrap()
            .page(None, None, 100)
            .unwrap()
            .files[0]
            .id
            .clone();
        let gate = Arc::new(Mutex::new(()));
        let guard = gate.lock().unwrap();
        let stop = Arc::new(AtomicBool::new(false));
        let (tx, rx) = mpsc::sync_channel(CAPACITY);
        let handle = {
            let root = root.clone();
            let weak = Arc::downgrade(&index);
            let stop = stop.clone();
            let gate = gate.clone();
            thread::spawn(move || run(root, weak, rx, Arc::new(AtomicBool::new(false)), stop, gate, None))
        };
        fs::rename(root.join("before.md"), root.join("after.md")).unwrap();
        tx.send(event(root.join("before.md"))).unwrap();
        tx.send(event(root.join("after.md"))).unwrap();
        thread::sleep(Duration::from_millis(300));
        assert_eq!(
            index
                .lock()
                .unwrap()
                .as_ref()
                .unwrap()
                .page(None, None, 100)
                .unwrap()
                .files[0]
                .path,
            "before.md"
        );
        index
            .lock()
            .unwrap()
            .as_mut()
            .unwrap()
            .moved("before.md", "after.md")
            .unwrap();
        drop(guard);
        wait_for(&index, |i| i.search("after.md").unwrap().len() == 1);
        stop.store(true, Ordering::Release);
        handle.join().unwrap();
        assert_eq!(
            index
                .lock()
                .unwrap()
                .as_ref()
                .unwrap()
                .page(None, None, 100)
                .unwrap()
                .files[0]
                .id,
            id
        );
    }
    #[test]
    #[cfg(unix)]
    fn does_not_follow_symlink_outside_root() {
        let dir = tempfile::tempdir().unwrap();
        let outside = tempfile::tempdir().unwrap();
        fs::write(outside.path().join("secret.md"), "secret").unwrap();
        std::os::unix::fs::symlink(outside.path(), dir.path().join("linked")).unwrap();
        assert!(relative(dir.path(), &dir.path().join("linked/secret.md")).is_none());
        let index = index();
        apply(
            dir.path(),
            index.lock().unwrap().as_mut().unwrap(),
            Dirty {
                rescan: true,
                ..Default::default()
            },
        )
        .unwrap();
        assert!(index
            .lock()
            .unwrap()
            .as_ref()
            .unwrap()
            .page(None, None, 100)
            .unwrap()
            .files
            .is_empty());
    }
    #[test]
    fn deferred_index_initializes_and_notifies_without_a_preopened_catalog() {
        let dir = tempfile::tempdir().unwrap();
        let root = dir.path().canonicalize().unwrap();
        fs::write(root.join("note.md"), "deferred content").unwrap();
        let index = Arc::new(Mutex::new(None));
        let (tx, rx) = mpsc::channel();
        let worker = IndexWorker::start_notifying(root, Arc::clone(&index), Arc::new(Mutex::new(())), Some(Box::new(move || { let _ = tx.send(()); }))).unwrap();
        rx.recv_timeout(Duration::from_secs(5)).expect("background catalog did not publish completion");
        assert_eq!(index.lock().unwrap().as_ref().unwrap().search("deferred").unwrap().len(), 1);
        drop(worker);
    }
    #[test]
    #[ignore = "requires native filesystem notification access"]
    fn native_watcher_indexes_external_edits() {
        let dir = tempfile::tempdir().unwrap();
        let root = dir.path().canonicalize().unwrap();
        let cache = tempfile::tempdir().unwrap();
        let index = Arc::new(Mutex::new(Some(
            FileIndex::persistent(cache.path(), &root).unwrap(),
        )));
        let worker =
            IndexWorker::start(root.clone(), index.clone(), Arc::new(Mutex::new(()))).unwrap();
        fs::write(root.join("native.md"), "initial").unwrap();
        wait_for(&index, |i| i.search("initial").unwrap().len() == 1);
        // Wait beyond startup reconciliation so this edit requires a native event.
        thread::sleep(Duration::from_millis(400));
        fs::write(root.join("native.md"), "changed").unwrap();
        wait_for(&index, |i| i.search("changed").unwrap().len() == 1);
        fs::remove_file(root.join("native.md")).unwrap();
        wait_for(&index, |i| {
            i.page(None, None, 100).unwrap().files.is_empty()
        });
        drop(worker);
    }
}

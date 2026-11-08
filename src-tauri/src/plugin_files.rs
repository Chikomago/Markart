use notify::{event::{ModifyKind, RenameMode}, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, fs, path::{Path, PathBuf}, sync::{Arc, Mutex, mpsc}, thread, time::{Duration, Instant}};
use tauri::{Emitter, Manager};

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
pub struct FileWatchEvent {
    kind: &'static str,
    paths: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")] message: Option<String>,
}
#[derive(Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WatchOptions { recursive: Option<bool>, debounce_ms: Option<u64> }
enum Message { Event(notify::Result<notify::Event>), Stop }
struct Registration { owner: String, _watcher: RecommendedWatcher, stop: mpsc::Sender<Message> }
type Registrations = Arc<Mutex<HashMap<String, Registration>>>;
#[derive(Default)]
pub struct PluginWatchState { registrations: Registrations }

fn normalized(result: notify::Result<notify::Event>, root: &Path) -> Option<FileWatchEvent> {
    match result {
        Err(error) => Some(FileWatchEvent { kind: "error", paths: vec![root.to_string_lossy().into_owned()], message: Some(error.to_string()) }),
        Ok(event) => {
            let kind = if event.need_rescan() { "rescan" } else { match event.kind {
                EventKind::Access(_) => return None,
                EventKind::Create(_) => "create", EventKind::Remove(_) => "remove",
                EventKind::Modify(ModifyKind::Name(RenameMode::Both)) if event.paths.len() == 2 => "rename",
                EventKind::Modify(ModifyKind::Name(RenameMode::From)) => "remove",
                EventKind::Modify(ModifyKind::Name(RenameMode::To)) => "create",
                EventKind::Modify(ModifyKind::Name(_)) | EventKind::Other | EventKind::Any => "rescan",
                EventKind::Modify(_) => "modify",
            }};
            let paths = if kind == "rescan" || event.paths.is_empty() { vec![root.to_string_lossy().into_owned()] }
                else { event.paths.iter().map(|path| path.to_string_lossy().into_owned()).collect() };
            Some(FileWatchEvent { kind, paths, message: None })
        }
    }
}

impl PluginWatchState {
    fn start(&self, id: String, owner: String, path: PathBuf, options: WatchOptions,
        deliver: impl Fn(Vec<FileWatchEvent>) -> bool + Send + 'static) -> Result<(), String> {
        if id.is_empty() || id.len() > 128 || !id.bytes().all(|b| b.is_ascii_alphanumeric() || b == b'-' || b == b'_') { return Err("文件监听 ID 无效".into()); }
        if !path.is_absolute() { return Err("监听路径需要使用绝对路径".into()); }
        let path = path.canonicalize().map_err(|e| format!("无法监听路径：{e}"))?;
        let debounce = options.debounce_ms.unwrap_or(200);
        if debounce > 5000 { return Err("文件监听 debounceMs 需为 0～5000 毫秒".into()); }
        let (tx, rx) = mpsc::channel();
        let events = tx.clone();
        let mut watcher = notify::recommended_watcher(move |event| { let _ = events.send(Message::Event(event)); }).map_err(|e| e.to_string())?;
        watcher.watch(&path, if options.recursive.unwrap_or(true) { RecursiveMode::Recursive } else { RecursiveMode::NonRecursive }).map_err(|e| e.to_string())?;
        {
            let mut map = self.registrations.lock().map_err(|e| e.to_string())?;
            if map.contains_key(&id) { return Err("文件监听 ID 重复".into()); }
            map.insert(id.clone(), Registration { owner, _watcher: watcher, stop: tx });
        }
        let weak = Arc::downgrade(&self.registrations); let worker_id = id.clone();
        let spawned = thread::Builder::new().name("plugin-file-watch".into()).spawn(move || {
            let mut batch = Vec::new();
            'worker: loop {
                let first = match rx.recv() { Ok(Message::Event(event)) => event, _ => break };
                if let Some(event) = normalized(first, &path) { batch.push(event); } else { continue; }
                let deadline = Instant::now() + Duration::from_millis(debounce);
                while batch.len() < 512 && Instant::now() < deadline {
                    match rx.recv_timeout(deadline.saturating_duration_since(Instant::now())) {
                        Ok(Message::Stop) | Err(mpsc::RecvTimeoutError::Disconnected) => break 'worker,
                        Err(mpsc::RecvTimeoutError::Timeout) => break,
                        Ok(Message::Event(event)) => { if let Some(event) = normalized(event, &path) { if !batch.contains(&event) { batch.push(event); } } }
                    }
                }
                if !deliver(std::mem::take(&mut batch)) { break; }
            }
            if let Some(map) = weak.upgrade() { if let Ok(mut map) = map.lock() { map.remove(&worker_id); } }
        });
        if let Err(error) = spawned { self.stop(&id, None)?; return Err(error.to_string()); }
        Ok(())
    }
    fn stop(&self, id: &str, owner: Option<&str>) -> Result<(), String> {
        let removed = {
            let mut map = self.registrations.lock().map_err(|e| e.to_string())?;
            if let Some(registration) = map.get(id) { if owner.is_some_and(|owner| owner != registration.owner) { return Err("文件监听不属于当前窗口".into()); } }
            map.remove(id)
        };
        if let Some(registration) = removed { let _ = registration.stop.send(Message::Stop); drop(registration); }
        Ok(())
    }
    pub fn stop_owner(&self, owner: &str) {
        let ids: Vec<String> = self.registrations.lock().map(|map| map.iter().filter(|(_,value)| value.owner == owner).map(|(id,_)| id.clone()).collect()).unwrap_or_default();
        for id in ids { let _ = self.stop(&id, Some(owner)); }
    }
}
fn data_directory(root: &Path, plugin_id: &str) -> Result<PathBuf, String> {
    if !plugin_id.contains(['.', '-']) || plugin_id.split(['.', '-']).any(|part| part.is_empty() || !part.bytes().all(|b| b.is_ascii_lowercase() || b.is_ascii_digit())) { return Err("插件 ID 无效".into()); }
    fs::create_dir_all(root).map_err(|e| e.to_string())?;
    let root = root.canonicalize().map_err(|e| e.to_string())?;
    let path = root.join(plugin_id);
    fs::create_dir_all(&path).map_err(|e| e.to_string())?;
    let path = path.canonicalize().map_err(|e| e.to_string())?;
    if path.parent() != Some(root.as_path()) { return Err("插件数据目录不能指向其他位置".into()); }
    Ok(path)
}
#[tauri::command]
pub async fn plugin_data_directory(app: tauri::AppHandle, plugin_id: String) -> Result<String, String> {
    let root = app.path().app_data_dir().map_err(|e| e.to_string())?.join("plugin-data");
    tauri::async_runtime::spawn_blocking(move || data_directory(&root, &plugin_id).map(|path| path.to_string_lossy().into_owned())).await.map_err(|e| e.to_string())?
}
#[tauri::command]
pub fn plugin_watch_start(window: tauri::WebviewWindow, state: tauri::State<'_, PluginWatchState>, id: String, path: String, options: WatchOptions) -> Result<(), String> {
    let topic = format!("markart-plugin-files:{id}"); let owner = window.label().to_owned();
    state.start(id, owner, PathBuf::from(path), options, move |events| window.emit_to(window.label(), &topic, events).is_ok())
}
#[tauri::command]
pub fn plugin_watch_stop(window: tauri::WebviewWindow, state: tauri::State<'_, PluginWatchState>, id: String) -> Result<(), String> {
    state.stop(&id, Some(window.label()))
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn data_directories_are_stable_separate_and_do_not_escape() {
        let temp = tempfile::tempdir().unwrap();
        let first = data_directory(temp.path(), "test.one").unwrap();
        fs::write(first.join("index.db"), "kept").unwrap();
        assert_eq!(first, data_directory(temp.path(), "test.one").unwrap());
        assert_eq!(fs::read_to_string(first.join("index.db")).unwrap(), "kept");
        assert_ne!(first, data_directory(temp.path(), "test.two").unwrap());
        for id in ["../outside", "test..one", "test/one", "plain", "Test.one"] { assert!(data_directory(temp.path(), id).is_err()); }
    }
    #[test]
    fn normalizes_rename_pairs_and_rescan_without_read_events() {
        let root = Path::new("/test");
        let event = notify::Event::new(EventKind::Modify(ModifyKind::Name(RenameMode::Both))).add_path(root.join("old.md")).add_path(root.join("new.md"));
        let result = normalized(Ok(event), root).unwrap(); assert_eq!(result.kind,"rename"); assert_eq!(result.paths,vec!["/test/old.md","/test/new.md"]);
        assert!(normalized(Ok(notify::Event::new(EventKind::Access(notify::event::AccessKind::Any))),root).is_none());
        assert_eq!(normalized(Ok(notify::Event::new(EventKind::Any)),root).unwrap().kind,"rescan");
    }
    fn wait_for(rx: &mpsc::Receiver<Vec<FileWatchEvent>>, check: impl Fn(&FileWatchEvent) -> bool) {
        let deadline=Instant::now()+Duration::from_secs(8);
        loop { let events=rx.recv_timeout(deadline.saturating_duration_since(Instant::now())) .expect("filesystem change not delivered"); if events.iter().any(&check) { return; } }
    }
    #[test]
    fn watches_nested_create_modify_rename_remove_and_stops() {
        let temp=tempfile::tempdir().unwrap(); let root=temp.path().canonicalize().unwrap(); fs::create_dir(root.join("nested")).unwrap();
        let state=PluginWatchState::default(); let (tx,rx)=mpsc::channel();
        state.start("test-watch".into(),"window".into(),root.clone(),WatchOptions {recursive:Some(true),debounce_ms:Some(30)},move |events|tx.send(events).is_ok()).unwrap();
        let original=root.join("nested/a.md");let renamed=root.join("nested/b.md");
        fs::write(&original,"first").unwrap();wait_for(&rx,|e|e.kind=="rescan"||e.paths.contains(&original.to_string_lossy().into_owned()));
        fs::write(&original,"second").unwrap();wait_for(&rx,|e|e.kind=="rescan"||e.kind=="modify"&&e.paths.contains(&original.to_string_lossy().into_owned()));
        fs::rename(&original,&renamed).unwrap();wait_for(&rx,|e|e.kind=="rescan"||e.paths.iter().any(|p|p==&renamed.to_string_lossy()||p==&original.to_string_lossy()));
        fs::remove_file(&renamed).unwrap();wait_for(&rx,|e|e.kind=="rescan"||e.kind=="remove"&&e.paths.contains(&renamed.to_string_lossy().into_owned()));
        assert!(state.stop("test-watch",Some("another-window")).is_err());
        state.stop("test-watch",Some("window")).unwrap();state.stop("test-watch",Some("window")).unwrap();
        assert!(state.registrations.lock().unwrap().is_empty());
    }
    #[test]
    fn window_close_releases_watches() {
        let temp=tempfile::tempdir().unwrap();let state=PluginWatchState::default();
        state.start("first".into(),"window-one".into(),temp.path().to_owned(),WatchOptions::default(),|_|true).unwrap();
        state.start("second".into(),"window-two".into(),temp.path().to_owned(),WatchOptions::default(),|_|true).unwrap();
        state.stop_owner("window-one");assert_eq!(state.registrations.lock().unwrap().len(),1);
        state.stop_owner("window-two");assert!(state.registrations.lock().unwrap().is_empty());
    }
}

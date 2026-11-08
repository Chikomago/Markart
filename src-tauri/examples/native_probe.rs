//! Standalone, non-production probe. Run `cargo test --example native_probe` or
//! `cargo run --example native_probe` from src-tauri.
use std::fs;

use tauri_plugin_dialog::DialogExt;

#[cfg(test)]
fn guarded_replace(
    path: &std::path::Path,
    expected: &[u8],
    replacement: &[u8],
) -> std::io::Result<()> {
    use std::fs::File;
    use std::io::{Read, Write};
    let mut before = Vec::new();
    File::open(path)?.read_to_end(&mut before)?;
    if before != expected {
        return Err(std::io::Error::new(
            std::io::ErrorKind::AlreadyExists,
            "disk version changed",
        ));
    }

    let parent = path
        .parent()
        .ok_or_else(|| std::io::Error::other("no parent directory"))?;
    let mut staged = tempfile::NamedTempFile::new_in(parent)?;
    staged.write_all(replacement)?;
    staged.as_file().sync_all()?;
    fs::rename(staged.path(), path)?;
    File::open(parent)?.sync_all()?;
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            app.dialog().file().pick_folder(|selected| {
                match selected.and_then(|value| value.into_path().ok()) {
                    Some(path) => match fs::read_dir(&path) {
                        Ok(entries) => {
                            println!("SELECTED_DIRECTORY={}", path.display());
                            println!("ENTRY_COUNT={}", entries.count());
                        }
                        Err(error) => eprintln!("DIRECTORY_READ_ERROR={error}"),
                    },
                    None => println!("DIRECTORY_SELECTION_CANCELLED"),
                }
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("native probe failed");
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;
    use std::sync::mpsc;
    use std::time::Duration;

    #[test]
    fn same_directory_staging_replaces_exact_file_and_detects_stale_version() {
        let dir = tempfile::tempdir().unwrap();
        let target = dir.path().join("文件.md");
        fs::write(&target, b"original\r\n").unwrap();
        guarded_replace(&target, b"original\r\n", b"edited\r\n").unwrap();
        assert_eq!(fs::read(&target).unwrap(), b"edited\r\n");
        let error = guarded_replace(&target, b"original\r\n", b"stale write").unwrap_err();
        assert_eq!(error.kind(), std::io::ErrorKind::AlreadyExists);
        assert_eq!(fs::read(&target).unwrap(), b"edited\r\n");
    }

    #[test]
    fn directory_watcher_observes_external_replacement() {
        let dir = tempfile::tempdir().unwrap();
        let target = dir.path().join("watched.md");
        fs::write(&target, b"before").unwrap();
        let mut staged = tempfile::NamedTempFile::new_in(dir.path()).unwrap();
        staged.write_all(b"after").unwrap();
        staged.as_file().sync_all().unwrap();
        let (tx, rx) = mpsc::channel();
        let watched = dir.path().to_path_buf();
        let watcher = std::thread::spawn(move || {
            use std::ffi::CString;
            use std::os::unix::ffi::OsStrExt;
            let path = CString::new(watched.as_os_str().as_bytes()).unwrap();
            unsafe {
                let fd = libc::open(path.as_ptr(), libc::O_EVTONLY);
                assert!(fd >= 0);
                let queue = libc::kqueue();
                assert!(queue >= 0);
                let change = libc::kevent {
                    ident: fd as usize,
                    filter: libc::EVFILT_VNODE,
                    flags: libc::EV_ADD | libc::EV_ENABLE,
                    fflags: libc::NOTE_WRITE | libc::NOTE_RENAME | libc::NOTE_DELETE,
                    data: 0,
                    udata: std::ptr::null_mut(),
                };
                assert_eq!(
                    libc::kevent(queue, &change, 1, std::ptr::null_mut(), 0, std::ptr::null()),
                    0
                );
                tx.send(()).unwrap();
                let mut event: libc::kevent = std::mem::zeroed();
                let timeout = libc::timespec {
                    tv_sec: 10,
                    tv_nsec: 0,
                };
                let count = libc::kevent(queue, std::ptr::null(), 0, &mut event, 1, &timeout);
                libc::close(queue);
                libc::close(fd);
                count > 0
            }
        });
        rx.recv_timeout(Duration::from_secs(2)).unwrap();
        fs::rename(staged.path(), &target).unwrap();
        assert!(
            watcher.join().unwrap(),
            "watcher did not report directory change"
        );
        assert_eq!(fs::read(&target).unwrap(), b"after");
    }
}

use std::{fs, io::Write, path::Path, sync::{atomic::{AtomicBool, Ordering}, Mutex}, time::Duration};
use tauri::{AppHandle, Emitter, Manager, WebviewUrl, WebviewWindow, WebviewWindowBuilder};
use tauri::tray::{TrayIcon, TrayIconBuilder};
use tauri::menu::{Menu, MenuItem};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};
use tauri_plugin_dialog::DialogExt;

const CAPTURE: &str = "quick-capture";

#[derive(Default)]
pub struct QuickCaptureState {
    pub enabled: AtomicBool,
    tray: Mutex<Option<TrayIcon>>,
    shortcut: Mutex<Option<String>>,
    corner: Mutex<String>,
    corner_monitor_started: AtomicBool,
}

fn configured(app: &AppHandle, label: &str, query: &str) -> Result<tauri::utils::config::WindowConfig, String> {
    let mut config = app.config().app.windows.first().cloned().unwrap_or_default();
    config.label = label.into();
    config.url = WebviewUrl::App(format!("index.html?{query}").into());
    config.title = String::new();
    config.maximized = false;
    config.fullscreen = false;
    config.visible = true;
    config.devtools = Some(false);
    Ok(config)
}

pub fn open(app: &AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(CAPTURE) {
        window.show().and_then(|_| window.set_focus()).map_err(|error| error.to_string())?;
        return Ok(());
    }
    let mut config = configured(app, CAPTURE, "quickCapture=1")?;
    config.visible = false;
    config.title = "未命名".into();
    #[cfg(target_os = "macos")]
    { config.hidden_title = false; }
    config.width = 680.; config.height = 560.; config.min_width = Some(420.); config.min_height = Some(360.);
    config.center = true; config.resizable = true; config.skip_taskbar = false;
    let window = WebviewWindowBuilder::from_config(app, &config).map_err(|error| error.to_string())?.build().map_err(|error| error.to_string())?;
    #[cfg(target_os = "macos")]
    native_document::attach(&window)?;
    Ok(())
}

#[tauri::command]
pub fn open_quick_capture(app: AppHandle) -> Result<(), String> { open(&app) }

#[tauri::command]
pub fn set_quick_capture_native_content(window: WebviewWindow, content: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    { return native_document::set_content(&window, content); }
    #[cfg(not(target_os = "macos"))]
    { let _ = (window, content); Ok(()) }
}

#[tauri::command]
pub fn set_quick_capture_appearance(window: WebviewWindow, dark: bool, accent: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    { return native_document::set_appearance(&window, dark, accent); }
    #[cfg(not(target_os = "macos"))]
    { let _ = (window, dark, accent); Ok(()) }
}

#[tauri::command]
pub fn set_quick_capture_native_path(window: WebviewWindow, path: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    { return native_document::set_path(&window, path); }
    #[cfg(not(target_os = "macos"))]
    { let _ = (window, path); Ok(()) }
}

#[tauri::command]
pub fn quick_capture_native_status(window: WebviewWindow) -> Result<(Option<String>, bool, bool), String> {
    #[cfg(target_os = "macos")]
    { let (path, edited) = native_document::status(&window)?; let exists = path.as_ref().is_some_and(|path| Path::new(path).exists()); return Ok((path, edited, exists)); }
    #[cfg(not(target_os = "macos"))]
    { let _ = window; Ok((None, false, false)) }
}

#[cfg(target_os = "macos")]
pub fn detach_native_document(app: &AppHandle, label: &str) {
    if label == CAPTURE { native_document::detach(app); }
}

#[cfg(target_os = "macos")]
mod native_document {
    use super::*;
    use std::ffi::{CStr, CString};
    use std::os::raw::{c_char, c_void};
    unsafe extern "C" {
        fn markart_quick_document_attach(window: *mut c_void);
        fn markart_quick_document_set_content(content: *const c_char);
        fn markart_quick_document_set_dark_appearance(window: *mut c_void, dark: bool, accent: *const c_char);
        fn markart_quick_document_set_path(path: *const c_char);
        fn markart_quick_document_copy_path() -> *mut c_char;
        fn markart_quick_document_free_path(path: *mut c_char);
        fn markart_quick_document_is_edited() -> bool;
        fn markart_quick_document_detach();
    }
    pub fn attach(window: &WebviewWindow) -> Result<(), String> {
        let pointer = window.ns_window().map_err(|error| error.to_string())? as usize;
        window.run_on_main_thread(move || unsafe { markart_quick_document_attach(pointer as *mut c_void) }).map_err(|error| error.to_string())
    }
    pub fn set_content(window: &WebviewWindow, content: String) -> Result<(), String> {
        let content = CString::new(content).map_err(|_| "文档包含不支持的空字符".to_string())?;
        window.run_on_main_thread(move || unsafe { markart_quick_document_set_content(content.as_ptr()) }).map_err(|error| error.to_string())
    }
    pub fn set_appearance(window: &WebviewWindow, dark: bool, accent: String) -> Result<(), String> {
        let pointer = window.ns_window().map_err(|error| error.to_string())? as usize;
        let accent = CString::new(accent).map_err(|_| "主题颜色无效".to_string())?;
        window.run_on_main_thread(move || unsafe { markart_quick_document_set_dark_appearance(pointer as *mut c_void, dark, accent.as_ptr()) }).map_err(|error| error.to_string())
    }
    pub fn set_path(window: &WebviewWindow, path: String) -> Result<(), String> {
        let path = CString::new(path).map_err(|_| "文件路径包含空字符".to_string())?;
        window.run_on_main_thread(move || unsafe { markart_quick_document_set_path(path.as_ptr()) }).map_err(|error| error.to_string())
    }
    pub fn status(window: &WebviewWindow) -> Result<(Option<String>, bool), String> {
        let (sender, receiver) = std::sync::mpsc::sync_channel(1);
        window.run_on_main_thread(move || {
            let result = unsafe {
                let pointer = markart_quick_document_copy_path();
                let path = if pointer.is_null() { None } else {
                    let value = CStr::from_ptr(pointer).to_string_lossy().into_owned();
                    markart_quick_document_free_path(pointer);
                    Some(value)
                };
                (path, markart_quick_document_is_edited())
            };
            let _ = sender.send(result);
        }).map_err(|error| error.to_string())?;
        receiver.recv().map_err(|error| error.to_string())
    }
    pub fn detach(app: &AppHandle) {
        let _ = app.run_on_main_thread(|| unsafe { markart_quick_document_detach() });
    }
}

#[tauri::command]
pub async fn open_saved_quick_capture(app: AppHandle, path: String) -> Result<(), String> {
    let target = Path::new(&path);
    if !target.is_file() { return Err("保存的文件已不可用".into()); }
    let windows = app.webview_windows();
    let workspace = |label: &str| label == "main" || label.starts_with("markart-");
    let existing = windows.values().filter(|window| workspace(window.label()))
        .find(|window| window.is_focused().unwrap_or(false))
        .or_else(|| windows.get("main"))
        .or_else(|| windows.values().find(|window| workspace(window.label())));
    if let Some(window) = existing {
        window.show().and_then(|_| window.set_focus()).map_err(|error| error.to_string())?;
        window.emit("markart-open-quick-capture-document", path).map_err(|error| error.to_string())?;
        return Ok(());
    }
    let root = target.parent().ok_or("保存位置不可用")?.to_string_lossy().into_owned();
    let filename = target.file_name().ok_or("文件名不可用")?.to_string_lossy().into_owned();
    crate::windows::create_workspace_window(app, Some(root), Some(filename)).await.map(|_| ())
}

fn start_corner_monitor(app: &AppHandle) {
    let state = app.state::<QuickCaptureState>();
    if state.corner_monitor_started.swap(true, Ordering::SeqCst) { return; }
    let app = app.clone();
    std::thread::spawn(move || {
        let mut was_inside = false;
        loop {
            std::thread::sleep(Duration::from_millis(80));
            let state = app.state::<QuickCaptureState>();
            if !state.enabled.load(Ordering::SeqCst) { was_inside = false; continue; }
            let corner = match state.corner.lock() { Ok(corner) => corner.clone(), Err(_) => continue };
            let inside = app.primary_monitor().ok().flatten().and_then(|monitor| {
                let cursor = app.cursor_position().ok()?;
                let position = monitor.position(); let size = monitor.size();
                let edge = 16. * monitor.scale_factor();
                let left = position.x as f64; let top = position.y as f64;
                let right = left + size.width as f64; let bottom = top + size.height as f64;
                Some(match corner.as_str() {
                    "top-left" => cursor.x >= left && cursor.x < left + edge && cursor.y >= top && cursor.y < top + edge,
                    "bottom-left" => cursor.x >= left && cursor.x < left + edge && cursor.y >= bottom - edge && cursor.y < bottom,
                    "bottom-right" => cursor.x >= right - edge && cursor.x < right && cursor.y >= bottom - edge && cursor.y < bottom,
                    _ => cursor.x >= right - edge && cursor.x < right && cursor.y >= top && cursor.y < top + edge,
                })
            }).unwrap_or(false);
            if inside && !was_inside {
                let handle = app.clone();
                let _ = app.run_on_main_thread(move || { let _ = open(&handle); });
            }
            was_inside = inside;
        }
    });
}

pub(crate) fn open_main(app: &AppHandle) {
    if let Some(window) = app.webview_windows().values().find(|window| window.label() != CAPTURE) {
        let _ = window.show(); let _ = window.set_focus(); return;
    }
    let mut config = match configured(app, "main", "newWindow=1") { Ok(config) => config, Err(_) => return };
    config.width = 1200.; config.height = 800.; config.center = true;
    let _ = WebviewWindowBuilder::from_config(app, &config).and_then(|builder| builder.build());
}

#[tauri::command]
pub fn set_quick_capture(app: AppHandle, enabled: bool, corner: String, shortcut: String) -> Result<(), String> {
    if !matches!(corner.as_str(), "top-left" | "top-right" | "bottom-left" | "bottom-right") { return Err("触发区位置无效".into()); }
    let state = app.state::<QuickCaptureState>();
    if enabled {
        *state.corner.lock().map_err(|error| error.to_string())? = corner;
        let mut registered = state.shortcut.lock().map_err(|error| error.to_string())?;
        if registered.as_deref() != Some(shortcut.as_str()) {
            if let Some(previous) = registered.take() { let _ = app.global_shortcut().unregister(previous.as_str()); }
            if !shortcut.is_empty() { app.global_shortcut().on_shortcut(shortcut.as_str(), |app, _, event| {
                if event.state == ShortcutState::Pressed { let _ = open(app); }
            }).map_err(|error| format!("快捷键不可用：{error}"))?; *registered = Some(shortcut); }
        }
        drop(registered);
        if state.tray.lock().map_err(|error| error.to_string())?.is_none() {
            let quick = MenuItem::with_id(&app, "quick-open", "快速记录", true, None::<&str>).map_err(|error| error.to_string())?;
            let main = MenuItem::with_id(&app, "quick-main", "打开 Markart", true, None::<&str>).map_err(|error| error.to_string())?;
            let quit = MenuItem::with_id(&app, "quick-quit", "退出 Markart", true, None::<&str>).map_err(|error| error.to_string())?;
            let menu = Menu::with_items(&app, &[&quick, &main, &quit]).map_err(|error| error.to_string())?;
            let mut builder = TrayIconBuilder::new().menu(&menu).tooltip("Markart 快速记录").on_menu_event(|app, event| match event.id().as_ref() {
                "quick-open" => { let _ = open(app); },
                "quick-main" => open_main(app),
                "quick-quit" => { app.state::<QuickCaptureState>().enabled.store(false, Ordering::SeqCst); app.exit(0); },
                _ => {}
            });
            if let Some(icon) = app.default_window_icon() { builder = builder.icon(icon.clone()); }
            let tray = builder.build(&app).map_err(|error| error.to_string())?;
            *state.tray.lock().map_err(|error| error.to_string())? = Some(tray);
        }
        state.enabled.store(true, Ordering::SeqCst);
        start_corner_monitor(&app);
    } else {
        state.enabled.store(false, Ordering::SeqCst);
        if let Some(previous) = state.shortcut.lock().map_err(|error| error.to_string())?.take() { let _ = app.global_shortcut().unregister(previous.as_str()); }
        state.tray.lock().map_err(|error| error.to_string())?.take();
    }
    Ok(())
}

#[tauri::command]
pub fn save_quick_capture(directory: String, filename: String, content: String) -> Result<String, String> {
    if content.trim().is_empty() { return Err("内容为空，请先写下记录".into()); }
    if content.len() > 20_000_000 { return Err("内容过长，请拆分后保存".into()); }
    let name = filename.trim();
    if name.is_empty() || name == "." || name == ".." || name.contains('/') || name.contains('\\') || !name.to_ascii_lowercase().ends_with(".md") {
        return Err("文件名须以 .md 结尾，且不能包含路径符号".into());
    }
    let dir = fs::canonicalize(&directory).map_err(|_| "保存位置不可用，请重新选择文件夹".to_string())?;
    if !dir.is_dir() { return Err("保存位置不是文件夹，请重新选择".into()); }
    let target = dir.join(name);
    if target.exists() { return Err("已有同名文件，请修改文件名".into()); }
    let mut staged = tempfile::NamedTempFile::new_in(&dir).map_err(|error| error.to_string())?;
    staged.write_all(content.as_bytes()).and_then(|_| staged.as_file().sync_all()).map_err(|error| error.to_string())?;
    staged.persist_noclobber(&target).map_err(|error| error.error.to_string())?;
    let _ = fs::File::open(Path::new(&dir)).and_then(|file| file.sync_all());
    Ok(target.to_string_lossy().into_owned())
}

#[tauri::command]
pub fn update_quick_capture(path: String, content: String) -> Result<(), String> {
    if content.trim().is_empty() { return Err("内容为空，请先写下记录".into()); }
    if content.len() > 20_000_000 { return Err("内容过长，请拆分后保存".into()); }
    let target = Path::new(&path);
    if !target.is_file() || !target.extension().is_some_and(|extension| extension.eq_ignore_ascii_case("md")) {
        return Err("原文件不可用，请重新选择保存位置".into());
    }
    let directory = target.parent().ok_or("保存位置不可用")?;
    let mut staged = tempfile::NamedTempFile::new_in(directory).map_err(|error| error.to_string())?;
    #[cfg(target_os = "macos")]
    {
        use std::{ffi::CString, os::unix::ffi::OsStrExt};
        unsafe extern "C" { fn copyfile(from: *const std::os::raw::c_char, to: *const std::os::raw::c_char, state: *mut std::ffi::c_void, flags: u32) -> i32; }
        let from = CString::new(target.as_os_str().as_bytes()).map_err(|error| error.to_string())?;
        let to = CString::new(staged.path().as_os_str().as_bytes()).map_err(|error| error.to_string())?;
        if unsafe { copyfile(from.as_ptr(), to.as_ptr(), std::ptr::null_mut(), 1 << 2) } != 0 {
            return Err(format!("保留文件标签失败：{}", std::io::Error::last_os_error()));
        }
    }
    staged.write_all(content.as_bytes()).and_then(|_| staged.as_file().sync_all()).map_err(|error| error.to_string())?;
    staged.persist(target).map_err(|error| error.error.to_string())?;
    let _ = fs::File::open(directory).and_then(|file| file.sync_all());
    Ok(())
}

#[tauri::command]
pub async fn save_quick_capture_as(app: AppHandle, filename: String, content: String) -> Result<Option<String>, String> {
    if content.trim().is_empty() { return Err("内容为空，请先写下记录".into()); }
    if content.len() > 20_000_000 { return Err("内容过长，请拆分后保存".into()); }
    tauri::async_runtime::spawn_blocking(move || {
        let selected = app.dialog().file()
            .set_title("保存快速记录")
            .set_file_name(&filename)
            .add_filter("Markdown", &["md"])
            .blocking_save_file();
        let Some(selected) = selected else { return Ok(None) };
        let mut target = selected.into_path().map_err(|error| error.to_string())?;
        if !target.extension().is_some_and(|extension| extension.eq_ignore_ascii_case("md")) { target.set_extension("md"); }
        let directory = target.parent().ok_or("保存位置不可用")?;
        let mut staged = tempfile::NamedTempFile::new_in(directory).map_err(|error| error.to_string())?;
        staged.write_all(content.as_bytes()).and_then(|_| staged.as_file().sync_all()).map_err(|error| error.to_string())?;
        staged.persist(&target).map_err(|error| error.error.to_string())?;
        let _ = fs::File::open(directory).and_then(|file| file.sync_all());
        Ok(Some(target.to_string_lossy().into_owned()))
    }).await.map_err(|error| error.to_string())?
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn saves_markdown_without_overwriting_or_escaping_directory() {
        let directory = tempfile::tempdir().unwrap();
        let root = directory.path().to_string_lossy().to_string();
        let path = save_quick_capture(root.clone(), "记录.md".into(), "# 内容".into()).unwrap();
        assert_eq!(fs::read_to_string(path).unwrap(), "# 内容");
        assert!(save_quick_capture(root.clone(), "记录.md".into(), "新内容".into()).is_err());
        assert!(save_quick_capture(root, "../离开.md".into(), "新内容".into()).is_err());
    }
}

#[tauri::command]
pub fn set_default_editor(app: tauri::AppHandle) -> Result<bool, String> {
    #[cfg(target_os = "macos")]
    { macos::set(&app.config().identifier)?; Ok(true) }
    #[cfg(target_os = "windows")]
    {
        let _ = app;
        std::process::Command::new("explorer.exe").arg("ms-settings:defaultapps").spawn().map_err(|e| e.to_string())?;
        Ok(false)
    }
    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    { let _ = app; Err("请在系统设置中将 Markart 设为 Markdown 文件的默认应用".into()) }
}

#[cfg(target_os = "macos")]
mod macos {
    use std::{ffi::c_void, path::Path};
    type CF = *const c_void;
    #[link(name = "CoreFoundation", kind = "framework")]
    extern "C" {
        fn CFStringCreateWithBytes(allocator: CF, bytes: *const u8, length: isize, encoding: u32, external: u8) -> CF;
        fn CFURLCreateFromFileSystemRepresentation(allocator: CF, bytes: *const u8, length: isize, directory: u8) -> CF;
        fn CFRelease(value: CF);
    }
    #[link(name = "CoreServices", kind = "framework")]
    extern "C" {
        fn LSRegisterURL(url: CF, update: u8) -> i32;
        fn UTTypeCreatePreferredIdentifierForTag(tag: CF, value: CF, conforms: CF) -> CF;
        fn LSSetDefaultRoleHandlerForContentType(content_type: CF, roles: u32, bundle: CF) -> i32;
    }
    struct Owned(CF);
    impl Owned {
        fn string(value: &str) -> Result<Self, String> {
            let ptr = unsafe { CFStringCreateWithBytes(std::ptr::null(), value.as_ptr(), value.len() as isize, 0x08000100, 0) };
            if ptr.is_null() { Err("无法创建文件关联信息".into()) } else { Ok(Self(ptr)) }
        }
    }
    impl Drop for Owned { fn drop(&mut self) { unsafe { CFRelease(self.0) } } }
    pub fn set(identifier: &str) -> Result<(), String> {
        let exe = std::env::current_exe().map_err(|e| e.to_string())?;
        let bundle = exe.ancestors().find(|p| p.extension().is_some_and(|ext| ext == "app"))
            .ok_or("开发版无法设为默认编辑器，请安装 Markart 后设置")?;
        register(bundle)?;
        let identifier = Owned::string(identifier)?;
        let tag = Owned::string("public.filename-extension")?;
        for extension in ["md", "markdown", "mdown", "mkd"] {
            let value = Owned::string(extension)?;
            let content_type = unsafe { UTTypeCreatePreferredIdentifierForTag(tag.0, value.0, std::ptr::null()) };
            if content_type.is_null() { return Err(format!("无法识别 .{extension} 文件类型")); }
            let content_type = Owned(content_type);
            let status = unsafe { LSSetDefaultRoleHandlerForContentType(content_type.0, u32::MAX, identifier.0) };
            if status != 0 { return Err(format!("无法关联 .{extension} 文件（系统错误 {status}），请在访达的“显示简介”中修改打开方式")); }
        }
        Ok(())
    }
    fn register(path: &Path) -> Result<(), String> {
        use std::os::unix::ffi::OsStrExt;
        let bytes = path.as_os_str().as_bytes();
        let url = unsafe { CFURLCreateFromFileSystemRepresentation(std::ptr::null(), bytes.as_ptr(), bytes.len() as isize, 1) };
        if url.is_null() { return Err("无法识别 Markart 安装位置".into()); }
        let url = Owned(url);
        let status = unsafe { LSRegisterURL(url.0, 1) };
        if status == 0 { Ok(()) } else { Err(format!("无法注册 Markart（系统错误 {status}），请重新安装应用")) }
    }
}

#[derive(Default)]
pub struct PendingFiles(pub std::sync::Mutex<Vec<String>>);
#[tauri::command]
pub fn take_system_files(state: tauri::State<'_, PendingFiles>) -> Result<Vec<String>, String> {
    Ok(std::mem::take(&mut *state.0.lock().map_err(|e| e.to_string())?))
}

/// Route OS file-open requests to one focused window instead of racing all windows.
#[cfg(desktop)]
pub fn queue_system_files(app: &tauri::AppHandle, paths: Vec<String>) {
    use tauri::{Emitter, Manager};
    let has_files = !paths.is_empty();
    if let Ok(mut pending) = app.state::<PendingFiles>().0.lock() { pending.extend(paths); }
    let windows = app.webview_windows();
    let target = windows.values().find(|window| window.is_focused().unwrap_or(false)).or_else(|| windows.get("main")).or_else(|| windows.values().next());
    if let Some(window) = target {
        let _ = window.unminimize(); let _ = window.show(); let _ = window.set_focus();
        if has_files { let _ = app.emit_to(window.label(), "markart-open-files", ()); }
    }
}

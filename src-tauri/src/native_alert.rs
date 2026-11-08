use tauri::WebviewWindow;

#[tauri::command]
pub async fn confirm_discard_changes(
    window: WebviewWindow,
    title: String,
    message: String,
    save_label: String,
    cancel_label: String,
    discard_label: String,
    dark: bool,
) -> Result<Option<&'static str>, String> {
    #[cfg(target_os = "macos")]
    {
        use std::ffi::{c_char, c_void, CString};
        unsafe extern "C" {
            fn markart_show_unsaved_alert(
                window: *mut c_void,
                title: *const c_char,
                message: *const c_char,
                save_label: *const c_char,
                cancel_label: *const c_char,
                discard_label: *const c_char,
                dark: bool,
                completion: unsafe extern "C" fn(i32, *mut c_void),
                context: *mut c_void,
            );
        }
        unsafe extern "C" fn completed(choice: i32, context: *mut c_void) {
            let sender = unsafe { Box::from_raw(context as *mut std::sync::mpsc::Sender<i32>) };
            let _ = sender.send(choice);
        }
        let strings = [title, message, save_label, cancel_label, discard_label]
            .map(|value| CString::new(value).map_err(|_| "提示文字包含不支持的空字符".to_string()))
            .into_iter().collect::<Result<Vec<_>, _>>()?;
        let pointer = window.ns_window().map_err(|error| error.to_string())? as usize;
        let (sender, receiver) = std::sync::mpsc::channel();
        let context = Box::into_raw(Box::new(sender)) as usize;
        if let Err(error) = window.run_on_main_thread(move || unsafe {
            markart_show_unsaved_alert(
                pointer as *mut c_void,
                strings[0].as_ptr(), strings[1].as_ptr(), strings[2].as_ptr(),
                strings[3].as_ptr(), strings[4].as_ptr(), dark, completed, context as *mut c_void,
            );
        }) {
            unsafe { drop(Box::from_raw(context as *mut std::sync::mpsc::Sender<i32>)); }
            return Err(error.to_string());
        }
        let choice = tauri::async_runtime::spawn_blocking(move || receiver.recv())
            .await.map_err(|error| error.to_string())?.map_err(|error| error.to_string())?;
        Ok(match choice { 1 => Some("save"), 2 => Some("discard"), _ => None })
    }
    #[cfg(target_os = "windows")]
    {
        use windows_sys::Win32::UI::Controls::{TaskDialogIndirect, TASKDIALOGCONFIG, TASKDIALOG_BUTTON, TDF_ALLOW_DIALOG_CANCELLATION};
        let _ = dark;
        let wide = |value: &str| value.encode_utf16().chain(std::iter::once(0)).collect::<Vec<u16>>();
        let caption = wide("Markart");
        let heading = wide(&title);
        let detail = wide(&message);
        let save = wide(&save_label);
        let discard = wide(&discard_label);
        let cancel = wide(&cancel_label);
        let buttons = [
            TASKDIALOG_BUTTON { nButtonID: 101, pszButtonText: save.as_ptr() },
            TASKDIALOG_BUTTON { nButtonID: 102, pszButtonText: discard.as_ptr() },
            TASKDIALOG_BUTTON { nButtonID: 103, pszButtonText: cancel.as_ptr() },
        ];
        let pointer = window.hwnd().map_err(|error| error.to_string())?.0 as usize;
        let (sender, receiver) = std::sync::mpsc::channel();
        window.run_on_main_thread(move || {
            let config = TASKDIALOGCONFIG {
                cbSize: std::mem::size_of::<TASKDIALOGCONFIG>() as u32,
                hwndParent: pointer as _,
                dwFlags: TDF_ALLOW_DIALOG_CANCELLATION,
                pszWindowTitle: caption.as_ptr(),
                pszMainInstruction: heading.as_ptr(),
                pszContent: detail.as_ptr(),
                cButtons: buttons.len() as u32,
                pButtons: buttons.as_ptr(),
                nDefaultButton: 101,
                ..Default::default()
            };
            let mut selected = 0;
            let result = unsafe { TaskDialogIndirect(&config, &mut selected, std::ptr::null_mut(), std::ptr::null_mut()) };
            let _ = sender.send((result, selected));
        }).map_err(|error| error.to_string())?;
        let (result, selected) = tauri::async_runtime::spawn_blocking(move || receiver.recv())
            .await.map_err(|error| error.to_string())?.map_err(|error| error.to_string())?;
        if result < 0 { return Err(format!("Windows 关闭确认无法打开：{result}")); }
        return Ok(match selected { 101 => Some("save"), 102 => Some("discard"), _ => None });
    }
    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        let _ = (window, title, message, save_label, cancel_label, discard_label, dark);
        Ok(None)
    }
}

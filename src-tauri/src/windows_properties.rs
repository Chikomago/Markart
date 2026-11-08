use windows_sys::Win32::{
    Foundation::HWND,
    System::Com::{CoInitializeEx, CoUninitialize, COINIT_APARTMENTTHREADED, COINIT_DISABLE_OLE1DDE},
    UI::{Shell::{ShellExecuteExW, SHELLEXECUTEINFOW, SEE_MASK_FLAG_NO_UI, SEE_MASK_INVOKEIDLIST}, WindowsAndMessaging::SW_SHOWNORMAL},
};

struct ComApartment;
impl Drop for ComApartment {
    fn drop(&mut self) { unsafe { CoUninitialize() } }
}

fn wide_path(path: &str) -> Result<Vec<u16>, String> {
    if path.contains('\0') { return Err("文件路径包含无效字符".into()); }
    Ok(path.encode_utf16().chain(std::iter::once(0)).collect())
}

// Called on Tauri's Windows UI thread, whose message loop keeps the native property sheet alive.
pub fn show(path: &str, owner: usize) -> Result<(), String> {
    let path = wide_path(path)?;
    let verb: Vec<u16> = "properties".encode_utf16().chain(std::iter::once(0)).collect();
    // Balance both S_OK and S_FALSE. A failed initialization must not be uninitialized.
    let result = unsafe { CoInitializeEx(std::ptr::null(), (COINIT_APARTMENTTHREADED | COINIT_DISABLE_OLE1DDE) as u32) };
    if result < 0 { return Err(format!("初始化系统属性窗口失败：0x{:08X}", result as u32)); }
    let _apartment = ComApartment;
    let mut execute = SHELLEXECUTEINFOW {
        cbSize: std::mem::size_of::<SHELLEXECUTEINFOW>() as u32,
        fMask: SEE_MASK_INVOKEIDLIST | SEE_MASK_FLAG_NO_UI,
        hwnd: owner as HWND,
        lpVerb: verb.as_ptr(),
        lpFile: path.as_ptr(),
        nShow: SW_SHOWNORMAL,
        ..Default::default()
    };
    // UTF-16 buffers and the owner remain valid throughout ShellExecuteExW.
    if unsafe { ShellExecuteExW(&mut execute) } == 0 { return Err(std::io::Error::last_os_error().to_string()); }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn property_paths_preserve_unicode_and_are_terminated() {
        let path = r#"C:\文件\space & 'quote'\图😀.md"#;
        let encoded = wide_path(path).unwrap();
        assert_eq!(encoded.last(), Some(&0));
        assert_eq!(String::from_utf16(&encoded[..encoded.len()-1]).unwrap(), path);
        assert!(wide_path("bad\0path").is_err());
    }
}

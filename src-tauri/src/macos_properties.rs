use objc2::MainThreadMarker;
use objc2_app_kit::{NSApplication, NSPasteboard, NSPerformService};
use objc2_foundation::{NSArray, NSString};

pub fn show(path: &str) -> Result<(), String> {
    let mtm = MainThreadMarker::new().ok_or("系统简介需要在主线程打开")?;
    let _app = NSApplication::sharedApplication(mtm);
    // A private service pasteboard keeps the user's clipboard unchanged.
    let pasteboard = NSPasteboard::pasteboardWithUniqueName();
    let file_type = NSString::from_str("NSFilenamesPboardType");
    let files = NSArray::from_retained_slice(&[NSString::from_str(path)]);
    let types = NSArray::from_slice(&[&*file_type]);
    // Finder's Show Info service accepts an array of file paths with this property-list type.
    unsafe { pasteboard.declareTypes_owner(&types, None); }
    if !unsafe { pasteboard.setPropertyList_forType(&files, &file_type) } {
        return Err("无法向系统简介服务传递文件路径".into());
    }
    if !NSPerformService(&NSString::from_str("Finder/Show Info"), Some(&pasteboard)) {
        return Err("无法打开系统简介，可在 Finder 中查看".into());
    }
    Ok(())
}

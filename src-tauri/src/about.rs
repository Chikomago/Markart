use objc2::{rc::Retained, runtime::AnyObject, AnyThread, MainThreadMarker};
use objc2_app_kit::{
    NSApplication, NSImage, NSMutableParagraphStyle, NSTextAlignment,
    NSAboutPanelOptionApplicationIcon, NSAboutPanelOptionApplicationName,
    NSAboutPanelOptionApplicationVersion, NSAboutPanelOptionCredits,
    NSAboutPanelOptionVersion, NSParagraphStyleAttributeName,
};
use objc2_foundation::{NSAttributedString, NSData, NSDictionary, NSSize, NSString};

fn credits() -> String { format!("{}\nGPL v3", env!("CARGO_PKG_AUTHORS")) }

pub fn show(app: &tauri::AppHandle) {
    let version = app.package_info().version.to_string();
    if let Err(error) = app.run_on_main_thread(move || {
        let mtm = MainThreadMarker::new().expect("About panel runs on the main thread");
        let paragraph = NSMutableParagraphStyle::new();
        paragraph.setAlignment(NSTextAlignment::Center);
        // AppKit's stock About panel accepts attributed credits, which the
        // cross-platform menu metadata exposes only as an unformatted string.
        let attributes: Retained<NSDictionary<NSString, AnyObject>> = NSDictionary::from_slices(
            &[unsafe { NSParagraphStyleAttributeName }], &[&*paragraph],
        );
        let details = unsafe { NSAttributedString::initWithString_attributes(
            NSAttributedString::alloc(), &NSString::from_str(&credits()), Some(&attributes),
        ) };
        let icon = NSImage::initWithData(NSImage::alloc(), &NSData::with_bytes(include_bytes!("../icons/128x128.png")))
            .expect("Bundled About icon is a valid PNG");
        icon.setSize(NSSize::new(128.0, 128.0));
        let keys = unsafe { [NSAboutPanelOptionApplicationName, NSAboutPanelOptionVersion,
            NSAboutPanelOptionApplicationVersion, NSAboutPanelOptionApplicationIcon, NSAboutPanelOptionCredits] };
        let values: Vec<Retained<AnyObject>> = vec![
            NSString::from_str("Markart").into_super().into_super(),
            NSString::from_str(&version).into_super().into_super(),
            // Empty build version prevents AppKit from adding the bundle's
            // identical version again in parentheses.
            NSString::new().into_super().into_super(),
            icon.into_super().into_super(), details.into_super().into_super(),
        ];
        let options = NSDictionary::from_retained_objects(&keys, &values);
        unsafe { NSApplication::sharedApplication(mtm).orderFrontStandardAboutPanelWithOptions(&options) };
    }) { log::error!("About panel could not open: {error}"); }
}

#[cfg(test)]
mod tests {
    #[test]
    fn credits_contain_only_author_and_license() {
        assert_eq!(super::credits(), "chikomago\nGPL v3");
    }
}

use std::{
    collections::{HashMap, HashSet},
    sync::{Mutex, OnceLock},
};
// One-shot tokens bind a focus request to its owning window.
static TOKENS: OnceLock<Mutex<HashMap<String, HashSet<String>>>> = OnceLock::new();
fn tokens() -> &'static Mutex<HashMap<String, HashSet<String>>> {
    TOKENS.get_or_init(Default::default)
}
pub fn clear_owner(owner: &str) {
    tokens().lock().unwrap().remove(owner);
}
fn consume(owner: &str, token: &str) -> bool {
    tokens()
        .lock()
        .unwrap()
        .get_mut(owner)
        .map_or(false, |set| set.remove(token))
}
#[tauri::command]
pub fn plugin_focus_token(
    window: tauri::WebviewWindow,
    token: String,
    enabled: bool,
) -> Result<bool, String> {
    if token.len() != 36 || !token.bytes().all(|c| c.is_ascii_hexdigit() || c == b'-') {
        return Err("焦点请求标识无效".into());
    }
    if !cfg!(target_os = "macos") {
        return Ok(false);
    }
    let mut values = tokens().lock().unwrap();
    let set = values.entry(window.label().into()).or_default();
    if enabled {
        if set.len() >= 32 {
            return Err("焦点请求数量超限".into());
        }
        set.insert(token);
    } else {
        set.remove(&token);
    }
    Ok(true)
}
pub fn init<R: tauri::Runtime>() -> tauri::plugin::TauriPlugin<R> {
    tauri::plugin::Builder::new("plugin-focus")
        .on_webview_ready(|webview| {
            #[cfg(target_os = "macos")]
            {
                let owner = webview.label().to_string();
                let _ = webview.with_webview(move |view| macos::install(view.inner(), owner));
            }
            #[cfg(not(target_os = "macos"))]
            let _ = webview;
        })
        .build()
}
#[cfg(target_os = "macos")]
mod macos {
    use super::*;
    use objc2::runtime::ProtocolObject;
    use objc2::{define_class, msg_send, DefinedClass, MainThreadMarker, MainThreadOnly};
    use objc2_foundation::{NSObject, NSObjectProtocol, NSString};
    use objc2_web_kit::{
        WKContentWorld, WKScriptMessage, WKScriptMessageHandler, WKUserContentController, WKWebView,
    };
    struct Ivars {
        owner: String,
    }
    define_class!(
        #[unsafe(super(NSObject))]
        #[thread_kind=MainThreadOnly]
        #[ivars=Ivars]
        struct FocusHandler;
        unsafe impl NSObjectProtocol for FocusHandler {}
        unsafe impl WKScriptMessageHandler for FocusHandler {
            #[unsafe(method(userContentController:didReceiveScriptMessage:))]
            unsafe fn receive(
                &self,
                _controller: &WKUserContentController,
                message: &WKScriptMessage,
            ) {
                let body = unsafe { message.body() };
                let Some(token) = body.downcast_ref::<NSString>() else {
                    return;
                };
                let frame = unsafe { message.frameInfo() };
                if unsafe { frame.isMainFrame() } {
                    return;
                }
                if !consume(&self.ivars().owner, &token.to_string()) {
                    return;
                }
                if let Some(view) = unsafe { message.webView() } {
                    // Evaluate only in the requesting child frame; WKWebView supplies user activation.
                    let script=NSString::from_str("window.dispatchEvent(new Event('markart-focus'));document.querySelector('[autofocus]')?.focus({preventScroll:true})");
                    unsafe {
                        view.evaluateJavaScript_inFrame_inContentWorld_completionHandler(
                            &script,
                            Some(&frame),
                            &WKContentWorld::pageWorld(self.mtm()),
                            None,
                        )
                    }
                }
            }
        }
    );
    pub fn install(pointer: *mut std::ffi::c_void, owner: String) {
        let Some(mtm) = MainThreadMarker::new() else {
            return;
        };
        let handler = FocusHandler::alloc(mtm).set_ivars(Ivars { owner });
        let handler: objc2::rc::Retained<FocusHandler> = unsafe { msg_send![super(handler), init] };
        let view = unsafe { &*pointer.cast::<WKWebView>() };
        let controller = unsafe { view.configuration().userContentController() };
        unsafe {
            controller.addScriptMessageHandler_name(
                ProtocolObject::from_ref(&*handler),
                &NSString::from_str("markartPluginFocus"),
            );
        }
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn token_is_one_shot_and_bound_to_owner() {
        tokens()
            .lock()
            .unwrap()
            .entry("focus-test-owner".into())
            .or_default()
            .insert("nonce".into());
        assert!(!consume("other-owner", "nonce"));
        assert!(consume("focus-test-owner", "nonce"));
        assert!(!consume("focus-test-owner", "nonce"));
        clear_owner("focus-test-owner");
    }
}

use tauri::{Manager, Runtime, Url};
pub fn allowed(url: &Url, dev: Option<&Url>) -> bool {
    if matches!(url.as_str(), "about:blank" | "about:srcdoc") { return true; }
    if !url.username().is_empty() || url.password().is_some() { return false; }
    if url.scheme()=="tauri" && url.host_str()==Some("localhost") { return true; }
    if matches!(url.scheme(),"http"|"https") && url.host_str()==Some("tauri.localhost") && url.port().is_none() { return true; }
    dev.map_or(false, |base| url.origin()==base.origin() && matches!(url.path(),"/"|"/index.html"))
}
pub fn init<R:Runtime>() -> tauri::plugin::TauriPlugin<R> {
    tauri::plugin::Builder::new("navigation-policy").on_navigation(|webview,url|{
        let dev=if cfg!(debug_assertions) { webview.app_handle().config().build.dev_url.as_ref() } else {None};
        allowed(url,dev)
    }).build()
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]fn production_only_allows_application_pages_and_inline_frames(){
        for value in ["tauri://localhost/index.html","http://tauri.localhost/index.html","about:srcdoc","about:blank"] { assert!(allowed(&value.parse().unwrap(),None),"{value}"); }
        for value in ["https://example.com/","file:///tmp/page.html","data:text/html,page","http://127.0.0.1:5189/probe/navigation","https://tauri.localhost.example.com/","http://user:pass@tauri.localhost/"] { assert!(!allowed(&value.parse().unwrap(),None),"{value}"); }
    }
    #[test]fn development_origin_does_not_allow_probe_or_external_navigation(){
        let dev="http://127.0.0.1:5173/".parse().unwrap();
        assert!(allowed(&"http://127.0.0.1:5173/index.html?newWindow=1".parse().unwrap(),Some(&dev)));
        for value in ["http://127.0.0.1:5173/probe/navigation","http://127.0.0.1:5189/","http://localhost:5173/","https://example.com/"] { assert!(!allowed(&value.parse().unwrap(),Some(&dev)),"{value}"); }
    }
}

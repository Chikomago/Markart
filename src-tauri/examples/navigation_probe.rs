#[path = "../src/navigation_policy.rs"]
mod navigation_policy;
// Standalone synthetic test window. No application commands, user files or credentials.
fn allowed(url: &tauri::Url) -> bool {
    navigation_policy::allowed(url, Some(&"http://127.0.0.1:5189/".parse().unwrap()))
}
fn main() {
    let mut context=tauri::generate_context!();
    let worker=std::env::current_exe().ok().and_then(|path|path.file_name().map(|name|name.to_string_lossy().contains("worker"))).unwrap_or(false);
    let entry=format!("http://127.0.0.1:5189/?role={}&pid={}",if worker{"worker"}else{"host"},std::process::id());
    context.config_mut().identifier=if worker{"com.markart.navigation-worker".into()}else{"com.markart.navigation-probe".into()};
    context.config_mut().app.windows.clear();
    tauri::Builder::default().setup(move |app| {
        tauri::WebviewWindowBuilder::new(app,"navigation-probe",tauri::WebviewUrl::External(entry.parse().unwrap()))
            .title(if worker{"Markart Isolation Worker — 模拟数据"}else{"Markart Navigation Probe — 模拟数据"})
            .inner_size(900.,650.)
            .on_navigation(|url|{
                let allow=allowed(url);
                // Synthetic local paths only. Do not log arbitrary real URLs.
                println!("probe navigation {}: {}",if allow{"allow"}else{"deny"},url.path());
                allow
            })
            .build()?;
        Ok(())
    }).run(context).expect("navigation probe failed");
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]fn only_probe_entry_and_inline_frames_are_allowed(){
        for url in ["http://127.0.0.1:5189/","about:blank","about:srcdoc"]{assert!(allowed(&url.parse().unwrap()));}
        for url in ["http://127.0.0.1:5189/probe/navigation","https://example.com/","file:///tmp/probe","data:text/html,test"]{assert!(!allowed(&url.parse().unwrap()));}
    }
}

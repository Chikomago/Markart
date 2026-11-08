use tauri::{AppHandle, WebviewUrl, WebviewWindowBuilder};
use std::sync::atomic::{AtomicU64, Ordering};
static NEXT_WINDOW: AtomicU64 = AtomicU64::new(1);
fn config(base: &tauri::utils::config::WindowConfig, root: Option<&str>, path: Option<&str>) -> tauri::utils::config::WindowConfig {
    let mut config=base.clone();
    config.label=format!("markart-{}",NEXT_WINDOW.fetch_add(1,Ordering::Relaxed));
    let mut url=tauri::Url::parse("https://window.local/index.html").expect("static window URL");
    {let mut query=url.query_pairs_mut();query.append_pair("newWindow","1");if let Some(root)=root {query.append_pair("openRoot",root);}if let Some(path)=path {query.append_pair("openFile",path);}}
    config.url=WebviewUrl::App(format!("index.html?{}",url.query().unwrap_or("")).into());
    config.title=String::new();config.width=1200.;config.height=800.;config.maximized=false;config.fullscreen=false;config.visible=true;config.focus=true;config.decorations=true;config.devtools=Some(false);
    config
}
#[tauri::command]
pub async fn create_workspace_window(app:AppHandle,root:Option<String>,path:Option<String>)->Result<String,String>{
    let base=app.config().app.windows.first().cloned().unwrap_or_default();
    let config=config(&base,root.as_deref(),path.as_deref());
    let label=config.label.clone();
    WebviewWindowBuilder::from_config(&app,&config).map_err(|e|e.to_string())?.build().map_err(|e|e.to_string())?;
    Ok(label)
}
#[cfg(test)]
mod tests{
 use super::*;
 #[test]fn new_windows_keep_native_chrome_and_get_unique_sessions(){
  let base=tauri::utils::config::WindowConfig::default();let a=config(&base,None,None);let b=config(&base,None,None);
  assert_ne!(a.label,b.label);assert!(a.decorations&&a.focus&&a.visible);assert!(!a.maximized);assert_eq!(a.devtools,Some(false));
  if let WebviewUrl::App(url)=a.url{assert!(url.to_string_lossy().contains("newWindow=1"));}else{panic!("expected app URL")}
 }
 #[test]fn file_window_targets_are_encoded(){
  let value=config(&Default::default(),Some("/Notes/A & B"),Some("a#b.md"));
  if let WebviewUrl::App(path)=value.url{let url=tauri::Url::parse(&format!("https://window.local/{}",path.to_string_lossy())).unwrap();let pairs:std::collections::HashMap<_,_>=url.query_pairs().into_owned().collect();assert_eq!(pairs["openRoot"],"/Notes/A & B");assert_eq!(pairs["openFile"],"a#b.md");}else{panic!("expected app URL")}
 }
}

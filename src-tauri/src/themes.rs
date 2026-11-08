use std::{fs, path::{Component, Path, PathBuf}, time::{SystemTime, UNIX_EPOCH}};
use serde::{Deserialize, Serialize};
use tauri::Manager;

#[derive(Clone, Deserialize, Serialize)]
struct Manifest {
    name: String,
    #[serde(default = "styles")] styles: Vec<String>,
    #[serde(default)] description: Option<String>,
    #[serde(default)] preview: Option<[String; 3]>,
}
fn styles() -> Vec<String> { vec!["theme.css".into()] }
#[derive(Serialize)]
pub struct InstalledTheme { id: String, name: String, styles: Vec<String>, description: Option<String>, preview: Option<[String; 3]> }
fn theme_root(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let root = app.path().app_data_dir().map_err(|e| e.to_string())?.join("themes");
    fs::create_dir_all(&root).map_err(|e| e.to_string())?;
    Ok(root)
}
fn relative(path: &str) -> bool {
    !path.is_empty() && Path::new(path).components().all(|part| matches!(part, Component::Normal(_)))
}
fn manifest(root: &Path) -> Result<Manifest, String> {
    let file = root.join("theme.json");
    let value: Manifest = if file.exists() {
        serde_json::from_slice(&fs::read(file).map_err(|e| e.to_string())?).map_err(|e| format!("theme.json 格式不正确：{e}"))?
    } else {
        Manifest { name: root.file_name().unwrap_or_default().to_string_lossy().into_owned(), styles: styles(), description: None, preview: None }
    };
    if value.name.trim().is_empty() || value.name.chars().count() > 80 { return Err("主题名称需为 1～80 个字".into()); }
    if value.description.as_ref().is_some_and(|text| text.chars().count() > 120) { return Err("主题简介不能超过 120 个字".into()); }
    if let Some(colors) = &value.preview {
        if colors.iter().any(|color| !color.starts_with('#') || ![4, 7, 9].contains(&color.len()) || !color[1..].bytes().all(|c| c.is_ascii_hexdigit())) { return Err("主题 preview 需填写三个十六进制颜色，依次为侧栏、正文和强调色".into()); }
    }
    if value.styles.is_empty() { return Err("theme.json 的 styles 至少需要一个 CSS 文件".into()); }
    let canonical = root.canonicalize().map_err(|e| e.to_string())?;
    for style in &value.styles {
        if !relative(style) || Path::new(style).extension().and_then(|s| s.to_str()) != Some("css") { return Err(format!("CSS 路径不正确：{style}")); }
        let path = root.join(style).canonicalize().map_err(|_| format!("找不到主题样式：{style}"))?;
        if !path.starts_with(&canonical) || !path.is_file() { return Err(format!("CSS 文件必须位于主题文件夹内：{style}")); }
    }
    Ok(value)
}
fn descriptor(root: &Path, value: Manifest) -> InstalledTheme {
    InstalledTheme { id: root.file_name().unwrap().to_string_lossy().into_owned(), name: value.name, description: value.description, preview: value.preview,
        styles: value.styles.iter().map(|s| root.join(s).to_string_lossy().into_owned()).collect() }
}
fn copy_tree(source: &Path, target: &Path, total: &mut u64) -> Result<(), String> {
    for entry in fs::read_dir(source).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let kind = entry.file_type().map_err(|e| e.to_string())?;
        if kind.is_symlink() { return Err("主题文件夹不能包含符号链接，请改用实际文件".into()); }
        let dest = target.join(entry.file_name());
        if kind.is_dir() { fs::create_dir(&dest).map_err(|e| e.to_string())?; copy_tree(&entry.path(), &dest, total)?; }
        else if kind.is_file() {
            *total += entry.metadata().map_err(|e| e.to_string())?.len();
            if *total > 50 * 1024 * 1024 { return Err("主题文件夹超过 50 MB，请移除无关文件".into()); }
            fs::copy(entry.path(), dest).map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}
fn install(source: &Path, root: &Path) -> Result<InstalledTheme, String> {
    let source = source.canonicalize().map_err(|e| e.to_string())?;
    let value = manifest(&source)?;
    if root.canonicalize().map_err(|e| e.to_string())?.starts_with(&source) { return Err("请选择独立的主题文件夹".into()); }
    // Staging and rename keep failed imports out of the installed list.
    let staging = tempfile::Builder::new().prefix(".import-").tempdir_in(root).map_err(|e| e.to_string())?;
    copy_tree(&source, staging.path(), &mut 0)?;
    fs::write(staging.path().join("theme.json"), serde_json::to_vec_pretty(&value).unwrap()).map_err(|e| e.to_string())?;
    let id = format!("theme-{}-{}", SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_nanos(), std::process::id());
    let dest = root.join(id);
    fs::rename(staging.path(), &dest).map_err(|e| e.to_string())?;
    Ok(descriptor(&dest, value))
}
#[tauri::command]
pub fn list_installed_themes(app: tauri::AppHandle) -> Result<Vec<InstalledTheme>, String> {
    let root = theme_root(&app)?;
    let mut themes = Vec::new();
    for entry in fs::read_dir(&root).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        if entry.file_type().map_err(|e| e.to_string())?.is_dir() && entry.file_name().to_string_lossy().starts_with("theme-") {
            if let Ok(value) = manifest(&entry.path()) { themes.push(descriptor(&entry.path(), value)); }
        }
    }
    themes.sort_by(|a,b| a.id.cmp(&b.id));
    Ok(themes)
}
#[tauri::command]
pub fn install_theme_folder(app: tauri::AppHandle, path: String) -> Result<InstalledTheme, String> {
    install(Path::new(&path), &theme_root(&app)?)
}
#[tauri::command]
pub fn remove_installed_theme(app: tauri::AppHandle, id: String) -> Result<(), String> {
    if !relative(&id) || Path::new(&id).components().count() != 1 || !id.starts_with("theme-") { return Err("主题目录不正确".into()); }
    fs::remove_dir_all(theme_root(&app)?.join(id)).map_err(|e| e.to_string())
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn folders_with_same_names_remain_independent_and_copy_resources() {
        let root = tempfile::tempdir().unwrap(); let source = tempfile::tempdir().unwrap();
        fs::create_dir(source.path().join("parts")).unwrap();
        fs::write(source.path().join("theme.json"), r##"{"name":"同名主题","description":"墨蓝 · 青绿","preview":["#151f2d","#1c2939","#83d6c3"],"styles":["theme.css","parts/editor.css"]}"##).unwrap();
        fs::write(source.path().join("theme.css"), "@import './parts/editor.css';").unwrap();
        fs::write(source.path().join("parts/editor.css"), ".app-shell{--accent:red}").unwrap();
        fs::write(source.path().join("parts/image.svg"), "<svg/>").unwrap();
        let first=install(source.path(),root.path()).unwrap();let second=install(source.path(),root.path()).unwrap();
        assert_ne!(first.id,second.id);assert_eq!(first.styles.len(),2);
        assert_eq!(first.description.as_deref(),Some("墨蓝 · 青绿"));
        assert_eq!(first.preview.as_ref().unwrap()[2],"#83d6c3");
        let restored=manifest(&root.path().join(&first.id)).unwrap();
        assert_eq!(restored.description,first.description);assert_eq!(restored.preview,first.preview);
        assert!(root.path().join(first.id).join("parts/image.svg").exists());
    }
    #[test]
    fn fallback_entry_and_invalid_paths() {
        let root=tempfile::tempdir().unwrap();fs::write(root.path().join("theme.css"), "body{}").unwrap();
        assert_eq!(manifest(root.path()).unwrap().styles,vec!["theme.css"]);
        fs::write(root.path().join("theme.json"),r#"{"name":"test","styles":["../outside.css"]}"#).unwrap();
        assert!(manifest(root.path()).is_err());assert!(!relative("/tmp/theme.css"));
    }
}

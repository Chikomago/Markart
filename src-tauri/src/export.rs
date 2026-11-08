use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::Path;
use std::process::{Command, Stdio};
use std::time::{Duration, Instant};
use tauri::Manager;
use tauri_plugin_dialog::DialogExt;

fn write_export(target: &Path, bytes: &[u8]) -> Result<(), String> {
    if bytes.is_empty() { return Err("文件为空，无法导出".into()); }
    let parent = target.parent().ok_or("保存路径不可用，请重新选择")?;
    if !parent.is_dir() { return Err("保存文件夹不可用，请重新选择".into()); }
    let mut staged = tempfile::NamedTempFile::new_in(parent).map_err(|error| error.to_string())?;
    staged.write_all(bytes).and_then(|_| staged.as_file().sync_all()).map_err(|error| error.to_string())?;
    // The save dialog has already confirmed replacing this destination.
    staged.persist(target).map_err(|error| error.error.to_string())?;
    File::open(parent).and_then(|file| file.sync_all()).map_err(|error| error.to_string())?;
    Ok(())
}

fn safe_name(name: &str) -> String {
    let base = Path::new(name).file_stem().and_then(|part| part.to_str()).unwrap_or("文件");
    let cleaned: String = base.chars().filter(|character| !matches!(character, '/' | '\\' | ':' | '\0')).take(100).collect();
    if cleaned.trim().is_empty() { "文件".into() } else { cleaned }
}

#[cfg(target_os = "macos")]
fn render_visual(app: &tauri::AppHandle, html: &str, page_size: &str, margin_mm: f64, extension: &str) -> Result<Vec<u8>, String> {
    let resource_dir = app.path().resource_dir().map_err(|error| error.to_string())?;
    let helper = resource_dir.join("resources/pdf-export");
    if !helper.is_file() { return Err("PDF 导出组件缺失，请重新安装应用".into()); }
    let temp = tempfile::tempdir().map_err(|error| error.to_string())?;
    let input = temp.path().join("document.html");
    let output = temp.path().join(format!("document.{extension}"));
    fs::write(&input, html).map_err(|error| error.to_string())?;
    let mut child = Command::new(helper).arg(&input).arg(&output).arg(page_size).arg(margin_mm.to_string()).stderr(Stdio::piped()).spawn().map_err(|error| error.to_string())?;
    let start = Instant::now();
    loop {
        if let Some(status) = child.try_wait().map_err(|error| error.to_string())? {
            if !status.success() {
                let mut detail = String::new();
                if let Some(mut stderr) = child.stderr.take() { let _ = stderr.read_to_string(&mut detail); }
                return Err(format!("PDF 渲染失败（{status}）：{}", detail.trim()));
            }
            break;
        }
        if start.elapsed() > Duration::from_secs(30) {
            let _ = child.kill(); let _ = child.wait();
            return Err("PDF 生成超时，请减少文件内容后重新导出".into());
        }
        std::thread::sleep(Duration::from_millis(50));
    }
    let bytes = fs::read(output).map_err(|error| error.to_string())?;
    if bytes.len() < 100 || !(if extension == "pdf" { bytes.starts_with(b"%PDF") } else { bytes.starts_with(b"\x89PNG\r\n\x1a\n") }) { return Err("图像输出无效".into()); }
    Ok(bytes)
}

fn validate_visual_settings(page_size: &str, margin: f64) -> Result<(), String> {
    let custom = page_size.split_once('x').and_then(|(width, height)| Some((width.parse::<f64>().ok()?, height.parse::<f64>().ok()?)))
        .map(|(width, height)| (50.0..=1000.0).contains(&width) && (50.0..=1000.0).contains(&height)).unwrap_or(false);
    if (!matches!(page_size, "A4" | "Letter") && !custom) || !margin.is_finite() || !(0.0..=100.0).contains(&margin) {
        return Err("纸张尺寸或页边距有误，请检查导出设置".into());
    }
    Ok(())
}
fn validate_visual_bytes(bytes: &[u8], kind: &str) -> Result<(), String> {
    let valid = match kind { "pdf" => bytes.starts_with(b"%PDF"), "png" => bytes.starts_with(b"\x89PNG\r\n\x1a\n"), _ => false };
    if bytes.len() < 100 || bytes.len() > 150_000_000 || !valid { return Err("导出预览无效，请重新生成".into()); }
    Ok(())
}

#[tauri::command]
pub async fn render_export_preview(app: tauri::AppHandle, kind: String, content: String, page_size: String, margin_mm: f64) -> Result<Vec<u8>, String> {
    if !matches!(kind.as_str(), "pdf" | "png") { return Err("此格式不使用图像预览".into()); }
    validate_visual_settings(&page_size, margin_mm)?;
    #[cfg(target_os = "macos")]
    {
        tauri::async_runtime::spawn_blocking(move || {
            let bytes = render_visual(&app, &content, &page_size, margin_mm, &kind)?;
            validate_visual_bytes(&bytes, &kind)?;
            Ok(bytes)
        }).await.map_err(|error| error.to_string())?
    }
    #[cfg(not(target_os = "macos"))]
    { let _ = (app, content); Err("PDF 和 PNG 导出暂不支持当前系统".into()) }
}

#[tauri::command]
pub async fn export_document(app: tauri::AppHandle, kind: String, filename: String, content: String, page_size: Option<String>, margin_mm: Option<f64>, binary_content: Option<Vec<u8>>) -> Result<Option<String>, String> {
    let extension = match kind.as_str() { "html" => "html", "txt" => "txt", "pdf" => "pdf", "png" => "png", "docx" => "docx", _ => return Err("不支持此导出格式，请选择其他格式".into()) };
    let default_name = format!("{}.{}", safe_name(&filename), extension);
    let dialog_app = app.clone();
    let selected = tauri::async_runtime::spawn_blocking(move || {
        dialog_app.dialog().file().set_file_name(default_name).add_filter("导出文件", &[extension]).blocking_save_file()
    }).await.map_err(|error| error.to_string())?;
    let Some(target) = selected.and_then(|path| path.into_path().ok()) else { return Ok(None); };
    if target.extension().and_then(|part| part.to_str()).map(str::to_ascii_lowercase).as_deref() != Some(extension) {
        return Err("文件扩展名与导出格式不一致，请修改文件名".into());
    }
    let bytes = if kind == "pdf" || kind == "png" {
        let size = page_size.as_deref().unwrap_or("A4");
        let margin = margin_mm.unwrap_or(18.0);
        validate_visual_settings(size, margin)?;
        if let Some(bytes) = binary_content {
            validate_visual_bytes(&bytes, &kind)?;
            bytes
        } else {
            #[cfg(target_os = "macos")]
            { render_visual(&app, &content, size, margin, extension)? }
            #[cfg(not(target_os = "macos"))]
            { return Err("PDF 和 PNG 导出暂不支持当前系统".into()); }
        }
    } else if kind == "docx" {
        let data = binary_content.ok_or("未生成 Word 内容，请重新导出")?;
        if data.len() < 100 || data.len() > 100_000_000 || !data.starts_with(b"PK\x03\x04") { return Err("Word 文件无法生成或超过 100 MB，请减少内容后导出".into()); }
        data
    } else { content.into_bytes() };
    write_export(&target, &bytes)?;
    Ok(Some(target.to_string_lossy().into_owned()))
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn preview_validates_page_settings_and_generated_bytes() {
        assert!(validate_visual_settings("A4", 18.0).is_ok());
        assert!(validate_visual_settings("210x297", 0.0).is_ok());
        assert!(validate_visual_settings("1x297", 18.0).is_err());
        assert!(validate_visual_settings("Letter", f64::NAN).is_err());
        assert!(validate_visual_settings("A4", 101.0).is_err());
        let mut pdf = b"%PDF".to_vec(); pdf.resize(100, b' ');
        assert!(validate_visual_bytes(&pdf, "pdf").is_ok());
        assert!(validate_visual_bytes(&pdf, "png").is_err());
        assert!(validate_visual_bytes(b"%PDF", "pdf").is_err());
    }
    #[test]
    fn export_replaces_confirmed_destination_without_empty_output() {
        let directory = tempfile::tempdir().unwrap();
        let target = directory.path().join("page.html");
        assert!(write_export(&target, b"").is_err());
        assert!(!target.exists());
        fs::write(&target, b"existing").unwrap();
        write_export(&target, b"new").unwrap();
        assert_eq!(fs::read(target).unwrap(), b"new");
    }
    #[test]
    fn export_writes_complete_content() {
        let directory = tempfile::tempdir().unwrap();
        let target = directory.path().join("page.txt");
        write_export(&target, "公式与表格".as_bytes()).unwrap();
        assert_eq!(fs::read_to_string(target).unwrap(), "公式与表格");
    }
}

#[tauri::command]
pub async fn render_clipboard_image(app: tauri::AppHandle, content: String) -> Result<Vec<u8>, String> {
    #[cfg(target_os = "macos")]
    { tauri::async_runtime::spawn_blocking(move || render_visual(&app, &content, "A4", 0.0, "png")).await.map_err(|error| error.to_string())? }
    #[cfg(not(target_os = "macos"))]
    { let _ = (app, content); Err("复制为图片暂不支持当前系统".into()) }
}

#[tauri::command]
pub async fn export_plugin_file(app: tauri::AppHandle, filename: String, extension: String, bytes: Vec<u8>) -> Result<Option<String>, String> {
    if extension.is_empty() || extension.len()>12 || !extension.bytes().all(|byte|byte.is_ascii_lowercase()||byte.is_ascii_digit()) {return Err("导出扩展名无效".into());}
    if bytes.len()>20*1024*1024 {return Err("导出内容超过 20 MB".into());}
    tauri::async_runtime::spawn_blocking(move || {
        let name=format!("{}.{}",safe_name(&filename),extension);
        let selected=app.dialog().file().set_file_name(name).add_filter("导出文件",&[extension.as_str()]).blocking_save_file();
        let Some(path)=selected.and_then(|path|path.into_path().ok()) else{return Ok(None);};
        if path.extension().and_then(|part|part.to_str())!=Some(extension.as_str()){return Err("文件扩展名与导出格式不一致".into());}
        write_export(&path,&bytes)?;Ok(Some(path.to_string_lossy().into_owned()))
    }).await.map_err(|e|e.to_string())?
}

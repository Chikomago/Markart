use serde::{Deserialize, Serialize};
use std::fs;
use std::io::Read;
use std::path::Path;
use std::process::{Command, Stdio};
use std::time::{Duration, Instant};
use tauri::{AppHandle, Manager};
use crate::docx_import::docx_to_markdown;
use crate::pdf_import::pdf_text_to_markdown;
use crate::workspace::WorkspaceState;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConvertedDocument {
    pub text: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct PdfText { text: String }

fn run_with_timeout(mut child: std::process::Child) -> Result<(), String> {
    let started = Instant::now();
    loop {
        if let Some(status) = child.try_wait().map_err(|error| error.to_string())? {
            if status.success() { return Ok(()); }
            let mut detail = String::new();
            if let Some(mut stderr) = child.stderr.take() { let _ = stderr.read_to_string(&mut detail); }
            return Err(format!("格式转换失败：{}", detail.trim()));
        }
        if started.elapsed() > Duration::from_secs(30) {
            let _ = child.kill(); let _ = child.wait();
            return Err("转换超时，请重新打开文件".into());
        }
        std::thread::sleep(Duration::from_millis(50));
    }
}

fn convert_path(app: &AppHandle, path: &Path) -> Result<ConvertedDocument, String> {
    let metadata = fs::symlink_metadata(path).map_err(|error| error.to_string())?;
    if !metadata.is_file() || metadata.file_type().is_symlink() || metadata.len() > 30 * 1024 * 1024 { return Err("请选择不超过 30 MB 的文件".into()); }
    let kind = path.extension().and_then(|part| part.to_str()).unwrap_or("").to_ascii_lowercase();
    let mut result = ConvertedDocument { text: String::new() };
    match kind.as_str() {
        "docx" => {
            result.text = docx_to_markdown(path)?;
        }
        "pdf" => {
            let resource = app.path().resource_dir().map_err(|error| error.to_string())?.join("resources/pdf-text");
            if !resource.is_file() { return Err("PDF 转换组件缺失，请重新安装应用".into()); }
            let temp = tempfile::tempdir().map_err(|error| error.to_string())?;
            let output = temp.path().join("text.json");
            let child = Command::new(resource).arg(path).arg(&output).stderr(Stdio::piped()).spawn().map_err(|error| error.to_string())?;
            run_with_timeout(child)?;
            let parsed: PdfText = serde_json::from_slice(&fs::read(output).map_err(|error| error.to_string())?).map_err(|error| error.to_string())?;
            result.text = pdf_text_to_markdown(&parsed.text)?;
        }
        _ => return Err("仅支持将 Word（DOCX）和 PDF 转换为 Markdown".into()),
    }
    Ok(result)
}

#[tauri::command]
pub async fn convert_workspace_document(app: AppHandle, state: tauri::State<'_, WorkspaceState>, relative_path: String) -> Result<ConvertedDocument, String> {
    let path = {
        let guard = state.0.lock().map_err(|error| error.to_string())?;
        guard.as_ref().ok_or("请先打开文件夹")?.resolve(&relative_path)?
    };
    tauri::async_runtime::spawn_blocking(move || convert_path(&app, &path)).await.map_err(|error| error.to_string())?
}

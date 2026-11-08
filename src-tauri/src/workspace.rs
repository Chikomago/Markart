use serde::{Deserialize, Serialize};
use base64::Engine;
use sha2::{Digest, Sha256};
use std::collections::{HashMap, HashSet};
use std::fs::{self, File};
use std::io::{BufRead, BufReader, Read, Write};
use std::path::{Component, Path, PathBuf};
use std::sync::{Arc, Mutex};
use std::time::UNIX_EPOCH;
use tauri::{AppHandle, Manager, Emitter};
use tauri_plugin_dialog::DialogExt;
use crate::git_history::{self, GitVersion};
use crate::link_paths::{local_references, rewrite_markdown, LinkChange};

const UTF8_BOM: &[u8] = &[0xEF, 0xBB, 0xBF];
const MAX_FILE_SIZE: usize = 20 * 1024 * 1024;

pub(crate) fn decode_document(bytes: &[u8]) -> Result<(String, &'static str), String> {
    if let Some(body) = bytes.strip_prefix(UTF8_BOM) {
        return String::from_utf8(body.to_vec()).map(|text| (text, "UTF-8"))
            .map_err(|_| "UTF-8 BOM 文件包含无效字节".into());
    }
    if let Ok(text) = String::from_utf8(bytes.to_vec()) {
        return Ok((text, "UTF-8"));
    }
    for (name, codec) in [("GB2312", encoding_rs::GBK), ("GBK", encoding_rs::GBK), ("GB18030", encoding_rs::GB18030)] {
        if name == "GB2312" && !bytes.iter().all(|byte| *byte < 0x80 || (0xA1..=0xFE).contains(byte)) { continue; }
        let (text, errors) = codec.decode_without_bom_handling(bytes);
        if errors { continue; }
        let (roundtrip, _, errors) = codec.encode(&text);
        if !errors && roundtrip.as_ref() == bytes { return Ok((text.into_owned(), name)); }
    }
    Err("无法识别文件编码，请转为 UTF-8 后打开；原文件未修改".into())
}

fn encode_document(content: &str, encoding: &str) -> Result<Vec<u8>, String> {
    match encoding {
        "UTF-8" => Ok(content.as_bytes().to_vec()),
        "ASCII" if content.is_ascii() => Ok(content.as_bytes().to_vec()),
        "ASCII" => Err("当前编码无法保存部分字符，请另存为 UTF-8".into()),
        "GB2312" | "GBK" | "GB18030" => {
            let codec = if encoding == "GB18030" { encoding_rs::GB18030 } else { encoding_rs::GBK };
            let (bytes, _, errors) = codec.encode(content);
            if errors { return Err(format!("内容包含 {encoding} 无法表示的字符；原文件未修改")); }
            if encoding == "GB2312" && !bytes.iter().all(|byte| *byte < 0x80 || (0xA1..=0xFE).contains(byte)) {
                return Err("内容包含 GB2312 无法表示的字符；原文件未修改".into());
            }
            Ok(bytes.into_owned())
        }
        _ => Err("不支持此编码，请转为 UTF-8 后打开".into()),
    }
}

#[derive(Default)]
pub struct WorkspaceState(pub Mutex<Option<Workspace>>, Mutex<Vec<Workspace>>);
impl WorkspaceState {
    pub(crate) fn with_root<T>(&self, root: Option<&str>, task: impl FnOnce(&mut Workspace) -> Result<T, String>) -> Result<T, String> {
        let mut active = self.0.lock().map_err(|e| e.to_string())?;
        if let Some(workspace) = active.as_mut() {
            if root.is_none_or(|root| workspace.root.to_string_lossy() == root) { return task(workspace); }
        }
        let mut cached = self.1.lock().map_err(|e| e.to_string())?;
        if let Some(workspace) = cached.iter_mut().find(|workspace| root.is_some_and(|root| workspace.root.to_string_lossy() == root)) { return task(workspace); }
        Err("文件夹已切换，请重新打开该文件".into())
    }
    fn containing_root(&self, path: &Path) -> Result<Option<PathBuf>, String> {
        let active = self.0.lock().map_err(|e| e.to_string())?;
        let cached = self.1.lock().map_err(|e| e.to_string())?;
        Ok(active.iter().chain(cached.iter()).filter(|workspace| path.starts_with(&workspace.root)).max_by_key(|workspace| workspace.root.components().count()).map(|workspace| workspace.root.clone()))
    }
    fn install(&self, workspace: Workspace) -> Result<(), String> {
        let mut active = self.0.lock().map_err(|e| e.to_string())?;
        let mut cached = self.1.lock().map_err(|e| e.to_string())?;
        cached.retain(|entry| entry.root != workspace.root);
        if let Some(previous) = active.replace(workspace) {
            if active.as_ref().is_some_and(|next| previous.root != next.root) { cached.push(previous); }
        }
        // Bound memory, file handles and watcher count; SQLite survives eviction.
        while cached.len() > 3 { cached.remove(0); }
        Ok(())
    }
    fn activate_cached(&self, root: &Path) -> Result<Option<WorkspaceInfo>, String> {
        self.activate_cached_with(root, false)
    }
    fn activate_cached_with(&self, root: &Path, saving: bool) -> Result<Option<WorkspaceInfo>, String> {
        let mut active = self.0.lock().map_err(|e| e.to_string())?;
        if active.as_ref().is_some_and(|workspace| workspace.root == root) {
            return if saving { active.as_mut().unwrap().save_info() } else { active.as_mut().unwrap().cached_info() }.map(Some);
        }
        let mut cached = self.1.lock().map_err(|e| e.to_string())?;
        let Some(index) = cached.iter().position(|workspace| workspace.root == root) else { return Ok(None); };
        let info = if saving { cached[index].save_info()? } else { cached[index].cached_info()? };
        let next = cached.remove(index);
        if let Some(previous) = active.replace(next) { cached.push(previous); }
        Ok(Some(info))
    }
}

#[derive(Default)]

pub struct Workspace {
    pub(crate) root: PathBuf,
    allowed: HashSet<String>,
    originals: HashMap<String, Vec<u8>>,
    index: Arc<Mutex<Option<crate::file_index::FileIndex>>>,
    _index_worker: Option<crate::index_worker::IndexWorker>,
    index_gate: Arc<Mutex<()>>,
    listing: Option<WorkspaceInfo>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiskStatus {
    changed: bool,
    missing: bool,
    content: Option<String>,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Draft {
    relative_path: String,
    content: String,
    baseline_hash: String,
    updated: u64,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DraftPreview {
    content: String,
    updated: u64,
    baseline_hash: String,
    disk_changed: bool,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileEntry {
    relative_path: String,
    updated: u64,
    created: Option<u64>,
    excerpt: String,
    openable: bool,
    utf8: Option<bool>,
    hidden: bool,
}

#[derive(Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchResult {
    relative_path: String,
    snippet: Option<String>,
}

#[derive(Clone, Serialize)]
pub struct WorkspaceInfo {
    name: String,
    root: String,
    directories: Vec<String>,
    files: Vec<FileEntry>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OpenedWorkspaceFile {
    workspace: WorkspaceInfo,
    relative_path: String,
}

#[derive(Serialize)]
pub struct OpenedDocument {
    content: String,
    encoding: &'static str,
    version: String,
}

#[derive(Serialize)]
pub struct SavedDocument {
    updated: u64,
    version: String,
    git_warning: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MoveLinkPreview {
    relative_path: String,
    changes: Vec<LinkChange>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MovePreview {
    token: String,
    links: Vec<MoveLinkPreview>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MoveResult {
    updated: Vec<MoveUpdatedDocument>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MoveUpdatedDocument {
    relative_path: String,
    content: String,
    version: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MissingResource {
    source: String,
    line: usize,
    target: String,
    resolved: String,
}

struct PlannedRewrite {
    old_path: String,
    new_path: String,
    old_bytes: Vec<u8>,
    new_bytes: Vec<u8>,
    changes: Vec<LinkChange>,
}

fn timestamp(time: std::io::Result<std::time::SystemTime>) -> Option<u64> {
    time.ok()?
        .duration_since(UNIX_EPOCH)
        .ok()
        .map(|value| value.as_millis() as u64)
}

fn valid_relative(path: &str) -> Result<&Path, String> {
    let relative = Path::new(path);
    if path.is_empty()
        || relative
            .components()
            .any(|part| !matches!(part, Component::Normal(_)))
    {
        return Err("文件路径不可用，请重新打开文件".into());
    }
    Ok(relative)
}

fn image_mime(path: &Path) -> Result<&'static str, String> {
    match path.extension().and_then(|part| part.to_str()).unwrap_or("").to_ascii_lowercase().as_str() {
        "png" => Ok("image/png"),
        "jpg" | "jpeg" => Ok("image/jpeg"),
        "gif" => Ok("image/gif"),
        "webp" => Ok("image/webp"),
        _ => Err("请选择 PNG、JPEG、GIF 或 WebP 图片".into()),
    }
}

fn image_extension_for_bytes(bytes: &[u8], mime: &str) -> Result<&'static str, String> {
    if bytes.len() > 20 * 1024 * 1024 { return Err("图片超过 20 MB，请压缩后插入".into()); }
    match mime {
        "image/png" if bytes.starts_with(b"\x89PNG\r\n\x1a\n") => Ok("png"),
        "image/jpeg" if bytes.starts_with(b"\xff\xd8\xff") => Ok("jpg"),
        "image/gif" if bytes.starts_with(b"GIF87a") || bytes.starts_with(b"GIF89a") => Ok("gif"),
        "image/webp" if bytes.len() >= 12 && bytes.starts_with(b"RIFF") && &bytes[8..12] == b"WEBP" => Ok("webp"),
        _ => Err("图片内容与扩展名不一致，请重新保存图片后插入".into()),
    }
}

fn hidden_path(root: &Path, path: &Path) -> bool {
    let mut current = root.to_path_buf();
    for part in path.strip_prefix(root).unwrap_or(path).components() {
        current.push(part.as_os_str());
        if part.as_os_str().to_string_lossy().starts_with('.') { return true; }
        if let Ok(metadata) = fs::symlink_metadata(&current) {
            #[cfg(target_os = "windows")]
            { use std::os::windows::fs::MetadataExt; if metadata.file_attributes() & 2 != 0 { return true; } }
            #[cfg(target_os = "macos")]
            { use std::os::macos::fs::MetadataExt; if metadata.st_flags() & 0x8000 != 0 { return true; } }
            #[cfg(not(any(target_os = "macos", target_os = "windows")))]
            let _ = metadata;
        }
    }
    false
}

pub(crate) fn binary_document(bytes: &[u8]) -> bool {
    bytes.contains(&0) || infer::get(bytes).is_some_and(|kind| !kind.mime_type().starts_with("text/") && !matches!(kind.mime_type(), "image/svg+xml" | "application/xml"))
}

fn supported_document(path: &Path) -> bool {
    path.extension().and_then(|part| part.to_str()).is_some_and(|part| {
        let extension = part.to_ascii_lowercase();
        matches!(extension.as_str(),
            "md" | "markdown" | "mdown" | "mkd" | "txt" | "text"
            | "css" | "scss" | "less" | "js" | "mjs" | "cjs" | "jsx" | "ts" | "mts" | "cts" | "tsx"
            | "json" | "jsonc" | "html" | "htm" | "yaml" | "yml" | "xml" | "svg"
            | "py" | "rs" | "sh" | "bash" | "zsh" | "sql" | "java" | "c" | "cc" | "cpp" | "h" | "hpp"
            | "cs" | "go" | "rb" | "php" | "swift" | "kt" | "kts" | "lua" | "toml" | "ini" | "cfg" | "log"
            | "docx" | "pdf")
    })
}

fn url_segment(part: &str) -> String {
    let mut encoded = String::new();
    for byte in part.bytes() {
        if byte.is_ascii_alphanumeric() || b"-_.~".contains(&byte) {
            encoded.push(byte as char);
        } else {
            encoded.push_str(&format!("%{byte:02X}"));
        }
    }
    encoded
}

fn apply_index_file_types(index: &crate::file_index::FileIndex, files: &mut [FileEntry]) -> Result<(), String> {
    let encodings = index.text_encodings()?;
    apply_file_encodings(&encodings, files);
    Ok(())
}
fn apply_file_encodings(encodings: &HashMap<String, Option<bool>>, files: &mut [FileEntry]) {
    for file in files {
        if let Some(utf8) = encodings.get(&file.relative_path) {
            file.utf8 = *utf8;
            let convertible = matches!(Path::new(&file.relative_path).extension().and_then(|part| part.to_str()).map(str::to_ascii_lowercase).as_deref(), Some("docx" | "pdf"));
            file.openable = convertible || utf8.unwrap_or(true);
            if !file.openable { file.excerpt.clear(); }
        }
    }
}

impl Workspace {
    fn refresh_file_index(&self, files: &mut [FileEntry], directories: &[String]) {
        let result = self.index.lock().map_err(|e| e.to_string()).and_then(|mut index| {
            let index = index.as_mut().ok_or("file index unavailable")?;
            index.reconcile_with_directories(&self.root, &files.iter().map(|file| file.relative_path.clone()).collect::<Vec<_>>(), directories)?;
            apply_index_file_types(index, files)
        });
        if let Err(error) = result { log::warn!("File index refresh: {error}"); }
    }

    fn listing_context(&self) -> Self {
        Self { root: self.root.clone(), allowed: HashSet::new(), originals: HashMap::new(), index: Arc::clone(&self.index), _index_worker: None, index_gate: Arc::clone(&self.index_gate), listing: None }
    }
    fn cached_info(&mut self) -> Result<WorkspaceInfo, String> {
        if let Some(info) = &self.listing { return Ok(info.clone()); }
        self.save_info()
    }
    fn indexed_info(&mut self) -> Result<WorkspaceInfo, String> {
        let index = self.index.try_lock().map_err(|_| "file-index-busy".to_owned())?;
        let Some(index) = index.as_ref() else { return Err("file-index-busy".into()); };
        let encodings = index.text_encodings()?;
        let mut files = Vec::new();
        for (path, utf8) in encodings {
            let target = self.root.join(&path);
            let Ok(metadata) = fs::metadata(&target) else { continue; };
            if !metadata.is_file() { continue; }
            let convertible = matches!(target.extension().and_then(|part| part.to_str()).map(str::to_ascii_lowercase).as_deref(), Some("docx" | "pdf"));
            files.push(FileEntry { relative_path: path, updated: timestamp(metadata.modified()).unwrap_or(0), created: timestamp(metadata.created()), excerpt: String::new(), openable: convertible || utf8.unwrap_or(true), utf8, hidden: hidden_path(&self.root, &target) });
        }
        files.sort_by(|a, b| a.relative_path.cmp(&b.relative_path));
        self.allowed = files.iter().map(|file| file.relative_path.clone()).collect();
        let mut directory_paths: std::collections::BTreeSet<String> = index.directory_paths()?.into_iter().filter(|path| !path.is_empty() && self.root.join(path).is_dir()).collect();
        for file in &files {
            let parts: Vec<_> = file.relative_path.split('/').collect();
            for depth in 1..parts.len() { directory_paths.insert(parts[..depth].join("/")); }
        }
        let directories = directory_paths.into_iter().collect();
        Ok(WorkspaceInfo { name: self.root.file_name().and_then(|name| name.to_str()).unwrap_or("当前目录").to_owned(), root: self.root.to_string_lossy().into_owned(), directories, files })
    }

    fn info(&self) -> Result<WorkspaceInfo, String> {
        let mut allowed = HashSet::new();
        let mut files = Vec::new();
        let mut directories = Vec::new();
        scan(
            &self.root,
            &self.root,
            &mut allowed,
            &mut files,
            &mut directories,
        )
        .map_err(|error| error.to_string())?;
        files.sort_by(|a, b| a.relative_path.cmp(&b.relative_path));
        directories.sort();
        self.refresh_file_index(&mut files, &directories);
        Ok(WorkspaceInfo {
            name: self
                .root
                .file_name()
                .and_then(|name| name.to_str())
                .unwrap_or("当前目录")
                .to_owned(),
            root: self.root.to_string_lossy().into_owned(),
            directories,
            files,
        })
    }

    fn complete_links(&self, root: &str, source: &str, query: &str, folder: Option<&str>) -> Result<Vec<crate::file_index::CompletionEntry>, String> {
        if self.root.to_string_lossy() != root { return Err("文件夹已切换，请重新输入".into()); }
        if !source.is_empty() { valid_relative(source)?; }
        if let Some(folder) = folder.filter(|folder|!folder.is_empty()) { valid_relative(folder)?; }
        if query.len() > 4096 { return Ok(Vec::new()); }
        self.index.lock().map_err(|e|e.to_string())?.as_ref().ok_or("文件索引不可用，请重新打开文件夹")?.complete_links(source, query, folder)
    }

    fn source_item(&self, relative_path: &str) -> Result<PathBuf, String> {
        let relative = valid_relative(relative_path)?;
        let mut path = self.root.clone();
        for part in relative.components() {
            path.push(part.as_os_str());
            if fs::symlink_metadata(&path)
                .map_err(|error| error.to_string())?
                .file_type()
                .is_symlink()
            {
                return Err("不允许操作符号链接".into());
            }
        }
        let canonical = fs::canonicalize(path).map_err(|error| error.to_string())?;
        if !canonical.starts_with(&self.root) {
            return Err("项目超出当前目录".into());
        }
        Ok(canonical)
    }

    fn new_path(&self, relative_path: &str) -> Result<PathBuf, String> {
        let relative = valid_relative(relative_path)?;
        let candidate = self.root.join(relative);
        match fs::symlink_metadata(&candidate) {
            Ok(_) => return Err("已存在同名文件或文件夹，请换个名称".into()),
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => {}
            Err(error) => return Err(format!("目标不可访问：{error}")),
        }
        let parent = candidate.parent().ok_or("目标目录无效")?;
        let parent_relative = parent
            .strip_prefix(&self.root)
            .map_err(|error| error.to_string())?
            .to_str()
            .ok_or("路径编码无效")?;
        let canonical_parent = if parent_relative.is_empty() {
            self.root.clone()
        } else {
            self.source_item(parent_relative)?
        };
        if !canonical_parent.is_dir() {
            return Err("目标父目录不是文件夹".into());
        }
        Ok(candidate)
    }

    fn ensure_source_fresh(&self, relative_path: &str) -> Result<(), String> {
        let prefix = format!("{relative_path}/");
        for (path, original) in &self.originals {
            if path == relative_path || path.starts_with(&prefix) {
                let target = self.resolve(path)?;
                if &fs::read(target).map_err(|error| error.to_string())? != original {
                    return Err("文件已在外部修改，请先比较并处理冲突".into());
                }
            }
        }
        Ok(())
    }

    #[cfg(test)]
    pub fn create_markdown(&mut self, relative_path: &str) -> Result<WorkspaceInfo, String> {
        self.create_markdown_with_content(relative_path, "")
    }

    pub fn create_markdown_with_content(&mut self, relative_path: &str, content: &str) -> Result<WorkspaceInfo, String> {
        if !matches!(Path::new(relative_path).extension().and_then(|part| part.to_str()).map(str::to_ascii_lowercase).as_deref(), Some("md" | "markdown" | "mdown" | "mkd")) {
            return Err("文件名需以 .md、.markdown、.mdown 或 .mkd 结尾".into());
        }
        if content.len() > 20 * 1024 * 1024 { return Err("模板超过 20 MB，请减少内容".into()); }
        let target = self.new_path(relative_path)?;
        let mut file = File::create_new(&target).map_err(|error| error.to_string())?;
        if let Err(error) = file.write_all(content.as_bytes()).and_then(|_| file.sync_all()) {
            let _ = fs::remove_file(&target);
            return Err(error.to_string());
        }
        self.allowed.insert(relative_path.to_owned());
        self.info()
    }

    pub fn create_folder(&mut self, relative_path: &str) -> Result<WorkspaceInfo, String> {
        let target = self.new_path(relative_path)?;
        fs::create_dir(&target).map_err(|error| error.to_string())?;
        self.info()
    }

    pub fn convert_text_to_markdown(&mut self, source: &str, target: &str) -> Result<WorkspaceInfo, String> {
        let source_path = self.resolve(source)?;
        if !matches!(source_path.extension().and_then(|part| part.to_str()).map(str::to_ascii_lowercase).as_deref(), Some("txt" | "text")) {
            return Err("仅纯文本文件可以另存为 Markdown".into());
        }
        if !matches!(Path::new(target).extension().and_then(|part| part.to_str()).map(str::to_ascii_lowercase).as_deref(), Some("md" | "markdown" | "mdown" | "mkd")) {
            return Err("请将文件保存为 Markdown 格式（.md）".into());
        }
        let bytes = fs::read(source_path).map_err(|error| error.to_string())?;
        let text = &bytes[if bytes.starts_with(UTF8_BOM) { 3 } else { 0 }..];
        std::str::from_utf8(text).map_err(|_| "请将文本转为 UTF-8 编码后转换")?;
        let target_path = self.new_path(target)?;
        let mut output = File::create_new(&target_path).map_err(|error| error.to_string())?;
        if let Err(error) = output.write_all(&bytes).and_then(|_| output.sync_all()) {
            let _ = fs::remove_file(&target_path);
            return Err(error.to_string());
        }
        self.allowed.insert(target.to_owned());
        self.info()
    }

    pub fn import_image(&self, source: &Path, document: &str, directory: &str, preferred_stem: Option<&str>) -> Result<String, String> {
        self.resolve(document)?;
        image_mime(source)?;
        if fs::metadata(source).map_err(|error| error.to_string())?.len() > 20 * 1024 * 1024 {
            return Err("图片超过 20 MB，请压缩后插入".into());
        }
        let relative_dir = valid_relative(directory)?;
        let mut folder = PathBuf::new();
        for part in relative_dir.components() {
            folder.push(part.as_os_str());
            let relative = folder.to_str().ok_or("附件目录编码无效")?;
            if !self.root.join(&folder).exists() {
                fs::create_dir(self.new_path(relative)?).map_err(|error| error.to_string())?;
            } else if !self.source_item(relative)?.is_dir() {
                return Err("附件目录路径包含文件".into());
            }
        }
        let source_stem = source.file_stem().and_then(|part| part.to_str()).ok_or("图片文件名无效")?;
        let stem = preferred_stem.filter(|value| !value.is_empty() && value.len() <= 120 && value.chars().all(|character| character.is_alphanumeric() || matches!(character, '-' | '_'))).unwrap_or(source_stem);
        let extension = source.extension().and_then(|part| part.to_str()).ok_or("图片扩展名无效")?;
        let mut imported = None;
        for number in 0..1000 {
            let name = if number == 0 { format!("{stem}.{extension}") } else { format!("{stem}-{number}.{extension}") };
            let relative = folder.join(name);
            let target = self.root.join(&relative);
            let mut output = match fs::OpenOptions::new().write(true).create_new(true).open(&target) {
                Ok(output) => output,
                Err(error) if error.kind() == std::io::ErrorKind::AlreadyExists => continue,
                Err(error) => return Err(error.to_string()),
            };
            let result = (|| -> std::io::Result<()> {
                let mut input = File::open(source)?;
                std::io::copy(&mut input, &mut output)?;
                output.sync_all()
            })();
            if let Err(error) = result { let _ = fs::remove_file(&target); return Err(error.to_string()); }
            imported = Some(relative);
            break;
        }
        let imported = imported.ok_or("附件目录中重名图片过多")?;
        let parent = Path::new(document).parent().unwrap_or(Path::new(""));
        let from: Vec<_> = parent.components().collect();
        let to: Vec<_> = imported.components().collect();
        let shared = from.iter().zip(&to).take_while(|(a, b)| a == b).count();
        let mut parts = vec!["..".to_owned(); from.len() - shared];
        parts.extend(to[shared..].iter().map(|part| url_segment(&part.as_os_str().to_string_lossy())));
        Ok(parts.join("/"))
    }

    pub fn read_image(&self, document: &str, target: &str) -> Result<String, String> {
        self.resolve(document)?;
        if target.starts_with('/') || target.contains(':') || target.contains('?') || target.contains('#') {
            return Err("请使用当前文件夹内的相对图片路径".into());
        }
        let decoded = percent_encoding::percent_decode_str(target).decode_utf8().map_err(|error| error.to_string())?;
        let parent = Path::new(document).parent().unwrap_or(Path::new(""));
        let canonical = fs::canonicalize(self.root.join(parent).join(decoded.as_ref())).map_err(|error| error.to_string())?;
        if !canonical.starts_with(&self.root) || !canonical.is_file() {
            return Err("无法访问图片，请检查图片路径是否位于当前文件夹内".into());
        }
        let mime = image_mime(&canonical)?;
        if fs::metadata(&canonical).map_err(|error| error.to_string())?.len() > 20 * 1024 * 1024 {
            return Err("图片超过 20 MB，请压缩后插入".into());
        }
        let bytes = fs::read(canonical).map_err(|error| error.to_string())?;
        Ok(format!("data:{mime};base64,{}", base64::engine::general_purpose::STANDARD.encode(bytes)))
    }

    fn validate_move(&self, from: &str, to: &str) -> Result<(PathBuf, PathBuf), String> {
        let source = self.source_item(from)?;
        self.ensure_source_fresh(from)?;
        let target = self.new_path(to)?;
        if source.is_file() && !self.allowed.contains(from) {
            return Err("文件不在当前文件夹中，请重新打开所在文件夹".into());
        }
        if source.is_file() && source.extension().and_then(|ext| ext.to_str()).map(str::to_ascii_lowercase)
            != target.extension().and_then(|ext| ext.to_str()).map(str::to_ascii_lowercase) {
            return Err("移动或重命名时请保留原扩展名".into());
        }
        if source.is_dir() && target.starts_with(&source) {
            return Err("不能将文件夹移入它的子文件夹".into());
        }
        Ok((source, target))
    }

    fn apply_move_index(&mut self, from: &str, to: &str) {
        let prefix = format!("{from}/");
        let updates: Vec<(String, String)> = self.allowed.iter().filter_map(|path| {
            path.strip_prefix(&prefix).map(|tail| (path.clone(), format!("{to}/{tail}")))
                .or_else(|| (path == from).then(|| (path.clone(), to.to_owned())))
        }).collect();
        for (old, new) in updates {
            self.allowed.remove(&old);
            self.allowed.insert(new.clone());
            if let Some(original) = self.originals.remove(&old) {
                self.originals.insert(new, original);
            }
        }
    }

    #[cfg(test)]
    pub fn move_item(&mut self, from: &str, to: &str) -> Result<(), String> {
        let (source, target) = self.validate_move(from, to)?;
        fs::rename(&source, &target).map_err(|error| error.to_string())?;
        self.apply_move_index(from, to);
        Ok(())
    }

    fn plan_move(&self, from: &str, to: &str) -> Result<(String, Vec<PlannedRewrite>), String> {
        self.validate_move(from, to)?;
        // Reconcile against disk before querying: external changes must not hide references.
        let mut files = Vec::new();
        let mut directories = Vec::new();
        scan(&self.root, &self.root, &mut HashSet::new(), &mut files, &mut directories).map_err(|e|e.to_string())?;
        let paths: Vec<_> = files.iter().map(|file|file.relative_path.clone()).collect();
        let indexed = self.index.lock().map_err(|e|e.to_string()).and_then(|mut guard| {
            let index = guard.as_mut().ok_or("file index unavailable")?;
            index.reconcile_with_directories(&self.root, &paths, &directories)?;
            Ok((index.move_sources(from)?, index.fingerprint()?))
        });
        let (mut markdown, fingerprint) = match indexed {
            Ok(value) => value,
            Err(error) => {
                log::warn!("File index move fallback: {error}");
                (paths.into_iter().filter(|path| matches!(Path::new(path).extension().and_then(|part|part.to_str()).map(str::to_ascii_lowercase).as_deref(),Some("md"|"markdown"|"mdown"|"mkd"))).collect(), String::new())
            }
        };
        markdown.sort();
        let mut digest = Sha256::new();
        digest.update(from.as_bytes()); digest.update([0]); digest.update(to.as_bytes()); digest.update(fingerprint);
        let mut rewrites = Vec::new();
        for old_path in markdown {
            let physical = self.source_item(&old_path)?;
            let old_bytes = fs::read(physical).map_err(|error| error.to_string())?;
            digest.update(old_path.as_bytes()); digest.update([0]); digest.update(&old_bytes);
            let bom = old_bytes.starts_with(UTF8_BOM);
            let content = std::str::from_utf8(&old_bytes[if bom { 3 } else { 0 }..])
                .map_err(|_| format!("{old_path} 不是 UTF-8 Markdown，无法安全更新引用"))?;
            let new_path = if old_path == from { to.to_owned() }
                else if let Some(tail) = old_path.strip_prefix(&format!("{from}/")) { format!("{to}/{tail}") }
                else { old_path.clone() };
            let (next, changes) = rewrite_markdown(content, &old_path, &new_path, from, to, |target| {
                self.source_item(target).is_ok()
            });
            if !changes.is_empty() {
                let mut new_bytes = if bom { UTF8_BOM.to_vec() } else { Vec::new() };
                new_bytes.extend_from_slice(next.as_bytes());
                rewrites.push(PlannedRewrite { old_path, new_path, old_bytes, new_bytes, changes });
            }
        }
        Ok((format!("{:x}", digest.finalize()), rewrites))
    }

    pub fn preview_move_item(&self, from: &str, to: &str) -> Result<MovePreview, String> {
        let (token, rewrites) = self.plan_move(from, to)?;
        Ok(MovePreview { token, links: rewrites.into_iter().map(|entry| MoveLinkPreview {
            relative_path: entry.old_path, changes: entry.changes,
        }).collect() })
    }

    pub fn move_item_with_links(&mut self, from: &str, to: &str, token: &str) -> Result<MoveResult, String> {
        // Keep watcher events from deleting the old identity between rename and reindexing.
        let gate = Arc::clone(&self.index_gate);
        let _moving = gate.lock().map_err(|e|e.to_string())?;
        let (current_token, rewrites) = self.plan_move(from, to)?;
        if current_token != token { return Err("文件已修改，请重新预览移动结果".into()); }
        let (source, target) = self.validate_move(from, to)?;
        fs::rename(&source, &target).map_err(|error| error.to_string())?;
        let mut completed: Vec<&PlannedRewrite> = Vec::new();
        for rewrite in &rewrites {
            let path = self.root.join(&rewrite.new_path);
            let result = replace_file(&path, &rewrite.new_bytes, || {
                if fs::read(&path)? == rewrite.old_bytes { Ok(()) }
                else { Err(std::io::Error::other("file changed while moving")) }
            });
            if let Err(error) = result {
                let mut rollback_errors = Vec::new();
                if fs::read(&path).is_ok_and(|bytes| bytes == rewrite.new_bytes) {
                    if let Err(rollback) = replace_file(&path, &rewrite.old_bytes, || Ok(())) {
                        rollback_errors.push(format!("{}: {rollback}", rewrite.new_path));
                    }
                }
                for done in completed.into_iter().rev() {
                    if let Err(rollback) = replace_file(&self.root.join(&done.new_path), &done.old_bytes, || Ok(())) {
                        rollback_errors.push(format!("{}: {rollback}", done.new_path));
                    }
                }
                if let Err(rollback) = fs::rename(&target, &source) { rollback_errors.push(format!("文件移动: {rollback}")); }
                return Err(format!("引用更新失败：{error}；回退结果：{}", if rollback_errors.is_empty() { "已回退".to_owned() } else { rollback_errors.join("；") }));
            }
            completed.push(rewrite);
        }
        if let Ok(mut index) = self.index.lock() {
            if let Some(index) = index.as_mut() {
                if let Err(error) = index.moved(from, to) { log::warn!("File index move: {error}"); }
            }
        }
        self.apply_move_index(from, to);
        let _ = self.info();
        let updated = rewrites.into_iter().map(|entry| {
            let version = format!("{:x}", Sha256::digest(&entry.new_bytes));
            self.originals.insert(entry.new_path.clone(), entry.new_bytes.clone());
            MoveUpdatedDocument { relative_path: entry.new_path, content: String::from_utf8_lossy(&entry.new_bytes).trim_start_matches('\u{feff}').to_owned(), version }
        }).collect();
        Ok(MoveResult { updated })
    }

    pub fn check_local_resources(&self, relative_path: Option<&str>, current_content: Option<&str>) -> Result<Vec<MissingResource>, String> {
        let mut sources: Vec<_> = if let Some(path) = relative_path {
            self.resolve(path)?;
            vec![path.to_owned()]
        } else {
            self.allowed.iter().filter(|path| {
                matches!(Path::new(path).extension().and_then(|part| part.to_str()).map(str::to_ascii_lowercase).as_deref(), Some("md" | "markdown" | "mdown" | "mkd"))
            }).cloned().collect()
        };
        sources.sort();
        let mut missing = Vec::new();
        for source in sources {
            let content = if relative_path == Some(source.as_str()) {
                if let Some(content) = current_content { content.to_owned() }
                else { fs::read_to_string(self.resolve(&source)?).map_err(|error| error.to_string())? }
            } else { fs::read_to_string(self.resolve(&source)?).map_err(|error| error.to_string())? };
            for reference in local_references(content.trim_start_matches('\u{feff}'), &source) {
                if self.source_item(&reference.resolved).is_err() {
                    missing.push(MissingResource { source: source.clone(), line: reference.line, target: reference.target, resolved: reference.resolved });
                }
            }
        }
        Ok(missing)
    }

    fn linked_item(&self, source: &str, target: &str) -> Result<PathBuf, String> {
        self.resolve(source)?;
        let synthetic = format!("[target]({target})");
        let reference = local_references(&synthetic, source).into_iter().next().ok_or("请填写当前文件夹内的相对路径")?;
        if reference.resolved.is_empty() { return Ok(self.root.clone()); }
        self.source_item(&reference.resolved)
    }

    pub fn validate_local_resource_target(&self, source: &str, target: &str) -> Result<(), String> {
        self.resolve(source)?;
        let synthetic = format!("[target]({target})");
        let reference = local_references(&synthetic, source).into_iter().next().ok_or("请填写当前文件夹内的相对路径")?;
        self.source_item(&reference.resolved).map_err(|_| "无法访问新路径，请检查目标文件是否存在".to_owned())?;
        Ok(())
    }

    pub fn trash_item(&mut self, relative_path: &str) -> Result<WorkspaceInfo, String> {
        let target = self.source_item(relative_path)?;
        self.ensure_source_fresh(relative_path)?;
        if target.is_file() && !self.allowed.contains(relative_path) {
            return Err("文件不在当前文件夹中，请重新打开所在文件夹".into());
        }
        #[cfg(target_os = "macos")]
        {
            use objc2_foundation::{NSFileManager, NSString, NSURL};
            let url =
                NSURL::fileURLWithPath(&NSString::from_str(target.to_str().ok_or("路径编码无效")?));
            NSFileManager::defaultManager()
                .trashItemAtURL_resultingItemURL_error(&url, None)
                .map_err(|error| format!("移入废纸篓失败：{error}"))?;
        }
        #[cfg(not(target_os = "macos"))]
        {
            return Err("移入废纸篓仅支持 macOS".into());
        }
        let prefix = format!("{relative_path}/");
        self.allowed
            .retain(|path| path != relative_path && !path.starts_with(&prefix));
        self.originals
            .retain(|path, _| path != relative_path && !path.starts_with(&prefix));
        self.info()
    }
    fn save_info(&mut self) -> Result<WorkspaceInfo, String> {
        let mut files = Vec::new();
        let mut directories = Vec::new();
        scan_entries(&self.root, &self.root, &mut self.allowed, &mut files, &mut directories, false).map_err(|error| error.to_string())?;
        files.sort_by(|a, b| a.relative_path.cmp(&b.relative_path));
        directories.sort();
        if let Ok(encodings) = crate::file_index::FileIndex::cached_text_encodings(&self.root) { apply_file_encodings(&encodings, &mut files); }
        let info = WorkspaceInfo { name: self.root.file_name().and_then(|name| name.to_str()).unwrap_or("当前目录").to_owned(), root: self.root.to_string_lossy().into_owned(), files, directories };
        self.listing = Some(info.clone());
        Ok(info)
    }
    fn open_interactive(path: &Path, app: Option<AppHandle>) -> Result<(Self, WorkspaceInfo), String> { Self::open_with_indexing(path, false, app) }

    #[cfg(test)]
    pub fn open(path: &Path) -> Result<(Self, WorkspaceInfo), String> { Self::open_with_indexing(path, true, None) }
    fn open_with_indexing(path: &Path, eager: bool, app: Option<AppHandle>) -> Result<(Self, WorkspaceInfo), String> {
        let root = fs::canonicalize(path).map_err(|error| format!("文件夹无法访问：{error}"))?;
        if !root.is_dir() {
            return Err("请选择文件夹".into());
        }
        let mut allowed = HashSet::new();
        let mut files = Vec::new();
        let mut directories = Vec::new();
        scan_entries(&root, &root, &mut allowed, &mut files, &mut directories, eager)
            .map_err(|error| format!("文件夹读取失败：{error}"))?;
        files.sort_by(|a, b| a.relative_path.cmp(&b.relative_path));
        directories.sort();
        let name = root
            .file_name()
            .and_then(|name| name.to_str())
            .unwrap_or("当前目录")
            .to_owned();
        if !eager {
            if let Ok(encodings) = crate::file_index::FileIndex::cached_text_encodings(&root) { apply_file_encodings(&encodings, &mut files); }
        }
        let index = if !eager { None } else { match crate::file_index::FileIndex::for_root(&root) {
            Ok(mut index) => {
                if eager { if let Err(error) = index.reconcile_with_directories(&root, &files.iter().map(|file|file.relative_path.clone()).collect::<Vec<_>>(), &directories).and_then(|_| apply_index_file_types(&index, &mut files)) { log::warn!("File index initialization: {error}"); } }
                Some(index)
            },
            Err(error) => { log::warn!("File index unavailable: {error}"); None }
        } };
        let index = Arc::new(Mutex::new(index));
        let index_gate = Arc::new(Mutex::new(()));
        #[cfg(test)] let _ = app;
        #[cfg(not(test))]
        let worker = match crate::index_worker::IndexWorker::start_notifying(root.clone(), Arc::clone(&index), Arc::clone(&index_gate), app.map(|app| {
            let root = root.to_string_lossy().into_owned();
            Box::new(move || { let _ = app.emit("markart-workspace-indexed", &root); }) as Box<dyn Fn() + Send>
        })) {
            Ok(worker) => Some(worker),
            Err(error) => { log::warn!("File index watcher unavailable: {error}"); None }
        };
        #[cfg(test)]
        let worker = None;
        let info = WorkspaceInfo { name, root: root.to_string_lossy().into_owned(), directories, files };
        Ok((Self { root, allowed, originals: HashMap::new(), index, _index_worker: worker, index_gate, listing: Some(info.clone()) }, info))
    }

    pub(crate) fn resolve(&self, relative_path: &str) -> Result<PathBuf, String> {
        let relative = valid_relative(relative_path)?;
        if !self.allowed.contains(relative_path) {
            return Err("文件不在当前文件夹中，请重新打开所在文件夹".into());
        }
        let mut current = self.root.clone();
        for component in relative.components() {
            current.push(component.as_os_str());
            let metadata =
                fs::symlink_metadata(&current).map_err(|error| format!("文件不可访问：{error}"))?;
            if metadata.file_type().is_symlink() {
                return Err("不允许访问符号链接".into());
            }
        }
        let canonical =
            fs::canonicalize(&current).map_err(|error| format!("文件不可访问：{error}"))?;
        if !canonical.starts_with(&self.root) {
            return Err("文件不在当前文件夹内，请打开它所在的文件夹".into());
        }
        if !fs::metadata(&canonical)
            .map_err(|error| error.to_string())?
            .is_file()
        {
            return Err("请选择文件".into());
        }
        Ok(canonical)
    }

    pub fn read(&mut self, relative_path: &str) -> Result<OpenedDocument, String> {
        if matches!(Path::new(relative_path).extension().and_then(|part| part.to_str()).map(str::to_ascii_lowercase).as_deref(), Some("docx" | "pdf")) { return Err("此文件需先转换为 Markdown 后编辑".into()); }
        let target = self.resolve(relative_path)?;
        let bytes = fs::read(&target).map_err(|error| format!("读取失败：{error}"))?;
        if binary_document(&bytes) { return Err("此文件是二进制文件，无法作为文本打开".into()); }
        if !supported_document(&target) && std::str::from_utf8(&bytes).is_err() { return Err("文件不是 UTF-8 文本，无法打开".into()); }
        let has_bom = bytes.starts_with(UTF8_BOM);
        let (content, detected_encoding) = decode_document(&bytes)?;
        let mut has_crlf = false;
        let mut has_lf = false;
        let mut has_cr = false;
        let source = content.as_bytes();
        let mut index = 0;
        while index < source.len() {
            match source[index] {
                b'\r' if source.get(index + 1) == Some(&b'\n') => {
                    has_crlf = true;
                    index += 2;
                }
                b'\r' => {
                    has_cr = true;
                    index += 1;
                }
                b'\n' => {
                    has_lf = true;
                    index += 1;
                }
                _ => index += 1,
            }
        }
        if (has_cr || (has_crlf && has_lf)) && matches!(Path::new(relative_path).extension().and_then(|part| part.to_str()).map(str::to_ascii_lowercase).as_deref(), Some("md" | "markdown" | "mdown" | "mkd")) {
            return Err("文件使用了不支持的换行格式，请统一为 LF 或 CRLF；原文件未修改".into());
        }
        let version = format!("{:x}", Sha256::digest(&bytes));
        self.originals.insert(relative_path.to_owned(), bytes);
        Ok(OpenedDocument {
            content,
            encoding: if has_bom { "UTF-8 BOM" } else { detected_encoding },
            version,
        })
    }

    pub fn save(
        &mut self,
        relative_path: &str,
        content: &str,
        expected_version: &str,
    ) -> Result<SavedDocument, String> {
        let target = self.resolve(relative_path)?;
        let original = self
            .originals
            .get(relative_path)
            .ok_or("请重新打开文件后保存")?;
        if format!("{:x}", Sha256::digest(original)) != expected_version {
            return Err("草稿基于旧磁盘版本，未覆盖文件；请先处理冲突".into());
        }
        let current = fs::read(&target).map_err(|error| format!("保存前无法读取文件：{error}"))?;
        if &current != original {
            return Err("文件已在外部修改，未覆盖；请先比较差异".into());
        }
        let original_encoding = if original.starts_with(UTF8_BOM) { "UTF-8 BOM" } else { decode_document(original)?.1 };
        let mut next = Vec::with_capacity(content.len() + 3);
        if original_encoding == "UTF-8 BOM" {
            next.extend_from_slice(UTF8_BOM);
        }
        next.extend_from_slice(&encode_document(content, if original_encoding == "UTF-8 BOM" { "UTF-8" } else { original_encoding })?);
        if next != current {
            replace_file(&target, &next, || ensure_unchanged(&target, original))
                .map_err(|error| format!("安全写入失败：{error}"))?;
            self.originals.insert(relative_path.to_owned(), next);
        }
        let updated =
            timestamp(fs::metadata(&target).and_then(|meta| meta.modified())).unwrap_or(0);
        let version = format!(
            "{:x}",
            Sha256::digest(self.originals.get(relative_path).ok_or("保存版本丢失")?)
        );
        if let Ok(mut index) = self.index.lock() {
            if let Some(index) = index.as_mut() {
                if let Err(error) = index.update(&self.root, relative_path) { log::warn!("File index save: {error}"); }
            }
        }
        Ok(SavedDocument { updated, version, git_warning: None })
    }

    pub fn inspect(&self, relative_path: &str) -> Result<DiskStatus, String> {
        let original = self.originals.get(relative_path).ok_or("请先读取文件")?;
        let target = match self.resolve(relative_path) {
            Ok(target) => target,
            Err(error) => {
                return Ok(DiskStatus {
                    changed: true,
                    missing: true,
                    content: Some(error),
                })
            }
        };
        let current = fs::read(&target).map_err(|error| format!("读取磁盘版本失败：{error}"))?;
        let changed = &current != original;
        let content = if changed {
            let body = if current.starts_with(UTF8_BOM) {
                &current[3..]
            } else {
                &current[..]
            };
            Some(
                String::from_utf8(body.to_vec())
                    .unwrap_or_else(|_| "[磁盘文件不是 UTF-8，无法文本比较]".into()),
            )
        } else {
            None
        };
        Ok(DiskStatus {
            changed,
            missing: false,
            content,
        })
    }

    fn draft_file(&self, app: &AppHandle, relative_path: &str) -> Result<PathBuf, String> {
        valid_relative(relative_path)?;
        let key = format!("{}\0{}", self.root.display(), relative_path);
        let digest = Sha256::digest(key.as_bytes());
        let directory = app
            .path()
            .app_data_dir()
            .map_err(|error| error.to_string())?
            .join("drafts");
        fs::create_dir_all(&directory).map_err(|error| format!("草稿目录不可写：{error}"))?;
        Ok(directory.join(format!("{digest:x}.json")))
    }

    pub fn write_draft(
        &self,
        app: &AppHandle,
        relative_path: &str,
        content: &str,
        expected_version: &str,
    ) -> Result<(), String> {
        let path = self.draft_file(app, relative_path)?;
        self.originals.get(relative_path).ok_or("请先读取文件")?;
        if expected_version.len() != 64
            || !expected_version
                .bytes()
                .all(|byte| byte.is_ascii_hexdigit())
        {
            return Err("草稿版本无效".into());
        }
        let draft = Draft {
            relative_path: relative_path.to_owned(),
            content: content.to_owned(),
            baseline_hash: expected_version.to_owned(),
            updated: timestamp(Ok(std::time::SystemTime::now())).unwrap_or(0),
        };
        write_draft_file(&path, &draft)
    }

    pub fn load_draft(
        &self,
        app: &AppHandle,
        relative_path: &str,
    ) -> Result<Option<DraftPreview>, String> {
        let path = self.draft_file(app, relative_path)?;
        let Some(draft) = read_draft_file(&path)? else {
            return Ok(None);
        };
        if draft.relative_path != relative_path {
            return Err("草稿路径不匹配".into());
        }
        let current = self
            .resolve(relative_path)
            .ok()
            .and_then(|target| fs::read(target).ok());
        let disk_changed = current
            .as_ref()
            .is_none_or(|bytes| format!("{:x}", Sha256::digest(bytes)) != draft.baseline_hash);
        Ok(Some(DraftPreview {
            content: draft.content,
            updated: draft.updated,
            baseline_hash: draft.baseline_hash,
            disk_changed,
        }))
    }

    pub fn clear_draft(&self, app: &AppHandle, relative_path: &str) -> Result<(), String> {
        let path = self.draft_file(app, relative_path)?;
        match fs::remove_file(path) {
            Ok(()) => Ok(()),
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(()),
            Err(error) => Err(error.to_string()),
        }
    }
}

fn scan(
    root: &Path,
    directory: &Path,
    allowed: &mut HashSet<String>,
    files: &mut Vec<FileEntry>,
    directories: &mut Vec<String>,
) -> std::io::Result<()> {
    scan_entries(root, directory, allowed, files, directories, true)
}
fn scan_entries(root: &Path, directory: &Path, allowed: &mut HashSet<String>, files: &mut Vec<FileEntry>, directories: &mut Vec<String>, previews: bool) -> std::io::Result<()> {
    for entry in fs::read_dir(directory)? {
        let entry = entry?;
        let path = entry.path();
        let metadata = fs::symlink_metadata(&path)?;
        if metadata.file_type().is_symlink() {
            if let Some(relative) = path.strip_prefix(root).ok().and_then(|path| path.to_str()) {
                files.push(FileEntry { relative_path: relative.to_owned(), updated: timestamp(metadata.modified()).unwrap_or(0), created: timestamp(metadata.created()), excerpt: String::new(), openable: false, utf8: None, hidden: hidden_path(root, &path) });
            }
            continue;
        }
        if metadata.is_dir() {
            if let Some(relative) = path.strip_prefix(root).ok().and_then(|path| path.to_str()) {
                directories.push(relative.to_owned());
            }
            scan_entries(root, &path, allowed, files, directories, previews)?;
        } else if metadata.is_file() {
            if let Some(relative_path) = path.strip_prefix(root).ok().and_then(|path| path.to_str())
            {
                let relative_path = relative_path.to_owned();
                allowed.insert(relative_path.clone());
                let convertible = matches!(path.extension().and_then(|part| part.to_str()).map(str::to_ascii_lowercase).as_deref(), Some("docx" | "pdf"));
                let openable = true;
                files.push(FileEntry {
                    relative_path,
                    openable,
                    utf8: None,
                    hidden: hidden_path(root, &path),
                    updated: timestamp(metadata.modified()).unwrap_or(0),
                    created: timestamp(metadata.created()),
                    excerpt: if !previews || convertible || !openable { String::new() } else { preview_excerpt(&path) },
                });
            }
        }
    }
    Ok(())
}

fn text_preview_openable(path: &Path) -> bool {
    let Ok(file) = File::open(path) else { return false };
    let mut bytes = Vec::new();
    if file.take(8192).read_to_end(&mut bytes).is_err() || binary_document(&bytes) { return false; }
    supported_document(path) || match std::str::from_utf8(&bytes) { Ok(_) => true, Err(error) => error.error_len().is_none() }
}

fn preview_excerpt(path: &Path) -> String {
    let Ok(file) = File::open(path) else { return String::new() };
    let mut bytes = Vec::new();
    if file.take(2048).read_to_end(&mut bytes).is_err() { return String::new() }
    if binary_document(&bytes) { return String::new(); }
    String::from_utf8_lossy(&bytes)
        .trim_start_matches('\u{feff}')
        .lines()
        .map(str::trim)
        .filter(|line| !line.is_empty())
        .take(2)
        .collect::<Vec<_>>()
        .join(" ")
        .chars()
        .take(240)
        .collect()
}

fn ensure_unchanged(target: &Path, original: &[u8]) -> std::io::Result<()> {
    if fs::read(target)? != original {
        return Err(std::io::Error::new(
            std::io::ErrorKind::AlreadyExists,
            "文件在写入期间被修改",
        ));
    }
    Ok(())
}

fn write_draft_file(path: &Path, draft: &Draft) -> Result<(), String> {
    let parent = path.parent().ok_or("草稿路径无效")?;
    let mut staged = tempfile::NamedTempFile::new_in(parent).map_err(|error| error.to_string())?;
    serde_json::to_writer(&mut staged, draft).map_err(|error| error.to_string())?;
    staged
        .as_file()
        .sync_all()
        .map_err(|error| error.to_string())?;
    staged
        .persist(path)
        .map_err(|error| error.error.to_string())?;
    File::open(parent)
        .and_then(|file| file.sync_all())
        .map_err(|error| error.to_string())
}

fn read_draft_file(path: &Path) -> Result<Option<Draft>, String> {
    let bytes = match fs::read(path) {
        Ok(bytes) => bytes,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(None),
        Err(error) => return Err(error.to_string()),
    };
    serde_json::from_slice(&bytes)
        .map(Some)
        .map_err(|error| format!("草稿损坏：{error}"))
}

fn replace_file(
    target: &Path,
    bytes: &[u8],
    before_rename: impl FnOnce() -> std::io::Result<()>,
) -> std::io::Result<()> {
    let parent = target
        .parent()
        .ok_or_else(|| std::io::Error::other("missing parent"))?;
    let metadata = fs::symlink_metadata(target)?;
    if !metadata.is_file() {
        return Err(std::io::Error::other("target is not a regular file"));
    }
    let mut staged = tempfile::NamedTempFile::new_in(parent)?;
    staged.write_all(bytes)?;
    staged.as_file().set_permissions(metadata.permissions())?;
    staged.as_file().sync_all()?;
    before_rename()?;
    let rechecked = fs::symlink_metadata(target)?;
    if !rechecked.is_file() {
        return Err(std::io::Error::other("target changed before replacement"));
    }
    staged.persist(target).map_err(|error| error.error)?;
    File::open(parent)?.sync_all()?;
    Ok(())
}

fn recent_path(app: &AppHandle) -> Result<PathBuf, String> {
    let directory = app
        .path()
        .app_data_dir()
        .map_err(|error| error.to_string())?;
    fs::create_dir_all(&directory).map_err(|error| error.to_string())?;
    Ok(directory.join("recent-workspaces.json"))
}

fn read_recent(app: &AppHandle) -> Result<Vec<String>, String> {
    match fs::read(recent_path(app)?) {
        Ok(bytes) => {
            serde_json::from_slice(&bytes).map_err(|error| format!("最近文件夹记录无法读取：{error}"))
        }
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(Vec::new()),
        Err(error) => Err(error.to_string()),
    }
}

fn record_recent(app: &AppHandle, root: &str) -> Result<(), String> {
    let path = recent_path(app)?;
    let mut recent = read_recent(app)?;
    recent.retain(|item| item != root);
    recent.insert(0, root.to_owned());
    recent.truncate(10);
    let mut staged = tempfile::NamedTempFile::new_in(path.parent().ok_or("记录路径无效")?)
        .map_err(|error| error.to_string())?;
    serde_json::to_writer(&mut staged, &recent).map_err(|error| error.to_string())?;
    staged
        .as_file()
        .sync_all()
        .map_err(|error| error.to_string())?;
    staged
        .persist(&path)
        .map_err(|error| error.error.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn pick_open_target(app: AppHandle, folder: bool) -> Result<Option<String>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let dialog = app.dialog().file();
        let selected = if folder { dialog.blocking_pick_folder() } else { dialog.blocking_pick_file() };
        selected.map(|value| {
            let path = value.into_path().map_err(|e| e.to_string())?;
            fs::canonicalize(path).map(|path| path.to_string_lossy().into_owned()).map_err(|e| e.to_string())
        }).transpose()
    }).await.map_err(|e| e.to_string())?
}
#[tauri::command]
pub fn workspace_relative_target(state: tauri::State<'_, WorkspaceState>, path: String) -> Result<Option<String>, String> {
    let target = fs::canonicalize(path).map_err(|e| e.to_string())?;
    let workspace = state.0.lock().map_err(|e| e.to_string())?;
    let Some(workspace) = workspace.as_ref() else { return Ok(None); };
    relative_open_target(&workspace.root, &target)
}
fn relative_open_target(root: &Path, target: &Path) -> Result<Option<String>, String> {
    let root = root.canonicalize().map_err(|e| e.to_string())?;
    let target = target.canonicalize().map_err(|e| e.to_string())?;
    Ok(target.strip_prefix(root).ok().map(|path| path.to_string_lossy().replace('\\', "/")))
}
#[tauri::command]
pub async fn open_workspace_path(app: AppHandle, path: String) -> Result<WorkspaceInfo, String> {
    workspace_task(move || {
    let (workspace, info) = Workspace::open_interactive(Path::new(&path), Some(app.clone()))?;
    record_recent(&app, &info.root)?;
    app.state::<WorkspaceState>().install(workspace)?;
    Ok(info)

    }).await
}

#[tauri::command]
pub async fn activate_workspace(app: AppHandle, path: String) -> Result<WorkspaceInfo, String> {
    workspace_task(move || {
        let root = fs::canonicalize(&path).map_err(|error| format!("文件夹不可用：{error}"))?;
        if !root.is_dir() { return Err("目标不是文件夹".into()); }
        if let Some(info) = app.state::<WorkspaceState>().activate_cached(&root)? { return Ok(info); }
        let (workspace, info) = Workspace::open_interactive(&root, Some(app.clone()))?;
        app.state::<WorkspaceState>().install(workspace)?;
        Ok(info)
    }).await
}

fn refresh_listing(state: &WorkspaceState, root: Option<&str>, indexed_only: bool) -> Result<WorkspaceInfo, String> {
    // Directory I/O and SQLite waits must not hold the document-state lock.
    let mut listing = state.with_root(root, |workspace| Ok(workspace.listing_context()))?;
    let info = if indexed_only { listing.indexed_info()? } else { listing.info()? };
    state.with_root(Some(&info.root), |workspace| {
        workspace.listing = Some(info.clone());
        workspace.allowed = info.files.iter().filter(|file| fs::symlink_metadata(workspace.root.join(&file.relative_path)).is_ok_and(|metadata| metadata.is_file())).map(|file| file.relative_path.clone()).collect();
        Ok(())
    })?;
    Ok(info)
}
#[tauri::command]
pub async fn refresh_workspace(app: AppHandle, workspace_root: Option<String>, indexed_only: Option<bool>) -> Result<WorkspaceInfo, String> {
    workspace_task(move || refresh_listing(&app.state::<WorkspaceState>(), workspace_root.as_deref(), indexed_only == Some(true))).await
}

#[tauri::command]
pub fn close_workspace(app: AppHandle, workspace_root: Option<String>) -> Result<(), String> {
    let state = app.state::<WorkspaceState>();
    let mut active = state.0.lock().map_err(|error| error.to_string())?;
    let mut cached = state.1.lock().map_err(|error| error.to_string())?;
    if let Some(root) = workspace_root {
        if active.as_ref().is_some_and(|workspace| workspace.root.to_string_lossy() == root) { *active = None; }
        cached.retain(|workspace| workspace.root.to_string_lossy() != root);
    } else { *active = None; cached.clear(); }
    Ok(())
}

#[tauri::command]
pub async fn open_document_path(app: AppHandle, path: String) -> Result<OpenedWorkspaceFile, String> {
    workspace_task(move || {
    let target = fs::canonicalize(&path).map_err(|error| format!("文件不可用：{error}"))?;
    if !target.is_file() { return Err("目标不是文件".into()); }
    let root = target.parent().ok_or("文件没有可打开的父目录")?;
    let relative_path = target.file_name().and_then(|name| name.to_str()).ok_or("文件名无法读取")?.to_owned();
    let (workspace, info) = Workspace::open_interactive(root, Some(app.clone()))?;
    if !info.files.iter().any(|entry| entry.relative_path == relative_path) { return Err("不支持打开此格式，请选择 Markdown、纯文本、Word（DOCX）或 PDF".into()); }
    if let Err(error) = record_recent(&app, &info.root) { log::warn!("recent workspace persistence failed: {error}"); }
    app.state::<WorkspaceState>().install(workspace)?;
    Ok(OpenedWorkspaceFile { workspace: info, relative_path })

    }).await
}

#[tauri::command]
pub async fn save_document_as(app: AppHandle, content: String, filename: String, markdown_only: Option<bool>) -> Result<Option<OpenedWorkspaceFile>, String> {
    if content.len() > MAX_FILE_SIZE { return Err("文件过大，请拆分后打开".into()); }
    let dialog_app = app.clone();
    let safe_name = Path::new(&filename).file_name().and_then(|name| name.to_str()).filter(|name| !name.is_empty()).unwrap_or("未命名文件.md").to_owned();
    let selected = tauri::async_runtime::spawn_blocking(move || dialog_app.dialog().file().set_file_name(safe_name).blocking_save_file()).await.map_err(|error| error.to_string())?;
    let Some(target) = selected.and_then(|value| value.into_path().ok()) else { return Ok(None); };
    if markdown_only == Some(true) && !matches!(target.extension().and_then(|part| part.to_str()).map(str::to_ascii_lowercase).as_deref(), Some("md" | "markdown" | "mdown" | "mkd")) { return Err("请保存为 Markdown 文件（.md）".into()); }
    workspace_task(move || {
    if target.exists() { return Err("已存在同名文件，请换个名称".into()); }
    let parent = target.parent().ok_or("保存路径无效")?;
    let mut staged = tempfile::NamedTempFile::new_in(parent).map_err(|error| error.to_string())?;
    staged.write_all(content.as_bytes()).and_then(|_| staged.as_file().sync_all()).map_err(|error| error.to_string())?;
    staged.persist_noclobber(&target).map_err(|error| error.error.to_string())?;
    File::open(parent).and_then(|file| file.sync_all()).map_err(|error| error.to_string())?;
    let root = app.state::<WorkspaceState>().containing_root(&target)?.unwrap_or_else(|| parent.to_path_buf());
    let relative_path = target.strip_prefix(&root).map_err(|error| error.to_string())?.to_string_lossy().replace('\\', "/");
    let state = app.state::<WorkspaceState>();
    let mut info = if let Some(info) = state.activate_cached_with(&root, true)? {
        info
    } else {
        let (workspace, info) = Workspace::open_interactive(&root, Some(app.clone()))?;
        state.install(workspace)?;
        info
    };
    if let Some(file) = info.files.iter_mut().find(|file| file.relative_path == relative_path) { file.utf8 = Some(true); }
    state.with_root(Some(&info.root), |workspace| { workspace.listing = Some(info.clone()); Ok(()) })?;
    if let Err(error) = record_recent(&app, &info.root) { log::warn!("recent workspace persistence failed: {error}"); }
    Ok(Some(OpenedWorkspaceFile { workspace: info, relative_path }))
    }).await
}

#[tauri::command]
pub fn list_recent_workspaces(app: AppHandle) -> Result<Vec<String>, String> {
    Ok(read_recent(&app)?.into_iter().take(10).collect())
}

#[tauri::command]
pub fn clear_recent_workspaces(app: AppHandle, keep: Vec<String>) -> Result<(), String> {
    let path = recent_path(&app)?;
    let existing = read_recent(&app)?;
    if path.exists() { fs::remove_file(path).map_err(|error| error.to_string())?; }
    for item in keep.into_iter().rev().filter(|item| existing.contains(item)) {
        record_recent(&app, &item)?;
    }
    Ok(())
}

#[tauri::command]
pub async fn open_recent_workspace(app: AppHandle, path: String) -> Result<WorkspaceInfo, String> {
    workspace_task(move || {
    if !read_recent(&app)?.contains(&path) {
        return Err("此文件夹已不在最近打开记录中，请重新选择文件夹".into());
    }
    let (workspace, info) = Workspace::open_interactive(Path::new(&path), Some(app.clone()))?;
    if let Err(error) = record_recent(&app, &info.root) {
        log::warn!("recent workspace persistence failed: {error}");
    }
    app.state::<WorkspaceState>().install(workspace)?;
    Ok(info)

    }).await
}

#[tauri::command]
pub fn read_document(
    state: tauri::State<'_, WorkspaceState>,
    relative_path: String,
    workspace_root: Option<String>,
) -> Result<OpenedDocument, String> {
    state.with_root(workspace_root.as_deref(), |workspace| workspace.read(&relative_path))
}

#[tauri::command]
pub fn save_document(
    state: tauri::State<'_, WorkspaceState>,
    relative_path: String,
    workspace_root: Option<String>,
    content: String,
    expected_version: String,
    git_enabled: bool,
    git_max_versions: usize,
    git_retention_days: usize,
) -> Result<SavedDocument, String> {
    let (mut saved, root, previous, current) = state.with_root(workspace_root.as_deref(), |workspace| {
        let previous = if git_enabled { workspace.originals.get(&relative_path).cloned() } else { None };
        let saved = workspace.save(&relative_path, &content, &expected_version)?;
        Ok((saved, workspace.root.clone(), previous, workspace.originals.get(&relative_path).cloned()))
    })?;
    if let (Some(previous), Some(current)) = (previous, current) {
        if previous != current {
            let kept = git_max_versions.saturating_add(1);
            let outcome = git_history::snapshot(&root, &relative_path, &previous, kept, git_retention_days)
                .and_then(|_| git_history::snapshot(&root, &relative_path, &current, kept, git_retention_days));
            if let Err(error) = outcome { saved.git_warning = Some(error); }
        }
    }
    Ok(saved)
}

#[tauri::command]
pub fn git_available() -> Result<String, String> { git_history::available() }

#[tauri::command]
pub fn list_git_versions(state: tauri::State<'_, WorkspaceState>, workspace_root: Option<String>, relative_path: String, git_max_versions: usize, git_retention_days: usize) -> Result<Vec<GitVersion>, String> {
    state.with_root(workspace_root.as_deref(), |workspace| {
    workspace.resolve(&relative_path)?;
    let kept = git_max_versions.saturating_add(1);
    git_history::prune(&workspace.root, &relative_path, kept, git_retention_days)?;
    let current = fs::read(workspace.resolve(&relative_path)?).map_err(|error| error.to_string())?;
    let mut versions = git_history::list(&workspace.root, &relative_path)?;
    if let Some(latest) = versions.first() {
        if git_history::read(&workspace.root, &relative_path, &latest.id)? == current { versions.remove(0); }
    }
    Ok(versions)
    })
}

#[tauri::command]
pub async fn search_documents(app: AppHandle, query: String, root: Option<String>) -> Result<Vec<SearchResult>, String> {
    workspace_task(move || {
        let state = app.state::<WorkspaceState>();
        let guard = state.0.lock().map_err(|error|error.to_string())?;
        let workspace = guard.as_ref().ok_or("请先打开文件夹")?;
        if root.as_deref().is_some_and(|root|workspace.root.to_string_lossy()!=root) { return Err("文件夹已切换，请重新输入".into()); }
        search_workspace(workspace, &query)
    }).await
}

fn search_workspace(workspace: &Workspace, query: &str) -> Result<Vec<SearchResult>, String> {
    let indexed = workspace.index.lock().map_err(|e|e.to_string())?.as_ref().map(|index|index.search(query));
    match indexed {
        Some(Ok(rows)) => return Ok(rows.into_iter().map(|row|SearchResult {relative_path:row.path,snippet:row.snippet}).collect()),
        Some(Err(error)) if error == "搜索词过长" => return Err(error),
        Some(Err(error)) => log::warn!("File index search fallback: {error}"),
        None => log::warn!("File index search fallback: index unavailable"),
    }
    search_workspace_files(workspace,query)
}

fn search_workspace_files(workspace: &Workspace, query: &str) -> Result<Vec<SearchResult>, String> {
    let needle = query.trim().to_lowercase();
    if needle.is_empty() { return Ok(Vec::new()); }
    if needle.chars().count() > 200 { return Err("搜索词过长".into()); }
    let mut matches = Vec::new();
    for relative in &workspace.allowed {
        let path_match = relative.to_lowercase().contains(&needle);
        let path = workspace.resolve(relative)?;
        let mut snippet = None;
        if let Ok(file) = File::open(&path).and_then(|file| if text_preview_openable(&path) { Ok(file) } else { Err(std::io::Error::other("binary document")) }) {
            for line in BufReader::new(file).lines() {
                let Ok(text) = line else { continue };
                if let Some(position) = text.to_lowercase().find(&needle) {
                    let center = text.to_lowercase()[..position].chars().count();
                    let chars: Vec<_> = text.chars().collect();
                    let start = center.saturating_sub(40).min(chars.len());
                    let end = (center + needle.chars().count() + 90).min(chars.len());
                    snippet = Some(format!("{}{}{}", if start > 0 { "…" } else { "" }, chars[start..end].iter().collect::<String>(), if end < chars.len() { "…" } else { "" }));
                    break;
                }
            }
        }
        if path_match || snippet.is_some() { matches.push(SearchResult { relative_path: relative.clone(), snippet }); }
    }
    matches.sort_by(|a, b| a.relative_path.cmp(&b.relative_path));
    Ok(matches)
}

#[tauri::command]
pub fn diff_git_version(state: tauri::State<'_, WorkspaceState>, workspace_root: Option<String>, relative_path: String, id: String, current_content: String) -> Result<String, String> {
    state.with_root(workspace_root.as_deref(), |workspace| {
    workspace.resolve(&relative_path)?;
    let previous = git_history::read(&workspace.root, &relative_path, &id)?;
    let (text, _) = decode_document(&previous)?;
    git_history::diff(text.as_bytes(), current_content.as_bytes())
    })
}

#[tauri::command]
pub fn restore_git_version(state: tauri::State<'_, WorkspaceState>, workspace_root: Option<String>, relative_path: String, id: String, expected_version: String, git_max_versions: usize, git_retention_days: usize) -> Result<OpenedDocument, String> {
    state.with_root(workspace_root.as_deref(), |workspace| {
    let target = workspace.resolve(&relative_path)?;
    let current = fs::read(&target).map_err(|error| error.to_string())?;
    let current_hash = format!("{:x}", Sha256::digest(&current));
    if current_hash != expected_version || workspace.originals.get(&relative_path) != Some(&current) { return Err("文件已在外部修改，请先比较并处理冲突".into()); }
    let previous = git_history::read(&workspace.root, &relative_path, &id)?;
    decode_document(&previous)?;
    let kept = git_max_versions.saturating_add(1);
    git_history::snapshot(&workspace.root, &relative_path, &current, kept, git_retention_days)?;
    if previous != current {
        replace_file(&target, &previous, || ensure_unchanged(&target, &current)).map_err(|error| format!("恢复失败：{error}"))?;
    }
    if previous != current {
        git_history::snapshot(&workspace.root, &relative_path, &previous, kept, git_retention_days)?;
    }
    workspace.read(&relative_path)
    })
}

#[tauri::command]
pub async fn inspect_document(
    app: AppHandle,
    relative_path: String,
    workspace_root: Option<String>,
) -> Result<DiskStatus, String> {
    workspace_task(move || app.state::<WorkspaceState>().with_root(workspace_root.as_deref(), |workspace| workspace.inspect(&relative_path))).await
}

#[tauri::command]
pub fn write_draft(
    app: AppHandle,
    state: tauri::State<'_, WorkspaceState>,
    relative_path: String,
    workspace_root: Option<String>,
    content: String,
    expected_version: String,
) -> Result<(), String> {
    state.with_root(workspace_root.as_deref(), |workspace| workspace.write_draft(&app, &relative_path, &content, &expected_version))
}

#[tauri::command]
pub fn load_draft(
    app: AppHandle,
    state: tauri::State<'_, WorkspaceState>,
    relative_path: String,
    workspace_root: Option<String>,
) -> Result<Option<DraftPreview>, String> {
    state.with_root(workspace_root.as_deref(), |workspace| workspace.load_draft(&app, &relative_path))
}

#[tauri::command]
pub fn clear_draft(
    app: AppHandle,
    state: tauri::State<'_, WorkspaceState>,
    relative_path: String,
    workspace_root: Option<String>,
) -> Result<(), String> {
    state.with_root(workspace_root.as_deref(), |workspace| workspace.clear_draft(&app, &relative_path))
}

#[tauri::command]
pub async fn import_image(
    app: AppHandle,
    state: tauri::State<'_, WorkspaceState>,
    workspace_root: Option<String>,
    document: String,
    directory: String,
    naming: Option<String>,
) -> Result<Option<String>, String> {
    let dialog_app = app.clone();
    let selected = tauri::async_runtime::spawn_blocking(move || {
        dialog_app.dialog().file().add_filter("图片", &["png", "jpg", "jpeg", "gif", "webp"]).blocking_pick_file()
    }).await.map_err(|error| error.to_string())?;
    let Some(source) = selected.and_then(|value| value.into_path().ok()) else { return Ok(None); };
    let path = state.with_root(workspace_root.as_deref(), |workspace| workspace.import_image(&source, &document, &directory, naming.as_deref()))?;
    Ok(Some(path))
}

#[tauri::command]
pub fn import_image_bytes(state: tauri::State<'_, WorkspaceState>, workspace_root: Option<String>, document: String, directory: String, naming: Option<String>, mime: String, bytes: Vec<u8>) -> Result<String, String> {
    let extension = image_extension_for_bytes(&bytes, &mime)?;
    let mut temporary = tempfile::Builder::new().prefix("pasted-image-").suffix(&format!(".{extension}")).tempfile().map_err(|error| error.to_string())?;
    temporary.write_all(&bytes).and_then(|_| temporary.flush()).map_err(|error| error.to_string())?;
    state.with_root(workspace_root.as_deref(), |workspace| workspace.import_image(temporary.path(), &document, &directory, naming.as_deref()))
}

#[tauri::command]
pub fn read_image(state: tauri::State<'_, WorkspaceState>, document: String, target: String, workspace_root: Option<String>) -> Result<String, String> {
    state.with_root(workspace_root.as_deref(), |workspace| workspace.read_image(&document, &target))
}

#[tauri::command]
pub async fn open_workspace_resource(app: AppHandle, source: String, target: String) -> Result<(), String> {
    workspace_task(move || {
        let path = {
            let state = app.state::<WorkspaceState>();
            let guard = state.0.lock().map_err(|error|error.to_string())?;
            guard.as_ref().ok_or("请先打开文件夹")?.linked_item(&source, &target)?
        };
        #[cfg(target_os = "macos")]
        let mut command = std::process::Command::new("open");
        #[cfg(target_os = "windows")]
        let mut command = std::process::Command::new("explorer");
        #[cfg(not(any(target_os = "macos", target_os = "windows")))]
        let mut command = std::process::Command::new("xdg-open");
        command.arg(&path).spawn().map_err(|error|error.to_string())?;
        Ok(())
    }).await
}

#[tauri::command]
pub fn open_workspace_directory(state: tauri::State<'_, WorkspaceState>, directory: String) -> Result<(), String> {
    let mut guard = state.0.lock().map_err(|error| error.to_string())?;
    let workspace = guard.as_mut().ok_or("请先打开文件夹")?;
    let relative = valid_relative(&directory)?;
    let mut current = PathBuf::new();
    for part in relative.components() {
        current.push(part.as_os_str());
        let text = current.to_str().ok_or("目录编码无效")?;
        let target = workspace.root.join(&current);
        if !target.exists() { fs::create_dir(workspace.new_path(text)?).map_err(|error| error.to_string())?; }
        else if !target.is_dir() { return Err("路径中的一部分是文件，请选择文件夹".into()); }
    }
    let target = workspace.root.join(relative);
    #[cfg(target_os = "macos")]
    std::process::Command::new("open").arg(&target).spawn().map_err(|error| error.to_string())?;
    #[cfg(target_os = "windows")]
    std::process::Command::new("explorer").arg(&target).spawn().map_err(|error| error.to_string())?;
    #[cfg(target_os = "linux")]
    std::process::Command::new("xdg-open").arg(&target).spawn().map_err(|error| error.to_string())?;
    Ok(())
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceItemInfo { path: String, is_directory: bool, bytes: u64, modified: Option<u64> }

fn workspace_item_path(root: &Path, relative_path: &str) -> Result<PathBuf, String> {
    let root = root.canonicalize().map_err(|error| error.to_string())?;
    let path = if relative_path.is_empty() { root.clone() } else { root.join(valid_relative(relative_path)?).canonicalize().map_err(|error| error.to_string())? };
    if !path.starts_with(&root) { return Err("路径不在当前文件夹内，请重新选择".into()); }
    Ok(path)
}

#[tauri::command]
pub fn workspace_item_info(state: tauri::State<'_, WorkspaceState>, relative_path: String, workspace_root: Option<String>) -> Result<WorkspaceItemInfo, String> {
    state.with_root(workspace_root.as_deref(), |workspace| {
    let path = workspace_item_path(&workspace.root, &relative_path)?;
    let metadata = fs::metadata(&path).map_err(|error| error.to_string())?;
    Ok(WorkspaceItemInfo { path: path.to_string_lossy().into_owned(), is_directory: metadata.is_dir(), bytes: metadata.len(), modified: metadata.modified().ok().and_then(|time| time.duration_since(UNIX_EPOCH).ok()).map(|duration| duration.as_secs()) })
    })
}

#[tauri::command]
pub async fn show_workspace_item_info(window: tauri::WebviewWindow, state: tauri::State<'_, WorkspaceState>, relative_path: String, workspace_root: Option<String>) -> Result<(), String> {
    let info = workspace_item_info(state, relative_path, workspace_root)?;
    #[cfg(target_os = "macos")]
    {
        let (sender, receiver) = std::sync::mpsc::sync_channel(1);
        window.run_on_main_thread(move || { let _ = sender.send(crate::macos_properties::show(&info.path)); }).map_err(|error| error.to_string())?;
        receiver.recv().map_err(|error| error.to_string())?
    }
    #[cfg(target_os = "windows")]
    {
        let owner = window.hwnd().map_err(|error| error.to_string())?.0 as usize;
        let (sender, receiver) = std::sync::mpsc::sync_channel(1);
        window.run_on_main_thread(move || { let _ = sender.send(crate::windows_properties::show(&info.path, owner)); }).map_err(|error| error.to_string())?;
        receiver.recv().map_err(|error| error.to_string())?
    }
    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    { let _ = (window, info); Err("当前系统不支持显示文件属性".into()) }
}

#[tauri::command]
pub fn reveal_workspace_item(state: tauri::State<'_, WorkspaceState>, relative_path: String, workspace_root: Option<String>) -> Result<(), String> {
    let path = if let Some(root) = workspace_root {
        let root = fs::canonicalize(root).map_err(|error| error.to_string())?;
        workspace_item_path(&root, &relative_path)?.to_string_lossy().into_owned()
    } else { workspace_item_info(state, relative_path, None)?.path };
    #[cfg(target_os = "macos")]
    std::process::Command::new("open").arg("-R").arg(&path).spawn().map_err(|error| error.to_string())?;
    #[cfg(target_os = "windows")]
    std::process::Command::new("explorer").arg(format!("/select,{}", path)).spawn().map_err(|error| error.to_string())?;
    #[cfg(target_os = "linux")]
    std::process::Command::new("xdg-open").arg(Path::new(&path).parent().ok_or("无法定位父目录")?).spawn().map_err(|error| error.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn create_markdown(
    state: tauri::State<'_, WorkspaceState>,
    relative_path: String,
    workspace_root: Option<String>,
    content: Option<String>,
) -> Result<WorkspaceInfo, String> {
    state.with_root(workspace_root.as_deref(), |workspace| workspace.create_markdown_with_content(&relative_path, content.as_deref().unwrap_or("")))
}

#[tauri::command]
pub async fn plugin_workspace_file(app: AppHandle, root: String, path: String, operation: String, content: Option<String>, bytes: Option<Vec<u8>>, expected_version: Option<String>) -> Result<serde_json::Value, String> {
    workspace_task(move || {
        app.state::<WorkspaceState>().with_root(Some(&root), |workspace| {
            use serde_json::json;
            match operation.as_str() {
                "create" => {
                    let content=content.as_deref().unwrap_or("");
                    if content.len()>20*1024*1024 { return Err("文件超过 20 MB".into()); }
                    let target=workspace.new_path(&path)?;
                    let mut file=File::create_new(&target).map_err(|e|e.to_string())?;
                    file.write_all(content.as_bytes()).and_then(|_|file.sync_all()).map_err(|e|e.to_string())?;
                    workspace.allowed.insert(path.clone());
                    if let Ok(mut guard)=workspace.index.lock() { if let Some(index)=guard.as_mut() { index.update(&workspace.root,&path)?; } }
                    Ok(json!(null))
                },
                "readText" => Ok(serde_json::to_value(workspace.read(&path)?).map_err(|e|e.to_string())?),
                "readBytes" => {let target=workspace.resolve(&path)?;if fs::metadata(&target).map_err(|e|e.to_string())?.len()>20*1024*1024{return Err("附件超过 20 MB".into());}let bytes=fs::read(target).map_err(|e|e.to_string())?;if bytes.len()>20*1024*1024{return Err("附件超过 20 MB".into());}Ok(json!({"version":format!("{:x}",Sha256::digest(&bytes)),"bytes":bytes}))},
                "writeText" => {let expected=expected_version.as_deref().ok_or("缺少文件版本")?;workspace.read(&path)?;let saved=workspace.save(&path,content.as_deref().ok_or("缺少文件内容")?,expected)?;Ok(serde_json::to_value(saved).map_err(|e|e.to_string())?)},
                "writeBytes" => {
                    let target=workspace.resolve(&path)?;let data=bytes.as_deref().ok_or("缺少附件内容")?;
                    if data.len()>20*1024*1024{return Err("附件超过 20 MB".into());}
                    let previous=fs::read(&target).map_err(|e|e.to_string())?;
                    if Some(format!("{:x}",Sha256::digest(&previous)).as_str())!=expected_version.as_deref(){return Err("文件版本已变化，未覆盖".into());}
                    replace_file(&target,data,||ensure_unchanged(&target,&previous)).map_err(|e|e.to_string())?;
                    if let Ok(mut guard)=workspace.index.lock(){if let Some(index)=guard.as_mut(){index.update(&workspace.root,&path)?;}}
                    Ok(json!(null))
                },
                _ => Err("不支持的插件文件操作".into())
            }
        })
    }).await
}

#[tauri::command]
pub fn convert_text_to_markdown(
    state: tauri::State<'_, WorkspaceState>,
    source: String,
    target: String,
) -> Result<WorkspaceInfo, String> {
    state.0.lock().map_err(|error| error.to_string())?.as_mut().ok_or("请先打开文件夹")?.convert_text_to_markdown(&source, &target)
}

#[tauri::command]
pub fn create_folder(
    state: tauri::State<'_, WorkspaceState>,
    relative_path: String,
    workspace_root: Option<String>,
) -> Result<WorkspaceInfo, String> {
    state.with_root(workspace_root.as_deref(), |workspace| workspace.create_folder(&relative_path))
}


// File I/O and SQLite reconciliation must not run on the WebView event thread.
async fn workspace_task<T: Send + 'static>(task: impl FnOnce() -> Result<T, String> + Send + 'static) -> Result<T, String> {
    tauri::async_runtime::spawn_blocking(task).await.map_err(|error| error.to_string())?
}

#[tauri::command]
pub async fn query_file_index(app: AppHandle, root: String, operation: String, cursor: Option<String>, after: Option<String>, limit: Option<usize>, id: Option<String>, version: Option<i64>, direction: Option<String>, tag: Option<String>) -> Result<serde_json::Value, String> {
    workspace_task(move || {
        let state=app.state::<WorkspaceState>();
        let (index_handle,index_root)=state.with_root(Some(&root),|workspace|Ok((Arc::clone(&workspace.index),workspace.root.clone())))?;
        let mut guard=index_handle.lock().map_err(|e|e.to_string())?;
        let index=guard.as_mut().ok_or("index-unavailable")?;
        let event_app=app.clone();let event_root=root.clone();
        index.set_notifier(move|cursor|{let _=event_app.emit("markart-index-changed",serde_json::json!({"root":event_root,"cursor":cursor}));});
        let query=|index:&crate::file_index::FileIndex| index.read(|index| match operation.as_str() {
            "files"=>serde_json::to_value(index.page(cursor.as_deref(),after.as_deref(),limit.unwrap_or(100))?),
            "changes"=>serde_json::to_value(index.changes(cursor.as_deref().ok_or("invalid-index-cursor")?,limit.unwrap_or(100))?),
            "content"=>serde_json::to_value(index.content(id.as_deref().ok_or("missing-file-id")?,version.ok_or("missing-file-version")?)?),
            "metadata"=>serde_json::to_value(index.metadata(id.as_deref().ok_or("missing-file-id")?,version.ok_or("missing-file-version")?)?),
            "links"=>serde_json::to_value(index.relations(id.as_deref(),direction.as_deref().unwrap_or("both"),cursor.as_deref(),after.as_deref().unwrap_or("0").parse().map_err(|_|"invalid-link-offset")?,limit.unwrap_or(100))?),
            "tagged"=>serde_json::to_value(index.tagged(tag.as_deref().ok_or("missing-tag")?,cursor.as_deref(),after.as_deref(),limit.unwrap_or(100))?),
            "watch"=>Ok(serde_json::json!({"root":root,"cursor":index.cursor()?})),
            _=>return Err("unknown-index-operation".into())
        }.map_err(|e|e.to_string()));
        match query(index) {
            Ok(result)=>Ok(result),
            Err(error)=>if index.recover_if_corrupt()? {crate::index_worker::rebuild(&index_root,index)?;query(index)}else{Err(error)},
        }
    }).await
}

#[tauri::command]
pub async fn query_link_completions(app: AppHandle, root: String, source: String, query: String, folder: Option<String>) -> Result<Vec<crate::file_index::CompletionEntry>, String> {
    workspace_task(move || {
        let state = app.state::<WorkspaceState>();
        let guard = state.0.lock().map_err(|error|error.to_string())?;
        guard.as_ref().ok_or("请先打开文件夹")?.complete_links(&root,&source,&query,folder.as_deref())
    }).await
}

#[tauri::command]
pub async fn preview_move_item(app: AppHandle, workspace_root: Option<String>, from: String, to: String) -> Result<MovePreview, String> {
    workspace_task(move || {
        let state = app.state::<WorkspaceState>();
        state.with_root(workspace_root.as_deref(), |workspace| workspace.preview_move_item(&from, &to))
    }).await
}

#[tauri::command]
pub async fn move_item_with_links(app: AppHandle, workspace_root: Option<String>, from: String, to: String, token: String) -> Result<MoveResult, String> {
    workspace_task(move || {
        let state = app.state::<WorkspaceState>();
        state.with_root(workspace_root.as_deref(), |workspace| workspace.move_item_with_links(&from, &to, &token))
    }).await
}

#[tauri::command]
pub fn check_local_resources(state: tauri::State<'_, WorkspaceState>, relative_path: Option<String>, current_content: Option<String>) -> Result<Vec<MissingResource>, String> {
    state.0.lock().map_err(|error| error.to_string())?.as_ref().ok_or("请先打开文件夹")?.check_local_resources(relative_path.as_deref(), current_content.as_deref())
}

#[tauri::command]
pub fn validate_local_resource_target(state: tauri::State<'_, WorkspaceState>, source: String, target: String) -> Result<(), String> {
    state.0.lock().map_err(|error| error.to_string())?.as_ref().ok_or("请先打开文件夹")?.validate_local_resource_target(&source, &target)
}

#[tauri::command]
pub fn trash_item(
    state: tauri::State<'_, WorkspaceState>,
    relative_path: String,
    workspace_root: Option<String>,
) -> Result<WorkspaceInfo, String> {
    state.with_root(workspace_root.as_deref(), |workspace| workspace.trash_item(&relative_path))
}



#[cfg(test)]
mod tests {
    use super::*;
    use std::os::unix::fs::{symlink, PermissionsExt};

    #[test]
    fn root_metadata_path_does_not_expand_mutation_or_parent_access() {
        let dir = tempfile::tempdir().unwrap();
        fs::write(dir.path().join("file.md"), "text").unwrap();
        let root = dir.path().canonicalize().unwrap();
        assert_eq!(workspace_item_path(&root, "").unwrap(), root);
        assert_eq!(workspace_item_path(&root, "file.md").unwrap(), root.join("file.md"));
        assert!(workspace_item_path(&root, "../outside").is_err());
        assert!(valid_relative("").is_err());
    }

    #[test]
    fn open_target_checks_real_directory_boundaries() {
        let dir = tempfile::tempdir().unwrap();
        let root = dir.path().join("notes"); let sibling = dir.path().join("notes-other");
        fs::create_dir_all(root.join("sub")).unwrap(); fs::create_dir_all(&sibling).unwrap();
        assert_eq!(relative_open_target(&root, &root.join("sub")).unwrap(), Some("sub".into()));
        assert_eq!(relative_open_target(&root, &root).unwrap(), Some("".into()));
        assert_eq!(relative_open_target(&root, &sibling).unwrap(), None);
        #[cfg(unix)] {
            std::os::unix::fs::symlink(&sibling, root.join("external")).unwrap();
            assert_eq!(relative_open_target(&root, &root.join("external")).unwrap(), None);
        }
    }
    #[test]
    fn move_preview_and_apply_rewrites_links_without_touching_unrelated_text() {
        let dir = tempfile::tempdir().unwrap();
        fs::create_dir(dir.path().join("notes")).unwrap();
        fs::create_dir(dir.path().join("archive")).unwrap();
        fs::write(dir.path().join("notes/one.md"), "[two](two.md)\n`[two](two.md)`\n").unwrap();
        fs::write(dir.path().join("notes/two.md"), "# Two\n").unwrap();
        let (mut workspace, _) = Workspace::open(dir.path()).unwrap();
        let preview = workspace.preview_move_item("notes/two.md", "archive/two.md").unwrap();
        assert_eq!(preview.links.len(), 1);
        assert_eq!(preview.links[0].changes.len(), 1);
        assert_eq!(fs::read_to_string(dir.path().join("notes/one.md")).unwrap(), "[two](two.md)\n`[two](two.md)`\n");
        let result = workspace.move_item_with_links("notes/two.md", "archive/two.md", &preview.token).unwrap();
        assert_eq!(result.updated.len(), 1);
        assert_eq!(fs::read_to_string(dir.path().join("notes/one.md")).unwrap(), "[two](../archive/two.md)\n`[two](two.md)`\n");
        assert!(dir.path().join("archive/two.md").exists());
    }

    #[test]
    fn move_rejects_stale_preview_before_touching_files() {
        let dir = tempfile::tempdir().unwrap();
        fs::write(dir.path().join("one.md"), "[two](two.md)\n").unwrap();
        fs::write(dir.path().join("two.md"), "# Two\n").unwrap();
        let (mut workspace, _) = Workspace::open(dir.path()).unwrap();
        let preview = workspace.preview_move_item("two.md", "renamed.md").unwrap();
        fs::write(dir.path().join("one.md"), "externally changed\n").unwrap();
        assert!(workspace.move_item_with_links("two.md", "renamed.md", &preview.token).is_err());
        assert!(dir.path().join("two.md").exists());
        assert!(!dir.path().join("renamed.md").exists());
    }

    #[test]
    fn default_conversion_formats_are_word_and_pdf_only() {
        let dir = tempfile::tempdir().unwrap();
        for name in ["word.docx", "document.pdf", "old.rtf", "slides.pptx", "sheet.xlsx", "table.csv"] {
            fs::write(dir.path().join(name), b"fixture").unwrap();
        }
        let (_, info) = Workspace::open(dir.path()).unwrap();
        let names: Vec<_> = info.files.iter().map(|file| file.relative_path.as_str()).collect();
        assert!(names.contains(&"word.docx") && names.contains(&"document.pdf"));
        assert_eq!(names.len(), 6);
    }

    #[test]
    fn lists_hidden_and_binary_files_but_only_opens_text() {
        let dir = tempfile::tempdir().unwrap();
        fs::create_dir(dir.path().join(".hidden")).unwrap();
        fs::write(dir.path().join(".hidden/.env"), b"KEY=value").unwrap();
        fs::write(dir.path().join("README"), b"text").unwrap();
        fs::write(dir.path().join("data.xyz"), b"custom text").unwrap();
        fs::write(dir.path().join("image.png"), b"\x89PNG\r\n\x1a\n\0binary").unwrap();
        let (mut workspace, info) = Workspace::open(dir.path()).unwrap();
        assert_eq!(info.files.len(), 4);
        assert!(info.directories.contains(&".hidden".into()));
        assert!(info.files.iter().find(|file| file.relative_path == ".hidden/.env").unwrap().hidden);
        assert!(!info.files.iter().find(|file| file.relative_path == "image.png").unwrap().openable);
        assert_eq!(info.files.iter().find(|file| file.relative_path == "image.png").unwrap().utf8, Some(false));
        for name in [".hidden/.env", "README", "data.xyz"] {
            assert_eq!(info.files.iter().find(|file| file.relative_path == name).unwrap().utf8, Some(true));
        }
        for name in [".hidden/.env", "README", "data.xyz"] { assert!(workspace.read(name).is_ok()); }
        assert!(workspace.read("image.png").is_err());
    }

    #[test]
    fn utf8_filter_uses_full_index_content_and_refreshes() {
        let dir = tempfile::tempdir().unwrap();
        let mut bytes = vec![b'a'; 9000];
        bytes.push(0xff);
        fs::write(dir.path().join("late-invalid.txt"), bytes).unwrap();
        fs::write(dir.path().join("empty.txt"), b"").unwrap();
        fs::write(dir.path().join("bom.txt"), b"\xef\xbb\xbfUTF-8").unwrap();
        File::create(dir.path().join("large.txt")).unwrap().set_len(20 * 1024 * 1024 + 1).unwrap();
        let (workspace, info) = Workspace::open(dir.path()).unwrap();
        let encoding = |info: &WorkspaceInfo, path: &str| info.files.iter().find(|file| file.relative_path == path).unwrap().utf8;
        assert_eq!(encoding(&info, "late-invalid.txt"), Some(false));
        assert_eq!(encoding(&info, "empty.txt"), Some(true));
        assert_eq!(encoding(&info, "bom.txt"), Some(true));
        assert_eq!(encoding(&info, "large.txt"), None);
        fs::write(dir.path().join("late-invalid.txt"), "valid now").unwrap();
        let refreshed = workspace.info().unwrap();
        assert_eq!(encoding(&refreshed, "late-invalid.txt"), Some(true));
    }

    #[test]
    fn all_utf8_extensions_preserve_content_without_conversion() {
        let dir = tempfile::tempdir().unwrap();
        for name in ["trace.xyz", "script.py", "config.yaml", "config.yml"] {
            fs::write(dir.path().join(name), "a\r\nb\r\n").unwrap();
        }
        let (mut workspace, info) = Workspace::open(dir.path()).unwrap();
        assert_eq!(info.files.len(), 4);
        assert!(info.files.iter().any(|file| file.relative_path == "trace.xyz"));
        assert!(workspace.read("trace.xyz").is_ok());
        for name in ["script.py", "config.yaml", "config.yml"] {
            let opened = workspace.read(name).unwrap();
            workspace.save(name, "next\r\nb\r\n", &opened.version).unwrap();
            assert_eq!(fs::read_to_string(dir.path().join(name)).unwrap(), "next\r\nb\r\n");
        }
    }

    #[test]
    fn moving_attachment_folder_updates_image_and_detects_missing_resources() {
        let dir = tempfile::tempdir().unwrap();
        fs::create_dir(dir.path().join("assets")).unwrap();
        fs::write(dir.path().join("assets/图.png"), b"image").unwrap();
        fs::write(dir.path().join("note.md"), "![图](assets/%E5%9B%BE.png)\n[坏链](lost.md)\n").unwrap();
        let (mut workspace, _) = Workspace::open(dir.path()).unwrap();
        let missing = workspace.check_local_resources(Some("note.md"), None).unwrap();
        assert_eq!(missing.len(), 1);
        assert_eq!(missing[0].line, 2);
        assert!(workspace.validate_local_resource_target("note.md", "assets/%E5%9B%BE.png").is_ok());
        let preview = workspace.preview_move_item("assets", "images").unwrap();
        assert_eq!(preview.links[0].changes.len(), 1);
        workspace.move_item_with_links("assets", "images", &preview.token).unwrap();
        assert_eq!(fs::read_to_string(dir.path().join("note.md")).unwrap(), "![图](images/%E5%9B%BE.png)\n[坏链](lost.md)\n");
        assert!(workspace.validate_local_resource_target("note.md", "images/%E5%9B%BE.png").is_ok());
    }

    #[test]
    fn pasted_image_bytes_reject_disguised_and_oversized_content() {
        assert_eq!(image_extension_for_bytes(b"\x89PNG\r\n\x1a\nrest", "image/png").unwrap(), "png");
        assert!(image_extension_for_bytes(b"<script>", "image/png").is_err());
        assert!(image_extension_for_bytes(b"\xff\xd8\xff", "image/png").is_err());
        assert!(image_extension_for_bytes(&vec![0; 20 * 1024 * 1024 + 1], "image/png").is_err());
    }

    #[test]
    fn searches_file_name_and_unopened_document_content() {
        let dir = tempfile::tempdir().unwrap();
        fs::write(dir.path().join("notes.md"), "第一行\n第二行\n第三行 独特的中文关键词\n").unwrap();
        fs::write(dir.path().join("draft.css"), "body { color: red; }").unwrap();
        let (workspace, info) = Workspace::open(dir.path()).unwrap();
        assert_eq!(info.files.iter().find(|file| file.relative_path == "notes.md").unwrap().excerpt, "第一行 第二行");
        assert_eq!(search_workspace(&workspace, "中文关键词").unwrap(), vec![SearchResult { relative_path: "notes.md".into(), snippet: Some("第三行 独特的中文关键词".into()) }]);
        assert_eq!(search_workspace(&workspace, "DRAFT").unwrap(), vec![SearchResult { relative_path: "draft.css".into(), snippet: None }]);
        assert!(search_workspace(&workspace, "缺失").unwrap().is_empty());
    }

    #[test]
    fn opens_nested_markdown_and_roundtrips_utf8_bom_and_crlf() {
        let dir = tempfile::tempdir().unwrap();
        fs::create_dir(dir.path().join("notes")).unwrap();
        let path = dir.path().join("notes/中文.md");
        fs::write(
            &path,
            [UTF8_BOM, "# 标题\r\n\r\n原文\r\n".as_bytes()].concat(),
        )
        .unwrap();
        let (mut workspace, info) = Workspace::open(dir.path()).unwrap();
        assert_eq!(info.files.len(), 1);
        assert_eq!(info.files[0].relative_path, "notes/中文.md");
        let opened = workspace.read("notes/中文.md").unwrap();
        assert_eq!(opened.content, "# 标题\r\n\r\n原文\r\n");
        workspace
            .save("notes/中文.md", "# 标题\r\n\r\n新文\r\n", &opened.version)
            .unwrap();
        assert_eq!(
            fs::read(&path).unwrap(),
            [UTF8_BOM, "# 标题\r\n\r\n新文\r\n".as_bytes()].concat()
        );
        let (mut reopened, _) = Workspace::open(dir.path()).unwrap();
        assert_eq!(
            reopened.read("notes/中文.md").unwrap().content,
            "# 标题\r\n\r\n新文\r\n"
        );
    }

    #[test]
    fn preserves_utf8_bom_when_saving() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("note.md");
        fs::write(&path, [UTF8_BOM, "# 标题\n内容\n".as_bytes()].concat()).unwrap();
        let (mut workspace, _) = Workspace::open(dir.path()).unwrap();
        let opened = workspace.read("note.md").unwrap();
        assert_eq!(opened.encoding, "UTF-8 BOM");
        workspace.save("note.md", "# 标题\n新内容\n", &opened.version).unwrap();
        assert_eq!(fs::read(&path).unwrap(), [UTF8_BOM, "# 标题\n新内容\n".as_bytes()].concat());
    }

    #[test]
    fn preserves_gb_encoding_and_rejects_unrepresentable_text() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("note.md");
        let original = encode_document("# 中文标题\n正文\n", "GB2312").unwrap();
        fs::write(&path, &original).unwrap();
        let (mut workspace, _) = Workspace::open(dir.path()).unwrap();
        let opened = workspace.read("note.md").unwrap();
        assert_eq!(opened.encoding, "GB2312");
        assert_eq!(opened.content, "# 中文标题\n正文\n");
        let saved = workspace.save("note.md", "# 中文标题\n新正文\n", &opened.version).unwrap();
        assert_eq!(decode_document(&fs::read(&path).unwrap()).unwrap().0, "# 中文标题\n新正文\n");
        assert_eq!(workspace.read("note.md").unwrap().encoding, "GB2312");
        assert!(workspace.save("note.md", "😀", &saved.version).is_err());
        assert_eq!(decode_document(&fs::read(&path).unwrap()).unwrap().0, "# 中文标题\n新正文\n");
        assert_eq!(saved.version, format!("{:x}", Sha256::digest(fs::read(&path).unwrap())));
    }

    #[test]
    fn rejects_escape_symlink_and_unindexed_file() {
        let dir = tempfile::tempdir().unwrap();
        let outside = tempfile::tempdir().unwrap();
        fs::write(dir.path().join("allowed.md"), "safe").unwrap();
        fs::write(outside.path().join("secret.md"), "secret").unwrap();
        symlink(outside.path().join("secret.md"), dir.path().join("link.md")).unwrap();
        let (mut workspace, info) = Workspace::open(dir.path()).unwrap();
        assert_eq!(info.files.len(), 2);
        assert!(!info.files.iter().find(|file| file.relative_path == "link.md").unwrap().openable);
        assert!(workspace.read("../secret.md").is_err());
        assert!(workspace.read("link.md").is_err());
        assert!(workspace.read("unknown.md").is_err());
        assert_eq!(workspace.read("allowed.md").unwrap().content, "safe");
    }

    #[test]
    fn refuses_stale_and_unsupported_encoding_without_overwrite() {
        let dir = tempfile::tempdir().unwrap();
        fs::write(dir.path().join("stale.md"), "old").unwrap();
        fs::write(dir.path().join("legacy.md"), [0xff, 0xfe]).unwrap();
        fs::write(dir.path().join("mixed.md"), b"first\r\nsecond\n").unwrap();
        let (mut workspace, _) = Workspace::open(dir.path()).unwrap();
        let opened = workspace.read("stale.md").unwrap();
        assert!(workspace.read("legacy.md").is_err());
        assert!(workspace.read("mixed.md").is_err());
        fs::write(dir.path().join("stale.md"), "external").unwrap();
        assert!(workspace.save("stale.md", "ours", &opened.version).is_err());
        assert_eq!(
            fs::read_to_string(dir.path().join("stale.md")).unwrap(),
            "external"
        );
    }

    #[test]
    fn failed_staging_preserves_original_and_success_preserves_mode() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("mode.md");
        fs::write(&path, "before").unwrap();
        fs::set_permissions(&path, fs::Permissions::from_mode(0o640)).unwrap();
        let error = replace_file(&path, b"after", || {
            Err(std::io::Error::other("injected failure"))
        })
        .unwrap_err();
        assert!(error.to_string().contains("injected failure"));
        assert_eq!(fs::read(&path).unwrap(), b"before");
        replace_file(&path, b"after", || Ok(())).unwrap();
        assert_eq!(fs::read(&path).unwrap(), b"after");
        assert_eq!(
            fs::metadata(&path).unwrap().permissions().mode() & 0o777,
            0o640
        );
    }

    #[test]
    fn simulated_disk_full_and_lost_directory_write_access_leave_original() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("protected.md");
        fs::write(&path, "original").unwrap();
        let full = replace_file(&path, b"ours", || {
            Err(std::io::Error::from_raw_os_error(libc::ENOSPC))
        })
        .unwrap_err();
        assert_eq!(full.raw_os_error(), Some(libc::ENOSPC));
        assert_eq!(fs::read(&path).unwrap(), b"original");
        fs::set_permissions(dir.path(), fs::Permissions::from_mode(0o500)).unwrap();
        let denied = replace_file(&path, b"ours", || Ok(()));
        fs::set_permissions(dir.path(), fs::Permissions::from_mode(0o700)).unwrap();
        assert!(denied.is_err());
        assert_eq!(fs::read(&path).unwrap(), b"original");
    }

    #[test]
    fn refuses_change_between_staging_and_rename() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("race.md");
        fs::write(&path, "before").unwrap();
        let original = fs::read(&path).unwrap();
        let error = replace_file(&path, b"ours", || {
            fs::write(&path, "external")?;
            ensure_unchanged(&path, &original)
        })
        .unwrap_err();
        assert_eq!(error.kind(), std::io::ErrorKind::AlreadyExists);
        assert_eq!(fs::read(&path).unwrap(), b"external");
    }

    #[test]
    fn external_change_is_visible_and_old_draft_version_cannot_save() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("chapter.md");
        fs::write(&path, "original").unwrap();
        let (mut workspace, _) = Workspace::open(dir.path()).unwrap();
        let opened = workspace.read("chapter.md").unwrap();
        assert!(!workspace.inspect("chapter.md").unwrap().changed);
        fs::write(&path, "external").unwrap();
        let status = workspace.inspect("chapter.md").unwrap();
        assert!(status.changed);
        assert_eq!(status.content.as_deref(), Some("external"));
        let reopened = workspace.read("chapter.md").unwrap();
        assert_ne!(opened.version, reopened.version);
        assert!(workspace
            .save("chapter.md", "old draft", &opened.version)
            .is_err());
        assert_eq!(fs::read_to_string(&path).unwrap(), "external");
    }

    #[test]
    fn supported_markdown_and_text_formats_save_in_place_without_conversion() {
        let dir = tempfile::tempdir().unwrap();
        let formats = ["md", "markdown", "mdown", "mkd", "txt", "text"];
        for ext in formats {
            fs::write(dir.path().join(format!("sample.{ext}")), b"\xEF\xBB\xBFbefore\r\nafter\r\n").unwrap();
        }
        fs::write(dir.path().join("unsupported.png"), b"keep").unwrap();
        let (mut workspace, info) = Workspace::open(dir.path()).unwrap();
        assert_eq!(info.files.len(), formats.len() + 1);
        for ext in formats {
            let name = format!("sample.{ext}");
            let opened = workspace.read(&name).unwrap();
            assert_eq!(opened.content, "before\r\nafter\r\n");
            workspace.save(&name, "changed\r\nafter\r\n", &opened.version).unwrap();
            assert_eq!(fs::read(dir.path().join(name)).unwrap(), b"\xEF\xBB\xBFchanged\r\nafter\r\n");
        }
        assert!(workspace.read("unsupported.py").is_err());
        fs::write(dir.path().join("code.js"), b"const value = 1;\n").unwrap();
        assert!(workspace.read("code.js").is_err());
    }

    #[test]
    fn text_conversion_creates_new_markdown_without_touching_source() {
        let dir = tempfile::tempdir().unwrap();
        let original = b"\xEF\xBB\xBFplain\r\ntext\r\n";
        fs::write(dir.path().join("note.txt"), original).unwrap();
        let (mut workspace, _) = Workspace::open(dir.path()).unwrap();
        workspace.convert_text_to_markdown("note.txt", "note.md").unwrap();
        assert_eq!(fs::read(dir.path().join("note.txt")).unwrap(), original);
        assert_eq!(fs::read(dir.path().join("note.md")).unwrap(), original);
        assert!(workspace.convert_text_to_markdown("note.txt", "note.md").is_err());
        assert!(workspace.convert_text_to_markdown("note.txt", "../escape.md").is_err());
    }

    #[test]
    fn creates_and_moves_files_without_overwriting_or_escaping() {
        let dir = tempfile::tempdir().unwrap();
        let (mut workspace, _) = Workspace::open(dir.path()).unwrap();
        workspace.create_folder("notes").unwrap();
        workspace.create_markdown("notes/new.md").unwrap();
        assert_eq!(workspace.read("notes/new.md").unwrap().content, "");
        workspace
            .move_item("notes/new.md", "notes/renamed.md")
            .unwrap();
        assert!(workspace.read("notes/new.md").is_err());
        assert_eq!(workspace.read("notes/renamed.md").unwrap().content, "");
        assert!(workspace
            .move_item("notes/renamed.md", "../outside.md")
            .is_err());
        fs::write(dir.path().join("notes/occupied.md"), "keep").unwrap();
        assert!(workspace
            .move_item("notes/renamed.md", "notes/occupied.md")
            .is_err());
        assert_eq!(
            fs::read_to_string(dir.path().join("notes/occupied.md")).unwrap(),
            "keep"
        );
        workspace.create_folder("archive").unwrap();
        workspace.move_item("notes", "archive/notes").unwrap();
        assert!(workspace.read("notes/renamed.md").is_err());
        assert_eq!(
            workspace.read("archive/notes/renamed.md").unwrap().content,
            ""
        );
        assert!(workspace.move_item("archive", "archive/inside").is_err());
    }

    #[test]
    fn moving_text_file_keeps_extension_and_open_version() {
        let dir = tempfile::tempdir().unwrap();
        fs::create_dir(dir.path().join("archive")).unwrap();
        fs::write(dir.path().join("note.txt"), "first").unwrap();
        let (mut workspace, _) = Workspace::open(dir.path()).unwrap();
        let opened = workspace.read("note.txt").unwrap();
        assert!(workspace.move_item("note.txt", "archive/note.md").is_err());
        workspace.move_item("note.txt", "archive/note.txt").unwrap();
        assert!(workspace.read("note.txt").is_err());
        workspace.save("archive/note.txt", "second", &opened.version).unwrap();
        assert_eq!(fs::read_to_string(dir.path().join("archive/note.txt")).unwrap(), "second");
    }

    #[test]
    fn template_create_writes_complete_content_without_overwriting() {
        let dir = tempfile::tempdir().unwrap();
        let (mut workspace, _) = Workspace::open(dir.path()).unwrap();
        workspace.create_markdown_with_content("template.md", "# 标题\n\n正文\n").unwrap();
        assert_eq!(workspace.read("template.md").unwrap().content, "# 标题\n\n正文\n");
        assert!(workspace.create_markdown_with_content("template.md", "replacement").is_err());
        assert_eq!(fs::read_to_string(dir.path().join("template.md")).unwrap(), "# 标题\n\n正文\n");
    }

    #[test]
    fn draft_survives_reopen_without_modifying_original() {
        let dir = tempfile::tempdir().unwrap();
        let original = dir.path().join("chapter.md");
        let draft_path = dir.path().join("draft.json");
        fs::write(&original, "disk").unwrap();
        let (mut workspace, _) = Workspace::open(dir.path()).unwrap();
        let opened = workspace.read("chapter.md").unwrap();
        let draft = Draft {
            relative_path: "chapter.md".into(),
            content: "unsaved".into(),
            baseline_hash: opened.version.clone(),
            updated: 1,
        };
        write_draft_file(&draft_path, &draft).unwrap();
        drop(workspace);
        let recovered = read_draft_file(&draft_path).unwrap().unwrap();
        assert_eq!(recovered.content, "unsaved");
        assert_eq!(fs::read_to_string(&original).unwrap(), "disk");
        fs::write(&original, "external").unwrap();
        let (mut reopened, _) = Workspace::open(dir.path()).unwrap();
        reopened.read("chapter.md").unwrap();
        assert!(reopened
            .save("chapter.md", &recovered.content, &recovered.baseline_hash)
            .is_err());
        assert_eq!(fs::read_to_string(&original).unwrap(), "external");
    }

    #[test]
    fn imported_images_keep_unique_names_and_stay_inside_workspace() {
        let dir = tempfile::tempdir().unwrap();
        let external = tempfile::tempdir().unwrap();
        fs::create_dir(dir.path().join("notes")).unwrap();
        fs::write(dir.path().join("notes/page.md"), "# Page\n").unwrap();
        let source = external.path().join("图 片.png");
        fs::write(&source, b"pngbytes").unwrap();
        let (mut workspace, _) = Workspace::open(dir.path()).unwrap();
        workspace.read("notes/page.md").unwrap();
        let first = workspace.import_image(&source, "notes/page.md", "assets/images", None).unwrap();
        assert_eq!(first, "../assets/images/%E5%9B%BE%20%E7%89%87.png");
        assert_eq!(workspace.read_image("notes/page.md", &first).unwrap(), "data:image/png;base64,cG5nYnl0ZXM=");
        let second = workspace.import_image(&source, "notes/page.md", "assets/images", None).unwrap();
        assert!(second.ends_with("-1.png"));
        assert_eq!(fs::read(&source).unwrap(), b"pngbytes");
        assert!(workspace.import_image(&source, "notes/page.md", "../escape", None).is_err());
        assert!(workspace.read_image("notes/page.md", "../../outside.png").is_err());
        assert!(workspace.read_image("notes/page.md", "https://example.com/x.png").is_err());
    }
    #[test]
    fn indexed_move_detects_new_external_references_and_stale_plan() {
        let dir = tempfile::tempdir().unwrap();
        fs::create_dir(dir.path().join("archive")).unwrap();
        fs::write(dir.path().join("target.md"), "# target").unwrap();
        let (mut workspace, _) = Workspace::open(dir.path()).unwrap();
        let preview = workspace.preview_move_item("target.md", "archive/target.md").unwrap();
        fs::write(dir.path().join("new.md"), "[target](target.md)").unwrap();
        assert!(workspace.move_item_with_links("target.md", "archive/target.md", &preview.token).is_err());
        assert!(dir.path().join("target.md").exists());
        let preview = workspace.preview_move_item("target.md", "archive/target.md").unwrap();
        assert_eq!(preview.links.len(), 1);
        workspace.move_item_with_links("target.md", "archive/target.md", &preview.token).unwrap();
        assert_eq!(fs::read_to_string(dir.path().join("new.md")).unwrap(), "[target](archive/target.md)");
    }

    #[test]
    fn indexed_move_falls_back_when_database_is_unavailable() {
        let dir = tempfile::tempdir().unwrap();
        fs::create_dir(dir.path().join("archive")).unwrap();
        fs::write(dir.path().join("target.md"), "# target").unwrap();
        fs::write(dir.path().join("a.md"), "[target](target.md)").unwrap();
        let (mut workspace, _) = Workspace::open(dir.path()).unwrap();
        *workspace.index.lock().unwrap() = None;
        let preview = workspace.preview_move_item("target.md", "archive/target.md").unwrap();
        assert_eq!(preview.links.len(), 1);
        workspace.move_item_with_links("target.md", "archive/target.md", &preview.token).unwrap();
        assert_eq!(fs::read_to_string(dir.path().join("a.md")).unwrap(), "[target](archive/target.md)");
    }

    #[test]
    #[ignore = "manual move performance measurement"]
    fn measure_drop_move_latency() {
        let dir = tempfile::tempdir().unwrap();
        fs::create_dir(dir.path().join("archive")).unwrap();
        for n in 0..8 {
            fs::write(dir.path().join(format!("export-{n}.html")), "<p>exported content</p>".repeat(100_000)).unwrap();
        }
        fs::write(dir.path().join("target.md"), "# target").unwrap();
        fs::write(dir.path().join("a.md"), "[target](target.md)").unwrap();
        let (mut workspace, _) = Workspace::open(dir.path()).unwrap();
        let start = std::time::Instant::now();
        let preview = workspace.preview_move_item("target.md", "archive/target.md").unwrap();
        let preview_time = start.elapsed();
        let result = workspace.move_item_with_links("target.md", "archive/target.md", &preview.token).unwrap();
        assert_eq!(result.updated.len(), 1);
        let elapsed = start.elapsed();
        eprintln!("move timing: preview={:?}, total={:?}", preview_time, elapsed);
        assert!(elapsed < std::time::Duration::from_millis(500), "unchanged exports must not be rehashed during drop: {elapsed:?}");
    }

    #[test]
    fn move_and_refresh_tasks_run_off_calling_thread() {
        let caller = std::thread::current().id();
        let worker = tauri::async_runtime::block_on(workspace_task(|| Ok(std::thread::current().id()))).unwrap();
        assert_ne!(caller, worker);
    }

    #[test]
    fn linked_resources_resolve_relative_files_and_reject_escape() {
        let dir = tempfile::tempdir().unwrap();
        fs::create_dir(dir.path().join("notes")).unwrap();
        fs::write(dir.path().join("notes/a.md"), "# A").unwrap();
        fs::write(dir.path().join("image name.png"), b"image").unwrap();
        let (workspace, _) = Workspace::open(dir.path()).unwrap();
        assert_eq!(workspace.linked_item("notes/a.md", "../image%20name.png").unwrap(), dir.path().canonicalize().unwrap().join("image name.png"));
        assert_eq!(workspace.linked_item("notes/a.md", "../").unwrap(), dir.path().canonicalize().unwrap());
        assert!(workspace.linked_item("notes/a.md", "../../outside").is_err());
        assert!(workspace.linked_item("notes/a.md", "https://example.com").is_err());
        assert!(workspace.linked_item("missing.md", "../").is_err());
    }

    #[test]
    fn indexed_completion_refreshes_external_changes_and_rejects_wrong_workspace_scope() {
        let dir = tempfile::tempdir().unwrap();
        fs::write(dir.path().join("a.md"),"# A").unwrap();
        fs::create_dir(dir.path().join("empty")).unwrap();
        let (workspace,_) = Workspace::open(dir.path()).unwrap();
        let root = workspace.root.to_string_lossy().to_string();
        assert_eq!(workspace.complete_links(&root,"a.md","empty",None).unwrap()[0].path,"empty");
        fs::write(dir.path().join("new.md"),"# New").unwrap();
        workspace.info().unwrap();
        assert_eq!(workspace.complete_links(&root,"a.md","new",None).unwrap()[0].path,"new.md");
        assert!(workspace.complete_links("/wrong-root","a.md","",None).is_err());
        assert!(workspace.complete_links(&root,"a.md","",Some("../")).is_err());
    }

    #[test]
    fn indexed_search_matches_existing_scan_and_tracks_external_refresh() {
        let dir = tempfile::tempdir().unwrap();
        fs::write(dir.path().join("a.md"),"first\n中文关键词 ENGLISH mixedCASE\n标点: [x] % underscore_\n").unwrap();
        fs::write(dir.path().join("DRAFT.css"),"body { color: red; }").unwrap();
        let (workspace,_) = Workspace::open(dir.path()).unwrap();
        for query in ["中文关键词","中文","中","English","mixedcase","[x]","%","_","DRAFT","absent"] {
            assert_eq!(search_workspace(&workspace,query).unwrap(),search_workspace_files(&workspace,query).unwrap(),"{query}");
        }
        fs::write(dir.path().join("new.md"),"new external keyword").unwrap();
        workspace.info().unwrap();
        assert_eq!(search_workspace(&workspace,"external").unwrap()[0].relative_path,"new.md");
        fs::remove_file(dir.path().join("new.md")).unwrap();
        workspace.info().unwrap();
        assert!(search_workspace(&workspace,"external").unwrap().is_empty());
    }

    #[test]
    fn full_listing_keeps_document_state_available_during_background_index_wait() {
        let dir = tempfile::tempdir().unwrap();
        fs::write(dir.path().join("note.md"), "saved").unwrap();
        let state = Arc::new(WorkspaceState::default());
        let (workspace, _) = Workspace::open(dir.path()).unwrap();
        let index = Arc::clone(&workspace.index);
        state.install(workspace).unwrap();
        let guard = index.lock().unwrap();
        let owners = Arc::strong_count(&index);
        let task_state = Arc::clone(&state);
        let listing = std::thread::spawn(move || refresh_listing(&task_state, None, false));
        let deadline = std::time::Instant::now() + std::time::Duration::from_secs(1);
        while Arc::strong_count(&index) == owners && std::time::Instant::now() < deadline { std::thread::yield_now(); }
        let (tx, rx) = std::sync::mpsc::channel();
        let read_state = Arc::clone(&state);
        let reader = std::thread::spawn(move || {
            tx.send(read_state.with_root(None, |workspace| workspace.read("note.md")).map(|file| file.content)).unwrap();
        });
        let read = rx.recv_timeout(std::time::Duration::from_millis(100));
        drop(guard);
        listing.join().unwrap().unwrap();
        reader.join().unwrap();
        assert_eq!(read.expect("background listing blocks document state").unwrap(), "saved");
    }

    #[test]
    fn indexed_listing_does_not_hold_up_file_reads_while_indexer_is_busy() {
        let dir = tempfile::tempdir().unwrap();
        fs::write(dir.path().join("note.md"), "saved").unwrap();
        let state = Arc::new(WorkspaceState::default());
        let (workspace, _) = Workspace::open(dir.path()).unwrap();
        let index = Arc::clone(&workspace.index);
        state.install(workspace).unwrap();
        let guard = index.lock().unwrap();
        let (tx, rx) = std::sync::mpsc::channel();
        let task_state = Arc::clone(&state);
        let task = std::thread::spawn(move || {
            let result = refresh_listing(&task_state, None, true);
            tx.send(result.is_err()).unwrap();
        });
        let returned = rx.recv_timeout(std::time::Duration::from_millis(100));
        drop(guard);
        task.join().unwrap();
        assert!(returned.is_ok(), "listing waits for indexing while holding the workspace lock");
        assert_eq!(state.with_root(None, |workspace| workspace.read("note.md")).unwrap().content, "saved");
    }

    #[test]
    fn cached_directory_can_activate_while_its_background_index_is_locked() {
        let a = tempfile::tempdir().unwrap();
        let b = tempfile::tempdir().unwrap();
        fs::write(a.path().join("note.md"), "A").unwrap();
        let state = WorkspaceState::default();
        let (workspace, _) = Workspace::open_interactive(a.path(), None).unwrap();
        let index = Arc::clone(&workspace.index);
        state.install(workspace).unwrap();
        state.install(Workspace::open_interactive(b.path(), None).unwrap().0).unwrap();
        let _guard = index.lock().unwrap();
        let info = state.activate_cached(&a.path().canonicalize().unwrap()).unwrap().unwrap();
        assert_eq!(info.files.len(), 1);
        assert_eq!(state.with_root(Some(&info.root), |workspace| workspace.read("note.md")).unwrap().content, "A");
    }

    #[test]
    #[ignore = "manual synthetic directory performance measurement"]
    fn benchmark_interactive_directory_loading() {
        use std::time::Instant;
        for count in [1000, 10000] {
            let dir = tempfile::tempdir().unwrap();
            let body = "# Note\nA paragraph with a [link](note.md) and 中文内容。\n".repeat(32);
            for group in 0..10 { fs::create_dir(dir.path().join(format!("group{group}"))).unwrap(); }
            for n in 0..count { fs::write(dir.path().join(format!("group{}/note{n}.md", n % 10)), &body).unwrap(); }
            let mut eager = Vec::new(); let mut interactive = Vec::new();
            for _ in 0..3 {
                let start = Instant::now();
                let previous = Workspace::open(dir.path()).unwrap();
                eager.push(start.elapsed().as_secs_f64()*1000.0); drop(previous);
                let start = Instant::now();
                let current = Workspace::open_interactive(dir.path(), None).unwrap();
                interactive.push(start.elapsed().as_secs_f64()*1000.0); drop(current);
            }
            eager.sort_by(f64::total_cmp); interactive.sort_by(f64::total_cmp);
            let state = Arc::new(WorkspaceState::default());
            let (workspace, _) = Workspace::open_interactive(dir.path(), None).unwrap();
            let index = Arc::clone(&workspace.index); let root = workspace.root.clone();
            state.install(workspace).unwrap();
            let (tx, rx) = std::sync::mpsc::channel();
            let worker = std::thread::spawn(move || {
                let mut guard = index.lock().unwrap();
                *guard = Some(crate::file_index::FileIndex::for_root(&root).unwrap());
                tx.send(()).unwrap();
                let start = Instant::now();
                crate::index_worker::rebuild(&root, guard.as_mut().unwrap()).unwrap();
                start.elapsed().as_secs_f64()*1000.0
            });
            rx.recv().unwrap();
            let mut reads = Vec::new();
            for _ in 0..100 {
                let start = Instant::now();
                state.with_root(None, |workspace| workspace.read("group0/note0.md")).unwrap();
                reads.push(start.elapsed().as_secs_f64()*1000.0);
            }
            reads.sort_by(f64::total_cmp);
            let background = worker.join().unwrap();
            let mut cached = Vec::new();
            for _ in 0..100 {
                let start = Instant::now(); state.activate_cached(&dir.path().canonicalize().unwrap()).unwrap();
                cached.push(start.elapsed().as_secs_f64()*1000.0);
            }
            cached.sort_by(f64::total_cmp);
            println!("PERF files={count} bytes_each={} eager_median_ms={:.2} interactive_median_ms={:.2} background_index_ms={:.2} read_p95_ms={:.3} cached_p95_ms={:.3}", body.len(), eager[1], interactive[1], background, reads[94], cached[94]);
        }
    }

    #[test]
    fn opening_directory_returns_listing_before_indexing_file_contents() {
        let dir = tempfile::tempdir().unwrap();
        fs::write(dir.path().join("note.md"), "# editable immediately").unwrap();
        let (mut workspace, info) = Workspace::open_interactive(dir.path(), None).unwrap();
        assert_eq!(info.files.len(), 1);
        assert!(info.files[0].excerpt.is_empty(), "opening a directory still waits for content reads");
        assert_eq!(workspace.read("note.md").unwrap().content, "# editable immediately");
        assert!(workspace.index.lock().unwrap().is_none(), "opening a directory still initializes the full catalog");
    }

    #[test]
    fn saving_into_new_directory_does_not_index_sibling_content_before_returning() {
        let dir = tempfile::tempdir().unwrap();
        fs::write(dir.path().join("saved.md"), "saved body").unwrap();
        fs::write(dir.path().join("sibling.md"), "sibling body").unwrap();
        let (mut workspace, info) = Workspace::open_interactive(dir.path(), None).unwrap();
        assert_eq!(info.files.len(), 2);
        assert!(info.files.iter().all(|file| file.excerpt.is_empty()), "save waits for sibling previews");
        assert_eq!(workspace.read("saved.md").unwrap().content, "saved body");
        assert!(workspace.index.lock().unwrap().is_none(), "save waits for full directory indexing");
        let mut guard = workspace.index.lock().unwrap();
        *guard = Some(crate::file_index::FileIndex::for_root(&workspace.root).unwrap());
        let index = guard.as_mut().unwrap();
        crate::index_worker::rebuild(&workspace.root, index).unwrap();
        assert_eq!(index.text_encodings().unwrap().get("sibling.md"), Some(&Some(true)));
    }

    #[test]
    fn cached_directories_keep_same_name_file_baselines_isolated() {
        let a = tempfile::tempdir().unwrap(); let b = tempfile::tempdir().unwrap();
        fs::write(a.path().join("note.md"), "A").unwrap(); fs::write(b.path().join("note.md"), "B").unwrap();
        let state = WorkspaceState::default();
        state.install(Workspace::open(a.path()).unwrap().0).unwrap();
        let root_a = a.path().canonicalize().unwrap().to_string_lossy().into_owned();
        let root_b = b.path().canonicalize().unwrap().to_string_lossy().into_owned();
        assert_eq!(state.with_root(Some(&root_a), |workspace| workspace.read("note.md")).unwrap().content, "A");
        state.install(Workspace::open(b.path()).unwrap().0).unwrap();
        assert_eq!(state.with_root(Some(&root_b), |workspace| workspace.read("note.md")).unwrap().content, "B");
        assert_eq!(state.with_root(Some(&root_a), |workspace| workspace.read("note.md")).unwrap().content, "A");
        assert!(state.with_root(Some("/not-the-requested-root"), |workspace| workspace.read("note.md")).is_err());
        let info = state.activate_cached(Path::new(&root_a)).unwrap().unwrap();
        assert_eq!(info.root, root_a); assert_eq!(info.files.len(), 1);
        assert_eq!(state.0.lock().unwrap().as_ref().unwrap().root, Path::new(&root_a));
    }

    #[test]
    fn directory_context_cache_is_bounded_and_preserves_catalog_queries() {
        let state = WorkspaceState::default(); let directories: Vec<_> = (0..6).map(|_| tempfile::tempdir().unwrap()).collect();
        for directory in &directories {
            fs::create_dir(directory.path().join("Child")).unwrap(); fs::write(directory.path().join("Child/note.md"), "hello").unwrap();
            state.install(Workspace::open(directory.path()).unwrap().0).unwrap();
        }
        assert_eq!(state.1.lock().unwrap().len(), 3);
        let root = directories[4].path().canonicalize().unwrap();
        let info = state.activate_cached(&root).unwrap().unwrap();
        assert_eq!(info.directories, vec!["Child"]);
        assert_eq!(info.files[0].relative_path, "Child/note.md");
        assert_eq!(state.1.lock().unwrap().len(), 3);
    }

}

use crate::sync_policy::{self, ConflictPolicy};
use percent_encoding::percent_decode_str;
use quick_xml::{events::Event, Reader};
use reqwest::{blocking::{Client, RequestBuilder}, Method, StatusCode, Url};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{collections::{BTreeMap, BTreeSet}, fs, io::Read, path::{Path, PathBuf}, sync::Mutex, time::{Duration, SystemTime, UNIX_EPOCH}};
use tauri::{AppHandle, Manager};
use crate::workspace::WorkspaceState;

const MAX_FILE: u64 = 20 * 1024 * 1024;
const MAX_FILES: usize = 10000;
pub struct SyncLock(pub Mutex<()>);
impl Default for SyncLock { fn default() -> Self { Self(Mutex::new(())) } }

#[derive(Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncResult { pub uploaded: usize, pub downloaded: usize, pub deleted_local: usize, pub deleted_remote: usize, pub conflicts: Vec<String>, pub copies: Vec<String>, pub changed: Vec<String> }
#[derive(Clone, Serialize, Deserialize)]
struct KnownFile { hash: String, etag: Option<String> }
#[derive(Default, Serialize, Deserialize)]
struct Manifest { files: BTreeMap<String, KnownFile> }
#[derive(Clone)]
struct RemoteFile { url: Url, etag: Option<String> }
struct Dav { client: Client, base: Url, user: String, password: String }

fn hash(bytes: &[u8]) -> String { format!("{:x}", Sha256::digest(bytes)) }
fn credential_id(url: &str, user: &str) -> String { hash(format!("{url}\0{user}").as_bytes()) }
fn credential(url: &str, user: &str) -> Result<keyring::Entry, String> {
    keyring::Entry::new("com.markart.webdav", &credential_id(url, user)).map_err(|error| error.to_string())
}
fn base_url(url: &str) -> Result<Url, String> {
    let mut base = Url::parse(url.trim()).map_err(|error| error.to_string())?;
    let local = matches!(base.host_str(), Some("localhost" | "127.0.0.1" | "::1"));
    if base.scheme() != "https" && !(base.scheme() == "http" && local) { return Err("WebDAV 地址须使用 HTTPS；仅本机测试地址可使用 HTTP".into()); }
    if !base.username().is_empty() || base.password().is_some() || base.query().is_some() || base.fragment().is_some() { return Err("WebDAV 地址不能包含账号、密码、查询或片段".into()); }
    if !base.path().ends_with('/') { base.set_path(&format!("{}/", base.path())); }
    Ok(base)
}
impl Dav {
    fn new(url: &str, user: &str, password: &str) -> Result<Self, String> {
        let base = base_url(url)?;
        let client = Client::builder().timeout(Duration::from_secs(30)).redirect(reqwest::redirect::Policy::none()).build().map_err(|error| error.to_string())?;
        Ok(Self { client, base, user: user.to_owned(), password: password.to_owned() })
    }
    fn request(&self, method: Method, url: Url) -> RequestBuilder { self.client.request(method, url).basic_auth(&self.user, Some(&self.password)) }
    fn url(&self, path: &str) -> Result<Url, String> {
        let mut url = self.base.clone();
        { let mut segments = url.path_segments_mut().map_err(|_| "WebDAV 地址路径无效")?; segments.pop_if_empty(); for part in path.split('/') { if !part.is_empty() { segments.push(part); } } if path.ends_with('/') { segments.push(""); } }
        Ok(url)
    }
    fn propfind(&self, url: Url) -> Result<Vec<(Url, bool, Option<String>)>, String> {
        let method = Method::from_bytes(b"PROPFIND").map_err(|error| error.to_string())?;
        let response = self.request(method, url.clone()).header("Depth", "1").header("Content-Type", "application/xml")
            .body("<?xml version=\"1.0\"?><d:propfind xmlns:d=\"DAV:\"><d:prop><d:resourcetype/><d:getetag/></d:prop></d:propfind>")
            .send().map_err(|error| error.to_string())?;
        if response.status() != StatusCode::MULTI_STATUS { return Err(format!("WebDAV 文件夹读取失败：HTTP {}", response.status())); }
        let text = response.text().map_err(|error| error.to_string())?;
        if text.len() > 4 * 1024 * 1024 { return Err("WebDAV 目录响应过大".into()); }
        parse_propfind(&url, &text)
    }
    fn get(&self, file: &RemoteFile) -> Result<Vec<u8>, String> {
        let response = self.request(Method::GET, file.url.clone()).send().map_err(|error| error.to_string())?;
        if !response.status().is_success() { return Err(format!("WebDAV 文件读取失败：HTTP {}", response.status())); }
        if response.content_length().is_some_and(|size| size > MAX_FILE) { return Err("WebDAV 文件超过 20 MB".into()); }
        let mut bytes = Vec::new();
        response.take(MAX_FILE + 1).read_to_end(&mut bytes).map_err(|error| error.to_string())?;
        if bytes.len() as u64 > MAX_FILE { return Err("WebDAV 文件超过 20 MB".into()); }
        Ok(bytes)
    }
    fn ensure_dirs(&self, path: &str) -> Result<(), String> {
        let parts: Vec<_> = path.split('/').collect();
        for count in 1..parts.len() {
            let directory = parts[..count].join("/");
            let response = self.request(Method::from_bytes(b"MKCOL").unwrap(), self.url(&format!("{directory}/"))?).send().map_err(|error| error.to_string())?;
            if !response.status().is_success() && response.status() != StatusCode::METHOD_NOT_ALLOWED { return Err(format!("WebDAV 创建目录失败：HTTP {}", response.status())); }
        }
        Ok(())
    }
    fn put(&self, path: &str, bytes: Vec<u8>, etag: Option<&str>) -> Result<Option<String>, String> {
        self.ensure_dirs(path)?;
        let mut request = self.request(Method::PUT, self.url(path)?).body(bytes);
        request = if let Some(tag) = etag { request.header("If-Match", tag) } else { request.header("If-None-Match", "*") };
        let response = request.send().map_err(|error| error.to_string())?;
        if response.status() == StatusCode::PRECONDITION_FAILED { return Err("远端文件已修改，未覆盖；请重新同步".into()); }
        if !response.status().is_success() { return Err(format!("WebDAV 上传失败：HTTP {}", response.status())); }
        Ok(response.headers().get("etag").and_then(|value| value.to_str().ok()).map(str::to_owned))
    }
    fn delete(&self, file: &RemoteFile) -> Result<(), String> {
        let tag = file.etag.as_deref().ok_or("远端缺少 ETag，无法安全同步删除")?;
        let response = self.request(Method::DELETE, file.url.clone()).header("If-Match", tag).send().map_err(|error| error.to_string())?;
        if response.status() == StatusCode::PRECONDITION_FAILED { return Err("远端文件已修改，未删除；请重新同步".into()); }
        if !response.status().is_success() { return Err(format!("WebDAV 删除失败：HTTP {}", response.status())); }
        Ok(())
    }
    fn list(&self) -> Result<BTreeMap<String, RemoteFile>, String> {
        let mut files = BTreeMap::new();
        let mut pending = vec![self.base.clone()];
        let mut visited = BTreeSet::new();
        while let Some(directory) = pending.pop() {
            if !visited.insert(directory.to_string()) { continue; }
            if visited.len() > MAX_FILES { return Err("WebDAV 目录数量超出限制".into()); }
            for (url, is_dir, etag) in self.propfind(directory.clone())? {
                if url.path().trim_end_matches('/') == directory.path().trim_end_matches('/') { continue; }
                if url.origin() != self.base.origin() || !url.path().starts_with(self.base.path()) { return Err("WebDAV 返回了目录外路径".into()); }
                let encoded = url.path().strip_prefix(self.base.path()).ok_or("WebDAV 路径越界")?.trim_end_matches('/');
                if encoded.to_ascii_lowercase().contains("%2f") || encoded.to_ascii_lowercase().contains("%5c") { return Err("WebDAV 路径含编码分隔符".into()); }
                let decoded = percent_decode_str(encoded).decode_utf8().map_err(|error| error.to_string())?.to_string();
                if !safe_relative(&decoded) { return Err(format!("WebDAV 返回了非法文件路径：{decoded:?}，来源 {url}")); }
                if decoded.split('/').any(|part| part == ".git") { continue; }
                if is_dir { pending.push(url); } else { files.insert(decoded, RemoteFile { url, etag }); }
                if files.len() > MAX_FILES { return Err("WebDAV 文件数量超出限制".into()); }
            }
        }
        Ok(files)
    }
}

fn local_name(name: &[u8]) -> &[u8] { name.rsplit(|byte| *byte == b':').next().unwrap_or(name) }
fn parse_propfind(base: &Url, xml: &str) -> Result<Vec<(Url, bool, Option<String>)>, String> {
    let mut reader = Reader::from_str(xml);
    let mut result = Vec::new();
    let (mut href, mut etag, mut collection, mut field) = (String::new(), None, false, Vec::new());
    loop {
        match reader.read_event().map_err(|error| error.to_string())? {
            Event::Start(event) => { let name = local_name(event.name().as_ref()).to_vec(); if name == b"response" { href.clear(); etag = None; collection = false; } else if name == b"href" || name == b"getetag" { field = name; } else if name == b"collection" { collection = true; } },
            Event::Empty(event) if local_name(event.name().as_ref()) == b"collection" => collection = true,
            Event::Text(event) => { let value = event.unescape().map_err(|error| error.to_string())?.into_owned(); if field == b"href" { href.push_str(&value); } else if field == b"getetag" { etag = Some(value); } },
            Event::End(event) => { let name = local_name(event.name().as_ref()).to_vec(); if name == b"response" { if !href.is_empty() { result.push((base.join(&href).map_err(|error| error.to_string())?, collection, etag.take())); } } else if name == b"href" || name == b"getetag" { field.clear(); } },
            Event::Eof => break,
            _ => {}
        }
    }
    if result.is_empty() { return Err("WebDAV 目录响应没有文件条目".into()); }
    Ok(result)
}
fn safe_relative(path: &str) -> bool { !path.is_empty() && path.split('/').all(|part| !part.is_empty() && part != "." && part != ".." && !part.contains(['\\', '\0'])) }
fn local_files(root: &Path) -> Result<BTreeMap<String, PathBuf>, String> {
    fn visit(root: &Path, dir: &Path, files: &mut BTreeMap<String, PathBuf>) -> Result<(), String> {
        for item in fs::read_dir(dir).map_err(|error| error.to_string())? {
            let item = item.map_err(|error| error.to_string())?;
            if item.file_name() == ".git" { continue; }
            let path = item.path();
            let meta = fs::symlink_metadata(&path).map_err(|error| error.to_string())?;
            if meta.file_type().is_symlink() { continue; }
            if meta.is_dir() { visit(root, &path, files)?; }
            else if meta.is_file() {
                let relative = path.strip_prefix(root).map_err(|error| error.to_string())?.to_string_lossy().replace('\\', "/");
                if !safe_relative(&relative) { continue; }
                files.insert(relative, path);
                if files.len() > MAX_FILES { return Err("本地文件数量超出同步限制".into()); }
            }
        }
        Ok(())
    }
    let mut files = BTreeMap::new(); visit(root, root, &mut files)?; Ok(files)
}
fn safe_local_target(root: &Path, relative: &str) -> Result<PathBuf, String> {
    if !safe_relative(relative) { return Err("本地同步路径无效".into()); }
    let mut current = root.to_path_buf();
    let parts: Vec<_> = relative.split('/').collect();
    for part in &parts[..parts.len() - 1] {
        current.push(part);
        match fs::symlink_metadata(&current) {
            Ok(meta) if meta.is_dir() && !meta.file_type().is_symlink() => {},
            Ok(_) => return Err("同步路径包含符号链接或非目录".into()),
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => fs::create_dir(&current).map_err(|error| error.to_string())?,
            Err(error) => return Err(error.to_string()),
        }
    }
    let target = current.join(parts.last().ok_or("本地同步路径无效")?);
    if let Ok(meta) = fs::symlink_metadata(&target) { if meta.file_type().is_symlink() || !meta.is_file() { return Err("同步目标不是普通文件".into()); } }
    Ok(target)
}
fn state_path(app_data: &Path, root: &Path, url: &str, user: &str) -> PathBuf {
    app_data.join("webdav").join(format!("{}.json", hash(format!("{}\0{url}\0{user}", root.display()).as_bytes())))
}
fn check_binding(app_data: &Path, root: &Path, url: &str, user: &str) -> Result<(), String> {
    let path = app_data.join("webdav").join("bindings").join(hash(format!("{url}\0{user}").as_bytes()));
    fs::create_dir_all(path.parent().ok_or("WebDAV 绑定路径无效")?).map_err(|error| error.to_string())?;
    let current = root.to_string_lossy();
    match fs::read_to_string(&path) {
        Ok(bound) if bound == current => Ok(()),
        Ok(_) => Err("此 WebDAV 地址已关联另一处本地目录；请为当前目录使用独立的远端目录地址".into()),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => match fs::OpenOptions::new().write(true).create_new(true).open(&path) {
            Ok(mut file) => { std::io::Write::write_all(&mut file, current.as_bytes()).map_err(|error| error.to_string())?; file.sync_all().map_err(|error| error.to_string()) },
            Err(error) if error.kind() == std::io::ErrorKind::AlreadyExists => check_binding(app_data, root, url, user),
            Err(error) => Err(error.to_string()),
        },
        Err(error) => Err(error.to_string()),
    }
}
fn save_manifest(path: &Path, manifest: &Manifest) -> Result<(), String> {
    fs::create_dir_all(path.parent().ok_or("同步状态路径无效")?).map_err(|error| error.to_string())?;
    let mut staged = tempfile::NamedTempFile::new_in(path.parent().unwrap()).map_err(|error| error.to_string())?;
    serde_json::to_writer(&mut staged, manifest).map_err(|error| error.to_string())?;
    staged.as_file().sync_all().map_err(|error| error.to_string())?;
    staged.persist(path).map_err(|error| error.error.to_string())?;
    Ok(())
}
fn backup(app_data: &Path, root: &Path, relative: &str, bytes: &[u8]) -> Result<(), String> {
    let stamp = SystemTime::now().duration_since(UNIX_EPOCH).map_err(|error| error.to_string())?.as_nanos();
    let path = app_data.join("webdav-deleted").join(hash(root.to_string_lossy().as_bytes())).join(stamp.to_string()).join(relative);
    fs::create_dir_all(path.parent().ok_or("备份路径无效")?).map_err(|error| error.to_string())?;
    fs::write(path, bytes).map_err(|error| error.to_string())
}
fn write_local(path: &Path, bytes: &[u8], old: Option<&[u8]>) -> Result<(), String> {
    fs::create_dir_all(path.parent().ok_or("本地路径无效")?).map_err(|error| error.to_string())?;
    if let Some(expected) = old { if fs::read(path).map_err(|error| error.to_string())? != expected { return Err("本地文件已修改，未覆盖；请重新同步".into()); } }
    let mut staged = tempfile::NamedTempFile::new_in(path.parent().unwrap()).map_err(|error| error.to_string())?;
    std::io::Write::write_all(&mut staged, bytes).map_err(|error| error.to_string())?;
    staged.as_file().sync_all().map_err(|error| error.to_string())?;
    if old.is_none() && path.exists() { return Err("本地已存在同名文件，未覆盖；请检查后重新同步".into()); }
    staged.persist(path).map_err(|error| error.error.to_string())?;
    Ok(())
}

#[cfg(test)]
fn sync_core(root: &Path, app_data: &Path, url: &str, user: &str, password: &str, protected: &[String]) -> Result<SyncResult, String> {
    sync_with_policy(root, app_data, url, user, password, protected, ConflictPolicy::Merge)
}
fn sync_with_policy(root: &Path, app_data: &Path, url: &str, user: &str, password: &str, protected: &[String], policy: ConflictPolicy) -> Result<SyncResult, String> {
    let cache = app_data.join("webdav").join("content");
    fs::create_dir_all(&cache).map_err(|e| e.to_string())?;
    let dav = Dav::new(url, user, password)?;
    let root = root.canonicalize().map_err(|error| error.to_string())?;
    check_binding(app_data, &root, dav.base.as_str(), user)?;
    let remote = dav.list()?;
    let local = local_files(&root)?;
    let manifest_path = state_path(app_data, &root, dav.base.as_str(), user);
    let mut manifest: Manifest = if manifest_path.exists() { serde_json::from_slice(&fs::read(&manifest_path).map_err(|error| error.to_string())?).map_err(|error| format!("同步状态损坏，已停止：{error}"))? } else { Manifest::default() };
    let mut result = SyncResult::default();
    let keys: BTreeSet<String> = local.keys().chain(remote.keys()).chain(manifest.files.keys()).cloned().collect();
    for path in keys {
        if protected.iter().any(|name| name == &path) { continue; }
        let baseline = manifest.files.get(&path).cloned();
        let local_path = match safe_local_target(&root, &path) { Ok(path) => path, Err(error) => { result.conflicts.push(format!("{path}：{error}")); continue; } };
        let local_bytes = if local.contains_key(&path) { let metadata = fs::metadata(&local_path).map_err(|error| error.to_string())?; if metadata.len() > MAX_FILE { result.conflicts.push(format!("{path}：文件超过 20 MB")); continue; } Some(fs::read(&local_path).map_err(|error| error.to_string())?) } else { None };
        let local_hash = local_bytes.as_ref().map(|bytes| hash(bytes));
        let remote_file = remote.get(&path);
        let remote_bytes = if let Some(file) = remote_file {
            if baseline.as_ref().is_some_and(|known| known.etag.is_some() && known.etag == file.etag) { None }
            else { match dav.get(file) { Ok(bytes) => Some(bytes), Err(error) => { result.conflicts.push(format!("{path}：{error}")); continue; } } }
        } else { None };
        let remote_hash = remote_file.map(|_| remote_bytes.as_ref().map(|bytes| hash(bytes)).unwrap_or_else(|| baseline.as_ref().map(|known| known.hash.clone()).unwrap_or_default()));
        let base_hash = baseline.as_ref().map(|known| &known.hash);
        let mut operation = match (local_hash.as_ref(), remote_hash.as_ref(), base_hash) {
            (None, None, _) => { manifest.files.remove(&path); continue; }
            (Some(left), Some(right), _) if left == right => { fs::write(cache.join(left), local_bytes.as_ref().unwrap()).map_err(|e| e.to_string())?; manifest.files.insert(path.clone(), KnownFile { hash: left.clone(), etag: remote_file.and_then(|file| file.etag.clone()) }); continue; }
            (Some(_), None, None) => "upload-new",
            (None, Some(_), None) => "download-new",
            (Some(_), Some(_), None) => "conflict",
            (Some(left), Some(right), Some(base)) if left == base && right != base => "download",
            (Some(left), Some(right), Some(base)) if right == base && left != base => "upload",
            (None, Some(right), Some(base)) if right == base => "delete-remote",
            (Some(left), None, Some(base)) if left == base => "delete-local",
            _ => "conflict",
        };
        if operation == "conflict" {
            if matches!(policy, ConflictPolicy::Remote) {
                operation = if remote_file.is_some() { "download" } else { "delete-local" };
            } else {
                match (local_bytes.as_deref(), remote_bytes.as_deref()) {
                    (Some(left), Some(right)) => {
                        let base = baseline.as_ref().and_then(|known| fs::read(cache.join(&known.hash)).ok().filter(|bytes| hash(bytes) == known.hash));
                        let merged = sync_policy::merge(base.as_deref(), left, right)?;
                        let bytes = if let Some(bytes) = merged { bytes } else {
                            let mut number = 0;
                            let copy = loop {
                                let name = sync_policy::copy_name(&path, right, number);
                                if !local.contains_key(&name) && !remote.contains_key(&name) && !root.join(&name).exists() { break name; }
                                number += 1;
                            };
                            // Publish the duplicate before resolving the original; retries never overwrite a copy.
                            let etag = dav.put(&copy, right.to_vec(), None)?;
                            write_local(&safe_local_target(&root, &copy)?, right, None)?;
                            fs::write(cache.join(hash(right)), right).map_err(|e| e.to_string())?;
                            manifest.files.insert(copy.clone(), KnownFile { hash: hash(right), etag });
                            save_manifest(&manifest_path, &manifest)?;
                            result.changed.push(copy.clone()); result.copies.push(copy); result.uploaded += 1;
                            left.to_vec()
                        };
                        let etag = remote_file.and_then(|f| f.etag.as_deref()).ok_or("远端缺少 ETag，无法安全覆盖")?;
                        let next = dav.put(&path, bytes.clone(), Some(etag))?;
                        write_local(&local_path, &bytes, Some(left))?;
                        fs::write(cache.join(hash(&bytes)), &bytes).map_err(|e| e.to_string())?;
                        manifest.files.insert(path.clone(), KnownFile { hash: hash(&bytes), etag: next });
                        save_manifest(&manifest_path, &manifest)?;
                        result.changed.push(path.clone()); result.uploaded += 1;
                        continue;
                    }
                    (Some(_), None) => operation = "upload-new",
                    (None, Some(_)) => operation = "download-new",
                    _ => { result.conflicts.push(path.clone()); continue; }
                }
            }
        }
        let outcome: Result<Option<KnownFile>, String> = (|| { match operation {
            "upload-new" | "upload" => {
                let etag = if operation == "upload" { remote_file.and_then(|file| file.etag.as_deref()).ok_or("远端缺少 ETag，无法安全覆盖")? } else { "" };
                let next = dav.put(&path, local_bytes.clone().unwrap(), if etag.is_empty() { None } else { Some(etag) })?;
                result.uploaded += 1;
                Ok(Some(KnownFile { hash: local_hash.unwrap(), etag: next }))
            }
            "download-new" | "download" => {
                let bytes = remote_bytes.as_ref().ok_or("远端内容无法读取")?;
                write_local(&local_path, bytes, local_bytes.as_deref())?;
                result.downloaded += 1; result.changed.push(path.clone());
                Ok(Some(KnownFile { hash: remote_hash.unwrap(), etag: remote_file.and_then(|file| file.etag.clone()) }))
            }
            "delete-remote" => {
                let file = remote_file.ok_or("远端文件不存在，请刷新文件夹")?;
                let bytes = match remote_bytes { Some(bytes) => bytes, None => dav.get(file)? };
                backup(app_data, &root, &path, &bytes)?;
                dav.delete(file)?;
                result.deleted_remote += 1;
                Ok(None)
            }
            "delete-local" => {
                let bytes = local_bytes.as_ref().ok_or("本地文件不存在，请检查是否已移动或删除")?;
                backup(app_data, &root, &path, bytes)?;
                if fs::read(&local_path).map_err(|error| error.to_string())? != *bytes { return Err(format!("{path}：本地文件已变化，未删除")); }
                fs::remove_file(&local_path).map_err(|error| error.to_string())?;
                result.deleted_local += 1; result.changed.push(path.clone());
                Ok(None)
            }
            _ => Err("未知同步操作".into()),
        } })();
        match outcome {
            Ok(Some(known)) => { if let Ok(bytes) = fs::read(&local_path) { if hash(&bytes) == known.hash { fs::write(cache.join(&known.hash), bytes).map_err(|e| e.to_string())?; } } manifest.files.insert(path, known); save_manifest(&manifest_path, &manifest)?; },
            Ok(None) => { manifest.files.remove(&path); save_manifest(&manifest_path, &manifest)?; },
            Err(error) => result.conflicts.push(format!("{path}：{error}")),
        }
    }
    save_manifest(&manifest_path, &manifest)?;
    Ok(result)
}

#[tauri::command]
pub async fn save_webdav_password(url: String, username: String, password: String) -> Result<(), String> {
    base_url(&url)?;
    if username.trim().is_empty() || password.is_empty() { return Err("请填写 WebDAV 用户名和密码".into()); }
    tauri::async_runtime::spawn_blocking(move || {
        let dav = Dav::new(&url, &username, &password)?;
        dav.propfind(dav.base.clone())?;
        credential(&url, &username)?.set_password(&password).map_err(|error| error.to_string())
    }).await.map_err(|error| error.to_string())?
}
#[tauri::command]
pub fn webdav_has_password(url: String, username: String) -> Result<bool, String> {
    base_url(&url)?;
    match credential(&url, &username)?.get_password() { Ok(_) => Ok(true), Err(keyring::Error::NoEntry) => Ok(false), Err(error) => Err(error.to_string()) }
}
#[tauri::command]
pub fn webdav_logout(url: String, username: String) -> Result<(), String> {
    base_url(&url)?;
    match credential(&url, &username)?.delete_credential() {
        Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
        Err(error) => Err(error.to_string()),
    }
}
#[tauri::command]
pub async fn webdav_list_folders(url: String, username: String) -> Result<Vec<String>, String> {
    let password = credential(&url, &username)?.get_password().map_err(|error| format!("WebDAV 密码不可用：{error}"))?;
    tauri::async_runtime::spawn_blocking(move || {
        let dav = Dav::new(&url, &username, &password)?;
        let mut folders = Vec::new();
        for (entry, is_dir, _) in dav.propfind(dav.base.clone())? {
            if !is_dir || entry.path().trim_end_matches('/') == dav.base.path().trim_end_matches('/') { continue; }
            if entry.origin() != dav.base.origin() || !entry.path().starts_with(dav.base.path()) { return Err("WebDAV 返回了目录外路径".into()); }
            let encoded = entry.path().strip_prefix(dav.base.path()).ok_or("WebDAV 路径越界")?.trim_end_matches('/');
            if encoded.to_ascii_lowercase().contains("%2f") || encoded.to_ascii_lowercase().contains("%5c") { return Err("WebDAV 路径含编码分隔符".into()); }
            let folder = percent_decode_str(encoded).decode_utf8().map_err(|error| error.to_string())?.to_string();
            if safe_relative(&folder) { folders.push(folder); }
            if folders.len() > 1000 { return Err("WebDAV 文件夹过多".into()); }
        }
        folders.sort();
        Ok(folders)
    }).await.map_err(|error| error.to_string())?
}
fn workspace_binding_path(app_data: &Path, root: &Path) -> PathBuf {
    app_data.join("webdav").join("workspaces").join(hash(root.to_string_lossy().as_bytes()))
}
#[derive(Debug, Serialize, Deserialize)]
struct WebdavBinding { url: String, server_url: String, username: String }
fn validate_binding_connection(binding: &WebdavBinding, server_url: &str, username: &str) -> Result<(), String> {
    if base_url(server_url)?.as_str() != binding.server_url || username != binding.username {
        return Err("WebDAV 服务器或账号已更改；请恢复原连接，或解除绑定后重新选择远端文件夹".into());
    }
    Ok(())
}
fn read_workspace_binding(app_data: &Path, root: &Path) -> Result<Option<WebdavBinding>, String> {
    match fs::read_to_string(workspace_binding_path(app_data, root)) {
        Ok(body) => {
            let binding: WebdavBinding = serde_json::from_str(&body).map_err(|error| format!("WebDAV 绑定记录损坏：{error}"))?;
            base_url(&binding.url)?;
            base_url(&binding.server_url)?;
            Ok(Some(binding))
        }
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(None),
        Err(error) => Err(error.to_string()),
    }
}
fn inherited_binding(app_data: &Path, root: &Path) -> Result<Option<(PathBuf, WebdavBinding)>, String> {
    for ancestor in root.ancestors() {
        if let Some(binding) = read_workspace_binding(app_data, ancestor)? {
            return Ok(Some((ancestor.to_path_buf(), binding)));
        }
    }
    Ok(None)
}
fn binding_for_unbind(app_data: &Path, root: &Path) -> Result<Option<WebdavBinding>, String> {
    let Some((binding_root, binding)) = inherited_binding(app_data, root)? else { return Ok(None); };
    if binding_root != root { return Err("此绑定继承自上级文件夹，请打开上级文件夹后解除绑定".into()); }
    Ok(Some(binding))
}
fn protected_in_sync_root(prefix: &Path, paths: &[String]) -> Vec<String> {
    paths.iter().map(|path| prefix.join(path).to_string_lossy().replace('\\', "/")).collect()
}
fn changed_in_open_folder(prefix: &Path, paths: &[String]) -> Vec<String> {
    paths.iter().filter_map(|path| Path::new(path).strip_prefix(prefix).ok().map(|relative| relative.to_string_lossy().replace('\\', "/"))).collect()
}
fn active_root(state: &WorkspaceState) -> Result<PathBuf, String> {
    state.0.lock().map_err(|error| error.to_string())?.as_ref().ok_or_else(|| "请先打开文件夹".to_owned())?.root.canonicalize().map_err(|error| error.to_string())
}
#[tauri::command]
pub fn webdav_get_binding(app: AppHandle, state: tauri::State<'_, WorkspaceState>) -> Result<Option<String>, String> {
    let root = active_root(&state)?;
    let data = app.path().app_data_dir().map_err(|error| error.to_string())?;
    inherited_binding(&data, &root).map(|binding| binding.map(|(_, binding)| binding.url))
}
#[tauri::command]
pub async fn webdav_bind_workspace(app: AppHandle, state: tauri::State<'_, WorkspaceState>, url: String, username: String, folder: String) -> Result<String, String> {
    let root = active_root(&state)?;
    let data = app.path().app_data_dir().map_err(|error| error.to_string())?;
    let folder = folder.trim_matches('/').trim().to_owned();
    if !safe_relative(&folder) { return Err("远端文件夹名称无效".into()); }
    let password = credential(&url, &username)?.get_password().map_err(|error| format!("WebDAV 密码不可用：{error}"))?;
    let app_handle = app.clone();
    tauri::async_runtime::spawn_blocking(move || {
        let lock = app_handle.state::<SyncLock>();
        let _guard = lock.0.lock().map_err(|error| error.to_string())?;
        if let Some((_, bound)) = inherited_binding(&data, &root)? { return Err(format!("此文件夹已绑定 {}，请先解除绑定", bound.url)); }
        let dav = Dav::new(&url, &username, &password)?;
        let mut path = String::new();
        for part in folder.split('/') {
            if !path.is_empty() { path.push('/'); }
            path.push_str(part);
            let remote = dav.url(&format!("{path}/"))?;
            let response = dav.request(Method::from_bytes(b"MKCOL").unwrap(), remote).send().map_err(|error| error.to_string())?;
            if !response.status().is_success() && response.status() != StatusCode::METHOD_NOT_ALLOWED { return Err(format!("WebDAV 远端文件夹创建或验证失败：HTTP {}", response.status())); }
        }
        let remote_url = dav.url(&format!("{folder}/"))?.to_string();
        check_binding(&data, &root, &remote_url, &username)?;
        let binding = workspace_binding_path(&data, &root);
        fs::create_dir_all(binding.parent().ok_or("WebDAV 绑定路径无效")?).map_err(|error| error.to_string())?;
        let mut file = fs::OpenOptions::new().write(true).create_new(true).open(binding).map_err(|error| error.to_string())?;
        let record = WebdavBinding { url: remote_url.clone(), server_url: dav.base.to_string(), username };
        serde_json::to_writer(&mut file, &record).map_err(|error| error.to_string())?;
        file.sync_all().map_err(|error| error.to_string())?;
        Ok(remote_url)
    }).await.map_err(|error| error.to_string())?
}
#[tauri::command]
pub fn webdav_unbind_workspace(app: AppHandle, state: tauri::State<'_, WorkspaceState>) -> Result<(), String> {
    let root = active_root(&state)?;
    let data = app.path().app_data_dir().map_err(|error| error.to_string())?;
    let Some(binding) = binding_for_unbind(&data, &root)? else { return Ok(()); };
    fs::remove_file(workspace_binding_path(&data, &root)).map_err(|error| error.to_string())?;
    let reverse = data.join("webdav").join("bindings").join(hash(format!("{}\0{}", binding.url, binding.username).as_bytes()));
    if fs::read_to_string(&reverse).ok().as_deref() == Some(root.to_string_lossy().as_ref()) { fs::remove_file(reverse).map_err(|error| error.to_string())?; }
    Ok(())
}
#[tauri::command]
pub async fn sync_webdav(app: AppHandle, state: tauri::State<'_, WorkspaceState>, url: String, username: String, protected: Vec<String>, protected_absolute: Option<Vec<String>>, conflict_policy: Option<ConflictPolicy>) -> Result<SyncResult, String> {
    let root = active_root(&state)?;
    let data = app.path().app_data_dir().map_err(|error| error.to_string())?;
    let (sync_root, binding) = inherited_binding(&data, &root)?.ok_or("此文件夹尚未绑定 WebDAV 文件夹")?;
    let prefix = root.strip_prefix(&sync_root).map_err(|error| error.to_string())?.to_path_buf();
    let mut protected = protected_in_sync_root(&prefix, &protected);
    protected.extend(crate::sync_policy::protected_absolute_paths(&sync_root, &protected_absolute.unwrap_or_default()));
    validate_binding_connection(&binding, &url, &username)?;
    let remote_url = binding.url;
    let password = credential(&url, &username)?.get_password().map_err(|error| format!("WebDAV 密码不可用：{error}"))?;
    let app_handle = app.clone();
    tauri::async_runtime::spawn_blocking(move || {
        let lock = app_handle.state::<SyncLock>();
        let _guard = lock.0.lock().map_err(|error| error.to_string())?;
        let active = app_handle.state::<WorkspaceState>();
        if active.0.lock().map_err(|error| error.to_string())?.as_ref().map(|workspace| &workspace.root) != Some(&root) { return Err("文件夹已切换，本次同步已取消".into()); }
        let mut result = sync_with_policy(&sync_root, &data, &remote_url, &username, &password, &protected, conflict_policy.unwrap_or_default())?;
        result.changed = changed_in_open_folder(&prefix, &result.changed);
        Ok(result)
    }).await.map_err(|error| error.to_string())?
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::{io::{Read, Write}, net::TcpListener, sync::{Arc, atomic::{AtomicBool, Ordering}}, thread};
    fn write_binding(data: &Path, root: &Path, folder: &str) {
        let binding = WebdavBinding { url: format!("https://example.com/dav/{folder}/"), server_url: "https://example.com/dav/".into(), username: "writer".into() };
        let path = workspace_binding_path(data, root);
        fs::create_dir_all(path.parent().unwrap()).unwrap();
        fs::write(path, serde_json::to_vec(&binding).unwrap()).unwrap();
    }
    #[test]
    fn child_folder_inherits_nearest_binding_and_original_sync_root() {
        let data = tempfile::tempdir().unwrap();
        let folder = tempfile::tempdir().unwrap();
        let root = folder.path().canonicalize().unwrap();
        let child = root.join("project/drafts");
        fs::create_dir_all(&child).unwrap();
        write_binding(data.path(), &root, "notes");
        let (bound_root, binding) = inherited_binding(data.path(), &child).unwrap().unwrap();
        assert_eq!(bound_root, root);
        assert_eq!(binding.url, "https://example.com/dav/notes/");
        write_binding(data.path(), &root.join("project"), "project");
        let (bound_root, binding) = inherited_binding(data.path(), &child).unwrap().unwrap();
        assert_eq!(bound_root, root.join("project"));
        assert_eq!(binding.url, "https://example.com/dav/project/");
        assert!(inherited_binding(data.path(), &root.with_extension("sibling")).unwrap().is_none());
    }
    #[test]
    fn inherited_binding_cannot_be_unbound_from_child_folder() {
        let data = tempfile::tempdir().unwrap();
        let folder = tempfile::tempdir().unwrap();
        let root = folder.path().canonicalize().unwrap();
        write_binding(data.path(), &root, "notes");
        assert!(binding_for_unbind(data.path(), &root.join("child")).unwrap_err().contains("上级文件夹"));
        assert!(read_workspace_binding(data.path(), &root).unwrap().is_some());
        assert!(binding_for_unbind(data.path(), &root).unwrap().is_some());
    }
    #[test]
    fn inherited_sync_preserves_dirty_file_protection_and_filters_refresh_paths() {
        let prefix = Path::new("project/drafts");
        let protected = protected_in_sync_root(prefix, &["note.md".into(), "assets/image.png".into()]);
        assert_eq!(protected, ["project/drafts/note.md", "project/drafts/assets/image.png"]);
        let changed = changed_in_open_folder(prefix, &["project/drafts/note.md".into(), "project/drafts-old/other.md".into(), "sibling.md".into()]);
        assert_eq!(changed, ["note.md"]);
        assert_eq!(changed_in_open_folder(Path::new(""), &["note.md".into()]), ["note.md"]);
    }
    #[test]
    fn malformed_nearest_binding_does_not_fall_back_to_parent() {
        let data = tempfile::tempdir().unwrap();
        let folder = tempfile::tempdir().unwrap();
        let root = folder.path().canonicalize().unwrap();
        write_binding(data.path(), &root, "notes");
        fs::write(workspace_binding_path(data.path(), &root.join("child")), "not JSON").unwrap();
        assert!(inherited_binding(data.path(), &root.join("child/nested")).is_err());
    }
    #[test]
    fn workspace_binding_requires_original_server_and_account() {
        let data = tempfile::tempdir().unwrap();
        let root = tempfile::tempdir().unwrap();
        let binding = WebdavBinding {
            url: "https://example.com/dav/Markart/notes/".into(),
            server_url: "https://example.com/dav/".into(),
            username: "writer".into(),
        };
        let path = workspace_binding_path(data.path(), root.path());
        fs::create_dir_all(path.parent().unwrap()).unwrap();
        fs::write(&path, serde_json::to_vec(&binding).unwrap()).unwrap();
        let loaded = read_workspace_binding(data.path(), root.path()).unwrap().unwrap();
        assert_eq!(loaded.url, binding.url);
        assert!(validate_binding_connection(&loaded, "https://example.com/dav", "writer").is_ok());
        assert!(validate_binding_connection(&loaded, "https://example.com/other", "writer").is_err());
        assert!(validate_binding_connection(&loaded, "https://example.com/dav", "another").is_err());
    }
    #[test]
    fn rejects_unsafe_paths_and_insecure_remote() {
        assert!(!safe_relative("../secret")); assert!(!safe_relative("a//b")); assert!(!safe_relative("a\\b"));
        assert!(base_url("https://example.com/notes").is_ok());
        assert!(base_url("http://example.com/notes").is_err());
    }
    #[test]
    fn parses_standard_multistatus() {
        let base = Url::parse("https://example.com/notes/").unwrap();
        let xml = "<d:multistatus xmlns:d='DAV:'><d:response><d:href>/notes/</d:href><d:propstat><d:prop><d:resourcetype><d:collection/></d:resourcetype></d:prop></d:propstat></d:response><d:response><d:href>/notes/a.md</d:href><d:propstat><d:prop><d:getetag>\"abc\"</d:getetag></d:prop></d:propstat></d:response></d:multistatus>";
        let entries = parse_propfind(&base, xml).unwrap();
        assert_eq!(entries.len(), 2); assert_eq!(entries[1].2.as_deref(), Some("\"abc\""));
    }
    #[test]
    fn syncs_both_directions_deletes_and_preserves_conflicts() {
        let listener = TcpListener::bind("127.0.0.1:0").unwrap();
        listener.set_nonblocking(true).unwrap();
        let address = listener.local_addr().unwrap();
        let files = Arc::new(Mutex::new(BTreeMap::<String, Vec<u8>>::new()));
        let stopping = Arc::new(AtomicBool::new(false));
        let server_files = files.clone(); let server_stopping = stopping.clone();
        let server = thread::spawn(move || {
            while !server_stopping.load(Ordering::SeqCst) {
                let Ok((mut stream, _)) = listener.accept() else { thread::sleep(Duration::from_millis(5)); continue };
                stream.set_nonblocking(false).unwrap();
                let mut request = Vec::new(); let mut block = [0u8; 8192];
                while !request.windows(4).any(|part| part == b"\r\n\r\n") {
                    let count = stream.read(&mut block).unwrap(); if count == 0 { break; } request.extend_from_slice(&block[..count]);
                }
                let boundary = request.windows(4).position(|part| part == b"\r\n\r\n").unwrap() + 4;
                let header = String::from_utf8_lossy(&request[..boundary]).to_string();
                let length = header.lines().find_map(|line| line.to_ascii_lowercase().strip_prefix("content-length: ").and_then(|value| value.trim().parse::<usize>().ok())).unwrap_or(0);
                while request.len() - boundary < length { let count = stream.read(&mut block).unwrap(); if count == 0 { break; } request.extend_from_slice(&block[..count]); }
                let first = header.lines().next().unwrap(); let mut words = first.split_whitespace();
                let method = words.next().unwrap(); let path = words.next().unwrap().trim_start_matches("/notes/").to_string();
                let mut locked = server_files.lock().unwrap();
                let (status, body, etag) = match method {
                    "PROPFIND" => {
                        let mut xml = String::from("<d:multistatus xmlns:d='DAV:'><d:response><d:href>/notes/</d:href><d:propstat><d:prop><d:resourcetype><d:collection/></d:resourcetype></d:prop></d:propstat></d:response>");
                        for (name, bytes) in locked.iter() { xml.push_str(&format!("<d:response><d:href>/notes/{name}</d:href><d:propstat><d:prop><d:getetag>\"{}\"</d:getetag></d:prop></d:propstat></d:response>", hash(bytes))); }
                        xml.push_str("</d:multistatus>"); (207, xml.into_bytes(), None)
                    },
                    "GET" => locked.get(&path).map(|bytes| (200, bytes.clone(), Some(format!("\"{}\"", hash(bytes))))).unwrap_or((404, Vec::new(), None)),
                    "PUT" => {
                        let current = locked.get(&path).map(|bytes| format!("\"{}\"", hash(bytes)));
                        let match_tag = header.lines().find_map(|line| line.to_ascii_lowercase().starts_with("if-match:").then(|| line.split_once(':').unwrap().1.trim().to_string()));
                        let only_new = header.to_ascii_lowercase().contains("if-none-match: *");
                        if (only_new && current.is_some()) || (match_tag.is_some() && match_tag != current) { (412, Vec::new(), None) }
                        else { let bytes = request[boundary..boundary + length].to_vec(); let tag = format!("\"{}\"", hash(&bytes)); locked.insert(path, bytes); (201, Vec::new(), Some(tag)) }
                    },
                    "DELETE" => {
                        let current = locked.get(&path).map(|bytes| format!("\"{}\"", hash(bytes)));
                        let match_tag = header.lines().find_map(|line| line.to_ascii_lowercase().starts_with("if-match:").then(|| line.split_once(':').unwrap().1.trim().to_string()));
                        if current.is_none() { (404, Vec::new(), None) } else if current != match_tag { (412, Vec::new(), None) } else { locked.remove(&path); (204, Vec::new(), None) }
                    },
                    _ => (405, Vec::new(), None)
                };
                let response = format!("HTTP/1.1 {status} OK\r\nContent-Length: {}\r\n{}Connection: close\r\n\r\n", body.len(), etag.map(|tag| format!("ETag: {tag}\r\n")).unwrap_or_default());
                stream.write_all(response.as_bytes()).unwrap(); stream.write_all(&body).unwrap();
            }
        });
        let local = tempfile::tempdir().unwrap(); let data = tempfile::tempdir().unwrap();
        let url = format!("http://127.0.0.1:{}/notes/", address.port());
        fs::write(local.path().join("a.md"), b"one").unwrap();
        let first = sync_core(local.path(), data.path(), &url, "user", "password", &[]).unwrap();
        assert_eq!(first.uploaded, 1);
        files.lock().unwrap().insert("a.md".into(), b"remote".to_vec());
        let second = sync_core(local.path(), data.path(), &url, "user", "password", &[]).unwrap();
        assert_eq!(second.downloaded, 1); assert_eq!(fs::read(local.path().join("a.md")).unwrap(), b"remote");
        fs::write(local.path().join("a.md"), b"local").unwrap();
        let third = sync_core(local.path(), data.path(), &url, "user", "password", &[]).unwrap();
        assert_eq!(third.uploaded, 1); assert_eq!(files.lock().unwrap()["a.md"], b"local");
        fs::remove_file(local.path().join("a.md")).unwrap();
        let fourth = sync_core(local.path(), data.path(), &url, "user", "password", &[]).unwrap();
        assert_eq!(fourth.deleted_remote, 1); assert!(!files.lock().unwrap().contains_key("a.md"));
        assert!(data.path().join("webdav-deleted").read_dir().unwrap().next().is_some());
        files.lock().unwrap().insert("b.md".into(), b"remote-only".to_vec());
        let fifth = sync_core(local.path(), data.path(), &url, "user", "password", &[]).unwrap();
        assert_eq!(fifth.downloaded, 1);
        fs::write(local.path().join("b.md"), b"local-change").unwrap();
        files.lock().unwrap().insert("b.md".into(), b"remote-change".to_vec());
        let last = sync_core(local.path(), data.path(), &url, "user", "password", &[]).unwrap();
        assert!(last.conflicts.is_empty());
        assert_eq!(last.copies.len(), 1);
        assert_eq!(fs::read(local.path().join(&last.copies[0])).unwrap(), b"remote-change");
        assert_eq!(fs::read(local.path().join("b.md")).unwrap(), b"local-change");
        assert_eq!(files.lock().unwrap()["b.md"], b"local-change");
        fs::write(local.path().join("b.md"), b"remote-change").unwrap();
        assert!(sync_core(local.path(), data.path(), &url, "user", "password", &[]).unwrap().conflicts.is_empty());
        files.lock().unwrap().remove("b.md");
        let deletion = sync_core(local.path(), data.path(), &url, "user", "password", &[]).unwrap();
        assert_eq!(deletion.deleted_local, 1);
        assert!(!local.path().join("b.md").exists());
        // Independent line edits merge from the cached last synchronized content.
        fs::write(local.path().join("merge.md"), b"one\ntwo\nthree\n").unwrap();
        sync_core(local.path(), data.path(), &url, "user", "password", &[]).unwrap();
        fs::write(local.path().join("merge.md"), b"ONE\ntwo\nthree\n").unwrap();
        files.lock().unwrap().insert("merge.md".into(), b"one\ntwo\nTHREE\n".to_vec());
        let merged = sync_core(local.path(), data.path(), &url, "user", "password", &[]).unwrap();
        assert!(merged.copies.is_empty());
        assert_eq!(fs::read(local.path().join("merge.md")).unwrap(), b"ONE\ntwo\nTHREE\n");
        assert_eq!(files.lock().unwrap()["merge.md"], b"ONE\ntwo\nTHREE\n");
        fs::write(local.path().join("merge.md"), b"local").unwrap();
        files.lock().unwrap().insert("merge.md".into(), b"remote".to_vec());
        sync_with_policy(local.path(), data.path(), &url, "user", "password", &["merge.md".into()], ConflictPolicy::Remote).unwrap();
        assert_eq!(fs::read(local.path().join("merge.md")).unwrap(), b"local");
        let remote_priority = sync_with_policy(local.path(), data.path(), &url, "user", "password", &[], ConflictPolicy::Remote).unwrap();
        assert!(remote_priority.copies.is_empty());
        assert_eq!(fs::read(local.path().join("merge.md")).unwrap(), b"remote");
        fs::write(local.path().join("merge.md"), b"modified").unwrap();
        files.lock().unwrap().remove("merge.md");
        sync_with_policy(local.path(), data.path(), &url, "user", "password", &[], ConflictPolicy::Remote).unwrap();
        assert!(!local.path().join("merge.md").exists());
        stopping.store(true, Ordering::SeqCst); server.join().unwrap();
    }
}

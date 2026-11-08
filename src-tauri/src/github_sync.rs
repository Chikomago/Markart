use crate::sync_policy::{self, ConflictPolicy};
use crate::{webdav::SyncLock, workspace::WorkspaceState};
use git2::{Cred, ErrorCode, FetchOptions, ObjectType, PushOptions, RemoteCallbacks, Repository, Signature};
use serde::Serialize;
use sha2::{Digest, Sha256};
use std::{collections::{BTreeMap, BTreeSet}, fs, io::Write, path::{Path, PathBuf}};
use tauri::{AppHandle, Manager};

const MAX_FILE: u64 = 20 * 1024 * 1024;
const MAX_FILES: usize = 10_000;

#[derive(Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncResult { pub uploaded: bool, pub downloaded: usize, pub conflicts: Vec<String>, pub copies: Vec<String>, pub changed: Vec<String> }

fn valid_url(url: &str) -> Result<String, String> {
    let parsed = reqwest::Url::parse(url.trim()).map_err(|_| "请输入 GitHub 仓库 HTTPS 地址")?;
    if parsed.scheme() != "https" || parsed.host_str() != Some("github.com") || !parsed.username().is_empty() || parsed.password().is_some() || parsed.query().is_some() || parsed.fragment().is_some() { return Err("仅支持不含凭据的 github.com HTTPS 仓库地址".into()); }
    let parts: Vec<_> = parsed.path().trim_matches('/').trim_end_matches(".git").split('/').collect();
    if parts.len() != 2 || parts.iter().any(|part| part.is_empty() || !part.bytes().all(|byte| byte.is_ascii_alphanumeric() || matches!(byte, b'-' | b'_' | b'.'))) { return Err("仓库地址应为 https://github.com/用户/仓库.git".into()); }
    Ok(format!("https://github.com/{}/{}.git", parts[0], parts[1]))
}
fn credential(url: &str, user: &str) -> Result<keyring::Entry, String> {
    let id = format!("{:x}", Sha256::digest(format!("{url}\0{user}").as_bytes()));
    keyring::Entry::new("com.markart.github", &id).map_err(|error| error.to_string())
}
fn account_credential() -> Result<keyring::Entry, String> {
    keyring::Entry::new("com.markart.github", "account-token").map_err(|error| error.to_string())
}
#[tauri::command]
pub async fn save_github_token(token: String) -> Result<String, String> {
    if token.trim().is_empty() { return Err("请输入 GitHub 访问令牌".into()); }
    let token = token.trim().to_owned();
    tauri::async_runtime::spawn_blocking(move || {
        let login = github_login(&token)?;
        account_credential()?.set_password(&token).map_err(|error| error.to_string())?;
        Ok(login)
    }).await.map_err(|error| error.to_string())?
}
#[tauri::command]
pub fn github_has_token() -> Result<bool, String> {
    match account_credential()?.get_password() { Ok(_) => Ok(true), Err(keyring::Error::NoEntry) => Ok(false), Err(error) => Err(error.to_string()) }
}
#[tauri::command]
pub fn github_logout() -> Result<(), String> {
    match account_credential()?.delete_credential() {
        Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
        Err(error) => Err(error.to_string()),
    }
}
#[tauri::command]
pub fn github_migrate_token(url: String, username: String) -> Result<bool, String> {
    if github_has_token()? || url.is_empty() || username.is_empty() { return github_has_token(); }
    let old = credential(&valid_url(&url)?, &username)?.get_password();
    match old {
        Ok(token) => { account_credential()?.set_password(&token).map_err(|error| error.to_string())?; Ok(true) },
        Err(keyring::Error::NoEntry) => Ok(false),
        Err(error) => Err(error.to_string()),
    }
}
fn github_client() -> Result<reqwest::blocking::Client, String> {
    reqwest::blocking::Client::builder().timeout(std::time::Duration::from_secs(20)).build().map_err(|error| error.to_string())
}
fn github_login(token: &str) -> Result<String, String> {
    let response = github_client()?.get("https://api.github.com/user").header("User-Agent", "Markart").bearer_auth(token)
        .send().map_err(|error| format!("GitHub 登录验证失败：{error}"))?;
    if !response.status().is_success() { return Err(format!("GitHub 令牌验证失败：HTTP {}", response.status())); }
    let value: serde_json::Value = serde_json::from_str(&response.text().map_err(|error| error.to_string())?).map_err(|error| error.to_string())?;
    value.get("login").and_then(|value| value.as_str()).map(str::to_owned).ok_or_else(|| "GitHub 未返回用户名".into())
}
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GithubRepo { name: String, full_name: String, url: String }
#[tauri::command]
pub async fn github_list_private_repos() -> Result<Vec<GithubRepo>, String> {
    let token = account_credential()?.get_password().map_err(|error| format!("GitHub 令牌不可用：{error}"))?;
    tauri::async_runtime::spawn_blocking(move || {
        let response = github_client()?.get("https://api.github.com/user/repos?visibility=private&per_page=100&sort=updated")
            .header("User-Agent", "Markart").bearer_auth(&token).send().map_err(|error| error.to_string())?;
        if !response.status().is_success() { return Err(format!("仓库列表读取失败：HTTP {}", response.status())); }
        let values: Vec<serde_json::Value> = serde_json::from_str(&response.text().map_err(|error| error.to_string())?).map_err(|error| error.to_string())?;
        let repos = values.into_iter().filter(|value| value.get("private").and_then(|v| v.as_bool()) == Some(true))
            .filter_map(|value| {
                let full_name = value.get("full_name")?.as_str()?.to_owned();
                let url = valid_url(value.get("clone_url")?.as_str()?).ok()?;
                Some(GithubRepo { name: value.get("name")?.as_str()?.to_owned(), full_name, url })
            }).collect();
        Ok(repos)
    }).await.map_err(|error| error.to_string())?
}
#[tauri::command]
pub async fn github_create_private_repo(name: String) -> Result<GithubRepo, String> {
    let name = name.trim().to_owned();
    if name.is_empty() || name.len() > 100 || !name.bytes().all(|byte| byte.is_ascii_alphanumeric() || matches!(byte, b'-' | b'_' | b'.')) { return Err("仓库名称仅可包含英文字母、数字、连字符、下划线和点".into()); }
    let token = account_credential()?.get_password().map_err(|error| format!("GitHub 令牌不可用：{error}"))?;
    tauri::async_runtime::spawn_blocking(move || {
        let response = github_client()?.post("https://api.github.com/user/repos").header("User-Agent", "Markart")
            .bearer_auth(&token).header("Content-Type", "application/json")
            .body(serde_json::json!({ "name": name, "private": true, "auto_init": false }).to_string())
            .send().map_err(|error| error.to_string())?;
        if !response.status().is_success() { return Err(format!("创建私有仓库失败：HTTP {}；请检查令牌是否有仓库管理权限", response.status())); }
        let value: serde_json::Value = serde_json::from_str(&response.text().map_err(|error| error.to_string())?).map_err(|error| error.to_string())?;
        let url = valid_url(value.get("clone_url").and_then(|v| v.as_str()).ok_or("GitHub 未返回仓库地址")?)?;
        Ok(GithubRepo { name: value.get("name").and_then(|v| v.as_str()).unwrap_or_default().to_owned(), full_name: value.get("full_name").and_then(|v| v.as_str()).unwrap_or_default().to_owned(), url })
    }).await.map_err(|error| error.to_string())?
}

fn callbacks<'a>(user: &'a str, token: &'a str) -> RemoteCallbacks<'a> {
    let mut callbacks = RemoteCallbacks::new();
    callbacks.credentials(move |_, _, _| Cred::userpass_plaintext(user, token));
    callbacks
}
fn verify_private_repo(url: &str, token: &str) -> Result<(), String> {
    let path = url.strip_prefix("https://github.com/").and_then(|rest| rest.strip_suffix(".git")).ok_or("GitHub 地址无效")?;
    let response = reqwest::blocking::Client::builder().timeout(std::time::Duration::from_secs(20)).build().map_err(|error| error.to_string())?
        .get(format!("https://api.github.com/repos/{path}"))
        .header("User-Agent", "Markart")
        .bearer_auth(token)
        .send().map_err(|error| format!("无法验证 GitHub 仓库：{error}"))?;
    if !response.status().is_success() { return Err(format!("无法访问 GitHub 私有仓库：HTTP {}", response.status())); }
    let body = response.text().map_err(|error| error.to_string())?;
    let info: serde_json::Value = serde_json::from_str(&body).map_err(|error| error.to_string())?;
    if info.get("private").and_then(|value| value.as_bool()) != Some(true) { return Err("仓库不是私有仓库，已停止同步".into()); }
    Ok(())
}
fn safe(path: &str) -> bool { !path.is_empty() && path.split('/').all(|part| !part.is_empty() && part != "." && part != ".." && !part.contains(['\\', '\0'])) }
fn local_files(root: &Path) -> Result<BTreeMap<String, Vec<u8>>, String> {
    fn visit(root: &Path, dir: &Path, out: &mut BTreeMap<String, Vec<u8>>) -> Result<(), String> {
        for entry in fs::read_dir(dir).map_err(|error| error.to_string())? {
            let entry = entry.map_err(|error| error.to_string())?;
            if entry.file_name() == ".git" { continue; }
            let path = entry.path();
            let meta = fs::symlink_metadata(&path).map_err(|error| error.to_string())?;
            if meta.file_type().is_symlink() { continue; }
            if meta.is_dir() { visit(root, &path, out)?; }
            else if meta.is_file() {
                if meta.len() > MAX_FILE { return Err(format!("文件超过 20 MB：{}", path.display())); }
                let name = path.strip_prefix(root).map_err(|error| error.to_string())?.to_string_lossy().replace('\\', "/");
                if !safe(&name) { return Err("文件路径不可同步".into()); }
                out.insert(name, fs::read(&path).map_err(|error| error.to_string())?);
                if out.len() > MAX_FILES { return Err("文件数量超过同步限制".into()); }
            }
        }
        Ok(())
    }
    let mut out = BTreeMap::new(); visit(root, root, &mut out)?; Ok(out)
}
fn tree_files(repo: &Repository, commit: Option<git2::Oid>) -> Result<BTreeMap<String, Vec<u8>>, String> {
    fn visit(repo: &Repository, tree: &git2::Tree<'_>, prefix: &str, out: &mut BTreeMap<String, Vec<u8>>) -> Result<(), String> {
        for entry in tree.iter() {
            let name = entry.name().ok_or("Git 仓库包含非 UTF-8 路径")?;
            let path = if prefix.is_empty() { name.to_owned() } else { format!("{prefix}/{name}") };
            if !safe(&path) { return Err("Git 仓库包含非法路径".into()); }
            match entry.kind() {
                Some(ObjectType::Tree) => visit(repo, &repo.find_tree(entry.id()).map_err(|error| error.to_string())?, &path, out)?,
                Some(ObjectType::Blob) if entry.filemode() == 0o100644 || entry.filemode() == 0o100755 => {
                    let blob = repo.find_blob(entry.id()).map_err(|error| error.to_string())?;
                    if blob.size() as u64 > MAX_FILE { return Err(format!("远端文件超过 20 MB：{path}")); }
                    out.insert(path, blob.content().to_vec());
                    if out.len() > MAX_FILES { return Err("远端文件数量超过同步限制".into()); }
                }
                _ => return Err(format!("不支持同步特殊 Git 条目：{path}")),
            }
        }
        Ok(())
    }
    let mut out = BTreeMap::new();
    if let Some(id) = commit { let tree = repo.find_commit(id).map_err(|error| error.to_string())?.tree().map_err(|error| error.to_string())?; visit(repo, &tree, "", &mut out)?; }
    Ok(out)
}
fn write_tree(repo: &Repository, files: &BTreeMap<String, Vec<u8>>) -> Result<git2::Oid, String> {
    fn build(repo: &Repository, files: &BTreeMap<String, Vec<u8>>, prefix: &str) -> Result<git2::Oid, String> {
        let mut builder = repo.treebuilder(None).map_err(|error| error.to_string())?;
        let mut dirs = BTreeSet::new();
        for (path, bytes) in files {
            let Some(rest) = path.strip_prefix(prefix) else { continue };
            if let Some((dir, _)) = rest.split_once('/') { dirs.insert(dir.to_owned()); }
            else { let blob = repo.blob(bytes).map_err(|error| error.to_string())?; builder.insert(rest, blob, 0o100644).map_err(|error| error.to_string())?; }
        }
        for dir in dirs { let tree = build(repo, files, &format!("{prefix}{dir}/"))?; builder.insert(&dir, tree, 0o040000).map_err(|error| error.to_string())?; }
        builder.write().map_err(|error| error.to_string())
    }
    build(repo, files, "")
}
fn ref_id(repo: &Repository, name: &str) -> Result<Option<git2::Oid>, String> {
    match repo.find_reference(name) { Ok(reference) => Ok(reference.target()), Err(error) if error.code() == ErrorCode::NotFound => Ok(None), Err(error) => Err(error.to_string()) }
}
fn target(root: &Path, relative: &str) -> Result<PathBuf, String> {
    if !safe(relative) { return Err("远端路径无效".into()); }
    let path = root.join(relative);
    let mut ancestor = path.parent();
    while let Some(dir) = ancestor { if dir == root { break; } if let Ok(meta) = fs::symlink_metadata(dir) { if !meta.is_dir() || meta.file_type().is_symlink() { return Err("路径包含符号链接".into()); } } ancestor = dir.parent(); }
    if let Ok(meta) = fs::symlink_metadata(&path) { if !meta.is_file() || meta.file_type().is_symlink() { return Err("目标不是普通文件".into()); } }
    Ok(path)
}
fn check_binding(app_data: &Path, root: &Path, url: &str) -> Result<(), String> {
    let path = app_data.join("github").join("bindings").join(format!("{:x}", Sha256::digest(url.as_bytes())));
    fs::create_dir_all(path.parent().ok_or("GitHub 绑定目录无效")?).map_err(|error| error.to_string())?;
    let root_text = root.to_string_lossy();
    match fs::read_to_string(&path) {
        Ok(bound) if bound == root_text => Ok(()),
        Ok(_) => Err("该 GitHub 仓库已关联另一处本地目录。请为当前目录配置独立的私有仓库；现有远端文件不会被自动移动或删除。".into()),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
            match fs::OpenOptions::new().write(true).create_new(true).open(&path) {
                Ok(mut file) => { file.write_all(root_text.as_bytes()).map_err(|error| error.to_string())?; file.sync_all().map_err(|error| error.to_string()) },
                Err(error) if error.kind() == std::io::ErrorKind::AlreadyExists => check_binding(app_data, root, url),
                Err(error) => Err(error.to_string()),
            }
        }
        Err(error) => Err(error.to_string()),
    }
}
fn workspace_binding_path(app_data: &Path, root: &Path) -> PathBuf {
    app_data.join("github").join("workspaces").join(format!("{:x}", Sha256::digest(root.to_string_lossy().as_bytes())))
}
fn read_workspace_binding(app_data: &Path, root: &Path) -> Result<Option<String>, String> {
    match fs::read_to_string(workspace_binding_path(app_data, root)) {
        Ok(value) => valid_url(value.trim()).map(Some),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(None),
        Err(error) => Err(error.to_string()),
    }
}
// Resolve component ancestors, never string prefixes (foo must not match foobar).
fn inherited_binding(app_data: &Path, root: &Path) -> Result<Option<(PathBuf, String)>, String> {
    for ancestor in root.ancestors() {
        if let Some(url) = read_workspace_binding(app_data, ancestor)? { return Ok(Some((ancestor.to_path_buf(), url))); }
    }
    Ok(None)
}
fn active_root(state: &WorkspaceState) -> Result<PathBuf, String> {
    state.0.lock().map_err(|error| error.to_string())?.as_ref().ok_or_else(|| "请先打开文件夹".to_owned())?.root.canonicalize().map_err(|error| error.to_string())
}
#[tauri::command]
pub fn github_get_binding(app: AppHandle, state: tauri::State<'_, WorkspaceState>) -> Result<Option<String>, String> {
    let root = active_root(&state)?;
    let app_data = app.path().app_data_dir().map_err(|error| error.to_string())?;
    Ok(inherited_binding(&app_data, &root)?.map(|(_, url)| url))
}
#[tauri::command]
pub async fn github_bind_workspace(app: AppHandle, state: tauri::State<'_, WorkspaceState>, url: String) -> Result<(), String> {
    let url = valid_url(&url)?;
    let root = active_root(&state)?;
    let app_data = app.path().app_data_dir().map_err(|error| error.to_string())?;
    let token = account_credential()?.get_password().map_err(|error| format!("GitHub 令牌不可用：{error}"))?;
    tauri::async_runtime::spawn_blocking(move || {
        if let Some((_, bound)) = inherited_binding(&app_data, &root)? {
            if bound == url { return Ok(()); }
            return Err("此文件夹已绑定其他仓库，请先解除绑定".into());
        }
        verify_private_repo(&url, &token)?;
        check_binding(&app_data, &root, &url)?;
        let path = workspace_binding_path(&app_data, &root);
        fs::create_dir_all(path.parent().ok_or("GitHub 绑定目录无效")?).map_err(|error| error.to_string())?;
        let mut file = fs::OpenOptions::new().write(true).create_new(true).open(path).map_err(|error| error.to_string())?;
        file.write_all(url.as_bytes()).map_err(|error| error.to_string())?;
        file.sync_all().map_err(|error| error.to_string())
    }).await.map_err(|error| error.to_string())?
}
#[tauri::command]
pub fn github_unbind_workspace(app: AppHandle, state: tauri::State<'_, WorkspaceState>) -> Result<(), String> {
    let root = active_root(&state)?;
    let app_data = app.path().app_data_dir().map_err(|error| error.to_string())?;
    let Some((binding_root, url)) = inherited_binding(&app_data, &root)? else { return Ok(()); };
    if binding_root != root { return Err("此仓库继承自上级文件夹，请打开上级文件夹后解除绑定".into()); }
    fs::remove_file(workspace_binding_path(&app_data, &root)).map_err(|error| error.to_string())?;
    let reverse = app_data.join("github").join("bindings").join(format!("{:x}", Sha256::digest(url.as_bytes())));
    if fs::read_to_string(&reverse).ok().as_deref() == Some(root.to_string_lossy().as_ref()) { fs::remove_file(reverse).map_err(|error| error.to_string())?; }
    Ok(())
}
#[cfg(test)]
fn sync_core(root: &Path, app_data: &Path, url: &str, user: &str, token: &str, protected: &[String]) -> Result<SyncResult, String> {
    sync_with_policy(root, app_data, url, user, token, protected, ConflictPolicy::Merge)
}
fn sync_with_policy(root: &Path, app_data: &Path, url: &str, user: &str, token: &str, protected: &[String], policy: ConflictPolicy) -> Result<SyncResult, String> {
    let root = root.canonicalize().map_err(|error| error.to_string())?;
    check_binding(app_data, &root, url)?;
    // Keep this repository separate from a possible parent repository; never touch its branch or index.
    let repo = if root.join(".git").exists() { Repository::open(&root) } else { Repository::init(&root) }.map_err(|error| error.to_string())?;
    let scope = format!("refs/markart/github/{:x}", Sha256::digest(url.as_bytes()));
    let base_ref = format!("{scope}/base");
    let pending_ref = format!("{scope}/pending");
    let tracking_ref = format!("{scope}/remote");
    let mut remote = repo.remote_anonymous(url).map_err(|error| error.to_string())?;
    let mut fetch = FetchOptions::new(); fetch.remote_callbacks(callbacks(user, token)); fetch.prune(git2::FetchPrune::On);
    remote.fetch(&[format!("refs/heads/main:{tracking_ref}")], Some(&mut fetch), None).map_err(|error| format!("GitHub 拉取失败：{error}"))?;
    let remote_id = ref_id(&repo, &tracking_ref)?;
    let base_id = ref_id(&repo, &base_ref)?;
    let pending_id = ref_id(&repo, &pending_ref)?;
    let base = tree_files(&repo, base_id)?;
    let remote_files = tree_files(&repo, remote_id)?;
    let mut local = local_files(&root)?;
    let mut result = SyncResult::default();
    for path in protected {
        if remote_files.get(path) != base.get(path) { result.conflicts.push(path.clone()); }
    }
    if !result.conflicts.is_empty() { return Ok(result); }
    let names: BTreeSet<_> = base.keys().chain(remote_files.keys()).chain(local.keys()).cloned().collect();
    for path in names {
        let before = base.get(&path);
        let incoming = remote_files.get(&path);
        let current = local.get(&path).cloned();
        if incoming == before || current.as_ref() == incoming { continue; }
        let divergent = current.as_ref() != before;
        let chosen = if divergent && matches!(policy, ConflictPolicy::Merge) {
            match (current.as_deref(), incoming) {
                (Some(left), Some(right)) => {
                    if let Some(merged) = sync_policy::merge(before.map(Vec::as_slice), left, right)? { Some(merged) }
                    else {
                        let mut number = 0;
                        let copy = loop {
                            let name = sync_policy::copy_name(&path, right, number);
                            if !local.contains_key(&name) && !remote_files.contains_key(&name) { break name; }
                            number += 1;
                        };
                        local.insert(copy.clone(), right.clone());
                        result.changed.push(copy.clone()); result.copies.push(copy);
                        Some(left.to_vec())
                    }
                }
                (Some(left), None) => Some(left.to_vec()),
                (None, Some(right)) => Some(right.clone()),
                _ => None,
            }
        } else { incoming.cloned() };
        if current != chosen {
            if let Some(bytes) = chosen { local.insert(path.clone(), bytes); } else { local.remove(&path); }
            result.changed.push(path); result.downloaded += 1;
        }
    }
    // Verify every destination before writing any downloaded file.
    let destinations: Vec<_> = result.changed.iter().map(|path| target(&root, path).map(|target| (path.clone(), target))).collect::<Result<_, _>>()?;
    for (path, destination) in &destinations {
        if let Some(bytes) = local.get(path) {
            fs::create_dir_all(destination.parent().ok_or("目标目录无效")?).map_err(|error| error.to_string())?;
            let mut temp = tempfile::NamedTempFile::new_in(destination.parent().unwrap()).map_err(|error| error.to_string())?;
            use std::io::Write;
            temp.write_all(bytes).map_err(|error| error.to_string())?;
            temp.persist(destination).map_err(|error| error.to_string())?;
        } else if destination.exists() { fs::remove_file(destination).map_err(|error| error.to_string())?; }
    }
    let tree_id = write_tree(&repo, &local)?;
    let remote_tree = remote_id.map(|id| repo.find_commit(id).and_then(|commit| commit.tree()).map(|tree| tree.id())).transpose().map_err(|error| error.to_string())?;
    if Some(tree_id) != remote_tree {
        let tree = repo.find_tree(tree_id).map_err(|error| error.to_string())?;
        let signature = Signature::now("Markart", "markart@localhost").map_err(|error| error.to_string())?;
        let mut parents = Vec::new();
        if let Some(id) = remote_id { parents.push(repo.find_commit(id).map_err(|error| error.to_string())?); }
        if let Some(id) = pending_id {
            if Some(id) != remote_id && !remote_id.is_some_and(|remote| repo.graph_descendant_of(remote, id).unwrap_or(false)) {
                parents.push(repo.find_commit(id).map_err(|error| error.to_string())?);
            }
        }
        let parent_refs: Vec<_> = parents.iter().collect();
        let id = repo.commit(None, &signature, &signature, "Markart 同步", &tree, &parent_refs).map_err(|error| error.to_string())?;
        repo.reference(&pending_ref, id, true, "Markart 待推送").map_err(|error| error.to_string())?;
        let mut push = PushOptions::new(); push.remote_callbacks(callbacks(user, token));
        remote.push(&[format!("{pending_ref}:refs/heads/main")], Some(&mut push)).map_err(|error| format!("GitHub 推送失败：{error}"))?;
        repo.reference(&base_ref, id, true, "GitHub 已同步").map_err(|error| error.to_string())?;
        result.uploaded = true;
    } else if let Some(id) = remote_id { repo.reference(&base_ref, id, true, "GitHub 已同步").map_err(|error| error.to_string())?; }
    Ok(result)
}

#[tauri::command]
pub async fn sync_github(app: AppHandle, state: tauri::State<'_, WorkspaceState>, username: String, protected: Vec<String>, protected_absolute: Option<Vec<String>>, conflict_policy: Option<ConflictPolicy>) -> Result<SyncResult, String> {
    let root = active_root(&state)?;
    let app_data = app.path().app_data_dir().map_err(|error| error.to_string())?;
    let (sync_root, url) = inherited_binding(&app_data, &root)?.ok_or("此文件夹尚未绑定 GitHub 仓库")?;
    let prefix = root.strip_prefix(&sync_root).map_err(|error| error.to_string())?.to_path_buf();
    let mut protected: Vec<String> = protected.iter().map(|path| prefix.join(path).to_string_lossy().replace('\\', "/")).collect();
    protected.extend(crate::sync_policy::protected_absolute_paths(&sync_root, &protected_absolute.unwrap_or_default()));
    let token = account_credential()?.get_password().map_err(|error| format!("GitHub 令牌不可用：{error}"))?;
    let app_handle = app.clone();
    tauri::async_runtime::spawn_blocking(move || {
        let lock = app_handle.state::<SyncLock>();
        let _guard = lock.0.lock().map_err(|error| error.to_string())?;
        let active = app_handle.state::<WorkspaceState>();
        if active.0.lock().map_err(|error| error.to_string())?.as_ref().map(|workspace| &workspace.root) != Some(&root) { return Err("文件夹已切换，本次同步已取消".into()); }
        verify_private_repo(&url, &token)?;
        let mut result = sync_with_policy(&sync_root, &app_data, &url, &username, &token, &protected, conflict_policy.unwrap_or_default())?;
        let relative = |path: &String| Path::new(path).strip_prefix(&prefix).ok().map(|value| value.to_string_lossy().replace('\\', "/"));
        result.changed = result.changed.iter().filter_map(relative).collect();
        // Keep all conflict paths visible, including conflicts outside the open subtree.
        Ok(result)
    }).await.map_err(|error| error.to_string())?
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn ancestor_binding_keeps_repository_root() {
        let data = tempfile::tempdir().unwrap();
        let workspace = tempfile::tempdir().unwrap();
        let root = workspace.path();
        let file = workspace_binding_path(data.path(), root);
        fs::create_dir_all(file.parent().unwrap()).unwrap();
        fs::write(file, "https://github.com/example/notes.git").unwrap();
        let child = root.join("notes").join("nested");
        let (bound_root, url) = inherited_binding(data.path(), &child).unwrap().unwrap();
        assert_eq!(bound_root, root);
        assert_eq!(url, "https://github.com/example/notes.git");
        assert!(inherited_binding(data.path(), &root.with_extension("sibling")).unwrap().is_none());
        let protected = child.strip_prefix(&bound_root).unwrap().join("draft.md");
        assert_eq!(protected, Path::new("notes/nested/draft.md"));
    }
    #[test]
    fn validates_url_and_local_roundtrip() {
        assert!(valid_url("https://github.com/a/notes.git").is_ok());
        assert!(valid_url("https://github.com/a/notes.git?token=abc").is_err());
        let dir = tempfile::tempdir().unwrap();
        fs::write(dir.path().join("note.md"), b"hello").unwrap();
        let repo = Repository::init(dir.path()).unwrap();
        let files = local_files(dir.path()).unwrap();
        let id = write_tree(&repo, &files).unwrap();
        let tree = repo.find_tree(id).unwrap();
        let sig = Signature::now("test", "test@example.com").unwrap();
        let commit = repo.commit(None, &sig, &sig, "test", &tree, &[]).unwrap();
        assert_eq!(tree_files(&repo, Some(commit)).unwrap(), files);
    }
    #[test]
    fn synchronizes_two_devices_and_preserves_conflict_copies() {
        let remote = tempfile::tempdir().unwrap();
        Repository::init_bare(remote.path()).unwrap();
        let first = tempfile::tempdir().unwrap();
        let second = tempfile::tempdir().unwrap();
        let first_data = tempfile::tempdir().unwrap();
        let second_data = tempfile::tempdir().unwrap();
        fs::write(first.path().join("note.md"), b"first").unwrap();
        let url = remote.path().to_str().unwrap();
        let first_sync = sync_core(first.path(), first_data.path(), url, "", "", &[]).unwrap();
        assert!(first_sync.uploaded);
        let second_sync = sync_core(second.path(), second_data.path(), url, "", "", &[]).unwrap();
        assert_eq!(second_sync.downloaded, 1);
        assert_eq!(fs::read(second.path().join("note.md")).unwrap(), b"first");
        fs::write(first.path().join("note.md"), b"from first").unwrap();
        assert!(sync_core(first.path(), first_data.path(), url, "", "", &[]).unwrap().uploaded);
        fs::write(second.path().join("note.md"), b"from second").unwrap();
        let conflict = sync_core(second.path(), second_data.path(), url, "", "", &[]).unwrap();
        assert!(conflict.conflicts.is_empty());
        assert_eq!(conflict.copies.len(), 1);
        assert_eq!(fs::read(second.path().join(&conflict.copies[0])).unwrap(), b"from first");
        assert!(sync_core(second.path(), second_data.path(), url, "", "", &[]).unwrap().copies.is_empty());
        assert_eq!(fs::read(second.path().join("note.md")).unwrap(), b"from second");
    }
    #[test]
    fn remote_priority_and_merge_respect_saved_history_and_unsaved_buffers() {
        let remote = tempfile::tempdir().unwrap(); Repository::init_bare(remote.path()).unwrap();
        let first = tempfile::tempdir().unwrap(); let second = tempfile::tempdir().unwrap();
        let a = tempfile::tempdir().unwrap(); let b = tempfile::tempdir().unwrap();
        let url = remote.path().to_str().unwrap();
        fs::write(first.path().join("note.md"), b"one\ntwo\nthree\n").unwrap();
        sync_core(first.path(), a.path(), url, "", "", &[]).unwrap();
        sync_core(second.path(), b.path(), url, "", "", &[]).unwrap();
        fs::write(first.path().join("note.md"), b"ONE\ntwo\nthree\n").unwrap();
        sync_core(first.path(), a.path(), url, "", "", &[]).unwrap();
        fs::write(second.path().join("note.md"), b"one\ntwo\nTHREE\n").unwrap();
        let merged = sync_core(second.path(), b.path(), url, "", "", &[]).unwrap();
        assert!(merged.copies.is_empty());
        assert_eq!(fs::read(second.path().join("note.md")).unwrap(), b"ONE\ntwo\nTHREE\n");
        sync_core(first.path(), a.path(), url, "", "", &[]).unwrap();
        fs::write(first.path().join("note.md"), b"remote").unwrap();
        sync_core(first.path(), a.path(), url, "", "", &[]).unwrap();
        fs::write(second.path().join("note.md"), b"local").unwrap();
        let blocked = sync_with_policy(second.path(), b.path(), url, "", "", &["note.md".into()], ConflictPolicy::Remote).unwrap();
        assert_eq!(blocked.conflicts, ["note.md"]);
        assert_eq!(fs::read(second.path().join("note.md")).unwrap(), b"local");
        let resolved = sync_with_policy(second.path(), b.path(), url, "", "", &[], ConflictPolicy::Remote).unwrap();
        assert!(resolved.copies.is_empty());
        assert_eq!(fs::read(second.path().join("note.md")).unwrap(), b"remote");
        fs::remove_file(first.path().join("note.md")).unwrap();
        sync_core(first.path(), a.path(), url, "", "", &[]).unwrap();
        fs::write(second.path().join("note.md"), b"edited after remote deletion").unwrap();
        sync_with_policy(second.path(), b.path(), url, "", "", &[], ConflictPolicy::Remote).unwrap();
        assert!(!second.path().join("note.md").exists());
    }
    #[test]
    fn separate_local_folders_do_not_mix_at_repository_root() {
        let remote = tempfile::tempdir().unwrap();
        Repository::init_bare(remote.path()).unwrap();
        let first = tempfile::tempdir().unwrap();
        let second = tempfile::tempdir().unwrap();
        let app_data = tempfile::tempdir().unwrap();
        fs::write(first.path().join("alpha.md"), b"one").unwrap();
        fs::write(second.path().join("beta.md"), b"two").unwrap();
        let url = remote.path().to_str().unwrap();
        sync_core(first.path(), app_data.path(), url, "", "", &[]).unwrap();
        let error = sync_core(second.path(), app_data.path(), url, "", "", &[]).err().unwrap();
        assert!(error.contains("已关联另一处本地目录"));
        let repo = Repository::open_bare(remote.path()).unwrap();
        let head = repo.find_reference("refs/heads/main").unwrap().target();
        let files = tree_files(&repo, head).unwrap();
        assert!(!(files.contains_key("alpha.md") && files.contains_key("beta.md")), "两个本地目录的文件被混入同一仓库根目录");
    }
}

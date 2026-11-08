use git2::{DiffOptions, ErrorCode, Patch, Repository, Signature};
use serde::Serialize;
use sha2::{Digest, Sha256};
use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GitVersion { pub id: String, pub created: u64 }

pub fn available() -> Result<String, String> { Ok("Git (libgit2)".into()) }

fn repository(root: &Path, initialize: bool) -> Result<Option<Repository>, String> {
    match Repository::discover(root) {
        Ok(repo) => Ok(Some(repo)),
        Err(error) if error.code() == ErrorCode::NotFound => {
            if initialize { Repository::init(root).map(Some).map_err(|error| error.to_string()) }
            else { Ok(None) }
        }
        Err(error) => Err(error.to_string()),
    }
}

fn scope(root: &Path, relative: &str) -> Result<String, String> {
    let canonical = root.canonicalize().map_err(|error| error.to_string())?;
    let mut hash = Sha256::new();
    hash.update(canonical.to_string_lossy().as_bytes());
    hash.update([0]);
    hash.update(relative.as_bytes());
    Ok(format!("refs/markart/history/{:x}", hash.finalize()))
}

fn versions_at(repo: &Repository, scope: &str) -> Result<Vec<GitVersion>, String> {
    let mut versions = Vec::new();
    for reference in repo.references_glob(&format!("{scope}/*")).map_err(|error| error.to_string())? {
        let reference = reference.map_err(|error| error.to_string())?;
        let Some(id) = reference.name().and_then(|name| name.strip_prefix(&format!("{scope}/"))) else { continue };
        let Some(created) = id.split('-').next().and_then(|value| value.parse::<u64>().ok()) else { continue };
        versions.push(GitVersion { id: id.to_owned(), created });
    }
    versions.sort_by(|a, b| b.created.cmp(&a.created).then_with(|| b.id.cmp(&a.id)));
    Ok(versions)
}

pub fn list(root: &Path, relative: &str) -> Result<Vec<GitVersion>, String> {
    let Some(repo) = repository(root, false)? else { return Ok(Vec::new()); };
    versions_at(&repo, &scope(root, relative)?)
}

fn read_at(repo: &Repository, scope: &str, id: &str) -> Result<Vec<u8>, String> {
    if !id.bytes().all(|byte| byte.is_ascii_digit() || byte == b'-') || id.len() > 80 { return Err("历史版本标识无效".into()); }
    let reference = repo.find_reference(&format!("{scope}/{id}")).map_err(|error| error.to_string())?;
    let commit = reference.peel_to_commit().map_err(|error| error.to_string())?;
    let tree = commit.tree().map_err(|error| error.to_string())?;
    let entry = tree.get_name("content").ok_or("历史版本内容不存在")?;
    let blob = repo.find_blob(entry.id()).map_err(|error| error.to_string())?;
    Ok(blob.content().to_vec())
}

pub fn read(root: &Path, relative: &str, id: &str) -> Result<Vec<u8>, String> {
    let repo = repository(root, false)?.ok_or("此文件夹尚未保存历史版本")?;
    let scope = scope(root, relative)?;
    if !versions_at(&repo, &scope)?.iter().any(|version| version.id == id) { return Err("历史版本不存在".into()); }
    read_at(&repo, &scope, id)
}

pub fn snapshot(root: &Path, relative: &str, bytes: &[u8], max_versions: usize, retention_days: usize) -> Result<(), String> {
    if !(1..=201).contains(&max_versions) || retention_days > 3650 { return Err("历史版本保留设置有误，请检查数量和天数".into()); }
    let repo = repository(root, true)?.ok_or("无法创建 Git 仓库")?;
    let scope = scope(root, relative)?;
    if let Some(last) = versions_at(&repo, &scope)?.first() { if read_at(&repo, &scope, &last.id)? == bytes { return Ok(()); } }
    let blob = repo.blob(bytes).map_err(|error| error.to_string())?;
    let mut builder = repo.treebuilder(None).map_err(|error| error.to_string())?;
    builder.insert("content", blob, 0o100644).map_err(|error| error.to_string())?;
    let tree_id = builder.write().map_err(|error| error.to_string())?;
    let tree = repo.find_tree(tree_id).map_err(|error| error.to_string())?;
    let author = Signature::now("Markart", "markart@localhost").map_err(|error| error.to_string())?;
    let commit = repo.commit(None, &author, &author, "Markart 保存版本", &tree, &[]).map_err(|error| error.to_string())?;
    let now = SystemTime::now().duration_since(UNIX_EPOCH).map_err(|error| error.to_string())?;
    let id = format!("{}-{}-{}", now.as_millis(), now.subsec_nanos(), std::process::id());
    repo.reference(&format!("{scope}/{id}"), commit, false, "Markart 保存版本").map_err(|error| error.to_string())?;
    prune_at(&repo, &scope, max_versions, retention_days)
}

fn prune_at(repo: &Repository, scope: &str, max_versions: usize, retention_days: usize) -> Result<(), String> {
    let now = SystemTime::now().duration_since(UNIX_EPOCH).map_err(|error| error.to_string())?.as_millis() as u64;
    let age = retention_days as u64 * 86_400_000;
    for (index, item) in versions_at(repo, scope)?.iter().enumerate() {
        if index >= max_versions || (retention_days > 0 && now.saturating_sub(item.created) > age) {
            repo.find_reference(&format!("{scope}/{}", item.id)).map_err(|error| error.to_string())?.delete().map_err(|error| error.to_string())?;
        }
    }
    Ok(())
}

pub fn prune(root: &Path, relative: &str, max_versions: usize, retention_days: usize) -> Result<(), String> {
    if !(1..=201).contains(&max_versions) || retention_days > 3650 { return Err("历史版本保留设置有误，请检查数量和天数".into()); }
    if let Some(repo) = repository(root, false)? { prune_at(&repo, &scope(root, relative)?, max_versions, retention_days)?; }
    Ok(())
}

pub fn diff(before: &[u8], after: &[u8]) -> Result<String, String> {
    let mut options = DiffOptions::new();
    options.context_lines(2);
    let mut patch = Patch::from_buffers(before, Some(Path::new("version")), after, Some(Path::new("current")), Some(&mut options)).map_err(|error| error.to_string())?;
    let output = patch.to_buf().map_err(|error| error.to_string())?;
    String::from_utf8(output.to_vec()).map_err(|error| error.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn snapshots_and_diff_do_not_change_working_tree() {
        let dir = tempfile::tempdir().unwrap();
        std::fs::write(dir.path().join("note.md"), "当前内容").unwrap();
        snapshot(dir.path(), "note.md", "旧内容".as_bytes(), 20, 0).unwrap();
        snapshot(dir.path(), "note.md", "当前内容".as_bytes(), 20, 0).unwrap();
        let versions = list(dir.path(), "note.md").unwrap();
        assert_eq!(versions.len(), 2);
        assert_eq!(read(dir.path(), "note.md", &versions[1].id).unwrap(), "旧内容".as_bytes());
        assert!(diff("旧内容\n".as_bytes(), "当前内容\n".as_bytes()).unwrap().contains("+当前内容"));
        assert_eq!(std::fs::read_to_string(dir.path().join("note.md")).unwrap(), "当前内容");
        prune(dir.path(), "note.md", 1, 0).unwrap();
        assert_eq!(list(dir.path(), "note.md").unwrap().len(), 1);
    }
    #[test]
    fn snapshots_do_not_touch_existing_branch_or_index() {
        let dir = tempfile::tempdir().unwrap();
        let repo = Repository::init(dir.path()).unwrap();
        std::fs::write(dir.path().join("note.md"), "staged").unwrap();
        { let mut index = repo.index().unwrap(); index.add_path(Path::new("note.md")).unwrap(); index.write().unwrap(); }
        let before = std::fs::read(dir.path().join(".git/index")).unwrap();
        snapshot(dir.path(), "note.md", b"saved version", 20, 0).unwrap();
        assert_eq!(std::fs::read(dir.path().join(".git/index")).unwrap(), before);
        assert_eq!(std::fs::read_to_string(dir.path().join("note.md")).unwrap(), "staged");
    }
}

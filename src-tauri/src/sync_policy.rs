use git2::Repository;
use serde::Deserialize;
use sha2::{Digest, Sha256};
use std::path::Path;

#[derive(Clone, Copy, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ConflictPolicy { Remote, #[default] Merge }

// Never emit conflict markers. Missing history or binary content keeps both versions.
pub fn merge(base: Option<&[u8]>, local: &[u8], remote: &[u8]) -> Result<Option<Vec<u8>>, String> {
    let Some(base) = base else { return Ok(None); };
    if [base, local, remote].iter().any(|bytes| bytes.contains(&0) || std::str::from_utf8(bytes).is_err()) { return Ok(None); }
    let dir = tempfile::tempdir().map_err(|e| e.to_string())?;
    let repo = Repository::init_bare(dir.path()).map_err(|e| e.to_string())?;
    let tree = |bytes: &[u8]| -> Result<_, String> {
        let blob = repo.blob(bytes).map_err(|e| e.to_string())?;
        let mut builder = repo.treebuilder(None).map_err(|e| e.to_string())?;
        builder.insert("document", blob, 0o100644).map_err(|e| e.to_string())?;
        repo.find_tree(builder.write().map_err(|e| e.to_string())?).map_err(|e| e.to_string())
    };
    let (base, local, remote) = (tree(base)?, tree(local)?, tree(remote)?);
    let mut index = repo.merge_trees(&base, &local, &remote, None).map_err(|e| e.to_string())?;
    if index.has_conflicts() { return Ok(None); }
    let tree = repo.find_tree(index.write_tree_to(&repo).map_err(|e| e.to_string())?).map_err(|e| e.to_string())?;
    let entry = tree.get_path(Path::new("document")).map_err(|e| e.to_string())?;
    let content = repo.find_blob(entry.id()).map_err(|e| e.to_string())?.content().to_vec();
    Ok(Some(content))
}
pub fn copy_name(path: &str, bytes: &[u8], number: usize) -> String {
    let path = Path::new(path);
    let stem = path.file_stem().unwrap_or_default().to_string_lossy();
    let ext = path.extension().map(|s| format!(".{}", s.to_string_lossy())).unwrap_or_default();
    let hash = format!("{:x}", Sha256::digest(bytes));
    path.with_file_name(format!("{stem}.conflict-{}-{number}{ext}", &hash[..10])).to_string_lossy().replace('\\', "/")
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test] fn merges_independent_lines_without_markers() {
        assert_eq!(merge(Some(b"one\ntwo\nthree\n"), b"ONE\ntwo\nthree\n", b"one\ntwo\nTHREE\n").unwrap().unwrap(), b"ONE\ntwo\nTHREE\n");
        assert!(merge(Some(b"three"), b"four", b"five").unwrap().is_none());
        assert!(merge(None, b"four", b"five").unwrap().is_none());
        assert!(merge(Some(b"x"), b"a\0", b"b\0").unwrap().is_none());
    }
}

pub fn protected_absolute_paths(root: &std::path::Path, paths: &[String]) -> Vec<String> {
    paths.iter().filter_map(|path| {
        let path = std::path::Path::new(path);
        if !path.is_absolute() || path.components().any(|part| matches!(part, std::path::Component::ParentDir)) { return None; }
        path.strip_prefix(root).ok().filter(|relative| !relative.as_os_str().is_empty()).map(|relative| relative.to_string_lossy().replace('\\', "/"))
    }).collect()
}

#[cfg(test)]
mod absolute_protection_tests {
    #[test]
    fn protects_dirty_tabs_in_sibling_directories_without_accepting_outside_paths() {
        let base = tempfile::tempdir().unwrap();
        let root = base.path().join("notes");
        let paths = vec![root.join("a/note.md").to_string_lossy().into_owned(), root.join("b/note.md").to_string_lossy().into_owned(), base.path().join("outside.md").to_string_lossy().into_owned(), root.join("../outside.md").to_string_lossy().into_owned()];
        assert_eq!(super::protected_absolute_paths(&root, &paths), vec!["a/note.md", "b/note.md"]);
    }
}

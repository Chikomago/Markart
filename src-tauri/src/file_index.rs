//! Rebuildable, local-only index. Disk files remain authoritative.
use crate::link_paths::local_references;
use rusqlite::functions::FunctionFlags;
use rusqlite::{params, Connection, OptionalExtension};
use serde::Serialize;
use sha2::{Digest, Sha256};
use std::{
    collections::{HashMap, HashSet},
    fs,
    path::{Path, PathBuf},
    sync::{Arc, OnceLock},
};

const SEARCH_BUILD:&str="INSERT INTO files_fts(files_fts) VALUES('rebuild');
            CREATE TRIGGER files_search_insert AFTER INSERT ON files BEGIN
                INSERT INTO files_fts(rowid,search_path,search_body) VALUES(new.rowid,new.search_path,new.search_body);
            END;
            CREATE TRIGGER files_search_delete AFTER DELETE ON files BEGIN
                INSERT INTO files_fts(files_fts,rowid,search_path,search_body) VALUES('delete',old.rowid,old.search_path,old.search_body);
            END;
            CREATE TRIGGER files_search_update AFTER UPDATE OF search_path,search_body ON files
                WHEN old.search_path IS NOT new.search_path OR old.search_body IS NOT new.search_body BEGIN
                INSERT INTO files_fts(files_fts,rowid,search_path,search_body) VALUES('delete',old.rowid,old.search_path,old.search_body);
                INSERT INTO files_fts(rowid,search_path,search_body) VALUES(new.rowid,new.search_path,new.search_body);
            END;
            PRAGMA user_version=3;";

static DATA_DIR: OnceLock<PathBuf> = OnceLock::new();
pub fn configure(path: PathBuf) {
    let _ = DATA_DIR.set(path);
}

#[derive(Clone, PartialEq, Eq)]
struct FileStamp {
    size: u64,
    modified: Option<std::time::SystemTime>,
    created: Option<std::time::SystemTime>,
    #[cfg(unix)]
    identity: (u64, u64, i64, i64),
}
impl FileStamp {
    fn read(meta: &fs::Metadata) -> Self {
        #[cfg(unix)]
        use std::os::unix::fs::MetadataExt;
        Self {
            size: meta.len(),
            modified: meta.modified().ok(),
            created: meta.created().ok(),
            #[cfg(unix)]
            identity: (meta.dev(), meta.ino(), meta.ctime(), meta.ctime_nsec()),
        }
    }
}
pub struct FileIndex {
    db: Connection,
    stamps: HashMap<String, FileStamp>,
    scope: String,
    location: Option<(PathBuf, PathBuf)>,
    notifier: Option<Arc<dyn Fn(String) + Send + Sync>>,
    published: Option<String>,
}
fn normalized_path(path: &str) -> String {
    if !cfg!(windows) {
        return path.to_owned();
    }
    let value = path.replace('\\', "/");
    if let Some(unc) = value.strip_prefix("//?/UNC/") {
        format!("//{unc}")
    } else {
        value.strip_prefix("//?/").unwrap_or(&value).to_owned()
    }
}
fn markdown(path: &str) -> bool {
    matches!(
        Path::new(path)
            .extension()
            .and_then(|s| s.to_str())
            .map(str::to_ascii_lowercase)
            .as_deref(),
        Some("md" | "markdown" | "mdown" | "mkd")
    )
}
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct CompletionEntry {
    pub path: String,
    pub directory: bool,
}
#[derive(Debug, PartialEq, Eq)]
pub struct SearchEntry {
    pub path: String,
    pub snippet: Option<String>,
}
#[derive(Debug, Serialize)]
pub struct IndexedFile {
    pub id: String,
    pub path: String,
    pub version: i64,
    pub size: i64,
    pub text: bool,
}
#[derive(Debug, Serialize)]
pub struct IndexChange {
    pub sequence: i64,
    pub id: String,
    pub path: String,
    pub version: i64,
    pub kind: String,
}
#[derive(Debug, Serialize)]
pub struct IndexPage {
    pub cursor: String,
    pub files: Vec<IndexedFile>,
    pub next: Option<String>,
}
#[derive(Debug, Serialize)]
pub struct ChangePage {
    pub cursor: String,
    pub changes: Vec<IndexChange>,
    pub more: bool,
}
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct IndexedLink {
    pub key: i64,
    pub source: String,
    pub source_path: String,
    pub target: Option<String>,
    pub target_path: String,
    pub raw: String,
    pub line: i64,
    pub from: i64,
    pub to: i64,
}
#[derive(Debug, Serialize)]
pub struct RelationPage {
    pub cursor: String,
    pub links: Vec<IndexedLink>,
    pub next: Option<i64>,
}
fn cached_execute(
    tx: &rusqlite::Transaction<'_>,
    sql: &str,
    params: impl rusqlite::Params,
) -> rusqlite::Result<usize> {
    tx.prepare_cached(sql)?.execute(params)
}
fn search_snippet(body: &str, needle: &str) -> Option<String> {
    body.lines().find_map(|line| {
        let lowered = line.to_lowercase();
        let position = lowered.find(needle)?;
        let center = lowered[..position].chars().count();
        let chars: Vec<_> = line.chars().collect();
        let start = center.saturating_sub(40).min(chars.len());
        let end = (center + needle.chars().count() + 90).min(chars.len());
        Some(format!(
            "{}{}{}",
            if start > 0 { "…" } else { "" },
            chars[start..end].iter().collect::<String>(),
            if end < chars.len() { "…" } else { "" }
        ))
    })
}
fn parent_path(path: &str) -> &str {
    path.rsplit_once('/').map_or("", |(parent, _)| parent)
}
fn completion_score(query: &str, name: &str) -> i64 {
    let q = query.to_lowercase();
    let value = name.to_lowercase();
    if q == value {
        return 100;
    }
    if value.starts_with(&q) {
        return 80;
    }
    let mut split = String::new();
    let mut previous = None;
    for ch in name.chars() {
        if previous.is_some_and(|p: char| p.is_ascii_lowercase()) && ch.is_ascii_uppercase() {
            split.push(' ');
        }
        split.push(ch);
        previous = Some(ch);
    }
    let initials: String = split
        .split(|ch: char| ch.is_whitespace() || "/_.-".contains(ch))
        .filter_map(|part| part.chars().next())
        .collect();
    if initials.to_lowercase().starts_with(&q) {
        return 60;
    }
    if value.contains(&q) {
        return 40;
    }
    let mut chars = q.chars();
    let mut next = chars.next();
    for ch in value.chars() {
        if next == Some(ch) {
            next = chars.next();
        }
    }
    if next.is_none() {
        20
    } else {
        -1
    }
}
impl FileIndex {
    pub(crate) fn cached_text_encodings(root: &Path) -> Result<HashMap<String, Option<bool>>, String> {
        let Some(dir) = DATA_DIR.get() else { return Ok(HashMap::new()); };
        let path = dir.join("file-index/catalog.sqlite3");
        if !path.exists() { return Ok(HashMap::new()); }
        // A read-only metadata query does not migrate or integrity-check the full catalog.
        let db = Connection::open_with_flags(path, rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY).map_err(|e| e.to_string())?;
        db.busy_timeout(std::time::Duration::from_millis(25)).map_err(|e| e.to_string())?;
        let scope = format!("{}/", normalized_path(&root.to_string_lossy()).trim_end_matches('/'));
        let mut stmt = db.prepare("SELECT path,CASE WHEN size > 20971520 THEN NULL ELSE body IS NOT NULL END FROM files WHERE path>=?1 AND path<?2").map_err(|e| e.to_string())?;
        let rows = stmt.query_map(params![scope, format!("{}\u{10ffff}", scope)], |row| {
            let path: String = row.get(0)?;
            Ok((path.strip_prefix(&scope).unwrap_or(&path).to_owned(), row.get::<_, Option<bool>>(1)?))
        }).map_err(|e| e.to_string())?;
        rows.collect::<rusqlite::Result<_>>().map_err(|e| e.to_string())
    }
    pub fn for_root(root: &Path) -> Result<Self, String> {
        if let Some(dir) = DATA_DIR.get() {
            return Self::persistent(&dir.join("file-index"), root);
        }
        Self::initialize(Connection::open_in_memory().map_err(|e| e.to_string())?)
            .map_err(|e| e.to_string())
    }
    pub(crate) fn persistent(dir: &Path, root: &Path) -> Result<Self, String> {
        fs::create_dir_all(dir).map_err(|e| e.to_string())?;
        let path = dir.join("catalog.sqlite3");
        let open = || -> rusqlite::Result<Self> {
            let db = Connection::open(&path)?;
            let check: String = db.query_row("PRAGMA quick_check", [], |r| r.get(0))?;
            if check != "ok" {
                return Err(rusqlite::Error::SqliteFailure(
                    rusqlite::ffi::Error::new(rusqlite::ffi::SQLITE_CORRUPT),
                    Some(check),
                ));
            }
            let index = Self::initialize(db)?;
            if index.db.prepare("PRAGMA foreign_key_check")?.exists([])? {
                return Err(rusqlite::Error::SqliteFailure(
                    rusqlite::ffi::Error::new(rusqlite::ffi::SQLITE_CORRUPT),
                    Some("index foreign key violation".into()),
                ));
            }

            index
                .db
                .execute_batch("PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL;")?;
            index.db.execute(
                "INSERT INTO files_fts(files_fts,rank) VALUES('integrity-check',1)",
                [],
            )?;
            Ok(index)
        };
        let mut index = match open() {
            Ok(index) => index,
            Err(error) if matches!(&error,rusqlite::Error::SqliteFailure(e,_) if matches!(e.code,rusqlite::ErrorCode::DatabaseCorrupt|rusqlite::ErrorCode::NotADatabase)) =>
            {
                let stamp = std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .map_err(|e| e.to_string())?
                    .as_nanos();
                for suffix in ["", "-wal", "-shm"] {
                    let source = dir.join(format!("catalog.sqlite3{suffix}"));
                    if source.exists() {
                        fs::rename(
                            &source,
                            dir.join(format!("catalog.corrupt-{stamp}{suffix}")),
                        )
                        .map_err(|e| e.to_string())?;
                    }
                }
                log::warn!("Rebuilding corrupt file index: {error}");
                open().map_err(|e| e.to_string())?
            }
            Err(error) => return Err(error.to_string()),
        };
        let root = root.canonicalize().map_err(|e| e.to_string())?;
        let normalized = root.to_str().ok_or("index-path-not-utf8")?;
        let normalized = normalized_path(normalized);
        index.scope = format!("{}/", normalized.trim_end_matches('/'));
        index.import_legacy(dir, &root)?;
        index.location = Some((dir.to_path_buf(), root));
        Ok(index)
    }
    fn import_legacy(&mut self, dir: &Path, root: &Path) -> Result<(), String> {
        self.db
            .execute_batch("CREATE TABLE IF NOT EXISTS catalog_roots(root TEXT PRIMARY KEY);")
            .map_err(|e| e.to_string())?;
        let imported: bool = self
            .db
            .query_row(
                "SELECT EXISTS(SELECT 1 FROM catalog_roots WHERE root=?1)",
                [&self.scope],
                |r| r.get(0),
            )
            .map_err(|e| e.to_string())?;
        if imported {
            return Ok(());
        }
        let key = format!("{:x}", Sha256::digest(root.to_string_lossy().as_bytes()));
        let path = dir.join(format!("{key}.sqlite3"));
        let tx = self.db.transaction().map_err(|e| e.to_string())?;
        if path.exists() {
            tx.execute_batch("SAVEPOINT legacy_import")
                .map_err(|e| e.to_string())?;
            let migrate = || -> rusqlite::Result<()> {
                let old =
                    Connection::open_with_flags(path, rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY)?;
                let mut stmt =
                    old.prepare("SELECT id,path,hash,version,body,markdown,size FROM files")?;
                let mut rows = stmt.query([])?;
                while let Some(row) = rows.next()? {
                    let relative: String = row.get(1)?;
                    if Path::new(&relative)
                        .components()
                        .any(|p| !matches!(p, std::path::Component::Normal(_)))
                    {
                        continue;
                    }
                    let path = format!("{}{}", self.scope, normalized_path(&relative));
                    let body: Option<String> = row.get(4)?;
                    let kind: i64 = row.get(5)?;
                    tx.execute("INSERT OR IGNORE INTO files(id,path,hash,version,body,markdown,size,parent,search_path,search_body) VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9,?10)",params![row.get::<_,String>(0)?,path,row.get::<_,String>(2)?,row.get::<_,i64>(3)?,body,if kind==1{-1}else{kind},row.get::<_,i64>(6)?,parent_path(&path),path.to_lowercase(),body.as_ref().map(|b|b.to_lowercase())])?;
                }
                Ok(())
            };
            if let Err(error) = migrate() {
                tx.execute_batch("ROLLBACK TO legacy_import")
                    .map_err(|e| e.to_string())?;
                log::warn!("Skipping invalid legacy file index: {error}");
            }
            tx.execute_batch("RELEASE legacy_import")
                .map_err(|e| e.to_string())?;
        }
        tx.execute("INSERT INTO catalog_roots(root) VALUES(?1)", [&self.scope])
            .map_err(|e| e.to_string())?;
        tx.commit().map_err(|e| e.to_string())
    }
    fn stored(&self, path: &str) -> String {
        format!("{}{}", self.scope, normalized_path(path))
    }
    fn local(&self, path: &str) -> String {
        path.strip_prefix(&self.scope).unwrap_or(path).to_owned()
    }
    fn upper(&self) -> String {
        format!("{}\u{10ffff}", self.scope)
    }
    pub fn set_notifier(&mut self, callback: impl Fn(String) + Send + Sync + 'static) {
        self.notifier = Some(Arc::new(callback));
    }
    pub fn cursor(&self) -> Result<String, String> {
        let (epoch, seq) = self.position()?;
        Ok(format!("{epoch}:{seq}"))
    }
    fn publish(&mut self) {
        let Ok(cursor) = self.cursor() else {
            return;
        };
        if self.published.as_ref() == Some(&cursor) {
            return;
        }
        self.published = Some(cursor.clone());
        if let Some(callback) = &self.notifier {
            callback(cursor);
        }
    }
    pub fn read<T>(&self, query: impl FnOnce(&Self) -> Result<T, String>) -> Result<T, String> {
        let tx = self.db.unchecked_transaction().map_err(|e| e.to_string())?;
        let result = query(self)?;
        tx.commit().map_err(|e| e.to_string())?;
        Ok(result)
    }
    pub fn recover_if_corrupt(&mut self) -> Result<bool, String> {
        let Some((dir, root)) = self.location.clone() else {
            return Ok(false);
        };
        let check = self
            .db
            .query_row("PRAGMA quick_check", [], |r| r.get::<_, String>(0));
        let corrupt = match check {
            Ok(check) => check != "ok",
            Err(rusqlite::Error::SqliteFailure(error, _)) => matches!(
                error.code,
                rusqlite::ErrorCode::DatabaseCorrupt | rusqlite::ErrorCode::NotADatabase
            ),
            Err(_) => false,
        };
        // Also detect corruption confined to the FTS content index.
        let fts = if !corrupt {
            self.db.execute(
                "INSERT INTO files_fts(files_fts,rank) VALUES('integrity-check',1)",
                [],
            )
        } else {
            Ok(0)
        };
        let corrupt = corrupt
            || matches!(fts,Err(rusqlite::Error::SqliteFailure(error,_)) if error.code==rusqlite::ErrorCode::DatabaseCorrupt);
        if !corrupt {
            return Ok(false);
        }
        self.db = Connection::open_in_memory().map_err(|e| e.to_string())?;
        match Self::persistent(&dir, &root) {
            Ok(mut next) => {
                next.notifier = self.notifier.take();
                next.published = self.published.take();
                *self = next;
                Ok(true)
            }
            Err(error) => {
                if let Ok(db) = Connection::open(dir.join("catalog.sqlite3")) {
                    self.db = db;
                }
                Err(error)
            }
        }
    }
    fn initialize(mut db: Connection) -> rusqlite::Result<Self> {
        db.create_scalar_function(
            "link_score",
            3,
            FunctionFlags::SQLITE_UTF8 | FunctionFlags::SQLITE_DETERMINISTIC,
            |ctx| {
                let query: String = ctx.get(0)?;
                let path: String = ctx.get(1)?;
                let scoped: bool = ctx.get(2)?;
                let rank = completion_score(&query, path.rsplit('/').next().unwrap_or(&path));
                Ok(if scoped {
                    rank
                } else {
                    rank.max(completion_score(&query, &path) - 10)
                })
            },
        )?;
        db.set_prepared_statement_cache_capacity(64);
        db.busy_timeout(std::time::Duration::from_secs(2))?;
        db.execute_batch(
            "PRAGMA foreign_keys=ON;
            CREATE TABLE IF NOT EXISTS files (
                id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) ,
                path TEXT NOT NULL UNIQUE, hash TEXT NOT NULL, version INTEGER NOT NULL,
                body TEXT, markdown INTEGER NOT NULL, size INTEGER NOT NULL, parent TEXT NOT NULL DEFAULT '');
            CREATE TABLE IF NOT EXISTS links (
                source TEXT NOT NULL REFERENCES files(id) ON DELETE CASCADE,
                target TEXT NOT NULL, raw TEXT NOT NULL, line INTEGER NOT NULL);
            CREATE INDEX IF NOT EXISTS links_target ON links(target);
            CREATE INDEX IF NOT EXISTS links_source ON links(source);
            CREATE TABLE IF NOT EXISTS properties (
                source TEXT PRIMARY KEY REFERENCES files(id) ON DELETE CASCADE, yaml TEXT NOT NULL);
            CREATE TABLE IF NOT EXISTS headings (
                source TEXT NOT NULL REFERENCES files(id) ON DELETE CASCADE,
                level INTEGER NOT NULL, text TEXT NOT NULL, line INTEGER NOT NULL);
            CREATE INDEX IF NOT EXISTS headings_source ON headings(source);
            CREATE TABLE IF NOT EXISTS directories(path TEXT PRIMARY KEY, parent TEXT NOT NULL);
            CREATE INDEX IF NOT EXISTS directory_parent ON directories(parent);",
        )?;
        let columns = {
            let mut stmt = db.prepare("PRAGMA table_info(files)")?;
            let rows = stmt.query_map([], |row| row.get::<_, String>(1))?;
            rows.collect::<rusqlite::Result<Vec<_>>>()?
        };
        if !columns.iter().any(|name| name == "parent") {
            let tx = db.transaction()?;
            tx.execute_batch("ALTER TABLE files ADD COLUMN parent TEXT NOT NULL DEFAULT '';")?;
            let paths = {
                let mut stmt = tx.prepare("SELECT path FROM files")?;
                let rows = stmt.query_map([], |row| row.get::<_, String>(0))?;
                rows.collect::<rusqlite::Result<Vec<_>>>()?
            };
            for path in paths {
                tx.execute(
                    "UPDATE files SET parent=?1 WHERE path=?2",
                    params![parent_path(&path), path],
                )?;
            }
            tx.commit()?;
        }
        db.execute_batch("CREATE INDEX IF NOT EXISTS file_parent ON files(parent);")?;
        Self::initialize_search(&mut db)?;
        db.execute_batch("CREATE TABLE IF NOT EXISTS index_meta(epoch TEXT NOT NULL);
            INSERT INTO index_meta SELECT lower(hex(randomblob(16))) WHERE NOT EXISTS(SELECT 1 FROM index_meta);
            CREATE TABLE IF NOT EXISTS index_changes(sequence INTEGER PRIMARY KEY AUTOINCREMENT,id TEXT NOT NULL,path TEXT NOT NULL,version INTEGER NOT NULL,kind TEXT NOT NULL);
            CREATE TRIGGER IF NOT EXISTS index_insert AFTER INSERT ON files BEGIN
              INSERT INTO index_changes(id,path,version,kind) VALUES(new.id,new.path,new.version,'upsert'); END;
            CREATE TRIGGER IF NOT EXISTS index_update AFTER UPDATE ON files WHEN old.path<>new.path OR old.hash<>new.hash BEGIN
              INSERT INTO index_changes(id,path,version,kind) VALUES(new.id,new.path,new.version,'upsert'); END;
            CREATE TRIGGER IF NOT EXISTS index_delete AFTER DELETE ON files BEGIN
              INSERT INTO index_changes(id,path,version,kind) VALUES(old.id,old.path,old.version,'remove'); END;
            CREATE TRIGGER IF NOT EXISTS index_retention AFTER INSERT ON index_changes BEGIN
              DELETE FROM index_changes WHERE sequence<=new.sequence-10000; END;")?;
        db.execute_batch("CREATE TABLE IF NOT EXISTS file_metadata(source TEXT PRIMARY KEY REFERENCES files(id) ON DELETE CASCADE,json TEXT NOT NULL);
            CREATE TABLE IF NOT EXISTS file_tags(source TEXT NOT NULL REFERENCES files(id) ON DELETE CASCADE,name TEXT NOT NULL);
            CREATE INDEX IF NOT EXISTS tags_name ON file_tags(name);
            CREATE INDEX IF NOT EXISTS tags_source_name ON file_tags(source,name);")?;
        // Reparse existing rows once when adding structured metadata.
        db.execute("UPDATE files SET markdown=-1 WHERE markdown=1 AND NOT EXISTS(SELECT 1 FROM file_metadata WHERE source=files.id)",[])?;
        let columns = {
            let mut stmt = db.prepare("PRAGMA table_info(links)")?;
            let rows = stmt.query_map([], |r| r.get::<_, String>(1))?;
            rows.collect::<rusqlite::Result<Vec<_>>>()?
        };
        if !columns.iter().any(|c| c == "from_offset") {
            let tx = db.transaction()?;
            tx.execute_batch("ALTER TABLE links ADD COLUMN from_offset INTEGER NOT NULL DEFAULT 0; ALTER TABLE links ADD COLUMN to_offset INTEGER NOT NULL DEFAULT 0; UPDATE files SET markdown=-1 WHERE markdown=1;")?;
            tx.commit()?;
        }
        db.pragma_update(None, "user_version", 4)?;
        Ok(Self {
            db,
            stamps: HashMap::new(),
            scope: String::new(),
            location: None,
            notifier: None,
            published: None,
        })
    }
    fn initialize_search(db: &mut Connection) -> rusqlite::Result<()> {
        let columns = {
            let mut stmt = db.prepare("PRAGMA table_info(files)")?;
            let rows = stmt.query_map([], |row| row.get::<_, String>(1))?;
            rows.collect::<rusqlite::Result<Vec<_>>>()?
        };
        if columns.iter().any(|name| name == "search_path") {
            let complete:i64=db.query_row("SELECT count(*) FROM sqlite_master WHERE (type='table' AND name='files_fts') OR (type='trigger' AND name IN ('files_search_insert','files_search_delete','files_search_update'))",[],|r|r.get(0))?;
            if complete == 4 {
                return Ok(());
            }
            let tx = db.transaction()?;
            tx.execute_batch("DROP TRIGGER IF EXISTS files_search_insert;DROP TRIGGER IF EXISTS files_search_delete;DROP TRIGGER IF EXISTS files_search_update;DROP TABLE IF EXISTS files_fts;
                CREATE VIRTUAL TABLE files_fts USING fts5(search_path,search_body,content='files',content_rowid='rowid',tokenize='trigram case_sensitive 1');")?;
            tx.execute_batch(SEARCH_BUILD)?;
            return tx.commit();
        }
        let tx = db.transaction()?;
        tx.execute_batch("ALTER TABLE files ADD COLUMN search_path TEXT NOT NULL DEFAULT '';
            ALTER TABLE files ADD COLUMN search_body TEXT;
            CREATE VIRTUAL TABLE files_fts USING fts5(search_path,search_body,content='files',content_rowid='rowid',tokenize='trigram case_sensitive 1');")?;
        {
            let mut stmt = tx.prepare("SELECT rowid,path,body FROM files ORDER BY rowid")?;
            let rows = stmt.query_map([], |row| {
                Ok((
                    row.get::<_, i64>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, Option<String>>(2)?,
                ))
            })?;
            for row in rows {
                let (id, path, body) = row?;
                let normalized = body
                    .filter(|body| !crate::workspace::binary_document(body.as_bytes()))
                    .map(|body| body.to_lowercase());
                tx.execute(
                    "UPDATE files SET search_path=?1,search_body=?2 WHERE rowid=?3",
                    params![path.to_lowercase(), normalized, id],
                )?;
            }
        }
        tx.execute_batch(SEARCH_BUILD)?;
        tx.commit()
    }
    fn position(&self) -> Result<(String, i64), String> {
        self.db.query_row("SELECT epoch,(SELECT coalesce(max(sequence),0) FROM index_changes) FROM index_meta", [], |r| Ok((format!("{}@{:x}",r.get::<_,String>(0)?,Sha256::digest(self.scope.as_bytes())),r.get(1)?))).map_err(|e|e.to_string())
    }
    fn parse_cursor(&self, cursor: &str) -> Result<i64, String> {
        let (epoch, current) = self.position()?;
        let (given, seq) = cursor.split_once(':').ok_or("invalid-index-cursor")?;
        let seq: i64 = seq.parse().map_err(|_| "invalid-index-cursor")?;
        if given != epoch || seq < 0 || seq > current {
            return Err("index-reset-required".into());
        }
        Ok(seq)
    }
    /// Read directory identities from the same persistent catalog used by search and links.
    pub fn directory_paths(&self) -> Result<Vec<String>, String> {
        let mut stmt = self.db.prepare("SELECT path FROM directories WHERE path>=?1 AND path<?2 ORDER BY path").map_err(|e| e.to_string())?;
        let rows = stmt.query_map(params![self.scope, self.upper()], |row| Ok(self.local(&row.get::<_, String>(0)?))).map_err(|e| e.to_string())?;
        rows.collect::<rusqlite::Result<Vec<_>>>().map_err(|e| e.to_string())
    }

    pub fn text_encodings(&self) -> Result<HashMap<String, Option<bool>>, String> {
        let mut stmt = self.db.prepare(
            "SELECT path,CASE WHEN size > 20971520 THEN NULL ELSE body IS NOT NULL END FROM files WHERE path>=?1 AND path<?2"
        ).map_err(|error| error.to_string())?;
        let rows = stmt.query_map(params![self.scope, self.upper()], |row| {
            Ok((self.local(&row.get::<_, String>(0)?), row.get::<_, Option<bool>>(1)?))
        }).map_err(|error| error.to_string())?;
        rows.collect::<rusqlite::Result<HashMap<_, _>>>().map_err(|error| error.to_string())
    }

    pub fn page(
        &self,
        cursor: Option<&str>,
        after: Option<&str>,
        limit: usize,
    ) -> Result<IndexPage, String> {
        let (epoch, seq) = self.position()?;
        if let Some(cursor) = cursor {
            if self.parse_cursor(cursor)? != seq {
                return Err("index-reset-required".into());
            }
        } else if after.is_some() {
            return Err("invalid-index-cursor".into());
        }
        let limit = limit.clamp(1, 500);
        let mut stmt = self.db.prepare("SELECT id,path,version,size,body IS NOT NULL FROM files WHERE id>?1 AND path>=?3 AND path<?4 ORDER BY id LIMIT ?2").map_err(|e|e.to_string())?;
        let mut files = stmt
            .query_map(
                params![
                    after.unwrap_or(""),
                    limit as i64 + 1,
                    self.scope,
                    self.upper()
                ],
                |r| {
                    Ok(IndexedFile {
                        id: r.get(0)?,
                        path: self.local(&r.get::<_, String>(1)?),
                        version: r.get(2)?,
                        size: r.get(3)?,
                        text: r.get(4)?,
                    })
                },
            )
            .map_err(|e| e.to_string())?
            .collect::<rusqlite::Result<Vec<_>>>()
            .map_err(|e| e.to_string())?;
        let next = if files.len() > limit {
            files.pop();
            files.last().map(|f| f.id.clone())
        } else {
            None
        };
        Ok(IndexPage {
            cursor: format!("{epoch}:{seq}"),
            files,
            next,
        })
    }
    pub fn changes(&self, cursor: &str, limit: usize) -> Result<ChangePage, String> {
        let seq = self.parse_cursor(cursor)?;
        let (epoch, current) = self.position()?;
        let first: i64 = self
            .db
            .query_row(
                "SELECT coalesce(min(sequence),0) FROM index_changes",
                [],
                |r| r.get(0),
            )
            .map_err(|e| e.to_string())?;
        if seq < first - 1 {
            return Err("index-reset-required".into());
        }
        let limit = limit.clamp(1, 500);
        let mut stmt=self.db.prepare("SELECT sequence,id,path,version,kind FROM index_changes WHERE sequence>?1 AND path>=?3 AND path<?4 ORDER BY sequence LIMIT ?2").map_err(|e|e.to_string())?;
        let mut changes = stmt
            .query_map(
                params![seq, limit as i64 + 1, self.scope, self.upper()],
                |r| {
                    Ok(IndexChange {
                        sequence: r.get(0)?,
                        id: r.get(1)?,
                        path: self.local(&r.get::<_, String>(2)?),
                        version: r.get(3)?,
                        kind: r.get(4)?,
                    })
                },
            )
            .map_err(|e| e.to_string())?
            .collect::<rusqlite::Result<Vec<_>>>()
            .map_err(|e| e.to_string())?;
        let more = changes.len() > limit;
        if more {
            changes.pop();
        }
        let end = changes.last().map_or(current, |c| c.sequence);
        Ok(ChangePage {
            cursor: format!("{epoch}:{end}"),
            changes,
            more,
        })
    }
    pub fn content(&self, id: &str, version: i64) -> Result<Option<String>, String> {
        let row: Option<(i64, Option<String>)> = self
            .db
            .query_row(
                "SELECT version,body FROM files WHERE id=?1 AND path>=?2 AND path<?3",
                params![id, self.scope, self.upper()],
                |r| Ok((r.get(0)?, r.get(1)?)),
            )
            .optional()
            .map_err(|e| e.to_string())?;
        match row {
            Some((actual, _)) if actual != version => Err("stale-index-version".into()),
            Some((_, body)) => Ok(body),
            None => Err("indexed-file-not-found".into()),
        }
    }
    pub fn metadata(
        &self,
        id: &str,
        version: i64,
    ) -> Result<crate::index_extract::Metadata, String> {
        // Reuse the scoped version guard, without loading the body into the API response.
        self.version_guard(id, version)?;
        let json: Option<String> = self
            .db
            .query_row(
                "SELECT json FROM file_metadata WHERE source=?1",
                [id],
                |r| r.get(0),
            )
            .optional()
            .map_err(|e| e.to_string())?;
        json.map_or(Ok(crate::index_extract::Metadata::default()), |json| {
            serde_json::from_str(&json).map_err(|e| e.to_string())
        })
    }
    fn version_guard(&self, id: &str, version: i64) -> Result<(), String> {
        let actual: Option<i64> = self
            .db
            .query_row(
                "SELECT version FROM files WHERE id=?1 AND path>=?2 AND path<?3",
                params![id, self.scope, self.upper()],
                |r| r.get(0),
            )
            .optional()
            .map_err(|e| e.to_string())?;
        match actual {
            Some(actual) if actual == version => Ok(()),
            Some(_) => Err("stale-index-version".into()),
            None => Err("indexed-file-not-found".into()),
        }
    }
    pub fn relations(
        &self,
        id: Option<&str>,
        direction: &str,
        cursor: Option<&str>,
        after: i64,
        limit: usize,
    ) -> Result<RelationPage, String> {
        let (epoch, sequence) = self.position()?;
        if let Some(cursor) = cursor {
            if self.parse_cursor(cursor)? != sequence {
                return Err("index-reset-required".into());
            }
        } else if after != 0 {
            return Err("invalid-index-cursor".into());
        }
        if !matches!(direction, "incoming" | "outgoing" | "both") {
            return Err("invalid-link-direction".into());
        }
        let limit = limit.clamp(1, 500);
        if let Some(id) = id {
            let exists: bool = self
                .db
                .query_row(
                    "SELECT EXISTS(SELECT 1 FROM files WHERE id=?1 AND path>=?2 AND path<?3)",
                    params![id, self.scope, self.upper()],
                    |r| r.get(0),
                )
                .map_err(|e| e.to_string())?;
            if !exists {
                return Err("indexed-file-not-found".into());
            }
        }
        let mut stmt=self.db.prepare("SELECT l.rowid,f.id,f.path,t.id,l.target,l.raw,l.line,l.from_offset,l.to_offset FROM links l JOIN files f ON f.id=l.source LEFT JOIN files t ON t.path=l.target WHERE l.rowid>?1 AND f.path>=?2 AND f.path<?3 AND l.target>=?2 AND l.target<?3 AND (?4 IS NULL OR (?5<>'incoming' AND f.id=?4) OR (?5<>'outgoing' AND t.id=?4)) ORDER BY l.rowid LIMIT ?6").map_err(|e|e.to_string())?;
        let mut links = stmt
            .query_map(
                params![
                    after,
                    self.scope,
                    self.upper(),
                    id,
                    direction,
                    limit as i64 + 1
                ],
                |r| {
                    Ok(IndexedLink {
                        key: r.get(0)?,
                        source: r.get(1)?,
                        source_path: self.local(&r.get::<_, String>(2)?),
                        target: r.get(3)?,
                        target_path: self.local(&r.get::<_, String>(4)?),
                        raw: r.get(5)?,
                        line: r.get(6)?,
                        from: r.get(7)?,
                        to: r.get(8)?,
                    })
                },
            )
            .map_err(|e| e.to_string())?
            .collect::<rusqlite::Result<Vec<_>>>()
            .map_err(|e| e.to_string())?;
        let next = if links.len() > limit {
            links.pop();
            links.last().map(|l| l.key)
        } else {
            None
        };
        Ok(RelationPage {
            cursor: format!("{epoch}:{sequence}"),
            links,
            next,
        })
    }
    pub fn tagged(
        &self,
        tag: &str,
        cursor: Option<&str>,
        after: Option<&str>,
        limit: usize,
    ) -> Result<IndexPage, String> {
        let (epoch, sequence) = self.position()?;
        if let Some(cursor) = cursor {
            if self.parse_cursor(cursor)? != sequence {
                return Err("index-reset-required".into());
            }
        } else if after.is_some() {
            return Err("invalid-index-cursor".into());
        }
        let limit = limit.clamp(1, 500);
        let mut stmt=self.db.prepare("SELECT f.id,f.path,f.version,f.size,f.body IS NOT NULL FROM files f WHERE f.id>?1 AND f.path>=?2 AND f.path<?3 AND EXISTS(SELECT 1 FROM file_tags t WHERE t.source=f.id AND t.name=?4) ORDER BY f.id LIMIT ?5").map_err(|e|e.to_string())?;
        let mut files = stmt
            .query_map(
                params![
                    after.unwrap_or(""),
                    self.scope,
                    self.upper(),
                    tag,
                    limit as i64 + 1
                ],
                |r| {
                    Ok(IndexedFile {
                        id: r.get(0)?,
                        path: self.local(&r.get::<_, String>(1)?),
                        version: r.get(2)?,
                        size: r.get(3)?,
                        text: r.get(4)?,
                    })
                },
            )
            .map_err(|e| e.to_string())?
            .collect::<rusqlite::Result<Vec<_>>>()
            .map_err(|e| e.to_string())?;
        let next = if files.len() > limit {
            files.pop();
            files.last().map(|f| f.id.clone())
        } else {
            None
        };
        Ok(IndexPage {
            cursor: format!("{epoch}:{sequence}"),
            files,
            next,
        })
    }
    pub fn search(&self, query: &str) -> Result<Vec<SearchEntry>, String> {
        let needle = query.trim().to_lowercase();
        if needle.is_empty() {
            return Ok(Vec::new());
        }
        if needle.chars().count() > 200 {
            return Err("搜索词过长".into());
        }
        // Trigram candidates preserve substring matching, including Chinese and punctuation.
        // One- and two-character queries use literal matching against normalized SQLite text.
        let trigram = needle.chars().count() >= 3;
        let sql = if trigram {
            "SELECT f.path,CASE WHEN f.search_body IS NOT NULL THEN f.body END,f.search_path FROM files f JOIN files_fts ON files_fts.rowid=f.rowid WHERE files_fts MATCH ?1 AND f.path>=?2 AND f.path<?3 ORDER BY f.path"
        } else {
            "SELECT path,CASE WHEN search_body IS NOT NULL THEN body END,search_path FROM files WHERE path>=?2 AND path<?3 AND (instr(search_path,?1)>0 OR instr(search_body,?1)>0) ORDER BY path"
        };
        let parameter = if trigram {
            format!("\"{}\"", needle.replace('"', "\"\""))
        } else {
            needle.clone()
        };
        let mut stmt = self.db.prepare(sql).map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(params![parameter, self.scope, self.upper()], |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, Option<String>>(1)?,
                    row.get::<_, String>(2)?,
                ))
            })
            .map_err(|e| e.to_string())?;
        let mut matches = Vec::new();
        for row in rows {
            let (path, body, normalized_path) = row.map_err(|e| e.to_string())?;
            let path = self.local(&path);
            let _ = normalized_path;
            let normalized_path = path.to_lowercase();
            let snippet = body
                .as_deref()
                .and_then(|body| search_snippet(body, &needle));
            if normalized_path.contains(&needle) || snippet.is_some() {
                matches.push(SearchEntry { path, snippet });
            }
        }
        Ok(matches)
    }
    /// One atomic reconciliation. Hash comparison avoids reparsing unchanged files.
    /// Unchanged files use session-local metadata; reopening verifies content hashes.
    #[cfg(test)]
    pub fn reconcile(&mut self, root: &Path, paths: &[String]) -> Result<(), String> {
        self.reconcile_inner(root, paths, true, None)
            .map_err(|e| e.to_string())
    }
    pub fn reconcile_with_directories(
        &mut self,
        root: &Path,
        paths: &[String],
        directories: &[String],
    ) -> Result<(), String> {
        self.reconcile_inner(root, paths, true, Some(directories))
            .map_err(|e| e.to_string())
    }
    pub fn complete_links(
        &self,
        source: &str,
        query: &str,
        folder: Option<&str>,
    ) -> Result<Vec<CompletionEntry>, String> {
        let scope = if folder.is_some() {
            "parent=?1"
        } else {
            "?1 IS NULL"
        };
        let sql = format!("SELECT path,directory FROM (
            SELECT substr(path,length(?5)+1) AS path,parent,0 AS directory FROM files WHERE path>=?5 AND path<?6 UNION ALL SELECT substr(path,length(?5)+1) AS path,parent,1 AS directory FROM directories WHERE path>=?5 AND path<?6)
            WHERE {scope} AND path<>?2 AND link_score(?3,path,?1 IS NOT NULL)>=0
            ORDER BY link_score(?3,path,?1 IS NOT NULL)+(CASE WHEN parent=?4 THEN 5 ELSE 0 END) DESC,directory DESC,path");
        let mut stmt = self.db.prepare(&sql).map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(
                params![
                    folder.map(|p| self.stored(p).trim_end_matches('/').to_owned()),
                    source,
                    query,
                    self.stored(parent_path(source)).trim_end_matches('/'),
                    self.scope,
                    self.upper()
                ],
                |row| {
                    Ok(CompletionEntry {
                        path: row.get(0)?,
                        directory: row.get(1)?,
                    })
                },
            )
            .map_err(|e| e.to_string())?;
        rows.collect::<rusqlite::Result<Vec<_>>>()
            .map_err(|e| e.to_string())
    }
    pub fn remove_path(&mut self, path: &str) -> Result<(), String> {
        let path = self.stored(path);
        let tx = self.db.transaction().map_err(|e| e.to_string())?;
        for table in ["files", "directories"] {
            tx.execute(
                &format!(
                    "DELETE FROM {table} WHERE path=?1 OR substr(path,1,length(?1)+1)=?1||'/'"
                ),
                [&path],
            )
            .map_err(|e| e.to_string())?;
        }
        tx.commit().map_err(|e| e.to_string())?;
        self.stamps
            .retain(|p, _| !(p == &path || p.starts_with(&format!("{path}/"))));
        self.publish();
        Ok(())
    }
    pub fn update(&mut self, root: &Path, path: &str) -> Result<(), String> {
        self.stamps.remove(&self.stored(path));
        self.reconcile_inner(root, &[path.to_owned()], false, None)
            .map_err(|e| e.to_string())
    }
    fn reconcile_inner(
        &mut self,
        root: &Path,
        paths: &[String],
        prune: bool,
        directories: Option<&[String]>,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let scope = self.scope.clone();
        let upper = self.upper();
        let tx = self.db.transaction()?;
        let mut seen = HashSet::new();
        let mut next_stamps = HashMap::new();
        for path in paths {
            let physical = root.join(path);
            let stored_path = format!("{scope}{}", normalized_path(path));
            let path = &stored_path;
            let meta = fs::symlink_metadata(&physical)?;
            if !meta.is_file() || meta.file_type().is_symlink() {
                continue;
            }
            seen.insert(path.clone());
            let stamp = FileStamp::read(&meta);
            if self.stamps.get(path) == Some(&stamp) {
                continue;
            }
            // Large files are registered as targets without loading their body.
            let bytes = if meta.len() <= 20 * 1024 * 1024 {
                Some(fs::read(&physical)?)
            } else {
                None
            };
            let after = fs::symlink_metadata(&physical)?;
            if !after.is_file()
                || after.file_type().is_symlink()
                || FileStamp::read(&after) != stamp
            {
                return Err(std::io::Error::other("file changed during indexing").into());
            }
            next_stamps.insert(path.clone(), stamp);
            let hash = bytes
                .as_ref()
                .map(|b| format!("{:x}", Sha256::digest(b)))
                .unwrap_or_else(|| format!("large:{}:{:?}", meta.len(), meta.modified()));
            let old: Option<(String, String, i64)> = tx
                .prepare_cached("SELECT id,hash,markdown FROM files WHERE path=?1")?
                .query_row([path], |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)))
                .optional()?;
            if old
                .as_ref()
                .is_some_and(|(_, previous, kind)| previous == &hash && *kind >= 0)
            {
                continue;
            }
            let body = bytes
                .as_ref()
                .filter(|bytes| !crate::workspace::binary_document(bytes))
                .and_then(|b| {
                    std::str::from_utf8(b.strip_prefix(&[239, 187, 191]).unwrap_or(b)).ok()
                })
                .filter(|s| !s.contains('\0'));
            cached_execute(&tx,"INSERT INTO files(path,hash,version,body,markdown,size,parent,search_path,search_body) VALUES(?1,?2,1,?3,?4,?5,?6,?7,?8)
                ON CONFLICT(path) DO UPDATE SET hash=excluded.hash,version=files.version+CASE WHEN files.hash=excluded.hash THEN 0 ELSE 1 END,body=excluded.body,markdown=excluded.markdown,size=excluded.size,parent=excluded.parent,search_path=excluded.search_path,search_body=excluded.search_body",
                params![path,hash,body,markdown(path),meta.len() as i64,parent_path(path),path.to_lowercase(),body.map(str::to_lowercase)])?;
            let id: String = tx
                .prepare_cached("SELECT id FROM files WHERE path=?1")?
                .query_row([path], |r| r.get(0))?;
            if old.is_some() {
                cached_execute(&tx, "DELETE FROM links WHERE source=?1", [&id])?;
                cached_execute(&tx, "DELETE FROM headings WHERE source=?1", [&id])?;
                cached_execute(&tx, "DELETE FROM properties WHERE source=?1", [&id])?;
                cached_execute(&tx, "DELETE FROM file_metadata WHERE source=?1", [&id])?;
                cached_execute(&tx, "DELETE FROM file_tags WHERE source=?1", [&id])?;
            }
            if markdown(path) {
                if let Some(body) = body {
                    let metadata = crate::index_extract::extract(body);
                    cached_execute(&tx,"INSERT INTO file_metadata(source,json) VALUES(?1,?2) ON CONFLICT(source) DO UPDATE SET json=excluded.json",params![id,serde_json::to_string(&metadata)?])?;
                    for tag in metadata
                        .tags
                        .iter()
                        .map(|tag| &tag.name)
                        .collect::<HashSet<_>>()
                    {
                        cached_execute(
                            &tx,
                            "INSERT INTO file_tags(source,name) VALUES(?1,?2)",
                            params![id, tag],
                        )?;
                    }
                    if let Some(yaml) = metadata.yaml {
                        cached_execute(
                            &tx,
                            "INSERT INTO properties(source,yaml) VALUES(?1,?2)",
                            params![id, yaml],
                        )?;
                    }
                    for link in local_references(body, path) {
                        cached_execute(&tx,"INSERT INTO links(source,target,raw,line,from_offset,to_offset) VALUES(?1,?2,?3,?4,?5,?6)",params![id,format!("{}{}",scope.chars().take_while(|c|*c=='/').collect::<String>(),link.resolved),link.target,link.line as i64,link.from as i64,link.to as i64])?;
                    }
                    for heading in metadata.headings {
                        cached_execute(
                            &tx,
                            "INSERT INTO headings(source,level,text,line) VALUES(?1,?2,?3,?4)",
                            params![id, heading.level, heading.text, heading.line as i64],
                        )?;
                    }
                }
            }
        }
        if prune {
            let existing = {
                let mut stmt = tx.prepare("SELECT path FROM files WHERE path>=?1 AND path<?2")?;
                let rows = stmt.query_map(params![scope, upper], |r| r.get::<_, String>(0))?;
                rows.collect::<rusqlite::Result<Vec<_>>>()?
            };
            for path in existing {
                if !seen.contains(&path) {
                    cached_execute(&tx, "DELETE FROM files WHERE path=?1", [path])?;
                }
            }
        }
        if let Some(directories) = directories {
            let directories: Vec<_> = directories
                .iter()
                .map(|p| format!("{scope}{}", normalized_path(p)))
                .collect();
            let wanted: HashSet<_> = directories.iter().map(String::as_str).collect();
            for path in &directories {
                cached_execute(&tx,"INSERT INTO directories(path,parent) VALUES(?1,?2) ON CONFLICT(path) DO UPDATE SET parent=excluded.parent WHERE parent<>excluded.parent",params![path,parent_path(path)])?;
            }
            let existing = {
                let mut stmt =
                    tx.prepare("SELECT path FROM directories WHERE path>=?1 AND path<?2")?;
                let rows = stmt.query_map(params![scope, upper], |row| row.get::<_, String>(0))?;
                rows.collect::<rusqlite::Result<Vec<_>>>()?
            };
            for path in existing {
                if !wanted.contains(path.as_str()) {
                    cached_execute(&tx, "DELETE FROM directories WHERE path=?1", [path])?;
                }
            }
        }
        tx.commit()?;
        if prune {
            self.stamps.retain(|path, _| seen.contains(path.as_str()));
        }
        self.stamps.extend(next_stamps);
        self.publish();
        Ok(())
    }
    /// Include inbound references and moved Markdown sources (whose relative paths rebase).
    pub fn move_sources(&self, from: &str) -> Result<Vec<String>, String> {
        let from = self.stored(from);
        let mut stmt = self.db.prepare("SELECT DISTINCT f.path FROM files f LEFT JOIN links l ON l.source=f.id
            WHERE f.path>=?2 AND f.path<?3 AND f.markdown=1 AND (f.body IS NULL OR f.path=?1 OR substr(f.path,1,length(?1)+1)=?1||'/'
            OR l.target=?1 OR substr(l.target,1,length(?1)+1)=?1||'/') ORDER BY f.path").map_err(|e|e.to_string())?;
        let result = stmt
            .query_map(params![from, self.scope, self.upper()], |r| {
                Ok(self.local(&r.get::<_, String>(0)?))
            })
            .map_err(|e| e.to_string())?
            .collect::<rusqlite::Result<Vec<_>>>();
        result.map_err(|e| e.to_string())
    }
    pub fn fingerprint(&self) -> Result<String, String> {
        let mut hash = Sha256::new();
        let mut stmt = self
            .db
            .prepare("SELECT path,hash FROM files WHERE path>=?1 AND path<?2 ORDER BY path")
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(params![self.scope, self.upper()], |r| {
                Ok((r.get::<_, String>(0)?, r.get::<_, String>(1)?))
            })
            .map_err(|e| e.to_string())?;
        for row in rows {
            let (path, content) = row.map_err(|e| e.to_string())?;
            hash.update(path);
            hash.update([0]);
            hash.update(content);
            hash.update([0]);
        }
        Ok(format!("{:x}", hash.finalize()))
    }
    pub fn moved(&mut self, from: &str, to: &str) -> Result<(), String> {
        let from = self.stored(from);
        let to = self.stored(to);
        let (from, to) = (from.as_str(), to.as_str());
        self.stamps.retain(|path, _| {
            !(path == from
                || path.starts_with(&format!("{from}/"))
                || path == to
                || path.starts_with(&format!("{to}/")))
        });
        // Every selected old path is moved once; destination is validated absent by Workspace.
        self.db.execute("UPDATE files SET path=?2||substr(path,length(?1)+1) WHERE path=?1 OR substr(path,1,length(?1)+1)=?1||'/'",params![from,to]).map_err(|e|e.to_string())?;
        let paths = {
            let mut stmt = self
                .db
                .prepare(
                    "SELECT path FROM files WHERE path=?1 OR substr(path,1,length(?1)+1)=?1||'/'",
                )
                .map_err(|e| e.to_string())?;
            let rows = stmt
                .query_map([to], |row| row.get::<_, String>(0))
                .map_err(|e| e.to_string())?;
            rows.collect::<rusqlite::Result<Vec<_>>>()
                .map_err(|e| e.to_string())?
        };
        for path in paths {
            self.db
                .execute(
                    "UPDATE files SET parent=?1 WHERE path=?2",
                    params![parent_path(&path), path],
                )
                .map_err(|e| e.to_string())?;
        }
        // Reparse rebased links even when the file's bytes did not change.
        self.db
            .execute(
                "UPDATE files SET markdown=-1 WHERE path=?1 OR substr(path,1,length(?1)+1)=?1||'/'",
                [to],
            )
            .map_err(|e| e.to_string())?;
        self.publish();
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    #[test]
    fn missing_search_schema_is_rebuilt_without_changing_file_identity() {
        let dir = tempfile::tempdir().unwrap();
        let cache = tempfile::tempdir().unwrap();
        let root = dir.path().canonicalize().unwrap();
        fs::write(root.join("a.md"), "needle").unwrap();
        let mut index = FileIndex::persistent(cache.path(), &root).unwrap();
        index.reconcile(&root, &["a.md".into()]).unwrap();
        let id = index.page(None, None, 100).unwrap().files[0].id.clone();
        index.db.execute_batch("DROP TRIGGER files_search_insert;DROP TRIGGER files_search_delete;DROP TRIGGER files_search_update;DROP TABLE files_fts;").unwrap();
        drop(index);
        let index = FileIndex::persistent(cache.path(), &root).unwrap();
        assert_eq!(index.search("needle").unwrap().len(), 1);
        assert_eq!(index.page(None, None, 100).unwrap().files[0].id, id);
    }

    #[test]
    fn source_metadata_deletes_use_indexes() {
        let index = FileIndex::initialize(Connection::open_in_memory().unwrap()).unwrap();
        for table in ["links", "headings", "file_tags"] {
            let mut stmt = index
                .db
                .prepare(&format!(
                    "EXPLAIN QUERY PLAN DELETE FROM {table} WHERE source=?1"
                ))
                .unwrap();
            let plans = stmt
                .query_map(["file"], |r| r.get::<_, String>(3))
                .unwrap()
                .collect::<rusqlite::Result<Vec<_>>>()
                .unwrap();
            assert!(
                !plans
                    .iter()
                    .any(|p| p.starts_with(&format!("SCAN {table}"))),
                "{table}: {plans:?}"
            );
        }
    }

    #[test]
    #[ignore = "manual large-directory performance measurement"]
    fn ten_thousand_files_performance() {
        let dir = tempfile::tempdir().unwrap();
        let cache = tempfile::tempdir().unwrap();
        let root = dir.path().canonicalize().unwrap();
        let mut paths = Vec::new();
        let mut directories = Vec::new();
        for folder in 0..20 {
            let name = format!("group{folder:02}");
            fs::create_dir(root.join(&name)).unwrap();
            directories.push(name);
        }
        for n in 0..10000 {
            let path = format!("group{:02}/Note{n:05}.md", n % 20);
            let next = format!("../group{:02}/Note{:05}.md", (n + 1) % 20, (n + 1) % 10000);
            let body=format!("---\ntags: [work, group{}]\n---\n# Note {n}\n中文测试 paragraph {}\n[next]({next})\n{}",n%20,if n==9999{"unique-needle-9999"}else{"ordinary"},"Content for index benchmark. ".repeat(40));
            fs::write(root.join(&path), body).unwrap();
            paths.push(path);
        }
        let start = std::time::Instant::now();
        let mut index = FileIndex::persistent(cache.path(), &root).unwrap();
        index
            .reconcile_with_directories(&root, &paths, &directories)
            .unwrap();
        let initial = start.elapsed();
        let start = std::time::Instant::now();
        assert_eq!(index.search("unique-needle-9999").unwrap().len(), 1);
        let search = start.elapsed();
        let start = std::time::Instant::now();
        assert_eq!(index.search("中文").unwrap().len(), 10000);
        let short_search = start.elapsed();
        let start = std::time::Instant::now();
        assert_eq!(
            index.complete_links("", "Note09999", None).unwrap().len(),
            1
        );
        let completion = start.elapsed();
        let start = std::time::Instant::now();
        let page = index.page(None, None, 500).unwrap();
        assert_eq!(page.files.len(), 500);
        let pagination = start.elapsed();
        let cursor = index.cursor().unwrap();
        fs::write(root.join(&paths[0]), "# changed #work").unwrap();
        let start = std::time::Instant::now();
        index.update(&root, &paths[0]).unwrap();
        let update = start.elapsed();
        assert_eq!(index.changes(&cursor, 100).unwrap().changes.len(), 1);
        let start = std::time::Instant::now();
        assert_eq!(
            index
                .relations(None, "both", None, 0, 500)
                .unwrap()
                .links
                .len(),
            500
        );
        let relations = start.elapsed();
        drop(index);
        let start = std::time::Instant::now();
        let mut index = FileIndex::persistent(cache.path(), &root).unwrap();
        index
            .reconcile_with_directories(&root, &paths, &directories)
            .unwrap();
        let reopen = start.elapsed();
        let total_bytes: u64 = paths
            .iter()
            .map(|p| fs::metadata(root.join(p)).unwrap().len())
            .sum();
        let cache_bytes: u64 = fs::read_dir(cache.path())
            .unwrap()
            .map(|e| e.unwrap().metadata().unwrap().len())
            .sum();
        #[cfg(unix)]
        let peak_rss = unsafe {
            let mut usage: libc::rusage = std::mem::zeroed();
            libc::getrusage(libc::RUSAGE_SELF, &mut usage);
            let bytes = usage.ru_maxrss as u64;
            if cfg!(target_os = "macos") {
                bytes
            } else {
                bytes * 1024
            }
        };
        #[cfg(not(unix))]
        let peak_rss = 0u64;
        eprintln!("dataset bytes={total_bytes}, cache bytes={cache_bytes}, test-process peak RSS bytes={peak_rss}");
        eprintln!("10000 files: initial={initial:?}, reopen={reopen:?}, keyword={search:?}, short_chinese={short_search:?}, completion={completion:?}, page500={pagination:?}, update1={update:?}, links500={relations:?}");
        assert!(update < std::time::Duration::from_secs(2));
        assert!(search < std::time::Duration::from_secs(2));
        assert!(completion < std::time::Duration::from_secs(2));
    }
    #[test]
    fn legacy_cache_migration_preserves_identity_and_invalid_cache_is_skipped() {
        let dir = tempfile::tempdir().unwrap();
        let cache = tempfile::tempdir().unwrap();
        let root = dir.path().canonicalize().unwrap();
        fs::write(root.join("a.md"), "# old").unwrap();
        let key = format!("{:x}", Sha256::digest(root.to_string_lossy().as_bytes()));
        let path = cache.path().join(format!("{key}.sqlite3"));
        let mut old = FileIndex::initialize(Connection::open(&path).unwrap()).unwrap();
        old.reconcile(&root, &["a.md".into()]).unwrap();
        let id = old.page(None, None, 100).unwrap().files[0].id.clone();
        drop(old);
        let mut index = FileIndex::persistent(cache.path(), &root).unwrap();
        index.reconcile(&root, &["a.md".into()]).unwrap();
        assert_eq!(index.page(None, None, 100).unwrap().files[0].id, id);
        drop(index);
        fs::write(path, "corrupt legacy").unwrap();
        let index = FileIndex::persistent(cache.path(), &root).unwrap();
        assert_eq!(index.page(None, None, 100).unwrap().files[0].id, id);
        let other = tempfile::tempdir().unwrap();
        let key = format!(
            "{:x}",
            Sha256::digest(
                other
                    .path()
                    .canonicalize()
                    .unwrap()
                    .to_string_lossy()
                    .as_bytes()
            )
        );
        fs::write(
            cache.path().join(format!("{key}.sqlite3")),
            "corrupt legacy",
        )
        .unwrap();
        assert!(FileIndex::persistent(cache.path(), other.path()).is_ok());
    }

    #[test]
    fn parent_child_share_identity_versions_and_keep_queries_scoped() {
        let dir = tempfile::tempdir().unwrap();
        let cache = tempfile::tempdir().unwrap();
        let root = dir.path().canonicalize().unwrap();
        fs::create_dir(root.join("notes")).unwrap();
        fs::write(
            root.join("notes/a.md"),
            "---\ntags: [shared]\n---\n# A\n[up](../parent.md)\n",
        )
        .unwrap();
        fs::write(root.join("parent.md"), "parent only").unwrap();
        let child = root.join("notes");
        let mut index = FileIndex::persistent(cache.path(), &child).unwrap();
        index.reconcile(&child, &["a.md".into()]).unwrap();
        let child_page = index.page(None, None, 100).unwrap();
        let id = child_page.files[0].id.clone();
        drop(index);
        let mut parent = FileIndex::persistent(cache.path(), &root).unwrap();
        parent
            .reconcile_with_directories(
                &root,
                &["notes/a.md".into(), "parent.md".into()],
                &["notes".into()],
            )
            .unwrap();
        let page = parent.page(None, None, 100).unwrap();
        assert_eq!(page.files.len(), 2);
        let a = page.files.iter().find(|f| f.id == id).unwrap();
        assert_eq!(a.path, "notes/a.md");
        assert_eq!(a.version, 1);
        assert_eq!(
            parent
                .relations(Some(&id), "outgoing", None, 0, 100)
                .unwrap()
                .links[0]
                .target_path,
            "parent.md"
        );
        let parent_id = page
            .files
            .iter()
            .find(|f| f.path == "parent.md")
            .unwrap()
            .id
            .clone();
        fs::write(root.join("notes/a.md"), "changed #shared").unwrap();
        parent.update(&root, "notes/a.md").unwrap();
        drop(parent);
        let mut child_index = FileIndex::persistent(cache.path(), &child).unwrap();
        child_index.reconcile(&child, &["a.md".into()]).unwrap();
        let page = child_index.page(None, None, 100).unwrap();
        assert_eq!(page.files.len(), 1);
        assert_eq!(page.files[0].id, id);
        assert_eq!(page.files[0].version, 2);
        assert_eq!(
            child_index
                .tagged("shared", None, None, 100)
                .unwrap()
                .files
                .len(),
            1
        );
        assert!(child_index.content(&parent_id, 1).is_err());
        assert!(child_index.search("parent only").unwrap().is_empty());
        assert!(child_index
            .changes(&page.cursor, 100)
            .unwrap()
            .changes
            .is_empty());
        assert!(child_index
            .page(Some(&child_page.cursor), None, 100)
            .is_err());
        assert!(child_index
            .complete_links("a.md", "parent", None)
            .unwrap()
            .is_empty());
        drop(child_index);
        let parent = FileIndex::persistent(cache.path(), &root).unwrap();
        assert_eq!(parent.page(None, None, 100).unwrap().files.len(), 2);
    }
    #[test]
    fn corrupt_catalog_and_fts_rebuild_without_touching_files() {
        let dir = tempfile::tempdir().unwrap();
        let cache = tempfile::tempdir().unwrap();
        let root = dir.path().canonicalize().unwrap();
        fs::write(root.join("a.md"), "original").unwrap();
        fs::write(cache.path().join("catalog.sqlite3"), b"not a database").unwrap();
        let mut index = FileIndex::persistent(cache.path(), &root).unwrap();
        index.reconcile(&root, &["a.md".into()]).unwrap();
        let cursor = index.cursor().unwrap();
        assert!(fs::read_dir(cache.path()).unwrap().any(|entry| entry
            .unwrap()
            .file_name()
            .to_string_lossy()
            .starts_with("catalog.corrupt-")));
        index
            .db
            .execute("INSERT INTO files_fts(files_fts) VALUES('delete-all')", [])
            .unwrap();
        assert!(index.recover_if_corrupt().unwrap());
        crate::index_worker::rebuild(&root, &mut index).unwrap();
        assert!(index.changes(&cursor, 100).is_err());
        assert_eq!(index.search("original").unwrap().len(), 1);
        assert_eq!(fs::read_to_string(root.join("a.md")).unwrap(), "original");
        drop(index);
        fs::remove_file(cache.path().join("catalog.sqlite3")).unwrap();
        fs::create_dir(cache.path().join("catalog.sqlite3")).unwrap();
        assert!(FileIndex::persistent(cache.path(), &root).is_err());
        assert!(cache.path().join("catalog.sqlite3").is_dir());
    }
    #[test]
    fn metadata_and_relations_are_versioned_paginated_and_utf16() {
        let dir = tempfile::tempdir().unwrap();
        let root = dir.path();
        let body="---\ntags: [work, 中文]\nnested: {draft: true}\n---\n# 标题 **粗体**\n次级标题\n--------\n😀 [目标](b.md) #inline\n[再次](b.md)\n```md\n# 代码标题 #not-tag\n```\n";
        fs::write(root.join("a.md"), body).unwrap();
        fs::write(root.join("b.md"), "target").unwrap();
        let mut index = FileIndex::initialize(Connection::open_in_memory().unwrap()).unwrap();
        index
            .reconcile(root, &["a.md".into(), "b.md".into()])
            .unwrap();
        let files = index.page(None, None, 100).unwrap();
        let file = files.files.iter().find(|f| f.path == "a.md").unwrap();
        let metadata = index.metadata(&file.id, 1).unwrap();
        assert_eq!(metadata.headings.len(), 2);
        assert_eq!(metadata.headings[0].text, "标题 粗体");
        assert_eq!(metadata.headings[1].level, 2);
        assert_eq!(metadata.properties["nested"]["draft"], true);
        assert!(metadata.tags.iter().any(|t| t.name == "inline"));
        assert!(!metadata.tags.iter().any(|t| t.name == "not-tag"));
        assert_eq!(
            index.tagged("work", None, None, 100).unwrap().files.len(),
            1
        );
        let links = index
            .relations(Some(&file.id), "outgoing", None, 0, 1)
            .unwrap();
        assert!(links.next.is_some());
        assert_eq!(
            links.links[0].from as usize,
            body[..body.find("b.md").unwrap()].encode_utf16().count()
        );
        assert_eq!(links.links[0].to - links.links[0].from, 4);
        assert_eq!(
            index
                .relations(
                    Some(&file.id),
                    "outgoing",
                    Some(&links.cursor),
                    links.next.unwrap(),
                    1
                )
                .unwrap()
                .links
                .len(),
            1
        );
        let target = files.files.iter().find(|f| f.path == "b.md").unwrap();
        assert_eq!(
            index
                .relations(Some(&target.id), "incoming", None, 0, 100)
                .unwrap()
                .links
                .len(),
            2
        );
        fs::write(root.join("a.md"), "new").unwrap();
        index.update(root, "a.md").unwrap();
        assert!(index.metadata(&file.id, 1).is_err());
        assert!(index
            .relations(None, "both", Some(&links.cursor), 0, 100)
            .is_err());
        assert!(index.metadata(&file.id, 2).unwrap().headings.is_empty());
    }
    #[test]
    fn notifier_only_observes_committed_updates() {
        let dir = tempfile::tempdir().unwrap();
        let root = dir.path();
        let notices = std::sync::Arc::new(std::sync::Mutex::new(Vec::new()));
        let mut index = FileIndex::initialize(Connection::open_in_memory().unwrap()).unwrap();
        let copy = notices.clone();
        index.set_notifier(move |cursor| copy.lock().unwrap().push(cursor));
        fs::write(root.join("a.md"), "one").unwrap();
        index.reconcile(root, &["a.md".into()]).unwrap();
        assert_eq!(notices.lock().unwrap().len(), 1);
        index.reconcile(root, &["a.md".into()]).unwrap();
        assert_eq!(notices.lock().unwrap().len(), 1);
        fs::write(root.join("a.md"), "two").unwrap();
        assert!(index
            .reconcile(root, &["a.md".into(), "missing.md".into()])
            .is_err());
        assert_eq!(notices.lock().unwrap().len(), 1);
        index.update(root, "a.md").unwrap();
        assert_eq!(notices.lock().unwrap().len(), 2);
        index.remove_path("a.md").unwrap();
        assert_eq!(notices.lock().unwrap().len(), 3);
    }

    #[test]
    fn cursor_pages_persist_and_follow_moves_and_deletions() {
        let dir = tempfile::tempdir().unwrap();
        let db_path = dir.path().join("cache.sqlite");
        let mut index = FileIndex::initialize(Connection::open(&db_path).unwrap()).unwrap();
        fs::write(dir.path().join("a.md"), "first").unwrap();
        fs::write(dir.path().join("b.md"), "second").unwrap();
        index
            .reconcile(dir.path(), &["a.md".into(), "b.md".into()])
            .unwrap();
        let first = index.page(None, None, 1).unwrap();
        let second = index
            .page(Some(&first.cursor), first.next.as_deref(), 1)
            .unwrap();
        assert_eq!(second.files.len(), 1);
        assert_ne!(first.files[0].id, second.files[0].id);
        let file = first
            .files
            .iter()
            .chain(second.files.iter())
            .find(|f| f.path == "a.md")
            .unwrap();
        assert_eq!(
            index.content(&file.id, file.version).unwrap().as_deref(),
            Some("first")
        );
        fs::rename(dir.path().join("a.md"), dir.path().join("renamed.md")).unwrap();
        index.moved("a.md", "renamed.md").unwrap();
        fs::remove_file(dir.path().join("b.md")).unwrap();
        index.reconcile(dir.path(), &["renamed.md".into()]).unwrap();
        assert!(index
            .page(Some(&first.cursor), first.next.as_deref(), 1)
            .is_err());
        let changes = index.changes(&first.cursor, 1).unwrap();
        assert!(changes.more);
        assert_eq!(changes.changes[0].id, file.id);
        let remaining = index.changes(&changes.cursor, 500).unwrap();
        assert!(remaining
            .changes
            .iter()
            .any(|c| c.kind == "remove" && c.path == "b.md"));
        let cursor = remaining.cursor;
        drop(index);
        let index = FileIndex::initialize(Connection::open(db_path).unwrap()).unwrap();
        assert!(index.changes(&cursor, 100).unwrap().changes.is_empty());
        assert_eq!(index.page(None, None, 100).unwrap().files[0].id, file.id);
        assert!(index.content(&file.id, file.version + 1).is_err());
        assert!(index.changes("other:0", 100).is_err());
    }
    #[test]
    fn expired_change_cursor_requires_new_snapshot() {
        let index = FileIndex::initialize(Connection::open_in_memory().unwrap()).unwrap();
        let cursor = index.page(None, None, 100).unwrap().cursor;
        index.db.execute_batch("WITH RECURSIVE n(x) AS (SELECT 1 UNION ALL SELECT x+1 FROM n WHERE x<10002) INSERT INTO index_changes(id,path,version,kind) SELECT 'id','a.md',x,'upsert' FROM n;").unwrap();
        assert_eq!(
            index.changes(&cursor, 100).unwrap_err(),
            "index-reset-required"
        );
        let count: i64 = index
            .db
            .query_row("SELECT count(*) FROM index_changes", [], |r| r.get(0))
            .unwrap();
        assert_eq!(count, 10000);
        let page = index.page(None, None, 100).unwrap();
        assert!(index.changes(&page.cursor, 100).unwrap().changes.is_empty());
    }
    #[test]
    fn failed_reconciliation_does_not_publish_changes() {
        let dir = tempfile::tempdir().unwrap();
        let mut index = FileIndex::initialize(Connection::open_in_memory().unwrap()).unwrap();
        let cursor = index.page(None, None, 100).unwrap().cursor;
        fs::write(dir.path().join("a.md"), "text").unwrap();
        assert!(index
            .reconcile(dir.path(), &["a.md".into(), "missing.md".into()])
            .is_err());
        assert!(index.changes(&cursor, 100).unwrap().changes.is_empty());
        assert!(index.page(None, None, 100).unwrap().files.is_empty());
    }

    use super::*;
    fn identity(index: &FileIndex, path: &str) -> (String, i64) {
        index
            .db
            .query_row("SELECT id,version FROM files WHERE path=?1", [path], |r| {
                Ok((r.get(0)?, r.get(1)?))
            })
            .unwrap()
    }
    #[test]
    fn persists_versions_and_rebuildable_relations() {
        let dir = tempfile::tempdir().unwrap();
        let db = dir.path().join("cache.sqlite3");
        fs::write(
            dir.path().join("a.md"),
            "---\ntags: [test]\n---\n# 中文😀\n[x](b.md)\n",
        )
        .unwrap();
        let paths = vec!["a.md".into()];
        let mut index = FileIndex::initialize(Connection::open(&db).unwrap()).unwrap();
        index.reconcile(dir.path(), &paths).unwrap();
        let first = identity(&index, "a.md");
        assert_eq!(index.move_sources("b.md").unwrap(), paths);
        let headings: i64 = index
            .db
            .query_row("SELECT count(*) FROM headings", [], |r| r.get(0))
            .unwrap();
        assert_eq!(headings, 1);
        let yaml: String = index
            .db
            .query_row("SELECT yaml FROM properties", [], |r| r.get(0))
            .unwrap();
        assert_eq!(yaml, "tags: [test]");
        drop(index);
        let mut index = FileIndex::initialize(Connection::open(&db).unwrap()).unwrap();
        index.reconcile(dir.path(), &paths).unwrap();
        assert_eq!(identity(&index, "a.md"), first);
        fs::write(dir.path().join("a.md"), "different").unwrap();
        index.update(dir.path(), "a.md").unwrap();
        assert_eq!(identity(&index, "a.md"), (first.0, first.1 + 1));
        assert!(index.move_sources("b.md").unwrap().is_empty());
        index.reconcile(dir.path(), &[]).unwrap();
        let count: i64 = index
            .db
            .query_row("SELECT count(*) FROM links", [], |r| r.get(0))
            .unwrap();
        assert_eq!(count, 0);
    }
    #[test]
    fn move_preserves_id_and_rebases_links_with_unchanged_bytes() {
        let dir = tempfile::tempdir().unwrap();
        fs::create_dir(dir.path().join("notes")).unwrap();
        fs::write(dir.path().join("a.md"), "[x](b.md)").unwrap();
        let mut index = FileIndex::for_root(dir.path()).unwrap();
        index.reconcile(dir.path(), &["a.md".into()]).unwrap();
        let id = identity(&index, "a.md").0;
        fs::rename(dir.path().join("a.md"), dir.path().join("notes/a.md")).unwrap();
        index.moved("a.md", "notes/a.md").unwrap();
        index.reconcile(dir.path(), &["notes/a.md".into()]).unwrap();
        assert_eq!(identity(&index, "notes/a.md").0, id);
        assert!(index.move_sources("b.md").unwrap().is_empty());
        assert_eq!(
            index.move_sources("notes/b.md").unwrap(),
            vec!["notes/a.md"]
        );
    }
    #[test]
    fn failed_refresh_rolls_back_and_prefixes_are_literal() {
        let dir = tempfile::tempdir().unwrap();
        fs::write(dir.path().join("a.md"), "[x](a%25/b.md)\n[y](other.md)").unwrap();
        let mut index = FileIndex::for_root(dir.path()).unwrap();
        index.reconcile(dir.path(), &["a.md".into()]).unwrap();
        let before = index.fingerprint().unwrap();
        assert_eq!(index.move_sources("a%").unwrap(), vec!["a.md"]);
        assert!(index.move_sources("a_").unwrap().is_empty());
        fs::write(dir.path().join("a.md"), "changed").unwrap();
        assert!(index
            .reconcile(dir.path(), &["a.md".into(), "missing.md".into()])
            .is_err());
        assert_eq!(index.fingerprint().unwrap(), before);
    }
    #[test]
    #[cfg(unix)]
    fn metadata_cache_detects_same_size_edit_with_restored_modified_time() {
        let dir = tempfile::tempdir().unwrap();
        let file = dir.path().join("a.md");
        fs::write(&file, "[x](b.md)").unwrap();
        let original_time = fs::metadata(&file).unwrap().modified().unwrap();
        let mut index = FileIndex::for_root(dir.path()).unwrap();
        let paths = vec!["a.md".into()];
        index.reconcile(dir.path(), &paths).unwrap();
        let before = identity(&index, "a.md");
        index.reconcile(dir.path(), &paths).unwrap();
        assert_eq!(identity(&index, "a.md"), before);
        fs::write(&file, "[x](c.md)").unwrap();
        fs::OpenOptions::new()
            .write(true)
            .open(&file)
            .unwrap()
            .set_times(fs::FileTimes::new().set_modified(original_time))
            .unwrap();
        index.reconcile(dir.path(), &paths).unwrap();
        assert_eq!(identity(&index, "a.md"), (before.0, before.1 + 1));
        assert!(index.move_sources("b.md").unwrap().is_empty());
        assert_eq!(index.move_sources("c.md").unwrap(), paths);
    }
    #[test]
    fn completion_queries_persisted_names_directories_and_scopes_without_disk_reads() {
        let dir = tempfile::tempdir().unwrap();
        fs::create_dir(dir.path().join("notes")).unwrap();
        fs::create_dir(dir.path().join("empty")).unwrap();
        fs::write(dir.path().join("notes/QuickStart.md"), "# title").unwrap();
        fs::write(dir.path().join("notes/a.md"), "# A").unwrap();
        let db = dir.path().join("index.sqlite");
        let paths = vec!["notes/QuickStart.md".into(), "notes/a.md".into()];
        let dirs = vec!["notes".into(), "empty".into()];
        let mut index = FileIndex::initialize(Connection::open(&db).unwrap()).unwrap();
        index
            .reconcile_with_directories(dir.path(), &paths, &dirs)
            .unwrap();
        drop(index);
        let mut index = FileIndex::initialize(Connection::open(&db).unwrap()).unwrap();
        // Results come from SQLite, even before the next disk reconciliation.
        fs::remove_file(dir.path().join("notes/QuickStart.md")).unwrap();
        assert_eq!(
            index.complete_links("notes/a.md", "qs", None).unwrap()[0].path,
            "notes/QuickStart.md"
        );
        let root = index.complete_links("notes/a.md", "", Some("")).unwrap();
        assert!(root.contains(&CompletionEntry {
            path: "empty".into(),
            directory: true
        }));
        assert!(root.iter().all(|entry| entry.directory));
        assert_eq!(
            index
                .complete_links("notes/a.md", "", Some("notes"))
                .unwrap()
                .len(),
            1
        );
        assert!(index
            .complete_links("notes/a.md", "", Some("empty"))
            .unwrap()
            .is_empty());
        index
            .reconcile_with_directories(dir.path(), &["notes/a.md".into()], &["notes".into()])
            .unwrap();
        assert!(index
            .complete_links("notes/a.md", "qs", None)
            .unwrap()
            .is_empty());
        assert!(index
            .complete_links("notes/a.md", "empty", None)
            .unwrap()
            .is_empty());
    }

    #[test]
    fn completion_parent_migration_preserves_existing_identity_and_version() {
        let db = Connection::open_in_memory().unwrap();
        db.execute_batch("CREATE TABLE files(id TEXT PRIMARY KEY,path TEXT UNIQUE NOT NULL,hash TEXT NOT NULL,version INTEGER NOT NULL,body TEXT,markdown INTEGER NOT NULL,size INTEGER NOT NULL);
            INSERT INTO files VALUES('same-id','notes/a.md','hash',7,'text',1,4); PRAGMA user_version=1;").unwrap();
        let index = FileIndex::initialize(db).unwrap();
        assert_eq!(identity(&index, "notes/a.md"), ("same-id".into(), 7));
        assert_eq!(
            index.complete_links("other.md", "", Some("notes")).unwrap()[0].path,
            "notes/a.md"
        );
        assert!(index
            .complete_links("other.md", "", Some(""))
            .unwrap()
            .is_empty());
    }

    #[test]
    fn completion_handles_unicode_initials_literal_wildcards_and_more_than_forty_directories() {
        let dir = tempfile::tempdir().unwrap();
        let mut index = FileIndex::for_root(dir.path()).unwrap();
        let dirs: Vec<String> = (0..55)
            .map(|n| format!("folder-{n:02}"))
            .chain(["归档".into(), "a%b".into(), "a_b".into()])
            .collect();
        index
            .reconcile_with_directories(dir.path(), &[], &dirs)
            .unwrap();
        assert_eq!(
            index.complete_links("a.md", "", Some("")).unwrap().len(),
            58
        );
        assert_eq!(
            index.complete_links("a.md", "归", None).unwrap()[0].path,
            "归档"
        );
        assert_eq!(
            index.complete_links("a.md", "%", None).unwrap()[0].path,
            "a%b"
        );
        assert_eq!(
            index.complete_links("a.md", "_", None).unwrap()[0].path,
            "a_b"
        );
        assert_eq!(completion_score("ltb", "link-test-b.md"), 60);
        assert_eq!(completion_score("qs", "QuickStart.md"), 60);
    }
    #[test]
    fn indexed_search_preserves_literal_unicode_substrings_and_filename_matches() {
        let dir = tempfile::tempdir().unwrap();
        fs::write(dir.path().join("Notes.TXT"), "first line\n中文关键词 EnglishCamelCASE 😀 note\nliteral: % _ * [x] \"quote\" a:b AND OR NOT\n").unwrap();
        fs::write(dir.path().join("archive-name.md"), "unrelated").unwrap();
        let mut index = FileIndex::for_root(dir.path()).unwrap();
        index
            .reconcile(dir.path(), &["Notes.TXT".into(), "archive-name.md".into()])
            .unwrap();
        for query in [
            "中",
            "中文",
            "中文关",
            "关键词",
            "glishcam",
            "ENGLISH",
            "😀",
            "%",
            "_",
            "*",
            "[x]",
            "\"quote\"",
            "a:b",
            "AND OR NOT",
        ] {
            let result = index.search(query).unwrap();
            assert_eq!(result.len(), 1, "{query}");
            assert_eq!(result[0].path, "Notes.TXT", "{query}");
            assert!(result[0].snippet.is_some(), "{query}");
        }
        assert_eq!(
            index.search("ARCHIVE-NAME").unwrap(),
            vec![SearchEntry {
                path: "archive-name.md".into(),
                snippet: None
            }]
        );
        assert!(index.search("absent").unwrap().is_empty());
        assert!(index.search("  ").unwrap().is_empty());
        assert!(index.search(&"x".repeat(201)).is_err());
        // Keep old per-line matching behavior for queries containing a newline.
        assert!(index.search("line\n中文").unwrap().is_empty());
    }

    #[test]
    fn search_uses_persisted_snapshot_then_updates_on_edit_move_and_delete() {
        let dir = tempfile::tempdir().unwrap();
        let db = dir.path().join("cache.sqlite");
        fs::write(dir.path().join("old-name.md"), "original-keyword").unwrap();
        let mut index = FileIndex::initialize(Connection::open(&db).unwrap()).unwrap();
        index
            .reconcile(dir.path(), &["old-name.md".into()])
            .unwrap();
        let before = identity(&index, "old-name.md");
        drop(index);
        let mut index = FileIndex::initialize(Connection::open(&db).unwrap()).unwrap();
        fs::remove_file(dir.path().join("old-name.md")).unwrap();
        assert_eq!(index.search("original").unwrap().len(), 1);
        fs::write(dir.path().join("old-name.md"), "replacement-keyword").unwrap();
        index.update(dir.path(), "old-name.md").unwrap();
        assert!(index.search("original").unwrap().is_empty());
        assert_eq!(index.search("replacement").unwrap().len(), 1);
        fs::rename(
            dir.path().join("old-name.md"),
            dir.path().join("new-name.md"),
        )
        .unwrap();
        index.moved("old-name.md", "new-name.md").unwrap();
        index
            .reconcile(dir.path(), &["new-name.md".into()])
            .unwrap();
        assert!(index.search("old-name").unwrap().is_empty());
        assert_eq!(index.search("new-name").unwrap()[0].path, "new-name.md");
        assert_eq!(identity(&index, "new-name.md"), (before.0, before.1 + 1));
        index.reconcile(dir.path(), &[]).unwrap();
        assert!(index.search("replacement").unwrap().is_empty());
    }

    #[test]
    fn search_migration_backfills_text_without_changing_file_identity_or_version() {
        let db = Connection::open_in_memory().unwrap();
        db.execute_batch("CREATE TABLE files(id TEXT PRIMARY KEY,path TEXT UNIQUE NOT NULL,hash TEXT NOT NULL,version INTEGER NOT NULL,body TEXT,markdown INTEGER NOT NULL,size INTEGER NOT NULL,parent TEXT NOT NULL);
            INSERT INTO files VALUES('stable','notes/HELLO.md','hash',9,'中文内容 MixedCASE',1,30,'notes'); PRAGMA user_version=2;").unwrap();
        let index = FileIndex::initialize(db).unwrap();
        assert_eq!(identity(&index, "notes/HELLO.md"), ("stable".into(), 9));
        assert_eq!(index.search("中文内容").unwrap().len(), 1);
        assert_eq!(index.search("mixedcase").unwrap().len(), 1);
        assert_eq!(index.search("hello").unwrap()[0].path, "notes/HELLO.md");
        let version: i64 = index
            .db
            .query_row("PRAGMA user_version", [], |row| row.get(0))
            .unwrap();
        assert_eq!(version, 4);
    }
    #[test]
    fn keyword_search_excludes_binary_body_but_keeps_attachment_filename() {
        let dir = tempfile::tempdir().unwrap();
        fs::write(
            dir.path().join("attachment.pdf"),
            "%PDF-1.7\nsecret-binary-keyword",
        )
        .unwrap();
        let mut index = FileIndex::for_root(dir.path()).unwrap();
        index
            .reconcile(dir.path(), &["attachment.pdf".into()])
            .unwrap();
        assert!(index.search("secret-binary-keyword").unwrap().is_empty());
        assert_eq!(
            index.search("attachment").unwrap(),
            vec![SearchEntry {
                path: "attachment.pdf".into(),
                snippet: None
            }]
        );
    }
}

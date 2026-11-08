use std::{io::Read, time::Duration};
fn allowed_url(url: &reqwest::Url, redirected: bool) -> bool {
    url.scheme() == "https" && url.username().is_empty() && url.password().is_none() && url.port().is_none()
        && matches!(url.host_str(), Some("github.com" | "raw.githubusercontent.com"))
        || (redirected && url.scheme() == "https" && url.username().is_empty() && url.password().is_none() && url.port().is_none()
            && matches!(url.host_str(), Some("release-assets.githubusercontent.com" | "objects.githubusercontent.com")))
}
#[tauri::command]
pub async fn plugin_fetch_text(url: String, optional: bool) -> Result<Option<String>, String> {
    let parsed = reqwest::Url::parse(&url).map_err(|error| error.to_string())?;
    if !allowed_url(&parsed, false) { return Err("插件来源必须是 GitHub 公开 HTTPS 地址".into()); }
    tauri::async_runtime::spawn_blocking(move || {
        let client = reqwest::blocking::Client::builder().timeout(Duration::from_secs(30))
            .redirect(reqwest::redirect::Policy::custom(|attempt| {
                if attempt.previous().len() > 5 || !allowed_url(attempt.url(), true) { attempt.error("插件下载重定向无效") } else { attempt.follow() }
            })).build().map_err(|error| error.to_string())?;
        let response = client.get(parsed).header("User-Agent", "Markart-Plugins/1").send().map_err(|error| error.to_string())?;
        if optional && response.status() == reqwest::StatusCode::NOT_FOUND { return Ok(None); }
        let response = response.error_for_status().map_err(|error| error.to_string())?;
        let mut bytes = Vec::new();
        response.take(5 * 1024 * 1024 + 1).read_to_end(&mut bytes).map_err(|error| error.to_string())?;
        if bytes.len() > 5 * 1024 * 1024 { return Err("插件文件超过 5 MB".into()); }
        String::from_utf8(bytes).map(Some).map_err(|error| error.to_string())
    }).await.map_err(|error| error.to_string())?
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn restricts_download_hosts_and_redirects() {
        for url in ["http://github.com/a/b", "https://github.com.evil.test/a", "https://user@github.com/a", "https://127.0.0.1/a"] { assert!(!allowed_url(&reqwest::Url::parse(url).unwrap(), false)); }
        assert!(allowed_url(&reqwest::Url::parse("https://github.com/a/b").unwrap(), false));
        let asset = reqwest::Url::parse("https://release-assets.githubusercontent.com/test").unwrap();
        assert!(!allowed_url(&asset, false)); assert!(allowed_url(&asset, true));
    }
    #[test]
    fn scoped_requests_allow_https_anywhere_but_plain_http_only_on_private_hosts() {
        let permitted = |url: &str| { let u = reqwest::Url::parse(url).unwrap(); matches!(u.scheme(), "http" | "https") && u.username().is_empty() && u.password().is_none() && (u.scheme() == "https" || local_host(&u)) };
        for url in ["https://api.example.com/v1", "https://10.0.0.2:8443", "http://127.0.0.1:11434", "http://localhost:8080", "http://192.168.1.5:11434", "http://172.16.0.9/api", "http://[::1]:11434"] { assert!(permitted(url), "{url}"); }
        for url in ["http://api.example.com/v1", "http://172.32.0.1/api", "ftp://example.com", "https://user@example.com"] { assert!(!permitted(url), "{url}"); }
    }
}

fn field<'a>(value: &'a serde_json::Value, key: &str) -> Result<&'a str, String> {
    value.get(key).and_then(|value| value.as_str()).ok_or_else(|| format!("缺少参数 {key}"))
}
// Trusted plugin bridge. Plugins share the app's privileges; this is not a sandbox.
#[tauri::command]
pub async fn plugin_native(operation: String, payload: serde_json::Value) -> Result<serde_json::Value, String> {
    tauri::async_runtime::spawn_blocking(move || native_operation(&operation, &payload)).await.map_err(|error| error.to_string())?
}
fn native_operation(operation: &str, value: &serde_json::Value) -> Result<serde_json::Value, String> {
    use serde_json::json;
    use std::{fs, path::Path};
    let result = match operation {
        "readText" => json!(fs::read_to_string(field(value, "path")?).map_err(|error| error.to_string())?),
        "readBytes" => json!(fs::read(field(value, "path")?).map_err(|error| error.to_string())?),
        "writeText" => { fs::write(field(value, "path")?, field(value, "text")?).map_err(|error| error.to_string())?; json!(null) },
        "writeBytes" => { let bytes: Vec<u8> = serde_json::from_value(value.get("bytes").cloned().ok_or("缺少 bytes")?).map_err(|error| error.to_string())?; fs::write(field(value, "path")?, bytes).map_err(|error| error.to_string())?; json!(null) },
        "mkdir" => { fs::create_dir_all(field(value, "path")?).map_err(|error| error.to_string())?; json!(null) },
        "rename" => { let to = Path::new(field(value, "to")?); if to.exists() { return Err("目标已存在".into()); } fs::rename(field(value, "from")?, to).map_err(|error| error.to_string())?; json!(null) },
        "remove" => { let path = Path::new(field(value, "path")?); let meta = fs::symlink_metadata(path).map_err(|error| error.to_string())?; if meta.is_dir() { if value["recursive"].as_bool().unwrap_or(false) { fs::remove_dir_all(path) } else { fs::remove_dir(path) } } else { fs::remove_file(path) }.map_err(|error| error.to_string())?; json!(null) },
        "list" => {
            let mut entries = Vec::new();
            for entry in fs::read_dir(field(value, "path")?).map_err(|error| error.to_string())? { let entry = entry.map_err(|error| error.to_string())?; entries.push(json!({ "name": entry.file_name().to_string_lossy(), "path": entry.path().to_string_lossy(), "directory": entry.file_type().map_err(|error| error.to_string())?.is_dir() })); }
            json!(entries)
        },
        "request" => {
            let url = reqwest::Url::parse(field(value, "url")?).map_err(|error| error.to_string())?;
            if !matches!(url.scheme(), "http" | "https") { return Err("仅支持 HTTP(S) 请求".into()); }
            let client = reqwest::blocking::Client::builder().timeout(Duration::from_secs(60)).build().map_err(|error| error.to_string())?;
            let method = reqwest::Method::from_bytes(value["method"].as_str().unwrap_or("GET").as_bytes()).map_err(|error| error.to_string())?;
            let mut request = client.request(method, url);
            if let Some(headers) = value["headers"].as_object() { for (key, val) in headers { request = request.header(key, val.as_str().ok_or("请求头值必须是字符串")?); } }
            if let Some(body) = value["body"].as_str() { request = request.body(body.to_owned()); }
            let response = request.send().map_err(|error| error.to_string())?;
            let status = response.status().as_u16();
            let headers: std::collections::BTreeMap<_, _> = response.headers().iter().map(|(key, val)| (key.as_str().to_owned(), val.to_str().unwrap_or("").to_owned())).collect();
            let mut bytes = Vec::new(); response.take(16 * 1024 * 1024 + 1).read_to_end(&mut bytes).map_err(|error| error.to_string())?;
            if bytes.len() > 16 * 1024 * 1024 { return Err("响应超过 16 MB".into()); }
            json!({ "status": status, "headers": headers, "body": String::from_utf8_lossy(&bytes) })
        },
        _ => return Err("未知插件原生操作".into())
    };
    Ok(result)
}

#[cfg(test)]
mod native_tests {
    use super::*;
    use serde_json::json;
    #[test]
    fn plugin_files_roundtrip_and_delete() {
        let temp = tempfile::tempdir().unwrap();
        let dir = temp.path().join("plugin"); let path = dir.join("test.md");
        native_operation("mkdir", &json!({"path":dir})).unwrap();
        native_operation("writeText", &json!({"path":path,"text":"hello"})).unwrap();
        assert_eq!(native_operation("readText", &json!({"path":path})).unwrap(), "hello");
        assert_eq!(native_operation("list", &json!({"path":dir})).unwrap().as_array().unwrap().len(), 1);
        native_operation("remove", &json!({"path":path})).unwrap(); assert!(!path.exists());
    }
    #[test]
    fn plugin_network_returns_status_headers_and_body() {
        use std::{net::TcpListener, io::{Read, Write}, thread};
        let server = TcpListener::bind("127.0.0.1:0").unwrap();
        let address = server.local_addr().unwrap();
        let task = thread::spawn(move || {
            let (mut socket, _) = server.accept().unwrap();
            let mut buffer = [0; 2048]; let _ = socket.read(&mut buffer).unwrap();
            socket.write_all(b"HTTP/1.1 400 Bad Request\r\nContent-Length: 5\r\nX-Plugin-Test: yes\r\nConnection: close\r\n\r\nhello").unwrap();
        });
        let response = native_operation("request", &json!({"url":format!("http://{address}/test")})).unwrap();
        assert_eq!(response["status"], 400); assert_eq!(response["body"], "hello"); assert_eq!(response["headers"]["x-plugin-test"], "yes");
        task.join().unwrap();
    }
    #[test]
    fn plugin_process_execution_is_not_available() {
        assert!(native_operation("run", &json!({"program":"ignored"})).is_err());
    }

}

fn read_local_plugin(root: &std::path::Path) -> Result<serde_json::Value, String> {
    let read = |name: &str, optional: bool| -> Result<Option<String>, String> {
        let file = match std::fs::File::open(root.join(name)) {
            Ok(file) => file,
            Err(error) if optional && error.kind() == std::io::ErrorKind::NotFound => return Ok(None),
            Err(error) => return Err(format!("无法读取 {name}：{error}")),
        };
        if !file.metadata().map_err(|error| error.to_string())?.is_file() { return Err(format!("{name} 必须是文件")); }
        let mut bytes = Vec::new();
        file.take(5 * 1024 * 1024 + 1).read_to_end(&mut bytes).map_err(|error| error.to_string())?;
        if bytes.len() > 5 * 1024 * 1024 { return Err(format!("{name} 超过 5 MB")); }
        String::from_utf8(bytes).map(Some).map_err(|_| format!("{name} 需要使用 UTF-8 编码"))
    };
    fn collect(base: &std::path::Path, dir: &std::path::Path, resources: &mut std::collections::BTreeMap<String, Vec<u8>>, total: &mut usize) -> Result<(), String> {
        if !dir.exists() { return Ok(()); }
        if std::fs::symlink_metadata(dir).map_err(|e| e.to_string())?.file_type().is_symlink() { return Err("界面资源不能使用符号链接".into()); }
        for entry in std::fs::read_dir(dir).map_err(|e| e.to_string())? {
            let entry = entry.map_err(|e| e.to_string())?;
            let kind = entry.file_type().map_err(|e| e.to_string())?;
            if kind.is_symlink() { return Err("界面资源不能使用符号链接".into()); }
            if kind.is_dir() { collect(base, &entry.path(), resources, total)?; }
            else if kind.is_file() {
                let mut data = Vec::new();
                std::fs::File::open(entry.path()).map_err(|e| e.to_string())?.take(20 * 1024 * 1024 + 1).read_to_end(&mut data).map_err(|e| e.to_string())?;
                *total += data.len();
                if *total > 20 * 1024 * 1024 || resources.len() >= 1000 { return Err("界面资源超过 20 MB 或 1000 个文件".into()); }
                let name = entry.path().strip_prefix(base).map_err(|e| e.to_string())?.to_string_lossy().replace('\\', "/");
                resources.insert(name, data);
            }
        }
        Ok(())
    }
    let mut resources = std::collections::BTreeMap::new();
    collect(root, &root.join("views"), &mut resources, &mut 0)?;
    Ok(serde_json::json!({ "manifest": read("manifest.json", false)?, "main": read("main.js", false)?, "styles": read("styles.css", true)?, "resources": resources }))
}
#[tauri::command]
pub async fn plugin_import_local(app: tauri::AppHandle) -> Result<Option<serde_json::Value>, String> {
    use tauri_plugin_dialog::DialogExt;
    tauri::async_runtime::spawn_blocking(move || {
        let Some(folder) = app.dialog().file().blocking_pick_folder() else { return Ok(None); };
        let root = folder.into_path().map_err(|error| error.to_string())?;
        read_local_plugin(&root).map(Some)
    }).await.map_err(|error| error.to_string())?
}

#[cfg(test)]
mod local_import_tests {
    use super::*;
    #[test]
    fn local_folder_requires_entry_files_and_reads_optional_styles() {
        let folder = tempfile::tempdir().unwrap();
        assert!(read_local_plugin(folder.path()).is_err());
        std::fs::write(folder.path().join("manifest.json"), "{}").unwrap();
        std::fs::write(folder.path().join("main.js"), "export function activate() {}").unwrap();
        let files = read_local_plugin(folder.path()).unwrap();
        assert!(files["styles"].is_null());
        std::fs::write(folder.path().join("styles.css"), "body {}").unwrap();
        assert_eq!(read_local_plugin(folder.path()).unwrap()["styles"], "body {}");
        std::fs::write(folder.path().join("main.js"), [0xff]).unwrap();
        assert!(read_local_plugin(folder.path()).is_err());
    }
}

fn local_host(url: &reqwest::Url) -> bool {
    let Some(host) = url.host_str() else { return false };
    let host = host.trim_start_matches('[').trim_end_matches(']');
    if host.eq_ignore_ascii_case("localhost") || host == "::1" { return true; }
    let octets: Vec<u32> = host.split('.').filter_map(|part| part.parse().ok()).collect();
    match octets.as_slice() {
        [127, ..] | [10, ..] | [192, 168, ..] => true,
        [172, second, ..] => (16..=31).contains(second),
        _ => false,
    }
}
#[tauri::command]
pub async fn plugin_request_scoped(url: String, options: serde_json::Value) -> Result<serde_json::Value, String> {
    let parsed=reqwest::Url::parse(&url).map_err(|e|e.to_string())?;
    let permitted=|url:&reqwest::Url|matches!(url.scheme(),"http"|"https")&&url.username().is_empty()&&url.password().is_none()&&(url.scheme()=="https"||local_host(url));
    if !permitted(&parsed){return Err("请求地址未授权".into());}
    tauri::async_runtime::spawn_blocking(move || {
        let client=reqwest::blocking::Client::builder().timeout(Duration::from_secs(30)).redirect(reqwest::redirect::Policy::custom(move |attempt| {
            if attempt.previous().len()>=5||!permitted(attempt.url()){attempt.error("重定向地址未授权")}else{attempt.follow()}
        })).build().map_err(|e|e.to_string())?;
        let method=reqwest::Method::from_bytes(options["method"].as_str().unwrap_or("GET").as_bytes()).map_err(|e|e.to_string())?;
        let mut request=client.request(method,parsed);
        if let Some(headers)=options["headers"].as_object(){for(key,value)in headers{request=request.header(key,value.as_str().ok_or("请求头需要文本值")?);}}
        if let Some(body)=options["body"].as_str(){if body.len()>2*1024*1024{return Err("请求内容超过 2 MB".into());}request=request.body(body.to_owned());}
        let response=request.send().map_err(|e|e.to_string())?;
        let status=response.status().as_u16();let headers:std::collections::BTreeMap<_,_>=response.headers().iter().filter_map(|(key,value)|value.to_str().ok().map(|value|(key.to_string(),value.to_string()))).collect();
        let mut bytes=Vec::new();response.take(2*1024*1024+1).read_to_end(&mut bytes).map_err(|e|e.to_string())?;
        if bytes.len()>2*1024*1024{return Err("响应超过 2 MB".into());}
        Ok(serde_json::json!({"status":status,"headers":headers,"body":String::from_utf8_lossy(&bytes)}))
    }).await.map_err(|e|e.to_string())?
}

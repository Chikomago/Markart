fn entry(service: &str, plugin_id: &str, key: &str) -> Result<keyring::Entry, String> {
    if plugin_id.is_empty() || plugin_id.len()>160 || !plugin_id.bytes().all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c==b'.' || c==b'-') || key.is_empty() || key.len()>120 || !key.bytes().all(|c|c.is_ascii_alphanumeric()||b"._-".contains(&c)) { return Err("密钥标识无效".into()); }
    keyring::Entry::new(service, &format!("{plugin_id}:{key}")).map_err(|_|"无法访问系统凭据存储".into())
}
#[tauri::command]
pub async fn plugin_secret(app: tauri::AppHandle, plugin_id: String, key: String, operation: String, value: Option<String>) -> Result<Option<String>, String> {
    if !cfg!(any(target_os="macos",target_os="windows")) { return Err("当前系统尚未接入安全凭据存储".into()); }
    let service=format!("{}.plugin-secrets",app.config().identifier);
    tauri::async_runtime::spawn_blocking(move || {
        let credential=entry(&service,&plugin_id,&key)?;
        match operation.as_str() {
            "get" => match credential.get_password() { Ok(value)=>Ok(Some(value)),Err(keyring::Error::NoEntry)=>Ok(None),Err(_)=>Err("无法读取系统凭据，请检查钥匙串或凭据管理器访问权限".into()) },
            "set" => { let value=value.ok_or("缺少密钥内容")?;if value.len()>4096{return Err("密钥超过 4096 字节".into())}credential.set_password(&value).map_err(|_|"无法保存系统凭据".to_string())?;Ok(None) },
            "remove" => match credential.delete_credential(){Ok(())|Err(keyring::Error::NoEntry)=>Ok(None),Err(_)=>Err("无法删除系统凭据".into())},
            _=>Err("密钥操作无效".into())
        }
    }).await.map_err(|_|"系统凭据任务失败".to_string())?
}

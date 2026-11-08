use std::collections::BTreeSet;
use std::process::Command;

#[tauri::command]
pub async fn list_system_fonts() -> Result<Vec<String>, String> {
    tauri::async_runtime::spawn_blocking(|| {
        #[cfg(target_os = "macos")]
        {
            let result = Command::new("osascript").args(["-l", "JavaScript", "-e", "ObjC.import('AppKit'); $.NSFontManager.sharedFontManager.availableFontFamilies.js.map(x => ObjC.unwrap(x)).join('\\n')"]).output().map_err(|error| error.to_string())?;
            if !result.status.success() { return Err("无法读取本机字体".into()); }
            let names = String::from_utf8_lossy(&result.stdout).lines().map(str::trim).filter(|name| !name.is_empty() && !name.starts_with('.')).map(str::to_owned).collect::<BTreeSet<_>>();
            return Ok(names.into_iter().collect());
        }
        #[cfg(target_os = "windows")]
        {
            let result = Command::new("powershell").args(["-NoProfile", "-Command", "(New-Object Drawing.Text.InstalledFontCollection).Families.Name"]).output().map_err(|error| error.to_string())?;
            if !result.status.success() { return Err("无法读取本机字体".into()); }
            return Ok(String::from_utf8_lossy(&result.stdout).lines().map(str::trim).filter(|line| !line.is_empty()).map(str::to_owned).collect());
        }
        #[cfg(all(not(target_os = "macos"), not(target_os = "windows")))]
        {
            let result = Command::new("fc-list").args([":", "family"]).output().map_err(|error| error.to_string())?;
            if !result.status.success() { return Err("无法读取本机字体".into()); }
            let names = String::from_utf8_lossy(&result.stdout).lines().flat_map(|line| line.split(',')).map(str::trim).filter(|line| !line.is_empty()).map(str::to_owned).collect::<BTreeSet<_>>();
            return Ok(names.into_iter().collect());
        }
    }).await.map_err(|error| error.to_string())?
}

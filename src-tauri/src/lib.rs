#[cfg(target_os = "macos")]
mod macos_properties;
#[cfg(target_os = "windows")]
mod windows_properties;
#[cfg(target_os = "macos")]
mod about;
mod themes;
mod windows;
mod quick_capture;
mod native_alert;
mod default_editor;
mod sync_policy;
mod workspace;
mod file_index;
mod index_extract;
mod index_worker;
mod git_history;
mod github_sync;
mod export;
mod link_paths;
mod document_import;
mod docx_import;
mod pdf_import;
mod system_fonts;
mod webdav;
mod lan_share;
mod plugins;
mod plugin_files;
mod plugin_secrets;
mod plugin_focus;
mod navigation_policy;

use tauri::{Emitter, Manager};
#[cfg(not(any(target_os = "macos", target_os = "windows")))]
use tauri::menu::AboutMetadata;
use tauri::menu::{CheckMenuItem, Menu, MenuItem, PredefinedMenuItem, Submenu};

#[derive(Default)]
struct UiLanguage {
    messages: std::collections::HashMap<String, String>,
    originals: std::collections::HashMap<String, String>,
}

#[tauri::command]
fn set_ui_language(app: tauri::AppHandle, state: tauri::State<'_, std::sync::Mutex<UiLanguage>>, messages: std::collections::HashMap<String, String>) -> Result<(), String> {
    fn update(items: Vec<tauri::menu::MenuItemKind<tauri::Wry>>, state: &mut UiLanguage) -> Result<(), String> {
        for item in items {
            let id = item.id().as_ref().to_string();
            // Recent file and folder names belong to the user, not the interface.
            if id.starts_with("recent-file:") || id.starts_with("recent-folder:") { continue; }
            let result = if let Some(menu) = item.as_submenu() {
                let original = state.originals.entry(id).or_insert(menu.text().map_err(|e| e.to_string())?).clone();
                menu.set_text(state.messages.get(&original).unwrap_or(&original)).map_err(|e| e.to_string())?;
                update(menu.items().map_err(|e| e.to_string())?, state)?;
                Ok(())
            } else if let Some(menu) = item.as_menuitem() {
                let original = state.originals.entry(id).or_insert(menu.text().map_err(|e| e.to_string())?).clone();
                menu.set_text(state.messages.get(&original).unwrap_or(&original))
            } else if let Some(menu) = item.as_check_menuitem() {
                let original = state.originals.entry(id).or_insert(menu.text().map_err(|e| e.to_string())?).clone();
                menu.set_text(state.messages.get(&original).unwrap_or(&original))
            } else if let Some(menu) = item.as_predefined_menuitem() {
                let original = state.originals.entry(id).or_insert(menu.text().map_err(|e| e.to_string())?).clone();
                if original.is_empty() { continue; }
                menu.set_text(state.messages.get(&original).unwrap_or(&original))
            } else { Ok(()) };
            result.map_err(|e| e.to_string())?;
        }
        Ok(())
    }
    let mut state = state.lock().map_err(|e| e.to_string())?;
    state.messages = messages;
    let menu = app.menu().ok_or("Menu is not initialized")?;
    update(menu.items().map_err(|e| e.to_string())?, &mut state)
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct MenuShortcut { menu_id: String, accelerator: Option<String> }

#[tauri::command]
fn set_menu_shortcuts(app: tauri::AppHandle, shortcuts: Vec<MenuShortcut>) -> Result<(), String> {
    let menu = app.menu().ok_or("菜单尚未初始化")?;
    let top = menu.items().map_err(|error| error.to_string())?;
    for shortcut in shortcuts {
        let item = top.iter().filter_map(|entry| entry.as_submenu()).find_map(|submenu| {
            submenu.get(&shortcut.menu_id).or_else(|| {
                submenu.items().ok()?.iter().filter_map(|entry| entry.as_submenu()).find_map(|nested| nested.get(&shortcut.menu_id))
            })
        });
        if let Some(item) = item {
            if let Some(plain) = item.as_menuitem() { plain.set_accelerator(shortcut.accelerator.as_deref()).map_err(|error| error.to_string())?; }
            if let Some(check) = item.as_check_menuitem() { check.set_accelerator(shortcut.accelerator.as_deref()).map_err(|error| error.to_string())?; }
        }
    }
    Ok(())
}

#[tauri::command]
fn set_menu_checks(app: tauri::AppHandle, checked_ids: Vec<String>, outline_enabled: bool) -> Result<(), String> {
    let menu = app.menu().ok_or("菜单尚未初始化")?;
    for top in menu.items().map_err(|error| error.to_string())? {
        if let Some(submenu) = top.as_submenu() {
            for item in submenu.items().map_err(|error| error.to_string())? {
                if let Some(check) = item.as_check_menuitem() {
                    if check.id().0 == "toggle-outline" { check.set_enabled(outline_enabled).map_err(|error| error.to_string())?; }
                    let wanted = checked_ids.iter().any(|id| id == &check.id().0);
                    if check.is_checked().map_err(|error| error.to_string())? != wanted { check.set_checked(wanted).map_err(|error| error.to_string())?; }
                } else if let Some(nested) = item.as_submenu() {
                    for child in nested.items().map_err(|error| error.to_string())? {
                        if let Some(check) = child.as_check_menuitem() {
                            let wanted = checked_ids.iter().any(|id| id == &check.id().0);
                            if check.is_checked().map_err(|error| error.to_string())? != wanted { check.set_checked(wanted).map_err(|error| error.to_string())?; }
                        }
                    }
                }
            }
        }
    }
    Ok(())
}

#[tauri::command]
fn sync_recent_menus(app: tauri::AppHandle, folders: Vec<String>, files: Vec<String>) -> Result<(), String> {
    let menu = app.menu().ok_or("菜单尚未初始化")?;
    let file_menu = menu.items().map_err(|error| error.to_string())?.into_iter()
        .filter_map(|item| item.as_submenu().cloned()).find(|item| item.id().as_ref() == "file-menu")
        .ok_or("文件菜单不存在")?;
    let language = app.state::<std::sync::Mutex<UiLanguage>>();
    let mut language = language.lock().map_err(|e| e.to_string())?;
    for id in ["recent-files-menu-empty", "recent-folders-menu-empty"] { language.originals.insert(id.into(), "没有最近打开的记录".into()); }
    for id in ["recent-files-clear", "recent-folders-clear"] { language.originals.insert(id.into(), "清空最近打开".into()); }
    let label = |source: &str| language.messages.get(source).cloned().unwrap_or_else(|| source.to_string());
    for (id, paths, prefix) in [("recent-folders-menu", folders, "recent-folder:"), ("recent-files-menu", files, "recent-file:")] {
        let submenu = file_menu.get(id).and_then(|item| item.as_submenu().cloned()).ok_or("最近打开菜单不存在")?;
        while !submenu.items().map_err(|error| error.to_string())?.is_empty() {
            submenu.remove_at(0).map_err(|error| error.to_string())?;
        }
        let has_records = !paths.is_empty();
        if paths.is_empty() {
            submenu.append(&MenuItem::with_id(&app, format!("{id}-empty"), label("没有最近打开的记录"), false, None::<&str>).map_err(|error| error.to_string())?).map_err(|error| error.to_string())?;
        } else {
            for path in paths.into_iter().take(10) {
                submenu.append(&MenuItem::with_id(&app, format!("{prefix}{path}"), &path, true, None::<&str>).map_err(|error| error.to_string())?).map_err(|error| error.to_string())?;
            }
        }
        submenu.append(&PredefinedMenuItem::separator(&app).map_err(|error| error.to_string())?).map_err(|error| error.to_string())?;
        let clear_id = if id == "recent-files-menu" { "recent-files-clear" } else { "recent-folders-clear" };
        submenu.append(&MenuItem::with_id(&app, clear_id, label("清空最近打开"), has_records, None::<&str>).map_err(|error| error.to_string())?).map_err(|error| error.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn open_external_url(url: String) -> Result<(), String> {
    let parsed = reqwest::Url::parse(&url).map_err(|error| error.to_string())?;
    if !matches!(parsed.scheme(), "http" | "https") || parsed.host().is_none() {
        return Err("只能打开 http:// 或 https:// 开头的链接".into());
    }
    #[cfg(target_os = "macos")]
    let mut command = std::process::Command::new("open");
    #[cfg(target_os = "windows")]
    let mut command = {
        let mut command = std::process::Command::new("rundll32.exe");
        command.arg("url.dll,FileProtocolHandler");
        command
    };
    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    let mut command = std::process::Command::new("xdg-open");
    command.arg(parsed.as_str()).spawn().map_err(|error| error.to_string())?;
    Ok(())
}

#[tauri::command]
fn restart_after_update(app: tauri::AppHandle) { app.restart() }

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default();
    #[cfg(desktop)]
    let builder = builder.plugin(tauri_plugin_single_instance::init(|app, arguments, cwd| {
        let paths = arguments.into_iter().skip(1).map(|argument| {
            let path = std::path::PathBuf::from(argument);
            if path.is_absolute() { path } else { std::path::Path::new(&cwd).join(path) }
        }).filter(|path| path.is_file()).map(|path| path.to_string_lossy().into_owned()).collect();
        default_editor::queue_system_files(app, paths);
    }));
    builder
        .menu(|app| {
            #[cfg(not(target_os = "windows"))]
            let sep1 = PredefinedMenuItem::separator(app)?;
            #[cfg(not(target_os = "windows"))]
            let sep2 = PredefinedMenuItem::separator(app)?;
            let sep3 = PredefinedMenuItem::separator(app)?;
            #[cfg(target_os = "macos")]
            let about_item = MenuItem::with_id(app, "app-about", "关于", true, None::<&str>)?;
            #[cfg(not(any(target_os = "macos", target_os = "windows")))]
            let about_item = PredefinedMenuItem::about(app, Some("关于"), Some(AboutMetadata {
                name: Some("Markart".into()), version: Some(app.package_info().version.to_string()),
                icon: Some(tauri::include_image!("icons/128x128.png")),
                authors: Some(vec![env!("CARGO_PKG_AUTHORS").into()]), license: Some(env!("CARGO_PKG_LICENSE").into()),
                ..Default::default()
            }))?;
            #[cfg(not(target_os = "windows"))]
            let app_menu = Submenu::with_items(app, "Markart", true, &[&about_item, &sep1, &PredefinedMenuItem::hide(app, Some("隐藏 Markart"))?, &PredefinedMenuItem::hide_others(app, Some("隐藏其他"))?, &PredefinedMenuItem::show_all(app, Some("全部显示"))?, &sep2, &PredefinedMenuItem::quit(app, Some("退出 Markart"))?])?;
            let file_items = [
                MenuItem::with_id(app, "file-new", "新建文件", true, Some("CmdOrCtrl+N"))?,
                MenuItem::with_id(app, "file-open", "打开文件…", true, Some("CmdOrCtrl+Shift+O"))?,
                MenuItem::with_id(app, "folder-open", "打开文件夹…", true, Some("CmdOrCtrl+O"))?,
                MenuItem::with_id(app, "file-close", "关闭当前文件", true, Some("CmdOrCtrl+W"))?,
                MenuItem::with_id(app, "folder-close", "关闭文件夹", true, None::<&str>)?,
                MenuItem::with_id(app, "file-save", "保存", true, Some("CmdOrCtrl+S"))?,
                MenuItem::with_id(app, "file-save-as", "另存为…", true, Some("CmdOrCtrl+Shift+S"))?,
            ];
            let recent_folders = Submenu::with_id_and_items(app, "recent-folders-menu", "打开最近文件夹", true, &[])?;
            let recent_files = Submenu::with_id_and_items(app, "recent-files-menu", "打开最近文件", true, &[])?;
            let export_menu = Submenu::with_id_and_items(app, "export-menu", "导出", true, &[
                &MenuItem::with_id(app, "export-html", "HTML", true, None::<&str>)?,
                &MenuItem::with_id(app, "export-txt", "纯文本", true, None::<&str>)?,
                &MenuItem::with_id(app, "export-pdf", "PDF", true, None::<&str>)?,
                &MenuItem::with_id(app, "export-docx", "Word", true, None::<&str>)?,
                &MenuItem::with_id(app, "export-png", "PNG 长图", true, None::<&str>)?,
            ])?;
            let file_menu = Submenu::with_id_and_items(app, "file-menu", "文件", true, &[&file_items[0], &file_items[1], &file_items[2], &recent_folders, &recent_files, &file_items[3], &file_items[4], &file_items[5], &export_menu, &MenuItem::with_id(app, "file-share", "分享到局域网…", true, None::<&str>)?])?;
            let edit_menu = Submenu::with_items(app, "编辑", true, &[
                &MenuItem::with_id(app, "edit-undo", "撤销", true, Some("CmdOrCtrl+Z"))?, &MenuItem::with_id(app, "edit-redo", "重做", true, Some("CmdOrCtrl+Shift+Z"))?, &sep3,
                &PredefinedMenuItem::cut(app, Some("剪切"))?, &PredefinedMenuItem::copy(app, Some("复制"))?, &PredefinedMenuItem::paste(app, Some("粘贴"))?,
                &MenuItem::with_id(app, "edit-delete", "删除", true, None::<&str>)?, &PredefinedMenuItem::select_all(app, Some("全选"))?,
                &MenuItem::with_id(app, "edit-format-document", "格式化", true, None::<&str>)?,
                &MenuItem::with_id(app, "edit-copy-markdown", "复制为 Markdown", true, None::<&str>)?,
                &MenuItem::with_id(app, "edit-copy-html", "复制为 HTML", true, None::<&str>)?,
                &MenuItem::with_id(app, "edit-copy-image", "复制为图片", true, None::<&str>)?,
                &MenuItem::with_id(app, "edit-copy-plain", "复制为纯文本", true, None::<&str>)?,
                &MenuItem::with_id(app, "edit-search", "搜索", true, Some("CmdOrCtrl+F"))?, &MenuItem::with_id(app, "edit-spellcheck", "拼写检查", true, None::<&str>)?,
            ])?;
            let text_style_menu = Submenu::with_id_and_items(app, "format-text-style", "文字样式", true, &[
                &CheckMenuItem::with_id(app, "format-strikethrough", "删除线", true, false, None::<&str>)?,
                &CheckMenuItem::with_id(app, "format-underline", "下划线", true, false, None::<&str>)?,
                &CheckMenuItem::with_id(app, "format-inline-formula", "行内公式", true, false, None::<&str>)?,
            ])?;
            let format_menu = Submenu::with_items(app, "格式", true, &[
                &CheckMenuItem::with_id(app, "format-bold", "粗体", true, false, Some("CmdOrCtrl+B"))?,
                &CheckMenuItem::with_id(app, "format-italic", "斜体", true, false, Some("CmdOrCtrl+I"))?,
                &text_style_menu,
                &CheckMenuItem::with_id(app, "format-code", "行内代码", true, false, None::<&str>)?,
                &CheckMenuItem::with_id(app, "format-comment", "注释", true, false, None::<&str>)?,
                &MenuItem::with_id(app, "format-clear", "清除格式", true, None::<&str>)?,
            ])?;
            let callout_menu = Submenu::with_id_and_items(app, "insert-callout", "警告框", true, &[
                &CheckMenuItem::with_id(app, "insert-callout-tip", "提示", true, false, None::<&str>)?,
                &CheckMenuItem::with_id(app, "insert-callout-note", "备注", true, false, None::<&str>)?,
                &CheckMenuItem::with_id(app, "insert-callout-important", "重要", true, false, None::<&str>)?,
                &CheckMenuItem::with_id(app, "insert-callout-warning", "警告", true, false, None::<&str>)?,
                &CheckMenuItem::with_id(app, "insert-callout-caution", "注意", true, false, None::<&str>)?,
            ])?;
            let image_menu = Submenu::with_id_and_items(app, "insert-image", "插入图片", true, &[
                &MenuItem::with_id(app, "format-image-url", "图片链接", true, None::<&str>)?,
                &MenuItem::with_id(app, "format-image", "本地图片", true, None::<&str>)?,
            ])?;
            let paragraph_menu = Submenu::with_items(app, "段落", true, &[
                &CheckMenuItem::with_id(app, "paragraph-normal", "普通段落", true, false, Some("CmdOrCtrl+0"))?,
                &CheckMenuItem::with_id(app, "paragraph-h1", "一级标题", true, false, Some("CmdOrCtrl+1"))?, &CheckMenuItem::with_id(app, "paragraph-h2", "二级标题", true, false, Some("CmdOrCtrl+2"))?,
                &CheckMenuItem::with_id(app, "paragraph-h3", "三级标题", true, false, Some("CmdOrCtrl+3"))?, &CheckMenuItem::with_id(app, "paragraph-h4", "四级标题", true, false, Some("CmdOrCtrl+4"))?,
                &CheckMenuItem::with_id(app, "paragraph-h5", "五级标题", true, false, Some("CmdOrCtrl+5"))?, &CheckMenuItem::with_id(app, "paragraph-h6", "六级标题", true, false, Some("CmdOrCtrl+6"))?,
                &MenuItem::with_id(app, "format-heading-increase", "增加标题级别", true, None::<&str>)?, &MenuItem::with_id(app, "format-heading-decrease", "降低标题级别", true, None::<&str>)?,
                &CheckMenuItem::with_id(app, "format-quote", "引用", true, false, None::<&str>)?,
                &CheckMenuItem::with_id(app, "format-unordered-list", "无序列表", true, false, None::<&str>)?, &CheckMenuItem::with_id(app, "format-ordered-list", "有序列表", true, false, None::<&str>)?,
                &CheckMenuItem::with_id(app, "format-task-list", "任务列表", true, false, None::<&str>)?,
                &MenuItem::with_id(app, "format-indent", "增加列表缩进", true, None::<&str>)?, &MenuItem::with_id(app, "format-outdent", "减少列表缩进", true, None::<&str>)?,
                &PredefinedMenuItem::separator(app)?,
                &CheckMenuItem::with_id(app, "format-link", "链接", true, false, None::<&str>)?, &image_menu,
                &CheckMenuItem::with_id(app, "paragraph-table", "表格", true, false, None::<&str>)?, &CheckMenuItem::with_id(app, "format-code-block", "代码块", true, false, None::<&str>)?,
                &CheckMenuItem::with_id(app, "paragraph-mindmap", "脑图", true, false, None::<&str>)?,
                &CheckMenuItem::with_id(app, "paragraph-mermaid", "流程图", true, false, None::<&str>)?,
                &CheckMenuItem::with_id(app, "paragraph-formula", "公式块", true, false, None::<&str>)?, &MenuItem::with_id(app, "format-footnote", "脚注", true, None::<&str>)?,
                &callout_menu, &MenuItem::with_id(app, "format-horizontal-rule", "水平分割线", true, None::<&str>)?,
            ])?;
            let reset_theme = MenuItem::with_id(app, "reset-default-theme", "恢复默认主题", true, Some("CmdOrCtrl+Shift+0"))?;
            let view_wysiwyg = CheckMenuItem::with_id(app, "view-wysiwyg", "所见即所得", true, false, None::<&str>)?;
            let view_source = CheckMenuItem::with_id(app, "view-source", "源代码", true, false, None::<&str>)?;
            let view_split = CheckMenuItem::with_id(app, "view-split", "分栏", true, false, None::<&str>)?;
            let toggle_sidebar = CheckMenuItem::with_id(app, "toggle-sidebar", "显示或隐藏侧栏", true, false, None::<&str>)?;
            let toggle_toolbar = CheckMenuItem::with_id(app, "toggle-toolbar", "显示或隐藏工具栏", true, false, None::<&str>)?;
            let toggle_typewriter = CheckMenuItem::with_id(app, "toggle-typewriter", "打字机模式", true, false, None::<&str>)?;
            let toggle_read_only = CheckMenuItem::with_id(app, "toggle-read-only", "只读模式", true, false, None::<&str>)?;
            let toggle_focus = CheckMenuItem::with_id(app, "toggle-focus", "专注模式", true, false, None::<&str>)?;
            let view_menu = Submenu::with_items(app, "显示", true, &[&view_wysiwyg, &view_source, &view_split, &toggle_sidebar, &toggle_toolbar, &toggle_typewriter, &toggle_read_only, &toggle_focus, &reset_theme])?;
            let window_menu = Submenu::with_items(app, "窗口", true, &[&MenuItem::with_id(app, "window-new", "新建窗口", true, None::<&str>)?])?;
            #[cfg(target_os = "windows")]
            { Menu::with_items(app, &[&file_menu, &edit_menu, &format_menu, &paragraph_menu, &view_menu, &window_menu]) }
            #[cfg(not(target_os = "windows"))]
            { Menu::with_items(app, &[&app_menu, &file_menu, &edit_menu, &format_menu, &paragraph_menu, &view_menu, &window_menu]) }
        })
        .on_window_event(|window, event| {
            if matches!(event, tauri::WindowEvent::Destroyed) {
                window.app_handle().state::<plugin_files::PluginWatchState>().stop_owner(window.label());
                plugin_focus::clear_owner(window.label());
                #[cfg(target_os = "macos")]
                quick_capture::detach_native_document(window.app_handle(), window.label());
            }
        })
        .on_menu_event(|app, event| {
            if event.id() == "app-about" {
                #[cfg(target_os = "macos")]
                about::show(app);
            } else if event.id() == "reset-default-theme" {
                let _ = app.emit("markart-reset-theme", ());

            } else if matches!(event.id().as_ref(), "view-wysiwyg" | "view-source" | "view-split") {
                if let Some(window) = app.webview_windows().values().find(|window| window.is_focused().unwrap_or(false)) { let _ = window.emit("markart-view-mode", event.id().as_ref().trim_start_matches("view-")); }
            } else {
                if let Some(window) = app.webview_windows().values().find(|window| window.is_focused().unwrap_or(false)) { let _ = window.emit("markart-menu-action", event.id().as_ref()); }
            }
        })
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(navigation_policy::init())
        .plugin(plugin_focus::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(quick_capture::QuickCaptureState::default())
        .manage(default_editor::PendingFiles::default())
        .manage(std::sync::Mutex::new(UiLanguage::default()))
        .manage(workspace::WorkspaceState::default())
        .manage(plugin_files::PluginWatchState::default())
        .manage(webdav::SyncLock::default())
        .manage(lan_share::ShareState::default())
        .invoke_handler(tauri::generate_handler![
            windows::create_workspace_window,
            quick_capture::open_quick_capture, quick_capture::open_saved_quick_capture, quick_capture::set_quick_capture, quick_capture::set_menu_bar_icon, quick_capture::save_quick_capture, quick_capture::save_quick_capture_as, quick_capture::update_quick_capture, quick_capture::set_quick_capture_native_content, quick_capture::set_quick_capture_appearance, quick_capture::set_quick_capture_native_path, quick_capture::quick_capture_native_status,
            native_alert::confirm_discard_changes,
            themes::list_installed_themes, themes::install_theme_folder, themes::remove_installed_theme,
            plugins::plugin_fetch_text, plugins::plugin_request_scoped, plugins::plugin_native, plugins::plugin_import_local,
            plugin_secrets::plugin_secret,
            plugin_focus::plugin_focus_token,
            plugin_files::plugin_data_directory, plugin_files::plugin_watch_start, plugin_files::plugin_watch_stop,
            lan_share::start_lan_share,
            lan_share::stop_lan_share,
            sync_recent_menus, set_ui_language,
            open_external_url,
            restart_after_update,
            default_editor::set_default_editor,
            default_editor::take_system_files,
            workspace::pick_open_target,
            workspace::workspace_relative_target,
            workspace::open_workspace_path,
            workspace::activate_workspace,
            workspace::close_workspace,
            workspace::refresh_workspace,
            workspace::open_document_path,
            workspace::save_document_as,
            workspace::open_recent_workspace,
            workspace::list_recent_workspaces,
            workspace::clear_recent_workspaces,
            workspace::read_document,
            workspace::save_document,
            workspace::git_available,
            workspace::list_git_versions,
            workspace::search_documents,
            workspace::diff_git_version,
            workspace::restore_git_version,
            webdav::save_webdav_password,
            webdav::webdav_has_password,
            webdav::webdav_logout,
            webdav::webdav_list_folders,
            webdav::webdav_get_binding,
            webdav::webdav_bind_workspace,
            webdav::webdav_unbind_workspace,
            webdav::sync_webdav,
            github_sync::save_github_token,
            github_sync::github_has_token,
            github_sync::github_logout,
            github_sync::github_migrate_token,
            github_sync::github_list_private_repos,
            github_sync::github_create_private_repo,
            github_sync::github_get_binding,
            github_sync::github_bind_workspace,
            github_sync::github_unbind_workspace,
            github_sync::sync_github,
            workspace::inspect_document,
            workspace::write_draft,
            workspace::load_draft,
            workspace::clear_draft,
            workspace::import_image,
            workspace::import_image_bytes,
            workspace::read_image,
            workspace::open_workspace_directory,
            workspace::open_workspace_resource,
            workspace::workspace_item_info,
            workspace::show_workspace_item_info,
            workspace::reveal_workspace_item,
            workspace::create_markdown, workspace::plugin_workspace_file,
            workspace::convert_text_to_markdown,
            workspace::create_folder,
            workspace::preview_move_item,
            workspace::query_link_completions,
            workspace::query_file_index,
            workspace::move_item_with_links,
            workspace::check_local_resources,
            workspace::validate_local_resource_target,
            document_import::convert_workspace_document,
            workspace::trash_item,
            export::export_document, export::export_plugin_file, export::render_clipboard_image, export::render_export_preview,
            system_fonts::list_system_fonts,
            set_menu_shortcuts,
            set_menu_checks
        ])
        .setup(|app| {
            file_index::configure(app.path().app_data_dir()?);
            let pending: Vec<String> = std::env::args().skip(1).filter(|arg| std::path::Path::new(arg).is_file()).collect();
            app.state::<default_editor::PendingFiles>().0.lock().unwrap().extend(pending);
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app, event| {
            if let tauri::RunEvent::ExitRequested { api, .. } = &event {
                let quick_capture = app.state::<quick_capture::QuickCaptureState>();
                if quick_capture.enabled.load(std::sync::atomic::Ordering::SeqCst)
                    || quick_capture.tray_visible.load(std::sync::atomic::Ordering::SeqCst) { api.prevent_exit(); }
            }
            #[cfg(target_os = "macos")]
            if let tauri::RunEvent::Reopen { .. } = &event {
                quick_capture::open_main(app);
            }
            #[cfg(any(target_os = "macos", target_os = "ios"))]
            if let tauri::RunEvent::Opened { urls } = event {
                let paths: Vec<String> = urls.into_iter().filter_map(|url| url.to_file_path().ok())
                    .filter(|path| path.is_file()).map(|path| path.to_string_lossy().into_owned()).collect();
                if !paths.is_empty() {
                    #[cfg(desktop)]
                    default_editor::queue_system_files(app, paths);
                }
            }
            #[cfg(not(any(target_os = "macos", target_os = "ios")))]
            let _ = (app, event);
        });
}

# 界面与提示文案清单

共 2029 处，涉及 118 个文件。

按源码静态提取，排除测试模块和示例正文：包含按钮、菜单、设置、占位文字、辅助说明、提示、确认和原生错误。动态文件名、用户正文、插件提供的文字不在清单中。条件分支中的提示及未清理的旧代码也可能收录，不能据此判断某条文案当前一定可达。

`${…}`、`{…}` 是动态值，修改文案时保留占位表达式。行号对应生成清单时的源码；同一行有多条文案时，每条分别列出。

重新生成：`node scripts/list-ui-copy.mjs`。

## 类型统计

| 类型 | 数量 |
|---|---:|
| 提示／错误 | 264 |
| 原生文案／其他 | 59 |
| 系统菜单 | 92 |
| 文案定义／其他 | 1005 |
| 状态文案 | 37 |
| 界面文案 | 569 |
| 弹窗／确认 | 3 |

## 弹窗与确认速查

| 位置 | 当前文案 | 对应代码 |
|---|---|---|
| [src/files/useLocalWorkspace.ts:491](../src/files/useLocalWorkspace.ts:491) | 未命名文件.md | <code>let name = template ? templateName : await (deps.askCreationName ? deps.askCreationName('file', parent &#124;&#124; '', '未命名文件.md') : askFileAction(t('新建 Markdown 文件名称'), '未命名文件.md'))</code> |
| [src/files/useLocalWorkspace.ts:531](../src/files/useLocalWorkspace.ts:531) | 新建文件夹 | <code>const name = await (deps.askCreationName ? deps.askCreationName('folder', parent, '新建文件夹') : askFileAction(t('新建文件夹路径（相对于当前目录）'), '新建文件夹'))</code> |
| [src/workspace/useWorkspaceController.ts:759](../src/workspace/useWorkspaceController.ts:759) | 删除文件“${path}”？ | <code>if(await askFileAction(&#96;删除文件“${path}”？&#96;,'',true)===null)throw new Error('已取消删除')</code> |

## 文件索引

- [src-tauri/src/default_editor.rs](#src-tauri-src-default-editor-rs)：7 处
- [src-tauri/src/document_import.rs](#src-tauri-src-document-import-rs)：6 处
- [src-tauri/src/docx_import.rs](#src-tauri-src-docx-import-rs)：3 处
- [src-tauri/src/export.rs](#src-tauri-src-export-rs)：19 处
- [src-tauri/src/file_index.rs](#src-tauri-src-file-index-rs)：1 处
- [src-tauri/src/git_history.rs](#src-tauri-src-git-history-rs)：9 处
- [src-tauri/src/github_sync.rs](#src-tauri-src-github-sync-rs)：45 处
- [src-tauri/src/lan_share.rs](#src-tauri-src-lan-share-rs)：4 处
- [src-tauri/src/lib.rs](#src-tauri-src-lib-rs)：100 处
- [src-tauri/src/macos_properties.rs](#src-tauri-src-macos-properties-rs)：3 处
- [src-tauri/src/pdf_import.rs](#src-tauri-src-pdf-import-rs)：1 处
- [src-tauri/src/plugin_files.rs](#src-tauri-src-plugin-files-rs)：8 处
- [src-tauri/src/plugins.rs](#src-tauri-src-plugins-rs)：3 处
- [src-tauri/src/system_fonts.rs](#src-tauri-src-system-fonts-rs)：3 处
- [src-tauri/src/themes.rs](#src-tauri-src-themes-rs)：12 处
- [src-tauri/src/webdav.rs](#src-tauri-src-webdav-rs)：60 处
- [src-tauri/src/windows_properties.rs](#src-tauri-src-windows-properties-rs)：2 处
- [src-tauri/src/workspace.rs](#src-tauri-src-workspace-rs)：125 处
- [src/CodeEditor.vue](#src-codeeditor-vue)：44 处
- [src/documents/ExportDialog.vue](#src-documents-exportdialog-vue)：9 处
- [src/documents/exportPreview.ts](#src-documents-exportpreview-ts)：7 处
- [src/documents/ExportPreviewPane.vue](#src-documents-exportpreviewpane-vue)：4 处
- [src/documents/exportRendering.ts](#src-documents-exportrendering-ts)：1 处
- [src/documents/frontmatter.ts](#src-documents-frontmatter-ts)：7 处
- [src/documents/imageProperties.ts](#src-documents-imageproperties-ts)：4 处
- [src/documents/personalItems.ts](#src-documents-personalitems-ts)：20 处
- [src/documents/spellDictionaries.ts](#src-documents-spelldictionaries-ts)：3 处
- [src/documents/untitledDocument.ts](#src-documents-untitleddocument-ts)：1 处
- [src/documents/useDocumentExport.ts](#src-documents-usedocumentexport-ts)：10 处
- [src/documents/useDocumentTools.ts](#src-documents-usedocumenttools-ts)：7 处
- [src/documents/useLanShare.ts](#src-documents-uselanshare-ts)：3 处
- [src/documents/usePersonalItems.ts](#src-documents-usepersonalitems-ts)：2 处
- [src/documents/useSpellcheck.ts](#src-documents-usespellcheck-ts)：9 处
- [src/documents/wordExport.ts](#src-documents-wordexport-ts)：1 处
- [src/editor/diagramConnections.ts](#src-editor-diagramconnections-ts)：2 处
- [src/editor/diagramControls.ts](#src-editor-diagramcontrols-ts)：5 处
- [src/editor/diagramEditing.ts](#src-editor-diagramediting-ts)：20 处
- [src/editor/diagramNodeControls.ts](#src-editor-diagramnodecontrols-ts)：24 处
- [src/editor/frontmatterWidget.ts](#src-editor-frontmatterwidget-ts)：3 处
- [src/editor/linkCompletion.ts](#src-editor-linkcompletion-ts)：1 处
- [src/editor/liveMarkdown.ts](#src-editor-livemarkdown-ts)：10 处
- [src/editor/pluginExtensions.ts](#src-editor-pluginextensions-ts)：2 处
- [src/editor/renderedContent.ts](#src-editor-renderedcontent-ts)：3 处
- [src/editor/renderMarkdown.ts](#src-editor-rendermarkdown-ts)：1 处
- [src/editor/slashCommands.ts](#src-editor-slashcommands-ts)：73 处
- [src/editor/tableControls.ts](#src-editor-tablecontrols-ts)：12 处
- [src/editor/useEditorActions.ts](#src-editor-useeditoractions-ts)：15 处
- [src/EditorWorkspace.vue](#src-editorworkspace-vue)：51 处
- [src/files/fileFormats.ts](#src-files-fileformats-ts)：3 处
- [src/files/FileHeadingMenu.vue](#src-files-fileheadingmenu-vue)：7 处
- [src/files/FileTreePanel.vue](#src-files-filetreepanel-vue)：66 处
- [src/files/useDocumentSafety.ts](#src-files-usedocumentsafety-ts)：17 处
- [src/files/useFileNavigator.ts](#src-files-usefilenavigator-ts)：17 处
- [src/files/useFileResources.ts](#src-files-usefileresources-ts)：9 处
- [src/files/useFileTreeActions.ts](#src-files-usefiletreeactions-ts)：6 处
- [src/files/useLocalWorkspace.ts](#src-files-uselocalworkspace-ts)：44 处
- [src/i18n/index.ts](#src-i18n-index-ts)：12 处
- [src/i18n/sourceCopy.ts](#src-i18n-sourcecopy-ts)：12 处
- [src/MenuBar.vue](#src-menubar-vue)：25 处
- [src/plugins/catalogs.ts](#src-plugins-catalogs-ts)：1 处
- [src/plugins/community.ts](#src-plugins-community-ts)：12 处
- [src/plugins/host/bridge.ts](#src-plugins-host-bridge-ts)：20 处
- [src/plugins/host/exports.ts](#src-plugins-host-exports-ts)：5 处
- [src/plugins/host/files.ts](#src-plugins-host-files-ts)：11 处
- [src/plugins/host/services.ts](#src-plugins-host-services-ts)：1 处
- [src/plugins/host/workspaceScope.ts](#src-plugins-host-workspacescope-ts)：1 处
- [src/plugins/local.ts](#src-plugins-local-ts)：4 处
- [src/plugins/manifest.ts](#src-plugins-manifest-ts)：5 处
- [src/plugins/permissions/declaration.ts](#src-plugins-permissions-declaration-ts)：12 处
- [src/plugins/permissions/grants.ts](#src-plugins-permissions-grants-ts)：4 处
- [src/plugins/PluginActions.vue](#src-plugins-pluginactions-vue)：4 处
- [src/plugins/PluginDialogFrame.vue](#src-plugins-plugindialogframe-vue)：1 处
- [src/plugins/PluginSettingControl.vue](#src-plugins-pluginsettingcontrol-vue)：1 处
- [src/plugins/PluginSettings.vue](#src-plugins-pluginsettings-vue)：41 处
- [src/plugins/PluginShortcutSettings.vue](#src-plugins-pluginshortcutsettings-vue)：4 处
- [src/plugins/PluginSidebar.vue](#src-plugins-pluginsidebar-vue)：2 处
- [src/plugins/PluginViews.vue](#src-plugins-pluginviews-vue)：2 处
- [src/plugins/PluginWorkspace.vue](#src-plugins-pluginworkspace-vue)：1 处
- [src/plugins/runtime.ts](#src-plugins-runtime-ts)：42 处
- [src/plugins/runtime/connection.ts](#src-plugins-runtime-connection-ts)：10 处
- [src/plugins/runtime/engine.ts](#src-plugins-runtime-engine-ts)：5 处
- [src/plugins/runtime/scope.ts](#src-plugins-runtime-scope-ts)：1 处
- [src/plugins/runtime/sourceMap.ts](#src-plugins-runtime-sourcemap-ts)：1 处
- [src/plugins/runtime/vmBootstrap.ts](#src-plugins-runtime-vmbootstrap-ts)：1 处
- [src/plugins/settingControls.ts](#src-plugins-settingcontrols-ts)：13 处
- [src/plugins/ui/PluginUninstallDialog.vue](#src-plugins-ui-pluginuninstalldialog-vue)：6 处
- [src/plugins/ui/PluginUpdateDialog.vue](#src-plugins-ui-pluginupdatedialog-vue)：6 处
- [src/plugins/ui/SidebarArea.vue](#src-plugins-ui-sidebararea-vue)：1 处
- [src/plugins/ui/sidebarLayout.ts](#src-plugins-ui-sidebarlayout-ts)：6 处
- [src/plugins/ui/SidebarManagerDialog.vue](#src-plugins-ui-sidebarmanagerdialog-vue)：6 处
- [src/plugins/ui/sidebarRegistry.ts](#src-plugins-ui-sidebarregistry-ts)：6 处
- [src/plugins/ui/tree.ts](#src-plugins-ui-tree-ts)：2 处
- [src/PreferencesPanel.vue](#src-preferencespanel-vue)：155 处
- [src/previews/plugin-system-validation.ts](#src-previews-plugin-system-validation-ts)：2 处
- [src/previews/PluginPanelsPreview.vue](#src-previews-pluginpanelspreview-vue)：53 处
- [src/previews/PreviewPanelContent.vue](#src-previews-previewpanelcontent-vue)：22 处
- [src/previews/PreviewSidebarGroup.vue](#src-previews-previewsidebargroup-vue)：2 处
- [src/QuickPanels.vue](#src-quickpanels-vue)：91 处
- [src/settings/FontPicker.vue](#src-settings-fontpicker-vue)：9 处
- [src/settings/shortcuts.ts](#src-settings-shortcuts-ts)：139 处
- [src/settings/ThemeCards.vue](#src-settings-themecards-vue)：2 处
- [src/settings/ThemeCarousel.vue](#src-settings-themecarousel-vue)：1 处
- [src/settings/usePreferences.ts](#src-settings-usepreferences-ts)：71 处
- [src/settings/useShortcutSettings.ts](#src-settings-useshortcutsettings-ts)：2 处
- [src/StatusBar.vue](#src-statusbar-vue)：12 处
- [src/sync/useCloudSync.ts](#src-sync-usecloudsync-ts)：37 处
- [src/sync/useGitHistory.ts](#src-sync-usegithistory-ts)：7 处
- [src/TabBar.vue](#src-tabbar-vue)：19 处
- [src/ViewModeMenu.vue](#src-viewmodemenu-vue)：5 处
- [src/workspace/OutlinePanel.vue](#src-workspace-outlinepanel-vue)：4 处
- [src/workspace/topbar.ts](#src-workspace-topbar-ts)：17 处
- [src/workspace/useCommandPalette.ts](#src-workspace-usecommandpalette-ts)：19 处
- [src/workspace/useWorkspaceCommands.ts](#src-workspace-useworkspacecommands-ts)：3 处
- [src/workspace/useWorkspaceController.ts](#src-workspace-useworkspacecontroller-ts)：61 处
- [src/workspace/useWorkspaceShell.ts](#src-workspace-useworkspaceshell-ts)：1 处
- [src/WorkspaceOverlays.vue](#src-workspaceoverlays-vue)：68 处
- [src/WorkspaceView.vue](#src-workspaceview-vue)：1 处
- [src/WritingModeMenu.vue](#src-writingmodemenu-vue)：5 处

<a id="src-tauri-src-default-editor-rs"></a>

## src-tauri/src/default_editor.rs

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [12](../src-tauri/src/default_editor.rs:12) | 提示／错误 | 请在系统设置中将 Markart 设为 Markdown 文件的默认应用 | <code>{ let _ = app; Err("请在系统设置中将 Markart 设为 Markdown 文件的默认应用".into()) }</code> |
| [35](../src-tauri/src/default_editor.rs:35) | 提示／错误 | 无法创建文件关联信息 | <code>if ptr.is_null() { Err("无法创建文件关联信息".into()) } else { Ok(Self(ptr)) }</code> |
| [42](../src-tauri/src/default_editor.rs:42) | 原生文案／其他 | 开发版无法设为默认编辑器，请安装 Markart 后设置 | <code>.ok_or("开发版无法设为默认编辑器，请安装 Markart 后设置")?;</code> |
| [49](../src-tauri/src/default_editor.rs:49) | 提示／错误 | 无法识别 .{extension} 文件类型 | <code>if content_type.is_null() { return Err(format!("无法识别 .{extension} 文件类型")); }</code> |
| [52](../src-tauri/src/default_editor.rs:52) | 提示／错误 | 无法关联 .{extension} 文件（系统错误 {status}），请在访达的“显示简介”中修改打开方式 | <code>if status != 0 { return Err(format!("无法关联 .{extension} 文件（系统错误 {status}），请在访达的“显示简介”中修改打开方式")); }</code> |
| [60](../src-tauri/src/default_editor.rs:60) | 提示／错误 | 无法识别 Markart 安装位置 | <code>if url.is_null() { return Err("无法识别 Markart 安装位置".into()); }</code> |
| [63](../src-tauri/src/default_editor.rs:63) | 提示／错误 | 无法注册 Markart（系统错误 {status}），请重新安装应用 | <code>if status == 0 { Ok(()) } else { Err(format!("无法注册 Markart（系统错误 {status}），请重新安装应用")) }</code> |

<a id="src-tauri-src-document-import-rs"></a>

## src-tauri/src/document_import.rs

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [29](../src-tauri/src/document_import.rs:29) | 提示／错误 | 格式转换失败：{} | <code>return Err(format!("格式转换失败：{}", detail.trim()));</code> |
| [33](../src-tauri/src/document_import.rs:33) | 提示／错误 | 转换超时，请重新打开文件 | <code>return Err("转换超时，请重新打开文件".into());</code> |
| [41](../src-tauri/src/document_import.rs:41) | 提示／错误 | 请选择不超过 30 MB 的文件 | <code>if !metadata.is_file() &#124;&#124; metadata.file_type().is_symlink() &#124;&#124; metadata.len() &gt; 30 * 1024 * 1024 { return Err("请选择不超过 30 MB 的文件".into()); }</code> |
| [50](../src-tauri/src/document_import.rs:50) | 提示／错误 | PDF 转换组件缺失，请重新安装应用 | <code>if !resource.is_file() { return Err("PDF 转换组件缺失，请重新安装应用".into()); }</code> |
| [58](../src-tauri/src/document_import.rs:58) | 提示／错误 | 仅支持将 Word（DOCX）和 PDF 转换为 Markdown | <code>_ =&gt; return Err("仅支持将 Word（DOCX）和 PDF 转换为 Markdown".into()),</code> |
| [67](../src-tauri/src/document_import.rs:67) | 提示／错误 | 请先打开文件夹 | <code>guard.as_ref().ok_or("请先打开文件夹")?.resolve(&amp;relative_path)?</code> |

<a id="src-tauri-src-docx-import-rs"></a>

## src-tauri/src/docx_import.rs

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [13](../src-tauri/src/docx_import.rs:13) | 提示／错误 | Word 文件内容过大，请拆分后转换 | <code>if entry.size() &gt; MAX_XML_BYTES { return Err("Word 文件内容过大，请拆分后转换".into()); }</code> |
| [213](../src-tauri/src/docx_import.rs:213) | 提示／错误 | Word 文件结构无法解析：{error} | <code>Err(error) =&gt; return Err(format!("Word 文件结构无法解析：{error}")),</code> |
| [222](../src-tauri/src/docx_import.rs:222) | 提示／错误 | Word 文件无法读取：{error} | <code>.map_err(&#124;error&#124; format!("Word 文件无法读取：{error}"))?;</code> |

<a id="src-tauri-src-export-rs"></a>

## src-tauri/src/export.rs

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [10](../src-tauri/src/export.rs:10) | 提示／错误 | 文件为空，无法导出 | <code>if bytes.is_empty() { return Err("文件为空，无法导出".into()); }</code> |
| [11](../src-tauri/src/export.rs:11) | 提示／错误 | 保存路径不可用，请重新选择 | <code>let parent = target.parent().ok_or("保存路径不可用，请重新选择")?;</code> |
| [12](../src-tauri/src/export.rs:12) | 提示／错误 | 保存文件夹不可用，请重新选择 | <code>if !parent.is_dir() { return Err("保存文件夹不可用，请重新选择".into()); }</code> |
| [22](../src-tauri/src/export.rs:22) | 原生文案／其他 | 文件 | <code>let base = Path::new(name).file_stem().and_then(&#124;part&#124; part.to_str()).unwrap_or("文件");</code> |
| [24](../src-tauri/src/export.rs:24) | 原生文案／其他 | 文件 | <code>if cleaned.trim().is_empty() { "文件".into() } else { cleaned }</code> |
| [31](../src-tauri/src/export.rs:31) | 提示／错误 | PDF 导出组件缺失，请重新安装应用 | <code>if !helper.is_file() { return Err("PDF 导出组件缺失，请重新安装应用".into()); }</code> |
| [43](../src-tauri/src/export.rs:43) | 提示／错误 | PDF 渲染失败（{status}）：{} | <code>return Err(format!("PDF 渲染失败（{status}）：{}", detail.trim()));</code> |
| [49](../src-tauri/src/export.rs:49) | 提示／错误 | PDF 生成超时，请减少文件内容后重新导出 | <code>return Err("PDF 生成超时，请减少文件内容后重新导出".into());</code> |
| [54](../src-tauri/src/export.rs:54) | 提示／错误 | 图像输出无效 | <code>if bytes.len() &lt; 100 &#124;&#124; !(if extension == "pdf" { bytes.starts_with(b"%PDF") } else { bytes.starts_with(b"\x89PNG\r\n\x1a\n") }) { return Err("图像输出无效".into()); }</code> |
| [62](../src-tauri/src/export.rs:62) | 提示／错误 | 纸张尺寸或页边距有误，请检查导出设置 | <code>return Err("纸张尺寸或页边距有误，请检查导出设置".into());</code> |
| [68](../src-tauri/src/export.rs:68) | 提示／错误 | 导出预览无效，请重新生成 | <code>if bytes.len() &lt; 100 &#124;&#124; bytes.len() &gt; 150_000_000 &#124;&#124; !valid { return Err("导出预览无效，请重新生成".into()); }</code> |
| [74](../src-tauri/src/export.rs:74) | 提示／错误 | 此格式不使用图像预览 | <code>if !matches!(kind.as_str(), "pdf" &#124; "png") { return Err("此格式不使用图像预览".into()); }</code> |
| [85](../src-tauri/src/export.rs:85) | 提示／错误 | PDF 和 PNG 导出暂不支持当前系统 | <code>{ let _ = (app, content); Err("PDF 和 PNG 导出暂不支持当前系统".into()) }</code> |
| [90](../src-tauri/src/export.rs:90) | 提示／错误 | 不支持此导出格式，请选择其他格式 | <code>let extension = match kind.as_str() { "html" =&gt; "html", "txt" =&gt; "txt", "pdf" =&gt; "pdf", "png" =&gt; "png", "docx" =&gt; "docx", _ =&gt; return Err("不支持此导出格式，请选择其他格式".into()) };</code> |
| [94](../src-tauri/src/export.rs:94) | 原生文案／其他 | 导出文件 | <code>dialog_app.dialog().file().set_file_name(default_name).add_filter("导出文件", &amp;[extension]).blocking_save_file()</code> |
| [98](../src-tauri/src/export.rs:98) | 提示／错误 | 文件扩展名与导出格式不一致，请修改文件名 | <code>return Err("文件扩展名与导出格式不一致，请修改文件名".into());</code> |
| [111](../src-tauri/src/export.rs:111) | 提示／错误 | PDF 和 PNG 导出暂不支持当前系统 | <code>{ return Err("PDF 和 PNG 导出暂不支持当前系统".into()); }</code> |
| [114](../src-tauri/src/export.rs:114) | 原生文案／其他 | 未生成 Word 内容，请重新导出 | <code>let data = binary_content.ok_or("未生成 Word 内容，请重新导出")?;</code> |
| [115](../src-tauri/src/export.rs:115) | 提示／错误 | Word 文件无法生成或超过 100 MB，请减少内容后导出 | <code>if data.len() &lt; 100 &#124;&#124; data.len() &gt; 100_000_000 &#124;&#124; !data.starts_with(b"PK\x03\x04") { return Err("Word 文件无法生成或超过 100 MB，请减少内容后导出".into()); }</code> |

<a id="src-tauri-src-file-index-rs"></a>

## src-tauri/src/file_index.rs

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [869](../src-tauri/src/file_index.rs:869) | 提示／错误 | 搜索词过长 | <code>return Err("搜索词过长".into());</code> |

<a id="src-tauri-src-git-history-rs"></a>

## src-tauri/src/git_history.rs

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [51](../src-tauri/src/git_history.rs:51) | 提示／错误 | 历史版本标识无效 | <code>if !id.bytes().all(&#124;byte&#124; byte.is_ascii_digit() &#124;&#124; byte == b'-') &#124;&#124; id.len() &gt; 80 { return Err("历史版本标识无效".into()); }</code> |
| [55](../src-tauri/src/git_history.rs:55) | 提示／错误 | 历史版本内容不存在 | <code>let entry = tree.get_name("content").ok_or("历史版本内容不存在")?;</code> |
| [61](../src-tauri/src/git_history.rs:61) | 原生文案／其他 | 此文件夹尚未保存历史版本 | <code>let repo = repository(root, false)?.ok_or("此文件夹尚未保存历史版本")?;</code> |
| [63](../src-tauri/src/git_history.rs:63) | 提示／错误 | 历史版本不存在 | <code>if !versions_at(&amp;repo, &amp;scope)?.iter().any(&#124;version&#124; version.id == id) { return Err("历史版本不存在".into()); }</code> |
| [68](../src-tauri/src/git_history.rs:68) | 提示／错误 | 历史版本保留设置有误，请检查数量和天数 | <code>if !(1..=201).contains(&amp;max_versions) &#124;&#124; retention_days &gt; 3650 { return Err("历史版本保留设置有误，请检查数量和天数".into()); }</code> |
| [69](../src-tauri/src/git_history.rs:69) | 提示／错误 | 无法创建 Git 仓库 | <code>let repo = repository(root, true)?.ok_or("无法创建 Git 仓库")?;</code> |
| [78](../src-tauri/src/git_history.rs:78) | 提示／错误 | Markart 保存版本 | <code>let commit = repo.commit(None, &amp;author, &amp;author, "Markart 保存版本", &amp;tree, &amp;[]).map_err(&#124;error&#124; error.to_string())?;</code> |
| [81](../src-tauri/src/git_history.rs:81) | 提示／错误 | Markart 保存版本 | <code>repo.reference(&amp;format!("{scope}/{id}"), commit, false, "Markart 保存版本").map_err(&#124;error&#124; error.to_string())?;</code> |
| [97](../src-tauri/src/git_history.rs:97) | 提示／错误 | 历史版本保留设置有误，请检查数量和天数 | <code>if !(1..=201).contains(&amp;max_versions) &#124;&#124; retention_days &gt; 3650 { return Err("历史版本保留设置有误，请检查数量和天数".into()); }</code> |

<a id="src-tauri-src-github-sync-rs"></a>

## src-tauri/src/github_sync.rs

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [17](../src-tauri/src/github_sync.rs:17) | 提示／错误 | 请输入 GitHub 仓库 HTTPS 地址 | <code>let parsed = reqwest::Url::parse(url.trim()).map_err(&#124;_&#124; "请输入 GitHub 仓库 HTTPS 地址")?;</code> |
| [18](../src-tauri/src/github_sync.rs:18) | 提示／错误 | 仅支持不含凭据的 github.com HTTPS 仓库地址 | <code>if parsed.scheme() != "https" &#124;&#124; parsed.host_str() != Some("github.com") &#124;&#124; !parsed.username().is_empty() &#124;&#124; parsed.password().is_some() &#124;&#124; parsed.query().is_some() &#124;&#124; parsed.fragment().is_some() { return Err("仅支持不含凭据的 github.com HTTPS 仓库地址".into()); }</code> |
| [20](../src-tauri/src/github_sync.rs:20) | 提示／错误 | 仓库地址应为 https://github.com/用户/仓库.git | <code>if parts.len() != 2 &#124;&#124; parts.iter().any(&#124;part&#124; part.is_empty() &#124;&#124; !part.bytes().all(&#124;byte&#124; byte.is_ascii_alphanumeric() &#124;&#124; matches!(byte, b'-' &#124; b'_' &#124; b'.'))) { return Err("仓库地址应为 https://github.com/用户/仓库.git".into()); }</code> |
| [32](../src-tauri/src/github_sync.rs:32) | 提示／错误 | 请输入 GitHub 访问令牌 | <code>if token.trim().is_empty() { return Err("请输入 GitHub 访问令牌".into()); }</code> |
| [66](../src-tauri/src/github_sync.rs:66) | 提示／错误 | GitHub 登录验证失败：{error} | <code>.send().map_err(&#124;error&#124; format!("GitHub 登录验证失败：{error}"))?;</code> |
| [67](../src-tauri/src/github_sync.rs:67) | 提示／错误 | GitHub 令牌验证失败：HTTP {} | <code>if !response.status().is_success() { return Err(format!("GitHub 令牌验证失败：HTTP {}", response.status())); }</code> |
| [69](../src-tauri/src/github_sync.rs:69) | 原生文案／其他 | GitHub 未返回用户名 | <code>value.get("login").and_then(&#124;value&#124; value.as_str()).map(str::to_owned).ok_or_else(&#124;&#124; "GitHub 未返回用户名".into())</code> |
| [76](../src-tauri/src/github_sync.rs:76) | 提示／错误 | GitHub 令牌不可用：{error} | <code>let token = account_credential()?.get_password().map_err(&#124;error&#124; format!("GitHub 令牌不可用：{error}"))?;</code> |
| [80](../src-tauri/src/github_sync.rs:80) | 提示／错误 | 仓库列表读取失败：HTTP {} | <code>if !response.status().is_success() { return Err(format!("仓库列表读取失败：HTTP {}", response.status())); }</code> |
| [94](../src-tauri/src/github_sync.rs:94) | 提示／错误 | 仓库名称仅可包含英文字母、数字、连字符、下划线和点 | <code>if name.is_empty() &#124;&#124; name.len() &gt; 100 &#124;&#124; !name.bytes().all(&#124;byte&#124; byte.is_ascii_alphanumeric() &#124;&#124; matches!(byte, b'-' &#124; b'_' &#124; b'.')) { return Err("仓库名称仅可包含英文字母、数字、连字符、下划线和点".into()); }</code> |
| [95](../src-tauri/src/github_sync.rs:95) | 提示／错误 | GitHub 令牌不可用：{error} | <code>let token = account_credential()?.get_password().map_err(&#124;error&#124; format!("GitHub 令牌不可用：{error}"))?;</code> |
| [101](../src-tauri/src/github_sync.rs:101) | 提示／错误 | 创建私有仓库失败：HTTP {}；请检查令牌是否有仓库管理权限 | <code>if !response.status().is_success() { return Err(format!("创建私有仓库失败：HTTP {}；请检查令牌是否有仓库管理权限", response.status())); }</code> |
| [103](../src-tauri/src/github_sync.rs:103) | 原生文案／其他 | GitHub 未返回仓库地址 | <code>let url = valid_url(value.get("clone_url").and_then(&#124;v&#124; v.as_str()).ok_or("GitHub 未返回仓库地址")?)?;</code> |
| [114](../src-tauri/src/github_sync.rs:114) | 原生文案／其他 | GitHub 地址无效 | <code>let path = url.strip_prefix("https://github.com/").and_then(&#124;rest&#124; rest.strip_suffix(".git")).ok_or("GitHub 地址无效")?;</code> |
| [119](../src-tauri/src/github_sync.rs:119) | 提示／错误 | 无法验证 GitHub 仓库：{error} | <code>.send().map_err(&#124;error&#124; format!("无法验证 GitHub 仓库：{error}"))?;</code> |
| [120](../src-tauri/src/github_sync.rs:120) | 提示／错误 | 无法访问 GitHub 私有仓库：HTTP {} | <code>if !response.status().is_success() { return Err(format!("无法访问 GitHub 私有仓库：HTTP {}", response.status())); }</code> |
| [123](../src-tauri/src/github_sync.rs:123) | 提示／错误 | 仓库不是私有仓库，已停止同步 | <code>if info.get("private").and_then(&#124;value&#124; value.as_bool()) != Some(true) { return Err("仓库不是私有仓库，已停止同步".into()); }</code> |
| [137](../src-tauri/src/github_sync.rs:137) | 提示／错误 | 文件超过 20 MB：{} | <code>if meta.len() &gt; MAX_FILE { return Err(format!("文件超过 20 MB：{}", path.display())); }</code> |
| [139](../src-tauri/src/github_sync.rs:139) | 提示／错误 | 文件路径不可同步 | <code>if !safe(&amp;name) { return Err("文件路径不可同步".into()); }</code> |
| [141](../src-tauri/src/github_sync.rs:141) | 提示／错误 | 文件数量超过同步限制 | <code>if out.len() &gt; MAX_FILES { return Err("文件数量超过同步限制".into()); }</code> |
| [151](../src-tauri/src/github_sync.rs:151) | 原生文案／其他 | Git 仓库包含非 UTF-8 路径 | <code>let name = entry.name().ok_or("Git 仓库包含非 UTF-8 路径")?;</code> |
| [153](../src-tauri/src/github_sync.rs:153) | 提示／错误 | Git 仓库包含非法路径 | <code>if !safe(&amp;path) { return Err("Git 仓库包含非法路径".into()); }</code> |
| [158](../src-tauri/src/github_sync.rs:158) | 提示／错误 | 远端文件超过 20 MB：{path} | <code>if blob.size() as u64 &gt; MAX_FILE { return Err(format!("远端文件超过 20 MB：{path}")); }</code> |
| [160](../src-tauri/src/github_sync.rs:160) | 提示／错误 | 远端文件数量超过同步限制 | <code>if out.len() &gt; MAX_FILES { return Err("远端文件数量超过同步限制".into()); }</code> |
| [162](../src-tauri/src/github_sync.rs:162) | 提示／错误 | 不支持同步特殊 Git 条目：{path} | <code>_ =&gt; return Err(format!("不支持同步特殊 Git 条目：{path}")),</code> |
| [189](../src-tauri/src/github_sync.rs:189) | 提示／错误 | 远端路径无效 | <code>if !safe(relative) { return Err("远端路径无效".into()); }</code> |
| [192](../src-tauri/src/github_sync.rs:192) | 提示／错误 | 路径包含符号链接 | <code>while let Some(dir) = ancestor { if dir == root { break; } if let Ok(meta) = fs::symlink_metadata(dir) { if !meta.is_dir() &#124;&#124; meta.file_type().is_symlink() { return Err("路径包含符号链接".into()); } } ancestor = dir.parent(); }</code> |
| [193](../src-tauri/src/github_sync.rs:193) | 提示／错误 | 目标不是普通文件 | <code>if let Ok(meta) = fs::symlink_metadata(&amp;path) { if !meta.is_file() &#124;&#124; meta.file_type().is_symlink() { return Err("目标不是普通文件".into()); } }</code> |
| [198](../src-tauri/src/github_sync.rs:198) | 提示／错误 | GitHub 绑定目录无效 | <code>fs::create_dir_all(path.parent().ok_or("GitHub 绑定目录无效")?).map_err(&#124;error&#124; error.to_string())?;</code> |
| [202](../src-tauri/src/github_sync.rs:202) | 提示／错误 | 该 GitHub 仓库已关联另一处本地目录。请为当前目录配置独立的私有仓库；现有远端文件不会被自动移动或删除。 | <code>Ok(_) =&gt; Err("该 GitHub 仓库已关联另一处本地目录。请为当前目录配置独立的私有仓库；现有远端文件不会被自动移动或删除。".into()),</code> |
| [231](../src-tauri/src/github_sync.rs:231) | 提示／错误 | 请先打开文件夹 | <code>state.0.lock().map_err(&#124;error&#124; error.to_string())?.as_ref().ok_or_else(&#124;&#124; "请先打开文件夹".to_owned())?.root.canonicalize().map_err(&#124;error&#124; error.to_string())</code> |
| [244](../src-tauri/src/github_sync.rs:244) | 提示／错误 | GitHub 令牌不可用：{error} | <code>let token = account_credential()?.get_password().map_err(&#124;error&#124; format!("GitHub 令牌不可用：{error}"))?;</code> |
| [248](../src-tauri/src/github_sync.rs:248) | 提示／错误 | 此文件夹已绑定其他仓库，请先解除绑定 | <code>return Err("此文件夹已绑定其他仓库，请先解除绑定".into());</code> |
| [253](../src-tauri/src/github_sync.rs:253) | 原生文案／其他 | GitHub 绑定目录无效 | <code>fs::create_dir_all(path.parent().ok_or("GitHub 绑定目录无效")?).map_err(&#124;error&#124; error.to_string())?;</code> |
| [264](../src-tauri/src/github_sync.rs:264) | 提示／错误 | 此仓库继承自上级文件夹，请打开上级文件夹后解除绑定 | <code>if binding_root != root { return Err("此仓库继承自上级文件夹，请打开上级文件夹后解除绑定".into()); }</code> |
| [285](../src-tauri/src/github_sync.rs:285) | 提示／错误 | GitHub 拉取失败：{error} | <code>remote.fetch(&amp;[format!("refs/heads/main:{tracking_ref}")], Some(&amp;mut fetch), None).map_err(&#124;error&#124; format!("GitHub 拉取失败：{error}"))?;</code> |
| [334](../src-tauri/src/github_sync.rs:334) | 原生文案／其他 | 目标目录无效 | <code>fs::create_dir_all(destination.parent().ok_or("目标目录无效")?).map_err(&#124;error&#124; error.to_string())?;</code> |
| [354](../src-tauri/src/github_sync.rs:354) | 原生文案／其他 | Markart 同步 | <code>let id = repo.commit(None, &amp;signature, &amp;signature, "Markart 同步", &amp;tree, &amp;parent_refs).map_err(&#124;error&#124; error.to_string())?;</code> |
| [355](../src-tauri/src/github_sync.rs:355) | 提示／错误 | Markart 待推送 | <code>repo.reference(&amp;pending_ref, id, true, "Markart 待推送").map_err(&#124;error&#124; error.to_string())?;</code> |
| [357](../src-tauri/src/github_sync.rs:357) | 提示／错误 | GitHub 推送失败：{error} | <code>remote.push(&amp;[format!("{pending_ref}:refs/heads/main")], Some(&amp;mut push)).map_err(&#124;error&#124; format!("GitHub 推送失败：{error}"))?;</code> |
| [358](../src-tauri/src/github_sync.rs:358) | 提示／错误 | GitHub 已同步 | <code>repo.reference(&amp;base_ref, id, true, "GitHub 已同步").map_err(&#124;error&#124; error.to_string())?;</code> |
| [360](../src-tauri/src/github_sync.rs:360) | 原生文案／其他 | GitHub 已同步 | <code>} else if let Some(id) = remote_id { repo.reference(&amp;base_ref, id, true, "GitHub 已同步").map_err(&#124;error&#124; error.to_string())?; }</code> |
| [368](../src-tauri/src/github_sync.rs:368) | 提示／错误 | 此文件夹尚未绑定 GitHub 仓库 | <code>let (sync_root, url) = inherited_binding(&amp;app_data, &amp;root)?.ok_or("此文件夹尚未绑定 GitHub 仓库")?;</code> |
| [372](../src-tauri/src/github_sync.rs:372) | 提示／错误 | GitHub 令牌不可用：{error} | <code>let token = account_credential()?.get_password().map_err(&#124;error&#124; format!("GitHub 令牌不可用：{error}"))?;</code> |
| [378](../src-tauri/src/github_sync.rs:378) | 提示／错误 | 文件夹已切换，本次同步已取消 | <code>if active.0.lock().map_err(&#124;error&#124; error.to_string())?.as_ref().map(&#124;workspace&#124; &amp;workspace.root) != Some(&amp;root) { return Err("文件夹已切换，本次同步已取消".into()); }</code> |

<a id="src-tauri-src-lan-share-rs"></a>

## src-tauri/src/lan_share.rs

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [18](../src-tauri/src/lan_share.rs:18) | 提示／错误 | 未找到局域网地址，请连接 Wi-Fi 或有线网络 | <code>Err("未找到局域网地址，请连接 Wi-Fi 或有线网络".into())</code> |
| [39](../src-tauri/src/lan_share.rs:39) | 提示／错误 | 分享地址无效 | <code>if token.len() != 64 &#124;&#124; !token.bytes().all(&#124;c&#124; c.is_ascii_hexdigit()) { return Err("分享地址无效".into()); }</code> |
| [40](../src-tauri/src/lan_share.rs:40) | 提示／错误 | 文件或图片过大，无法生成分享页面 | <code>if html.len() &gt; 32 * 1024 * 1024 { return Err("文件或图片过大，无法生成分享页面".into()); }</code> |
| [42](../src-tauri/src/lan_share.rs:42) | 提示／错误 | 无法启动局域网分享：{e} | <code>let listener = TcpListener::bind((Ipv4Addr::UNSPECIFIED, 0)).map_err(&#124;e&#124; format!("无法启动局域网分享：{e}"))?;</code> |

<a id="src-tauri-src-lib-rs"></a>

## src-tauri/src/lib.rs

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [78](../src-tauri/src/lib.rs:78) | 原生文案／其他 | 菜单尚未初始化 | <code>let menu = app.menu().ok_or("菜单尚未初始化")?;</code> |
| [96](../src-tauri/src/lib.rs:96) | 原生文案／其他 | 菜单尚未初始化 | <code>let menu = app.menu().ok_or("菜单尚未初始化")?;</code> |
| [120](../src-tauri/src/lib.rs:120) | 原生文案／其他 | 菜单尚未初始化 | <code>let menu = app.menu().ok_or("菜单尚未初始化")?;</code> |
| [123](../src-tauri/src/lib.rs:123) | 原生文案／其他 | 文件菜单不存在 | <code>.ok_or("文件菜单不存在")?;</code> |
| [126](../src-tauri/src/lib.rs:126) | 原生文案／其他 | 没有最近打开的记录 | <code>for id in ["recent-files-menu-empty", "recent-folders-menu-empty"] { language.originals.insert(id.into(), "没有最近打开的记录".into()); }</code> |
| [127](../src-tauri/src/lib.rs:127) | 原生文案／其他 | 清空最近打开 | <code>for id in ["recent-files-clear", "recent-folders-clear"] { language.originals.insert(id.into(), "清空最近打开".into()); }</code> |
| [130](../src-tauri/src/lib.rs:130) | 原生文案／其他 | 最近打开菜单不存在 | <code>let submenu = file_menu.get(id).and_then(&#124;item&#124; item.as_submenu().cloned()).ok_or("最近打开菜单不存在")?;</code> |
| [136](../src-tauri/src/lib.rs:136) | 系统菜单 | 没有最近打开的记录 | <code>submenu.append(&amp;MenuItem::with_id(&amp;app, format!("{id}-empty"), label("没有最近打开的记录"), false, None::&lt;&amp;str&gt;).map_err(&#124;error&#124; error.to_string())?).map_err(&#124;error&#124; error.to_string())?;</code> |
| [144](../src-tauri/src/lib.rs:144) | 系统菜单 | 清空最近打开 | <code>submenu.append(&amp;MenuItem::with_id(&amp;app, clear_id, label("清空最近打开"), has_records, None::&lt;&amp;str&gt;).map_err(&#124;error&#124; error.to_string())?).map_err(&#124;error&#124; error.to_string())?;</code> |
| [153](../src-tauri/src/lib.rs:153) | 提示／错误 | 只能打开 http:// 或 https:// 开头的链接 | <code>return Err("只能打开 http:// 或 https:// 开头的链接".into());</code> |
| [186](../src-tauri/src/lib.rs:186) | 系统菜单 | 关于 Markart | <code>let about_item = MenuItem::with_id(app, "app-about", "关于 Markart", true, None::&lt;&amp;str&gt;)?;</code> |
| [188](../src-tauri/src/lib.rs:188) | 系统菜单 | 关于 Markart | <code>let about_item = PredefinedMenuItem::about(app, Some("关于 Markart"), Some(AboutMetadata {</code> |
| [194](../src-tauri/src/lib.rs:194) | 系统菜单 | 隐藏 Markart | <code>…pp_menu = Submenu::with_items(app, "Markart", true, &amp;[&amp;about_item, &amp;sep1, &amp;PredefinedMenuItem::hide(app, Some("隐藏 Markart"))?, &amp;PredefinedMenuItem::hide_others(app, Some("隐藏其他"))?, &amp;PredefinedMenuItem::show_all(app, Some("全部显示"))?…</code> |
| [194](../src-tauri/src/lib.rs:194) | 系统菜单 | 隐藏其他 | <code>…_item, &amp;sep1, &amp;PredefinedMenuItem::hide(app, Some("隐藏 Markart"))?, &amp;PredefinedMenuItem::hide_others(app, Some("隐藏其他"))?, &amp;PredefinedMenuItem::show_all(app, Some("全部显示"))?, &amp;sep2, &amp;PredefinedMenuItem::quit(app, Some("退出 Marka…</code> |
| [194](../src-tauri/src/lib.rs:194) | 系统菜单 | 全部显示 | <code>…隐藏 Markart"))?, &amp;PredefinedMenuItem::hide_others(app, Some("隐藏其他"))?, &amp;PredefinedMenuItem::show_all(app, Some("全部显示"))?, &amp;sep2, &amp;PredefinedMenuItem::quit(app, Some("退出 Markart"))?])?;</code> |
| [194](../src-tauri/src/lib.rs:194) | 系统菜单 | 退出 Markart | <code>…Some("隐藏其他"))?, &amp;PredefinedMenuItem::show_all(app, Some("全部显示"))?, &amp;sep2, &amp;PredefinedMenuItem::quit(app, Some("退出 Markart"))?])?;</code> |
| [196](../src-tauri/src/lib.rs:196) | 系统菜单 | 新建文件 | <code>MenuItem::with_id(app, "file-new", "新建文件", true, Some("CmdOrCtrl+N"))?,</code> |
| [197](../src-tauri/src/lib.rs:197) | 系统菜单 | 打开文件… | <code>MenuItem::with_id(app, "file-open", "打开文件…", true, Some("CmdOrCtrl+Shift+O"))?,</code> |
| [198](../src-tauri/src/lib.rs:198) | 系统菜单 | 打开文件夹… | <code>MenuItem::with_id(app, "folder-open", "打开文件夹…", true, Some("CmdOrCtrl+O"))?,</code> |
| [199](../src-tauri/src/lib.rs:199) | 系统菜单 | 关闭当前文件 | <code>MenuItem::with_id(app, "file-close", "关闭当前文件", true, Some("CmdOrCtrl+W"))?,</code> |
| [200](../src-tauri/src/lib.rs:200) | 系统菜单 | 关闭文件夹 | <code>MenuItem::with_id(app, "folder-close", "关闭文件夹", true, None::&lt;&amp;str&gt;)?,</code> |
| [201](../src-tauri/src/lib.rs:201) | 系统菜单 | 保存 | <code>MenuItem::with_id(app, "file-save", "保存", true, Some("CmdOrCtrl+S"))?,</code> |
| [202](../src-tauri/src/lib.rs:202) | 系统菜单 | 另存为… | <code>MenuItem::with_id(app, "file-save-as", "另存为…", true, Some("CmdOrCtrl+Shift+S"))?,</code> |
| [204](../src-tauri/src/lib.rs:204) | 系统菜单 | 打开最近文件夹 | <code>let recent_folders = Submenu::with_id_and_items(app, "recent-folders-menu", "打开最近文件夹", true, &amp;[])?;</code> |
| [205](../src-tauri/src/lib.rs:205) | 系统菜单 | 打开最近文件 | <code>let recent_files = Submenu::with_id_and_items(app, "recent-files-menu", "打开最近文件", true, &amp;[])?;</code> |
| [206](../src-tauri/src/lib.rs:206) | 系统菜单 | 导出 | <code>let export_menu = Submenu::with_id_and_items(app, "export-menu", "导出", true, &amp;[</code> |
| [208](../src-tauri/src/lib.rs:208) | 系统菜单 | 纯文本 | <code>&amp;MenuItem::with_id(app, "export-txt", "纯文本", true, None::&lt;&amp;str&gt;)?,</code> |
| [211](../src-tauri/src/lib.rs:211) | 系统菜单 | PNG 长图 | <code>&amp;MenuItem::with_id(app, "export-png", "PNG 长图", true, None::&lt;&amp;str&gt;)?,</code> |
| [213](../src-tauri/src/lib.rs:213) | 系统菜单 | 文件 | <code>let file_menu = Submenu::with_id_and_items(app, "file-menu", "文件", true, &amp;[&amp;file_items[0], &amp;file_items[1], &amp;file_items[2], &amp;recent_folders, &amp;recent_files, &amp;file_items[3], &amp;f…</code> |
| [213](../src-tauri/src/lib.rs:213) | 系统菜单 | 分享到局域网… | <code>…nt_files, &amp;file_items[3], &amp;file_items[4], &amp;file_items[5], &amp;export_menu, &amp;MenuItem::with_id(app, "file-share", "分享到局域网…", true, None::&lt;&amp;str&gt;)?])?;</code> |
| [214](../src-tauri/src/lib.rs:214) | 系统菜单 | 编辑 | <code>let edit_menu = Submenu::with_items(app, "编辑", true, &amp;[</code> |
| [215](../src-tauri/src/lib.rs:215) | 系统菜单 | 撤销 | <code>&amp;MenuItem::with_id(app, "edit-undo", "撤销", true, Some("CmdOrCtrl+Z"))?, &amp;MenuItem::with_id(app, "edit-redo", "重做", true, Some("CmdOrCtrl+Shift+Z"))?, &amp;sep3,</code> |
| [215](../src-tauri/src/lib.rs:215) | 系统菜单 | 重做 | <code>&amp;MenuItem::with_id(app, "edit-undo", "撤销", true, Some("CmdOrCtrl+Z"))?, &amp;MenuItem::with_id(app, "edit-redo", "重做", true, Some("CmdOrCtrl+Shift+Z"))?, &amp;sep3,</code> |
| [216](../src-tauri/src/lib.rs:216) | 系统菜单 | 剪切 | <code>&amp;PredefinedMenuItem::cut(app, Some("剪切"))?, &amp;PredefinedMenuItem::copy(app, Some("复制"))?, &amp;PredefinedMenuItem::paste(app, Some("粘贴"))?,</code> |
| [216](../src-tauri/src/lib.rs:216) | 系统菜单 | 复制 | <code>&amp;PredefinedMenuItem::cut(app, Some("剪切"))?, &amp;PredefinedMenuItem::copy(app, Some("复制"))?, &amp;PredefinedMenuItem::paste(app, Some("粘贴"))?,</code> |
| [216](../src-tauri/src/lib.rs:216) | 系统菜单 | 粘贴 | <code>&amp;PredefinedMenuItem::cut(app, Some("剪切"))?, &amp;PredefinedMenuItem::copy(app, Some("复制"))?, &amp;PredefinedMenuItem::paste(app, Some("粘贴"))?,</code> |
| [217](../src-tauri/src/lib.rs:217) | 系统菜单 | 删除 | <code>&amp;MenuItem::with_id(app, "edit-delete", "删除", true, None::&lt;&amp;str&gt;)?, &amp;PredefinedMenuItem::select_all(app, Some("全选"))?,</code> |
| [217](../src-tauri/src/lib.rs:217) | 系统菜单 | 全选 | <code>&amp;MenuItem::with_id(app, "edit-delete", "删除", true, None::&lt;&amp;str&gt;)?, &amp;PredefinedMenuItem::select_all(app, Some("全选"))?,</code> |
| [218](../src-tauri/src/lib.rs:218) | 系统菜单 | 格式化 | <code>&amp;MenuItem::with_id(app, "edit-format-document", "格式化", true, None::&lt;&amp;str&gt;)?,</code> |
| [219](../src-tauri/src/lib.rs:219) | 系统菜单 | 复制为 Markdown | <code>&amp;MenuItem::with_id(app, "edit-copy-markdown", "复制为 Markdown", true, None::&lt;&amp;str&gt;)?,</code> |
| [220](../src-tauri/src/lib.rs:220) | 系统菜单 | 复制为 HTML | <code>&amp;MenuItem::with_id(app, "edit-copy-html", "复制为 HTML", true, None::&lt;&amp;str&gt;)?,</code> |
| [221](../src-tauri/src/lib.rs:221) | 系统菜单 | 复制为图片 | <code>&amp;MenuItem::with_id(app, "edit-copy-image", "复制为图片", true, None::&lt;&amp;str&gt;)?,</code> |
| [222](../src-tauri/src/lib.rs:222) | 系统菜单 | 复制为纯文本 | <code>&amp;MenuItem::with_id(app, "edit-copy-plain", "复制为纯文本", true, None::&lt;&amp;str&gt;)?,</code> |
| [223](../src-tauri/src/lib.rs:223) | 系统菜单 | 搜索 | <code>&amp;MenuItem::with_id(app, "edit-search", "搜索", true, Some("CmdOrCtrl+F"))?, &amp;MenuItem::with_id(app, "edit-spellcheck", "拼写检查", true, None::&lt;&amp;str&gt;)?,</code> |
| [223](../src-tauri/src/lib.rs:223) | 系统菜单 | 拼写检查 | <code>&amp;MenuItem::with_id(app, "edit-search", "搜索", true, Some("CmdOrCtrl+F"))?, &amp;MenuItem::with_id(app, "edit-spellcheck", "拼写检查", true, None::&lt;&amp;str&gt;)?,</code> |
| [225](../src-tauri/src/lib.rs:225) | 系统菜单 | 文字样式 | <code>let text_style_menu = Submenu::with_id_and_items(app, "format-text-style", "文字样式", true, &amp;[</code> |
| [226](../src-tauri/src/lib.rs:226) | 系统菜单 | 删除线 | <code>&amp;CheckMenuItem::with_id(app, "format-strikethrough", "删除线", true, false, None::&lt;&amp;str&gt;)?,</code> |
| [227](../src-tauri/src/lib.rs:227) | 系统菜单 | 下划线 | <code>&amp;CheckMenuItem::with_id(app, "format-underline", "下划线", true, false, None::&lt;&amp;str&gt;)?,</code> |
| [228](../src-tauri/src/lib.rs:228) | 系统菜单 | 行内公式 | <code>&amp;CheckMenuItem::with_id(app, "format-inline-formula", "行内公式", true, false, None::&lt;&amp;str&gt;)?,</code> |
| [230](../src-tauri/src/lib.rs:230) | 系统菜单 | 格式 | <code>let format_menu = Submenu::with_items(app, "格式", true, &amp;[</code> |
| [231](../src-tauri/src/lib.rs:231) | 系统菜单 | 粗体 | <code>&amp;CheckMenuItem::with_id(app, "format-bold", "粗体", true, false, Some("CmdOrCtrl+B"))?,</code> |
| [232](../src-tauri/src/lib.rs:232) | 系统菜单 | 斜体 | <code>&amp;CheckMenuItem::with_id(app, "format-italic", "斜体", true, false, Some("CmdOrCtrl+I"))?,</code> |
| [234](../src-tauri/src/lib.rs:234) | 系统菜单 | 行内代码 | <code>&amp;CheckMenuItem::with_id(app, "format-code", "行内代码", true, false, None::&lt;&amp;str&gt;)?,</code> |
| [235](../src-tauri/src/lib.rs:235) | 系统菜单 | 注释 | <code>&amp;CheckMenuItem::with_id(app, "format-comment", "注释", true, false, None::&lt;&amp;str&gt;)?,</code> |
| [236](../src-tauri/src/lib.rs:236) | 系统菜单 | 清除格式 | <code>&amp;MenuItem::with_id(app, "format-clear", "清除格式", true, None::&lt;&amp;str&gt;)?,</code> |
| [238](../src-tauri/src/lib.rs:238) | 系统菜单 | 警告框 | <code>let callout_menu = Submenu::with_id_and_items(app, "insert-callout", "警告框", true, &amp;[</code> |
| [239](../src-tauri/src/lib.rs:239) | 系统菜单 | 提示 | <code>&amp;CheckMenuItem::with_id(app, "insert-callout-tip", "提示", true, false, None::&lt;&amp;str&gt;)?,</code> |
| [240](../src-tauri/src/lib.rs:240) | 系统菜单 | 备注 | <code>&amp;CheckMenuItem::with_id(app, "insert-callout-note", "备注", true, false, None::&lt;&amp;str&gt;)?,</code> |
| [241](../src-tauri/src/lib.rs:241) | 系统菜单 | 重要 | <code>&amp;CheckMenuItem::with_id(app, "insert-callout-important", "重要", true, false, None::&lt;&amp;str&gt;)?,</code> |
| [242](../src-tauri/src/lib.rs:242) | 系统菜单 | 警告 | <code>&amp;CheckMenuItem::with_id(app, "insert-callout-warning", "警告", true, false, None::&lt;&amp;str&gt;)?,</code> |
| [243](../src-tauri/src/lib.rs:243) | 系统菜单 | 注意 | <code>&amp;CheckMenuItem::with_id(app, "insert-callout-caution", "注意", true, false, None::&lt;&amp;str&gt;)?,</code> |
| [245](../src-tauri/src/lib.rs:245) | 系统菜单 | 插入图片 | <code>let image_menu = Submenu::with_id_and_items(app, "insert-image", "插入图片", true, &amp;[</code> |
| [246](../src-tauri/src/lib.rs:246) | 系统菜单 | 图片链接 | <code>&amp;MenuItem::with_id(app, "format-image-url", "图片链接", true, None::&lt;&amp;str&gt;)?,</code> |
| [247](../src-tauri/src/lib.rs:247) | 系统菜单 | 本地图片 | <code>&amp;MenuItem::with_id(app, "format-image", "本地图片", true, None::&lt;&amp;str&gt;)?,</code> |
| [249](../src-tauri/src/lib.rs:249) | 系统菜单 | 段落 | <code>let paragraph_menu = Submenu::with_items(app, "段落", true, &amp;[</code> |
| [250](../src-tauri/src/lib.rs:250) | 系统菜单 | 普通段落 | <code>&amp;CheckMenuItem::with_id(app, "paragraph-normal", "普通段落", true, false, Some("CmdOrCtrl+0"))?,</code> |
| [251](../src-tauri/src/lib.rs:251) | 系统菜单 | 一级标题 | <code>&amp;CheckMenuItem::with_id(app, "paragraph-h1", "一级标题", true, false, Some("CmdOrCtrl+1"))?, &amp;CheckMenuItem::with_id(app, "paragraph-h2", "二级标题", true, false, Some("CmdOrCtrl+2"))?,</code> |
| [251](../src-tauri/src/lib.rs:251) | 系统菜单 | 二级标题 | <code>&amp;CheckMenuItem::with_id(app, "paragraph-h1", "一级标题", true, false, Some("CmdOrCtrl+1"))?, &amp;CheckMenuItem::with_id(app, "paragraph-h2", "二级标题", true, false, Some("CmdOrCtrl+2"))?,</code> |
| [252](../src-tauri/src/lib.rs:252) | 系统菜单 | 三级标题 | <code>&amp;CheckMenuItem::with_id(app, "paragraph-h3", "三级标题", true, false, Some("CmdOrCtrl+3"))?, &amp;CheckMenuItem::with_id(app, "paragraph-h4", "四级标题", true, false, Some("CmdOrCtrl+4"))?,</code> |
| [252](../src-tauri/src/lib.rs:252) | 系统菜单 | 四级标题 | <code>&amp;CheckMenuItem::with_id(app, "paragraph-h3", "三级标题", true, false, Some("CmdOrCtrl+3"))?, &amp;CheckMenuItem::with_id(app, "paragraph-h4", "四级标题", true, false, Some("CmdOrCtrl+4"))?,</code> |
| [253](../src-tauri/src/lib.rs:253) | 系统菜单 | 五级标题 | <code>&amp;CheckMenuItem::with_id(app, "paragraph-h5", "五级标题", true, false, Some("CmdOrCtrl+5"))?, &amp;CheckMenuItem::with_id(app, "paragraph-h6", "六级标题", true, false, Some("CmdOrCtrl+6"))?,</code> |
| [253](../src-tauri/src/lib.rs:253) | 系统菜单 | 六级标题 | <code>&amp;CheckMenuItem::with_id(app, "paragraph-h5", "五级标题", true, false, Some("CmdOrCtrl+5"))?, &amp;CheckMenuItem::with_id(app, "paragraph-h6", "六级标题", true, false, Some("CmdOrCtrl+6"))?,</code> |
| [254](../src-tauri/src/lib.rs:254) | 系统菜单 | 增加标题级别 | <code>&amp;MenuItem::with_id(app, "format-heading-increase", "增加标题级别", true, None::&lt;&amp;str&gt;)?, &amp;MenuItem::with_id(app, "format-heading-decrease", "降低标题级别", true, None::&lt;&amp;str&gt;)?,</code> |
| [254](../src-tauri/src/lib.rs:254) | 系统菜单 | 降低标题级别 | <code>&amp;MenuItem::with_id(app, "format-heading-increase", "增加标题级别", true, None::&lt;&amp;str&gt;)?, &amp;MenuItem::with_id(app, "format-heading-decrease", "降低标题级别", true, None::&lt;&amp;str&gt;)?,</code> |
| [255](../src-tauri/src/lib.rs:255) | 系统菜单 | 引用 | <code>&amp;CheckMenuItem::with_id(app, "format-quote", "引用", true, false, None::&lt;&amp;str&gt;)?,</code> |
| [256](../src-tauri/src/lib.rs:256) | 系统菜单 | 无序列表 | <code>&amp;CheckMenuItem::with_id(app, "format-unordered-list", "无序列表", true, false, None::&lt;&amp;str&gt;)?, &amp;CheckMenuItem::with_id(app, "format-ordered-list", "有序列表", true, false, None::&lt;&amp;str&gt;)?,</code> |
| [256](../src-tauri/src/lib.rs:256) | 系统菜单 | 有序列表 | <code>&amp;CheckMenuItem::with_id(app, "format-unordered-list", "无序列表", true, false, None::&lt;&amp;str&gt;)?, &amp;CheckMenuItem::with_id(app, "format-ordered-list", "有序列表", true, false, None::&lt;&amp;str&gt;)?,</code> |
| [257](../src-tauri/src/lib.rs:257) | 系统菜单 | 任务列表 | <code>&amp;CheckMenuItem::with_id(app, "format-task-list", "任务列表", true, false, None::&lt;&amp;str&gt;)?,</code> |
| [258](../src-tauri/src/lib.rs:258) | 系统菜单 | 增加列表缩进 | <code>&amp;MenuItem::with_id(app, "format-indent", "增加列表缩进", true, None::&lt;&amp;str&gt;)?, &amp;MenuItem::with_id(app, "format-outdent", "减少列表缩进", true, None::&lt;&amp;str&gt;)?,</code> |
| [258](../src-tauri/src/lib.rs:258) | 系统菜单 | 减少列表缩进 | <code>&amp;MenuItem::with_id(app, "format-indent", "增加列表缩进", true, None::&lt;&amp;str&gt;)?, &amp;MenuItem::with_id(app, "format-outdent", "减少列表缩进", true, None::&lt;&amp;str&gt;)?,</code> |
| [260](../src-tauri/src/lib.rs:260) | 系统菜单 | 链接 | <code>&amp;CheckMenuItem::with_id(app, "format-link", "链接", true, false, None::&lt;&amp;str&gt;)?, &amp;image_menu,</code> |
| [261](../src-tauri/src/lib.rs:261) | 系统菜单 | 表格 | <code>&amp;CheckMenuItem::with_id(app, "paragraph-table", "表格", true, false, None::&lt;&amp;str&gt;)?, &amp;CheckMenuItem::with_id(app, "format-code-block", "代码块", true, false, None::&lt;&amp;str&gt;)?,</code> |
| [261](../src-tauri/src/lib.rs:261) | 系统菜单 | 代码块 | <code>&amp;CheckMenuItem::with_id(app, "paragraph-table", "表格", true, false, None::&lt;&amp;str&gt;)?, &amp;CheckMenuItem::with_id(app, "format-code-block", "代码块", true, false, None::&lt;&amp;str&gt;)?,</code> |
| [262](../src-tauri/src/lib.rs:262) | 系统菜单 | 脑图 | <code>&amp;CheckMenuItem::with_id(app, "paragraph-mindmap", "脑图", true, false, None::&lt;&amp;str&gt;)?,</code> |
| [263](../src-tauri/src/lib.rs:263) | 系统菜单 | 流程图 | <code>&amp;CheckMenuItem::with_id(app, "paragraph-mermaid", "流程图", true, false, None::&lt;&amp;str&gt;)?,</code> |
| [264](../src-tauri/src/lib.rs:264) | 系统菜单 | 公式块 | <code>&amp;CheckMenuItem::with_id(app, "paragraph-formula", "公式块", true, false, None::&lt;&amp;str&gt;)?, &amp;MenuItem::with_id(app, "format-footnote", "脚注", true, None::&lt;&amp;str&gt;)?,</code> |
| [264](../src-tauri/src/lib.rs:264) | 系统菜单 | 脚注 | <code>&amp;CheckMenuItem::with_id(app, "paragraph-formula", "公式块", true, false, None::&lt;&amp;str&gt;)?, &amp;MenuItem::with_id(app, "format-footnote", "脚注", true, None::&lt;&amp;str&gt;)?,</code> |
| [265](../src-tauri/src/lib.rs:265) | 系统菜单 | 水平分割线 | <code>&amp;callout_menu, &amp;MenuItem::with_id(app, "format-horizontal-rule", "水平分割线", true, None::&lt;&amp;str&gt;)?,</code> |
| [267](../src-tauri/src/lib.rs:267) | 系统菜单 | 恢复默认主题 | <code>let reset_theme = MenuItem::with_id(app, "reset-default-theme", "恢复默认主题", true, Some("CmdOrCtrl+Shift+0"))?;</code> |
| [268](../src-tauri/src/lib.rs:268) | 系统菜单 | 所见即所得 | <code>let view_wysiwyg = CheckMenuItem::with_id(app, "view-wysiwyg", "所见即所得", true, false, None::&lt;&amp;str&gt;)?;</code> |
| [269](../src-tauri/src/lib.rs:269) | 系统菜单 | 源代码 | <code>let view_source = CheckMenuItem::with_id(app, "view-source", "源代码", true, false, None::&lt;&amp;str&gt;)?;</code> |
| [270](../src-tauri/src/lib.rs:270) | 系统菜单 | 分栏 | <code>let view_split = CheckMenuItem::with_id(app, "view-split", "分栏", true, false, None::&lt;&amp;str&gt;)?;</code> |
| [271](../src-tauri/src/lib.rs:271) | 系统菜单 | 显示或隐藏侧栏 | <code>let toggle_sidebar = CheckMenuItem::with_id(app, "toggle-sidebar", "显示或隐藏侧栏", true, false, None::&lt;&amp;str&gt;)?;</code> |
| [272](../src-tauri/src/lib.rs:272) | 系统菜单 | 显示或隐藏工具栏 | <code>let toggle_toolbar = CheckMenuItem::with_id(app, "toggle-toolbar", "显示或隐藏工具栏", true, false, None::&lt;&amp;str&gt;)?;</code> |
| [273](../src-tauri/src/lib.rs:273) | 系统菜单 | 打字机模式 | <code>let toggle_typewriter = CheckMenuItem::with_id(app, "toggle-typewriter", "打字机模式", true, false, None::&lt;&amp;str&gt;)?;</code> |
| [274](../src-tauri/src/lib.rs:274) | 系统菜单 | 只读模式 | <code>let toggle_read_only = CheckMenuItem::with_id(app, "toggle-read-only", "只读模式", true, false, None::&lt;&amp;str&gt;)?;</code> |
| [275](../src-tauri/src/lib.rs:275) | 系统菜单 | 专注模式 | <code>let toggle_focus = CheckMenuItem::with_id(app, "toggle-focus", "专注模式", true, false, None::&lt;&amp;str&gt;)?;</code> |
| [276](../src-tauri/src/lib.rs:276) | 系统菜单 | 显示 | <code>let view_menu = Submenu::with_items(app, "显示", true, &amp;[&amp;view_wysiwyg, &amp;view_source, &amp;view_split, &amp;toggle_sidebar, &amp;toggle_toolbar, &amp;toggle_typewriter, &amp;toggle_read_only, &amp;toggle_focus, &amp;reset_theme])?;</code> |
| [277](../src-tauri/src/lib.rs:277) | 系统菜单 | 窗口 | <code>let window_menu = Submenu::with_items(app, "窗口", true, &amp;[&amp;MenuItem::with_id(app, "window-new", "新建窗口", true, None::&lt;&amp;str&gt;)?])?;</code> |
| [277](../src-tauri/src/lib.rs:277) | 系统菜单 | 新建窗口 | <code>let window_menu = Submenu::with_items(app, "窗口", true, &amp;[&amp;MenuItem::with_id(app, "window-new", "新建窗口", true, None::&lt;&amp;str&gt;)?])?;</code> |

<a id="src-tauri-src-macos-properties-rs"></a>

## src-tauri/src/macos_properties.rs

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [6](../src-tauri/src/macos_properties.rs:6) | 原生文案／其他 | 系统简介需要在主线程打开 | <code>let mtm = MainThreadMarker::new().ok_or("系统简介需要在主线程打开")?;</code> |
| [16](../src-tauri/src/macos_properties.rs:16) | 提示／错误 | 无法向系统简介服务传递文件路径 | <code>return Err("无法向系统简介服务传递文件路径".into());</code> |
| [19](../src-tauri/src/macos_properties.rs:19) | 提示／错误 | 无法打开系统简介，可在 Finder 中查看 | <code>return Err("无法打开系统简介，可在 Finder 中查看".into());</code> |

<a id="src-tauri-src-pdf-import-rs"></a>

## src-tauri/src/pdf_import.rs

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [15](../src-tauri/src/pdf_import.rs:15) | 提示／错误 | PDF 中未提取到文字；扫描件请先进行文字识别（OCR） | <code>return Err("PDF 中未提取到文字；扫描件请先进行文字识别（OCR）".into());</code> |

<a id="src-tauri-src-plugin-files-rs"></a>

## src-tauri/src/plugin_files.rs

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [44](../src-tauri/src/plugin_files.rs:44) | 提示／错误 | 文件监听 ID 无效 | <code>if id.is_empty() &#124;&#124; id.len() &gt; 128 &#124;&#124; !id.bytes().all(&#124;b&#124; b.is_ascii_alphanumeric() &#124;&#124; b == b'-' &#124;&#124; b == b'_') { return Err("文件监听 ID 无效".into()); }</code> |
| [45](../src-tauri/src/plugin_files.rs:45) | 提示／错误 | 监听路径需要使用绝对路径 | <code>if !path.is_absolute() { return Err("监听路径需要使用绝对路径".into()); }</code> |
| [46](../src-tauri/src/plugin_files.rs:46) | 提示／错误 | 无法监听路径：{e} | <code>let path = path.canonicalize().map_err(&#124;e&#124; format!("无法监听路径：{e}"))?;</code> |
| [48](../src-tauri/src/plugin_files.rs:48) | 提示／错误 | 文件监听 debounceMs 需为 0～5000 毫秒 | <code>if debounce &gt; 5000 { return Err("文件监听 debounceMs 需为 0～5000 毫秒".into()); }</code> |
| [55](../src-tauri/src/plugin_files.rs:55) | 提示／错误 | 文件监听 ID 重复 | <code>if map.contains_key(&amp;id) { return Err("文件监听 ID 重复".into()); }</code> |
| [82](../src-tauri/src/plugin_files.rs:82) | 提示／错误 | 文件监听不属于当前窗口 | <code>if let Some(registration) = map.get(id) { if owner.is_some_and(&#124;owner&#124; owner != registration.owner) { return Err("文件监听不属于当前窗口".into()); } }</code> |
| [94](../src-tauri/src/plugin_files.rs:94) | 提示／错误 | 插件 ID 无效 | <code>if !plugin_id.contains(['.', '-']) &#124;&#124; plugin_id.split(['.', '-']).any(&#124;part&#124; part.is_empty() &#124;&#124; !part.bytes().all(&#124;b&#124; b.is_ascii_lowercase() &#124;&#124; b.is_ascii_digit())) { return Err("插件 ID 无效".into()); }</code> |
| [100](../src-tauri/src/plugin_files.rs:100) | 提示／错误 | 插件数据目录不能指向其他位置 | <code>if path.parent() != Some(root.as_path()) { return Err("插件数据目录不能指向其他位置".into()); }</code> |

<a id="src-tauri-src-plugins-rs"></a>

## src-tauri/src/plugins.rs

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [11](../src-tauri/src/plugins.rs:11) | 提示／错误 | 插件来源必须是 GitHub 公开 HTTPS 地址 | <code>if !allowed_url(&amp;parsed, false) { return Err("插件来源必须是 GitHub 公开 HTTPS 地址".into()); }</code> |
| [15](../src-tauri/src/plugins.rs:15) | 提示／错误 | 插件下载重定向无效 | <code>if attempt.previous().len() &gt; 5 &#124;&#124; !allowed_url(attempt.url(), true) { attempt.error("插件下载重定向无效") } else { attempt.follow() }</code> |
| [22](../src-tauri/src/plugins.rs:22) | 提示／错误 | 插件文件超过 5 MB | <code>if bytes.len() &gt; 5 * 1024 * 1024 { return Err("插件文件超过 5 MB".into()); }</code> |

<a id="src-tauri-src-system-fonts-rs"></a>

## src-tauri/src/system_fonts.rs

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [10](../src-tauri/src/system_fonts.rs:10) | 提示／错误 | 无法读取本机字体 | <code>if !result.status.success() { return Err("无法读取本机字体".into()); }</code> |
| [17](../src-tauri/src/system_fonts.rs:17) | 提示／错误 | 无法读取本机字体 | <code>if !result.status.success() { return Err("无法读取本机字体".into()); }</code> |
| [23](../src-tauri/src/system_fonts.rs:23) | 提示／错误 | 无法读取本机字体 | <code>if !result.status.success() { return Err("无法读取本机字体".into()); }</code> |

<a id="src-tauri-src-themes-rs"></a>

## src-tauri/src/themes.rs

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [26](../src-tauri/src/themes.rs:26) | 提示／错误 | theme.json 格式不正确：{e} | <code>serde_json::from_slice(&amp;fs::read(file).map_err(&#124;e&#124; e.to_string())?).map_err(&#124;e&#124; format!("theme.json 格式不正确：{e}"))?</code> |
| [30](../src-tauri/src/themes.rs:30) | 提示／错误 | 主题名称需为 1～80 个字 | <code>if value.name.trim().is_empty() &#124;&#124; value.name.chars().count() &gt; 80 { return Err("主题名称需为 1～80 个字".into()); }</code> |
| [31](../src-tauri/src/themes.rs:31) | 提示／错误 | 主题简介不能超过 120 个字 | <code>if value.description.as_ref().is_some_and(&#124;text&#124; text.chars().count() &gt; 120) { return Err("主题简介不能超过 120 个字".into()); }</code> |
| [33](../src-tauri/src/themes.rs:33) | 提示／错误 | 主题 preview 需填写三个十六进制颜色，依次为侧栏、正文和强调色 | <code>if colors.iter().any(&#124;color&#124; !color.starts_with('#') &#124;&#124; ![4, 7, 9].contains(&amp;color.len()) &#124;&#124; !color[1..].bytes().all(&#124;c&#124; c.is_ascii_hexdigit())) { return Err("主题 preview 需填写三个十六进制颜色，依次为侧栏、正文和强调色".into()); }</code> |
| [35](../src-tauri/src/themes.rs:35) | 提示／错误 | theme.json 的 styles 至少需要一个 CSS 文件 | <code>if value.styles.is_empty() { return Err("theme.json 的 styles 至少需要一个 CSS 文件".into()); }</code> |
| [38](../src-tauri/src/themes.rs:38) | 提示／错误 | CSS 路径不正确：{style} | <code>if !relative(style) &#124;&#124; Path::new(style).extension().and_then(&#124;s&#124; s.to_str()) != Some("css") { return Err(format!("CSS 路径不正确：{style}")); }</code> |
| [39](../src-tauri/src/themes.rs:39) | 提示／错误 | 找不到主题样式：{style} | <code>let path = root.join(style).canonicalize().map_err(&#124;_&#124; format!("找不到主题样式：{style}"))?;</code> |
| [40](../src-tauri/src/themes.rs:40) | 提示／错误 | CSS 文件必须位于主题文件夹内：{style} | <code>if !path.starts_with(&amp;canonical) &#124;&#124; !path.is_file() { return Err(format!("CSS 文件必须位于主题文件夹内：{style}")); }</code> |
| [52](../src-tauri/src/themes.rs:52) | 提示／错误 | 主题文件夹不能包含符号链接，请改用实际文件 | <code>if kind.is_symlink() { return Err("主题文件夹不能包含符号链接，请改用实际文件".into()); }</code> |
| [57](../src-tauri/src/themes.rs:57) | 提示／错误 | 主题文件夹超过 50 MB，请移除无关文件 | <code>if *total &gt; 50 * 1024 * 1024 { return Err("主题文件夹超过 50 MB，请移除无关文件".into()); }</code> |
| [66](../src-tauri/src/themes.rs:66) | 提示／错误 | 请选择独立的主题文件夹 | <code>if root.canonicalize().map_err(&#124;e&#124; e.to_string())?.starts_with(&amp;source) { return Err("请选择独立的主题文件夹".into()); }</code> |
| [95](../src-tauri/src/themes.rs:95) | 提示／错误 | 主题目录不正确 | <code>if !relative(&amp;id) &#124;&#124; Path::new(&amp;id).components().count() != 1 &#124;&#124; !id.starts_with("theme-") { return Err("主题目录不正确".into()); }</code> |

<a id="src-tauri-src-webdav-rs"></a>

## src-tauri/src/webdav.rs

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [35](../src-tauri/src/webdav.rs:35) | 提示／错误 | WebDAV 地址须使用 HTTPS；仅本机测试地址可使用 HTTP | <code>if base.scheme() != "https" &amp;&amp; !(base.scheme() == "http" &amp;&amp; local) { return Err("WebDAV 地址须使用 HTTPS；仅本机测试地址可使用 HTTP".into()); }</code> |
| [36](../src-tauri/src/webdav.rs:36) | 提示／错误 | WebDAV 地址不能包含账号、密码、查询或片段 | <code>if !base.username().is_empty() &#124;&#124; base.password().is_some() &#124;&#124; base.query().is_some() &#124;&#124; base.fragment().is_some() { return Err("WebDAV 地址不能包含账号、密码、查询或片段".into()); }</code> |
| [49](../src-tauri/src/webdav.rs:49) | 提示／错误 | WebDAV 地址路径无效 | <code>{ let mut segments = url.path_segments_mut().map_err(&#124;_&#124; "WebDAV 地址路径无效")?; segments.pop_if_empty(); for part in path.split('/') { if !part.is_empty() { segments.push(part); } } if path.ends_with('/') { segments.push(""); } }</code> |
| [57](../src-tauri/src/webdav.rs:57) | 提示／错误 | WebDAV 文件夹读取失败：HTTP {} | <code>if response.status() != StatusCode::MULTI_STATUS { return Err(format!("WebDAV 文件夹读取失败：HTTP {}", response.status())); }</code> |
| [59](../src-tauri/src/webdav.rs:59) | 提示／错误 | WebDAV 目录响应过大 | <code>if text.len() &gt; 4 * 1024 * 1024 { return Err("WebDAV 目录响应过大".into()); }</code> |
| [64](../src-tauri/src/webdav.rs:64) | 提示／错误 | WebDAV 文件读取失败：HTTP {} | <code>if !response.status().is_success() { return Err(format!("WebDAV 文件读取失败：HTTP {}", response.status())); }</code> |
| [65](../src-tauri/src/webdav.rs:65) | 提示／错误 | WebDAV 文件超过 20 MB | <code>if response.content_length().is_some_and(&#124;size&#124; size &gt; MAX_FILE) { return Err("WebDAV 文件超过 20 MB".into()); }</code> |
| [68](../src-tauri/src/webdav.rs:68) | 提示／错误 | WebDAV 文件超过 20 MB | <code>if bytes.len() as u64 &gt; MAX_FILE { return Err("WebDAV 文件超过 20 MB".into()); }</code> |
| [76](../src-tauri/src/webdav.rs:76) | 提示／错误 | WebDAV 创建目录失败：HTTP {} | <code>if !response.status().is_success() &amp;&amp; response.status() != StatusCode::METHOD_NOT_ALLOWED { return Err(format!("WebDAV 创建目录失败：HTTP {}", response.status())); }</code> |
| [85](../src-tauri/src/webdav.rs:85) | 提示／错误 | 远端文件已修改，未覆盖；请重新同步 | <code>if response.status() == StatusCode::PRECONDITION_FAILED { return Err("远端文件已修改，未覆盖；请重新同步".into()); }</code> |
| [86](../src-tauri/src/webdav.rs:86) | 提示／错误 | WebDAV 上传失败：HTTP {} | <code>if !response.status().is_success() { return Err(format!("WebDAV 上传失败：HTTP {}", response.status())); }</code> |
| [90](../src-tauri/src/webdav.rs:90) | 原生文案／其他 | 远端缺少 ETag，无法安全同步删除 | <code>let tag = file.etag.as_deref().ok_or("远端缺少 ETag，无法安全同步删除")?;</code> |
| [92](../src-tauri/src/webdav.rs:92) | 提示／错误 | 远端文件已修改，未删除；请重新同步 | <code>if response.status() == StatusCode::PRECONDITION_FAILED { return Err("远端文件已修改，未删除；请重新同步".into()); }</code> |
| [93](../src-tauri/src/webdav.rs:93) | 提示／错误 | WebDAV 删除失败：HTTP {} | <code>if !response.status().is_success() { return Err(format!("WebDAV 删除失败：HTTP {}", response.status())); }</code> |
| [102](../src-tauri/src/webdav.rs:102) | 提示／错误 | WebDAV 目录数量超出限制 | <code>if visited.len() &gt; MAX_FILES { return Err("WebDAV 目录数量超出限制".into()); }</code> |
| [105](../src-tauri/src/webdav.rs:105) | 提示／错误 | WebDAV 返回了目录外路径 | <code>if url.origin() != self.base.origin() &#124;&#124; !url.path().starts_with(self.base.path()) { return Err("WebDAV 返回了目录外路径".into()); }</code> |
| [106](../src-tauri/src/webdav.rs:106) | 原生文案／其他 | WebDAV 路径越界 | <code>let encoded = url.path().strip_prefix(self.base.path()).ok_or("WebDAV 路径越界")?.trim_end_matches('/');</code> |
| [107](../src-tauri/src/webdav.rs:107) | 提示／错误 | WebDAV 路径含编码分隔符 | <code>if encoded.to_ascii_lowercase().contains("%2f") &#124;&#124; encoded.to_ascii_lowercase().contains("%5c") { return Err("WebDAV 路径含编码分隔符".into()); }</code> |
| [109](../src-tauri/src/webdav.rs:109) | 提示／错误 | WebDAV 返回了非法文件路径：{decoded:?}，来源 {url} | <code>if !safe_relative(&amp;decoded) { return Err(format!("WebDAV 返回了非法文件路径：{decoded:?}，来源 {url}")); }</code> |
| [112](../src-tauri/src/webdav.rs:112) | 提示／错误 | WebDAV 文件数量超出限制 | <code>if files.len() &gt; MAX_FILES { return Err("WebDAV 文件数量超出限制".into()); }</code> |
| [134](../src-tauri/src/webdav.rs:134) | 提示／错误 | WebDAV 目录响应没有文件条目 | <code>if result.is_empty() { return Err("WebDAV 目录响应没有文件条目".into()); }</code> |
| [151](../src-tauri/src/webdav.rs:151) | 提示／错误 | 本地文件数量超出同步限制 | <code>if files.len() &gt; MAX_FILES { return Err("本地文件数量超出同步限制".into()); }</code> |
| [159](../src-tauri/src/webdav.rs:159) | 提示／错误 | 本地同步路径无效 | <code>if !safe_relative(relative) { return Err("本地同步路径无效".into()); }</code> |
| [166](../src-tauri/src/webdav.rs:166) | 提示／错误 | 同步路径包含符号链接或非目录 | <code>Ok(_) =&gt; return Err("同步路径包含符号链接或非目录".into()),</code> |
| [171](../src-tauri/src/webdav.rs:171) | 提示／错误 | 本地同步路径无效 | <code>let target = current.join(parts.last().ok_or("本地同步路径无效")?);</code> |
| [172](../src-tauri/src/webdav.rs:172) | 提示／错误 | 同步目标不是普通文件 | <code>if let Ok(meta) = fs::symlink_metadata(&amp;target) { if meta.file_type().is_symlink() &#124;&#124; !meta.is_file() { return Err("同步目标不是普通文件".into()); } }</code> |
| [180](../src-tauri/src/webdav.rs:180) | 提示／错误 | WebDAV 绑定路径无效 | <code>fs::create_dir_all(path.parent().ok_or("WebDAV 绑定路径无效")?).map_err(&#124;error&#124; error.to_string())?;</code> |
| [184](../src-tauri/src/webdav.rs:184) | 提示／错误 | 此 WebDAV 地址已关联另一处本地目录；请为当前目录使用独立的远端目录地址 | <code>Ok(_) =&gt; Err("此 WebDAV 地址已关联另一处本地目录；请为当前目录使用独立的远端目录地址".into()),</code> |
| [194](../src-tauri/src/webdav.rs:194) | 原生文案／其他 | 同步状态路径无效 | <code>fs::create_dir_all(path.parent().ok_or("同步状态路径无效")?).map_err(&#124;error&#124; error.to_string())?;</code> |
| [204](../src-tauri/src/webdav.rs:204) | 原生文案／其他 | 备份路径无效 | <code>fs::create_dir_all(path.parent().ok_or("备份路径无效")?).map_err(&#124;error&#124; error.to_string())?;</code> |
| [208](../src-tauri/src/webdav.rs:208) | 原生文案／其他 | 本地路径无效 | <code>fs::create_dir_all(path.parent().ok_or("本地路径无效")?).map_err(&#124;error&#124; error.to_string())?;</code> |
| [209](../src-tauri/src/webdav.rs:209) | 提示／错误 | 本地文件已修改，未覆盖；请重新同步 | <code>if let Some(expected) = old { if fs::read(path).map_err(&#124;error&#124; error.to_string())? != expected { return Err("本地文件已修改，未覆盖；请重新同步".into()); } }</code> |
| [213](../src-tauri/src/webdav.rs:213) | 提示／错误 | 本地已存在同名文件，未覆盖；请检查后重新同步 | <code>if old.is_none() &amp;&amp; path.exists() { return Err("本地已存在同名文件，未覆盖；请检查后重新同步".into()); }</code> |
| [231](../src-tauri/src/webdav.rs:231) | 提示／错误 | 同步状态损坏，已停止：{error} | <code>let mut manifest: Manifest = if manifest_path.exists() { serde_json::from_slice(&amp;fs::read(&amp;manifest_path).map_err(&#124;error&#124; error.to_string())?).map_err(&#124;error&#124; format!("同步状态损坏，已停止：{error}"))? } else { Manifest::default() };</code> |
| [238](../src-tauri/src/webdav.rs:238) | 提示／错误 | {path}：文件超过 20 MB | <code>…local_path).map_err(&#124;error&#124; error.to_string())?; if metadata.len() &gt; MAX_FILE { result.conflicts.push(format!("{path}：文件超过 20 MB")); continue; } Some(fs::read(&amp;local_path).map_err(&#124;error&#124; error.to_string())?) } else { None };</code> |
| [283](../src-tauri/src/webdav.rs:283) | 原生文案／其他 | 远端缺少 ETag，无法安全覆盖 | <code>let etag = remote_file.and_then(&#124;f&#124; f.etag.as_deref()).ok_or("远端缺少 ETag，无法安全覆盖")?;</code> |
| [300](../src-tauri/src/webdav.rs:300) | 原生文案／其他 | 远端缺少 ETag，无法安全覆盖 | <code>let etag = if operation == "upload" { remote_file.and_then(&#124;file&#124; file.etag.as_deref()).ok_or("远端缺少 ETag，无法安全覆盖")? } else { "" };</code> |
| [306](../src-tauri/src/webdav.rs:306) | 原生文案／其他 | 远端内容无法读取 | <code>let bytes = remote_bytes.as_ref().ok_or("远端内容无法读取")?;</code> |
| [312](../src-tauri/src/webdav.rs:312) | 原生文案／其他 | 远端文件不存在，请刷新文件夹 | <code>let file = remote_file.ok_or("远端文件不存在，请刷新文件夹")?;</code> |
| [320](../src-tauri/src/webdav.rs:320) | 原生文案／其他 | 本地文件不存在，请检查是否已移动或删除 | <code>let bytes = local_bytes.as_ref().ok_or("本地文件不存在，请检查是否已移动或删除")?;</code> |
| [322](../src-tauri/src/webdav.rs:322) | 提示／错误 | {path}：本地文件已变化，未删除 | <code>if fs::read(&amp;local_path).map_err(&#124;error&#124; error.to_string())? != *bytes { return Err(format!("{path}：本地文件已变化，未删除")); }</code> |
| [327](../src-tauri/src/webdav.rs:327) | 提示／错误 | 未知同步操作 | <code>_ =&gt; Err("未知同步操作".into()),</code> |
| [342](../src-tauri/src/webdav.rs:342) | 提示／错误 | 请填写 WebDAV 用户名和密码 | <code>if username.trim().is_empty() &#124;&#124; password.is_empty() { return Err("请填写 WebDAV 用户名和密码".into()); }</code> |
| [364](../src-tauri/src/webdav.rs:364) | 提示／错误 | WebDAV 密码不可用：{error} | <code>let password = credential(&amp;url, &amp;username)?.get_password().map_err(&#124;error&#124; format!("WebDAV 密码不可用：{error}"))?;</code> |
| [370](../src-tauri/src/webdav.rs:370) | 提示／错误 | WebDAV 返回了目录外路径 | <code>if entry.origin() != dav.base.origin() &#124;&#124; !entry.path().starts_with(dav.base.path()) { return Err("WebDAV 返回了目录外路径".into()); }</code> |
| [371](../src-tauri/src/webdav.rs:371) | 原生文案／其他 | WebDAV 路径越界 | <code>let encoded = entry.path().strip_prefix(dav.base.path()).ok_or("WebDAV 路径越界")?.trim_end_matches('/');</code> |
| [372](../src-tauri/src/webdav.rs:372) | 提示／错误 | WebDAV 路径含编码分隔符 | <code>if encoded.to_ascii_lowercase().contains("%2f") &#124;&#124; encoded.to_ascii_lowercase().contains("%5c") { return Err("WebDAV 路径含编码分隔符".into()); }</code> |
| [375](../src-tauri/src/webdav.rs:375) | 提示／错误 | WebDAV 文件夹过多 | <code>if folders.len() &gt; 1000 { return Err("WebDAV 文件夹过多".into()); }</code> |
| [388](../src-tauri/src/webdav.rs:388) | 提示／错误 | WebDAV 服务器或账号已更改；请恢复原连接，或解除绑定后重新选择远端文件夹 | <code>return Err("WebDAV 服务器或账号已更改；请恢复原连接，或解除绑定后重新选择远端文件夹".into());</code> |
| [395](../src-tauri/src/webdav.rs:395) | 提示／错误 | WebDAV 绑定记录损坏：{error} | <code>let binding: WebdavBinding = serde_json::from_str(&amp;body).map_err(&#124;error&#124; format!("WebDAV 绑定记录损坏：{error}"))?;</code> |
| [414](../src-tauri/src/webdav.rs:414) | 提示／错误 | 此绑定继承自上级文件夹，请打开上级文件夹后解除绑定 | <code>if binding_root != root { return Err("此绑定继承自上级文件夹，请打开上级文件夹后解除绑定".into()); }</code> |
| [424](../src-tauri/src/webdav.rs:424) | 提示／错误 | 请先打开文件夹 | <code>state.0.lock().map_err(&#124;error&#124; error.to_string())?.as_ref().ok_or_else(&#124;&#124; "请先打开文件夹".to_owned())?.root.canonicalize().map_err(&#124;error&#124; error.to_string())</code> |
| [437](../src-tauri/src/webdav.rs:437) | 提示／错误 | 远端文件夹名称无效 | <code>if !safe_relative(&amp;folder) { return Err("远端文件夹名称无效".into()); }</code> |
| [438](../src-tauri/src/webdav.rs:438) | 提示／错误 | WebDAV 密码不可用：{error} | <code>let password = credential(&amp;url, &amp;username)?.get_password().map_err(&#124;error&#124; format!("WebDAV 密码不可用：{error}"))?;</code> |
| [443](../src-tauri/src/webdav.rs:443) | 提示／错误 | 此文件夹已绑定 {}，请先解除绑定 | <code>if let Some((_, bound)) = inherited_binding(&amp;data, &amp;root)? { return Err(format!("此文件夹已绑定 {}，请先解除绑定", bound.url)); }</code> |
| [451](../src-tauri/src/webdav.rs:451) | 提示／错误 | WebDAV 远端文件夹创建或验证失败：HTTP {} | <code>if !response.status().is_success() &amp;&amp; response.status() != StatusCode::METHOD_NOT_ALLOWED { return Err(format!("WebDAV 远端文件夹创建或验证失败：HTTP {}", response.status())); }</code> |
| [456](../src-tauri/src/webdav.rs:456) | 原生文案／其他 | WebDAV 绑定路径无效 | <code>fs::create_dir_all(binding.parent().ok_or("WebDAV 绑定路径无效")?).map_err(&#124;error&#124; error.to_string())?;</code> |
| [478](../src-tauri/src/webdav.rs:478) | 提示／错误 | 此文件夹尚未绑定 WebDAV 文件夹 | <code>let (sync_root, binding) = inherited_binding(&amp;data, &amp;root)?.ok_or("此文件夹尚未绑定 WebDAV 文件夹")?;</code> |
| [484](../src-tauri/src/webdav.rs:484) | 提示／错误 | WebDAV 密码不可用：{error} | <code>let password = credential(&amp;url, &amp;username)?.get_password().map_err(&#124;error&#124; format!("WebDAV 密码不可用：{error}"))?;</code> |
| [490](../src-tauri/src/webdav.rs:490) | 提示／错误 | 文件夹已切换，本次同步已取消 | <code>if active.0.lock().map_err(&#124;error&#124; error.to_string())?.as_ref().map(&#124;workspace&#124; &amp;workspace.root) != Some(&amp;root) { return Err("文件夹已切换，本次同步已取消".into()); }</code> |

<a id="src-tauri-src-windows-properties-rs"></a>

## src-tauri/src/windows_properties.rs

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [13](../src-tauri/src/windows_properties.rs:13) | 提示／错误 | 文件路径包含无效字符 | <code>if path.contains('\0') { return Err("文件路径包含无效字符".into()); }</code> |
| [23](../src-tauri/src/windows_properties.rs:23) | 提示／错误 | 初始化系统属性窗口失败：0x{:08X} | <code>if result &lt; 0 { return Err(format!("初始化系统属性窗口失败：0x{:08X}", result as u32)); }</code> |

<a id="src-tauri-src-workspace-rs"></a>

## src-tauri/src/workspace.rs

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [21](../src-tauri/src/workspace.rs:21) | 提示／错误 | UTF-8 BOM 文件包含无效字节 | <code>.map_err(&#124;_&#124; "UTF-8 BOM 文件包含无效字节".into());</code> |
| [33](../src-tauri/src/workspace.rs:33) | 提示／错误 | 无法识别文件编码，请转为 UTF-8 后打开；原文件未修改 | <code>Err("无法识别文件编码，请转为 UTF-8 后打开；原文件未修改".into())</code> |
| [40](../src-tauri/src/workspace.rs:40) | 提示／错误 | 当前编码无法保存部分字符，请另存为 UTF-8 | <code>"ASCII" =&gt; Err("当前编码无法保存部分字符，请另存为 UTF-8".into()),</code> |
| [44](../src-tauri/src/workspace.rs:44) | 提示／错误 | 内容包含 {encoding} 无法表示的字符；原文件未修改 | <code>if errors { return Err(format!("内容包含 {encoding} 无法表示的字符；原文件未修改")); }</code> |
| [46](../src-tauri/src/workspace.rs:46) | 提示／错误 | 内容包含 GB2312 无法表示的字符；原文件未修改 | <code>return Err("内容包含 GB2312 无法表示的字符；原文件未修改".into());</code> |
| [50](../src-tauri/src/workspace.rs:50) | 提示／错误 | 不支持此编码，请转为 UTF-8 后打开 | <code>_ =&gt; Err("不支持此编码，请转为 UTF-8 后打开".into()),</code> |
| [64](../src-tauri/src/workspace.rs:64) | 提示／错误 | 文件夹已切换，请重新打开该文件 | <code>Err("文件夹已切换，请重新打开该文件".into())</code> |
| [244](../src-tauri/src/workspace.rs:244) | 提示／错误 | 文件路径不可用，请重新打开文件 | <code>return Err("文件路径不可用，请重新打开文件".into());</code> |
| [255](../src-tauri/src/workspace.rs:255) | 提示／错误 | 请选择 PNG、JPEG、GIF 或 WebP 图片 | <code>_ =&gt; Err("请选择 PNG、JPEG、GIF 或 WebP 图片".into()),</code> |
| [260](../src-tauri/src/workspace.rs:260) | 提示／错误 | 图片超过 20 MB，请压缩后插入 | <code>if bytes.len() &gt; 20 * 1024 * 1024 { return Err("图片超过 20 MB，请压缩后插入".into()); }</code> |
| [266](../src-tauri/src/workspace.rs:266) | 提示／错误 | 图片内容与扩展名不一致，请重新保存图片后插入 | <code>_ =&gt; Err("图片内容与扩展名不一致，请重新保存图片后插入".into()),</code> |
| [369](../src-tauri/src/workspace.rs:369) | 原生文案／其他 | 当前目录 | <code>Ok(WorkspaceInfo { name: self.root.file_name().and_then(&#124;name&#124; name.to_str()).unwrap_or("当前目录").to_owned(), root: self.root.to_string_lossy().into_owned(), directories, files })</code> |
| [392](../src-tauri/src/workspace.rs:392) | 原生文案／其他 | 当前目录 | <code>.unwrap_or("当前目录")</code> |
| [401](../src-tauri/src/workspace.rs:401) | 提示／错误 | 文件夹已切换，请重新输入 | <code>if self.root.to_string_lossy() != root { return Err("文件夹已切换，请重新输入".into()); }</code> |
| [405](../src-tauri/src/workspace.rs:405) | 提示／错误 | 文件索引不可用，请重新打开文件夹 | <code>self.index.lock().map_err(&#124;e&#124;e.to_string())?.as_ref().ok_or("文件索引不可用，请重新打开文件夹")?.complete_links(source, query, folder)</code> |
| [418](../src-tauri/src/workspace.rs:418) | 提示／错误 | 不允许操作符号链接 | <code>return Err("不允许操作符号链接".into());</code> |
| [423](../src-tauri/src/workspace.rs:423) | 提示／错误 | 项目超出当前目录 | <code>return Err("项目超出当前目录".into());</code> |
| [432](../src-tauri/src/workspace.rs:432) | 提示／错误 | 已存在同名文件或文件夹，请换个名称 | <code>Ok(_) =&gt; return Err("已存在同名文件或文件夹，请换个名称".into()),</code> |
| [434](../src-tauri/src/workspace.rs:434) | 提示／错误 | 目标不可访问：{error} | <code>Err(error) =&gt; return Err(format!("目标不可访问：{error}")),</code> |
| [436](../src-tauri/src/workspace.rs:436) | 提示／错误 | 目标目录无效 | <code>let parent = candidate.parent().ok_or("目标目录无效")?;</code> |
| [441](../src-tauri/src/workspace.rs:441) | 提示／错误 | 路径编码无效 | <code>.ok_or("路径编码无效")?;</code> |
| [448](../src-tauri/src/workspace.rs:448) | 提示／错误 | 目标父目录不是文件夹 | <code>return Err("目标父目录不是文件夹".into());</code> |
| [459](../src-tauri/src/workspace.rs:459) | 提示／错误 | 文件已在外部修改，请先比较并处理冲突 | <code>return Err("文件已在外部修改，请先比较并处理冲突".into());</code> |
| [473](../src-tauri/src/workspace.rs:473) | 提示／错误 | 文件名需以 .md、.markdown、.mdown 或 .mkd 结尾 | <code>return Err("文件名需以 .md、.markdown、.mdown 或 .mkd 结尾".into());</code> |
| [475](../src-tauri/src/workspace.rs:475) | 提示／错误 | 模板超过 20 MB，请减少内容 | <code>if content.len() &gt; 20 * 1024 * 1024 { return Err("模板超过 20 MB，请减少内容".into()); }</code> |
| [495](../src-tauri/src/workspace.rs:495) | 提示／错误 | 仅纯文本文件可以另存为 Markdown | <code>return Err("仅纯文本文件可以另存为 Markdown".into());</code> |
| [498](../src-tauri/src/workspace.rs:498) | 提示／错误 | 请将文件保存为 Markdown 格式（.md） | <code>return Err("请将文件保存为 Markdown 格式（.md）".into());</code> |
| [502](../src-tauri/src/workspace.rs:502) | 提示／错误 | 请将文本转为 UTF-8 编码后转换 | <code>std::str::from_utf8(text).map_err(&#124;_&#124; "请将文本转为 UTF-8 编码后转换")?;</code> |
| [517](../src-tauri/src/workspace.rs:517) | 提示／错误 | 图片超过 20 MB，请压缩后插入 | <code>return Err("图片超过 20 MB，请压缩后插入".into());</code> |
| [523](../src-tauri/src/workspace.rs:523) | 原生文案／其他 | 附件目录编码无效 | <code>let relative = folder.to_str().ok_or("附件目录编码无效")?;</code> |
| [527](../src-tauri/src/workspace.rs:527) | 提示／错误 | 附件目录路径包含文件 | <code>return Err("附件目录路径包含文件".into());</code> |
| [530](../src-tauri/src/workspace.rs:530) | 原生文案／其他 | 图片文件名无效 | <code>let source_stem = source.file_stem().and_then(&#124;part&#124; part.to_str()).ok_or("图片文件名无效")?;</code> |
| [532](../src-tauri/src/workspace.rs:532) | 原生文案／其他 | 图片扩展名无效 | <code>let extension = source.extension().and_then(&#124;part&#124; part.to_str()).ok_or("图片扩展名无效")?;</code> |
| [552](../src-tauri/src/workspace.rs:552) | 原生文案／其他 | 附件目录中重名图片过多 | <code>let imported = imported.ok_or("附件目录中重名图片过多")?;</code> |
| [565](../src-tauri/src/workspace.rs:565) | 提示／错误 | 请使用当前文件夹内的相对图片路径 | <code>return Err("请使用当前文件夹内的相对图片路径".into());</code> |
| [571](../src-tauri/src/workspace.rs:571) | 提示／错误 | 无法访问图片，请检查图片路径是否位于当前文件夹内 | <code>return Err("无法访问图片，请检查图片路径是否位于当前文件夹内".into());</code> |
| [575](../src-tauri/src/workspace.rs:575) | 提示／错误 | 图片超过 20 MB，请压缩后插入 | <code>return Err("图片超过 20 MB，请压缩后插入".into());</code> |
| [586](../src-tauri/src/workspace.rs:586) | 提示／错误 | 文件不在当前文件夹中，请重新打开所在文件夹 | <code>return Err("文件不在当前文件夹中，请重新打开所在文件夹".into());</code> |
| [590](../src-tauri/src/workspace.rs:590) | 提示／错误 | 移动或重命名时请保留原扩展名 | <code>return Err("移动或重命名时请保留原扩展名".into());</code> |
| [593](../src-tauri/src/workspace.rs:593) | 提示／错误 | 不能将文件夹移入它的子文件夹 | <code>return Err("不能将文件夹移入它的子文件夹".into());</code> |
| [650](../src-tauri/src/workspace.rs:650) | 提示／错误 | {old_path} 不是 UTF-8 Markdown，无法安全更新引用 | <code>.map_err(&#124;_&#124; format!("{old_path} 不是 UTF-8 Markdown，无法安全更新引用"))?;</code> |
| [678](../src-tauri/src/workspace.rs:678) | 提示／错误 | 文件已修改，请重新预览移动结果 | <code>if current_token != token { return Err("文件已修改，请重新预览移动结果".into()); }</code> |
| [700](../src-tauri/src/workspace.rs:700) | 提示／错误 | 文件移动: {rollback} | <code>if let Err(rollback) = fs::rename(&amp;target, &amp;source) { rollback_errors.push(format!("文件移动: {rollback}")); }</code> |
| [701](../src-tauri/src/workspace.rs:701) | 提示／错误 | 引用更新失败：{error}；回退结果：{} | <code>return Err(format!("引用更新失败：{error}；回退结果：{}", if rollback_errors.is_empty() { "已回退".to_owned() } else { rollback_errors.join("；") }));</code> |
| [701](../src-tauri/src/workspace.rs:701) | 提示／错误 | 已回退 | <code>return Err(format!("引用更新失败：{error}；回退结果：{}", if rollback_errors.is_empty() { "已回退".to_owned() } else { rollback_errors.join("；") }));</code> |
| [748](../src-tauri/src/workspace.rs:748) | 原生文案／其他 | 请填写当前文件夹内的相对路径 | <code>let reference = local_references(&amp;synthetic, source).into_iter().next().ok_or("请填写当前文件夹内的相对路径")?;</code> |
| [756](../src-tauri/src/workspace.rs:756) | 原生文案／其他 | 请填写当前文件夹内的相对路径 | <code>let reference = local_references(&amp;synthetic, source).into_iter().next().ok_or("请填写当前文件夹内的相对路径")?;</code> |
| [757](../src-tauri/src/workspace.rs:757) | 提示／错误 | 无法访问新路径，请检查目标文件是否存在 | <code>self.source_item(&amp;reference.resolved).map_err(&#124;_&#124; "无法访问新路径，请检查目标文件是否存在".to_owned())?;</code> |
| [765](../src-tauri/src/workspace.rs:765) | 提示／错误 | 文件不在当前文件夹中，请重新打开所在文件夹 | <code>return Err("文件不在当前文件夹中，请重新打开所在文件夹".into());</code> |
| [771](../src-tauri/src/workspace.rs:771) | 原生文案／其他 | 路径编码无效 | <code>NSURL::fileURLWithPath(&amp;NSString::from_str(target.to_str().ok_or("路径编码无效")?));</code> |
| [774](../src-tauri/src/workspace.rs:774) | 提示／错误 | 移入废纸篓失败：{error} | <code>.map_err(&#124;error&#124; format!("移入废纸篓失败：{error}"))?;</code> |
| [778](../src-tauri/src/workspace.rs:778) | 提示／错误 | 移入废纸篓仅支持 macOS | <code>return Err("移入废纸篓仅支持 macOS".into());</code> |
| [794](../src-tauri/src/workspace.rs:794) | 原生文案／其他 | 当前目录 | <code>let info = WorkspaceInfo { name: self.root.file_name().and_then(&#124;name&#124; name.to_str()).unwrap_or("当前目录").to_owned(), root: self.root.to_string_lossy().into_owned(), files, directories };</code> |
| [803](../src-tauri/src/workspace.rs:803) | 提示／错误 | 文件夹无法访问：{error} | <code>let root = fs::canonicalize(path).map_err(&#124;error&#124; format!("文件夹无法访问：{error}"))?;</code> |
| [805](../src-tauri/src/workspace.rs:805) | 提示／错误 | 请选择文件夹 | <code>return Err("请选择文件夹".into());</code> |
| [811](../src-tauri/src/workspace.rs:811) | 提示／错误 | 文件夹读取失败：{error} | <code>.map_err(&#124;error&#124; format!("文件夹读取失败：{error}"))?;</code> |
| [817](../src-tauri/src/workspace.rs:817) | 原生文案／其他 | 当前目录 | <code>.unwrap_or("当前目录")</code> |
| [849](../src-tauri/src/workspace.rs:849) | 提示／错误 | 文件不在当前文件夹中，请重新打开所在文件夹 | <code>return Err("文件不在当前文件夹中，请重新打开所在文件夹".into());</code> |
| [855](../src-tauri/src/workspace.rs:855) | 提示／错误 | 文件不可访问：{error} | <code>fs::symlink_metadata(&amp;current).map_err(&#124;error&#124; format!("文件不可访问：{error}"))?;</code> |
| [857](../src-tauri/src/workspace.rs:857) | 提示／错误 | 不允许访问符号链接 | <code>return Err("不允许访问符号链接".into());</code> |
| [861](../src-tauri/src/workspace.rs:861) | 提示／错误 | 文件不可访问：{error} | <code>fs::canonicalize(&amp;current).map_err(&#124;error&#124; format!("文件不可访问：{error}"))?;</code> |
| [863](../src-tauri/src/workspace.rs:863) | 提示／错误 | 文件不在当前文件夹内，请打开它所在的文件夹 | <code>return Err("文件不在当前文件夹内，请打开它所在的文件夹".into());</code> |
| [869](../src-tauri/src/workspace.rs:869) | 提示／错误 | 请选择文件 | <code>return Err("请选择文件".into());</code> |
| [875](../src-tauri/src/workspace.rs:875) | 提示／错误 | 此文件需先转换为 Markdown 后编辑 | <code>if matches!(Path::new(relative_path).extension().and_then(&#124;part&#124; part.to_str()).map(str::to_ascii_lowercase).as_deref(), Some("docx" &#124; "pdf")) { return Err("此文件需先转换为 Markdown 后编辑".into()); }</code> |
| [877](../src-tauri/src/workspace.rs:877) | 提示／错误 | 读取失败：{error} | <code>let bytes = fs::read(&amp;target).map_err(&#124;error&#124; format!("读取失败：{error}"))?;</code> |
| [878](../src-tauri/src/workspace.rs:878) | 提示／错误 | 此文件是二进制文件，无法作为文本打开 | <code>if binary_document(&amp;bytes) { return Err("此文件是二进制文件，无法作为文本打开".into()); }</code> |
| [879](../src-tauri/src/workspace.rs:879) | 提示／错误 | 文件不是 UTF-8 文本，无法打开 | <code>if !supported_document(&amp;target) &amp;&amp; std::str::from_utf8(&amp;bytes).is_err() { return Err("文件不是 UTF-8 文本，无法打开".into()); }</code> |
| [905](../src-tauri/src/workspace.rs:905) | 提示／错误 | 文件使用了不支持的换行格式，请统一为 LF 或 CRLF；原文件未修改 | <code>return Err("文件使用了不支持的换行格式，请统一为 LF 或 CRLF；原文件未修改".into());</code> |
| [926](../src-tauri/src/workspace.rs:926) | 原生文案／其他 | 请重新打开文件后保存 | <code>.ok_or("请重新打开文件后保存")?;</code> |
| [928](../src-tauri/src/workspace.rs:928) | 提示／错误 | 草稿基于旧磁盘版本，未覆盖文件；请先处理冲突 | <code>return Err("草稿基于旧磁盘版本，未覆盖文件；请先处理冲突".into());</code> |
| [930](../src-tauri/src/workspace.rs:930) | 提示／错误 | 保存前无法读取文件：{error} | <code>let current = fs::read(&amp;target).map_err(&#124;error&#124; format!("保存前无法读取文件：{error}"))?;</code> |
| [932](../src-tauri/src/workspace.rs:932) | 提示／错误 | 文件已在外部修改，未覆盖；请先比较差异 | <code>return Err("文件已在外部修改，未覆盖；请先比较差异".into());</code> |
| [942](../src-tauri/src/workspace.rs:942) | 提示／错误 | 安全写入失败：{error} | <code>.map_err(&#124;error&#124; format!("安全写入失败：{error}"))?;</code> |
| [949](../src-tauri/src/workspace.rs:949) | 提示／错误 | 保存版本丢失 | <code>Sha256::digest(self.originals.get(relative_path).ok_or("保存版本丢失")?)</code> |
| [960](../src-tauri/src/workspace.rs:960) | 原生文案／其他 | 请先读取文件 | <code>let original = self.originals.get(relative_path).ok_or("请先读取文件")?;</code> |
| [971](../src-tauri/src/workspace.rs:971) | 提示／错误 | 读取磁盘版本失败：{error} | <code>let current = fs::read(&amp;target).map_err(&#124;error&#124; format!("读取磁盘版本失败：{error}"))?;</code> |
| [981](../src-tauri/src/workspace.rs:981) | 原生文案／其他 | [磁盘文件不是 UTF-8，无法文本比较] | <code>.unwrap_or_else(&#124;_&#124; "[磁盘文件不是 UTF-8，无法文本比较]".into()),</code> |
| [1002](../src-tauri/src/workspace.rs:1002) | 提示／错误 | 草稿目录不可写：{error} | <code>fs::create_dir_all(&amp;directory).map_err(&#124;error&#124; format!("草稿目录不可写：{error}"))?;</code> |
| [1014](../src-tauri/src/workspace.rs:1014) | 原生文案／其他 | 请先读取文件 | <code>self.originals.get(relative_path).ok_or("请先读取文件")?;</code> |
| [1020](../src-tauri/src/workspace.rs:1020) | 提示／错误 | 草稿版本无效 | <code>return Err("草稿版本无效".into());</code> |
| [1041](../src-tauri/src/workspace.rs:1041) | 提示／错误 | 草稿路径不匹配 | <code>return Err("草稿路径不匹配".into());</code> |
| [1144](../src-tauri/src/workspace.rs:1144) | 提示／错误 | 文件在写入期间被修改 | <code>"文件在写入期间被修改",</code> |
| [1151](../src-tauri/src/workspace.rs:1151) | 原生文案／其他 | 草稿路径无效 | <code>let parent = path.parent().ok_or("草稿路径无效")?;</code> |
| [1174](../src-tauri/src/workspace.rs:1174) | 提示／错误 | 草稿损坏：{error} | <code>.map_err(&#124;error&#124; format!("草稿损坏：{error}"))</code> |
| [1215](../src-tauri/src/workspace.rs:1215) | 提示／错误 | 最近文件夹记录无法读取：{error} | <code>serde_json::from_slice(&amp;bytes).map_err(&#124;error&#124; format!("最近文件夹记录无法读取：{error}"))</code> |
| [1228](../src-tauri/src/workspace.rs:1228) | 原生文案／其他 | 记录路径无效 | <code>let mut staged = tempfile::NamedTempFile::new_in(path.parent().ok_or("记录路径无效")?)</code> |
| [1278](../src-tauri/src/workspace.rs:1278) | 提示／错误 | 文件夹不可用：{error} | <code>let root = fs::canonicalize(&amp;path).map_err(&#124;error&#124; format!("文件夹不可用：{error}"))?;</code> |
| [1279](../src-tauri/src/workspace.rs:1279) | 提示／错误 | 目标不是文件夹 | <code>if !root.is_dir() { return Err("目标不是文件夹".into()); }</code> |
| [1318](../src-tauri/src/workspace.rs:1318) | 提示／错误 | 文件不可用：{error} | <code>let target = fs::canonicalize(&amp;path).map_err(&#124;error&#124; format!("文件不可用：{error}"))?;</code> |
| [1319](../src-tauri/src/workspace.rs:1319) | 提示／错误 | 目标不是文件 | <code>if !target.is_file() { return Err("目标不是文件".into()); }</code> |
| [1320](../src-tauri/src/workspace.rs:1320) | 提示／错误 | 文件没有可打开的父目录 | <code>let root = target.parent().ok_or("文件没有可打开的父目录")?;</code> |
| [1321](../src-tauri/src/workspace.rs:1321) | 原生文案／其他 | 文件名无法读取 | <code>let relative_path = target.file_name().and_then(&#124;name&#124; name.to_str()).ok_or("文件名无法读取")?.to_owned();</code> |
| [1323](../src-tauri/src/workspace.rs:1323) | 提示／错误 | 不支持打开此格式，请选择 Markdown、纯文本、Word（DOCX）或 PDF | <code>if !info.files.iter().any(&#124;entry&#124; entry.relative_path == relative_path) { return Err("不支持打开此格式，请选择 Markdown、纯文本、Word（DOCX）或 PDF".into()); }</code> |
| [1333](../src-tauri/src/workspace.rs:1333) | 提示／错误 | 文件过大，请拆分后打开 | <code>if content.len() &gt; MAX_FILE_SIZE { return Err("文件过大，请拆分后打开".into()); }</code> |
| [1335](../src-tauri/src/workspace.rs:1335) | 原生文案／其他 | 未命名文件.md | <code>let safe_name = Path::new(&amp;filename).file_name().and_then(&#124;name&#124; name.to_str()).filter(&#124;name&#124; !name.is_empty()).unwrap_or("未命名文件.md").to_owned();</code> |
| [1338](../src-tauri/src/workspace.rs:1338) | 提示／错误 | 请保存为 Markdown 文件（.md） | <code>if markdown_only == Some(true) &amp;&amp; !matches!(target.extension().and_then(&#124;part&#124; part.to_str()).map(str::to_ascii_lowercase).as_deref(), Some("md" &#124; "markdown" &#124; "mdown" &#124; "mkd")) { return Err("请保存为 Markdown 文件（.md）".into()); }</code> |
| [1340](../src-tauri/src/workspace.rs:1340) | 提示／错误 | 已存在同名文件，请换个名称 | <code>if target.exists() { return Err("已存在同名文件，请换个名称".into()); }</code> |
| [1341](../src-tauri/src/workspace.rs:1341) | 提示／错误 | 保存路径无效 | <code>let parent = target.parent().ok_or("保存路径无效")?;</code> |
| [1383](../src-tauri/src/workspace.rs:1383) | 提示／错误 | 此文件夹已不在最近打开记录中，请重新选择文件夹 | <code>return Err("此文件夹已不在最近打开记录中，请重新选择文件夹".into());</code> |
| [1454](../src-tauri/src/workspace.rs:1454) | 提示／错误 | 请先打开文件夹 | <code>let workspace = guard.as_ref().ok_or("请先打开文件夹")?;</code> |
| [1455](../src-tauri/src/workspace.rs:1455) | 提示／错误 | 文件夹已切换，请重新输入 | <code>if root.as_deref().is_some_and(&#124;root&#124;workspace.root.to_string_lossy()!=root) { return Err("文件夹已切换，请重新输入".into()); }</code> |
| [1464](../src-tauri/src/workspace.rs:1464) | 提示／错误 | 搜索词过长 | <code>Some(Err(error)) if error == "搜索词过长" =&gt; return Err(error),</code> |
| [1474](../src-tauri/src/workspace.rs:1474) | 提示／错误 | 搜索词过长 | <code>if needle.chars().count() &gt; 200 { return Err("搜索词过长".into()); }</code> |
| [1515](../src-tauri/src/workspace.rs:1515) | 提示／错误 | 文件已在外部修改，请先比较并处理冲突 | <code>if current_hash != expected_version &#124;&#124; workspace.originals.get(&amp;relative_path) != Some(&amp;current) { return Err("文件已在外部修改，请先比较并处理冲突".into()); }</code> |
| [1521](../src-tauri/src/workspace.rs:1521) | 提示／错误 | 恢复失败：{error} | <code>replace_file(&amp;target, &amp;previous, &#124;&#124; ensure_unchanged(&amp;target, &amp;current)).map_err(&#124;error&#124; format!("恢复失败：{error}"))?;</code> |
| [1582](../src-tauri/src/workspace.rs:1582) | 原生文案／其他 | 图片 | <code>dialog_app.dialog().file().add_filter("图片", &amp;["png", "jpg", "jpeg", "gif", "webp"]).blocking_pick_file()</code> |
| [1608](../src-tauri/src/workspace.rs:1608) | 提示／错误 | 请先打开文件夹 | <code>guard.as_ref().ok_or("请先打开文件夹")?.linked_item(&amp;source, &amp;target)?</code> |
| [1624](../src-tauri/src/workspace.rs:1624) | 提示／错误 | 请先打开文件夹 | <code>let workspace = guard.as_mut().ok_or("请先打开文件夹")?;</code> |
| [1629](../src-tauri/src/workspace.rs:1629) | 原生文案／其他 | 目录编码无效 | <code>let text = current.to_str().ok_or("目录编码无效")?;</code> |
| [1632](../src-tauri/src/workspace.rs:1632) | 提示／错误 | 路径中的一部分是文件，请选择文件夹 | <code>else if !target.is_dir() { return Err("路径中的一部分是文件，请选择文件夹".into()); }</code> |
| [1651](../src-tauri/src/workspace.rs:1651) | 提示／错误 | 路径不在当前文件夹内，请重新选择 | <code>if !path.starts_with(&amp;root) { return Err("路径不在当前文件夹内，请重新选择".into()); }</code> |
| [1681](../src-tauri/src/workspace.rs:1681) | 提示／错误 | 当前系统不支持显示文件属性 | <code>{ let _ = (window, info); Err("当前系统不支持显示文件属性".into()) }</code> |
| [1695](../src-tauri/src/workspace.rs:1695) | 原生文案／其他 | 无法定位父目录 | <code>std::process::Command::new("xdg-open").arg(Path::new(&amp;path).parent().ok_or("无法定位父目录")?).spawn().map_err(&#124;error&#124; error.to_string())?;</code> |
| [1717](../src-tauri/src/workspace.rs:1717) | 提示／错误 | 文件超过 20 MB | <code>if content.len()&gt;20*1024*1024 { return Err("文件超过 20 MB".into()); }</code> |
| [1726](../src-tauri/src/workspace.rs:1726) | 提示／错误 | 附件超过 20 MB | <code>…20 MB".into());}let bytes=fs::read(target).map_err(&#124;e&#124;e.to_string())?;if bytes.len()&gt;20*1024*1024{return Err("附件超过 20 MB".into());}Ok(json!({"version":format!("{:x}",Sha256::digest(&amp;bytes)),"bytes":bytes}))},</code> |
| [1727](../src-tauri/src/workspace.rs:1727) | 原生文案／其他 | 缺少文件版本 | <code>"writeText" =&gt; {let expected=expected_version.as_deref().ok_or("缺少文件版本")?;workspace.read(&amp;path)?;let saved=workspace.save(&amp;path,content.as_deref().ok_or("缺少文件内容")?,expected)?;Ok(serde_json::to_value(saved).map_err(&#124;e&#124;e.to_string())?)},</code> |
| [1727](../src-tauri/src/workspace.rs:1727) | 原生文案／其他 | 缺少文件内容 | <code>"writeText" =&gt; {let expected=expected_version.as_deref().ok_or("缺少文件版本")?;workspace.read(&amp;path)?;let saved=workspace.save(&amp;path,content.as_deref().ok_or("缺少文件内容")?,expected)?;Ok(serde_json::to_value(saved).map_err(&#124;e&#124;e.to_string())?)},</code> |
| [1729](../src-tauri/src/workspace.rs:1729) | 原生文案／其他 | 缺少附件内容 | <code>let target=workspace.resolve(&amp;path)?;let data=bytes.as_deref().ok_or("缺少附件内容")?;</code> |
| [1730](../src-tauri/src/workspace.rs:1730) | 提示／错误 | 附件超过 20 MB | <code>if data.len()&gt;20*1024*1024{return Err("附件超过 20 MB".into());}</code> |
| [1732](../src-tauri/src/workspace.rs:1732) | 提示／错误 | 文件版本已变化，未覆盖 | <code>if Some(format!("{:x}",Sha256::digest(&amp;previous)).as_str())!=expected_version.as_deref(){return Err("文件版本已变化，未覆盖".into());}</code> |
| [1737](../src-tauri/src/workspace.rs:1737) | 提示／错误 | 不支持的插件文件操作 | <code>_ =&gt; Err("不支持的插件文件操作".into())</code> |
| [1749](../src-tauri/src/workspace.rs:1749) | 提示／错误 | 请先打开文件夹 | <code>state.0.lock().map_err(&#124;error&#124; error.to_string())?.as_mut().ok_or("请先打开文件夹")?.convert_text_to_markdown(&amp;source, &amp;target)</code> |
| [1798](../src-tauri/src/workspace.rs:1798) | 提示／错误 | 请先打开文件夹 | <code>guard.as_ref().ok_or("请先打开文件夹")?.complete_links(&amp;root,&amp;source,&amp;query,folder.as_deref())</code> |
| [1820](../src-tauri/src/workspace.rs:1820) | 提示／错误 | 请先打开文件夹 | <code>state.0.lock().map_err(&#124;error&#124; error.to_string())?.as_ref().ok_or("请先打开文件夹")?.check_local_resources(relative_path.as_deref(), current_content.as_deref())</code> |
| [1825](../src-tauri/src/workspace.rs:1825) | 提示／错误 | 请先打开文件夹 | <code>state.0.lock().map_err(&#124;error&#124; error.to_string())?.as_ref().ok_or("请先打开文件夹")?.validate_local_resource_target(&amp;source, &amp;target)</code> |

<a id="src-codeeditor-vue"></a>

## src/CodeEditor.vue

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [69](../src/CodeEditor.vue:69) | 文案定义／其他 | 打开链接失败：{0} | <code>if (isTauri()) void invoke('open_external_url', { url }).catch(error =&gt; emit('error', t('打开链接失败：{0}', { '0': String(error) })))</code> |
| [230](../src/CodeEditor.vue:230) | 文案定义／其他 | 格式化失败：{0} | <code>} catch (error) { emit('error', t('格式化失败：{0}', { '0': String(error) })) }</code> |
| [253](../src/CodeEditor.vue:253) | 文案定义／其他 | \n\n[^${number}]: 脚注内容 | <code>const reference = &#96;[^${number}]&#96;, definition = &#96;\n\n[^${number}]: 脚注内容&#96;</code> |
| [263](../src/CodeEditor.vue:263) | 文案定义／其他 | &#96;&#96;&#96;<br>代码<br>&#96;&#96;&#96; | <code>table: defaultTable + '\n\n', code: '&#96;&#96;&#96;\n代码\n&#96;&#96;&#96;', mermaid: '&#96;&#96;&#96;mermaid\ngraph TD\n  A[开始] --&gt; B[结束]\n&#96;&#96;&#96;', mindmap: '&#96;&#96;&#96;mindmap\n  root((主题))\n    分支一\n    分支二\n&#96;&#96;&#96;', formula: '$$\n公式\n$$',</code> |
| [263](../src/CodeEditor.vue:263) | 文案定义／其他 | &#96;&#96;&#96;mermaid<br>graph TD<br>  A[开始] --&gt; B[结束]<br>&#96;&#96;&#96; | <code>table: defaultTable + '\n\n', code: '&#96;&#96;&#96;\n代码\n&#96;&#96;&#96;', mermaid: '&#96;&#96;&#96;mermaid\ngraph TD\n  A[开始] --&gt; B[结束]\n&#96;&#96;&#96;', mindmap: '&#96;&#96;&#96;mindmap\n  root((主题))\n    分支一\n    分支二\n&#96;&#96;&#96;', formula: '$$\n公式\n$$',</code> |
| [263](../src/CodeEditor.vue:263) | 文案定义／其他 | &#96;&#96;&#96;mindmap<br>  root((主题))<br>    分支一<br>    分支二<br>&#96;&#96;&#96; | <code>table: defaultTable + '\n\n', code: '&#96;&#96;&#96;\n代码\n&#96;&#96;&#96;', mermaid: '&#96;&#96;&#96;mermaid\ngraph TD\n  A[开始] --&gt; B[结束]\n&#96;&#96;&#96;', mindmap: '&#96;&#96;&#96;mindmap\n  root((主题))\n    分支一\n    分支二\n&#96;&#96;&#96;', formula: '$$\n公式\n$$',</code> |
| [263](../src/CodeEditor.vue:263) | 文案定义／其他 | $$<br>公式<br>$$ | <code>table: defaultTable + '\n\n', code: '&#96;&#96;&#96;\n代码\n&#96;&#96;&#96;', mermaid: '&#96;&#96;&#96;mermaid\ngraph TD\n  A[开始] --&gt; B[结束]\n&#96;&#96;&#96;', mindmap: '&#96;&#96;&#96;mindmap\n  root((主题))\n    分支一\n    分支二\n&#96;&#96;&#96;', formula: '$$\n公式\n$$',</code> |
| [264](../src/CodeEditor.vue:264) | 文案定义／其他 | [^1]<br><br>[^1]: 脚注内容 | <code>footnote: '[^1]\n\n[^1]: 脚注内容', hr: '---',</code> |
| [265](../src/CodeEditor.vue:265) | 文案定义／其他 | &gt; [!TIP]<br>&gt; 提示内容 | <code>'callout-tip': '&gt; [!TIP]\n&gt; 提示内容', 'callout-note': '&gt; [!NOTE]\n&gt; 备注内容',</code> |
| [265](../src/CodeEditor.vue:265) | 文案定义／其他 | &gt; [!NOTE]<br>&gt; 备注内容 | <code>'callout-tip': '&gt; [!TIP]\n&gt; 提示内容', 'callout-note': '&gt; [!NOTE]\n&gt; 备注内容',</code> |
| [266](../src/CodeEditor.vue:266) | 文案定义／其他 | &gt; [!IMPORTANT]<br>&gt; 重要内容 | <code>'callout-important': '&gt; [!IMPORTANT]\n&gt; 重要内容', 'callout-warning': '&gt; [!WARNING]\n&gt; 警告内容',</code> |
| [266](../src/CodeEditor.vue:266) | 文案定义／其他 | &gt; [!WARNING]<br>&gt; 警告内容 | <code>'callout-important': '&gt; [!IMPORTANT]\n&gt; 重要内容', 'callout-warning': '&gt; [!WARNING]\n&gt; 警告内容',</code> |
| [267](../src/CodeEditor.vue:267) | 文案定义／其他 | &gt; [!CAUTION]<br>&gt; 注意内容 | <code>'callout-caution': '&gt; [!CAUTION]\n&gt; 注意内容'</code> |
| [323](../src/CodeEditor.vue:323) | 状态文案 | ${findMatches.length} 处匹配 | <code>findStatus.value = findText.value ? &#96;${findMatches.length} 处匹配&#96; : ''</code> |
| [325](../src/CodeEditor.vue:325) | 状态文案 | 正则表达式无效 | <code>} catch { findMatches = []; findStatus.value = '正则表达式无效'; return false }</code> |
| [388](../src/CodeEditor.vue:388) | 文案定义／其他 | ![图片](${path}) | <code>insertSnippet(&#96;![图片](${path})&#96;)</code> |
| [389](../src/CodeEditor.vue:389) | 文案定义／其他 | 粘贴图片失败：{0} | <code>} catch (error) { emit('error', t('粘贴图片失败：{0}', { '0': String(error) })) }</code> |
| [442](../src/CodeEditor.vue:442) | 文案定义／其他 | ··· | <code>marker.textContent = '···'; marker.setAttribute('aria-label', t('展开折叠内容')); marker.title = t('展开折叠内容')</code> |
| [442](../src/CodeEditor.vue:442) | 文案定义／其他 | 展开折叠内容 | <code>marker.textContent = '···'; marker.setAttribute('aria-label', t('展开折叠内容')); marker.title = t('展开折叠内容')</code> |
| [503](../src/CodeEditor.vue:503) | 界面文案 | 文件查找与替换 | <code>&lt;div v-if="findOpen" class="editor-find" role="search" :aria-label="$t('文件查找与替换')" @keydown.stop @keydown.esc.prevent="closeFind"&gt;</code> |
| [504](../src/CodeEditor.vue:504) | 界面文案 | 查找 | <code>…div class="editor-find-row"&gt;&lt;input ref="findInput" v-model="findText" :aria-label="$t('查找')" :placeholder="$t('查找')" @keydown.enter.prevent="findNext($event.shiftKey)"&gt;&lt;span class="editor-find-actions"&gt;&lt;button :title="$t('…</code> |
| [504](../src/CodeEditor.vue:504) | 界面文案 | 上一个 | <code>…查找')" @keydown.enter.prevent="findNext($event.shiftKey)"&gt;&lt;span class="editor-find-actions"&gt;&lt;button :title="$t('上一个')" :aria-label="$t('上一个匹配')" @click="findNext(true)"&gt;&lt;ArrowUp :size="15"/&gt;&lt;/button&gt;&lt;button :title="$t('下一个')…</code> |
| [504](../src/CodeEditor.vue:504) | 界面文案 | 上一个匹配 | <code>…vent="findNext($event.shiftKey)"&gt;&lt;span class="editor-find-actions"&gt;&lt;button :title="$t('上一个')" :aria-label="$t('上一个匹配')" @click="findNext(true)"&gt;&lt;ArrowUp :size="15"/&gt;&lt;/button&gt;&lt;button :title="$t('下一个')" :aria-label="$t('下一个匹配')…</code> |
| [504](../src/CodeEditor.vue:504) | 界面文案 | 下一个 | <code>…$t('上一个')" :aria-label="$t('上一个匹配')" @click="findNext(true)"&gt;&lt;ArrowUp :size="15"/&gt;&lt;/button&gt;&lt;button :title="$t('下一个')" :aria-label="$t('下一个匹配')" @click="findNext()"&gt;&lt;ArrowDown :size="15"/&gt;&lt;/button&gt;&lt;button :title="$t('关闭查找')"…</code> |
| [504](../src/CodeEditor.vue:504) | 界面文案 | 下一个匹配 | <code>…$t('上一个匹配')" @click="findNext(true)"&gt;&lt;ArrowUp :size="15"/&gt;&lt;/button&gt;&lt;button :title="$t('下一个')" :aria-label="$t('下一个匹配')" @click="findNext()"&gt;&lt;ArrowDown :size="15"/&gt;&lt;/button&gt;&lt;button :title="$t('关闭查找')" :aria-label="$t('关闭查找')"…</code> |
| [504](../src/CodeEditor.vue:504) | 界面文案 | 关闭查找 | <code>…"$t('下一个匹配')" @click="findNext()"&gt;&lt;ArrowDown :size="15"/&gt;&lt;/button&gt;&lt;button :title="$t('关闭查找')" :aria-label="$t('关闭查找')" @click="closeFind"&gt;&lt;X :size="15"/&gt;&lt;/button&gt;&lt;/span&gt;&lt;/div&gt;</code> |
| [506](../src/CodeEditor.vue:506) | 界面文案 | 替换为 | <code>…ps.previewOnly" class="editor-find-row"&gt;&lt;input v-model="replaceText" :aria-label="$t('替换为')" :placeholder="$t('替换为')" @keydown.enter.prevent="replaceFound()"&gt;&lt;span class="editor-find-actions"&gt;&lt;button @click="replaceFound()"…</code> |
| [506](../src/CodeEditor.vue:506) | 界面文案 | 替换 | <code>…eydown.enter.prevent="replaceFound()"&gt;&lt;span class="editor-find-actions"&gt;&lt;button @click="replaceFound()"&gt;{{ $t('替换') }}&lt;/button&gt;&lt;button @click="replaceFound(true)"&gt;{{ $t('全部替换') }}&lt;/button&gt;&lt;/span&gt;&lt;/div&gt;</code> |
| [506](../src/CodeEditor.vue:506) | 界面文案 | 全部替换 | <code>…ind-actions"&gt;&lt;button @click="replaceFound()"&gt;{{ $t('替换') }}&lt;/button&gt;&lt;button @click="replaceFound(true)"&gt;{{ $t('全部替换') }}&lt;/button&gt;&lt;/span&gt;&lt;/div&gt;</code> |
| [507](../src/CodeEditor.vue:507) | 界面文案 | 高级搜索 | <code>&lt;details class="editor-find-advanced"&gt;&lt;summary&gt;&lt;ChevronRight :size="13" aria-hidden="true"/&gt;{{ $t('高级搜索') }}&lt;span class="editor-find-status" role="status"&gt;{{ findStatus }}&lt;/span&gt;&lt;/summary&gt;&lt;div class="editor-find-options"&gt;</code> |
| [508](../src/CodeEditor.vue:508) | 界面文案 | 区分大小写 | <code>&lt;label&gt;&lt;input v-model="findCase" type="checkbox"&gt;{{ $t('区分大小写') }}&lt;/label&gt;</code> |
| [509](../src/CodeEditor.vue:509) | 界面文案 | 正则表达式 | <code>&lt;label&gt;&lt;input v-model="findRegexp" type="checkbox" @change="findRegexp &amp;&amp; (findWildcard = false)"&gt;{{ $t('正则表达式') }}&lt;/label&gt;</code> |
| [510](../src/CodeEditor.vue:510) | 界面文案 | 使用通配符 | <code>&lt;label&gt;&lt;input v-model="findWildcard" type="checkbox" @change="findWildcard &amp;&amp; (findRegexp = false)"&gt;{{ $t('使用通配符') }}&lt;/label&gt;</code> |
| [511](../src/CodeEditor.vue:511) | 界面文案 | 忽略空格 | <code>&lt;label&gt;&lt;input v-model="findIgnoreSpaces" type="checkbox"&gt;{{ $t('忽略空格') }}&lt;/label&gt;</code> |
| [512](../src/CodeEditor.vue:512) | 界面文案 | 忽略标点符号 | <code>&lt;label&gt;&lt;input v-model="findIgnorePunctuation" type="checkbox"&gt;{{ $t('忽略标点符号') }}&lt;/label&gt;</code> |
| [513](../src/CodeEditor.vue:513) | 界面文案 | 区分全角/半角 | <code>&lt;label&gt;&lt;input v-model="findWidth" type="checkbox"&gt;{{ $t('区分全角/半角') }}&lt;/label&gt;</code> |
| [517](../src/CodeEditor.vue:517) | 界面文案 | 关闭图片预览 | <code>…e-preview-size"&gt;{{ previewImageSize }}&lt;/div&gt;&lt;button type="button" class="image-preview-close" :aria-label="$t('关闭图片预览')" @click="previewImageSrc = ''"&gt;&lt;X :size="19"/&gt;&lt;/button&gt;&lt;div class="image-preview-stage"&gt;&lt;img :src="preview…</code> |
| [517](../src/CodeEditor.vue:517) | 界面文案 | 图片预览 | <code>…wImageSrc = ''"&gt;&lt;X :size="19"/&gt;&lt;/button&gt;&lt;div class="image-preview-stage"&gt;&lt;img :src="previewImageSrc" :alt="$t('图片预览')" :style="{ transform: &#96;scale(${previewImageZoom})&#96; }" @load="previewImageSize = &#96;${($event.target as HTMLI…</code> |
| [517](../src/CodeEditor.vue:517) | 界面文案 | 缩小图片 | <code>…mageElement).naturalHeight}&#96;"&gt;&lt;/div&gt;&lt;div class="image-preview-controls"&gt;&lt;button type="button" :aria-label="$t('缩小图片')" @click="previewImageZoom = Math.max(0.25, previewImageZoom - 0.25)"&gt;−&lt;/button&gt;&lt;span&gt;{{ Math.round(preview…</code> |
| [517](../src/CodeEditor.vue:517) | 界面文案 | − | <code>…on type="button" :aria-label="$t('缩小图片')" @click="previewImageZoom = Math.max(0.25, previewImageZoom - 0.25)"&gt;−&lt;/button&gt;&lt;span&gt;{{ Math.round(previewImageZoom * 100) }}%&lt;/span&gt;&lt;button type="button" :aria-label="$t('放大图片')"…</code> |
| [517](../src/CodeEditor.vue:517) | 界面文案 | % | <code>…wImageZoom = Math.max(0.25, previewImageZoom - 0.25)"&gt;−&lt;/button&gt;&lt;span&gt;{{ Math.round(previewImageZoom * 100) }}%&lt;/span&gt;&lt;button type="button" :aria-label="$t('放大图片')" @click="previewImageZoom = Math.min(4, previewImageZoom…</code> |
| [517](../src/CodeEditor.vue:517) | 界面文案 | 放大图片 | <code>…0.25)"&gt;−&lt;/button&gt;&lt;span&gt;{{ Math.round(previewImageZoom * 100) }}%&lt;/span&gt;&lt;button type="button" :aria-label="$t('放大图片')" @click="previewImageZoom = Math.min(4, previewImageZoom + 0.25)"&gt;＋&lt;/button&gt;&lt;button type="button" :aria-la…</code> |
| [517](../src/CodeEditor.vue:517) | 界面文案 | ＋ | <code>…utton type="button" :aria-label="$t('放大图片')" @click="previewImageZoom = Math.min(4, previewImageZoom + 0.25)"&gt;＋&lt;/button&gt;&lt;button type="button" :aria-label="$t('重置图片大小')" @click="previewImageZoom = 1"&gt;&lt;RotateCcw :size="16"/…</code> |
| [517](../src/CodeEditor.vue:517) | 界面文案 | 重置图片大小 | <code>…ick="previewImageZoom = Math.min(4, previewImageZoom + 0.25)"&gt;＋&lt;/button&gt;&lt;button type="button" :aria-label="$t('重置图片大小')" @click="previewImageZoom = 1"&gt;&lt;RotateCcw :size="16"/&gt;&lt;/button&gt;&lt;/div&gt;&lt;/div&gt;</code> |

<a id="src-documents-exportdialog-vue"></a>

## src/documents/ExportDialog.vue

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [14](../src/documents/ExportDialog.vue:14) | 文案定义／其他 | 分享 | <code>const tabs = computed(()=&gt;[...exportFormats, { kind: 'share' as const, label: '分享' }])</code> |
| [63](../src/documents/ExportDialog.vue:63) | 界面文案 | 导出文件 | <code>&lt;div class="export-preview-modal" role="dialog" aria-modal="true" :aria-label="$t('导出文件')"&gt;</code> |
| [64](../src/documents/ExportDialog.vue:64) | 界面文案 | ESC | <code>…ame.split('/').pop() : exportFilename(filename, kind) }}&lt;/span&gt;&lt;span class="reference-esc" aria-hidden="true"&gt;ESC&lt;/span&gt;&lt;/div&gt;</code> |
| [65](../src/documents/ExportDialog.vue:65) | 界面文案 | 导出格式 | <code>&lt;div class="export-tabs-section"&gt;&lt;div class="reference-tabs export-format-tabs" role="tablist" :aria-label="$t('导出格式')"&gt;</code> |
| [69](../src/documents/ExportDialog.vue:69) | 界面文案 | 重新生成 | <code>&lt;div v-if="error" class="export-preview-status" role="alert"&gt;&lt;p&gt;{{ error }}&lt;/p&gt;&lt;button @click="retry"&gt;{{ $t('重新生成') }}&lt;/button&gt;&lt;button v-if="current?.owner &amp;&amp; !kind.startsWith('plugin:')" @click="skipFailedPlugin"&gt;{{ $t('跳过此插件后重试') }}&lt;/button&gt;&lt;/div&gt;</code> |
| [69](../src/documents/ExportDialog.vue:69) | 界面文案 | 跳过此插件后重试 | <code>&lt;div v-if="error" class="export-preview-status" role="alert"&gt;&lt;p&gt;{{ error }}&lt;/p&gt;&lt;button @click="retry"&gt;{{ $t('重新生成') }}&lt;/button&gt;&lt;button v-if="current?.owner &amp;&amp; !kind.startsWith('plugin:')" @click="skipFailedPlugin"&gt;{{ $t('跳过此插件后重试') }}&lt;/button&gt;&lt;/div&gt;</code> |
| [73](../src/documents/ExportDialog.vue:73) | 界面文案 | 正在生成预览… | <code>&lt;div v-if="loading" class="export-preview-loading" role="status"&gt;{{ $t('正在生成预览…') }}&lt;/div&gt;</code> |
| [77](../src/documents/ExportDialog.vue:77) | 界面文案 | 正在导出… | <code>&lt;div v-else class="export-preview-footer"&gt;&lt;span class="export-preview-details"&gt;{{ details }}&lt;/span&gt;&lt;button :disabled="!canSave" @click="emit('download', kind)"&gt;{{ busy ? $t('正在导出…') : &#96;${$t('导出')} ${$t(selected.label)}&#96; }}&lt;/button&gt;&lt;/div&gt;</code> |
| [77](../src/documents/ExportDialog.vue:77) | 界面文案 | ${$t('导出')} ${$t(selected.label)} | <code>&lt;div v-else class="export-preview-footer"&gt;&lt;span class="export-preview-details"&gt;{{ details }}&lt;/span&gt;&lt;button :disabled="!canSave" @click="emit('download', kind)"&gt;{{ busy ? $t('正在导出…') : &#96;${$t('导出')} ${$t(selected.label)}&#96; }}&lt;/button&gt;&lt;/div&gt;</code> |

<a id="src-documents-exportpreview-ts"></a>

## src/documents/exportPreview.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [7](../src/documents/exportPreview.ts:7) | 文案定义／其他 | HTML | <code>{ kind: 'html', label: 'HTML' }, { kind: 'pdf', label: 'PDF' },</code> |
| [7](../src/documents/exportPreview.ts:7) | 文案定义／其他 | PDF | <code>{ kind: 'html', label: 'HTML' }, { kind: 'pdf', label: 'PDF' },</code> |
| [8](../src/documents/exportPreview.ts:8) | 文案定义／其他 | Word | <code>{ kind: 'docx', label: 'Word' }, { kind: 'png', label: 'PNG' }, { kind: 'txt', label: '纯文本' },</code> |
| [8](../src/documents/exportPreview.ts:8) | 文案定义／其他 | PNG | <code>{ kind: 'docx', label: 'Word' }, { kind: 'png', label: 'PNG' }, { kind: 'txt', label: '纯文本' },</code> |
| [8](../src/documents/exportPreview.ts:8) | 文案定义／其他 | 纯文本 | <code>{ kind: 'docx', label: 'Word' }, { kind: 'png', label: 'PNG' }, { kind: 'txt', label: '纯文本' },</code> |
| [12](../src/documents/exportPreview.ts:12) | 文案定义／其他 | 文件 | <code>const name = path.split(/[\\/]/).pop() &#124;&#124; '文件'</code> |
| [26](../src/documents/exportPreview.ts:26) | 文案定义／其他 | ${t('自定义')} · ${Number(size.width.toFixed(1))} × ${Number(size.height.toFixed(1))} mm | <code>return &#96;${t('自定义')} · ${Number(size.width.toFixed(1))} × ${Number(size.height.toFixed(1))} mm&#96;</code> |

<a id="src-documents-exportpreviewpane-vue"></a>

## src/documents/ExportPreviewPane.vue

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [31](../src/documents/ExportPreviewPane.vue:31) | 文案定义／其他 | :host{display:flex;justify-content:center;align-items:flex-start}.docx-wrapper{background:transparent!important;padding:0!important;width:max-content;gap:20px}.docx-wrapper&gt;section{margin:0!important;box-shadow:0 2px 12px #00000014,0 0 1px #0000001f!important} | <code>style.textContent = ':host{display:flex;justify-content:center;align-items:flex-start}.docx-wrapper{background:transparent!important;padding:0!important;width:max-content;gap:20px}.docx-wrapper&gt;section{margin:0!important;box-shadow:0 2px 12px #00000014,0 0 1px #0000001f!important}'</code> |
| [51](../src/documents/ExportPreviewPane.vue:51) | 界面文案 | 导出预览 | <code>&lt;iframe v-if="artifact.kind === 'html' &#124;&#124; artifact.previewHtml" ref="frame" @load="frameLoaded" class="export-preview-frame" :srcdoc="artifact.previewHtml &#124;&#124; artifact.body" sandbox="allow-same-origin" :title="$t('导出预览')"/&gt;</code> |
| [54](../src/documents/ExportPreviewPane.vue:54) | 界面文案 | 导出预览 | <code>&lt;div v-else-if="artifact.kind === 'png'" class="export-pages-preview export-image-preview"&gt;&lt;img :src="url" :alt="$t('导出预览')" @load="imageLoaded" @error="emit('error', $t('图片预览加载失败'))"/&gt;&lt;/div&gt;</code> |
| [54](../src/documents/ExportPreviewPane.vue:54) | 界面文案 | 图片预览加载失败 | <code>&lt;div v-else-if="artifact.kind === 'png'" class="export-pages-preview export-image-preview"&gt;&lt;img :src="url" :alt="$t('导出预览')" @load="imageLoaded" @error="emit('error', $t('图片预览加载失败'))"/&gt;&lt;/div&gt;</code> |

<a id="src-documents-exportrendering-ts"></a>

## src/documents/exportRendering.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [28](../src/documents/exportRendering.ts:28) | 文案定义／其他 | 图表 | <code>const image = document.createElement('img'); image.src = await svgToPng(svg); image.alt = '图表'; const box = (svg.getAttribute('viewBox') &#124;&#124; '').split(/[ ,]+/).map(Number); if (box[2] &amp;&amp; box[3]) { image.…</code> |

<a id="src-documents-frontmatter-ts"></a>

## src/documents/frontmatter.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [11](../src/documents/frontmatter.ts:11) | 文案定义／其他 | YAML 格式有误，请在源代码视图修改 | <code>if (document.errors.length) return { section, fields: [], error: 'YAML 格式有误，请在源代码视图修改' }</code> |
| [12](../src/documents/frontmatter.ts:12) | 文案定义／其他 | 属性需要使用键值格式 | <code>if (document.contents &amp;&amp; !isMap(document.contents)) return { section, fields: [], error: '属性需要使用键值格式' }</code> |
| [18](../src/documents/frontmatter.ts:18) | 文案定义／其他 | 文件属性区已移除 | <code>if (!section) throw new Error('文件属性区已移除')</code> |
| [20](../src/documents/frontmatter.ts:20) | 文案定义／其他 | 请先在源代码视图修正 YAML | <code>if (document.errors.length &#124;&#124; (document.contents &amp;&amp; !isMap(document.contents))) throw new Error('请先在源代码视图修正 YAML')</code> |
| [26](../src/documents/frontmatter.ts:26) | 文案定义／其他 | 属性名不能为空 | <code>if (!rename.trim()) throw new Error('属性名不能为空')</code> |
| [27](../src/documents/frontmatter.ts:27) | 文案定义／其他 | 已有同名属性 | <code>if (rename !== key &amp;&amp; document.has(rename)) throw new Error('已有同名属性')</code> |
| [37](../src/documents/frontmatter.ts:37) | 文案定义／其他 | 属性值的 YAML 格式有误 | <code>if (parsed.errors.length) throw new Error('属性值的 YAML 格式有误')</code> |

<a id="src-documents-imageproperties-ts"></a>

## src/documents/imageProperties.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [31](../src/documents/imageProperties.ts:31) | 文案定义／其他 | 图片说明不能包含 ] 或换行 | <code>if (draft.alt.includes(']') &#124;&#124; /[\r\n]/.test(draft.alt)) throw new Error('图片说明不能包含 ] 或换行')</code> |
| [32](../src/documents/imageProperties.ts:32) | 文案定义／其他 | 请填写可用的图片路径 | <code>if (!draft.path &#124;&#124; /[)\r\n]/.test(draft.path)) throw new Error('请填写可用的图片路径')</code> |
| [33](../src/documents/imageProperties.ts:33) | 文案定义／其他 | 图片标题不能包含引号或换行 | <code>if (draft.title.includes('"') &#124;&#124; /[\r\n]/.test(draft.title)) throw new Error('图片标题不能包含引号或换行')</code> |
| [34](../src/documents/imageProperties.ts:34) | 文案定义／其他 | 图片宽度需在 16–2000 px 之间 | <code>if (draft.width !== null &amp;&amp; (!Number.isInteger(draft.width) &#124;&#124; draft.width &lt; 16 &#124;&#124; draft.width &gt; 2000)) throw new Error('图片宽度需在 16–2000 px 之间')</code> |

<a id="src-documents-personalitems-ts"></a>

## src/documents/personalItems.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [5](../src/documents/personalItems.ts:5) | 文案定义／其他 | 文件标题 | <code>{ key: 'title', get label() { return t('文件标题') } },</code> |
| [6](../src/documents/personalItems.ts:6) | 文案定义／其他 | 文件名 | <code>{ key: 'filename', get label() { return t('文件名') } },</code> |
| [7](../src/documents/personalItems.ts:7) | 文案定义／其他 | 当前日期 | <code>{ key: 'date', get label() { return t('当前日期') } },</code> |
| [8](../src/documents/personalItems.ts:8) | 文案定义／其他 | 当前时间 | <code>{ key: 'time', get label() { return t('当前时间') } },</code> |
| [9](../src/documents/personalItems.ts:9) | 文案定义／其他 | 日期与时间 | <code>{ key: 'datetime', get label() { return t('日期与时间') } },</code> |
| [10](../src/documents/personalItems.ts:10) | 文案定义／其他 | 年份 | <code>{ key: 'year', get label() { return t('年份') } },</code> |
| [11](../src/documents/personalItems.ts:11) | 文案定义／其他 | 月份 | <code>{ key: 'month', get label() { return t('月份') } },</code> |
| [12](../src/documents/personalItems.ts:12) | 文案定义／其他 | 日期 | <code>{ key: 'day', get label() { return t('日期') } },</code> |
| [13](../src/documents/personalItems.ts:13) | 文案定义／其他 | 星期 | <code>{ key: 'weekday', get label() { return t('星期') } },</code> |
| [14](../src/documents/personalItems.ts:14) | 文案定义／其他 | Unix 时间戳 | <code>{ key: 'timestamp', get label() { return t('Unix 时间戳') } },</code> |
| [15](../src/documents/personalItems.ts:15) | 文案定义／其他 | 随机 UUID | <code>{ key: 'uuid', get label() { return t('随机 UUID') } }</code> |
| [22](../src/documents/personalItems.ts:22) | 文案定义／其他 | 星期日 | <code>…), month: String(now.getMonth() + 1).padStart(2, '0'), day: String(now.getDate()).padStart(2, '0'), weekday: ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'][now.getDay()], timestamp: String(Math.floor(now.getTime() / 1000)), uu…</code> |
| [22](../src/documents/personalItems.ts:22) | 文案定义／其他 | 星期一 | <code>…th: String(now.getMonth() + 1).padStart(2, '0'), day: String(now.getDate()).padStart(2, '0'), weekday: ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'][now.getDay()], timestamp: String(Math.floor(now.getTime() / 1000)), uuid: cr…</code> |
| [22](../src/documents/personalItems.ts:22) | 文案定义／其他 | 星期二 | <code>…ring(now.getMonth() + 1).padStart(2, '0'), day: String(now.getDate()).padStart(2, '0'), weekday: ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'][now.getDay()], timestamp: String(Math.floor(now.getTime() / 1000)), uuid: crypto.r…</code> |
| [22](../src/documents/personalItems.ts:22) | 文案定义／其他 | 星期三 | <code>…ow.getMonth() + 1).padStart(2, '0'), day: String(now.getDate()).padStart(2, '0'), weekday: ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'][now.getDay()], timestamp: String(Math.floor(now.getTime() / 1000)), uuid: crypto.randomU…</code> |
| [22](../src/documents/personalItems.ts:22) | 文案定义／其他 | 星期四 | <code>…Month() + 1).padStart(2, '0'), day: String(now.getDate()).padStart(2, '0'), weekday: ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'][now.getDay()], timestamp: String(Math.floor(now.getTime() / 1000)), uuid: crypto.randomUUID()…</code> |
| [22](../src/documents/personalItems.ts:22) | 文案定义／其他 | 星期五 | <code>…) + 1).padStart(2, '0'), day: String(now.getDate()).padStart(2, '0'), weekday: ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'][now.getDay()], timestamp: String(Math.floor(now.getTime() / 1000)), uuid: crypto.randomUUID() }</code> |
| [22](../src/documents/personalItems.ts:22) | 文案定义／其他 | 星期六 | <code>….padStart(2, '0'), day: String(now.getDate()).padStart(2, '0'), weekday: ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'][now.getDay()], timestamp: String(Math.floor(now.getTime() / 1000)), uuid: crypto.randomUUID() }</code> |
| [27](../src/documents/personalItems.ts:27) | 文案定义／其他 | 未命名文件.md | <code>const resolved = renderTemplate(name, '未命名文件.md', now).trim()</code> |
| [28](../src/documents/personalItems.ts:28) | 文案定义／其他 | 未命名文件 | <code>.replace(/[\x00-\x1f&lt;&gt;:"/\\&#124;?*]/g, '-').replace(/[. ]+$/, '') &#124;&#124; '未命名文件'</code> |

<a id="src-documents-spelldictionaries-ts"></a>

## src/documents/spellDictionaries.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [29](../src/documents/spellDictionaries.ts:29) | 文案定义／其他 | 词典文件内容无效 | <code>if (!name.trim() &#124;&#124; !aff.trim() &#124;&#124; !/^\s*\d+\s*\r?\n/.test(dic)) throw new Error('词典文件内容无效')</code> |
| [30](../src/documents/spellDictionaries.ts:30) | 文案定义／其他 | 词典超过 30 MB 限制 | <code>if (aff.length + dic.length &gt; 30_000_000) throw new Error('词典超过 30 MB 限制')</code> |
| [49](../src/documents/spellDictionaries.ts:49) | 文案定义／其他 | 请在拼写检查设置中添加同名的 .dic 和 .aff 文件 | <code>if (!dictionaries.length) throw new Error('请在拼写检查设置中添加同名的 .dic 和 .aff 文件')</code> |

<a id="src-documents-untitleddocument-ts"></a>

## src/documents/untitledDocument.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [5](../src/documents/untitledDocument.ts:5) | 文案定义／其他 | 未命名文件.md | <code>return { id: &#96;untitled:${crypto.randomUUID()}&#96;, path: '未命名文件.md', content, loaded: true, temporary: true, created: now, updated: now }</code> |

<a id="src-documents-usedocumentexport-ts"></a>

## src/documents/useDocumentExport.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [48](../src/documents/useDocumentExport.ts:48) | 文案定义／其他 | 无法读取图片，请检查路径：${source &#124;&#124; '空路径'} | <code>if (!source &#124;&#124; /^(?:https?:&#124;file:)/i.test(source)) throw new Error(&#96;无法读取图片，请检查路径：${source &#124;&#124; '空路径'}&#96;)</code> |
| [49](../src/documents/useDocumentExport.ts:49) | 文案定义／其他 | 请在桌面版打开图片所在文件夹后导出 | <code>if (!activeDoc.value.relativePath &#124;&#124; !isTauri) throw new Error('请在桌面版打开图片所在文件夹后导出')</code> |
| [52](../src/documents/useDocumentExport.ts:52) | 文案定义／其他 | 文件 | <code>const title = activeDoc.value.path.split('/').pop() &#124;&#124; '文件'</code> |
| [82](../src/documents/useDocumentExport.ts:82) | 文案定义／其他 | 请填写自定义纸张宽度和高度 | <code>if (exportPageSize.value === 'custom' &amp;&amp; (!exportPageWidth.value &#124;&#124; !exportPageHeight.value)) throw new Error('请填写自定义纸张宽度和高度')</code> |
| [102](../src/documents/useDocumentExport.ts:102) | 文案定义／其他 | 此格式需要在桌面版导出 | <code>if (!isTauri) throw new Error(t('此格式需要在桌面版导出'))</code> |
| [106](../src/documents/useDocumentExport.ts:106) | 文案定义／其他 | 导出组件已更新，请重启应用后预览 | <code>if (/Command render_export_preview not found/.test(String(error))) throw new Error(t('导出组件已更新，请重启应用后预览'))</code> |
| [124](../src/documents/useDocumentExport.ts:124) | 文案定义／其他 | 文件 | <code>const filename = activeDoc.value.path.split('/').pop() &#124;&#124; '文件'</code> |
| [125](../src/documents/useDocumentExport.ts:125) | 文案定义／其他 | 此格式需要在桌面版导出 | <code>if (['pdf', 'docx', 'png'].includes(kind) &amp;&amp; !isTauri) throw new Error('此格式需要在桌面版导出')</code> |
| [136](../src/documents/useDocumentExport.ts:136) | 文案定义／其他 | 已导出 | <code>showExport.value = false; notify(t('已导出'))</code> |
| [137](../src/documents/useDocumentExport.ts:137) | 文案定义／其他 | 导出失败：{0} | <code>} catch (error) { notify(t('导出失败：{0}', { "0": String(error) })) }</code> |

<a id="src-documents-usedocumenttools-ts"></a>

## src/documents/useDocumentTools.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [56](../src/documents/useDocumentTools.ts:56) | 文案定义／其他 | 图片显示设置保存失败 | <code>watch(displayImageWidths, value =&gt; { try { localStorage.setItem('markart-image-widths-v1', JSON.stringify(value)) } catch { notify(t('图片显示设置保存失败')) } }, { deep: true })</code> |
| [58](../src/documents/useDocumentTools.ts:58) | 文案定义／其他 | 请先选择 Markdown 文件 | <code>if (!markdownActive.value) return notify(t('请先选择 Markdown 文件'))</code> |
| [60](../src/documents/useDocumentTools.ts:60) | 文案定义／其他 | 请将光标放在图片所在行；复杂图片语法可在源代码中修改 | <code>if (!draft) return notify(t('请将光标放在图片所在行；复杂图片语法可在源代码中修改'))</code> |
| [66](../src/documents/useDocumentTools.ts:66) | 文案定义／其他 | 文件已修改，请重新打开图片属性 | <code>if (!draft &#124;&#124; imagePropertyDocId.value !== activeId.value &#124;&#124; content.value.slice(draft.from, draft.to) !== draft.original) return notify(t('文件已修改，请重新打开图片属性'))</code> |
| [77](../src/documents/useDocumentTools.ts:77) | 文案定义／其他 | 图片属性修改失败：{0} | <code>} catch (error) { notify(t('图片属性修改失败：{0}', { "0": String(error) })) }</code> |
| [92](../src/documents/useDocumentTools.ts:92) | 文案定义／其他 | 只能在同级章节之间移动 | <code>if (!preview) return notify(t('只能在同级章节之间移动'))</code> |
| [134](../src/documents/useDocumentTools.ts:134) | 文案定义／其他 | 文件已修改，请重新拖动章节 | <code>if (!sectionMovePreview.value &#124;&#124; sectionMoveDocId.value !== activeId.value &#124;&#124; sectionMoveSource.value !== content.value) return notify(t('文件已修改，请重新拖动章节'))</code> |

<a id="src-documents-uselanshare-ts"></a>

## src/documents/useLanShare.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [66](../src/documents/useLanShare.ts:66) | 文案定义／其他 | 分享失败：{0} | <code>options.notify(t('分享失败：{0}', { "0": String(error) }))</code> |
| [71](../src/documents/useLanShare.ts:71) | 文案定义／其他 | 已复制 | <code>try { await navigator.clipboard.writeText(shareUrl.value); options.notify(t('已复制')) }</code> |
| [72](../src/documents/useLanShare.ts:72) | 文案定义／其他 | 链接复制失败，请手动复制地址 | <code>catch { options.notify(t('链接复制失败，请手动复制地址')) }</code> |

<a id="src-documents-usepersonalitems-ts"></a>

## src/documents/usePersonalItems.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [23](../src/documents/usePersonalItems.ts:23) | 文案定义／其他 | 新模板 | <code>const item: PersonalItem = { id: crypto.randomUUID(), name: settingTab.value === 'templates' ? '新模板' : '新片段', content: '' }</code> |
| [23](../src/documents/usePersonalItems.ts:23) | 文案定义／其他 | 新片段 | <code>const item: PersonalItem = { id: crypto.randomUUID(), name: settingTab.value === 'templates' ? '新模板' : '新片段', content: '' }</code> |

<a id="src-documents-usespellcheck-ts"></a>

## src/documents/useSpellcheck.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [25](../src/documents/useSpellcheck.ts:25) | 文案定义／其他 | 请选择文件名相同的 .dic 和 .aff 文件 | <code>if (!dic &#124;&#124; !aff &#124;&#124; dic.name.replace(/\.dic$/i, '') !== aff.name.replace(/\.aff$/i, '')) return notify(t('请选择文件名相同的 .dic 和 .aff 文件'))</code> |
| [28](../src/documents/useSpellcheck.ts:28) | 文案定义／其他 | 词典添加失败：{0} | <code>catch (error) { notify(t('词典添加失败：{0}', { "0": String(error) })) }</code> |
| [32](../src/documents/useSpellcheck.ts:32) | 文案定义／其他 | 请填写可直接下载文件的 HTTPS 地址 | <code>if (!/^https:\/\//i.test(dictionaryRawDic.value) &#124;&#124; !/^https:\/\//i.test(dictionaryRawAff.value)) return notify(t('请填写可直接下载文件的 HTTPS 地址'))</code> |
| [36](../src/documents/useSpellcheck.ts:36) | 文案定义／其他 | 下载地址不可用 | <code>if (!dicResponse.ok &#124;&#124; !affResponse.ok) throw new Error('下载地址不可用')</code> |
| [38](../src/documents/useSpellcheck.ts:38) | 文案定义／其他 | 下载词典 | <code>const name = new URL(dictionaryRawDic.value).pathname.split('/').pop()?.replace(/\.dic$/i, '') &#124;&#124; '下载词典'</code> |
| [40](../src/documents/useSpellcheck.ts:40) | 文案定义／其他 | 词典下载失败：{0} | <code>} catch (error) { notify(t('词典下载失败：{0}', { "0": String(error) })) }</code> |
| [50](../src/documents/useSpellcheck.ts:50) | 文案定义／其他 | 请在设置中启用拼写检查 | <code>if (!spellcheckEnabled.value) return notify(t('请在设置中启用拼写检查'))</code> |
| [60](../src/documents/useSpellcheck.ts:60) | 文案定义／其他 | 拼写检查失败：{0} | <code>} catch (error) { notify(t('拼写检查失败：{0}', { "0": String(error) })) }</code> |
| [63](../src/documents/useSpellcheck.ts:63) | 文案定义／其他 | 文件已修改，请重新检查拼写 | <code>if (spellDocId.value !== activeId.value &#124;&#124; spellSource.value !== content.value) return notify(t('文件已修改，请重新检查拼写'))</code> |

<a id="src-documents-wordexport-ts"></a>

## src/documents/wordExport.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [9](../src/documents/wordExport.ts:9) | 文案定义／其他 | [图片] | <code>if (!source.startsWith('data:image/')) return new TextRun(element.getAttribute('alt') &#124;&#124; '[图片]')</code> |

<a id="src-editor-diagramconnections-ts"></a>

## src/editor/diagramConnections.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [22](../src/editor/diagramConnections.ts:22) | 文案定义／其他 | 此连接使用了复杂语法，请在源码视图中修改 | <code>catch { report('此连接使用了复杂语法，请在源码视图中修改') }</code> |
| [24](../src/editor/diagramConnections.ts:24) | 文案定义／其他 | 连接：{0} → {1} | <code>…); path.setAttribute('tabindex', '0'); path.setAttribute('role', 'button'); path.setAttribute('aria-label', t('连接：{0} → {1}', { "0": nodes.find(node =&gt; node.id === edge.start)?.label, "1": nodes.find(node =&gt; node.id === edge.end)?.l…</code> |

<a id="src-editor-diagramcontrols-ts"></a>

## src/editor/diagramControls.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [9](../src/editor/diagramControls.ts:9) | 文案定义／其他 | 图表方向 | <code>const toolbar = document.createElement('div'); toolbar.className = 'cm-diagram-toolbar'; toolbar.hidden = true; toolbar.contentEditable = 'false'; toolbar.setAttribute('role', 'toolbar'); toolbar.setAttribute('aria-label', t('图表方向'))</code> |
| [10](../src/editor/diagramControls.ts:10) | 文案定义／其他 | 向右展开 | <code>const names = ['向右展开', '向左展开', '向下展开', '向上展开']</code> |
| [10](../src/editor/diagramControls.ts:10) | 文案定义／其他 | 向左展开 | <code>const names = ['向右展开', '向左展开', '向下展开', '向上展开']</code> |
| [10](../src/editor/diagramControls.ts:10) | 文案定义／其他 | 向下展开 | <code>const names = ['向右展开', '向左展开', '向下展开', '向上展开']</code> |
| [10](../src/editor/diagramControls.ts:10) | 文案定义／其他 | 向上展开 | <code>const names = ['向右展开', '向左展开', '向下展开', '向上展开']</code> |

<a id="src-editor-diagramediting-ts"></a>

## src/editor/diagramEditing.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [90](../src/editor/diagramEditing.ts:90) | 文案定义／其他 | 矩形 | <code>['rect', '矩形'], ['rounded', '圆角矩形'], ['stadium', '起止'], ['diam', '判断'],</code> |
| [90](../src/editor/diagramEditing.ts:90) | 文案定义／其他 | 圆角矩形 | <code>['rect', '矩形'], ['rounded', '圆角矩形'], ['stadium', '起止'], ['diam', '判断'],</code> |
| [90](../src/editor/diagramEditing.ts:90) | 文案定义／其他 | 起止 | <code>['rect', '矩形'], ['rounded', '圆角矩形'], ['stadium', '起止'], ['diam', '判断'],</code> |
| [90](../src/editor/diagramEditing.ts:90) | 文案定义／其他 | 判断 | <code>['rect', '矩形'], ['rounded', '圆角矩形'], ['stadium', '起止'], ['diam', '判断'],</code> |
| [91](../src/editor/diagramEditing.ts:91) | 文案定义／其他 | 圆形 | <code>['circle', '圆形'], ['dbl-circ', '双圆'], ['subproc', '子流程'], ['cyl', '数据库'],</code> |
| [91](../src/editor/diagramEditing.ts:91) | 文案定义／其他 | 双圆 | <code>['circle', '圆形'], ['dbl-circ', '双圆'], ['subproc', '子流程'], ['cyl', '数据库'],</code> |
| [91](../src/editor/diagramEditing.ts:91) | 文案定义／其他 | 子流程 | <code>['circle', '圆形'], ['dbl-circ', '双圆'], ['subproc', '子流程'], ['cyl', '数据库'],</code> |
| [91](../src/editor/diagramEditing.ts:91) | 文案定义／其他 | 数据库 | <code>['circle', '圆形'], ['dbl-circ', '双圆'], ['subproc', '子流程'], ['cyl', '数据库'],</code> |
| [92](../src/editor/diagramEditing.ts:92) | 文案定义／其他 | 六边形 | <code>['hex', '六边形'], ['lean-r', '平行四边形'], ['lean-l', '反向平行四边形'],</code> |
| [92](../src/editor/diagramEditing.ts:92) | 文案定义／其他 | 平行四边形 | <code>['hex', '六边形'], ['lean-r', '平行四边形'], ['lean-l', '反向平行四边形'],</code> |
| [92](../src/editor/diagramEditing.ts:92) | 文案定义／其他 | 反向平行四边形 | <code>['hex', '六边形'], ['lean-r', '平行四边形'], ['lean-l', '反向平行四边形'],</code> |
| [93](../src/editor/diagramEditing.ts:93) | 文案定义／其他 | 梯形 | <code>['trap-b', '梯形'], ['trap-t', '倒梯形'], ['odd', '旗形'],</code> |
| [93](../src/editor/diagramEditing.ts:93) | 文案定义／其他 | 倒梯形 | <code>['trap-b', '梯形'], ['trap-t', '倒梯形'], ['odd', '旗形'],</code> |
| [93](../src/editor/diagramEditing.ts:93) | 文案定义／其他 | 旗形 | <code>['trap-b', '梯形'], ['trap-t', '倒梯形'], ['odd', '旗形'],</code> |
| [94](../src/editor/diagramEditing.ts:94) | 文案定义／其他 | 文件 | <code>['doc', '文件'], ['docs', '多文件'], ['cloud', '云形'], ['delay', '延迟'], ['tri', '三角形'], ['sl-rect', '手动输入'],</code> |
| [94](../src/editor/diagramEditing.ts:94) | 文案定义／其他 | 多文件 | <code>['doc', '文件'], ['docs', '多文件'], ['cloud', '云形'], ['delay', '延迟'], ['tri', '三角形'], ['sl-rect', '手动输入'],</code> |
| [94](../src/editor/diagramEditing.ts:94) | 文案定义／其他 | 云形 | <code>['doc', '文件'], ['docs', '多文件'], ['cloud', '云形'], ['delay', '延迟'], ['tri', '三角形'], ['sl-rect', '手动输入'],</code> |
| [94](../src/editor/diagramEditing.ts:94) | 文案定义／其他 | 延迟 | <code>['doc', '文件'], ['docs', '多文件'], ['cloud', '云形'], ['delay', '延迟'], ['tri', '三角形'], ['sl-rect', '手动输入'],</code> |
| [94](../src/editor/diagramEditing.ts:94) | 文案定义／其他 | 三角形 | <code>['doc', '文件'], ['docs', '多文件'], ['cloud', '云形'], ['delay', '延迟'], ['tri', '三角形'], ['sl-rect', '手动输入'],</code> |
| [94](../src/editor/diagramEditing.ts:94) | 文案定义／其他 | 手动输入 | <code>['doc', '文件'], ['docs', '多文件'], ['cloud', '云形'], ['delay', '延迟'], ['tri', '三角形'], ['sl-rect', '手动输入'],</code> |

<a id="src-editor-diagramnodecontrols-ts"></a>

## src/editor/diagramNodeControls.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [21](../src/editor/diagramNodeControls.ts:21) | 文案定义／其他 | 节点操作 | <code>const tools = document.createElement('div'); tools.className = 'cm-diagram-node-tools'; tools.contentEditable = 'false'; tools.setAttribute('role', 'toolbar'); tools.setAttribute('aria-label', t('节点操作'))</code> |
| [22](../src/editor/diagramNodeControls.ts:22) | 文案定义／其他 | 节点旁添加子节点 | <code>…'); nodeAdd.type = 'button'; nodeAdd.className = 'cm-diagram-add-child'; nodeAdd.setAttribute('aria-label', t('节点旁添加子节点')); nodeAdd.title = t('添加子节点（Tab）'); nodeAdd.innerHTML = '&lt;svg width="14" height="14" viewBox="0 0 24 24" fi…</code> |
| [22](../src/editor/diagramNodeControls.ts:22) | 文案定义／其他 | 添加子节点（Tab） | <code>…eAdd.className = 'cm-diagram-add-child'; nodeAdd.setAttribute('aria-label', t('节点旁添加子节点')); nodeAdd.title = t('添加子节点（Tab）'); nodeAdd.innerHTML = '&lt;svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" st…</code> |
| [23](../src/editor/diagramNodeControls.ts:23) | 文案定义／其他 | 节点旁添加节点 | <code>if (!mindmap) { nodeAdd.setAttribute('aria-label', t('节点旁添加节点')); nodeAdd.title = t('添加节点（Tab）') }</code> |
| [23](../src/editor/diagramNodeControls.ts:23) | 文案定义／其他 | 添加节点（Tab） | <code>if (!mindmap) { nodeAdd.setAttribute('aria-label', t('节点旁添加节点')); nodeAdd.title = t('添加节点（Tab）') }</code> |
| [24](../src/editor/diagramNodeControls.ts:24) | 文案定义／其他 | 节点旁删除节点 | <code>…ove.type = 'button'; nodeRemove.className = 'cm-diagram-remove-node'; nodeRemove.setAttribute('aria-label', t('节点旁删除节点')); nodeRemove.title = t('删除节点及子节点'); nodeRemove.innerHTML = '&lt;svg width="14" height="14" viewBox="0 0 24 24…</code> |
| [24](../src/editor/diagramNodeControls.ts:24) | 文案定义／其他 | 删除节点及子节点 | <code>…assName = 'cm-diagram-remove-node'; nodeRemove.setAttribute('aria-label', t('节点旁删除节点')); nodeRemove.title = t('删除节点及子节点'); nodeRemove.innerHTML = '&lt;svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"…</code> |
| [34](../src/editor/diagramNodeControls.ts:34) | 状态文案 | 图表无法更新，修改未保存。请切换到源码视图检查语法。 | <code>catch { status.textContent = t('图表无法更新，修改未保存。请切换到源码视图检查语法。'); return }</code> |
| [50](../src/editor/diagramNodeControls.ts:50) | 文案定义／其他 | 删除节点及子节点 | <code>nodeRemove.hidden = !id; nodeRemove.disabled = mindmap &amp;&amp; id === 'node0'; nodeRemove.title = mindmap ? t('删除节点及子节点') : t('删除节点及连线')</code> |
| [50](../src/editor/diagramNodeControls.ts:50) | 文案定义／其他 | 删除节点及连线 | <code>nodeRemove.hidden = !id; nodeRemove.disabled = mindmap &amp;&amp; id === 'node0'; nodeRemove.title = mindmap ? t('删除节点及子节点') : t('删除节点及连线')</code> |
| [77](../src/editor/diagramNodeControls.ts:77) | 文案定义／其他 | 节点名称 | <code>const input = document.createElement('input'); input.type = 'text'; input.value = node.label; input.placeholder = '节点名称'; input.setAttribute('aria-label', t('编辑节点名称')); input.maxLength = 2000</code> |
| [77](../src/editor/diagramNodeControls.ts:77) | 文案定义／其他 | 编辑节点名称 | <code>const input = document.createElement('input'); input.type = 'text'; input.value = node.label; input.placeholder = '节点名称'; input.setAttribute('aria-label', t('编辑节点名称')); input.maxLength = 2000</code> |
| [115](../src/editor/diagramNodeControls.ts:115) | 文案定义／其他 | 新节点 | <code>const result = mindmap ? addMindmapNode(source, node!.id, '新节点', sibling) : addFlowNode(source, '新节点', nodes, node?.id)</code> |
| [129](../src/editor/diagramNodeControls.ts:129) | 文案定义／其他 | 删除整个脑图？ | <code>if ((at === 0 &#124;&#124; hasChildren) &amp;&amp; !window.confirm(at === 0 ? t('删除整个脑图？') : t('删除该节点及其子节点？'))) return</code> |
| [129](../src/editor/diagramNodeControls.ts:129) | 文案定义／其他 | 删除该节点及其子节点？ | <code>if ((at === 0 &#124;&#124; hasChildren) &amp;&amp; !window.confirm(at === 0 ? t('删除整个脑图？') : t('删除该节点及其子节点？'))) return</code> |
| [134](../src/editor/diagramNodeControls.ts:134) | 文案定义／其他 | 删除整个脑图 | <code>const deleteDiagram = button(mindmap ? '删除整个脑图' : '删除整个流程图', trashIcon, () =&gt; {</code> |
| [134](../src/editor/diagramNodeControls.ts:134) | 文案定义／其他 | 删除整个流程图 | <code>const deleteDiagram = button(mindmap ? '删除整个脑图' : '删除整个流程图', trashIcon, () =&gt; {</code> |
| [135](../src/editor/diagramNodeControls.ts:135) | 文案定义／其他 | 删除整个脑图？所有节点和连线都会移除。 | <code>if (window.confirm(mindmap ? t('删除整个脑图？所有节点和连线都会移除。') : t('删除整个流程图？所有节点和连线都会移除。'))) void commit('')</code> |
| [135](../src/editor/diagramNodeControls.ts:135) | 文案定义／其他 | 删除整个流程图？所有节点和连线都会移除。 | <code>if (window.confirm(mindmap ? t('删除整个脑图？所有节点和连线都会移除。') : t('删除整个流程图？所有节点和连线都会移除。'))) void commit('')</code> |
| [139](../src/editor/diagramNodeControls.ts:139) | 文案定义／其他 | 节点形状 | <code>const shapeMenu = document.createElement('div'); shapeMenu.className = 'cm-diagram-shape-menu'; shapeMenu.hidden = true; shapeMenu.contentEditable = 'false'; shapeMenu.setAttribute('role', 'menu'); shapeMenu.setAttribute('aria-label', t('节点形状'))</code> |
| [140](../src/editor/diagramNodeControls.ts:140) | 文案定义／其他 | 节点形状 | <code>const shapeButton = button('节点形状', '&lt;path d="m12 3 9 9-9 9-9-9Z"/&gt;', () =&gt; { cancelConnection(); shapeMenu.hidden = !shapeMenu.hidden; shapeButton.setAttribute('aria-expanded', String(!shapeMenu.hidden)) })</code> |
| [151](../src/editor/diagramNodeControls.ts:151) | 文案定义／其他 | 连接节点 | <code>const connectButton = button('连接节点', '&lt;path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2"/&gt;', () =&gt; {</code> |
| [157](../src/editor/diagramNodeControls.ts:157) | 文案定义／其他 | 节点：{0} | <code>node.classList.add('cm-diagram-editable-node'); node.setAttribute('tabindex', '0'); node.setAttribute('role', 'button'); node.setAttribute('aria-label', t('节点：{0}', { "0": nodes[index].label }))</code> |
| [189](../src/editor/diagramNodeControls.ts:189) | 文案定义／其他 | 节点工具 | <code>const actions = document.createElement('div'); actions.className = 'cm-diagram-actions'; actions.setAttribute('role', 'group'); actions.setAttribute('aria-label', t('节点工具')); actions.append(...tools.children, shapeMenu)</code> |

<a id="src-editor-frontmatterwidget-ts"></a>

## src/editor/frontmatterWidget.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [14](../src/editor/frontmatterWidget.ts:14) | 文案定义／其他 | 元数据 | <code>const heading = document.createElement('strong'); heading.textContent = t('元数据'); root.append(heading)</code> |
| [20](../src/editor/frontmatterWidget.ts:20) | 文案定义／其他 | {0} 的字段名 | <code>const key = document.createElement('input'); key.className = 'frontmatter-key frontmatter-input'; key.value = name; key.setAttribute('aria-label', t('{0} 的字段名', { "0": name })); key.readOnly = this.readOnly</code> |
| [33](../src/editor/frontmatterWidget.ts:33) | 文案定义／其他 | {0} 的值 | <code>const input = document.createElement('input'); input.className = 'frontmatter-input'; input.value = field.value; input.setAttribute('aria-label', t('{0} 的值', { "0": field.key })); input.readOnly = this.readOnly</code> |

<a id="src-editor-linkcompletion-ts"></a>

## src/editor/linkCompletion.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [78](../src/editor/linkCompletion.ts:78) | 文案定义／其他 | https:// | <code>result.push({ path: 'https://', label: 'https://', destination: 'https://', website: true })</code> |

<a id="src-editor-livemarkdown-ts"></a>

## src/editor/liveMarkdown.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [56](../src/editor/liveMarkdown.ts:56) | 文案定义／其他 | 复制 | <code>const copy = document.createElement('button'); copy.className = 'cm-code-copy'; copy.textContent = t('复制')</code> |
| [57](../src/editor/liveMarkdown.ts:57) | 文案定义／其他 | 已复制 | <code>copy.addEventListener('click', event =&gt; { event.stopPropagation(); void navigator.clipboard.writeText(code.textContent &#124;&#124; '').then(() =&gt; { copy.textContent = t('已复制') }).catch(() =&gt; { copy.textContent = t('复制失败') }) })</code> |
| [57](../src/editor/liveMarkdown.ts:57) | 文案定义／其他 | 复制失败 | <code>copy.addEventListener('click', event =&gt; { event.stopPropagation(); void navigator.clipboard.writeText(code.textContent &#124;&#124; '').then(() =&gt; { copy.textContent = t('已复制') }).catch(() =&gt; { copy.textContent = t('复制失败') }) })</code> |
| [59](../src/editor/liveMarkdown.ts:59) | 文案定义／其他 | 代码语言 | <code>const label = document.createElement('span'); label.className = 'cm-code-language'; label.textContent = pre.dataset.language &#124;&#124; '代码语言'; pre.append(label)</code> |
| [113](../src/editor/liveMarkdown.ts:113) | 文案定义／其他 | 图表无法渲染，请切换到源码视图检查语法。 | <code>const error = document.createElement('div'); error.className = 'cm-diagram-error'; error.textContent = t('图表无法渲染，请切换到源码视图检查语法。')</code> |
| [167](../src/editor/liveMarkdown.ts:167) | 文案定义／其他 | 复制 | <code>const copy = document.createElement('button'); copy.textContent = t('复制'); copy.className = 'cm-native-copy'</code> |
| [171](../src/editor/liveMarkdown.ts:171) | 文案定义／其他 | 已复制 | <code>void navigator.clipboard.writeText(lines.join('\n')).then(() =&gt; { copy.textContent = t('已复制') }).catch(() =&gt; { copy.textContent = t('复制失败') })</code> |
| [171](../src/editor/liveMarkdown.ts:171) | 文案定义／其他 | 复制失败 | <code>void navigator.clipboard.writeText(lines.join('\n')).then(() =&gt; { copy.textContent = t('已复制') }).catch(() =&gt; { copy.textContent = t('复制失败') })</code> |
| [184](../src/editor/liveMarkdown.ts:184) | 文案定义／其他 | 代码语言 | <code>const language = document.createElement('input'); language.className = 'cm-native-language'; language.value = match[3].trim(); language.placeholder = '代码语言'; language.setAttribute('aria-label', t('代码语言')); language.disabled = this.options.readOnly</code> |
| [335](../src/editor/liveMarkdown.ts:335) | 文案定义／其他 | ⌘/Ctrl + 单击打开链接 | <code>mark(node.from, node.to, style, node.name === 'Link' ? { get title() { return t('⌘/Ctrl + 单击打开链接') } } : undefined)</code> |

<a id="src-editor-pluginextensions-ts"></a>

## src/editor/pluginExtensions.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [96](../src/editor/pluginExtensions.ts:96) | 文案定义／其他 | string | <code>typeof value.label === "string" &amp;&amp;</code> |
| [138](../src/editor/pluginExtensions.ts:138) | 文案定义／其他 | string | <code>typeof item.message !== "string"</code> |

<a id="src-editor-renderedcontent-ts"></a>

## src/editor/renderedContent.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [33](../src/editor/renderedContent.ts:33) | 文案定义／其他 | 脑图没有根节点 | <code>if (!root) throw new Error('脑图没有根节点')</code> |
| [63](../src/editor/renderedContent.ts:63) | 文案定义／其他 | ${language &#124;&#124; '代码'} 渲染失败：${String(error)} | <code>if (strict) throw new Error(&#96;${language &#124;&#124; '代码'} 渲染失败：${String(error)}&#96;)</code> |
| [74](../src/editor/renderedContent.ts:74) | 文案定义／其他 | 无法转换图表图片 | <code>const context = canvas.getContext('2d'); if (!context) throw new Error('无法转换图表图片')</code> |

<a id="src-editor-rendermarkdown-ts"></a>

## src/editor/renderMarkdown.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [46](../src/editor/renderMarkdown.ts:46) | 文案定义／其他 | &lt;!--${comment.data}--&gt; | <code>if (options.showComments) { const note = document.createElement(comment.parentElement === container ? 'aside' : 'span'); note.className = 'markart-comment'; note.textContent = &#96;&lt;!--${comment.data}--&gt;&#96;; comment.replaceWith(note) }</code> |

<a id="src-editor-slashcommands-ts"></a>

## src/editor/slashCommands.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [5](../src/editor/slashCommands.ts:5) | 文案定义／其他 | 一级标题 | <code>{ id: 'h1', get label() { return t('一级标题') }, search: '标题 heading h1', snippet: '# ' },</code> |
| [5](../src/editor/slashCommands.ts:5) | 文案定义／其他 | 标题 heading h1 | <code>{ id: 'h1', get label() { return t('一级标题') }, search: '标题 heading h1', snippet: '# ' },</code> |
| [6](../src/editor/slashCommands.ts:6) | 文案定义／其他 | 二级标题 | <code>{ id: 'h2', get label() { return t('二级标题') }, search: '标题 heading h2', snippet: '## ' },</code> |
| [6](../src/editor/slashCommands.ts:6) | 文案定义／其他 | 标题 heading h2 | <code>{ id: 'h2', get label() { return t('二级标题') }, search: '标题 heading h2', snippet: '## ' },</code> |
| [7](../src/editor/slashCommands.ts:7) | 文案定义／其他 | 三级标题 | <code>{ id: 'h3', get label() { return t('三级标题') }, search: '标题 heading h3', snippet: '### ' },</code> |
| [7](../src/editor/slashCommands.ts:7) | 文案定义／其他 | 标题 heading h3 | <code>{ id: 'h3', get label() { return t('三级标题') }, search: '标题 heading h3', snippet: '### ' },</code> |
| [8](../src/editor/slashCommands.ts:8) | 文案定义／其他 | 四级标题 | <code>{ id: 'h4', get label() { return t('四级标题') }, search: '标题 heading h4', snippet: '#### ' },</code> |
| [8](../src/editor/slashCommands.ts:8) | 文案定义／其他 | 标题 heading h4 | <code>{ id: 'h4', get label() { return t('四级标题') }, search: '标题 heading h4', snippet: '#### ' },</code> |
| [9](../src/editor/slashCommands.ts:9) | 文案定义／其他 | 五级标题 | <code>{ id: 'h5', get label() { return t('五级标题') }, search: '标题 heading h5', snippet: '##### ' },</code> |
| [9](../src/editor/slashCommands.ts:9) | 文案定义／其他 | 标题 heading h5 | <code>{ id: 'h5', get label() { return t('五级标题') }, search: '标题 heading h5', snippet: '##### ' },</code> |
| [10](../src/editor/slashCommands.ts:10) | 文案定义／其他 | 六级标题 | <code>{ id: 'h6', get label() { return t('六级标题') }, search: '标题 heading h6', snippet: '###### ' },</code> |
| [10](../src/editor/slashCommands.ts:10) | 文案定义／其他 | 标题 heading h6 | <code>{ id: 'h6', get label() { return t('六级标题') }, search: '标题 heading h6', snippet: '###### ' },</code> |
| [11](../src/editor/slashCommands.ts:11) | 文案定义／其他 | Front matter | <code>{ id: 'frontmatter', label: 'Front matter', search: 'front matter frontmatter yaml 属性', snippet: '---\ntitle: \"\"\n---\n' },</code> |
| [11](../src/editor/slashCommands.ts:11) | 文案定义／其他 | front matter frontmatter yaml 属性 | <code>{ id: 'frontmatter', label: 'Front matter', search: 'front matter frontmatter yaml 属性', snippet: '---\ntitle: \"\"\n---\n' },</code> |
| [12](../src/editor/slashCommands.ts:12) | 文案定义／其他 | 加粗 | <code>{ id: 'bold', get label() { return t('加粗') }, search: 'bold strong 加粗', snippet: '****', select: [2, 2] },</code> |
| [12](../src/editor/slashCommands.ts:12) | 文案定义／其他 | bold strong 加粗 | <code>{ id: 'bold', get label() { return t('加粗') }, search: 'bold strong 加粗', snippet: '****', select: [2, 2] },</code> |
| [13](../src/editor/slashCommands.ts:13) | 文案定义／其他 | 斜体 | <code>{ id: 'italic', get label() { return t('斜体') }, search: 'italic emphasis 斜体', snippet: '**', select: [1, 1] },</code> |
| [13](../src/editor/slashCommands.ts:13) | 文案定义／其他 | italic emphasis 斜体 | <code>{ id: 'italic', get label() { return t('斜体') }, search: 'italic emphasis 斜体', snippet: '**', select: [1, 1] },</code> |
| [14](../src/editor/slashCommands.ts:14) | 文案定义／其他 | 删除线 | <code>{ id: 'strikethrough', get label() { return t('删除线') }, search: 'strikethrough 删除线', snippet: '~~~~', select: [2, 2] },</code> |
| [14](../src/editor/slashCommands.ts:14) | 文案定义／其他 | strikethrough 删除线 | <code>{ id: 'strikethrough', get label() { return t('删除线') }, search: 'strikethrough 删除线', snippet: '~~~~', select: [2, 2] },</code> |
| [15](../src/editor/slashCommands.ts:15) | 文案定义／其他 | 下划线 | <code>{ id: 'underline', get label() { return t('下划线') }, search: 'underline 下划线', snippet: '&lt;u&gt;&lt;/u&gt;', select: [3, 3] },</code> |
| [15](../src/editor/slashCommands.ts:15) | 文案定义／其他 | underline 下划线 | <code>{ id: 'underline', get label() { return t('下划线') }, search: 'underline 下划线', snippet: '&lt;u&gt;&lt;/u&gt;', select: [3, 3] },</code> |
| [16](../src/editor/slashCommands.ts:16) | 文案定义／其他 | 行内代码 | <code>{ id: 'inline-code', get label() { return t('行内代码') }, search: 'inline code 行内代码', snippet: '&#96;&#96;', select: [1, 1] },</code> |
| [16](../src/editor/slashCommands.ts:16) | 文案定义／其他 | inline code 行内代码 | <code>{ id: 'inline-code', get label() { return t('行内代码') }, search: 'inline code 行内代码', snippet: '&#96;&#96;', select: [1, 1] },</code> |
| [17](../src/editor/slashCommands.ts:17) | 文案定义／其他 | 行内公式 | <code>{ id: 'inline-formula', get label() { return t('行内公式') }, search: 'inline math formula 行内公式', snippet: '$$', select: [1, 1] },</code> |
| [17](../src/editor/slashCommands.ts:17) | 文案定义／其他 | inline math formula 行内公式 | <code>{ id: 'inline-formula', get label() { return t('行内公式') }, search: 'inline math formula 行内公式', snippet: '$$', select: [1, 1] },</code> |
| [18](../src/editor/slashCommands.ts:18) | 文案定义／其他 | 链接 | <code>{ id: 'link', get label() { return t('链接') }, search: 'link url 链接', snippet: '[]()', select: [1, 1] },</code> |
| [18](../src/editor/slashCommands.ts:18) | 文案定义／其他 | link url 链接 | <code>{ id: 'link', get label() { return t('链接') }, search: 'link url 链接', snippet: '[]()', select: [1, 1] },</code> |
| [19](../src/editor/slashCommands.ts:19) | 文案定义／其他 | 图片链接 | <code>{ id: 'image', get label() { return t('图片链接') }, search: 'image src 图片', snippet: '![]()', select: [2, 2] },</code> |
| [19](../src/editor/slashCommands.ts:19) | 文案定义／其他 | image src 图片 | <code>{ id: 'image', get label() { return t('图片链接') }, search: 'image src 图片', snippet: '![]()', select: [2, 2] },</code> |
| [20](../src/editor/slashCommands.ts:20) | 文案定义／其他 | 注释 | <code>{ id: 'comment', get label() { return t('注释') }, search: 'comment 注释', snippet: '&lt;!--  --&gt;', select: [5, 5] },</code> |
| [20](../src/editor/slashCommands.ts:20) | 文案定义／其他 | comment 注释 | <code>{ id: 'comment', get label() { return t('注释') }, search: 'comment 注释', snippet: '&lt;!--  --&gt;', select: [5, 5] },</code> |
| [21](../src/editor/slashCommands.ts:21) | 文案定义／其他 | 段落 | <code>{ id: 'paragraph', get label() { return t('段落') }, search: '正文 paragraph', snippet: '' },</code> |
| [21](../src/editor/slashCommands.ts:21) | 文案定义／其他 | 正文 paragraph | <code>{ id: 'paragraph', get label() { return t('段落') }, search: '正文 paragraph', snippet: '' },</code> |
| [22](../src/editor/slashCommands.ts:22) | 文案定义／其他 | 无序列表 | <code>{ id: 'list', get label() { return t('无序列表') }, search: '列表 list', snippet: '- ' },</code> |
| [22](../src/editor/slashCommands.ts:22) | 文案定义／其他 | 列表 list | <code>{ id: 'list', get label() { return t('无序列表') }, search: '列表 list', snippet: '- ' },</code> |
| [23](../src/editor/slashCommands.ts:23) | 文案定义／其他 | 有序列表 | <code>{ id: 'ordered-list', get label() { return t('有序列表') }, search: '列表 list', snippet: '1. ' },</code> |
| [23](../src/editor/slashCommands.ts:23) | 文案定义／其他 | 列表 list | <code>{ id: 'ordered-list', get label() { return t('有序列表') }, search: '列表 list', snippet: '1. ' },</code> |
| [24](../src/editor/slashCommands.ts:24) | 文案定义／其他 | 任务列表 | <code>{ id: 'task', get label() { return t('任务列表') }, search: '待办 task checkbox', snippet: '- [ ] ' },</code> |
| [24](../src/editor/slashCommands.ts:24) | 文案定义／其他 | 待办 task checkbox | <code>{ id: 'task', get label() { return t('任务列表') }, search: '待办 task checkbox', snippet: '- [ ] ' },</code> |
| [25](../src/editor/slashCommands.ts:25) | 文案定义／其他 | 引用 | <code>{ id: 'quote', get label() { return t('引用') }, search: '引用 quote', snippet: '&gt; ' },</code> |
| [25](../src/editor/slashCommands.ts:25) | 文案定义／其他 | 引用 quote | <code>{ id: 'quote', get label() { return t('引用') }, search: '引用 quote', snippet: '&gt; ' },</code> |
| [26](../src/editor/slashCommands.ts:26) | 文案定义／其他 | 表格 | <code>{ id: 'table', get label() { return t('表格') }, search: 'table', snippet: defaultTable },</code> |
| [27](../src/editor/slashCommands.ts:27) | 文案定义／其他 | 代码块 | <code>{ id: 'code', get label() { return t('代码块') }, search: 'code', snippet: '&#96;&#96;&#96;\n代码\n&#96;&#96;&#96;' },</code> |
| [27](../src/editor/slashCommands.ts:27) | 文案定义／其他 | &#96;&#96;&#96;<br>代码<br>&#96;&#96;&#96; | <code>{ id: 'code', get label() { return t('代码块') }, search: 'code', snippet: '&#96;&#96;&#96;\n代码\n&#96;&#96;&#96;' },</code> |
| [28](../src/editor/slashCommands.ts:28) | 文案定义／其他 | 流程图 | <code>{ id: 'mermaid', get label() { return t('流程图') }, search: '流程图 图表 diagram mermaid', snippet: '&#96;&#96;&#96;mermaid\ngraph TD\n  A[开始] --&gt; B[结束]\n&#96;&#96;&#96;' },</code> |
| [28](../src/editor/slashCommands.ts:28) | 文案定义／其他 | 流程图 图表 diagram mermaid | <code>{ id: 'mermaid', get label() { return t('流程图') }, search: '流程图 图表 diagram mermaid', snippet: '&#96;&#96;&#96;mermaid\ngraph TD\n  A[开始] --&gt; B[结束]\n&#96;&#96;&#96;' },</code> |
| [28](../src/editor/slashCommands.ts:28) | 文案定义／其他 | &#96;&#96;&#96;mermaid<br>graph TD<br>  A[开始] --&gt; B[结束]<br>&#96;&#96;&#96; | <code>{ id: 'mermaid', get label() { return t('流程图') }, search: '流程图 图表 diagram mermaid', snippet: '&#96;&#96;&#96;mermaid\ngraph TD\n  A[开始] --&gt; B[结束]\n&#96;&#96;&#96;' },</code> |
| [29](../src/editor/slashCommands.ts:29) | 文案定义／其他 | 脑图 | <code>{ id: 'mindmap', get label() { return t('脑图') }, search: '思维导图 mindmap 脑图', snippet: '&#96;&#96;&#96;mindmap\n  root((主题))\n    分支一\n    分支二\n&#96;&#96;&#96;' },</code> |
| [29](../src/editor/slashCommands.ts:29) | 文案定义／其他 | 思维导图 mindmap 脑图 | <code>{ id: 'mindmap', get label() { return t('脑图') }, search: '思维导图 mindmap 脑图', snippet: '&#96;&#96;&#96;mindmap\n  root((主题))\n    分支一\n    分支二\n&#96;&#96;&#96;' },</code> |
| [29](../src/editor/slashCommands.ts:29) | 文案定义／其他 | &#96;&#96;&#96;mindmap<br>  root((主题))<br>    分支一<br>    分支二<br>&#96;&#96;&#96; | <code>{ id: 'mindmap', get label() { return t('脑图') }, search: '思维导图 mindmap 脑图', snippet: '&#96;&#96;&#96;mindmap\n  root((主题))\n    分支一\n    分支二\n&#96;&#96;&#96;' },</code> |
| [30](../src/editor/slashCommands.ts:30) | 文案定义／其他 | 公式块 | <code>{ id: 'formula', get label() { return t('公式块') }, search: 'math formula', snippet: '$$\n公式\n$$' },</code> |
| [30](../src/editor/slashCommands.ts:30) | 文案定义／其他 | $$<br>公式<br>$$ | <code>{ id: 'formula', get label() { return t('公式块') }, search: 'math formula', snippet: '$$\n公式\n$$' },</code> |
| [31](../src/editor/slashCommands.ts:31) | 文案定义／其他 | 提示框 | <code>{ id: 'callout-tip', get label() { return t('提示框') }, search: '警告 callout tip', snippet: '&gt; [!TIP]\n&gt; 提示内容' },</code> |
| [31](../src/editor/slashCommands.ts:31) | 文案定义／其他 | 警告 callout tip | <code>{ id: 'callout-tip', get label() { return t('提示框') }, search: '警告 callout tip', snippet: '&gt; [!TIP]\n&gt; 提示内容' },</code> |
| [31](../src/editor/slashCommands.ts:31) | 文案定义／其他 | &gt; [!TIP]<br>&gt; 提示内容 | <code>{ id: 'callout-tip', get label() { return t('提示框') }, search: '警告 callout tip', snippet: '&gt; [!TIP]\n&gt; 提示内容' },</code> |
| [32](../src/editor/slashCommands.ts:32) | 文案定义／其他 | 备注框 | <code>{ id: 'callout-note', get label() { return t('备注框') }, search: '备注 callout note', snippet: '&gt; [!NOTE]\n&gt; 备注内容' },</code> |
| [32](../src/editor/slashCommands.ts:32) | 文案定义／其他 | 备注 callout note | <code>{ id: 'callout-note', get label() { return t('备注框') }, search: '备注 callout note', snippet: '&gt; [!NOTE]\n&gt; 备注内容' },</code> |
| [32](../src/editor/slashCommands.ts:32) | 文案定义／其他 | &gt; [!NOTE]<br>&gt; 备注内容 | <code>{ id: 'callout-note', get label() { return t('备注框') }, search: '备注 callout note', snippet: '&gt; [!NOTE]\n&gt; 备注内容' },</code> |
| [33](../src/editor/slashCommands.ts:33) | 文案定义／其他 | 重要框 | <code>{ id: 'callout-important', get label() { return t('重要框') }, search: '重要 callout important', snippet: '&gt; [!IMPORTANT]\n&gt; 重要内容' },</code> |
| [33](../src/editor/slashCommands.ts:33) | 文案定义／其他 | 重要 callout important | <code>{ id: 'callout-important', get label() { return t('重要框') }, search: '重要 callout important', snippet: '&gt; [!IMPORTANT]\n&gt; 重要内容' },</code> |
| [33](../src/editor/slashCommands.ts:33) | 文案定义／其他 | &gt; [!IMPORTANT]<br>&gt; 重要内容 | <code>{ id: 'callout-important', get label() { return t('重要框') }, search: '重要 callout important', snippet: '&gt; [!IMPORTANT]\n&gt; 重要内容' },</code> |
| [34](../src/editor/slashCommands.ts:34) | 文案定义／其他 | 警告框 | <code>{ id: 'callout-warning', get label() { return t('警告框') }, search: '警告 callout warning', snippet: '&gt; [!WARNING]\n&gt; 警告内容' },</code> |
| [34](../src/editor/slashCommands.ts:34) | 文案定义／其他 | 警告 callout warning | <code>{ id: 'callout-warning', get label() { return t('警告框') }, search: '警告 callout warning', snippet: '&gt; [!WARNING]\n&gt; 警告内容' },</code> |
| [34](../src/editor/slashCommands.ts:34) | 文案定义／其他 | &gt; [!WARNING]<br>&gt; 警告内容 | <code>{ id: 'callout-warning', get label() { return t('警告框') }, search: '警告 callout warning', snippet: '&gt; [!WARNING]\n&gt; 警告内容' },</code> |
| [35](../src/editor/slashCommands.ts:35) | 文案定义／其他 | 注意框 | <code>{ id: 'callout-caution', get label() { return t('注意框') }, search: '注意 callout caution', snippet: '&gt; [!CAUTION]\n&gt; 注意内容' },</code> |
| [35](../src/editor/slashCommands.ts:35) | 文案定义／其他 | 注意 callout caution | <code>{ id: 'callout-caution', get label() { return t('注意框') }, search: '注意 callout caution', snippet: '&gt; [!CAUTION]\n&gt; 注意内容' },</code> |
| [35](../src/editor/slashCommands.ts:35) | 文案定义／其他 | &gt; [!CAUTION]<br>&gt; 注意内容 | <code>{ id: 'callout-caution', get label() { return t('注意框') }, search: '注意 callout caution', snippet: '&gt; [!CAUTION]\n&gt; 注意内容' },</code> |
| [36](../src/editor/slashCommands.ts:36) | 文案定义／其他 | 脚注 | <code>{ id: 'footnote', get label() { return t('脚注') }, search: '脚注 footnote', snippet: '[^1]\n\n[^1]: 脚注内容' },</code> |
| [36](../src/editor/slashCommands.ts:36) | 文案定义／其他 | 脚注 footnote | <code>{ id: 'footnote', get label() { return t('脚注') }, search: '脚注 footnote', snippet: '[^1]\n\n[^1]: 脚注内容' },</code> |
| [36](../src/editor/slashCommands.ts:36) | 文案定义／其他 | [^1]<br><br>[^1]: 脚注内容 | <code>{ id: 'footnote', get label() { return t('脚注') }, search: '脚注 footnote', snippet: '[^1]\n\n[^1]: 脚注内容' },</code> |
| [37](../src/editor/slashCommands.ts:37) | 文案定义／其他 | 水平分割线 | <code>{ id: 'hr', get label() { return t('水平分割线') }, search: '分隔线 divider', snippet: '---' }</code> |
| [37](../src/editor/slashCommands.ts:37) | 文案定义／其他 | 分隔线 divider | <code>{ id: 'hr', get label() { return t('水平分割线') }, search: '分隔线 divider', snippet: '---' }</code> |

<a id="src-editor-tablecontrols-ts"></a>

## src/editor/tableControls.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [49](../src/editor/tableControls.ts:49) | 文案定义／其他 | 表格工具栏 | <code>const toolbar = document.createElement('div'); toolbar.className = 'cm-table-toolbar'; toolbar.contentEditable = 'false'; toolbar.hidden = true; toolbar.setAttribute('role', 'toolbar'); toolbar.setAttribute('aria-label', t('表格工具栏'))</code> |
| [65](../src/editor/tableControls.ts:65) | 文案定义／其他 | 调整表格尺寸 | <code>control('调整表格尺寸', '&lt;rect x="3" y="3" width="18" height="18" rx="2"/&gt;&lt;path d="M3 9h18M3 15h18M9 3v18M15 3v18"/&gt;', () =&gt; { picker.hidden = !picker.hidden })</code> |
| [66](../src/editor/tableControls.ts:66) | 文案定义／其他 | ${data.length} × ${data[0]?.length &#124;&#124; 0} | <code>const size = document.createElement('span'); size.textContent = &#96;${data.length} × ${data[0]?.length &#124;&#124; 0}&#96;; picker.append(size)</code> |
| [73](../src/editor/tableControls.ts:73) | 文案定义／其他 | 缩小表格将删除超出范围的内容，是否继续？ | <code>if (removed &amp;&amp; !window.confirm(t('缩小表格将删除超出范围的内容，是否继续？'))) return</code> |
| [80](../src/editor/tableControls.ts:80) | 文案定义／其他 | {0} 行 {1} 列 | <code>const button = document.createElement('button'); button.type = 'button'; button.setAttribute('aria-label', t('{0} 行 {1} 列', { "0": r, "1": c }))</code> |
| [81](../src/editor/tableControls.ts:81) | 文案定义／其他 | ${r} × ${c} | <code>button.addEventListener('mouseenter', () =&gt; { size.textContent = &#96;${r} × ${c}&#96;; [...matrix.children].forEach((item, i) =&gt; item.classList.toggle('active', Math.floor(i / 8) &lt; r &amp;&amp; i % 8 &lt; c)) })</code> |
| [90](../src/editor/tableControls.ts:90) | 文案定义／其他 | 左对齐 | <code>for (const [label, text, value] of [['左对齐', '&lt;path d="M3 6h18M3 10h12M3 14h18M3 18h12"/&gt;', ':---'], ['居中', '&lt;path d="M3 6h18M6 10h12M3 14h18M6 18h12"/&gt;', ':---:'], ['右对齐', '&lt;path d="M3 6h18M9 10h12M3 14h18M9 18h12"/&gt;', '---:']]) {</code> |
| [90](../src/editor/tableControls.ts:90) | 文案定义／其他 | 居中 | <code>for (const [label, text, value] of [['左对齐', '&lt;path d="M3 6h18M3 10h12M3 14h18M3 18h12"/&gt;', ':---'], ['居中', '&lt;path d="M3 6h18M6 10h12M3 14h18M6 18h12"/&gt;', ':---:'], ['右对齐', '&lt;path d="M3 6h18M9 10h12M3 14h18M9 18h12"/&gt;', '---:']]) {</code> |
| [90](../src/editor/tableControls.ts:90) | 文案定义／其他 | 右对齐 | <code>for (const [label, text, value] of [['左对齐', '&lt;path d="M3 6h18M3 10h12M3 14h18M3 18h12"/&gt;', ':---'], ['居中', '&lt;path d="M3 6h18M6 10h12M3 14h18M6 18h12"/&gt;', ':---:'], ['右对齐', '&lt;path d="M3 6h18M9 10h12M3 14h18M9 18h12"/&gt;', '---:']]) {</code> |
| [91](../src/editor/tableControls.ts:91) | 文案定义／其他 | 表格${label} | <code>const button = control(&#96;表格${label}&#96;, text, () =&gt; {</code> |
| [132](../src/editor/tableControls.ts:132) | 文案定义／其他 | 编辑表格单元格 | <code>const input = document.createElement('input'); input.className = 'cm-table-cell-input'; input.value = cell.text; input.setAttribute('aria-label', t('编辑表格单元格')); input.style.width = &#96;${width}px&#96;</code> |
| [153](../src/editor/tableControls.ts:153) | 文案定义／其他 | 删除表格 | <code>const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'cm-table-delete'; remove.title = t('删除表格'); remove.setAttribute('aria-label', t('删除表格'))</code> |

<a id="src-editor-useeditoractions-ts"></a>

## src/editor/useEditorActions.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [54](../src/editor/useEditorActions.ts:54) | 文案定义／其他 | 当前段落没有可复制的内容 | <code>if (!source) return notify(t('当前段落没有可复制的内容'))</code> |
| [57](../src/editor/useEditorActions.ts:57) | 文案定义／其他 | 请在桌面版复制为图片 | <code>if (!isTauri) throw new Error('请在桌面版复制为图片')</code> |
| [69](../src/editor/useEditorActions.ts:69) | 文案定义／其他 | 已复制 | <code>await navigator.clipboard.write([new ClipboardItem({ 'image/png': image })]); showBlockActions.value = false; notify(t('已复制'))</code> |
| [70](../src/editor/useEditorActions.ts:70) | 文案定义／其他 | 复制失败：{0} | <code>} catch (error) { notify(t('复制失败：{0}', { "0": String(error) })) }</code> |
| [76](../src/editor/useEditorActions.ts:76) | 文案定义／其他 | 已复制 | <code>try { await navigator.clipboard.writeText(value); showBlockActions.value = false; notify(t('已复制')) }</code> |
| [77](../src/editor/useEditorActions.ts:77) | 文案定义／其他 | 复制失败：{0} | <code>catch (error) { notify(t('复制失败：{0}', { "0": String(error) })) }</code> |
| [81](../src/editor/useEditorActions.ts:81) | 文案定义／其他 | 粘贴失败：{0} | <code>catch (error) { notify(t('粘贴失败：{0}', { "0": String(error) })) }</code> |
| [94](../src/editor/useEditorActions.ts:94) | 文案定义／其他 | 请先打开本地 Markdown 文件 | <code>if (!activeDoc.value.relativePath &#124;&#124; !activeDoc.value.loaded) return notify(t('请先打开本地 Markdown 文件'))</code> |
| [98](../src/editor/useEditorActions.ts:98) | 文案定义／其他 | 插入图片失败：{0} | <code>catch (error) { return notify(t('插入图片失败：{0}', { "0": String(error) })) }</code> |
| [105](../src/editor/useEditorActions.ts:105) | 文案定义／其他 | 所见即所得 | <code>const modeLabel = computed(() =&gt; mode.value === 'wysiwyg' ? t('所见即所得') : mode.value === 'source' ? t('源代码') : t('分栏'))</code> |
| [105](../src/editor/useEditorActions.ts:105) | 文案定义／其他 | 源代码 | <code>const modeLabel = computed(() =&gt; mode.value === 'wysiwyg' ? t('所见即所得') : mode.value === 'source' ? t('源代码') : t('分栏'))</code> |
| [105](../src/editor/useEditorActions.ts:105) | 文案定义／其他 | 分栏 | <code>const modeLabel = computed(() =&gt; mode.value === 'wysiwyg' ? t('所见即所得') : mode.value === 'source' ? t('源代码') : t('分栏'))</code> |
| [106](../src/editor/useEditorActions.ts:106) | 文案定义／其他 | 源代码 | <code>const nextModeLabel = computed(() =&gt; mode.value === 'wysiwyg' ? t('源代码') : mode.value === 'source' ? t('分栏') : t('所见即所得'))</code> |
| [106](../src/editor/useEditorActions.ts:106) | 文案定义／其他 | 分栏 | <code>const nextModeLabel = computed(() =&gt; mode.value === 'wysiwyg' ? t('源代码') : mode.value === 'source' ? t('分栏') : t('所见即所得'))</code> |
| [106](../src/editor/useEditorActions.ts:106) | 文案定义／其他 | 所见即所得 | <code>const nextModeLabel = computed(() =&gt; mode.value === 'wysiwyg' ? t('源代码') : mode.value === 'source' ? t('分栏') : t('所见即所得'))</code> |

<a id="src-editorworkspace-vue"></a>

## src/EditorWorkspace.vue

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [34](../src/EditorWorkspace.vue:34) | 文案定义／其他 | 未命名文件.md | <code>const filename = unref(props.context.activeDoc)?.path?.split('/').pop() &#124;&#124; '未命名文件.md'</code> |
| [53](../src/EditorWorkspace.vue:53) | 界面文案 | 段落样式 | <code>…eDown"&gt;&lt;div class="format-group"&gt;&lt;div class="block-style-wrap"&gt;&lt;button class="block-style-trigger" :title="$t('段落样式')" :aria-expanded="showBlockMenu" @click="showBlockMenu = !showBlockMenu"&gt;{{ $t(selectedBlockLabel) }} &lt;Chev…</code> |
| [53](../src/EditorWorkspace.vue:53) | 界面文案 | 一 | <code>…ctedBlock === &#96;h${level}&#96; }" @click="applyBlockStyle(&#96;h${level}&#96;)"&gt;&lt;FormatIcon :name="&#96;h${level}&#96;"/&gt;&lt;span&gt;{{ ['一','二','三','四','五','六'][level - 1] }}{{ $t('级标题') }}&lt;/span&gt;&lt;kbd v-if="shortcutLabel(&#96;heading${level}&#96;)"&gt;{{ sho…</code> |
| [53](../src/EditorWorkspace.vue:53) | 界面文案 | 二 | <code>…Block === &#96;h${level}&#96; }" @click="applyBlockStyle(&#96;h${level}&#96;)"&gt;&lt;FormatIcon :name="&#96;h${level}&#96;"/&gt;&lt;span&gt;{{ ['一','二','三','四','五','六'][level - 1] }}{{ $t('级标题') }}&lt;/span&gt;&lt;kbd v-if="shortcutLabel(&#96;heading${level}&#96;)"&gt;{{ shortcu…</code> |
| [53](../src/EditorWorkspace.vue:53) | 界面文案 | 三 | <code>…k === &#96;h${level}&#96; }" @click="applyBlockStyle(&#96;h${level}&#96;)"&gt;&lt;FormatIcon :name="&#96;h${level}&#96;"/&gt;&lt;span&gt;{{ ['一','二','三','四','五','六'][level - 1] }}{{ $t('级标题') }}&lt;/span&gt;&lt;kbd v-if="shortcutLabel(&#96;heading${level}&#96;)"&gt;{{ shortcutLab…</code> |
| [53](../src/EditorWorkspace.vue:53) | 界面文案 | 四 | <code>…= &#96;h${level}&#96; }" @click="applyBlockStyle(&#96;h${level}&#96;)"&gt;&lt;FormatIcon :name="&#96;h${level}&#96;"/&gt;&lt;span&gt;{{ ['一','二','三','四','五','六'][level - 1] }}{{ $t('级标题') }}&lt;/span&gt;&lt;kbd v-if="shortcutLabel(&#96;heading${level}&#96;)"&gt;{{ shortcutLabel(&#96;…</code> |
| [53](../src/EditorWorkspace.vue:53) | 界面文案 | 五 | <code>…${level}&#96; }" @click="applyBlockStyle(&#96;h${level}&#96;)"&gt;&lt;FormatIcon :name="&#96;h${level}&#96;"/&gt;&lt;span&gt;{{ ['一','二','三','四','五','六'][level - 1] }}{{ $t('级标题') }}&lt;/span&gt;&lt;kbd v-if="shortcutLabel(&#96;heading${level}&#96;)"&gt;{{ shortcutLabel(&#96;head…</code> |
| [53](../src/EditorWorkspace.vue:53) | 界面文案 | 六 | <code>…vel}&#96; }" @click="applyBlockStyle(&#96;h${level}&#96;)"&gt;&lt;FormatIcon :name="&#96;h${level}&#96;"/&gt;&lt;span&gt;{{ ['一','二','三','四','五','六'][level - 1] }}{{ $t('级标题') }}&lt;/span&gt;&lt;kbd v-if="shortcutLabel(&#96;heading${level}&#96;)"&gt;{{ shortcutLabel(&#96;heading$…</code> |
| [53](../src/EditorWorkspace.vue:53) | 界面文案 | 级标题 | <code>…ockStyle(&#96;h${level}&#96;)"&gt;&lt;FormatIcon :name="&#96;h${level}&#96;"/&gt;&lt;span&gt;{{ ['一','二','三','四','五','六'][level - 1] }}{{ $t('级标题') }}&lt;/span&gt;&lt;kbd v-if="shortcutLabel(&#96;heading${level}&#96;)"&gt;{{ shortcutLabel(&#96;heading${level}&#96;) }}&lt;/kbd&gt;&lt;/button…</code> |
| [53](../src/EditorWorkspace.vue:53) | 界面文案 | 段落 | <code>…"{ selected: selectedBlock === 'p' }" @click="applyBlockStyle('p')"&gt;&lt;FormatIcon name="paragraph"/&gt;&lt;span&gt;{{ $t('段落') }}&lt;/span&gt;&lt;kbd v-if="shortcutLabel('p')"&gt;{{ shortcutLabel('p') }}&lt;/kbd&gt;&lt;/button&gt;&lt;button @click="applyBlockS…</code> |
| [53](../src/EditorWorkspace.vue:53) | 界面文案 | Front matter | <code>…l('p') }}&lt;/kbd&gt;&lt;/button&gt;&lt;button @click="applyBlockStyle('frontmatter')"&gt;&lt;FormatIcon name="frontmatter"/&gt;&lt;span&gt;Front matter&lt;/span&gt;&lt;kbd v-if="shortcutLabel('frontmatter')"&gt;{{ shortcutLabel('frontmatter') }}&lt;/kbd&gt;&lt;/button&gt;&lt;div class="b…</code> |
| [53](../src/EditorWorkspace.vue:53) | 界面文案 | 表格 | <code>…elected: selectedBlock === 'table' }" @click="applyBlockStyle('table')"&gt;&lt;FormatIcon name="table"/&gt;&lt;span&gt;{{ $t('表格') }}&lt;/span&gt;&lt;kbd v-if="shortcutLabel('table')"&gt;{{ shortcutLabel('table') }}&lt;/kbd&gt;&lt;/button&gt;&lt;button :class="{ s…</code> |
| [53](../src/EditorWorkspace.vue:53) | 界面文案 | 代码块 | <code>…cted: selectedBlock === 'code-block' }" @click="applyBlockStyle('code')"&gt;&lt;FormatIcon name="code"/&gt;&lt;span&gt;{{ $t('代码块') }}&lt;/span&gt;&lt;kbd v-if="shortcutLabel('code-block')"&gt;{{ shortcutLabel('code-block') }}&lt;/kbd&gt;&lt;/button&gt;&lt;button :…</code> |
| [53](../src/EditorWorkspace.vue:53) | 界面文案 | 流程图 | <code>…d: selectedBlock === 'mermaid' }" @click="applyBlockStyle('mermaid')"&gt;&lt;FormatIcon name="mermaid"/&gt;&lt;span&gt;{{ $t('流程图') }}&lt;/span&gt;&lt;kbd v-if="shortcutLabel('mermaid')"&gt;{{ shortcutLabel('mermaid') }}&lt;/kbd&gt;&lt;/button&gt;&lt;button @click=…</code> |
| [53](../src/EditorWorkspace.vue:53) | 界面文案 | 脑图 | <code>…ermaid') }}&lt;/kbd&gt;&lt;/button&gt;&lt;button @click="applyBlockStyle('mindmap')"&gt;&lt;FormatIcon name="mindmap"/&gt;&lt;span&gt;{{ $t('脑图') }}&lt;/span&gt;&lt;kbd v-if="shortcutLabel('mindmap')"&gt;{{ shortcutLabel('mindmap') }}&lt;/kbd&gt;&lt;/button&gt;&lt;button :class=…</code> |
| [53](../src/EditorWorkspace.vue:53) | 界面文案 | 公式块 | <code>…d: selectedBlock === 'formula' }" @click="applyBlockStyle('formula')"&gt;&lt;FormatIcon name="formula"/&gt;&lt;span&gt;{{ $t('公式块') }}&lt;/span&gt;&lt;kbd v-if="shortcutLabel('formula')"&gt;{{ shortcutLabel('formula') }}&lt;/kbd&gt;&lt;/button&gt;&lt;button :class=…</code> |
| [53](../src/EditorWorkspace.vue:53) | 界面文案 | 脚注 | <code>…selectedBlock === 'footnote' }" @click="applyBlockStyle('footnote')"&gt;&lt;FormatIcon name="footnote"/&gt;&lt;span&gt;{{ $t('脚注') }}&lt;/span&gt;&lt;kbd v-if="shortcutLabel('footnote')"&gt;{{ shortcutLabel('footnote') }}&lt;/kbd&gt;&lt;/button&gt;&lt;button @clic…</code> |
| [53](../src/EditorWorkspace.vue:53) | 界面文案 | 注释 | <code>…bd&gt;&lt;/button&gt;&lt;button @click="format('comment'); showBlockMenu = false"&gt;&lt;FormatIcon name="comment"/&gt;&lt;span&gt;{{ $t('注释') }}&lt;/span&gt;&lt;kbd v-if="shortcutLabel('comment')"&gt;{{ shortcutLabel('comment') }}&lt;/kbd&gt;&lt;/button&gt;&lt;button :class=…</code> |
| [53](../src/EditorWorkspace.vue:53) | 界面文案 | 水平分割线 | <code>…lass="{ selected: selectedBlock === 'hr' }" @click="applyBlockStyle('hr')"&gt;&lt;FormatIcon name="hr"/&gt;&lt;span&gt;{{ $t('水平分割线') }}&lt;/span&gt;&lt;kbd v-if="shortcutLabel('hr')"&gt;{{ shortcutLabel('hr') }}&lt;/kbd&gt;&lt;/button&gt;&lt;/div&gt;&lt;/div&gt;&lt;span class="…</code> |
| [53](../src/EditorWorkspace.vue:53) | 界面文案 | 粗体 | <code>…&gt;{{ shortcutLabel('hr') }}&lt;/kbd&gt;&lt;/button&gt;&lt;/div&gt;&lt;/div&gt;&lt;span class="tool-divider"/&gt;&lt;button :title="toolbarTitle('粗体', 'bold')" :class="{ pressed: boldActive }" @click="format('bold')"&gt;&lt;FormatIcon name="bold"/&gt;&lt;/button&gt;&lt;butto…</code> |
| [53](../src/EditorWorkspace.vue:53) | 界面文案 | 斜体 | <code>…pressed: boldActive }" @click="format('bold')"&gt;&lt;FormatIcon name="bold"/&gt;&lt;/button&gt;&lt;button :title="toolbarTitle('斜体', 'italic')" :class="{ pressed: italicActive }" @click="format('italic')"&gt;&lt;FormatIcon name="italic"/&gt;&lt;/butto…</code> |
| [53](../src/EditorWorkspace.vue:53) | 界面文案 | 文字样式 | <code>…/&gt;&lt;/button&gt;&lt;span v-if="showTextStyleMenu" class="list-style-menu text-style-menu" role="menu" :aria-label="$t('文字样式')"&gt;&lt;button v-for="item in [{ id: 'strikethrough', label: '删除线' }, { id: 'underline', label: '下划线' }, { id: '…</code> |
| [53](../src/EditorWorkspace.vue:53) | 界面文案 | 删除线 | <code>…u text-style-menu" role="menu" :aria-label="$t('文字样式')"&gt;&lt;button v-for="item in [{ id: 'strikethrough', label: '删除线' }, { id: 'underline', label: '下划线' }, { id: 'inline-formula', label: '行内公式' }]" :key="item.id" role="menuit…</code> |
| [53](../src/EditorWorkspace.vue:53) | 界面文案 | 下划线 | <code>…a-label="$t('文字样式')"&gt;&lt;button v-for="item in [{ id: 'strikethrough', label: '删除线' }, { id: 'underline', label: '下划线' }, { id: 'inline-formula', label: '行内公式' }]" :key="item.id" role="menuitemcheckbox" :aria-checked="activeFo…</code> |
| [53](../src/EditorWorkspace.vue:53) | 界面文案 | 行内公式 | <code>…in [{ id: 'strikethrough', label: '删除线' }, { id: 'underline', label: '下划线' }, { id: 'inline-formula', label: '行内公式' }]" :key="item.id" role="menuitemcheckbox" :aria-checked="activeFormatIds.includes(item.id)" :class="{ sele…</code> |
| [53](../src/EditorWorkspace.vue:53) | 界面文案 | 行内代码 | <code>…shortcutLabel(item.id)"&gt;{{ shortcutLabel(item.id) }}&lt;/kbd&gt;&lt;/button&gt;&lt;/span&gt;&lt;/span&gt;&lt;button :title="toolbarTitle('行内代码', 'code')" :class="{ pressed: activeFormatIds.includes('code') }" :aria-pressed="activeFormatIds.includes('c…</code> |
| [53](../src/EditorWorkspace.vue:53) | 界面文案 | 超链接 | <code>…cludes('code')" @click="format('code')"&gt;&lt;FormatIcon name="inline-code"/&gt;&lt;/button&gt;&lt;button :title="toolbarTitle('超链接', 'link')" :class="{ pressed: activeFormatIds.includes('link') }" :aria-pressed="activeFormatIds.includes('l…</code> |
| [53](../src/EditorWorkspace.vue:53) | 界面文案 | 插入图片 | <code>…atIcon name="link"/&gt;&lt;/button&gt;&lt;span class="tool-divider"/&gt;&lt;span class="image-insert-anchor"&gt;&lt;button :title="$t('插入图片')" :aria-expanded="showImageMenu" @click="showImageMenu = !showImageMenu"&gt;&lt;FormatIcon name="image"/&gt;&lt;/button…</code> |
| [53](../src/EditorWorkspace.vue:53) | 界面文案 | 图片链接 | <code>…-menu"&gt;&lt;button @click="showImageMenu = false; format('image-url')"&gt;&lt;FormatIcon name="image" :size="15"/&gt;{{ $t('图片链接') }}&lt;kbd v-if="shortcutLabel('image-url')"&gt;{{ shortcutLabel('image-url') }}&lt;/kbd&gt;&lt;/button&gt;&lt;button @click="sh…</code> |
| [53](../src/EditorWorkspace.vue:53) | 界面文案 | 本地图片 | <code>…button @click="showImageMenu = false; format('image-local')"&gt;&lt;FormatIcon name="image-local" :size="15"/&gt;{{ $t('本地图片') }}&lt;kbd v-if="shortcutLabel('image-local')"&gt;{{ shortcutLabel('image-local') }}&lt;/kbd&gt;&lt;/button&gt;&lt;/span&gt;&lt;/span&gt;…</code> |
| [53](../src/EditorWorkspace.vue:53) | 界面文案 | 引用与警告框 | <code>…}}&lt;/kbd&gt;&lt;/button&gt;&lt;/span&gt;&lt;/span&gt;&lt;span class="quote-style-anchor"&gt;&lt;button :title="$t('引用与警告框')" :aria-label="$t('引用与警告框')" :class="{ pressed: selectedBlock === 'quote' &#124;&#124; selectedBlock.startsWith('callout-') }" :aria-expanded="s…</code> |
| [53](../src/EditorWorkspace.vue:53) | 界面文案 | 普通引用 | <code>…plyBlockStyle('quote'); showQuoteMenu = false"&gt;&lt;FormatIcon name="quote"/&gt;&lt;span class="quote-menu-label"&gt;{{ $t('普通引用') }}&lt;/span&gt;&lt;kbd v-if="shortcutLabel('quote')"&gt;{{ shortcutLabel('quote') }}&lt;/kbd&gt;&lt;/button&gt;&lt;div class="block-m…</code> |
| [53](../src/EditorWorkspace.vue:53) | 界面文案 | 提示 | <code>…el('quote') }}&lt;/kbd&gt;&lt;/button&gt;&lt;div class="block-menu-separator"/&gt;&lt;button v-for="item in [{ kind: 'tip', label: '提示' }, { kind: 'note', label: '备注' }, { kind: 'important', label: '重要' }, { kind: 'warning', label: '警告' }, { k…</code> |
| [53](../src/EditorWorkspace.vue:53) | 界面文案 | 备注 | <code>…iv class="block-menu-separator"/&gt;&lt;button v-for="item in [{ kind: 'tip', label: '提示' }, { kind: 'note', label: '备注' }, { kind: 'important', label: '重要' }, { kind: 'warning', label: '警告' }, { kind: 'caution', label: '注意' }]"…</code> |
| [53](../src/EditorWorkspace.vue:53) | 界面文案 | 重要 | <code>…tton v-for="item in [{ kind: 'tip', label: '提示' }, { kind: 'note', label: '备注' }, { kind: 'important', label: '重要' }, { kind: 'warning', label: '警告' }, { kind: 'caution', label: '注意' }]" :key="item.kind" :class="{ selected…</code> |
| [53](../src/EditorWorkspace.vue:53) | 界面文案 | 警告 | <code>…, label: '提示' }, { kind: 'note', label: '备注' }, { kind: 'important', label: '重要' }, { kind: 'warning', label: '警告' }, { kind: 'caution', label: '注意' }]" :key="item.kind" :class="{ selected: selectedBlock === &#96;callout-${ite…</code> |
| [53](../src/EditorWorkspace.vue:53) | 界面文案 | 注意 | <code>…abel: '备注' }, { kind: 'important', label: '重要' }, { kind: 'warning', label: '警告' }, { kind: 'caution', label: '注意' }]" :key="item.kind" :class="{ selected: selectedBlock === &#96;callout-${item.kind}&#96; }" @click="applyBlockStyl…</code> |
| [53](../src/EditorWorkspace.vue:53) | 界面文案 | 列表 | <code>…bel(&#96;callout-${item.kind}&#96;) }}&lt;/kbd&gt;&lt;/button&gt;&lt;/span&gt;&lt;/span&gt;&lt;span class="list-style-anchor"&gt;&lt;button :title="$t('列表')" :class="{ pressed: ['list', 'ordered-list', 'task-list'].includes(selectedBlock) }" :aria-expanded="showL…</code> |
| [53](../src/EditorWorkspace.vue:53) | 界面文案 | 无序列表 | <code>…= 'list' }" @click="applyBlockStyle('list'); showListMenu = false"&gt;&lt;FormatIcon name="list" :size="15"/&gt; {{ $t('无序列表') }}&lt;kbd v-if="shortcutLabel('list')"&gt;{{ shortcutLabel('list') }}&lt;/kbd&gt;&lt;/button&gt;&lt;button :class="{ selected:…</code> |
| [53](../src/EditorWorkspace.vue:53) | 界面文案 | 有序列表 | <code>…ck="applyBlockStyle('ordered-list'); showListMenu = false"&gt;&lt;FormatIcon name="ordered-list" :size="15"/&gt; {{ $t('有序列表') }}&lt;kbd v-if="shortcutLabel('ordered-list')"&gt;{{ shortcutLabel('ordered-list') }}&lt;/kbd&gt;&lt;/button&gt;&lt;button :cla…</code> |
| [53](../src/EditorWorkspace.vue:53) | 界面文案 | 任务列表 | <code>…st' }" @click="applyBlockStyle('task-list'); showListMenu = false"&gt;&lt;FormatIcon name="task" :size="15"/&gt; {{ $t('任务列表') }}&lt;kbd v-if="shortcutLabel('task-list')"&gt;{{ shortcutLabel('task-list') }}&lt;/kbd&gt;&lt;/button&gt;&lt;/span&gt;&lt;/span&gt;&lt;spa…</code> |
| [53](../src/EditorWorkspace.vue:53) | 界面文案 | 插入片段 | <code>…&gt;{{ shortcutLabel('task-list') }}&lt;/kbd&gt;&lt;/button&gt;&lt;/span&gt;&lt;/span&gt;&lt;span class="snippet-anchor"&gt;&lt;button :title="$t('插入片段')" :aria-expanded="showInlineSnippetMenu" @click="showInlineSnippetMenu = !showInlineSnippetMenu"&gt;&lt;FormatIco…</code> |
| [53](../src/EditorWorkspace.vue:53) | 界面文案 | 在设置中添加片段后，可从这里插入 | <code>…pet(item.content); showInlineSnippetMenu = false"&gt;{{ item.name }}&lt;/button&gt;&lt;span v-if="!snippets.length"&gt;{{ $t('在设置中添加片段后，可从这里插入') }}&lt;/span&gt;&lt;/span&gt;&lt;/span&gt;&lt;PluginActions location="format-toolbar"/&gt;&lt;span class="block-actions-anchor"&gt;&lt;butto…</code> |
| [53](../src/EditorWorkspace.vue:53) | 界面文案 | 更多操作 | <code>…&lt;/span&gt;&lt;/span&gt;&lt;PluginActions location="format-toolbar"/&gt;&lt;span class="block-actions-anchor"&gt;&lt;button :title="$t('更多操作')" :aria-expanded="showBlockActions" @click="showBlockActions = !showBlockActions"&gt;&lt;FormatIcon name="more" :…</code> |
| [53](../src/EditorWorkspace.vue:53) | 界面文案 | 格式化 | <code>…k="format('format-document'); showBlockActions = false"&gt;&lt;FormatIcon name="format-document" :size="15"/&gt; {{ $t('格式化') }}&lt;kbd v-if="shortcutLabel('format-document')"&gt;{{ shortcutLabel('format-document') }}&lt;/kbd&gt;&lt;/button&gt;&lt;div c…</code> |
| [53](../src/EditorWorkspace.vue:53) | 界面文案 | 复制为 Markdown | <code>…separator"/&gt;&lt;button @click="copyCurrentBlock('markdown')"&gt;&lt;FormatIcon name="copy-markdown" :size="15"/&gt; {{ $t('复制为 Markdown') }}&lt;/button&gt;&lt;button @click="copyCurrentBlock('html')"&gt;&lt;FormatIcon name="copy-html" :size="15"/&gt; {{ $t('复制为…</code> |
| [53](../src/EditorWorkspace.vue:53) | 界面文案 | 复制为 HTML | <code>…rkdown') }}&lt;/button&gt;&lt;button @click="copyCurrentBlock('html')"&gt;&lt;FormatIcon name="copy-html" :size="15"/&gt; {{ $t('复制为 HTML') }}&lt;/button&gt;&lt;button @click="copyCurrentBlock('image')"&gt;&lt;FormatIcon name="copy-image" :size="15"/&gt; {{ $t('复制…</code> |
| [53](../src/EditorWorkspace.vue:53) | 界面文案 | 复制为图片 | <code>…HTML') }}&lt;/button&gt;&lt;button @click="copyCurrentBlock('image')"&gt;&lt;FormatIcon name="copy-image" :size="15"/&gt; {{ $t('复制为图片') }}&lt;/button&gt;&lt;button @click="copyCurrentBlock('plain')"&gt;&lt;FormatIcon name="copy-plain" :size="15"/&gt; {{ $t('复制…</code> |
| [53](../src/EditorWorkspace.vue:53) | 界面文案 | 复制为纯文本 | <code>…制为图片') }}&lt;/button&gt;&lt;button @click="copyCurrentBlock('plain')"&gt;&lt;FormatIcon name="copy-plain" :size="15"/&gt; {{ $t('复制为纯文本') }}&lt;/button&gt;&lt;div class="block-menu-separator"/&gt;&lt;button @click="toolbarEnabled = false; showBlockActions = f…</code> |
| [53](../src/EditorWorkspace.vue:53) | 界面文案 | 隐藏工具栏 | <code>…@click="toolbarEnabled = false; showBlockActions = false"&gt;&lt;FormatIcon name="hide-toolbar" :size="15"/&gt; {{ $t('隐藏工具栏') }}&lt;kbd v-if="shortcutLabel('hide-toolbar')"&gt;{{ shortcutLabel('hide-toolbar') }}&lt;/kbd&gt;&lt;/button&gt;&lt;/span&gt;&lt;/spa…</code> |
| [57](../src/EditorWorkspace.vue:57) | 界面文案 | 调整预览栏宽度 | <code>&lt;div v-if="mode === 'split'" class="pane-resizer preview-resizer" role="separator" aria-orientation="vertical" :aria-label="$t('调整预览栏宽度')" @pointerdown="startResize('preview', $event)"/&gt;</code> |

<a id="src-files-fileformats-ts"></a>

## src/files/fileFormats.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [20](../src/files/fileFormats.ts:20) | 文案定义／其他 | 纯文本 | <code>return { markdown: 'Markdown', text: '纯文本', convertible: '转换为 Markdown', unsupported: '不支持' }[kind]</code> |
| [20](../src/files/fileFormats.ts:20) | 文案定义／其他 | 转换为 Markdown | <code>return { markdown: 'Markdown', text: '纯文本', convertible: '转换为 Markdown', unsupported: '不支持' }[kind]</code> |
| [20](../src/files/fileFormats.ts:20) | 文案定义／其他 | 不支持 | <code>return { markdown: 'Markdown', text: '纯文本', convertible: '转换为 Markdown', unsupported: '不支持' }[kind]</code> |

<a id="src-files-fileheadingmenu-vue"></a>

## src/files/FileHeadingMenu.vue

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [27](../src/files/FileHeadingMenu.vue:27) | 界面文案 | 文件 | <code>…r new-menu-trigger file-heading-menu-trigger" :aria-expanded="open" aria-haspopup="menu" @click="toggle"&gt;{{$t('文件')}}&lt;ChevronDown :size="11"/&gt;&lt;/button&gt;&lt;/Teleport&gt;</code> |
| [28](../src/files/FileHeadingMenu.vue:28) | 界面文案 | 文件 | <code>…f="open" ref="menu" class="workspace-create-menu new-item-menu file-heading-menu" role="menu" :aria-label="$t('文件')" :style="position"&gt;&lt;button role="menuitem" :disabled="!canCreate" @click="create()"&gt;&lt;FilePlus2 :size="14"/…</code> |
| [28](../src/files/FileHeadingMenu.vue:28) | 界面文案 | 新建文件 | <code>…style="position"&gt;&lt;button role="menuitem" :disabled="!canCreate" @click="create()"&gt;&lt;FilePlus2 :size="14"/&gt;{{$t('新建文件')}}&lt;/button&gt;&lt;button role="menuitem" :disabled="!canCreate" @click="create(true)"&gt;&lt;FolderPlus :size="14"/&gt;{{$…</code> |
| [28](../src/files/FileHeadingMenu.vue:28) | 界面文案 | 新建文件夹 | <code>…)}}&lt;/button&gt;&lt;button role="menuitem" :disabled="!canCreate" @click="create(true)"&gt;&lt;FolderPlus :size="14"/&gt;{{$t('新建文件夹')}}&lt;/button&gt;&lt;button role="menuitem" :disabled="!canCreate&#124;&#124;!templates.length" :aria-expanded="templatesOpen"…</code> |
| [28](../src/files/FileHeadingMenu.vue:28) | 界面文案 | 从模板创建 | <code>…aria-expanded="templatesOpen" aria-haspopup="menu" @click="toggleTemplates"&gt;&lt;FilePlus2 :size="14"/&gt;&lt;span&gt;{{$t('从模板创建')}}&lt;/span&gt;&lt;ChevronRight :size="12"/&gt;&lt;/button&gt;&lt;/div&gt;&lt;/Teleport&gt;</code> |
| [29](../src/files/FileHeadingMenu.vue:29) | 界面文案 | 从模板创建 | <code>…ateMenu" class="workspace-template-menu new-item-menu file-heading-template-menu" role="menu" :aria-label="$t('从模板创建')" :style="templatePosition"&gt;&lt;button v-for="item in templates" :key="item.id" role="menuitem" :disabled="!ca…</code> |
| [29](../src/files/FileHeadingMenu.vue:29) | 界面文案 | 未命名文件.md | <code>…"item.id" role="menuitem" :disabled="!canCreate" @click="create(false,item)"&gt;&lt;span&gt;{{renderTemplate(item.name,'未命名文件.md',date)}}&lt;/span&gt;&lt;/button&gt;&lt;/div&gt;&lt;/Teleport&gt;</code> |

<a id="src-files-filetreepanel-vue"></a>

## src/files/FileTreePanel.vue

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [109](../src/files/FileTreePanel.vue:109) | 界面文案 | ${sideView === 'tree' ? $t('切换到文件列表') : $t('切换到文件树')} ⌘⇧L | <code>…':fileActionsAlwaysVisible}"&gt;&lt;span class="side-tools-spacer"/&gt;&lt;button class="icon-button view-toggle" :title="&#96;${sideView === 'tree' ? $t('切换到文件列表') : $t('切换到文件树')} ⌘⇧L&#96;" :aria-label="sideView === 'tree' ? $t('切换到文件列表') : $t('切换到文件树')" @click="sideView = sideView === 'tree' ?…</code> |
| [109](../src/files/FileTreePanel.vue:109) | 界面文案 | 切换到文件列表 | <code>…e" :title="&#96;${sideView === 'tree' ? $t('切换到文件列表') : $t('切换到文件树')} ⌘⇧L&#96;" :aria-label="sideView === 'tree' ? $t('切换到文件列表') : $t('切换到文件树')" @click="sideView = sideView === 'tree' ? 'list' : 'tree'"&gt;&lt;LayoutList v-if="sideView === '…</code> |
| [109](../src/files/FileTreePanel.vue:109) | 界面文案 | 切换到文件树 | <code>…deView === 'tree' ? $t('切换到文件列表') : $t('切换到文件树')} ⌘⇧L&#96;" :aria-label="sideView === 'tree' ? $t('切换到文件列表') : $t('切换到文件树')" @click="sideView = sideView === 'tree' ? 'list' : 'tree'"&gt;&lt;LayoutList v-if="sideView === 'tree'" :size="1…</code> |
| [109](../src/files/FileTreePanel.vue:109) | 界面文案 | 搜索文件与内容 ⌘⇧F | <code>…=== 'tree'" :size="14"/&gt;&lt;FileTreeViewIcon v-else :size="14"/&gt;&lt;/button&gt;&lt;button class="icon-button" :title="$t('搜索文件与内容 ⌘⇧F')" @click="toggleWorkspaceSearch"&gt;&lt;Search :size="14"/&gt;&lt;/button&gt;&lt;span class="file-menu-anchor"&gt;&lt;button ref="f…</code> |
| [109](../src/files/FileTreePanel.vue:109) | 界面文案 | 筛选文件 | <code>…loating-menu" :style="fileMenuPosition" role="group" :aria-label="$t('文件筛选')"&gt;&lt;div class="menu-heading"&gt;{{ $t('筛选文件') }}&lt;/div&gt;&lt;label&gt;&lt;input v-model="utf8Only" type="checkbox"&gt;UTF-8&lt;/label&gt;&lt;label&gt;&lt;input v-model="excludeExtens…</code> |
| [109](../src/files/FileTreePanel.vue:109) | 界面文案 | 文件筛选 | <code>…lter" class="file-filter-menu file-tree-floating-menu" :style="fileMenuPosition" role="group" :aria-label="$t('文件筛选')"&gt;&lt;div class="menu-heading"&gt;{{ $t('筛选文件') }}&lt;/div&gt;&lt;label&gt;&lt;input v-model="utf8Only" type="checkbox"&gt;UTF-8&lt;/l…</code> |
| [109](../src/files/FileTreePanel.vue:109) | 界面文案 | UTF-8 | <code>…"$t('文件筛选')"&gt;&lt;div class="menu-heading"&gt;{{ $t('筛选文件') }}&lt;/div&gt;&lt;label&gt;&lt;input v-model="utf8Only" type="checkbox"&gt;UTF-8&lt;/label&gt;&lt;label&gt;&lt;input v-model="excludeExtensionless" type="checkbox"&gt;{{ $t('排除无扩展名') }}&lt;/label&gt;&lt;label&gt;&lt;input v…</code> |
| [109](../src/files/FileTreePanel.vue:109) | 界面文案 | 排除无扩展名 | <code>…el="utf8Only" type="checkbox"&gt;UTF-8&lt;/label&gt;&lt;label&gt;&lt;input v-model="excludeExtensionless" type="checkbox"&gt;{{ $t('排除无扩展名') }}&lt;/label&gt;&lt;label&gt;&lt;input v-model="excludeHidden" type="checkbox"&gt;{{ $t('排除隐藏文件') }}&lt;/label&gt;&lt;label&gt;&lt;input v-…</code> |
| [109](../src/files/FileTreePanel.vue:109) | 界面文案 | 排除隐藏文件 | <code>…onless" type="checkbox"&gt;{{ $t('排除无扩展名') }}&lt;/label&gt;&lt;label&gt;&lt;input v-model="excludeHidden" type="checkbox"&gt;{{ $t('排除隐藏文件') }}&lt;/label&gt;&lt;label&gt;&lt;input v-model="hideEmptyFolders" type="checkbox"&gt;{{ $t('隐藏空文件夹') }}&lt;/label&gt;&lt;div class="f…</code> |
| [109](../src/files/FileTreePanel.vue:109) | 界面文案 | 隐藏空文件夹 | <code>…den" type="checkbox"&gt;{{ $t('排除隐藏文件') }}&lt;/label&gt;&lt;label&gt;&lt;input v-model="hideEmptyFolders" type="checkbox"&gt;{{ $t('隐藏空文件夹') }}&lt;/label&gt;&lt;div class="file-filter-presets" :aria-label="$t('常用扩展名')"&gt;&lt;button v-for="extension in commonFil…</code> |
| [109](../src/files/FileTreePanel.vue:109) | 界面文案 | 常用扩展名 | <code>…"hideEmptyFolders" type="checkbox"&gt;{{ $t('隐藏空文件夹') }}&lt;/label&gt;&lt;div class="file-filter-presets" :aria-label="$t('常用扩展名')"&gt;&lt;button v-for="extension in commonFileExtensions" :key="extension" type="button" :aria-pressed="selectedF…</code> |
| [109](../src/files/FileTreePanel.vue:109) | 界面文案 | 无扩展名 | <code>…xtension)"&gt;{{ extension }}&lt;/button&gt;&lt;button type="button" :aria-pressed="includeExtensionless" :aria-label="$t('无扩展名')" @click="includeExtensionless = !includeExtensionless"&gt;{{ $t('无') }}&lt;/button&gt;&lt;/div&gt;&lt;label class="file-filt…</code> |
| [109](../src/files/FileTreePanel.vue:109) | 界面文案 | 无 | <code>…d="includeExtensionless" :aria-label="$t('无扩展名')" @click="includeExtensionless = !includeExtensionless"&gt;{{ $t('无') }}&lt;/button&gt;&lt;/div&gt;&lt;label class="file-filter-extensions"&gt;&lt;input v-model="fileExtensions" :aria-label="$t('筛选…</code> |
| [109](../src/files/FileTreePanel.vue:109) | 界面文案 | 筛选扩展名 | <code>…t('无') }}&lt;/button&gt;&lt;/div&gt;&lt;label class="file-filter-extensions"&gt;&lt;input v-model="fileExtensions" :aria-label="$t('筛选扩展名')" placeholder="md, txt, js" type="text"/&gt;&lt;/label&gt;&lt;/div&gt;&lt;/Teleport&gt;&lt;/span&gt;&lt;span class="file-menu-anchor"&gt;&lt;bu…</code> |
| [109](../src/files/FileTreePanel.vue:109) | 界面文案 | md, txt, js | <code>…v&gt;&lt;label class="file-filter-extensions"&gt;&lt;input v-model="fileExtensions" :aria-label="$t('筛选扩展名')" placeholder="md, txt, js" type="text"/&gt;&lt;/label&gt;&lt;/div&gt;&lt;/Teleport&gt;&lt;/span&gt;&lt;span class="file-menu-anchor"&gt;&lt;button ref="sortTrigger" class…</code> |
| [109](../src/files/FileTreePanel.vue:109) | 界面文案 | ${$t('排序：{0}', { '0': selectedSort.label })} ⌘⇧S | <code>…port&gt;&lt;/span&gt;&lt;span class="file-menu-anchor"&gt;&lt;button ref="sortTrigger" class="icon-button sort-trigger" :title="&#96;${$t('排序：{0}', { '0': selectedSort.label })} ⌘⇧S&#96;" :aria-label="$t('排序：{0}', { '0': selectedSort.label })" :aria-expanded="showSortMenu" @click="showSortMenu…</code> |
| [109](../src/files/FileTreePanel.vue:109) | 界面文案 | 排序：{0} | <code>…class="icon-button sort-trigger" :title="&#96;${$t('排序：{0}', { '0': selectedSort.label })} ⌘⇧S&#96;" :aria-label="$t('排序：{0}', { '0': selectedSort.label })" :aria-expanded="showSortMenu" @click="showSortMenu = !showSortMenu; showFile…</code> |
| [109](../src/files/FileTreePanel.vue:109) | 界面文案 | 排序方式 | <code>…SortMenu" class="sort-menu file-tree-floating-menu" :style="fileMenuPosition"&gt;&lt;div class="menu-heading"&gt;{{ $t('排序方式') }}&lt;/div&gt;&lt;button v-for="option in sortOptions" :key="option.value" :class="{ selected: sortMode === option.…</code> |
| [114](../src/files/FileTreePanel.vue:114) | 界面文案 | 同步 | <code>&lt;div class="directory-sync-title"&gt;{{ $t('同步') }}&lt;/div&gt;</code> |
| [116](../src/files/FileTreePanel.vue:116) | 界面文案 | GitHub | <code>&lt;div class="directory-sync-heading"&gt;&lt;Github :size="15"/&gt;&lt;strong&gt;GitHub&lt;/strong&gt;&lt;/div&gt;</code> |
| [117](../src/files/FileTreePanel.vue:117) | 界面文案 | 正在解除绑定… | <code>…abled="githubRepoBusy &#124;&#124; !!githubUnbindPendingRoot" @click="unbindGithubRepo"&gt;{{ githubUnbindPendingRoot ? $t('正在解除绑定…') : $t('解除绑定') }}&lt;/button&gt;&lt;/div&gt;&lt;/div&gt;&lt;/template&gt;</code> |
| [117](../src/files/FileTreePanel.vue:117) | 界面文案 | 解除绑定 | <code>…oBusy &#124;&#124; !!githubUnbindPendingRoot" @click="unbindGithubRepo"&gt;{{ githubUnbindPendingRoot ? $t('正在解除绑定…') : $t('解除绑定') }}&lt;/button&gt;&lt;/div&gt;&lt;/div&gt;&lt;/template&gt;</code> |
| [118](../src/files/FileTreePanel.vue:118) | 界面文案 | 新建 | <code>…nt="createGithubRepo"/&gt;&lt;button :disabled="githubRepoBusy &#124;&#124; !githubRepoDraft" @click="createGithubRepo"&gt;{{ $t('新建') }}&lt;/button&gt;&lt;/div&gt;&lt;div v-else class="directory-sync-list"&gt;&lt;div v-for="repo in githubRepos" :key="repo.url"&gt;…</code> |
| [118](../src/files/FileTreePanel.vue:118) | 界面文案 | 或 | <code>…an&gt;&lt;button class="directory-sync-create-link" @click="githubCreatingRepo = true"&gt;{{ $t('新建') }}&lt;/button&gt;{{ $t('或') }}&lt;button class="directory-sync-create-link" @click="githubCreatingRepo = false; githubRepoDraft = ''"&gt;{{…</code> |
| [118](../src/files/FileTreePanel.vue:118) | 界面文案 | 选择 | <code>…}}&lt;button class="directory-sync-create-link" @click="githubCreatingRepo = false; githubRepoDraft = ''"&gt;{{ $t('选择') }}&lt;/button&gt;{{ $t('私有仓库') }}&lt;/span&gt;&lt;button v-if="!githubCreatingRepo" class="directory-sync-refresh" :disab…</code> |
| [118](../src/files/FileTreePanel.vue:118) | 界面文案 | 私有仓库 | <code>…tory-sync-create-link" @click="githubCreatingRepo = false; githubRepoDraft = ''"&gt;{{ $t('选择') }}&lt;/button&gt;{{ $t('私有仓库') }}&lt;/span&gt;&lt;button v-if="!githubCreatingRepo" class="directory-sync-refresh" :disabled="githubRepoBusy" :tit…</code> |
| [118](../src/files/FileTreePanel.vue:118) | 界面文案 | 刷新仓库列表 | <code>…CreatingRepo" class="directory-sync-refresh" :disabled="githubRepoBusy" :title="$t('刷新仓库列表')" :aria-label="$t('刷新仓库列表')" @click="loadGithubRepos"&gt;&lt;RotateCcw :size="14"/&gt;&lt;/button&gt;&lt;/div&gt;&lt;div v-if="githubCreatingRepo" class="dire…</code> |
| [118](../src/files/FileTreePanel.vue:118) | 界面文案 | 私有仓库名称 | <code>…Repo" class="directory-sync-create github-repo-create"&gt;&lt;input v-model.trim="githubRepoDraft" :placeholder="$t('私有仓库名称')" :aria-label="$t('新建私有仓库名称')" @keydown.enter.prevent="createGithubRepo"/&gt;&lt;button :disabled="githubRepoBusy…</code> |
| [118](../src/files/FileTreePanel.vue:118) | 界面文案 | 新建私有仓库名称 | <code>…-create github-repo-create"&gt;&lt;input v-model.trim="githubRepoDraft" :placeholder="$t('私有仓库名称')" :aria-label="$t('新建私有仓库名称')" @keydown.enter.prevent="createGithubRepo"/&gt;&lt;button :disabled="githubRepoBusy &#124;&#124; !githubRepoDraft" @click=…</code> |
| [118](../src/files/FileTreePanel.vue:118) | 界面文案 | 绑定 | <code>…ullName"&gt;{{ repo.fullName }}&lt;/span&gt;&lt;button :disabled="githubRepoBusy" @click="bindGithubRepo(repo.url)"&gt;{{ $t('绑定') }}&lt;/button&gt;&lt;/div&gt;&lt;p v-if="!githubRepos.length"&gt;{{ $t('没有可选仓库，可创建私有仓库后绑定') }}&lt;/p&gt;&lt;/div&gt;&lt;/template&gt;</code> |
| [118](../src/files/FileTreePanel.vue:118) | 界面文案 | 没有可选仓库，可创建私有仓库后绑定 | <code>…bRepoBusy" @click="bindGithubRepo(repo.url)"&gt;{{ $t('绑定') }}&lt;/button&gt;&lt;/div&gt;&lt;p v-if="!githubRepos.length"&gt;{{ $t('没有可选仓库，可创建私有仓库后绑定') }}&lt;/p&gt;&lt;/div&gt;&lt;/template&gt;</code> |
| [121](../src/files/FileTreePanel.vue:121) | 界面文案 | WebDAV | <code>&lt;div class="directory-sync-heading"&gt;&lt;Cloud :size="15"/&gt;&lt;strong&gt;WebDAV&lt;/strong&gt;&lt;/div&gt;</code> |
| [122](../src/files/FileTreePanel.vue:122) | 界面文案 | 正在解除绑定… | <code>…="webdavBindingBusy &#124;&#124; !!webdavUnbindPendingRoot" @click="unbindWebdavFolder"&gt;{{ webdavUnbindPendingRoot ? $t('正在解除绑定…') : $t('解除绑定') }}&lt;/button&gt;&lt;/div&gt;&lt;/div&gt;&lt;/template&gt;</code> |
| [122](../src/files/FileTreePanel.vue:122) | 界面文案 | 解除绑定 | <code>…usy &#124;&#124; !!webdavUnbindPendingRoot" @click="unbindWebdavFolder"&gt;{{ webdavUnbindPendingRoot ? $t('正在解除绑定…') : $t('解除绑定') }}&lt;/button&gt;&lt;/div&gt;&lt;/div&gt;&lt;/template&gt;</code> |
| [123](../src/files/FileTreePanel.vue:123) | 界面文案 | 新建或输入远端文件夹路径 | <code>…&lt;template v-else&gt;&lt;div class="directory-sync-create"&gt;&lt;input v-model.trim="webdavFolderDraft" :placeholder="$t('新建或输入远端文件夹路径')" :aria-label="$t('WebDAV 远端文件夹路径')"/&gt;&lt;button :disabled="webdavBindingBusy &#124;&#124; !webdavFolderDraft" @click="b…</code> |
| [123](../src/files/FileTreePanel.vue:123) | 界面文案 | WebDAV 远端文件夹路径 | <code>…ectory-sync-create"&gt;&lt;input v-model.trim="webdavFolderDraft" :placeholder="$t('新建或输入远端文件夹路径')" :aria-label="$t('WebDAV 远端文件夹路径')"/&gt;&lt;button :disabled="webdavBindingBusy &#124;&#124; !webdavFolderDraft" @click="bindWebdavFolder()"&gt;{{ $t('创建并绑定') }…</code> |
| [123](../src/files/FileTreePanel.vue:123) | 界面文案 | 创建并绑定 | <code>…DAV 远端文件夹路径')"/&gt;&lt;button :disabled="webdavBindingBusy &#124;&#124; !webdavFolderDraft" @click="bindWebdavFolder()"&gt;{{ $t('创建并绑定') }}&lt;/button&gt;&lt;/div&gt;&lt;div class="directory-sync-list-head"&gt;&lt;span&gt;{{ $t('已有远端文件夹') }}&lt;/span&gt;&lt;button :disabled="…</code> |
| [123](../src/files/FileTreePanel.vue:123) | 界面文案 | 已有远端文件夹 | <code>…@click="bindWebdavFolder()"&gt;{{ $t('创建并绑定') }}&lt;/button&gt;&lt;/div&gt;&lt;div class="directory-sync-list-head"&gt;&lt;span&gt;{{ $t('已有远端文件夹') }}&lt;/span&gt;&lt;button :disabled="webdavFoldersBusy" @click="loadWebdavFolders"&gt;{{ $t('刷新') }}&lt;/button&gt;&lt;/div&gt;&lt;di…</code> |
| [123](../src/files/FileTreePanel.vue:123) | 界面文案 | 刷新 | <code>…-head"&gt;&lt;span&gt;{{ $t('已有远端文件夹') }}&lt;/span&gt;&lt;button :disabled="webdavFoldersBusy" @click="loadWebdavFolders"&gt;{{ $t('刷新') }}&lt;/button&gt;&lt;/div&gt;&lt;div class="directory-sync-list"&gt;&lt;div v-for="folder in webdavFolders" :key="folder"&gt;&lt;span…</code> |
| [123](../src/files/FileTreePanel.vue:123) | 界面文案 | 绑定 | <code>…tle="folder"&gt;{{ folder }}&lt;/span&gt;&lt;button :disabled="webdavBindingBusy" @click="bindWebdavFolder(folder)"&gt;{{ $t('绑定') }}&lt;/button&gt;&lt;/div&gt;&lt;p v-if="!webdavFolders.length"&gt;{{ $t('没有可选文件夹，可输入路径创建') }}&lt;/p&gt;&lt;/div&gt;&lt;/template&gt;</code> |
| [123](../src/files/FileTreePanel.vue:123) | 界面文案 | 没有可选文件夹，可输入路径创建 | <code>…ingBusy" @click="bindWebdavFolder(folder)"&gt;{{ $t('绑定') }}&lt;/button&gt;&lt;/div&gt;&lt;p v-if="!webdavFolders.length"&gt;{{ $t('没有可选文件夹，可输入路径创建') }}&lt;/p&gt;&lt;/div&gt;&lt;/template&gt;</code> |
| [127](../src/files/FileTreePanel.vue:127) | 界面文案 | 搜索文件名或文件内容 | <code>&lt;input v-if="showSearch" ref="searchInput" v-model="search" class="search-input" :placeholder="$t('搜索文件名或文件内容')" :aria-label="$t('搜索文件名或文件内容')" /&gt;</code> |
| [128](../src/files/FileTreePanel.vue:128) | 界面文案 | {0} 同步设置 | <code>…on" :class="{ active: showDirectorySync }" :title="$t('{0} 同步设置', { '0': currentDirectory })" :aria-label="$t('{0} 同步设置', { '0': currentDirectory })" :aria-expanded="showDirectorySync" aria-controls="directory-sync-panel" @click…</code> |
| [128](../src/files/FileTreePanel.vue:128) | 界面文案 | 手动同步 | <code>…class="icon-button root-manual-sync" :disabled="directorySyncBusy" :title="directorySyncHint" :aria-label="$t('手动同步')" @click.stop="runDirectorySync"&gt;&lt;RefreshCw :size="12"/&gt;&lt;/button&gt;&lt;/div&gt;</code> |
| [130](../src/files/FileTreePanel.vue:130) | 界面文案 | 打开文件夹后，可在这里浏览文件。 | <code>&lt;div v-if="isTauri &amp;&amp; !docs.length" class="empty-state"&gt;{{ $t('打开文件夹后，可在这里浏览文件。') }}&lt;/div&gt;</code> |
| [132](../src/files/FileTreePanel.vue:132) | 界面文案 | 新建文件夹 | <code>…ut :ref="focusCreationInput" v-model="inlineCreation.name" :aria-label="inlineCreation.kind === 'folder' ? $t('新建文件夹') : $t('新建文件')" @keydown.enter.prevent="finishInlineCreation(true)" @keydown.esc.prevent.stop="finishInlineC…</code> |
| [132](../src/files/FileTreePanel.vue:132) | 界面文案 | 新建文件 | <code>…CreationInput" v-model="inlineCreation.name" :aria-label="inlineCreation.kind === 'folder' ? $t('新建文件夹') : $t('新建文件')" @keydown.enter.prevent="finishInlineCreation(true)" @keydown.esc.prevent.stop="finishInlineCreation(false…</code> |
| [135](../src/files/FileTreePanel.vue:135) | 界面文案 | 重命名${row.path} | <code>…&#124;&#124; ''" @input="inlineRename &amp;&amp; (inlineRename.name = ($event.target as HTMLInputElement).value)" :aria-label="&#96;重命名${row.path}&#96;" @keydown.enter.prevent="commitInlineRename" @keydown.esc.prevent="inlineRename = null" @blur="commitInline…</code> |
| [136](../src/files/FileTreePanel.vue:136) | 界面文案 | 重命名${row.doc.path} | <code>…&#124;&#124; ''" @input="inlineRename &amp;&amp; (inlineRename.name = ($event.target as HTMLInputElement).value)" :aria-label="&#96;重命名${row.doc.path}&#96;" @keydown.enter.prevent="commitInlineRename" @keydown.esc.prevent="inlineRename = null" @blur="commitInline…</code> |
| [136](../src/files/FileTreePanel.vue:136) | 界面文案 | 未保存 | <code>…w.doc.path.split('/').pop() }}&lt;/span&gt;&lt;span v-if="dirtyIds.includes(row.doc.id)" class="dirty-mark" :title="$t('未保存')"&gt;*&lt;/span&gt;&lt;/button&gt;&lt;/div&gt;</code> |
| [136](../src/files/FileTreePanel.vue:136) | 界面文案 | * | <code>…th.split('/').pop() }}&lt;/span&gt;&lt;span v-if="dirtyIds.includes(row.doc.id)" class="dirty-mark" :title="$t('未保存')"&gt;*&lt;/span&gt;&lt;/button&gt;&lt;/div&gt;</code> |
| [137](../src/files/FileTreePanel.vue:137) | 界面文案 | 新建文件夹 | <code>…ut :ref="focusCreationInput" v-model="inlineCreation.name" :aria-label="inlineCreation.kind === 'folder' ? $t('新建文件夹') : $t('新建文件')" @keydown.enter.prevent="finishInlineCreation(true)" @keydown.esc.prevent.stop="finishInlineC…</code> |
| [137](../src/files/FileTreePanel.vue:137) | 界面文案 | 新建文件 | <code>…CreationInput" v-model="inlineCreation.name" :aria-label="inlineCreation.kind === 'folder' ? $t('新建文件夹') : $t('新建文件')" @keydown.enter.prevent="finishInlineCreation(true)" @keydown.esc.prevent.stop="finishInlineCreation(false…</code> |
| [141](../src/files/FileTreePanel.vue:141) | 界面文案 | 未保存 | <code>…n&gt;&lt;strong&gt;{{ doc.path.split('/').pop() }}&lt;span v-if="dirtyIds.includes(doc.id)" class="dirty-mark" :title="$t('未保存')"&gt;*&lt;/span&gt;&lt;/strong&gt;&lt;span class="doc-excerpt"&gt;&lt;span&gt;{{ documentExcerpts[doc.id]?.before }}&lt;/span&gt;&lt;mark v-if=…</code> |
| [141](../src/files/FileTreePanel.vue:141) | 界面文案 | * | <code>…g&gt;{{ doc.path.split('/').pop() }}&lt;span v-if="dirtyIds.includes(doc.id)" class="dirty-mark" :title="$t('未保存')"&gt;*&lt;/span&gt;&lt;/strong&gt;&lt;span class="doc-excerpt"&gt;&lt;span&gt;{{ documentExcerpts[doc.id]?.before }}&lt;/span&gt;&lt;mark v-if="docum…</code> |
| [144](../src/files/FileTreePanel.vue:144) | 界面文案 | 新建文件 | <code>…left: &#96;${itemActions.x}px&#96;, top: &#96;${itemActions.y}px&#96; }"&gt;&lt;button @click="createFromContextMenu('file')"&gt;{{ $t('新建文件') }}&lt;/button&gt;&lt;button @click="createFromContextMenu('folder')"&gt;{{ $t('新建文件夹') }}&lt;/button&gt;&lt;div class="item-men…</code> |
| [144](../src/files/FileTreePanel.vue:144) | 界面文案 | 新建文件夹 | <code>…reateFromContextMenu('file')"&gt;{{ $t('新建文件') }}&lt;/button&gt;&lt;button @click="createFromContextMenu('folder')"&gt;{{ $t('新建文件夹') }}&lt;/button&gt;&lt;div class="item-menu-separator"/&gt;&lt;button :disabled="itemActions.path === ''" @click="runItemAc…</code> |
| [144](../src/files/FileTreePanel.vue:144) | 界面文案 | 重命名 | <code>…ass="item-menu-separator"/&gt;&lt;button :disabled="itemActions.path === ''" @click="runItemAction('rename')"&gt;{{ $t('重命名') }}&lt;/button&gt;&lt;button :disabled="itemActions.path === ''" @click="runItemAction('trash')"&gt;{{ $t('删除') }}&lt;/but…</code> |
| [144](../src/files/FileTreePanel.vue:144) | 界面文案 | 删除 | <code>…')"&gt;{{ $t('重命名') }}&lt;/button&gt;&lt;button :disabled="itemActions.path === ''" @click="runItemAction('trash')"&gt;{{ $t('删除') }}&lt;/button&gt;&lt;div class="item-menu-separator"/&gt;&lt;button @click="runItemUtility('window')"&gt;{{ $t('从新窗口打开') }}&lt;…</code> |
| [144](../src/files/FileTreePanel.vue:144) | 界面文案 | 从新窗口打开 | <code>…h')"&gt;{{ $t('删除') }}&lt;/button&gt;&lt;div class="item-menu-separator"/&gt;&lt;button @click="runItemUtility('window')"&gt;{{ $t('从新窗口打开') }}&lt;/button&gt;&lt;button @click="runItemUtility('reveal')"&gt;{{ isMac ? $t('在 Finder 中显示') : $t('在资源管理器中显示') }}&lt;/b…</code> |
| [144](../src/files/FileTreePanel.vue:144) | 界面文案 | 在 Finder 中显示 | <code>…"runItemUtility('window')"&gt;{{ $t('从新窗口打开') }}&lt;/button&gt;&lt;button @click="runItemUtility('reveal')"&gt;{{ isMac ? $t('在 Finder 中显示') : $t('在资源管理器中显示') }}&lt;/button&gt;&lt;button @click="runItemUtility('copy')"&gt;{{ $t('复制路径') }}&lt;/button&gt;&lt;button @cli…</code> |
| [144](../src/files/FileTreePanel.vue:144) | 界面文案 | 在资源管理器中显示 | <code>…ow')"&gt;{{ $t('从新窗口打开') }}&lt;/button&gt;&lt;button @click="runItemUtility('reveal')"&gt;{{ isMac ? $t('在 Finder 中显示') : $t('在资源管理器中显示') }}&lt;/button&gt;&lt;button @click="runItemUtility('copy')"&gt;{{ $t('复制路径') }}&lt;/button&gt;&lt;button @click="runItemUtility…</code> |
| [144](../src/files/FileTreePanel.vue:144) | 界面文案 | 复制路径 | <code>…l')"&gt;{{ isMac ? $t('在 Finder 中显示') : $t('在资源管理器中显示') }}&lt;/button&gt;&lt;button @click="runItemUtility('copy')"&gt;{{ $t('复制路径') }}&lt;/button&gt;&lt;button @click="runItemUtility('info')"&gt;{{ isMac ? $t('显示简介') : $t('显示属性') }}&lt;/button&gt;&lt;PluginAc…</code> |
| [144](../src/files/FileTreePanel.vue:144) | 界面文案 | 显示简介 | <code>…click="runItemUtility('copy')"&gt;{{ $t('复制路径') }}&lt;/button&gt;&lt;button @click="runItemUtility('info')"&gt;{{ isMac ? $t('显示简介') : $t('显示属性') }}&lt;/button&gt;&lt;PluginActions location="file-tree" :target-path="itemActions.path" @execute="item…</code> |
| [144](../src/files/FileTreePanel.vue:144) | 界面文案 | 显示属性 | <code>…mUtility('copy')"&gt;{{ $t('复制路径') }}&lt;/button&gt;&lt;button @click="runItemUtility('info')"&gt;{{ isMac ? $t('显示简介') : $t('显示属性') }}&lt;/button&gt;&lt;PluginActions location="file-tree" :target-path="itemActions.path" @execute="itemActions = nul…</code> |
| [146](../src/files/FileTreePanel.vue:146) | 界面文案 | 打开文件夹后，可在这里浏览文件。 | <code>&lt;div v-if="isTauri &amp;&amp; !currentWorkspaceRoot" class="empty-state"&gt;{{ $t('打开文件夹后，可在这里浏览文件。') }}&lt;/div&gt;</code> |

<a id="src-files-usedocumentsafety-ts"></a>

## src/files/useDocumentSafety.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [63](../src/files/useDocumentSafety.ts:63) | 文案定义／其他 | 草稿暂存失败：{0} | <code>draftWriteQueue = draftWriteQueue.then(() =&gt; invoke&lt;void&gt;('write_draft', { relativePath, content, expectedVersion, workspaceRoot })).catch(error =&gt; notify(t('草稿暂存失败：{0}', { "0": String(error) })))</code> |
| [71](../src/files/useDocumentSafety.ts:71) | 文案定义／其他 | 文件.md | <code>const filename = doc.path.split('/').pop() &#124;&#124; '文件.md'</code> |
| [72](../src/files/useDocumentSafety.ts:72) | 文案定义／其他 | （未保存）$1 | <code>const backup: Doc = { id, path: filename.replace(/(\.[^.]+)$/, '（未保存）$1'), content: doc.content, loaded: true, temporary: true, updated: Date.now() }</code> |
| [88](../src/files/useDocumentSafety.ts:88) | 文案定义／其他 | 未保存内容恢复失败：{0} | <code>} catch (error) { notify(t('未保存内容恢复失败：{0}', { "0": String(error) })) }</code> |
| [92](../src/files/useDocumentSafety.ts:92) | 文案定义／其他 | 未保存内容暂存失败：{0} | <code>try { localStorage.setItem(externalDraftPrefix + doc.id, JSON.stringify(doc)) } catch (error) { notify(t('未保存内容暂存失败：{0}', { "0": String(error) })) }</code> |
| [107](../src/files/useDocumentSafety.ts:107) | 文案定义／其他 | 请先读取文件 | <code>if (!String(error).includes('请先读取文件')) throw error</code> |
| [119](../src/files/useDocumentSafety.ts:119) | 文案定义／其他 | 文件更新失败：{0} | <code>} catch (error) { if (stillCurrent()) notify(t('文件更新失败：{0}', { "0": String(error) })) }</code> |
| [145](../src/files/useDocumentSafety.ts:145) | 文案定义／其他 | 重新加载失败：{0} | <code>} catch (error) { if (preserve &amp;&amp; item) conflict.value = item; notify(t('重新加载失败：{0}', { "0": String(error) })) }</code> |
| [162](../src/files/useDocumentSafety.ts:162) | 文案定义／其他 | 草稿清理失败：{0} | <code>draftWriteQueue = draftWriteQueue.then(() =&gt; invoke&lt;void&gt;('clear_draft', { relativePath, workspaceRoot })).catch(error =&gt; notify(t('草稿清理失败：{0}', { "0": String(error) })))</code> |
| [188](../src/files/useDocumentSafety.ts:188) | 文案定义／其他 | 无法丢弃修改：{0} | <code>} catch (error) { notify(t('无法丢弃修改：{0}', { "0": String(error) })); queueDraft(doc); return false }</code> |
| [200](../src/files/useDocumentSafety.ts:200) | 文案定义／其他 | 请先打开本地文件 | <code>if (!doc.relativePath &#124;&#124; !doc.loaded) { notify(t('请先打开本地文件')); return }</code> |
| [214](../src/files/useDocumentSafety.ts:214) | 文案定义／其他 | 文件已保存，草稿清理失败：{0} | <code>catch (error) { notify(t('文件已保存，草稿清理失败：{0}', { "0": String(error) })); return }</code> |
| [217](../src/files/useDocumentSafety.ts:217) | 提示／错误 | 文件已保存，历史版本记录失败：${result.gitWarning} | <code>notify(result.gitWarning ? &#96;文件已保存，历史版本记录失败：${result.gitWarning}&#96; : '已保存')</code> |
| [217](../src/files/useDocumentSafety.ts:217) | 提示／错误 | 已保存 | <code>notify(result.gitWarning ? &#96;文件已保存，历史版本记录失败：${result.gitWarning}&#96; : '已保存')</code> |
| [222](../src/files/useDocumentSafety.ts:222) | 文案定义／其他 | 保存失败：{0} | <code>notify(t('保存失败：{0}', { "0": String(error) }))</code> |
| [225](../src/files/useDocumentSafety.ts:225) | 文案定义／其他 | 旧磁盘版本 | <code>if (disk.changed &#124;&#124; String(error).includes('旧磁盘版本')) { reportConflict(doc.id, disk.changed ? disk : { changed: true, missing: false, content: doc.diskContent &#124;&#124; null }) }</code> |
| [232](../src/files/useDocumentSafety.ts:232) | 文案定义／其他 | 已保存 | <code>notify(t('已保存'))</code> |

<a id="src-files-usefilenavigator-ts"></a>

## src/files/useFileNavigator.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [64](../src/files/useFileNavigator.ts:64) | 文案定义／其他 | 我的文件 | <code>return [...(isTauri ? [] : ['我的文件']), ...names.sort((a, b) =&gt; Math.max(...docs.value.filter(doc =&gt; doc.path.startsWith(b + '/')).map(doc =&gt; doc.updated)) - Math.max(...docs.value.filter(doc =&gt; doc.path.startsWith(a + '/')).map(doc =&gt; doc.updated)))]</code> |
| [78](../src/files/useFileNavigator.ts:78) | 文案定义／其他 | 打开文件失败：{0} | <code>catch (error) { notify(t('打开文件失败：{0}', { '0': String(error) })) }</code> |
| [86](../src/files/useFileNavigator.ts:86) | 文案定义／其他 | 不支持打开此格式，请选择 Markdown、纯文本、Word（DOCX）或 PDF | <code>if (fileKind(relativePath) === 'unsupported') { notify(t('不支持打开此格式，请选择 Markdown、纯文本、Word（DOCX）或 PDF')); return }</code> |
| [93](../src/files/useFileNavigator.ts:93) | 文案定义／其他 | 打开文件失败：{0} | <code>} catch (error) { notify(t('打开文件失败：{0}', { "0": String(error) })); return }</code> |
| [103](../src/files/useFileNavigator.ts:103) | 文案定义／其他 | 打开最近文件失败：{0} | <code>} catch (error) { return notify(t('打开最近文件失败：{0}', { "0": String(error) })) }</code> |
| [106](../src/files/useFileNavigator.ts:106) | 文案定义／其他 | 文件不可用，可从最近打开记录中移除 | <code>if (!doc) return notify(t('文件不可用，可从最近打开记录中移除'))</code> |
| [108](../src/files/useFileNavigator.ts:108) | 文案定义／其他 | 我的文件 | <code>if (!isTauri &amp;&amp; currentDirectory.value !== '我的文件' &amp;&amp; currentDirectory.value !== directory) currentDirectory.value = directory</code> |
| [116](../src/files/useFileNavigator.ts:116) | 文案定义／其他 | 最近打开菜单更新失败：{0} | <code>if (isTauri) void invoke('sync_recent_menus', { folders: recentDirectories.value, files: orderedRecentFiles.value.map(item =&gt; item.path) }).catch(error =&gt; notify(t('最近打开菜单更新失败：{0}', { "0": String(error) })))</code> |
| [124](../src/files/useFileNavigator.ts:124) | 文案定义／其他 | 清空最近文件夹失败：{0} | <code>catch (error) { notify(t('清空最近文件夹失败：{0}', { "0": String(error) })); return }</code> |
| [143](../src/files/useFileNavigator.ts:143) | 文案定义／其他 | 最近文件夹读取失败：{0} | <code>catch (error) { notify(t('最近文件夹读取失败：{0}', { "0": String(error) })) }</code> |
| [160](../src/files/useFileNavigator.ts:160) | 文案定义／其他 | 搜索失败：{0} | <code>} catch (error) { if (request === searchRequest) notify(t('搜索失败：{0}', { "0": String(error) })) }</code> |
| [166](../src/files/useFileNavigator.ts:166) | 文案定义／其他 | 我的文件 | <code>if (currentDirectory.value !== '我的文件' &amp;&amp; !d.path.startsWith(currentDirectory.value + '/')) return false</code> |
| [183](../src/files/useFileNavigator.ts:183) | 文案定义／其他 | 我的文件 | <code>function relativePath(doc: Doc) { return currentDirectory.value === '我的文件' ? doc.path : doc.path.slice(currentDirectory.value.length + 1) }</code> |
| [216](../src/files/useFileNavigator.ts:216) | 文案定义／其他 | 打开文件夹失败：{0} | <code>} catch (error) { notify(t('打开文件夹失败：{0}', { "0": String(error) })); return }</code> |
| [217](../src/files/useFileNavigator.ts:217) | 文案定义／其他 | 打开文件夹失败：{0} | <code>if (deps.openLocalDirectory) { try { await deps.openLocalDirectory(directory) } catch (error) { notify(t('打开文件夹失败：{0}', { '0': String(error) })) }; return }</code> |
| [219](../src/files/useFileNavigator.ts:219) | 文案定义／其他 | 重新打开文件夹失败：{0} | <code>catch (error) { notify(t('重新打开文件夹失败：{0}', { "0": String(error) })) }</code> |
| [224](../src/files/useFileNavigator.ts:224) | 文案定义／其他 | 我的文件 | <code>const first = docs.value.find(doc =&gt; directory === '我的文件' &#124;&#124; doc.path.startsWith(directory + '/'))</code> |

<a id="src-files-usefileresources-ts"></a>

## src/files/useFileResources.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [26](../src/files/useFileResources.ts:26) | 文案定义／其他 | 修复 {0}:{1} · 新相对路径 | <code>const replacement = await askFileAction(t('修复 {0}:{1} · 新相对路径', { '0': item.source, '1': item.line }), item.target)</code> |
| [29](../src/files/useFileResources.ts:29) | 文案定义／其他 | 目标无效：{0} | <code>catch (error) { notify(t('目标无效：{0}', { "0": String(error) })); return }</code> |
| [35](../src/files/useFileResources.ts:35) | 文案定义／其他 | 原位置已修改，请重新检查链接 | <code>if (!beforeLine) return notify(t('原位置已修改，请重新检查链接'))</code> |
| [38](../src/files/useFileResources.ts:38) | 文案定义／其他 | 原链接已修改，请重新检查链接 | <code>if (!marker) return notify(t('原链接已修改，请重新检查链接'))</code> |
| [48](../src/files/useFileResources.ts:48) | 文案定义／其他 | 文件已修改，请重新预览修复结果 | <code>if (!doc &#124;&#124; doc.content !== preview.beforeDocument) return notify(t('文件已修改，请重新预览修复结果'))</code> |
| [54](../src/files/useFileResources.ts:54) | 文案定义／其他 | 链接已修改，保存文件后生效 | <code>notify(t('链接已修改，保存文件后生效'))</code> |
| [57](../src/files/useFileResources.ts:57) | 文案定义／其他 | 请先打开文件夹 | <code>if (!isTauri &#124;&#124; !currentWorkspaceRoot.value) return notify(t('请先打开文件夹'))</code> |
| [58](../src/files/useFileResources.ts:58) | 文案定义／其他 | 请先选择 Markdown 文件 | <code>if (!all &amp;&amp; (!activeDoc.value.relativePath &#124;&#124; fileKind(activeDoc.value.path) !== 'markdown')) return notify(t('请先选择 Markdown 文件'))</code> |
| [64](../src/files/useFileResources.ts:64) | 文案定义／其他 | 链接检查失败：{0} | <code>} catch (error) { notify(t('链接检查失败：{0}', { "0": String(error) })) }</code> |

<a id="src-files-usefiletreeactions-ts"></a>

## src/files/useFileTreeActions.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [68](../src/files/useFileTreeActions.ts:68) | 文案定义／其他 | 移动失败：{0} | <code>} catch (error) { notify(t('移动失败：{0}', { "0": String(error) })) }</code> |
| [77](../src/files/useFileTreeActions.ts:77) | 文案定义／其他 | 已复制 | <code>else if (action === 'copy') { await navigator.clipboard.writeText(&#96;${currentWorkspaceRoot.value}${path ? &#96;/${path}&#96; : ''}&#96;); notify(t('已复制')) }</code> |
| [80](../src/files/useFileTreeActions.ts:80) | 文案定义／其他 | 文件操作失败：{0} | <code>} catch (error) { notify(t('文件操作失败：{0}', { "0": String(error) })) }</code> |
| [95](../src/files/useFileTreeActions.ts:95) | 文案定义／其他 | 请输入文件名 | <code>if (!current.name.trim()) return notify(t('请输入文件名'))</code> |
| [98](../src/files/useFileTreeActions.ts:98) | 文案定义／其他 | 文件名不能是 . 或 ..，也不能包含 / | <code>if (name.includes('/') &#124;&#124; name === '.' &#124;&#124; name === '..') return notify(t('文件名不能是 . 或 ..，也不能包含 /'))</code> |
| [104](../src/files/useFileTreeActions.ts:104) | 文案定义／其他 | 重命名失败：{0} | <code>catch (error) { notify(t('重命名失败：{0}', { "0": String(error) })) }</code> |

<a id="src-files-uselocalworkspace-ts"></a>

## src/files/useLocalWorkspace.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [175](../src/files/useLocalWorkspace.ts:175) | 文案定义／其他 | 文件列表更新失败：{0} | <code>void refreshWorkspace().catch(error =&gt; notify(t('文件列表更新失败：{0}', { '0': String(error) })))</code> |
| [231](../src/files/useLocalWorkspace.ts:231) | 文案定义／其他 | 未打开文件夹 | <code>selectedFolder.value = null; currentWorkspaceRoot.value = ''; currentDirectory.value = '未打开文件夹'; showNewMenu.value = false</code> |
| [237](../src/files/useLocalWorkspace.ts:237) | 文案定义／其他 | 关闭文件夹失败：{0} | <code>} catch (error) { notify(t('关闭文件夹失败：{0}', { "0": String(error) })); return false }</code> |
| [246](../src/files/useLocalWorkspace.ts:246) | 文案定义／其他 | 打开文件夹失败：{0} | <code>} catch (error) { notify(t('打开文件夹失败：{0}', { "0": String(error) })) }</code> |
| [249](../src/files/useLocalWorkspace.ts:249) | 文案定义／其他 | 请先打开文件夹 | <code>if (!isTauri &#124;&#124; !currentWorkspaceRoot.value) return notify(t('请先打开文件夹'))</code> |
| [251](../src/files/useLocalWorkspace.ts:251) | 文案定义／其他 | 打开文件夹失败：{0} | <code>catch (error) { notify(t('打开文件夹失败：{0}', { "0": String(error) })) }</code> |
| [254](../src/files/useLocalWorkspace.ts:254) | 文案定义／其他 | 打开本地文件需要桌面版 | <code>if (!isTauri) return notify(t('打开本地文件需要桌面版'))</code> |
| [258](../src/files/useLocalWorkspace.ts:258) | 文案定义／其他 | 打开文件失败：{0} | <code>} catch (error) { notify(t('打开文件失败：{0}', { "0": String(error) })) }</code> |
| [261](../src/files/useLocalWorkspace.ts:261) | 文案定义／其他 | 另存为需要桌面版 | <code>if (!isTauri) { notify(t('另存为需要桌面版')); return false }</code> |
| [265](../src/files/useLocalWorkspace.ts:265) | 文案定义／其他 | 未命名文件.md | <code>const filename = doc.temporary &amp;&amp; doc.sourceRelativePath ? doc.sourceRelativePath.split('/').pop()!.replace(/\.[^.]+$/, '.md') : doc.path.split('/').pop() &#124;&#124; '未命名文件.md'</code> |
| [287](../src/files/useLocalWorkspace.ts:287) | 文案定义／其他 | 已保存 | <code>notify(t('已保存'))</code> |
| [289](../src/files/useLocalWorkspace.ts:289) | 文案定义／其他 | 另存为失败：{0} | <code>} catch (error) { notify(t('另存为失败：{0}', { "0": String(error) })); return false }</code> |
| [296](../src/files/useLocalWorkspace.ts:296) | 文案定义／其他 | 所选文件夹中没有可编辑的文件 | <code>if (!files.length) { input.value = ''; return notify(t('所选文件夹中没有可编辑的文件')) }</code> |
| [312](../src/files/useLocalWorkspace.ts:312) | 文案定义／其他 | 已打开 {0} 个文件 | <code>notify(t('已打开 {0} 个文件', { "0": files.length }))</code> |
| [349](../src/files/useLocalWorkspace.ts:349) | 文案定义／其他 | 文件不在当前文件夹中，请重新打开所在文件夹 | <code>if (relative === null) throw new Error(t('文件不在当前文件夹中，请重新打开所在文件夹'))</code> |
| [358](../src/files/useLocalWorkspace.ts:358) | 文案定义／其他 | 文件不可用，可从最近打开记录中移除 | <code>if (!doc) throw new Error(t('文件不可用，可从最近打开记录中移除'))</code> |
| [401](../src/files/useLocalWorkspace.ts:401) | 文案定义／其他 | 打开文件失败：{0} | <code>} catch (error) { notify(t('打开文件失败：{0}', { '0': String(error) })); return }</code> |
| [404](../src/files/useLocalWorkspace.ts:404) | 文案定义／其他 | 此文件无法作为文本打开 | <code>if (doc.openable === false) return notify(t('此文件无法作为文本打开'))</code> |
| [413](../src/files/useLocalWorkspace.ts:413) | 文案定义／其他 | 未提取到文字，请检查文件内容 | <code>if (!markdown.trim()) return notify(t('未提取到文字，请检查文件内容'))</code> |
| [420](../src/files/useLocalWorkspace.ts:420) | 文案定义／其他 | 导入失败：{0} | <code>} catch (error) { notify(t('导入失败：{0}', { "0": String(error) })) }</code> |
| [430](../src/files/useLocalWorkspace.ts:430) | 文案定义／其他 | 读取失败：{0} | <code>} catch (error) { notify(t('读取失败：{0}', { "0": String(error) })); return }</code> |
| [458](../src/files/useLocalWorkspace.ts:458) | 文案定义／其他 | 草稿读取失败：{0} | <code>} catch (error) { notify(t('草稿读取失败：{0}', { "0": String(error) })) }</code> |
| [469](../src/files/useLocalWorkspace.ts:469) | 文案定义／其他 | 未命名文件.md | <code>const name = template ? templateFilename(template.name) : '未命名文件.md'</code> |
| [485](../src/files/useLocalWorkspace.ts:485) | 文案定义／其他 | 未命名文件.md | <code>const templateName = template ? templateFilename(template.name) : '未命名文件.md'</code> |
| [491](../src/files/useLocalWorkspace.ts:491) | 弹窗／确认 | 未命名文件.md | <code>let name = template ? templateName : await (deps.askCreationName ? deps.askCreationName('file', parent &#124;&#124; '', '未命名文件.md') : askFileAction(t('新建 Markdown 文件名称'), '未命名文件.md'))</code> |
| [491](../src/files/useLocalWorkspace.ts:491) | 文案定义／其他 | 新建 Markdown 文件名称 | <code>let name = template ? templateName : await (deps.askCreationName ? deps.askCreationName('file', parent &#124;&#124; '', '未命名文件.md') : askFileAction(t('新建 Markdown 文件名称'), '未命名文件.md'))</code> |
| [508](../src/files/useLocalWorkspace.ts:508) | 文案定义／其他 | 新建失败：{0} | <code>catch (error) { notify(t('新建失败：{0}', { "0": String(error) })) }</code> |
| [511](../src/files/useLocalWorkspace.ts:511) | 文案定义／其他 | 我的文件 | <code>const folder = currentDirectory.value === '我的文件' ? activeDoc.value?.path.split('/').slice(0, -1).join('/') &#124;&#124; '未分类' : currentDirectory.value</code> |
| [511](../src/files/useLocalWorkspace.ts:511) | 文案定义／其他 | 未分类 | <code>const folder = currentDirectory.value === '我的文件' ? activeDoc.value?.path.split('/').slice(0, -1).join('/') &#124;&#124; '未分类' : currentDirectory.value</code> |
| [513](../src/files/useLocalWorkspace.ts:513) | 文案定义／其他 | # 未命名文件<br><br>开始写作… | <code>docs.value.unshift({ id, path: &#96;${folder}/${templateName}&#96;, content: template ? renderTemplate(template.content, templateName) : '# 未命名文件\n\n开始写作…\n', created: Date.now(), updated: Date.now() })</code> |
| [518](../src/files/useLocalWorkspace.ts:518) | 文案定义／其他 | 仅本地纯文本文件可以另存为 Markdown | <code>if (!isTauri &#124;&#124; !doc.relativePath &#124;&#124; activeKind.value !== 'text') return notify(t('仅本地纯文本文件可以另存为 Markdown'))</code> |
| [519](../src/files/useLocalWorkspace.ts:519) | 文案定义／其他 | 请先保存当前文本，再另存为 Markdown | <code>if (dirtyIds.value.includes(doc.id)) return notify(t('请先保存当前文本，再另存为 Markdown'))</code> |
| [520](../src/files/useLocalWorkspace.ts:520) | 文案定义／其他 | 另存为 Markdown | <code>const target = await askFileAction(t('另存为 Markdown'), doc.relativePath.replace(/\.(txt&#124;text)$/i, '.md'))</code> |
| [523](../src/files/useLocalWorkspace.ts:523) | 文案定义／其他 | 另存失败：{0} | <code>catch (error) { notify(t('另存失败：{0}', { "0": String(error) })) }</code> |
| [527](../src/files/useLocalWorkspace.ts:527) | 文案定义／其他 | 请先打开文件夹 | <code>if (!isTauri &#124;&#124; !currentWorkspaceRoot.value) return notify(t('请先打开文件夹'))</code> |
| [531](../src/files/useLocalWorkspace.ts:531) | 弹窗／确认 | 新建文件夹 | <code>const name = await (deps.askCreationName ? deps.askCreationName('folder', parent, '新建文件夹') : askFileAction(t('新建文件夹路径（相对于当前目录）'), '新建文件夹'))</code> |
| [531](../src/files/useLocalWorkspace.ts:531) | 文案定义／其他 | 新建文件夹路径（相对于当前目录） | <code>const name = await (deps.askCreationName ? deps.askCreationName('folder', parent, '新建文件夹') : askFileAction(t('新建文件夹路径（相对于当前目录）'), '新建文件夹'))</code> |
| [539](../src/files/useLocalWorkspace.ts:539) | 文案定义／其他 | 新建文件夹失败：{0} | <code>catch (error) { notify(t('新建文件夹失败：{0}', { "0": String(error) })) }</code> |
| [549](../src/files/useLocalWorkspace.ts:549) | 文案定义／其他 | 删除文件夹“{0}”及其内容？ | <code>const question = (isFolder ? t('删除文件夹“{0}”及其内容？', { '0': relativePath }) : t('删除文件“{0}”？', { '0': relativePath })) + (unsaved ? t('其中未保存的修改将丢弃。') : '')</code> |
| [549](../src/files/useLocalWorkspace.ts:549) | 文案定义／其他 | 删除文件“{0}”？ | <code>const question = (isFolder ? t('删除文件夹“{0}”及其内容？', { '0': relativePath }) : t('删除文件“{0}”？', { '0': relativePath })) + (unsaved ? t('其中未保存的修改将丢弃。') : '')</code> |
| [549](../src/files/useLocalWorkspace.ts:549) | 文案定义／其他 | 其中未保存的修改将丢弃。 | <code>const question = (isFolder ? t('删除文件夹“{0}”及其内容？', { '0': relativePath }) : t('删除文件“{0}”？', { '0': relativePath })) + (unsaved ? t('其中未保存的修改将丢弃。') : '')</code> |
| [567](../src/files/useLocalWorkspace.ts:567) | 文案定义／其他 | 新名称 | <code>const input = await askFileAction(action === 'rename' ? t('新名称') : t('移动到当前目录内的相对路径'), suggested)</code> |
| [567](../src/files/useLocalWorkspace.ts:567) | 文案定义／其他 | 移动到当前目录内的相对路径 | <code>const input = await askFileAction(action === 'rename' ? t('新名称') : t('移动到当前目录内的相对路径'), suggested)</code> |
| [574](../src/files/useLocalWorkspace.ts:574) | 文案定义／其他 | 文件操作失败：{0} | <code>} catch (error) { notify(t('文件操作失败：{0}', { "0": String(error) })) }</code> |

<a id="src-i18n-index-ts"></a>

## src/i18n/index.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [14](../src/i18n/index.ts:14) | 文案定义／其他 | 跟随系统 | <code>{ value: 'system', label: '跟随系统' },</code> |
| [15](../src/i18n/index.ts:15) | 文案定义／其他 | 简体中文 | <code>{ value: 'zh-CN', label: '简体中文' }, { value: 'zh-TW', label: '繁體中文' },</code> |
| [15](../src/i18n/index.ts:15) | 文案定义／其他 | 繁體中文 | <code>{ value: 'zh-CN', label: '简体中文' }, { value: 'zh-TW', label: '繁體中文' },</code> |
| [16](../src/i18n/index.ts:16) | 文案定义／其他 | English | <code>{ value: 'en', label: 'English' }, { value: 'ja', label: '日本語' },</code> |
| [16](../src/i18n/index.ts:16) | 文案定义／其他 | 日本語 | <code>{ value: 'en', label: 'English' }, { value: 'ja', label: '日本語' },</code> |
| [17](../src/i18n/index.ts:17) | 文案定义／其他 | 한국어 | <code>{ value: 'ko', label: '한국어' }, { value: 'de', label: 'Deutsch' },</code> |
| [17](../src/i18n/index.ts:17) | 文案定义／其他 | Deutsch | <code>{ value: 'ko', label: '한국어' }, { value: 'de', label: 'Deutsch' },</code> |
| [18](../src/i18n/index.ts:18) | 文案定义／其他 | Français | <code>{ value: 'fr', label: 'Français' }, { value: 'es', label: 'Español' },</code> |
| [18](../src/i18n/index.ts:18) | 文案定义／其他 | Español | <code>{ value: 'fr', label: 'Français' }, { value: 'es', label: 'Español' },</code> |
| [19](../src/i18n/index.ts:19) | 文案定义／其他 | Português | <code>{ value: 'pt', label: 'Português' }, { value: 'ru', label: 'Русский' },</code> |
| [19](../src/i18n/index.ts:19) | 文案定义／其他 | Русский | <code>{ value: 'pt', label: 'Português' }, { value: 'ru', label: 'Русский' },</code> |
| [40](../src/i18n/index.ts:40) | 文案定义／其他 | Markart · Markdown 写作空间 | <code>if (typeof document !== 'undefined') { document.documentElement.lang = activeLocale.value; document.title = t('Markart · Markdown 写作空间') }</code> |

<a id="src-i18n-sourcecopy-ts"></a>

## src/i18n/sourceCopy.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [3](../src/i18n/sourceCopy.ts:3) | 文案定义／其他 | 字 | <code>'字': '字符',</code> |
| [3](../src/i18n/sourceCopy.ts:3) | 文案定义／其他 | 字符 | <code>'字': '字符',</code> |
| [4](../src/i18n/sourceCopy.ts:4) | 文案定义／其他 | 将删除插件代码并撤销授权，文件不受影响。 | <code>'将删除插件代码并撤销授权，文件不受影响。': '将删除插件代码，文件不受影响。',</code> |
| [4](../src/i18n/sourceCopy.ts:4) | 文案定义／其他 | 将删除插件代码，文件不受影响。 | <code>'将删除插件代码并撤销授权，文件不受影响。': '将删除插件代码，文件不受影响。',</code> |
| [5](../src/i18n/sourceCopy.ts:5) | 文案定义／其他 | 标签视图 | <code>'标签视图': '标签页',</code> |
| [5](../src/i18n/sourceCopy.ts:5) | 文案定义／其他 | 标签页 | <code>'标签视图': '标签页',</code> |
| [6](../src/i18n/sourceCopy.ts:6) | 文案定义／其他 | 切换标签视图 | <code>'切换标签视图': '切换标签页',</code> |
| [6](../src/i18n/sourceCopy.ts:6) | 文案定义／其他 | 切换标签页 | <code>'切换标签视图': '切换标签页',</code> |
| [7](../src/i18n/sourceCopy.ts:7) | 文案定义／其他 | 标签视图菜单 | <code>'标签视图菜单': '标签页菜单',</code> |
| [7](../src/i18n/sourceCopy.ts:7) | 文案定义／其他 | 标签页菜单 | <code>'标签视图菜单': '标签页菜单',</code> |
| [8](../src/i18n/sourceCopy.ts:8) | 文案定义／其他 | 标签视图菜单不可用：{0} | <code>'标签视图菜单不可用：{0}': '标签页菜单不可用：{0}'</code> |
| [8](../src/i18n/sourceCopy.ts:8) | 文案定义／其他 | 标签页菜单不可用：{0} | <code>'标签视图菜单不可用：{0}': '标签页菜单不可用：{0}'</code> |

<a id="src-menubar-vue"></a>

## src/MenuBar.vue

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [53](../src/MenuBar.vue:53) | 文案定义／其他 | 未命名文件.md | <code>const templateMenuItems = computed(() =&gt; (unref(props.context.templates) &#124;&#124; []).map((item: { id: string; name: string; content: string }) =&gt; ({ ...item, name: renderTemplate(item.name, '未命名文件.md', templateMenuDate.value) })))</code> |
| [73](../src/MenuBar.vue:73) | 界面文案 | 新建 | <code>…x&#96;, top: &#96;${fileHubPosition.top}px&#96; }"&gt;&lt;template v-if="!currentWorkspaceRoot"&gt;&lt;div class="menu-heading"&gt;{{ $t('新建') }}&lt;/div&gt;&lt;button @click="newDoc()"&gt;&lt;FileText :size="15"/&gt; {{ $t('新建文件') }}&lt;/button&gt;&lt;button v-if="templates.…</code> |
| [73](../src/MenuBar.vue:73) | 界面文案 | 新建文件 | <code>…aceRoot"&gt;&lt;div class="menu-heading"&gt;{{ $t('新建') }}&lt;/div&gt;&lt;button @click="newDoc()"&gt;&lt;FileText :size="15"/&gt; {{ $t('新建文件') }}&lt;/button&gt;&lt;button v-if="templates.length" :aria-expanded="fileSubmenu === 'templates'" aria-haspopup="men…</code> |
| [73](../src/MenuBar.vue:73) | 界面文案 | 从模板创建 | <code>…emplates'" aria-haspopup="menu" @click="toggleFileSubmenu($event, 'templates')"&gt;&lt;FilePlus2 :size="15"/&gt; {{ $t('从模板创建') }}&lt;ChevronRight class="template-submenu-arrow" :size="14"/&gt;&lt;/button&gt;&lt;/template&gt;&lt;div class="menu-heading"&gt;{…</code> |
| [73](../src/MenuBar.vue:73) | 界面文案 | 打开 | <code>…}&lt;ChevronRight class="template-submenu-arrow" :size="14"/&gt;&lt;/button&gt;&lt;/template&gt;&lt;div class="menu-heading"&gt;{{ $t('打开') }}&lt;/div&gt;&lt;button @click="showNewMenu = false; chooseFile()"&gt;&lt;FileText :size="15"/&gt; {{ $t('打开文件') }}&lt;/button…</code> |
| [73](../src/MenuBar.vue:73) | 界面文案 | 打开文件 | <code>…-heading"&gt;{{ $t('打开') }}&lt;/div&gt;&lt;button @click="showNewMenu = false; chooseFile()"&gt;&lt;FileText :size="15"/&gt; {{ $t('打开文件') }}&lt;/button&gt;&lt;button @click="showNewMenu = false; chooseFolder()"&gt;&lt;FolderOpen :size="15"/&gt; {{ $t('打开文件夹') }}…</code> |
| [73](../src/MenuBar.vue:73) | 界面文案 | 打开文件夹 | <code>…{{ $t('打开文件') }}&lt;/button&gt;&lt;button @click="showNewMenu = false; chooseFolder()"&gt;&lt;FolderOpen :size="15"/&gt; {{ $t('打开文件夹') }}&lt;/button&gt;&lt;button v-if="recentDirectories.length &#124;&#124; orderedRecentFiles.length" :aria-expanded="fileSubmen…</code> |
| [73](../src/MenuBar.vue:73) | 界面文案 | 最近打开 | <code>…nu === 'recent'" aria-haspopup="menu" @click="toggleFileSubmenu($event, 'recent')"&gt;&lt;Clock3 :size="15"/&gt; {{ $t('最近打开') }}&lt;ChevronRight class="template-submenu-arrow" :size="14"/&gt;&lt;/button&gt;&lt;button v-if="currentWorkspaceRoot &#124;&#124;…</code> |
| [73](../src/MenuBar.vue:73) | 界面文案 | 关闭文件夹 | <code>…&lt;button v-if="currentWorkspaceRoot &#124;&#124; (!isTauri &amp;&amp; docs.length)" @click="closeFolder()"&gt;&lt;X :size="15"/&gt; {{ $t('关闭文件夹') }}&lt;/button&gt;&lt;/div&gt;&lt;/div&gt;&lt;/div&gt;&lt;/template&gt;</code> |
| [85](../src/MenuBar.vue:85) | 界面文案 | {0} · 切换到{1} ⌘⇧M | <code>…=== 'typewriter' ? commandActive(id) : undefined" :disabled="commandDisabled(id)" :title="id === 'mode' ? $t('{0} · 切换到{1} ⌘⇧M', { '0': modeLabel, '1': nextModeLabel }) : commandTitle(id)" :aria-label="commandTitle(id)" @click="onTopba…</code> |
| [88](../src/MenuBar.vue:88) | 界面文案 | 更多功能 | <code>&lt;button ref="topbarMoreAnchor" class="icon-button topbar-overflow" :title="$t('更多功能')" :aria-label="$t('更多功能')" :aria-expanded="showTopbarMore" aria-haspopup="menu" @click="toggleTopbarMore"&gt;&lt;MoreHorizontal :size="16"/&gt;&lt;/button&gt;</code> |
| [89](../src/MenuBar.vue:89) | 界面文案 | 编辑器快捷入口 | <code>&lt;Teleport defer to=".app-shell"&gt;&lt;div v-if="showTopbarMore" :style="topbarMorePosition" class="topbar-more-menu" role="menu" :aria-label="$t('编辑器快捷入口')"&gt;</code> |
| [92](../src/MenuBar.vue:92) | 界面文案 | 已开启 | <code>&lt;button class="topbar-more-item" role="menuitem" :disabled="commandDisabled(id)" :title="commandTitle(id)" @click="onTopbarMoreClick($event, id)"&gt;&lt;span&gt;{{ commandInfo(id)?.label }}&lt;/span&gt;&lt;small v-if="commandActive(id)"&gt;{{ $t('已开启') }}&lt;/small&gt;&lt;/button&gt;</code> |
| [93](../src/MenuBar.vue:93) | 界面文案 | 取消固定 | <code>&lt;button class="topbar-more-pin" :title="pinnedTopbarCommands.includes(id) ? $t('取消固定') : $t('固定到菜单栏')" :aria-label="pinnedTopbarCommands.includes(id) ? $t('取消固定{0}', { '0': commandInfo(id)?.lab…</code> |
| [93](../src/MenuBar.vue:93) | 界面文案 | 固定到菜单栏 | <code>&lt;button class="topbar-more-pin" :title="pinnedTopbarCommands.includes(id) ? $t('取消固定') : $t('固定到菜单栏')" :aria-label="pinnedTopbarCommands.includes(id) ? $t('取消固定{0}', { '0': commandInfo(id)?.label }) : $t('固定{…</code> |
| [93](../src/MenuBar.vue:93) | 界面文案 | 取消固定{0} | <code>…dTopbarCommands.includes(id) ? $t('取消固定') : $t('固定到菜单栏')" :aria-label="pinnedTopbarCommands.includes(id) ? $t('取消固定{0}', { '0': commandInfo(id)?.label }) : $t('固定{0}到菜单栏', { '0': commandInfo(id)?.label })" @click="toggleTopbarP…</code> |
| [93](../src/MenuBar.vue:93) | 界面文案 | 固定{0}到菜单栏 | <code>…定到菜单栏')" :aria-label="pinnedTopbarCommands.includes(id) ? $t('取消固定{0}', { '0': commandInfo(id)?.label }) : $t('固定{0}到菜单栏', { '0': commandInfo(id)?.label })" @click="toggleTopbarPin(id)"&gt;&lt;Pin :size="13" :fill="pinnedTopbarCommands…</code> |
| [103](../src/MenuBar.vue:103) | 界面文案 | 从模板创建 | <code>…menu === 'templates'" class="file-hub-menu new-item-menu template-create-submenu" role="menu" :aria-label="$t('从模板创建')" :style="{ left: &#96;${fileSubmenuPosition.left}px&#96;, top: &#96;${fileSubmenuPosition.top}px&#96; }" @keydown.esc.stop…</code> |
| [104](../src/MenuBar.vue:104) | 界面文案 | 最近打开 | <code>…fileSubmenu === 'recent'" class="file-hub-menu new-item-menu recent-open-submenu" role="menu" :aria-label="$t('最近打开')" :style="{ left: &#96;${fileSubmenuPosition.left}px&#96;, top: &#96;${fileSubmenuPosition.top}px&#96; }" @keydown.esc.stop…</code> |
| [104](../src/MenuBar.vue:104) | 界面文案 | 最近文件夹 | <code>…p}px&#96; }" @keydown.esc.stop="fileSubmenu = ''"&gt;&lt;div v-if="recentDirectories.length" class="menu-heading"&gt;{{ $t('最近文件夹') }}&lt;/div&gt;&lt;div v-for="directory in recentDirectories" :key="directory" class="recent-file-entry" :class="{ s…</code> |
| [104](../src/MenuBar.vue:104) | 界面文案 | 取消固定 | <code>…utton class="recent-file-action" :title="item.pinned ? $t('取消固定') : $t('固定文件')" :aria-label="item.pinned ? $t('取消固定') : $t('固定文件')" @click="toggleRecentPin(item.path)"&gt;&lt;Pin :size="14" :fill="item.pinned ? 'currentColor' : 'n…</code> |
| [104](../src/MenuBar.vue:104) | 界面文案 | 固定文件夹 | <code>…directory) ? $t('取消固定') : $t('固定文件夹')" :aria-label="pinnedRecentFolders.includes(directory) ? $t('取消固定') : $t('固定文件夹')" @click="toggleRecentFolderPin(directory)"&gt;&lt;Pin :size="14" :fill="pinnedRecentFolders.includes(directory)…</code> |
| [104](../src/MenuBar.vue:104) | 界面文案 | 最近文件 | <code>…) ? 'currentColor' : 'none'"/&gt;&lt;/button&gt;&lt;/div&gt;&lt;div v-if="orderedRecentFiles.length" class="menu-heading"&gt;{{ $t('最近文件') }}&lt;/div&gt;&lt;div v-for="item in orderedRecentFiles" :key="item.path" class="recent-file-entry" :class="{ selec…</code> |
| [104](../src/MenuBar.vue:104) | 界面文案 | 固定文件 | <code>…recent-file-action" :title="item.pinned ? $t('取消固定') : $t('固定文件')" :aria-label="item.pinned ? $t('取消固定') : $t('固定文件')" @click="toggleRecentPin(item.path)"&gt;&lt;Pin :size="14" :fill="item.pinned ? 'currentColor' : 'none'"/&gt;&lt;/butt…</code> |
| [104](../src/MenuBar.vue:104) | 界面文案 | 清空最近打开 | <code>…length &#124;&#124; recentFiles.length" class="clear-recent-button" @click="clearRecentOpen"&gt;&lt;Trash2 :size="14"/&gt; {{ $t('清空最近打开') }}&lt;/button&gt;&lt;/div&gt;&lt;/Teleport&gt;</code> |

<a id="src-plugins-catalogs-ts"></a>

## src/plugins/catalogs.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [5](../src/plugins/catalogs.ts:5) | 文案定义／其他 | 请先填写插件目录地址（JSON） | <code>if (!url.trim()) throw new Error('请先填写插件目录地址（JSON）')</code> |

<a id="src-plugins-community-ts"></a>

## src/plugins/community.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [12](../src/plugins/community.ts:12) | 文案定义／其他 | 请填写 GitHub 仓库，例如 author/markart-plugin | <code>if (!/^[\w-]+\/[\w.-]+$/.test(repo) &#124;&#124; repo.includes('..')) throw new Error('请填写 GitHub 仓库，例如 author/markart-plugin')</code> |
| [17](../src/plugins/community.ts:17) | 文案定义／其他 | 请使用 GitHub 上的公开 HTTPS 地址 | <code>if (url.protocol !== 'https:' &#124;&#124; !['raw.githubusercontent.com', 'github.com'].includes(url.hostname) &#124;&#124; url.username &#124;&#124; url.password &#124;&#124; url.port) throw new Error('请使用 GitHub 上的公开 HTTPS 地址')</code> |
| [25](../src/plugins/community.ts:25) | 状态文案 | 下载失败：HTTP ${response.status} | <code>if (!response.ok) throw new Error(&#96;下载失败：HTTP ${response.status}&#96;)</code> |
| [26](../src/plugins/community.ts:26) | 文案定义／其他 | 插件文件超过 5 MB | <code>const text = await response.text(); if (new TextEncoder().encode(text).length &gt; 5 * 1024 * 1024) throw new Error('插件文件超过 5 MB')</code> |
| [30](../src/plugins/community.ts:30) | 文案定义／其他 | 社区目录必须是 JSON 数组 | <code>if (!Array.isArray(value)) throw new Error('社区目录必须是 JSON 数组')</code> |
| [33](../src/plugins/community.ts:33) | 文案定义／其他 | string | <code>if (!item &#124;&#124; typeof item.id !== 'string' &#124;&#124; typeof item.name !== 'string' &#124;&#124; typeof item.description !== 'string') throw new Error('社区目录格式无效')</code> |
| [33](../src/plugins/community.ts:33) | 文案定义／其他 | 社区目录格式无效 | <code>if (!item &#124;&#124; typeof item.id !== 'string' &#124;&#124; typeof item.name !== 'string' &#124;&#124; typeof item.description !== 'string') throw new Error('社区目录格式无效')</code> |
| [36](../src/plugins/community.ts:36) | 文案定义／其他 | 同一目录内存在重复插件 ID：${item.id} | <code>if (ids.has(item.id)) throw new Error(&#96;同一目录内存在重复插件 ID：${item.id}&#96;); ids.add(item.id)</code> |
| [46](../src/plugins/community.ts:46) | 文案定义／其他 | 插件 ID 与社区目录不一致 | <code>if (expectedId &amp;&amp; latest.id !== expectedId) throw new Error('插件 ID 与社区目录不一致')</code> |
| [49](../src/plugins/community.ts:49) | 文案定义／其他 | 发布版本与插件清单不一致 | <code>if (manifest.id !== latest.id &#124;&#124; manifest.version !== latest.version) throw new Error('发布版本与插件清单不一致')</code> |
| [51](../src/plugins/community.ts:51) | 文案定义／其他 | 插件缺少 main.js | <code>if (!main?.trim()) throw new Error('插件缺少 main.js')</code> |
| [60](../src/plugins/community.ts:60) | 文案定义／其他 | 更新来源中的插件 ID 与已安装插件不一致 | <code>if (latest.id !== plugin.manifest.id) throw new Error('更新来源中的插件 ID 与已安装插件不一致')</code> |

<a id="src-plugins-host-bridge-ts"></a>

## src/plugins/host/bridge.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [65](../src/plugins/host/bridge.ts:65) | 文案定义／其他 | 文件服务未就绪 | <code>throw new PluginError("not-ready", "文件服务未就绪");</code> |
| [71](../src/plugins/host/bridge.ts:71) | 文案定义／其他 | 文件服务未就绪 | <code>throw new PluginError("not-ready", "文件服务未就绪");</code> |
| [79](../src/plugins/host/bridge.ts:79) | 文案定义／其他 | 不能操作其他插件的面板 | <code>throw new PluginError("permission-denied", "不能操作其他插件的面板");</code> |
| [131](../src/plugins/host/bridge.ts:131) | 文案定义／其他 | 插件已停用 | <code>if (scope.signal.aborted) throw new PluginError("cancelled", "插件已停用");</code> |
| [191](../src/plugins/host/bridge.ts:191) | 文案定义／其他 | 文件版本、编辑状态或修改范围已变化 | <code>"文件版本、编辑状态或修改范围已变化",</code> |
| [242](../src/plugins/host/bridge.ts:242) | 文案定义／其他 | 菜单显示条件请使用可序列化描述 | <code>"菜单显示条件请使用可序列化描述",</code> |
| [247](../src/plugins/host/bridge.ts:247) | 文案定义／其他 | 弹窗需要 render 函数 | <code>throw new PluginError("invalid-argument", "弹窗需要 render 函数");</code> |
| [285](../src/plugins/host/bridge.ts:285) | 文案定义／其他 | string | <code>typeof a.title !== "string" &#124;&#124;</code> |
| [290](../src/plugins/host/bridge.ts:290) | 文案定义／其他 | 面板定义无效 | <code>throw new PluginError("invalid-argument", "面板定义无效");</code> |
| [293](../src/plugins/host/bridge.ts:293) | 文案定义／其他 | 面板 ID 重复 | <code>throw new PluginError("invalid-argument", "面板 ID 重复");</code> |
| [318](../src/plugins/host/bridge.ts:318) | 文案定义／其他 | 请先注册面板 | <code>if (!view) throw new PluginError("not-found", "请先注册面板");</code> |
| [356](../src/plugins/host/bridge.ts:356) | 文案定义／其他 | 单项插件数据超过 1 MB | <code>throw new PluginError("invalid-argument", "单项插件数据超过 1 MB");</code> |
| [383](../src/plugins/host/bridge.ts:383) | 文案定义／其他 | 不支持的事件 | <code>throw new PluginError("invalid-argument", "不支持的事件");</code> |
| [403](../src/plugins/host/bridge.ts:403) | 文案定义／其他 | 就绪阶段无效 | <code>throw new PluginError("invalid-argument", "就绪阶段无效");</code> |
| [418](../src/plugins/host/bridge.ts:418) | 文案定义／其他 | 文件索引尚未就绪 | <code>throw new PluginError("not-ready", "文件索引尚未就绪");</code> |
| [444](../src/plugins/host/bridge.ts:444) | 文案定义／其他 | 块渲染器定义无效 | <code>throw new PluginError("invalid-argument", "块渲染器定义无效");</code> |
| [453](../src/plugins/host/bridge.ts:453) | 文案定义／其他 | 行内渲染器定义无效 | <code>throw new PluginError("invalid-argument", "行内渲染器定义无效");</code> |
| [465](../src/plugins/host/bridge.ts:465) | 文案定义／其他 | 导出格式定义无效 | <code>throw new PluginError("invalid-argument", "导出格式定义无效");</code> |
| [503](../src/plugins/host/bridge.ts:503) | 文案定义／其他 | 索引操作无效 | <code>throw new PluginError("invalid-argument", "索引操作无效");</code> |
| [528](../src/plugins/host/bridge.ts:528) | 文案定义／其他 | 不支持的插件接口：${method} | <code>throw new PluginError("invalid-argument", &#96;不支持的插件接口：${method}&#96;);</code> |

<a id="src-plugins-host-exports-ts"></a>

## src/plugins/host/exports.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [30](../src/plugins/host/exports.ts:30) | 文案定义／其他 | 已取消本次导出 | <code>throw new Error("已取消本次导出");</code> |
| [54](../src/plugins/host/exports.ts:54) | 文案定义／其他 | AST 格式无效 | <code>throw new Error("AST 格式无效");</code> |
| [78](../src/plugins/host/exports.ts:78) | 文案定义／其他 | 导出格式已停用 | <code>if (!format) throw new PluginError("not-found", "导出格式已停用");</code> |
| [90](../src/plugins/host/exports.ts:90) | 文案定义／其他 | 导出内容需为文本或字节数组 | <code>throw new Error("导出内容需为文本或字节数组");</code> |
| [91](../src/plugins/host/exports.ts:91) | 文案定义／其他 | 导出内容超过 20 MB | <code>if (output.length &gt; 20 * 1024 * 1024) throw new Error("导出内容超过 20 MB");</code> |

<a id="src-plugins-host-files-ts"></a>

## src/plugins/host/files.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [89](../src/plugins/host/files.ts:89) | 文案定义／其他 | 文件标识无效 | <code>throw new PluginError("invalid-argument", "文件标识无效");</code> |
| [108](../src/plugins/host/files.ts:108) | 文案定义／其他 | 文件不存在 | <code>if (!file) throw new PluginError("not-found", "文件不存在");</code> |
| [132](../src/plugins/host/files.ts:132) | 文案定义／其他 | 文件版本已变化 | <code>throw new PluginError("stale-revision", "文件版本已变化");</code> |
| [138](../src/plugins/host/files.ts:138) | 文案定义／其他 | 文件版本已变化 | <code>if (!result.ok) throw new PluginError("stale-revision", "文件版本已变化");</code> |
| [147](../src/plugins/host/files.ts:147) | 文案定义／其他 | 请先读取当前文件版本再修改 | <code>throw new PluginError("stale-revision", "请先读取当前文件版本再修改");</code> |
| [170](../src/plugins/host/files.ts:170) | 文案定义／其他 | 已打开的文件不能通过附件接口覆盖 | <code>throw new PluginError("read-only", "已打开的文件不能通过附件接口覆盖");</code> |
| [177](../src/plugins/host/files.ts:177) | 文案定义／其他 | 请先读取当前文件版本再修改 | <code>throw new PluginError("stale-revision", "请先读取当前文件版本再修改");</code> |
| [192](../src/plugins/host/files.ts:192) | 文案定义／其他 | 文件已创建，索引正在更新 | <code>if (!file) throw new PluginError("not-ready", "文件已创建，索引正在更新");</code> |
| [205](../src/plugins/host/files.ts:205) | 文案定义／其他 | 文件名称无效 | <code>throw new PluginError("invalid-argument", "文件名称无效");</code> |
| [221](../src/plugins/host/files.ts:221) | 文案定义／其他 | 文件属性中的 YAML 格式有误 | <code>throw new PluginError("invalid-argument", "文件属性中的 YAML 格式有误");</code> |
| [224](../src/plugins/host/files.ts:224) | 文案定义／其他 | 文件属性需要使用键值格式 | <code>throw new PluginError("invalid-argument", "文件属性需要使用键值格式");</code> |

<a id="src-plugins-host-services-ts"></a>

## src/plugins/host/services.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [59](../src/plugins/host/services.ts:59) | 文案定义／其他 | 扩展 ID 无效或重复 | <code>throw new PluginError("invalid-argument", "扩展 ID 无效或重复");</code> |

<a id="src-plugins-host-workspacescope-ts"></a>

## src/plugins/host/workspaceScope.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [11](../src/plugins/host/workspaceScope.ts:11) | 文案定义／其他 | 请先在 Markart 中打开此文件夹或其中的文件 | <code>throw new PluginError('permission-denied', '请先在 Markart 中打开此文件夹或其中的文件')</code> |

<a id="src-plugins-local-ts"></a>

## src/plugins/local.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [8](../src/plugins/local.ts:8) | 文案定义／其他 | 插件缺少 main.js 内容 | <code>if (!files.main.trim()) throw new Error('插件缺少 main.js 内容')</code> |
| [10](../src/plugins/local.ts:10) | 文案定义／其他 | 插件文件超过 5 MB | <code>if (new TextEncoder().encode(value).length &gt; 5 * 1024 * 1024) throw new Error('插件文件超过 5 MB')</code> |
| [30](../src/plugins/local.ts:30) | 文案定义／其他 | 插件缺少 ${name} | <code>if (!file) { if (optional) return undefined; throw new Error(&#96;插件缺少 ${name}&#96;) }</code> |
| [31](../src/plugins/local.ts:31) | 文案定义／其他 | 插件文件超过 5 MB | <code>if (file.size &gt; 5 * 1024 * 1024) throw new Error('插件文件超过 5 MB')</code> |

<a id="src-plugins-manifest-ts"></a>

## src/plugins/manifest.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [14](../src/plugins/manifest.ts:14) | 文案定义／其他 | 插件清单必须是 JSON 对象 | <code>if (!value &#124;&#124; typeof value !== 'object') throw new Error('插件清单必须是 JSON 对象')</code> |
| [17](../src/plugins/manifest.ts:17) | 文案定义／其他 | 插件清单格式无效，请检查 apiVersion、id、name 和 version | <code>&#124;&#124; typeof item.name !== 'string' &#124;&#124; !item.name.trim() &#124;&#124; typeof item.version !== 'string' &#124;&#124; !/^\d+\.\d+\.\d+(?:[-+][\w.-]+)?$/.test(item.version)) throw new Error('插件清单格式无效，请检查 apiVersion、id、name 和 version')</code> |
| [21](../src/plugins/manifest.ts:21) | 文案定义／其他 | 插件权限声明无效 | <code>if (!Array.isArray(value) &#124;&#124; value.some(entry =&gt; !permissionNames.includes(entry as Permission))) throw new Error('插件权限声明无效')</code> |
| [25](../src/plugins/manifest.ts:25) | 文案定义／其他 | 插件最低应用版本无效 | <code>if(item.minAppVersion !== undefined &amp;&amp; (typeof item.minAppVersion !== 'string'&#124;&#124;!/^\d+\.\d+\.\d+$/.test(item.minAppVersion)))throw new Error('插件最低应用版本无效')</code> |
| [26](../src/plugins/manifest.ts:26) | 文案定义／其他 | string | <code>return { apiVersion: 2, id: item.id, name: item.name, version: item.version, description: typeof item.description === 'string' ? item.description : undefined, minAppVersion: item.minAppVersion as string&#124;undefined, permissions }</code> |

<a id="src-plugins-permissions-declaration-ts"></a>

## src/plugins/permissions/declaration.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [6](../src/plugins/permissions/declaration.ts:6) | 文案定义／其他 | 读取编辑器内容 | <code>'editor.read':'读取编辑器内容','editor.write':'修改编辑器内容',</code> |
| [6](../src/plugins/permissions/declaration.ts:6) | 文案定义／其他 | 修改编辑器内容 | <code>'editor.read':'读取编辑器内容','editor.write':'修改编辑器内容',</code> |
| [7](../src/plugins/permissions/declaration.ts:7) | 文案定义／其他 | 读取目录中的文本文件 | <code>'files.read':'读取目录中的文本文件','files.write':'修改目录中的文本文件',</code> |
| [7](../src/plugins/permissions/declaration.ts:7) | 文案定义／其他 | 修改目录中的文本文件 | <code>'files.read':'读取目录中的文本文件','files.write':'修改目录中的文本文件',</code> |
| [8](../src/plugins/permissions/declaration.ts:8) | 文案定义／其他 | 读取附件 | <code>'attachments.read':'读取附件','attachments.write':'修改附件',</code> |
| [8](../src/plugins/permissions/declaration.ts:8) | 文案定义／其他 | 修改附件 | <code>'attachments.read':'读取附件','attachments.write':'修改附件',</code> |
| [9](../src/plugins/permissions/declaration.ts:9) | 文案定义／其他 | 查询文件索引 | <code>'index.read':'查询文件索引','network':'访问网络',</code> |
| [9](../src/plugins/permissions/declaration.ts:9) | 文案定义／其他 | 访问网络 | <code>'index.read':'查询文件索引','network':'访问网络',</code> |
| [10](../src/plugins/permissions/declaration.ts:10) | 文案定义／其他 | 读取剪贴板 | <code>'clipboard.read':'读取剪贴板','clipboard.write':'写入剪贴板','background':'运行后台任务',</code> |
| [10](../src/plugins/permissions/declaration.ts:10) | 文案定义／其他 | 写入剪贴板 | <code>'clipboard.read':'读取剪贴板','clipboard.write':'写入剪贴板','background':'运行后台任务',</code> |
| [10](../src/plugins/permissions/declaration.ts:10) | 文案定义／其他 | 运行后台任务 | <code>'clipboard.read':'读取剪贴板','clipboard.write':'写入剪贴板','background':'运行后台任务',</code> |
| [14](../src/plugins/permissions/declaration.ts:14) | 文案定义／其他 | 插件已停用 | <code>if (signal?.aborted) throw new PluginError('cancelled','插件已停用')</code> |

<a id="src-plugins-permissions-grants-ts"></a>

## src/plugins/permissions/grants.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [107](../src/plugins/permissions/grants.ts:107) | 文案定义／其他 | 插件未声明权限：${permission}，请在 manifest.json 中声明后重新安装 | <code>&#96;插件未声明权限：${permission}，请在 manifest.json 中声明后重新安装&#96;,</code> |
| [121](../src/plugins/permissions/grants.ts:121) | 文案定义／其他 | 仅允许 http/https 请求，且地址不能携带账号密码 | <code>"仅允许 http/https 请求，且地址不能携带账号密码",</code> |
| [130](../src/plugins/permissions/grants.ts:130) | 文案定义／其他 | 非本机/内网地址必须使用 https | <code>"非本机/内网地址必须使用 https",</code> |
| [138](../src/plugins/permissions/grants.ts:138) | 文案定义／其他 | 权限无法保存，请检查本地储存 | <code>throw new PluginError("not-ready", "权限无法保存，请检查本地储存");</code> |

<a id="src-plugins-pluginactions-vue"></a>

## src/plugins/PluginActions.vue

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [29](../src/plugins/PluginActions.vue:29) | 界面文案 | 取消固定 | <code>&lt;button type="button" class="topbar-more-pin" :title="pinned.includes(action.id) ? $t('取消固定') : $t('固定到菜单栏')" :aria-label="pinned.includes(action.id) ? $t('取消固定{0}', { '0': title(action) }) : $t('固定{0…</code> |
| [29](../src/plugins/PluginActions.vue:29) | 界面文案 | 固定到菜单栏 | <code>&lt;button type="button" class="topbar-more-pin" :title="pinned.includes(action.id) ? $t('取消固定') : $t('固定到菜单栏')" :aria-label="pinned.includes(action.id) ? $t('取消固定{0}', { '0': title(action) }) : $t('固定{0}到菜单栏', { '0':…</code> |
| [29](../src/plugins/PluginActions.vue:29) | 界面文案 | 取消固定{0} | <code>…:title="pinned.includes(action.id) ? $t('取消固定') : $t('固定到菜单栏')" :aria-label="pinned.includes(action.id) ? $t('取消固定{0}', { '0': title(action) }) : $t('固定{0}到菜单栏', { '0': title(action) })" :aria-pressed="pinned.includes(action.i…</code> |
| [29](../src/plugins/PluginActions.vue:29) | 界面文案 | 固定{0}到菜单栏 | <code>…('取消固定') : $t('固定到菜单栏')" :aria-label="pinned.includes(action.id) ? $t('取消固定{0}', { '0': title(action) }) : $t('固定{0}到菜单栏', { '0': title(action) })" :aria-pressed="pinned.includes(action.id)" @pointerdown.stop @mousedown.prevent.s…</code> |

<a id="src-plugins-plugindialogframe-vue"></a>

## src/plugins/PluginDialogFrame.vue

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [34](../src/plugins/PluginDialogFrame.vue:34) | 界面文案 | 关闭 | <code>…"dialog.title" tabindex="-1"&gt;&lt;header&gt;&lt;strong&gt;{{ dialog.title }}&lt;/strong&gt;&lt;button type="button" :aria-label="$t('关闭')" @click="close"&gt;&lt;X :size="16"/&gt;&lt;/button&gt;&lt;/header&gt;&lt;div class="plugin-dialog-body"&gt;&lt;PluginContent :mount="mo…</code> |

<a id="src-plugins-pluginsettingcontrol-vue"></a>

## src/plugins/PluginSettingControl.vue

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [24](../src/plugins/PluginSettingControl.vue:24) | 文案定义／其他 | 插件视图打开失败：{0} | <code>} catch (reason) { failed.value = true; error.value = t('插件视图打开失败：{0}', { '0': String(reason) }) }</code> |

<a id="src-plugins-pluginsettings-vue"></a>

## src/plugins/PluginSettings.vue

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [22](../src/plugins/PluginSettings.vue:22) | 文案定义／其他 | 本地导入 | <code>function sourceLabel(pkg: DownloadedPlugin) { return pkg.directoryUrl &#124;&#124; t('本地导入') }</code> |
| [36](../src/plugins/PluginSettings.vue:36) | 状态文案 | 已加载 ${plugins.length} 个插件 | <code>status.value = &#96;已加载 ${plugins.length} 个插件&#96;</code> |
| [53](../src/plugins/PluginSettings.vue:53) | 状态文案 | 已安装 ${result.manifest.name} ${result.manifest.version}；同一 ID 的插件另有来源，同一时间只能启用其中一个 | <code>status.value = conflict ? &#96;已安装 ${result.manifest.name} ${result.manifest.version}；同一 ID 的插件另有来源，同一时间只能启用其中一个&#96; : &#96;已安装 ${result.manifest.name} ${result.manifest.version}&#96;</code> |
| [53](../src/plugins/PluginSettings.vue:53) | 状态文案 | 已安装 ${result.manifest.name} ${result.manifest.version} | <code>status.value = conflict ? &#96;已安装 ${result.manifest.name} ${result.manifest.version}；同一 ID 的插件另有来源，同一时间只能启用其中一个&#96; : &#96;已安装 ${result.manifest.name} ${result.manifest.version}&#96;</code> |
| [60](../src/plugins/PluginSettings.vue:60) | 文案定义／其他 | 此插件已存在，请卸载后重新导入 | <code>if (packages.value.some(item =&gt; item.key === pluginKey(pkg))) throw new Error(t('此插件已存在，请卸载后重新导入'))</code> |
| [74](../src/plugins/PluginSettings.vue:74) | 状态文案 | 可更新至 ${latest.version} | <code>updateStatus.value[key] = latest ? &#96;可更新至 ${latest.version}&#96; : '已是最新版本'</code> |
| [74](../src/plugins/PluginSettings.vue:74) | 状态文案 | 已是最新版本 | <code>updateStatus.value[key] = latest ? &#96;可更新至 ${latest.version}&#96; : '已是最新版本'</code> |
| [77](../src/plugins/PluginSettings.vue:77) | 状态文案 | 检查失败：${String(reason)} | <code>updateStatus.value[key] = &#96;检查失败：${String(reason)}&#96;</code> |
| [92](../src/plugins/PluginSettings.vue:92) | 状态文案 | 已更新 ${next.manifest.name} ${next.manifest.version} | <code>status.value = &#96;已更新 ${next.manifest.name} ${next.manifest.version}&#96;</code> |
| [107](../src/plugins/PluginSettings.vue:107) | 状态文案 | 已卸载此来源；另一来源仍使用相同 ID，已保留其插件数据 | <code>if (answer.clearData &amp;&amp; shared) status.value = '已卸载此来源；另一来源仍使用相同 ID，已保留其插件数据'</code> |
| [121](../src/plugins/PluginSettings.vue:121) | 界面文案 | 插件类别 | <code>&lt;div class="plugin-tabs" role="tablist" :aria-label="$t('插件类别')"&gt;&lt;button role="tab" :aria-selected="tab === 'catalogs'" @click="tab = 'catalogs'"&gt;{{ $t('社区插件') }}&lt;/button…</code> |
| [121](../src/plugins/PluginSettings.vue:121) | 界面文案 | 社区插件 | <code>…ria-label="$t('插件类别')"&gt;&lt;button role="tab" :aria-selected="tab === 'catalogs'" @click="tab = 'catalogs'"&gt;{{ $t('社区插件') }}&lt;/button&gt;&lt;button role="tab" :aria-selected="tab === 'downloaded'" @click="tab = 'downloaded'"&gt;{{ $t('本地'…</code> |
| [121](../src/plugins/PluginSettings.vue:121) | 界面文案 | 本地 | <code>…'社区插件') }}&lt;/button&gt;&lt;button role="tab" :aria-selected="tab === 'downloaded'" @click="tab = 'downloaded'"&gt;{{ $t('本地') }} · {{ packages.length }}&lt;/button&gt;&lt;/div&gt;</code> |
| [121](../src/plugins/PluginSettings.vue:121) | 界面文案 | · | <code>…}}&lt;/button&gt;&lt;button role="tab" :aria-selected="tab === 'downloaded'" @click="tab = 'downloaded'"&gt;{{ $t('本地') }} · {{ packages.length }}&lt;/button&gt;&lt;/div&gt;</code> |
| [122](../src/plugins/PluginSettings.vue:122) | 界面文案 | 导入插件 | <code>&lt;button v-if="tab === 'downloaded'" :disabled="busy" @click="importPlugin"&gt;{{ $t('导入插件') }}&lt;/button&gt;</code> |
| [127](../src/plugins/PluginSettings.vue:127) | 界面文案 | 插件目录 | <code>&lt;label for="plugin-directory-url"&gt;{{ $t('插件目录') }}&lt;/label&gt;</code> |
| [128](../src/plugins/PluginSettings.vue:128) | 界面文案 | https://example.com/plugins.json | <code>&lt;div&gt;&lt;input id="plugin-directory-url" v-model="directoryUrl" type="url" placeholder="https://example.com/plugins.json" :disabled="busy" required&gt;&lt;button :disabled="busy &#124;&#124; !directoryUrl.trim()"&gt;{{ busy ? $t('加载中…') : $t('加载列表') }}&lt;/button&gt;&lt;/div&gt;</code> |
| [128](../src/plugins/PluginSettings.vue:128) | 界面文案 | 加载中… | <code>&lt;div&gt;&lt;input id="plugin-directory-url" v-model="directoryUrl" type="url" placeholder="https://example.com/plugins.json" :disabled="busy" required&gt;&lt;button :disabled="busy &#124;&#124; !directoryUrl.trim()"&gt;{{ busy ? $t('加载中…') : $t('加载列表') }}&lt;/button&gt;&lt;/div&gt;</code> |
| [128](../src/plugins/PluginSettings.vue:128) | 界面文案 | 加载列表 | <code>&lt;div&gt;&lt;input id="plugin-directory-url" v-model="directoryUrl" type="url" placeholder="https://example.com/plugins.json" :disabled="busy" required&gt;&lt;button :disabled="busy &#124;&#124; !directoryUrl.trim()"&gt;{{ busy ? $t('加载中…') : $t('加载列表') }}&lt;/button&gt;&lt;/div&gt;</code> |
| [130](../src/plugins/PluginSettings.vue:130) | 界面文案 | 社区插件列表 | <code>&lt;div class="plugin-list" role="region" :aria-label="$t('社区插件列表')" tabindex="0"&gt;</code> |
| [131](../src/plugins/PluginSettings.vue:131) | 界面文案 | 此插件目录为空，可更换目录地址 | <code>&lt;p v-if="!directory.length" class="plugin-empty"&gt;{{ loadedUrl ? $t('此插件目录为空，可更换目录地址') : $t('填写插件目录地址，加载可安装的插件') }}&lt;/p&gt;</code> |
| [131](../src/plugins/PluginSettings.vue:131) | 界面文案 | 填写插件目录地址，加载可安装的插件 | <code>&lt;p v-if="!directory.length" class="plugin-empty"&gt;{{ loadedUrl ? $t('此插件目录为空，可更换目录地址') : $t('填写插件目录地址，加载可安装的插件') }}&lt;/p&gt;</code> |
| [132](../src/plugins/PluginSettings.vue:132) | 界面文案 | 作者： | <code>…lugin.id" class="plugin-card"&gt;&lt;div class="plugin-card-content"&gt;&lt;strong&gt;{{ plugin.name }}&lt;/strong&gt;&lt;small&gt;{{ $t('作者：') }}{{ plugin.author &#124;&#124; plugin.repo.split('/')[0] }}&lt;/small&gt;&lt;p&gt;{{ plugin.description }}&lt;/p&gt;&lt;/div&gt;&lt;button :di…</code> |
| [132](../src/plugins/PluginSettings.vue:132) | 界面文案 | 已安装 | <code>…ryUrl: loadedUrl, author: plugin.author })"&gt;{{ packages.some(item =&gt; item.key === catalogKey(plugin.id)) ? $t('已安装') : $t('安装') }}&lt;/button&gt;&lt;/article&gt;</code> |
| [132](../src/plugins/PluginSettings.vue:132) | 界面文案 | 安装 | <code>…dUrl, author: plugin.author })"&gt;{{ packages.some(item =&gt; item.key === catalogKey(plugin.id)) ? $t('已安装') : $t('安装') }}&lt;/button&gt;&lt;/article&gt;</code> |
| [136](../src/plugins/PluginSettings.vue:136) | 界面文案 | 本地插件列表 | <code>&lt;div class="plugin-list" role="region" :aria-label="$t('本地插件列表')" tabindex="0"&gt;</code> |
| [137](../src/plugins/PluginSettings.vue:137) | 界面文案 | 可从社区安装或导入本地插件 | <code>&lt;p v-if="!packages.length" class="plugin-empty"&gt;{{ $t('可从社区安装或导入本地插件') }}&lt;/p&gt;</code> |
| [140](../src/plugins/PluginSettings.vue:140) | 界面文案 | 已启用 | <code>&lt;div class="plugin-title"&gt;&lt;strong :title="pkg.manifest.id"&gt;{{ pkg.manifest.name }}&lt;/strong&gt;&lt;small&gt;{{ pkg.manifest.version }}&lt;/small&gt;&lt;small&gt;{{ isEnabled(pkg) ? $t('已启用') : $t('已停用') }}&lt;/small&gt;&lt;/div&gt;</code> |
| [140](../src/plugins/PluginSettings.vue:140) | 界面文案 | 已停用 | <code>&lt;div class="plugin-title"&gt;&lt;strong :title="pkg.manifest.id"&gt;{{ pkg.manifest.name }}&lt;/strong&gt;&lt;small&gt;{{ pkg.manifest.version }}&lt;/small&gt;&lt;small&gt;{{ isEnabled(pkg) ? $t('已启用') : $t('已停用') }}&lt;/small&gt;&lt;/div&gt;</code> |
| [142](../src/plugins/PluginSettings.vue:142) | 界面文案 | 权限说明 | <code>&lt;details v-if="hasPermissions(pkg)" class="plugin-permission-details"&gt;&lt;summary&gt;{{ $t('权限说明') }}&lt;/summary&gt;&lt;ul&gt;&lt;li v-for="permission in [...new Set([...pkg.manifest.permissions.required,...pkg.manifest…</code> |
| [143](../src/plugins/PluginSettings.vue:143) | 界面文案 | 该插件尝试使用未声明的权限：{0}。未声明的能力不会被授予，请联系作者更新插件 | <code>&lt;p v-if="denials[pkg.manifest.id]" class="plugin-feedback" role="status"&gt;{{ $t('该插件尝试使用未声明的权限：{0}。未声明的能力不会被授予，请联系作者更新插件', { 0: denials[pkg.manifest.id] }) }}&lt;/p&gt;</code> |
| [144](../src/plugins/PluginSettings.vue:144) | 界面文案 | 来源：{0} | <code>&lt;small class="plugin-author"&gt;{{ $t('来源：{0}', { 0: sourceLabel(pkg) }) }}&lt;template v-if="pkg.author"&gt; · {{ pkg.author }}&lt;/template&gt;&lt;/small&gt;</code> |
| [144](../src/plugins/PluginSettings.vue:144) | 界面文案 | · | <code>&lt;small class="plugin-author"&gt;{{ $t('来源：{0}', { 0: sourceLabel(pkg) }) }}&lt;template v-if="pkg.author"&gt; · {{ pkg.author }}&lt;/template&gt;&lt;/small&gt;</code> |
| [149](../src/plugins/PluginSettings.vue:149) | 界面文案 | 检查更新 | <code>&lt;button v-if="pkg.repo" :disabled="busy &#124;&#124; runtime.busy.includes(pkg.manifest.id)" @click="checkUpdate(pkg.key)"&gt;{{ $t('检查更新') }}&lt;/button&gt;</code> |
| [150](../src/plugins/PluginSettings.vue:150) | 界面文案 | 更新至 | <code>&lt;button v-if="updates[pkg.key]" :disabled="busy" @click="updatePlugin(pkg.key)"&gt;{{ $t('更新至') }} {{ updates[pkg.key] }}&lt;/button&gt;</code> |
| [151](../src/plugins/PluginSettings.vue:151) | 界面文案 | 停用 | <code>&lt;button :disabled="busy &#124;&#124; runtime.busy.includes(pkg.manifest.id)" @click="togglePlugin(pkg.key)"&gt;{{ isEnabled(pkg) ? $t('停用') : $t('启用') }}&lt;/button&gt;</code> |
| [151](../src/plugins/PluginSettings.vue:151) | 界面文案 | 启用 | <code>&lt;button :disabled="busy &#124;&#124; runtime.busy.includes(pkg.manifest.id)" @click="togglePlugin(pkg.key)"&gt;{{ isEnabled(pkg) ? $t('停用') : $t('启用') }}&lt;/button&gt;</code> |
| [152](../src/plugins/PluginSettings.vue:152) | 界面文案 | 卸载并删除此插件的本地文件 | <code>&lt;button :disabled="busy" :title="$t('卸载并删除此插件的本地文件')" @click="remove(pkg.key)"&gt;{{ $t('卸载') }}&lt;/button&gt;</code> |
| [152](../src/plugins/PluginSettings.vue:152) | 界面文案 | 卸载 | <code>&lt;button :disabled="busy" :title="$t('卸载并删除此插件的本地文件')" @click="remove(pkg.key)"&gt;{{ $t('卸载') }}&lt;/button&gt;</code> |
| [157](../src/plugins/PluginSettings.vue:157) | 界面文案 | 渲染器 | <code>…ome(item=&gt;['mermaid','mindmap','math'].includes(item.language&#124;&#124;''))" class="plugin-renderer-choices"&gt;&lt;h3&gt;{{$t('渲染器')}}&lt;/h3&gt;&lt;label v-for="language in ['mermaid','mindmap','math'].filter(language=&gt;pluginServices.blocks.some(i…</code> |
| [157](../src/plugins/PluginSettings.vue:157) | 界面文案 | 内置 | <code>…age]&#124;&#124;''" @change="selectRenderer(language,($event.target as HTMLSelectElement).value)"&gt;&lt;option value=""&gt;{{$t('内置')}}&lt;/option&gt;&lt;option v-for="renderer in pluginServices.blocks.filter(item=&gt;item.language===language)" :key="r…</code> |

<a id="src-plugins-pluginshortcutsettings-vue"></a>

## src/plugins/PluginShortcutSettings.vue

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [22](../src/plugins/PluginShortcutSettings.vue:22) | 界面文案 | 插件 | <code>&lt;template&gt;&lt;section v-if="pluginRuntime.state.commands.length" class="shortcut-group"&gt;&lt;h4&gt;{{ t('插件') }}&lt;/h4&gt;&lt;div class="shortcut-list"&gt;&lt;div v-for="command in pluginRuntime.state.commands" :key="command.id" c…</code> |
| [22](../src/plugins/PluginShortcutSettings.vue:22) | 界面文案 | 请按组合键… | <code>…" :class="{ recording: recording === command.id }" @click="start(command.id)"&gt;{{ recording === command.id ? t('请按组合键…') : formatChord(pluginRuntime.assignedShortcut(command.id)) &#124;&#124; t('未设置') }}&lt;/button&gt;&lt;button class="shortcut-a…</code> |
| [22](../src/plugins/PluginShortcutSettings.vue:22) | 界面文案 | 未设置 | <code>…id)"&gt;{{ recording === command.id ? t('请按组合键…') : formatChord(pluginRuntime.assignedShortcut(command.id)) &#124;&#124; t('未设置') }}&lt;/button&gt;&lt;button class="shortcut-action" :disabled="!pluginRuntime.assignedShortcut(command.id)" @click=…</code> |
| [22](../src/plugins/PluginShortcutSettings.vue:22) | 界面文案 | 清除 | <code>…ass="shortcut-action" :disabled="!pluginRuntime.assignedShortcut(command.id)" @click="clear(command.id)"&gt;{{ t('清除') }}&lt;/button&gt;&lt;/div&gt;&lt;/div&gt;&lt;/div&gt;&lt;p v-if="error" role="alert"&gt;{{ error }}&lt;/p&gt;&lt;/section&gt;&lt;/template&gt;</code> |

<a id="src-plugins-pluginsidebar-vue"></a>

## src/plugins/PluginSidebar.vue

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [53](../src/plugins/PluginSidebar.vue:53) | 界面文案 | 调整侧栏宽度 | <code>…sizer plugin-sidebar-width-resizer" role="separator" tabindex="0" aria-orientation="vertical" :aria-label="$t('调整侧栏宽度')" :aria-valuenow="Math.round(width)" :aria-valuemin="220" :aria-valuemax="maxWidth" @pointerdown="resizeWid…</code> |
| [53](../src/plugins/PluginSidebar.vue:53) | 界面文案 | 右侧栏 | <code>…" id="plugin-sidebar" class="plugin-sidebar" :style="{'--plugin-sidebar-width':&#96;${width}px&#96;}" :aria-label="$t('右侧栏')" @contextmenu="($event.target as HTMLElement).closest('input,textarea,[contenteditable]') &#124;&#124; $event.preven…</code> |

<a id="src-plugins-pluginviews-vue"></a>

## src/plugins/PluginViews.vue

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [19](../src/plugins/PluginViews.vue:19) | 文案定义／其他 | 插件视图打开失败：{0} | <code>try { const dispose = view.mount(root.value); if (typeof dispose === 'function') cleanup = dispose } catch (error) { root.value.textContent = t('插件视图打开失败：{0}', { '0': String(error) }) }</code> |
| [24](../src/plugins/PluginViews.vue:24) | 界面文案 | 插件面板 | <code>&lt;section v-if="views.length" class="plugin-views" :data-location="location"&gt;&lt;nav :aria-label="$t('插件面板')"&gt;&lt;button v-for="view in views" :key="view.id" :aria-pressed="currentView?.id === view.id" @click="selected…</code> |

<a id="src-plugins-pluginworkspace-vue"></a>

## src/plugins/PluginWorkspace.vue

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [14](../src/plugins/PluginWorkspace.vue:14) | 界面文案 | 右侧栏 | <code>…lugin-sidebar-toggle" :class="{ 'mode-active': pluginSidebar.state.open }" :title="$t('右侧栏')" :aria-label="$t('右侧栏')" :aria-expanded="pluginSidebar.state.open" aria-controls="plugin-sidebar" @click="pluginSidebar.toggle()"&gt;…</code> |

<a id="src-plugins-runtime-ts"></a>

## src/plugins/runtime.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [96](../src/plugins/runtime.ts:96) | 文案定义／其他 | 此快捷键用于基础编辑操作 | <code>if (/^(?:Meta&#124;Control)\+(?:Shift\+)?Key[ACVXYZ]$/.test(chord)) return '此快捷键用于基础编辑操作'</code> |
| [100](../src/plugins/runtime.ts:100) | 文案定义／其他 | 与「${duplicate.title}」冲突 | <code>return duplicate ? &#96;与「${duplicate.title}」冲突&#96; : null</code> |
| [103](../src/plugins/runtime.ts:103) | 文案定义／其他 | 命令不存在 | <code>if (!this.state.commands.some(command =&gt; command.id === id)) throw new Error('命令不存在')</code> |
| [110](../src/plugins/runtime.ts:110) | 文案定义／其他 | 编辑器尚未就绪，请打开文件后操作 | <code>private app() { if (!this.adapter) throw new Error('编辑器尚未就绪，请打开文件后操作'); return this.adapter }</code> |
| [111](../src/plugins/runtime.ts:111) | 文案定义／其他 | 插件错误：{0} | <code>private report(error: unknown) { this.adapter?.notify(t('插件错误：{0}', { "0": String(error) })) }</code> |
| [125](../src/plugins/runtime.ts:125) | 文案定义／其他 | 同一 ID 的插件已从另一个目录启用，请先停用它 | <code>if (this.sessions.has(id) &amp;&amp; this.state.sources[id] !== source) throw new Error('同一 ID 的插件已从另一个目录启用，请先停用它')</code> |
| [135](../src/plugins/runtime.ts:135) | 文案定义／其他 | 此插件需要按 API v2 重新构建 | <code>if (pkg.manifest.apiVersion !== 2) throw new Error('此插件需要按 API v2 重新构建')</code> |
| [136](../src/plugins/runtime.ts:136) | 文案定义／其他 | 此插件需要更新版本的 Markart | <code>if(pkg.manifest.minAppVersion &amp;&amp; pkg.manifest.minAppVersion.split('.').reduce((result,part,index)=&gt;result&#124;&#124;Number(part)-Number(appVersion.split('.')[index]&#124;&#124;0),0)&gt;0)throw new Error('此插件需要更新版本的 Markart')</code> |
| [145](../src/plugins/runtime.ts:145) | 文案定义／其他 | 插件加载已取消 | <code>if (session.closed) throw new Error('插件加载已取消')</code> |
| [146](../src/plugins/runtime.ts:146) | 文案定义／其他 | 插件需导出 activate(api) | <code>if (typeof session.module.activate !== 'function') throw new Error('插件需导出 activate(api)')</code> |
| [148](../src/plugins/runtime.ts:148) | 文案定义／其他 | 插件加载已取消 | <code>if (session.closed) throw new Error('插件加载已取消')</code> |
| [165](../src/plugins/runtime.ts:165) | 文案定义／其他 | 插件正在加载，请稍后操作 | <code>if (this.state.busy.includes(id)) throw new Error('插件正在加载，请稍后操作')</code> |
| [178](../src/plugins/runtime.ts:178) | 文案定义／其他 | 命令不存在：${id} | <code>async execute(id: string, context = this.context()) { const command = this.state.commands.find(item =&gt; item.id === id); if (!command) throw new Error(&#96;命令不存在：${id}&#96;); return command.run(context) }</code> |
| [186](../src/plugins/runtime.ts:186) | 文案定义／其他 | 插件已停用 | <code>const alive = () =&gt; { if (session.closed) throw new Error('插件已停用') }</code> |
| [191](../src/plugins/runtime.ts:191) | 文案定义／其他 | 扩展 ID 不能为空 | <code>const fullId = (value: string) =&gt; { if (!value.trim()) throw new Error('扩展 ID 不能为空'); return value.startsWith(id + ':') ? value : &#96;${id}:${value}&#96; }</code> |
| [194](../src/plugins/runtime.ts:194) | 文案定义／其他 | 命令名称、快捷键或回调无效 | <code>if (!command.title?.trim() &#124;&#124; typeof command.run !== 'function' &#124;&#124; command.shortcut !== undefined &amp;&amp; typeof command.shortcut !== 'string') throw new Error('命令名称、快捷键或回调无效')</code> |
| [195](../src/plugins/runtime.ts:195) | 文案定义／其他 | 命令 ID 重复 | <code>if (this.state.commands.some(item =&gt; item.id === key)) throw new Error('命令 ID 重复')</code> |
| [210](../src/plugins/runtime.ts:210) | 文案定义／其他 | 文件编辑范围无效 | <code>alive(); const doc = this.app().active(); if (!doc &#124;&#124; !Number.isInteger(from) &#124;&#124; !Number.isInteger(to) &#124;&#124; from &lt; 0 &#124;&#124; to &lt; from &#124;&#124; to &gt; doc.content.length) throw new Error('文件编辑范围无效')</code> |
| [213](../src/plugins/runtime.ts:213) | 文案定义／其他 | 插件已停用 | <code>const storageAlive = () =&gt; { if (this.sessions.get(id) !== session) throw new Error('插件已停用') }</code> |
| [219](../src/plugins/runtime.ts:219) | 文案定义／其他 | 操作项条件需要函数 | <code>if (action.when !== undefined &amp;&amp; typeof action.when !== 'function') throw new Error('操作项条件需要函数')</code> |
| [220](../src/plugins/runtime.ts:220) | 文案定义／其他 | 扩展入口或排序无效 | <code>if (!['file-tree', 'topbar-menu', 'tab', 'tab-context', 'format-toolbar', 'slash'].includes(action.location) &#124;&#124; (action.order !== undefined &amp;&amp; !Number.isFinite(action.order))) throw new Error('扩展入口或排序无效')</code> |
| [221](../src/plugins/runtime.ts:221) | 文案定义／其他 | 操作项 ID 重复 | <code>if (this.state.actions.some(item =&gt; item.id === key)) throw new Error('操作项 ID 重复')</code> |
| [223](../src/plugins/runtime.ts:223) | 文案定义／其他 | 请先注册本插件的命令 | <code>if (!this.state.commands.some(item =&gt; item.id === commandId &amp;&amp; item.owner === id)) throw new Error('请先注册本插件的命令')</code> |
| [242](../src/plugins/runtime.ts:242) | 文案定义／其他 | 请先打开文件 | <code>…wait this.app().open(key) }, setContent: text =&gt; { const doc = this.app().active(); if (!doc) throw new Error('请先打开文件'); replace(0, doc.content.length, text) }, save: async () =&gt; { alive(); await this.app().save() } },</code> |
| [291](../src/plugins/runtime.ts:291) | 文案定义／其他 | 视图 ID 重复 | <code>…&gt; { alive(); const key = fullId(view.id); if (this.state.views.some(item =&gt; item.id === key)) throw new Error('视图 ID 重复'); if (view.location &amp;&amp; !['settings', 'right'].includes(view.location)) throw new Error('视图位置无效'); if (!view…</code> |
| [291](../src/plugins/runtime.ts:291) | 文案定义／其他 | 视图位置无效 | <code>…w new Error('视图 ID 重复'); if (view.location &amp;&amp; !['settings', 'right'].includes(view.location)) throw new Error('视图位置无效'); if (!view.title?.trim() &#124;&#124; typeof view.mount !== 'function' &#124;&#124; view.order !== undefined &amp;&amp; !Number.isFini…</code> |
| [291](../src/plugins/runtime.ts:291) | 文案定义／其他 | 视图名称、挂载函数或排序无效 | <code>…typeof view.mount !== 'function' &#124;&#124; view.order !== undefined &amp;&amp; !Number.isFinite(view.order)) throw new Error('视图名称、挂载函数或排序无效'); const item = { ...view, location: view.location &#124;&#124; 'right' as const, id: key, owner: id }; this.state.vie…</code> |
| [294](../src/plugins/runtime.ts:294) | 文案定义／其他 | 弹窗标题、尺寸或挂载函数无效 | <code>…og.width &gt; 800) &#124;&#124; dialog.persistent !== undefined &amp;&amp; typeof dialog.persistent !== 'boolean') throw new Error('弹窗标题、尺寸或挂载函数无效')</code> |
| [301](../src/plugins/runtime.ts:301) | 文案定义／其他 | 设置分类名称或排序无效 | <code>if (!category.title?.trim() &#124;&#124; (category.order !== undefined &amp;&amp; !Number.isFinite(category.order))) throw new Error('设置分类名称或排序无效')</code> |
| [302](../src/plugins/runtime.ts:302) | 文案定义／其他 | 设置分类 ID 重复 | <code>if (this.state.settingsCategories.some(item =&gt; item.id === key)) throw new Error('设置分类 ID 重复')</code> |
| [311](../src/plugins/runtime.ts:311) | 文案定义／其他 | 请先注册本插件的设置分类 | <code>if (!builtin.includes(category) &amp;&amp; !this.state.settingsCategories.some(item =&gt; item.id === category &amp;&amp; item.owner === id)) throw new Error('请先注册本插件的设置分类')</code> |
| [312](../src/plugins/runtime.ts:312) | 文案定义／其他 | 设置项名称、挂载函数或排序无效 | <code>if (!setting.title?.trim() &#124;&#124; (setting.order !== undefined &amp;&amp; !Number.isFinite(setting.order))) throw new Error('设置项名称、挂载函数或排序无效')</code> |
| [313](../src/plugins/runtime.ts:313) | 文案定义／其他 | 设置项 ID 重复 | <code>if (this.state.settings.some(item =&gt; item.id === key)) throw new Error('设置项 ID 重复')</code> |
| [324](../src/plugins/runtime.ts:324) | 文案定义／其他 | 主题 ID、名称或 CSS 无效（ID/名称上限 80 字符，CSS 上限 100000 字符） | <code>if (!theme.name?.trim() &#124;&#124; theme.name.length &gt; 80 &#124;&#124; key.length &gt; 80 &#124;&#124; typeof theme.css !== 'string' &#124;&#124; theme.css.length &gt; 100000) throw new Error('主题 ID、名称或 CSS 无效（ID/名称上限 80 字符，CSS 上限 100000 字符）')</code> |
| [325](../src/plugins/runtime.ts:325) | 文案定义／其他 | 主题 CSS 不支持加载外部资源 | <code>if (/@import\b&#124;url\s*\(&#124;image-set\s*\(&#124;expression\s*\(/i.test(theme.css)) throw new Error('主题 CSS 不支持加载外部资源')</code> |
| [326](../src/plugins/runtime.ts:326) | 文案定义／其他 | 主题 ID 重复 | <code>if ([...this.state.themes, ...(this.app().listThemes?.() &#124;&#124; [])].some(item =&gt; item.id === key)) throw new Error('主题 ID 重复')</code> |
| [341](../src/plugins/runtime.ts:341) | 文案定义／其他 | 当前主题不可用 | <code>if (!theme) throw new Error('当前主题不可用')</code> |
| [347](../src/plugins/runtime.ts:347) | 文案定义／其他 | 主题不可用，请打开文件后重新选择主题 | <code>if (!theme &#124;&#124; !this.app().selectTheme) throw new Error('主题不可用，请打开文件后重新选择主题')</code> |
| [361](../src/plugins/runtime.ts:361) | 文案定义／其他 | 插件已停用 | <code>if (session.closed) { await unlisten(); throw new Error('插件已停用') }</code> |
| [369](../src/plugins/runtime.ts:369) | 文案定义／其他 | 插件已停用 | <code>if (stopped &#124;&#124; session.closed) { await invoke('plugin_watch_stop', { id: watchId }); throw new Error('插件已停用') }</code> |
| [374](../src/plugins/runtime.ts:374) | 文案定义／其他 | 提供者 ID 重复 | <code>…d(provider.id); if (this.state.providers.some(item =&gt; item.kind === kind &amp;&amp; item.id === key)) throw new Error('提供者 ID 重复'); const item = { ...provider, id: key, kind, owner: id }; this.state.providers = [...this.state.providers,…</code> |
| [374](../src/plugins/runtime.ts:374) | 文案定义／其他 | 提供者不存在 | <code>…=&gt; item.kind === kind &amp;&amp; item.id === (key.includes(':') ? key : fullId(key))); if (!provider) throw new Error('提供者不存在'); return provider.run(input, signal) } },</code> |

<a id="src-plugins-runtime-connection-ts"></a>

## src/plugins/runtime/connection.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [41](../src/plugins/runtime/connection.ts:41) | 文案定义／其他 | 插件运行失败 | <code>new PluginError("plugin-fault", event.message &#124;&#124; "插件运行失败"),</code> |
| [47](../src/plugins/runtime/connection.ts:47) | 文案定义／其他 | 插件初始化超时 | <code>() =&gt; this.fail(new PluginError("timeout", "插件初始化超时")),</code> |
| [72](../src/plugins/runtime/connection.ts:72) | 文案定义／其他 | 插件运行失败 | <code>message.error?.message &#124;&#124; "插件运行失败",</code> |
| [93](../src/plugins/runtime/connection.ts:93) | 文案定义／其他 | 插件并发请求过多 | <code>if(this.hostRequests&gt;=64){this.fail(new PluginError('plugin-fault','插件并发请求过多'));return}</code> |
| [120](../src/plugins/runtime/connection.ts:120) | 文案定义／其他 | 资源已释放 | <code>if (!fn) throw new PluginError("cancelled", "资源已释放");</code> |
| [134](../src/plugins/runtime/connection.ts:134) | 文案定义／其他 | 消息嵌套过深 | <code>if (depth &gt; 32) throw new PluginError("invalid-argument", "消息嵌套过深");</code> |
| [137](../src/plugins/runtime/connection.ts:137) | 文案定义／其他 | 插件持有的接口资源过多 | <code>throw new PluginError("plugin-fault", "插件持有的接口资源过多");</code> |
| [177](../src/plugins/runtime/connection.ts:177) | 文案定义／其他 | 插件已停用 | <code>return Promise.reject(new PluginError("cancelled", "插件已停用"));</code> |
| [183](../src/plugins/runtime/connection.ts:183) | 文案定义／其他 | 插件响应超时 | <code>this.fail(new PluginError('timeout','插件响应超时'))</code> |
| [211](../src/plugins/runtime/connection.ts:211) | 文案定义／其他 | 插件已停用 | <code>dispose(reason: unknown = new PluginError("cancelled", "插件已停用")) {</code> |

<a id="src-plugins-runtime-engine-ts"></a>

## src/plugins/runtime/engine.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [25](../src/plugins/runtime/engine.ts:25) | 文案定义／其他 | 插件消息超过 2 MB | <code>if (text.length &gt; 2 * 1024 * 1024) throw new Error("插件消息超过 2 MB");</code> |
| [35](../src/plugins/runtime/engine.ts:35) | 文案定义／其他 | 插件已停用 | <code>if (this.disposed) throw new PluginError("cancelled", "插件已停用");</code> |
| [43](../src/plugins/runtime/engine.ts:43) | 文案定义／其他 | 插件执行超时 | <code>throw new PluginError("timeout", "插件执行超时");</code> |
| [47](../src/plugins/runtime/engine.ts:47) | 文案定义／其他 | 插件执行超时 | <code>throw new PluginError("timeout", "插件执行超时");</code> |
| [53](../src/plugins/runtime/engine.ts:53) | 文案定义／其他 | 插件代码超过 5 MB | <code>throw new PluginError("invalid-argument", "插件代码超过 5 MB");</code> |

<a id="src-plugins-runtime-scope-ts"></a>

## src/plugins/runtime/scope.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [14](../src/plugins/runtime/scope.ts:14) | 文案定义／其他 | 资源已关闭 | <code>throw new PluginError("cancelled", "资源已关闭");</code> |

<a id="src-plugins-runtime-sourcemap-ts"></a>

## src/plugins/runtime/sourceMap.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [5](../src/plugins/runtime/sourceMap.ts:5) | 文案定义／其他 | string | <code>cause &amp;&amp; typeof cause.message === "string"</code> |

<a id="src-plugins-runtime-vmbootstrap-ts"></a>

## src/plugins/runtime/vmBootstrap.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [2](../src/plugins/runtime/vmBootstrap.ts:2) | 文案定义／其他 | (() =&gt; {<br>  const pending = new Map(), callbacks = new Map(), signals = new Map();<br>  let sequence = 0, callbackSequence = 0, plugin;<br>  function makeSignal(id, aborted=false) {<br>    if(signals.has(id))return signals.get(id).signal;<br>    let stopped=aborted;const listeners=new Set();<br>    const signal=Object.freeze({get aborted(){return stopped},addEventListener(type,fn){if(type==='abort')listeners.add(fn)},removeEventListener(type,fn){if(type==='abort')listeners.delete(fn)},throwIfAborted(){if(stopped){const error=new Error('任务已取消');error.code='cancelled';throw error}}});<br>    signals.set(id,{signal,abort(){if(stopped)return;stopped=true;for(const fn of listeners){try{fn()}catch{}}listeners.clear()}});return signal;<br>  }<br>  const pluginSignal=makeSignal(0),tracked=new Set();<br>  const encode = (value, depth = 0) =&gt; {<br>    if (depth &gt; 32) throw new Error('消息嵌套过深');<br>    if (typeof value === 'function') { const id = ++callbackSequence; callbacks.set(id, value); return {$callback:id}; }<br>    if (value === undefined) return null;<br>    if (Array.isArray(value)) return value.map(item =&gt; encode(item, depth+1));<br>    if (value &amp;&amp; typeof value === 'object') return Object.fromEntries(Object.entries(value).filter(([,item])=&gt;item!==undefined).map(([key,item])=&gt;[key,encode(item,depth+1)]));<br>    return value;<br>  };<br>  const decode = value =&gt; {<br>    if (!value &#124;&#124; typeof value !== 'object') return value;<br>    if(Number.isInteger(value.$signal)&amp;&amp;Object.keys(value).every(key=&gt;['$signal','aborted'].includes(key)))return makeSignal(value.$signal,value.aborted===true);<br>    if (Number.isInteger(value.$host) &amp;&amp; Object.keys(value).length === 1) return (...args) =&gt; request('$host', [value.$host, ...args]);<br>    if (Array.isArray(value)) return value.map(decode);<br>    return Object.fromEntries(Object.entries(value).map(([key,item])=&gt;[key,decode(item)]));<br>  };<br>  function request(method, args) {<br>    const id = ++sequence;<br>    return new Promise((resolve,reject)=&gt;{ pending.set(id,{resolve,reject}); __send(JSON.stringify({type:'request',id,method,args:encode(args)})); });<br>  }<br>  function proxy(path) { return new Proxy(function(){}, {get(_target,key){ if(key==='then')return undefined;if(path==='lifecycle'&amp;&amp;key==='signal')return pluginSignal; return proxy(path ? path+'.'+String(key) : String(key)); },apply(_target,_self,args){if(path==='lifecycle.track'){const dispose=args[0];if(typeof dispose!=='function')return Promise.reject(new Error('清理函数无效'));tracked.add(dispose);return Promise.resolve(()=&gt;{if(tracked.delete(dispose))return dispose()});}return request(path,args);} }); }<br>  const api = proxy('');<br>  const report = (id, value, error) =&gt; __send(JSON.stringify({type:'complete',id,value:error?undefined:encode(value),error:error?{code:error.code&#124;&#124;'plugin-fault',message:String(error.message&#124;&#124;error)}:undefined}));<br>  globalThis.__receive = raw =&gt; {<br>    const message = JSON.parse(raw);<br>    if(message.type==='cancel-signal'){signals.get(message.signal)?.abort();signals.delete(message.signal);return;}<br>    if(message.type==='release'){for(const id of message.callbacks&#124;&#124;[])callbacks.delete(id);return;}<br>    if (message.type === 'result') {<br>      const job=pending.get(message.id); if(!job)return;pending.delete(message.id);<br>      if(message.error){const error=new Error(message.error.message);error.code=message.error.code;job.reject(error);}else job.resolve(decode(message.value));<br>    } else if (message.type === 'invoke') {<br>      const callback=callbacks.get(message.callback);<br>      if(!callback){report(message.id,null,{code:'cancelled',message:'回调已释放'});return;}<br>      Promise.resolve().then(()=&gt;callback(...decode(message.args))).then(value=&gt;report(message.id,value),error=&gt;report(message.id,null,error));<br>    } else if (message.type === 'start') {<br>      plugin=globalThis.__module.default&#124;&#124;globalThis.__module;<br>      if(typeof plugin.activate !== 'function')throw new Error('插件需导出 activate(api)');<br>      Promise.resolve().then(()=&gt;plugin.activate(api)).then(value=&gt;report(message.id,value),error=&gt;report(message.id,null,error));<br>    } else if (message.type === 'stop') {<br>      signals.get(0).abort();<br>      Promise.resolve().then(()=&gt;plugin &amp;&amp; plugin.deactivate &amp;&amp; plugin.deactivate()).then(async()=&gt;{for(const dispose of [...tracked].reverse()){try{await dispose()}catch{}}tracked.clear()}).then(()=&gt;report(message.id,null),error=&gt;report(message.id,null,error));<br>    }<br>  };<br>})(); | <code>export const vmBootstrap = String.raw&#96;</code> |

<a id="src-plugins-settingcontrols-ts"></a>

## src/plugins/settingControls.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [4](../src/plugins/settingControls.ts:4) | 文案定义／其他 | 自定义设置项需要 mount 函数 | <code>if (type === 'custom') { if (!('mount' in setting) &#124;&#124; typeof setting.mount !== 'function') throw new Error('自定义设置项需要 mount 函数'); return }</code> |
| [5](../src/plugins/settingControls.ts:5) | 文案定义／其他 | 按钮设置项需要按钮文字和 onClick 函数 | <code>if (setting.type === 'button') { if (!setting.buttonText?.trim() &#124;&#124; typeof setting.onClick !== 'function') throw new Error('按钮设置项需要按钮文字和 onClick 函数'); return }</code> |
| [6](../src/plugins/settingControls.ts:6) | 文案定义／其他 | 设置项类型或取值、变更函数无效 | <code>if (!['text', 'password', 'textarea', 'number', 'select', 'segmented', 'toggle'].includes(type) &#124;&#124; !('getValue' in setting) &#124;&#124; typeof setting.getValue !== 'function' &#124;&#124; typeof setting.onChange !== 'function') throw new Error('设置项类型或取值、变更函数无效')</code> |
| [8](../src/plugins/settingControls.ts:8) | 文案定义／其他 | string | <code>…ption.value) &#124;&#124; typeof option.value === 'number' &amp;&amp; !Number.isFinite(option.value) &#124;&#124; typeof option.label !== 'string') &#124;&#124; new Set(setting.options.map(option =&gt; option.value)).size !== setting.options.length) throw new Error('…</code> |
| [8](../src/plugins/settingControls.ts:8) | 文案定义／其他 | 设置项选项不能为空，且选项值不能重复 | <code>…ng') &#124;&#124; new Set(setting.options.map(option =&gt; option.value)).size !== setting.options.length) throw new Error('设置项选项不能为空，且选项值不能重复')</code> |
| [11](../src/plugins/settingControls.ts:11) | 文案定义／其他 | 数字设置项的范围或步长无效 | <code>…== undefined &amp;&amp; setting.min &gt; setting.max &#124;&#124; setting.step !== undefined &amp;&amp; setting.step &lt;= 0) throw new Error('数字设置项的范围或步长无效')</code> |
| [13](../src/plugins/settingControls.ts:13) | 文案定义／其他 | 文本长度上限应为非负整数 | <code>if ('maxLength' in setting &amp;&amp; setting.maxLength !== undefined &amp;&amp; (!Number.isInteger(setting.maxLength) &#124;&#124; setting.maxLength &lt; 0)) throw new Error('文本长度上限应为非负整数')</code> |
| [14](../src/plugins/settingControls.ts:14) | 文案定义／其他 | 文本框行数应为正整数 | <code>if ('rows' in setting &amp;&amp; setting.rows !== undefined &amp;&amp; (!Number.isInteger(setting.rows) &#124;&#124; setting.rows &lt; 1)) throw new Error('文本框行数应为正整数')</code> |
| [19](../src/plugins/settingControls.ts:19) | 文案定义／其他 | 设置值应为文本，且不能超过长度上限 | <code>if (typeof value !== 'string' &#124;&#124; setting.maxLength !== undefined &amp;&amp; value.length &gt; setting.maxLength) throw new Error('设置值应为文本，且不能超过长度上限')</code> |
| [22](../src/plugins/settingControls.ts:22) | 文案定义／其他 | 请输入范围内的数字 | <code>if (typeof value !== 'number' &#124;&#124; !Number.isFinite(value) &#124;&#124; setting.min !== undefined &amp;&amp; value &lt; setting.min &#124;&#124; setting.max !== undefined &amp;&amp; value &gt; setting.max) throw new Error('请输入范围内的数字')</code> |
| [23](../src/plugins/settingControls.ts:23) | 文案定义／其他 | 数字不符合设置步长 | <code>if (setting.step !== undefined) { const steps = (value - (setting.min ?? 0)) / setting.step; if (Math.abs(steps - Math.round(steps)) &gt; 1e-7) throw new Error('数字不符合设置步长') }</code> |
| [25](../src/plugins/settingControls.ts:25) | 文案定义／其他 | 开关设置值应为布尔值 | <code>case 'toggle': if (typeof value !== 'boolean') throw new Error('开关设置值应为布尔值'); break</code> |
| [26](../src/plugins/settingControls.ts:26) | 文案定义／其他 | 设置值不在可选列表中 | <code>case 'select': case 'segmented': if (!setting.options.some(option =&gt; option.value === value)) throw new Error('设置值不在可选列表中'); break</code> |

<a id="src-plugins-ui-pluginuninstalldialog-vue"></a>

## src/plugins/ui/PluginUninstallDialog.vue

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [9](../src/plugins/ui/PluginUninstallDialog.vue:9) | 界面文案 | 卸载插件 | <code>…frame" class="plugin-uninstall-dialog" role="alertdialog" aria-modal="true" :aria-label="$t('卸载插件')"&gt;&lt;h3&gt;{{$t('卸载插件')}} · {{uninstallRequest.name}}&lt;/h3&gt;&lt;p&gt;{{$t('将删除插件代码并撤销授权，文件不受影响。')}}&lt;/p&gt;&lt;label&gt;&lt;input v-model="clearData" t…</code> |
| [9](../src/plugins/ui/PluginUninstallDialog.vue:9) | 界面文案 | · | <code>…ass="plugin-uninstall-dialog" role="alertdialog" aria-modal="true" :aria-label="$t('卸载插件')"&gt;&lt;h3&gt;{{$t('卸载插件')}} · {{uninstallRequest.name}}&lt;/h3&gt;&lt;p&gt;{{$t('将删除插件代码并撤销授权，文件不受影响。')}}&lt;/p&gt;&lt;label&gt;&lt;input v-model="clearData" type="che…</code> |
| [9](../src/plugins/ui/PluginUninstallDialog.vue:9) | 界面文案 | 将删除插件代码并撤销授权，文件不受影响。 | <code>…dialog" aria-modal="true" :aria-label="$t('卸载插件')"&gt;&lt;h3&gt;{{$t('卸载插件')}} · {{uninstallRequest.name}}&lt;/h3&gt;&lt;p&gt;{{$t('将删除插件代码并撤销授权，文件不受影响。')}}&lt;/p&gt;&lt;label&gt;&lt;input v-model="clearData" type="checkbox"&gt;{{$t('同时删除插件保存的数据，无法恢复')}}&lt;/label&gt;&lt;footer&gt;&lt;button @…</code> |
| [9](../src/plugins/ui/PluginUninstallDialog.vue:9) | 界面文案 | 同时删除插件保存的数据，无法恢复 | <code>…equest.name}}&lt;/h3&gt;&lt;p&gt;{{$t('将删除插件代码并撤销授权，文件不受影响。')}}&lt;/p&gt;&lt;label&gt;&lt;input v-model="clearData" type="checkbox"&gt;{{$t('同时删除插件保存的数据，无法恢复')}}&lt;/label&gt;&lt;footer&gt;&lt;button @click="uninstallRequest.resolve(null)"&gt;{{$t('取消')}}&lt;/button&gt;&lt;button @click="unin…</code> |
| [9](../src/plugins/ui/PluginUninstallDialog.vue:9) | 界面文案 | 取消 | <code>…ype="checkbox"&gt;{{$t('同时删除插件保存的数据，无法恢复')}}&lt;/label&gt;&lt;footer&gt;&lt;button @click="uninstallRequest.resolve(null)"&gt;{{$t('取消')}}&lt;/button&gt;&lt;button @click="uninstallRequest.resolve({clearData})"&gt;{{$t('卸载')}}&lt;/button&gt;&lt;/footer&gt;&lt;/section&gt;&lt;…</code> |
| [9](../src/plugins/ui/PluginUninstallDialog.vue:9) | 界面文案 | 卸载 | <code>…nstallRequest.resolve(null)"&gt;{{$t('取消')}}&lt;/button&gt;&lt;button @click="uninstallRequest.resolve({clearData})"&gt;{{$t('卸载')}}&lt;/button&gt;&lt;/footer&gt;&lt;/section&gt;&lt;/div&gt;&lt;/template&gt;</code> |

<a id="src-plugins-ui-pluginupdatedialog-vue"></a>

## src/plugins/ui/PluginUpdateDialog.vue

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [11](../src/plugins/ui/PluginUpdateDialog.vue:11) | 界面文案 | 更新插件 | <code>…f="frame" class="plugin-update-dialog" role="alertdialog" aria-modal="true" :aria-label="$t('更新插件')"&gt;&lt;h3&gt;{{$t('更新插件')}} · {{detail.name}} {{detail.version}}&lt;/h3&gt;&lt;p&gt;{{$t('此更新将新增以下权限：{0}', { 0: added })}}&lt;/p&gt;&lt;p class="plugin-u…</code> |
| [11](../src/plugins/ui/PluginUpdateDialog.vue:11) | 界面文案 | · | <code>…class="plugin-update-dialog" role="alertdialog" aria-modal="true" :aria-label="$t('更新插件')"&gt;&lt;h3&gt;{{$t('更新插件')}} · {{detail.name}} {{detail.version}}&lt;/h3&gt;&lt;p&gt;{{$t('此更新将新增以下权限：{0}', { 0: added })}}&lt;/p&gt;&lt;p class="plugin-update-no…</code> |
| [11](../src/plugins/ui/PluginUpdateDialog.vue:11) | 界面文案 | 此更新将新增以下权限：{0} | <code>…ria-modal="true" :aria-label="$t('更新插件')"&gt;&lt;h3&gt;{{$t('更新插件')}} · {{detail.name}} {{detail.version}}&lt;/h3&gt;&lt;p&gt;{{$t('此更新将新增以下权限：{0}', { 0: added })}}&lt;/p&gt;&lt;p class="plugin-update-note"&gt;{{$t('未声明的能力不会被授予。取消则保留当前版本。')}}&lt;/p&gt;&lt;footer&gt;&lt;button @clic…</code> |
| [11](../src/plugins/ui/PluginUpdateDialog.vue:11) | 界面文案 | 未声明的能力不会被授予。取消则保留当前版本。 | <code>…name}} {{detail.version}}&lt;/h3&gt;&lt;p&gt;{{$t('此更新将新增以下权限：{0}', { 0: added })}}&lt;/p&gt;&lt;p class="plugin-update-note"&gt;{{$t('未声明的能力不会被授予。取消则保留当前版本。')}}&lt;/p&gt;&lt;footer&gt;&lt;button @click="updateRequest?.resolve(false)"&gt;{{$t('取消')}}&lt;/button&gt;&lt;button @click="updateReq…</code> |
| [11](../src/plugins/ui/PluginUpdateDialog.vue:11) | 界面文案 | 取消 | <code>…-update-note"&gt;{{$t('未声明的能力不会被授予。取消则保留当前版本。')}}&lt;/p&gt;&lt;footer&gt;&lt;button @click="updateRequest?.resolve(false)"&gt;{{$t('取消')}}&lt;/button&gt;&lt;button @click="updateRequest?.resolve(true)"&gt;{{$t('继续更新')}}&lt;/button&gt;&lt;/footer&gt;&lt;/section&gt;&lt;/div&gt;&lt;/…</code> |
| [11](../src/plugins/ui/PluginUpdateDialog.vue:11) | 界面文案 | 继续更新 | <code>…click="updateRequest?.resolve(false)"&gt;{{$t('取消')}}&lt;/button&gt;&lt;button @click="updateRequest?.resolve(true)"&gt;{{$t('继续更新')}}&lt;/button&gt;&lt;/footer&gt;&lt;/section&gt;&lt;/div&gt;&lt;/template&gt;</code> |

<a id="src-plugins-ui-sidebararea-vue"></a>

## src/plugins/ui/SidebarArea.vue

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [17](../src/plugins/ui/SidebarArea.vue:17) | 界面文案 | 调整面板高度 | <code>…ndex" class="dock-height-resizer" role="separator" tabindex="0" aria-orientation="horizontal" :aria-label="$t('调整面板高度')" :aria-valuenow="Math.round(sidebarLayout.state.ratios[side]*100)" :aria-valuemin="15" :aria-valuemax="85"…</code> |

<a id="src-plugins-ui-sidebarlayout-ts"></a>

## src/plugins/ui/sidebarLayout.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [132](../src/plugins/ui/sidebarLayout.ts:132) | 文案定义／其他 | 面板容器不存在 | <code>if (!group) throw new PluginError("not-found", "面板容器不存在");</code> |
| [137](../src/plugins/ui/sidebarLayout.ts:137) | 文案定义／其他 | 面板已关闭 | <code>if (!item) throw new PluginError("not-found", "面板已关闭");</code> |
| [146](../src/plugins/ui/sidebarLayout.ts:146) | 文案定义／其他 | 文件面板需要独占面板组 | <code>if (!this.canPlace(viewId, groupId, itemId)) throw new PluginError("invalid-argument", "文件面板需要独占面板组");</code> |
| [159](../src/plugins/ui/sidebarLayout.ts:159) | 文案定义／其他 | 默认面板位置无效 | <code>throw new PluginError("invalid-argument", "默认面板位置无效");</code> |
| [217](../src/plugins/ui/sidebarLayout.ts:217) | 文案定义／其他 | 目标面板已移走 | <code>if (beforeId &amp;&amp; !target.items.includes(beforeId)) throw new PluginError("not-found", "目标面板已移走");</code> |
| [248](../src/plugins/ui/sidebarLayout.ts:248) | 文案定义／其他 | 面板状态超过 256 KB | <code>throw new PluginError("invalid-argument", "面板状态超过 256 KB");</code> |

<a id="src-plugins-ui-sidebarmanagerdialog-vue"></a>

## src/plugins/ui/SidebarManagerDialog.vue

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [40](../src/plugins/ui/SidebarManagerDialog.vue:40) | 界面文案 | 布局 | <code>…alog" class="sidebar-manager-dialog" :class="{'sidebar-manager-embedded':embedded}" :aria-label="embedded ? t('布局') : undefined" :aria-labelledby="embedded ? undefined : 'sidebar-manager-title'" @keydown.tab.prevent @cance…</code> |
| [42](../src/plugins/ui/SidebarManagerDialog.vue:42) | 界面文案 | 布局 | <code>&lt;header v-if="!embedded"&gt;&lt;LayoutDashboard :size="18"/&gt;&lt;h2 id="sidebar-manager-title"&gt;{{t('布局')}}&lt;/h2&gt;&lt;span class="reference-esc"&gt;ESC&lt;/span&gt;&lt;/header&gt;</code> |
| [42](../src/plugins/ui/SidebarManagerDialog.vue:42) | 界面文案 | ESC | <code>&lt;header v-if="!embedded"&gt;&lt;LayoutDashboard :size="18"/&gt;&lt;h2 id="sidebar-manager-title"&gt;{{t('布局')}}&lt;/h2&gt;&lt;span class="reference-esc"&gt;ESC&lt;/span&gt;&lt;/header&gt;</code> |
| [49](../src/plugins/ui/SidebarManagerDialog.vue:49) | 界面文案 | 面板列表 | <code>&lt;section class="sidebar-manager-library" data-manager-zone="library" :class="{'is-target':hover==='library'}" :aria-label="t('面板列表')"&gt;&lt;h3&gt;{{t('面板列表')}}&lt;/h3&gt;</code> |
| [50](../src/plugins/ui/SidebarManagerDialog.vue:50) | 界面文案 | 无未放置面板 | <code>&lt;p v-if="!panels.length" class="sidebar-manager-library-empty"&gt;{{t('无未放置面板')}}&lt;/p&gt;</code> |
| [54](../src/plugins/ui/SidebarManagerDialog.vue:54) | 界面文案 | 完成 | <code>&lt;footer v-if="!embedded"&gt;&lt;button @click="emit('close')"&gt;{{t('完成')}}&lt;/button&gt;&lt;/footer&gt;</code> |

<a id="src-plugins-ui-sidebarregistry-ts"></a>

## src/plugins/ui/sidebarRegistry.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [13](../src/plugins/ui/sidebarRegistry.ts:13) | 文案定义／其他 | 文件 | <code>{ id: filesView, title: t("文件"), multiple: false },</code> |
| [14](../src/plugins/ui/sidebarRegistry.ts:14) | 文案定义／其他 | 大纲 | <code>{ id: outlineView, title: t("大纲"), multiple: false },</code> |
| [36](../src/plugins/ui/sidebarRegistry.ts:36) | 文案定义／其他 | 左侧上方 | <code>"left-top": t("左侧上方"),</code> |
| [37](../src/plugins/ui/sidebarRegistry.ts:37) | 文案定义／其他 | 左侧下方 | <code>"left-bottom": t("左侧下方"),</code> |
| [38](../src/plugins/ui/sidebarRegistry.ts:38) | 文案定义／其他 | 右侧上方 | <code>"right-top": t("右侧上方"),</code> |
| [39](../src/plugins/ui/sidebarRegistry.ts:39) | 文案定义／其他 | 右侧下方 | <code>"right-bottom": t("右侧下方"),</code> |

<a id="src-plugins-ui-tree-ts"></a>

## src/plugins/ui/tree.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [92](../src/plugins/ui/tree.ts:92) | 文案定义／其他 | 插件界面内容过多或格式无效 | <code>throw new PluginError("invalid-argument", "插件界面内容过多或格式无效");</code> |
| [95](../src/plugins/ui/tree.ts:95) | 文案定义／其他 | 插件界面包含不支持的元素 | <code>throw new PluginError("invalid-argument", "插件界面包含不支持的元素");</code> |

<a id="src-preferencespanel-vue"></a>

## src/PreferencesPanel.vue

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [31](../src/PreferencesPanel.vue:31) | 文案定义／其他 | &lt;div class="settings-preview-heading-row"&gt;&lt;h1&gt;标题&lt;/h1&gt;&lt;h2&gt;标题&lt;/h2&gt;&lt;h3&gt;标题&lt;/h3&gt;&lt;h4&gt;标题&lt;/h4&gt;&lt;h5&gt;标题&lt;/h5&gt;&lt;h6&gt;标题&lt;/h6&gt;&lt;/div&gt;<br><br>这是正文预览。中文、English、数字 123，展示当前字体与排版。<br>同一段的下一行保留正常换行。<br><br>这是另一个段落，可查看首行缩进、行高与段落间距。 | <code>}, editorPreviewText: "&lt;div class=\"settings-preview-heading-row\"&gt;&lt;h1&gt;标题&lt;/h1&gt;&lt;h2&gt;标题&lt;/h2&gt;&lt;h3&gt;标题&lt;/h3&gt;&lt;h4&gt;标题&lt;/h4&gt;&lt;h5&gt;标题&lt;/h5&gt;&lt;h6&gt;标题&lt;/h6&gt;&lt;/div&gt;\n\n这是正文预览。中文、English、数字 123，展示当前字体与排版。\n同一段的下一行保留正常换行。\n\n这是另一个段落，可查看首行缩进、行高与段落间距。" ,</code> |
| [32](../src/PreferencesPanel.vue:32) | 文案定义／其他 | ${index + 13} px | <code>fontSizeOptions: Array.from({ length: 12 }, (_, index) =&gt; ({ value: index + 13, label: &#96;${index + 13} px&#96; })),</code> |
| [33](../src/PreferencesPanel.vue:33) | 文案定义／其他 | {0} 倍 | <code>lineHeightOptions: Array.from({ length: 23 }, (_, index) =&gt; { const value = Number((1.3 + index * 0.05).toFixed(2)); return { value, get label() { return t('{0} 倍', { '0': value }) } } }),</code> |
| [34](../src/PreferencesPanel.vue:34) | 文案定义／其他 | ${value} px | <code>paragraphSpacingOptions: Array.from({ length: 49 }, (_, value) =&gt; ({ value, label: &#96;${value} px&#96; })),</code> |
| [35](../src/PreferencesPanel.vue:35) | 文案定义／其他 | ${index / 2} em | <code>indentOptions: Array.from({ length: 7 }, (_, index) =&gt; ({ value: index / 2, label: &#96;${index / 2} em&#96; })),</code> |
| [41](../src/PreferencesPanel.vue:41) | 界面文案 | 偏好设置 | <code>&lt;div v-if="showSettings" class="modal-backdrop" @click.self="showSettings = false"&gt;&lt;div class="settings-modal" role="dialog" aria-modal="true" :aria-label="$t('偏好设置')"&gt;</code> |
| [42](../src/PreferencesPanel.vue:42) | 界面文案 | 设置类别 | <code>&lt;div class="settings-body"&gt;&lt;nav :aria-label="$t('设置类别')"&gt;&lt;button :class="{ active: settingTab === 'appearance' }" @click="settingTab = 'appearance'; loadSystemFon…</code> |
| [42](../src/PreferencesPanel.vue:42) | 界面文案 | 外观 | <code>…settingTab === 'appearance' }" @click="settingTab = 'appearance'; loadSystemFonts()"&gt;&lt;Sun :size="16"/&gt; {{ $t('外观') }}&lt;/button&gt;&lt;button :class="{ active: settingTab === 'layout' }" @click="settingTab = 'layout'"&gt;&lt;LayoutDash…</code> |
| [42](../src/PreferencesPanel.vue:42) | 界面文案 | 布局 | <code>…lass="{ active: settingTab === 'layout' }" @click="settingTab = 'layout'"&gt;&lt;LayoutDashboard :size="16"/&gt; {{ $t('布局') }}&lt;/button&gt;&lt;button :class="{ active: settingTab === 'startup' }" @click="settingTab = 'startup'"&gt;&lt;ArrowUp…</code> |
| [42](../src/PreferencesPanel.vue:42) | 界面文案 | 系统 | <code>…ton :class="{ active: settingTab === 'startup' }" @click="settingTab = 'startup'"&gt;&lt;ArrowUp :size="16"/&gt; {{ $t('系统') }}&lt;/button&gt;&lt;button :class="{ active: settingTab === 'storage' }" @click="settingTab = 'storage'"&gt;&lt;FolderOp…</code> |
| [42](../src/PreferencesPanel.vue:42) | 界面文案 | 存储 | <code>…:class="{ active: settingTab === 'storage' }" @click="settingTab = 'storage'"&gt;&lt;FolderOpen :size="16"/&gt; {{ $t('存储') }}&lt;/button&gt;&lt;button :class="{ active: settingTab === 'sync' }" @click="settingTab = 'sync'"&gt;&lt;Cloud :size="1…</code> |
| [42](../src/PreferencesPanel.vue:42) | 界面文案 | 同步 | <code>…ton&gt;&lt;button :class="{ active: settingTab === 'sync' }" @click="settingTab = 'sync'"&gt;&lt;Cloud :size="16"/&gt; {{ $t('同步') }}&lt;/button&gt;&lt;button :class="{ active: settingTab === 'editor' }" @click="settingTab = 'editor'; loadSystemF…</code> |
| [42](../src/PreferencesPanel.vue:42) | 界面文案 | 编辑器 | <code>…ive: settingTab === 'editor' }" @click="settingTab = 'editor'; loadSystemFonts()"&gt;&lt;PenLine :size="16"/&gt; {{ $t('编辑器') }}&lt;/button&gt;&lt;button :class="{ active: settingTab === 'templates' }" @click="settingTab = 'templates'"&gt;&lt;File…</code> |
| [42](../src/PreferencesPanel.vue:42) | 界面文案 | 模板 | <code>…lass="{ active: settingTab === 'templates' }" @click="settingTab = 'templates'"&gt;&lt;FilePlus2 :size="16"/&gt; {{ $t('模板') }}&lt;/button&gt;&lt;button :class="{ active: settingTab === 'snippets' }" @click="settingTab = 'snippets'"&gt;&lt;ListFi…</code> |
| [42](../src/PreferencesPanel.vue:42) | 界面文案 | 片段 | <code>…class="{ active: settingTab === 'snippets' }" @click="settingTab = 'snippets'"&gt;&lt;ListFilter :size="16"/&gt; {{ $t('片段') }}&lt;/button&gt;&lt;button :class="{ active: settingTab === 'shortcuts' }" @click="settingTab = 'shortcuts'"&gt;&lt;Keyb…</code> |
| [42](../src/PreferencesPanel.vue:42) | 界面文案 | 快捷键 | <code>…class="{ active: settingTab === 'shortcuts' }" @click="settingTab = 'shortcuts'"&gt;&lt;Keyboard :size="16"/&gt; {{ $t('快捷键') }}&lt;/button&gt;&lt;button :class="{ active: settingTab === 'spellcheck' }" @click="settingTab = 'spellcheck'; ref…</code> |
| [42](../src/PreferencesPanel.vue:42) | 界面文案 | 拼写检查 | <code>…'spellcheck' }" @click="settingTab = 'spellcheck'; refreshSpellDictionaries()"&gt;&lt;SpellCheck :size="16"/&gt; {{ $t('拼写检查') }}&lt;/button&gt;&lt;button :class="{ active: settingTab === 'export' }" @click="settingTab = 'export'; loadSystemF…</code> |
| [42](../src/PreferencesPanel.vue:42) | 界面文案 | 导出 | <code>…ive: settingTab === 'export' }" @click="settingTab = 'export'; loadSystemFonts()"&gt;&lt;ArrowUp :size="16"/&gt; {{ $t('导出') }}&lt;/button&gt;&lt;button v-for="category in pluginSettingCategories" :key="category.id" :class="{ active: settin…</code> |
| [42](../src/PreferencesPanel.vue:42) | 界面文案 | 插件 | <code>…tton :class="{ active: settingTab === 'plugins' }" @click="settingTab = 'plugins'"&gt;&lt;Puzzle :size="16"/&gt; {{ $t('插件') }}&lt;/button&gt;&lt;/nav&gt;</code> |
| [43](../src/PreferencesPanel.vue:43) | 界面文案 | 搜索结果 | <code>…=== 'plugins' &amp;&amp; !settingSearch.trim()}"&gt;&lt;div class="settings-section-head"&gt;&lt;h3&gt;{{ settingSearch.trim() ? $t('搜索结果') : settingTab === 'appearance' ? $t('外观与主题') : settingCategoryTitle(settingTab) }}&lt;/h3&gt;&lt;div class="settings…</code> |
| [43](../src/PreferencesPanel.vue:43) | 界面文案 | 外观与主题 | <code>…div class="settings-section-head"&gt;&lt;h3&gt;{{ settingSearch.trim() ? $t('搜索结果') : settingTab === 'appearance' ? $t('外观与主题') : settingCategoryTitle(settingTab) }}&lt;/h3&gt;&lt;div class="settings-search-row"&gt;&lt;Search :size="15"/&gt;&lt;input ref=…</code> |
| [43](../src/PreferencesPanel.vue:43) | 界面文案 | 搜索设置 | <code>…size="15"/&gt;&lt;input ref="settingsSearchInput" v-model="settingSearch" :placeholder="$t('搜索设置')" :aria-label="$t('搜索设置')"/&gt;&lt;/div&gt;&lt;/div&gt;</code> |
| [44](../src/PreferencesPanel.vue:44) | 界面文案 | 未找到匹配设置，请换个关键词 | <code>…goryTitle(item.tab) }}&lt;/small&gt;&lt;ChevronRight :size="15"/&gt;&lt;/button&gt;&lt;p v-if="!settingSearchResults.length"&gt;{{ $t('未找到匹配设置，请换个关键词') }}&lt;/p&gt;&lt;/div&gt;&lt;/template&gt;</code> |
| [48](../src/PreferencesPanel.vue:48) | 界面文案 | 主题 | <code>&lt;div v-if="settingVisible('主题')" class="setting-item"&gt;&lt;div&gt;&lt;strong&gt;{{ $t('主题') }}&lt;/strong&gt;&lt;/div&gt;&lt;/div&gt;</code> |
| [49](../src/PreferencesPanel.vue:49) | 界面文案 | 主题 | <code>&lt;ThemeCards v-if="settingVisible('主题')" v-model="themeNameInput" :themes="allThemes" @remove="removeTheme" @add="addTheme"/&gt;</code> |
| [50](../src/PreferencesPanel.vue:50) | 界面文案 | UI 字体 | <code>&lt;FontPicker v-model="uiFontFamily" :fonts="systemFonts" :loading="fontsLoading" :label="$t('UI 字体')" @open="loadSystemFonts" @preview="uiFontPreview = $event"/&gt;</code> |
| [51](../src/PreferencesPanel.vue:51) | 界面文案 | 界面缩放 | <code>&lt;div v-if="settingVisible('界面缩放')" class="setting-row"&gt;{{ $t('界面缩放') }} &lt;SettingSelect v-model="zoomInput" :label="$t('界面缩放')" :options="zoomOptions.map((value: number) =&gt; ({ value, label: &#96;${value}%&#96; }))"/&gt;&lt;/div&gt;</code> |
| [51](../src/PreferencesPanel.vue:51) | 界面文案 | ${value}% | <code>&lt;div v-if="settingVisible('界面缩放')" class="setting-row"&gt;{{ $t('界面缩放') }} &lt;SettingSelect v-model="zoomInput" :label="$t('界面缩放')" :options="zoomOptions.map((value: number) =&gt; ({ value, label: &#96;${value}%&#96; }))"/&gt;&lt;/div&gt;</code> |
| [52](../src/PreferencesPanel.vue:52) | 界面文案 | 文件操作栏常驻 | <code>&lt;div v-if="settingVisible('文件操作栏常驻')" class="setting-row"&gt;{{ $t('文件操作栏常驻') }} &lt;input :aria-label="$t('文件操作栏常驻')" v-model="fileActionsAlwaysVisible" type="checkbox"/&gt;&lt;/div&gt;</code> |
| [53](../src/PreferencesPanel.vue:53) | 界面文案 | 显示侧栏 | <code>&lt;div class="setting-row"&gt;{{ $t('显示侧栏') }} &lt;input :aria-label="$t('显示侧栏')" v-model="sidebarOpenInput" type="checkbox"/&gt;&lt;/div&gt;</code> |
| [56](../src/PreferencesPanel.vue:56) | 界面文案 | 语言 | <code>&lt;div class="setting-row"&gt;{{ $t('语言') }}&lt;SettingSelect v-model="language" :label="$t('语言')" :options="localeOptions.map((option: any) =&gt; ({ ...option, label: $t(option.label) }))"/&gt;&lt;/div&gt;</code> |
| [57](../src/PreferencesPanel.vue:57) | 界面文案 | 启动时 | <code>&lt;div class="setting-row"&gt;{{ $t('启动时') }} &lt;SettingSelect v-model="startupBehavior" :label="$t('启动时')" :options="[{ value: 'restore', label: $t('打开上次目录和文件') }, { value: 'blank', label: $t('新建未命名文件') }]"/&gt;&lt;/div&gt;</code> |
| [57](../src/PreferencesPanel.vue:57) | 界面文案 | 打开上次目录和文件 | <code>&lt;div class="setting-row"&gt;{{ $t('启动时') }} &lt;SettingSelect v-model="startupBehavior" :label="$t('启动时')" :options="[{ value: 'restore', label: $t('打开上次目录和文件') }, { value: 'blank', label: $t('新建未命名文件') }]"/&gt;&lt;/div&gt;</code> |
| [57](../src/PreferencesPanel.vue:57) | 界面文案 | 新建未命名文件 | <code>&lt;div class="setting-row"&gt;{{ $t('启动时') }} &lt;SettingSelect v-model="startupBehavior" :label="$t('启动时')" :options="[{ value: 'restore', label: $t('打开上次目录和文件') }, { value: 'blank', label: $t('新建未命名文件') }]"/&gt;&lt;/div&gt;</code> |
| [58](../src/PreferencesPanel.vue:58) | 界面文案 | 默认编辑器 | <code>&lt;div class="setting-row"&gt;{{ $t('默认编辑器') }}&lt;button :disabled="defaultEditorBusy" @click="setDefaultEditor"&gt;{{ defaultEditorBusy ? $t('正在设置…') : $t('设为默认编辑器') }}&lt;/button&gt;&lt;/div&gt;</code> |
| [58](../src/PreferencesPanel.vue:58) | 界面文案 | 正在设置… | <code>&lt;div class="setting-row"&gt;{{ $t('默认编辑器') }}&lt;button :disabled="defaultEditorBusy" @click="setDefaultEditor"&gt;{{ defaultEditorBusy ? $t('正在设置…') : $t('设为默认编辑器') }}&lt;/button&gt;&lt;/div&gt;</code> |
| [58](../src/PreferencesPanel.vue:58) | 界面文案 | 设为默认编辑器 | <code>&lt;div class="setting-row"&gt;{{ $t('默认编辑器') }}&lt;button :disabled="defaultEditorBusy" @click="setDefaultEditor"&gt;{{ defaultEditorBusy ? $t('正在设置…') : $t('设为默认编辑器') }}&lt;/button&gt;&lt;/div&gt;</code> |
| [59](../src/PreferencesPanel.vue:59) | 界面文案 | 自动检测更新 | <code>&lt;div class="setting-row"&gt;{{ $t('自动检测更新') }} &lt;input :aria-label="$t('自动检测更新')" v-model="autoCheckUpdates" type="checkbox"/&gt;&lt;/div&gt;</code> |
| [60](../src/PreferencesPanel.vue:60) | 界面文案 | 恢复默认设置 | <code>&lt;div class="setting-row settings-reset-row"&gt;{{ $t('恢复默认设置') }}&lt;button @click="resetAllSettings"&gt;{{ $t('全部恢复默认') }}&lt;/button&gt;&lt;/div&gt;</code> |
| [60](../src/PreferencesPanel.vue:60) | 界面文案 | 全部恢复默认 | <code>&lt;div class="setting-row settings-reset-row"&gt;{{ $t('恢复默认设置') }}&lt;button @click="resetAllSettings"&gt;{{ $t('全部恢复默认') }}&lt;/button&gt;&lt;/div&gt;</code> |
| [63](../src/PreferencesPanel.vue:63) | 界面文案 | 图片附件目录 | <code>&lt;div class="setting-row"&gt;{{ $t('图片附件目录') }} &lt;input :aria-label="$t('图片附件目录')" v-model.trim="attachmentDirectoryInput" type="text" placeholder="assets"/&gt;&lt;/div&gt;</code> |
| [63](../src/PreferencesPanel.vue:63) | 界面文案 | assets | <code>&lt;div class="setting-row"&gt;{{ $t('图片附件目录') }} &lt;input :aria-label="$t('图片附件目录')" v-model.trim="attachmentDirectoryInput" type="text" placeholder="assets"/&gt;&lt;/div&gt;</code> |
| [64](../src/PreferencesPanel.vue:64) | 界面文案 | 剪贴板图片目录 | <code>&lt;div class="setting-row"&gt;{{ $t('剪贴板图片目录') }} &lt;input :aria-label="$t('剪贴板图片目录')" v-model.trim="clipboardDirectory" type="text" placeholder="assets/clipboard"/&gt;&lt;/div&gt;</code> |
| [64](../src/PreferencesPanel.vue:64) | 界面文案 | assets/clipboard | <code>&lt;div class="setting-row"&gt;{{ $t('剪贴板图片目录') }} &lt;input :aria-label="$t('剪贴板图片目录')" v-model.trim="clipboardDirectory" type="text" placeholder="assets/clipboard"/&gt;&lt;/div&gt;</code> |
| [65](../src/PreferencesPanel.vue:65) | 界面文案 | 图片文件命名 | <code>…&lt;div class="setting-row setting-row-borderless image-naming-row"&gt;&lt;label for="attachment-naming"&gt;{{ $t('图片文件命名') }}&lt;/label&gt;&lt;div class="image-naming-controls"&gt;&lt;input id="attachment-naming" v-model.trim="attachmentNaming"…</code> |
| [65](../src/PreferencesPanel.vue:65) | 界面文案 | pasted-image-{date}-{time} | <code>…"image-naming-controls"&gt;&lt;input id="attachment-naming" v-model.trim="attachmentNaming" type="text" placeholder="pasted-image-{date}-{time}" aria-describedby="attachment-naming-variables"/&gt;&lt;small id="attachment-naming-variables"&gt;{{ $t('命名变量：{date}、…</code> |
| [65](../src/PreferencesPanel.vue:65) | 界面文案 | 命名变量：{date}、{time}、{timestamp}、{uuid} | <code>…-{date}-{time}" aria-describedby="attachment-naming-variables"/&gt;&lt;small id="attachment-naming-variables"&gt;{{ $t('命名变量：{date}、{time}、{timestamp}、{uuid}') }}&lt;/small&gt;&lt;/div&gt;&lt;/div&gt;</code> |
| [66](../src/PreferencesPanel.vue:66) | 界面文案 | 打开附件目录 | <code>&lt;div class="storage-actions"&gt;&lt;button @click="openStorageDirectory(attachmentDirectoryInput)"&gt;{{ $t('打开附件目录') }}&lt;/button&gt;&lt;button @click="openStorageDirectory(clipboardDirectory)"&gt;{{ $t('打开剪贴板图片目录') }}&lt;/button&gt;&lt;/div&gt;</code> |
| [66](../src/PreferencesPanel.vue:66) | 界面文案 | 打开剪贴板图片目录 | <code>&lt;div class="storage-actions"&gt;&lt;button @click="openStorageDirectory(attachmentDirectoryInput)"&gt;{{ $t('打开附件目录') }}&lt;/button&gt;&lt;button @click="openStorageDirectory(clipboardDirectory)"&gt;{{ $t('打开剪贴板图片目录') }}&lt;/button&gt;&lt;/div&gt;</code> |
| [67](../src/PreferencesPanel.vue:67) | 界面文案 | 历史版本 | <code>&lt;section class="storage-subsection"&gt;&lt;h4&gt;{{ $t('历史版本') }}&lt;/h4&gt;</code> |
| [69](../src/PreferencesPanel.vue:69) | 界面文案 | 启用历史版本 | <code>&lt;div class="setting-row setting-row-borderless"&gt;{{ $t('启用历史版本') }} &lt;input :aria-label="$t('启用历史版本')" v-model="gitEnabled" type="checkbox" :disabled="!gitAvailable &amp;&amp; !gitEnabled"/&gt;&lt;/div&gt;</code> |
| [72](../src/PreferencesPanel.vue:72) | 界面文案 | 每个文件保留版本数 | <code>&lt;div class="setting-row"&gt;{{ $t('每个文件保留版本数') }} &lt;input :aria-label="$t('每个文件保留版本数')" v-model.number="gitMaxVersions" type="number" min="1" max="200"/&gt;&lt;/div&gt;</code> |
| [73](../src/PreferencesPanel.vue:73) | 界面文案 | 版本保留天数 | <code>&lt;div class="setting-row"&gt;{{ $t('版本保留天数') }}&lt;small&gt;{{ $t('设为 0 时不自动清理') }}&lt;/small&gt; &lt;input :aria-label="$t('版本保留天数')" v-model.number="gitRetentionDays" type="number" min="0" max="3650"/&gt;&lt;/div&gt;</code> |
| [73](../src/PreferencesPanel.vue:73) | 界面文案 | 设为 0 时不自动清理 | <code>&lt;div class="setting-row"&gt;{{ $t('版本保留天数') }}&lt;small&gt;{{ $t('设为 0 时不自动清理') }}&lt;/small&gt; &lt;input :aria-label="$t('版本保留天数')" v-model.number="gitRetentionDays" type="number" min="0" max="3650"/&gt;&lt;/div&gt;</code> |
| [74](../src/PreferencesPanel.vue:74) | 界面文案 | 上次备份失败： | <code>&lt;p v-if="lastGitFailure" class="git-error"&gt;{{ $t('上次备份失败：') }}{{ lastGitFailure }}&lt;/p&gt;</code> |
| [79](../src/PreferencesPanel.vue:79) | 界面文案 | 自动同步 | <code>&lt;div class="setting-row sync-auto-row"&gt;{{ $t('自动同步') }} &lt;input :aria-label="$t('自动同步')" v-model="autoSyncEnabled" type="checkbox"/&gt;&lt;/div&gt;</code> |
| [80](../src/PreferencesPanel.vue:80) | 界面文案 | 冲突处理 | <code>…使用远端版本，覆盖本地修改。') : $t('自动合并双方修改；无法合并时保留两份。') }}&lt;/small&gt;&lt;SettingSelect v-model="syncConflictPolicy" :label="$t('冲突处理')" :options="[{ value: 'merge', label: $t('自动合并') }, { value: 'remote', label: $t('远端优先') }]"/&gt;&lt;/div&gt;</code> |
| [80](../src/PreferencesPanel.vue:80) | 界面文案 | 双方都修改时，使用远端版本，覆盖本地修改。 | <code>…nflict-row"&gt;{{ $t('冲突处理') }} &lt;small class="sync-conflict-description"&gt;{{ syncConflictPolicy === 'remote' ? $t('双方都修改时，使用远端版本，覆盖本地修改。') : $t('自动合并双方修改；无法合并时保留两份。') }}&lt;/small&gt;&lt;SettingSelect v-model="syncConflictPolicy" :label="$t('冲突处理')" :opt…</code> |
| [80](../src/PreferencesPanel.vue:80) | 界面文案 | 自动合并双方修改；无法合并时保留两份。 | <code>…small class="sync-conflict-description"&gt;{{ syncConflictPolicy === 'remote' ? $t('双方都修改时，使用远端版本，覆盖本地修改。') : $t('自动合并双方修改；无法合并时保留两份。') }}&lt;/small&gt;&lt;SettingSelect v-model="syncConflictPolicy" :label="$t('冲突处理')" :options="[{ value: 'merge', lab…</code> |
| [80](../src/PreferencesPanel.vue:80) | 界面文案 | 自动合并 | <code>…/small&gt;&lt;SettingSelect v-model="syncConflictPolicy" :label="$t('冲突处理')" :options="[{ value: 'merge', label: $t('自动合并') }, { value: 'remote', label: $t('远端优先') }]"/&gt;&lt;/div&gt;</code> |
| [80](../src/PreferencesPanel.vue:80) | 界面文案 | 远端优先 | <code>…ictPolicy" :label="$t('冲突处理')" :options="[{ value: 'merge', label: $t('自动合并') }, { value: 'remote', label: $t('远端优先') }]"/&gt;&lt;/div&gt;</code> |
| [81](../src/PreferencesPanel.vue:81) | 界面文案 | GitHub | <code>&lt;section class="storage-subsection"&gt;&lt;h4&gt;GitHub&lt;/h4&gt;</code> |
| [82](../src/PreferencesPanel.vue:82) | 界面文案 | GitHub 账号 | <code>&lt;div class="setting-row sync-auth-row sync-credential-row"&gt;&lt;span&gt;{{ githubHasToken ? $t('GitHub 账号') : $t('访问令牌') }}&lt;/span&gt;&lt;span class="sync-auth-controls"&gt;&lt;span v-if="githubHasToken" class="sync-account-nam…</code> |
| [82](../src/PreferencesPanel.vue:82) | 界面文案 | 访问令牌 | <code>…&lt;div class="setting-row sync-auth-row sync-credential-row"&gt;&lt;span&gt;{{ githubHasToken ? $t('GitHub 账号') : $t('访问令牌') }}&lt;/span&gt;&lt;span class="sync-auth-controls"&gt;&lt;span v-if="githubHasToken" class="sync-account-name" :title="gi…</code> |
| [82](../src/PreferencesPanel.vue:82) | 界面文案 | 已登录 GitHub | <code>…v-if="githubHasToken" class="sync-account-name" :title="githubUsername &#124;&#124; '已登录 GitHub'"&gt;{{ githubUsername &#124;&#124; '已登录 GitHub' }}&lt;/span&gt;&lt;input v-else v-model="githubTokenDraft" type="password" placeholder="GitHub Personal Access Token…</code> |
| [82](../src/PreferencesPanel.vue:82) | 界面文案 | GitHub Personal Access Token | <code>…githubUsername &#124;&#124; '已登录 GitHub' }}&lt;/span&gt;&lt;input v-else v-model="githubTokenDraft" type="password" placeholder="GitHub Personal Access Token" :aria-label="$t('GitHub 访问令牌')" autocomplete="new-password" @keyup.enter="storeGithubToken"/&gt;&lt;/span&gt;&lt;/div&gt;&lt;…</code> |
| [82](../src/PreferencesPanel.vue:82) | 界面文案 | GitHub 访问令牌 | <code>…v-else v-model="githubTokenDraft" type="password" placeholder="GitHub Personal Access Token" :aria-label="$t('GitHub 访问令牌')" autocomplete="new-password" @keyup.enter="storeGithubToken"/&gt;&lt;/span&gt;&lt;/div&gt;&lt;div class="sync-auth-actions"&gt;…</code> |
| [82](../src/PreferencesPanel.vue:82) | 界面文案 | 退出登录 | <code>…h-actions"&gt;&lt;button v-if="githubHasToken" :disabled="githubBusy &#124;&#124; githubRepoBusy" @click="logoutGithub"&gt;{{ $t('退出登录') }}&lt;/button&gt;&lt;button v-else :disabled="!githubTokenDraft" @click="storeGithubToken"&gt;{{ $t('登录') }}&lt;/button&gt;&lt;…</code> |
| [82](../src/PreferencesPanel.vue:82) | 界面文案 | 登录 | <code>…Github"&gt;{{ $t('退出登录') }}&lt;/button&gt;&lt;button v-else :disabled="!githubTokenDraft" @click="storeGithubToken"&gt;{{ $t('登录') }}&lt;/button&gt;&lt;/div&gt;</code> |
| [83](../src/PreferencesPanel.vue:83) | 界面文案 | 同步间隔 | <code>…nabled"&gt;&lt;div class="setting-row"&gt;{{ $t('同步间隔') }} &lt;span class="setting-number-control"&gt;&lt;input :aria-label="$t('同步间隔')" v-model.number="githubSyncIntervalSeconds" type="number" min="10" max="3600" step="1"/&gt; {{ $t('秒') }}&lt;/sp…</code> |
| [83](../src/PreferencesPanel.vue:83) | 界面文案 | 秒 | <code>…el="$t('同步间隔')" v-model.number="githubSyncIntervalSeconds" type="number" min="10" max="3600" step="1"/&gt; {{ $t('秒') }}&lt;/span&gt;&lt;/div&gt;&lt;div class="setting-row"&gt;{{ $t('失败后自动重试') }} &lt;input :aria-label="$t('失败后自动重试')" v-model="gi…</code> |
| [83](../src/PreferencesPanel.vue:83) | 界面文案 | 失败后自动重试 | <code>…600" step="1"/&gt; {{ $t('秒') }}&lt;/span&gt;&lt;/div&gt;&lt;div class="setting-row"&gt;{{ $t('失败后自动重试') }} &lt;input :aria-label="$t('失败后自动重试')" v-model="githubRetryOnFailure" type="checkbox"/&gt;&lt;/div&gt;&lt;/template&gt;</code> |
| [85](../src/PreferencesPanel.vue:85) | 界面文案 | WebDAV | <code>&lt;section class="storage-subsection"&gt;&lt;h4&gt;WebDAV&lt;/h4&gt;</code> |
| [86](../src/PreferencesPanel.vue:86) | 界面文案 | 服务器地址 | <code>…if="!webdavHasPassword"&gt;&lt;div class="setting-row sync-credential-row"&gt;{{ $t('服务器地址') }} &lt;input :aria-label="$t('服务器地址')" v-model.trim="webdavUrl" type="url" placeholder="https://example.com/dav/" autocomplete="url"/&gt;&lt;/div&gt;&lt;div…</code> |
| [86](../src/PreferencesPanel.vue:86) | 界面文案 | https://example.com/dav/ | <code>…ntial-row"&gt;{{ $t('服务器地址') }} &lt;input :aria-label="$t('服务器地址')" v-model.trim="webdavUrl" type="url" placeholder="https://example.com/dav/" autocomplete="url"/&gt;&lt;/div&gt;&lt;div class="setting-row sync-credential-row"&gt;{{ $t('用户名') }} &lt;input :aria-label="…</code> |
| [86](../src/PreferencesPanel.vue:86) | 界面文案 | 用户名 | <code>…autocomplete="url"/&gt;&lt;/div&gt;&lt;div class="setting-row sync-credential-row"&gt;{{ $t('用户名') }} &lt;input :aria-label="$t('用户名')" v-model.trim="webdavUsername" type="text" autocomplete="username"/&gt;&lt;/div&gt;&lt;/template&gt;</code> |
| [87](../src/PreferencesPanel.vue:87) | 界面文案 | WebDAV 账号 | <code>&lt;div class="setting-row sync-auth-row sync-credential-row"&gt;&lt;span&gt;{{ webdavHasPassword ? $t('WebDAV 账号') : $t('密码') }}&lt;/span&gt;&lt;span class="sync-auth-controls"&gt;&lt;span v-if="webdavHasPassword" class="sync-account-na…</code> |
| [87](../src/PreferencesPanel.vue:87) | 界面文案 | 密码 | <code>…&lt;div class="setting-row sync-auth-row sync-credential-row"&gt;&lt;span&gt;{{ webdavHasPassword ? $t('WebDAV 账号') : $t('密码') }}&lt;/span&gt;&lt;span class="sync-auth-controls"&gt;&lt;span v-if="webdavHasPassword" class="sync-account-name" :title=…</code> |
| [87](../src/PreferencesPanel.vue:87) | 界面文案 | 输入密码或应用密码 | <code>…name"&gt;{{ webdavUsername }}&lt;/span&gt;&lt;input v-else v-model="webdavPasswordDraft" type="password" :placeholder="$t('输入密码或应用密码')" :aria-label="$t('WebDAV 密码或应用密码')" autocomplete="new-password" @keyup.enter="storeWebdavPassword"/&gt;&lt;/span…</code> |
| [87](../src/PreferencesPanel.vue:87) | 界面文案 | WebDAV 密码或应用密码 | <code>…an&gt;&lt;input v-else v-model="webdavPasswordDraft" type="password" :placeholder="$t('输入密码或应用密码')" :aria-label="$t('WebDAV 密码或应用密码')" autocomplete="new-password" @keyup.enter="storeWebdavPassword"/&gt;&lt;/span&gt;&lt;/div&gt;&lt;div class="sync-auth-action…</code> |
| [87](../src/PreferencesPanel.vue:87) | 界面文案 | 退出登录 | <code>…ons"&gt;&lt;button v-if="webdavHasPassword" :disabled="webdavBusy &#124;&#124; webdavBindingBusy" @click="logoutWebdav"&gt;{{ $t('退出登录') }}&lt;/button&gt;&lt;button v-else :disabled="!webdavUrl &#124;&#124; !webdavUsername &#124;&#124; !webdavPasswordDraft" @click="storeW…</code> |
| [87](../src/PreferencesPanel.vue:87) | 界面文案 | 登录 | <code>…n v-else :disabled="!webdavUrl &#124;&#124; !webdavUsername &#124;&#124; !webdavPasswordDraft" @click="storeWebdavPassword"&gt;{{ $t('登录') }}&lt;/button&gt;&lt;/div&gt;</code> |
| [88](../src/PreferencesPanel.vue:88) | 界面文案 | 同步间隔 | <code>…nabled"&gt;&lt;div class="setting-row"&gt;{{ $t('同步间隔') }} &lt;span class="setting-number-control"&gt;&lt;input :aria-label="$t('同步间隔')" v-model.number="webdavSyncIntervalSeconds" type="number" min="10" max="3600" step="1"/&gt; {{ $t('秒') }}&lt;/sp…</code> |
| [88](../src/PreferencesPanel.vue:88) | 界面文案 | 秒 | <code>…el="$t('同步间隔')" v-model.number="webdavSyncIntervalSeconds" type="number" min="10" max="3600" step="1"/&gt; {{ $t('秒') }}&lt;/span&gt;&lt;/div&gt;&lt;div class="setting-row"&gt;{{ $t('失败后自动重试') }} &lt;input :aria-label="$t('失败后自动重试')" v-model="we…</code> |
| [88](../src/PreferencesPanel.vue:88) | 界面文案 | 失败后自动重试 | <code>…600" step="1"/&gt; {{ $t('秒') }}&lt;/span&gt;&lt;/div&gt;&lt;div class="setting-row"&gt;{{ $t('失败后自动重试') }} &lt;input :aria-label="$t('失败后自动重试')" v-model="webdavRetryOnFailure" type="checkbox"/&gt;&lt;/div&gt;&lt;/template&gt;</code> |
| [92](../src/PreferencesPanel.vue:92) | 界面文案 | 编辑器字体 | <code>…&lt;FontPicker v-model="editorFontFamilyInput" :fonts="systemFonts" :loading="fontsLoading" :label="$t('编辑器字体')" @open="loadSystemFonts" @preview="editorFontPreview = $event"&gt;&lt;template #preview&gt;&lt;div class="settings-edi…</code> |
| [92](../src/PreferencesPanel.vue:92) | 界面文案 | 正文排版预览 | <code>…aragraphSpacing}px&#96; }" :class="{ 'settings-preview-centered': editorAlignment === 'center' }" :aria-label="$t('正文排版预览')"&gt;&lt;CodeEditor :body-line-numbers="bodyLineNumbers" :model-value="editorPreviewText" doc-id="settings-editor…</code> |
| [92](../src/PreferencesPanel.vue:92) | 界面文案 | 正文字号 | <code>…settingVisible('正文字号')" class="setting-row"&gt;{{ $t('正文字号') }}&lt;SettingSelect v-model="fontSizeInput" :label="$t('正文字号')" :options="fontSizeOptions" @preview="previewEditorLayout('fontSize', $event)"/&gt;&lt;/div&gt;</code> |
| [93](../src/PreferencesPanel.vue:93) | 界面文案 | 行高 | <code>&lt;div v-if="settingVisible('行高')" class="setting-row"&gt;{{ $t('行高') }}&lt;SettingSelect v-model="lineHeightInput" :label="$t('行高')" :options="lineHeightOptions" @preview="previewEditorLayout('lineHeight', $event)"/&gt;&lt;/div&gt;</code> |
| [94](../src/PreferencesPanel.vue:94) | 界面文案 | 段落间距 | <code>&lt;div v-if="settingVisible('段落间距')" class="setting-row"&gt;{{ $t('段落间距') }}&lt;SettingSelect v-model="paragraphSpacing" :label="$t('段落间距')" :options="paragraphSpacingOptions" @preview="previewEditorLayout('paragraphSpacing', $event)"/&gt;&lt;/div&gt;</code> |
| [95](../src/PreferencesPanel.vue:95) | 界面文案 | 首行缩进 | <code>&lt;div v-if="settingVisible('首行缩进')" class="setting-row"&gt;{{ $t('首行缩进') }}&lt;SettingSelect v-model="indentInput" :label="$t('首行缩进')" :options="indentOptions" @preview="previewEditorLayout('indent', $event)"/&gt;&lt;/div&gt;</code> |
| [96](../src/PreferencesPanel.vue:96) | 界面文案 | 正文布局 | <code>…class="setting-row-title"&gt;{{ $t('正文布局') }}&lt;/span&gt;&lt;div class="setting-segmented" role="group" :aria-label="$t('正文布局')"&gt;&lt;button type="button" :class="{ active: editorAlignment === 'left' }" :aria-pressed="editorAlignment ===…</code> |
| [96](../src/PreferencesPanel.vue:96) | 界面文案 | 铺满 | <code>…torAlignment === 'left' }" :aria-pressed="editorAlignment === 'left'" @click="editorAlignment = 'left'"&gt;{{ $t('铺满') }}&lt;/button&gt;&lt;button type="button" :class="{ active: editorAlignment === 'center' }" :aria-pressed="editorAl…</code> |
| [96](../src/PreferencesPanel.vue:96) | 界面文案 | 居中 | <code>…gnment === 'center' }" :aria-pressed="editorAlignment === 'center'" @click="editorAlignment = 'center'"&gt;{{ $t('居中') }}&lt;/button&gt;&lt;/div&gt;&lt;/div&gt;</code> |
| [97](../src/PreferencesPanel.vue:97) | 界面文案 | 表格宽度 | <code>…class="setting-row-title"&gt;{{ $t('表格宽度') }}&lt;/span&gt;&lt;div class="setting-segmented" role="group" :aria-label="$t('表格宽度')"&gt;&lt;button type="button" :class="{ active: tableWidth === 'full' }" :aria-pressed="tableWidth === 'full'" @c…</code> |
| [97](../src/PreferencesPanel.vue:97) | 界面文案 | 铺满 | <code>…="{ active: tableWidth === 'full' }" :aria-pressed="tableWidth === 'full'" @click="tableWidth = 'full'"&gt;{{ $t('铺满') }}&lt;/button&gt;&lt;button type="button" :class="{ active: tableWidth === 'content' }" :aria-pressed="tableWidth =…</code> |
| [97](../src/PreferencesPanel.vue:97) | 界面文案 | 内容自适应 | <code>…e: tableWidth === 'content' }" :aria-pressed="tableWidth === 'content'" @click="tableWidth = 'content'"&gt;{{ $t('内容自适应') }}&lt;/button&gt;&lt;/div&gt;&lt;/div&gt;</code> |
| [98](../src/PreferencesPanel.vue:98) | 界面文案 | 自动换行 | <code>&lt;div v-if="settingVisible('自动换行')" class="setting-row"&gt;{{ $t('自动换行') }} &lt;input :aria-label="$t('自动换行')" v-model="wrapLinesInput" type="checkbox"/&gt;&lt;/div&gt;</code> |
| [99](../src/PreferencesPanel.vue:99) | 界面文案 | 显示正文行号 | <code>&lt;div v-if="settingVisible('显示正文行号')" class="setting-row"&gt;{{ $t('显示正文行号') }} &lt;input :aria-label="$t('显示正文行号')" v-model="bodyLineNumbers" type="checkbox"/&gt;&lt;/div&gt;</code> |
| [100](../src/PreferencesPanel.vue:100) | 界面文案 | 代码、图表与公式行号 | <code>&lt;div v-if="settingVisible('代码、图表与公式行号')" class="setting-row"&gt;{{ $t('代码、图表与公式行号') }} &lt;input :aria-label="$t('代码、图表与公式行号')" v-model="codeBlockLineNumbers" type="checkbox"/&gt;&lt;/div&gt;</code> |
| [101](../src/PreferencesPanel.vue:101) | 界面文案 | 图表可视化编辑 | <code>&lt;div v-if="settingVisible('图表可视化编辑')" class="setting-row"&gt;{{ $t('图表可视化编辑') }} &lt;input :aria-label="$t('图表可视化编辑')" v-model="diagramVisualEditing" type="checkbox"/&gt;&lt;/div&gt;</code> |
| [102](../src/PreferencesPanel.vue:102) | 界面文案 | 外部文件修改 | <code>…lass="setting-row-title"&gt;{{ $t('外部文件修改') }}&lt;/span&gt;&lt;div class="setting-segmented" role="group" :aria-label="$t('外部文件修改')"&gt;&lt;button type="button" :class="{ active: externalFileChanges === 'auto' }" :aria-pressed="externalFileChan…</code> |
| [102](../src/PreferencesPanel.vue:102) | 界面文案 | 自动加载 | <code>…nges === 'auto' }" :aria-pressed="externalFileChanges === 'auto'" @click="externalFileChanges = 'auto'"&gt;{{ $t('自动加载') }}&lt;/button&gt;&lt;button type="button" :class="{ active: externalFileChanges === 'confirm' }" :aria-pressed="ext…</code> |
| [102](../src/PreferencesPanel.vue:102) | 界面文案 | 弹窗确认 | <code>…'confirm' }" :aria-pressed="externalFileChanges === 'confirm'" @click="externalFileChanges = 'confirm'"&gt;{{ $t('弹窗确认') }}&lt;/button&gt;&lt;/div&gt;&lt;/div&gt;</code> |
| [105](../src/PreferencesPanel.vue:105) | 界面文案 | 用于创建新文件。变量支持文件名和内容。 | <code>&lt;p class="workflow-settings-intro"&gt;{{ settingTab === 'templates' ? $t('用于创建新文件。变量支持文件名和内容。') : $t('用于插入片段') }}&lt;/p&gt;</code> |
| [105](../src/PreferencesPanel.vue:105) | 界面文案 | 用于插入片段 | <code>&lt;p class="workflow-settings-intro"&gt;{{ settingTab === 'templates' ? $t('用于创建新文件。变量支持文件名和内容。') : $t('用于插入片段') }}&lt;/p&gt;</code> |
| [106](../src/PreferencesPanel.vue:106) | 界面文案 | · | <code>…ersonalId" @mousedown.prevent @click="insertTemplateVariable(variable.key)"&gt;{{ variableSyntax(variable.key) }} · {{ $t(variable.label) }}&lt;/button&gt;&lt;/div&gt;</code> |
| [111](../src/PreferencesPanel.vue:111) | 界面文案 | 重命名${item.name} | <code>…ut v-if="personalRenamingId === item.id" ref="personalRenameInput" v-model="personalRenameDraft" :aria-label="&#96;重命名${item.name}&#96;" maxlength="80" @click.stop @keydown.enter.prevent="commitPersonalRename" @keydown.esc.prevent="personalRen…</code> |
| [112](../src/PreferencesPanel.vue:112) | 界面文案 | 编辑${item.name} | <code>&lt;button v-else :title="&#96;编辑${item.name}&#96;" @click="startPersonalRename(item)"&gt;{{ item.name }}&lt;/button&gt;</code> |
| [114](../src/PreferencesPanel.vue:114) | 界面文案 | 还未添加 | <code>&lt;p v-if="!personalItems.length" class="personal-list-empty"&gt;{{ $t('还未添加') }}{{ settingTab === 'templates' ? $t('模板') : $t('片段') }}{{ $t('，点击下方 + 新建。') }}&lt;/p&gt;</code> |
| [114](../src/PreferencesPanel.vue:114) | 界面文案 | 模板 | <code>&lt;p v-if="!personalItems.length" class="personal-list-empty"&gt;{{ $t('还未添加') }}{{ settingTab === 'templates' ? $t('模板') : $t('片段') }}{{ $t('，点击下方 + 新建。') }}&lt;/p&gt;</code> |
| [114](../src/PreferencesPanel.vue:114) | 界面文案 | 片段 | <code>&lt;p v-if="!personalItems.length" class="personal-list-empty"&gt;{{ $t('还未添加') }}{{ settingTab === 'templates' ? $t('模板') : $t('片段') }}{{ $t('，点击下方 + 新建。') }}&lt;/p&gt;</code> |
| [114](../src/PreferencesPanel.vue:114) | 界面文案 | ，点击下方 + 新建。 | <code>&lt;p v-if="!personalItems.length" class="personal-list-empty"&gt;{{ $t('还未添加') }}{{ settingTab === 'templates' ? $t('模板') : $t('片段') }}{{ $t('，点击下方 + 新建。') }}&lt;/p&gt;</code> |
| [116](../src/PreferencesPanel.vue:116) | 界面文案 | 新建${settingTab === 'templates' ? $t('模板') : $t('片段')} | <code>&lt;div class="personal-list-actions"&gt;&lt;button :aria-label="&#96;新建${settingTab === 'templates' ? $t('模板') : $t('片段')}&#96;" :title="$t('新建')" @click="addPersonalItem"&gt;&lt;Plus :size="16"/&gt;&lt;/button&gt;&lt;button :disabled="!selectedPersonal…</code> |
| [116](../src/PreferencesPanel.vue:116) | 界面文案 | 新建 | <code>…rsonal-list-actions"&gt;&lt;button :aria-label="&#96;新建${settingTab === 'templates' ? $t('模板') : $t('片段')}&#96;" :title="$t('新建')" @click="addPersonalItem"&gt;&lt;Plus :size="16"/&gt;&lt;/button&gt;&lt;button :disabled="!selectedPersonalId" :aria-label="…</code> |
| [116](../src/PreferencesPanel.vue:116) | 界面文案 | 删除选中的${settingTab === 'templates' ? $t('模板') : $t('片段')} | <code>…建')" @click="addPersonalItem"&gt;&lt;Plus :size="16"/&gt;&lt;/button&gt;&lt;button :disabled="!selectedPersonalId" :aria-label="&#96;删除选中的${settingTab === 'templates' ? $t('模板') : $t('片段')}&#96;" :title="$t('删除选中项')" @click="removePersonalItem(personalItems.find((item: any) =&gt; item.id === selectedPers…</code> |
| [116](../src/PreferencesPanel.vue:116) | 界面文案 | 删除选中项 | <code>…led="!selectedPersonalId" :aria-label="&#96;删除选中的${settingTab === 'templates' ? $t('模板') : $t('片段')}&#96;" :title="$t('删除选中项')" @click="removePersonalItem(personalItems.find((item: any) =&gt; item.id === selectedPersonalId)!)"&gt;&lt;Minus :s…</code> |
| [118](../src/PreferencesPanel.vue:118) | 界面文案 | 内容 | <code>…v class="personal-item-editor"&gt;&lt;textarea ref="personalContentInput" v-model="personalContent" :aria-label="$t('内容')" :disabled="!selectedPersonalId" :placeholder="selectedPersonalId ? settingTab === 'templates' ? '# {{titl…</code> |
| [118](../src/PreferencesPanel.vue:118) | 界面文案 | 输入要插入的片段 | <code>…bled="!selectedPersonalId" :placeholder="selectedPersonalId ? settingTab === 'templates' ? '# {{title}}' : $t('输入要插入的片段') : $t('在左侧选择或新建内容')" rows="10" @input="updatePersonalItemContent(($event.target as HTMLTextAreaElement).val…</code> |
| [118](../src/PreferencesPanel.vue:118) | 界面文案 | 在左侧选择或新建内容 | <code>…rsonalId" :placeholder="selectedPersonalId ? settingTab === 'templates' ? '# {{title}}' : $t('输入要插入的片段') : $t('在左侧选择或新建内容')" rows="10" @input="updatePersonalItemContent(($event.target as HTMLTextAreaElement).value)"/&gt;&lt;/div&gt;</code> |
| [122](../src/PreferencesPanel.vue:122) | 界面文案 | 快捷键设置 | <code>&lt;p class="workflow-settings-intro"&gt;{{ $t('快捷键设置') }}&lt;/p&gt;</code> |
| [123](../src/PreferencesPanel.vue:123) | 界面文案 | 设置${item.label}快捷键 | <code>…actions"&gt;&lt;button class="shortcut-record" :class="{ recording: recordingShortcutId === item.id }" :aria-label="&#96;设置${item.label}快捷键&#96;" @click="startShortcutRecording(item.id)" @keydown="recordShortcut(item.id, $event)"&gt;{{ recordingShortcutId…</code> |
| [123](../src/PreferencesPanel.vue:123) | 界面文案 | 请按组合键… | <code>…hortcutRecording(item.id)" @keydown="recordShortcut(item.id, $event)"&gt;{{ recordingShortcutId === item.id ? $t('请按组合键…') : formatChord(assignedChord(item.id)) &#124;&#124; '未设置' }}&lt;/button&gt;&lt;button v-if="recordingShortcutId === item.id" c…</code> |
| [123](../src/PreferencesPanel.vue:123) | 界面文案 | 未设置 | <code>…(item.id, $event)"&gt;{{ recordingShortcutId === item.id ? $t('请按组合键…') : formatChord(assignedChord(item.id)) &#124;&#124; '未设置' }}&lt;/button&gt;&lt;button v-if="recordingShortcutId === item.id" class="shortcut-action" :aria-label="&#96;取消设置${item.…</code> |
| [123](../src/PreferencesPanel.vue:123) | 界面文案 | 取消设置${item.label}快捷键 | <code>….id)) &#124;&#124; '未设置' }}&lt;/button&gt;&lt;button v-if="recordingShortcutId === item.id" class="shortcut-action" :aria-label="&#96;取消设置${item.label}快捷键&#96;" :title="$t('取消')" @pointerdown.prevent @click="cancelShortcutRecording"&gt;&lt;X :size="14"/&gt;&lt;/button&gt;&lt;button v-…</code> |
| [123](../src/PreferencesPanel.vue:123) | 界面文案 | 取消 | <code>…-if="recordingShortcutId === item.id" class="shortcut-action" :aria-label="&#96;取消设置${item.label}快捷键&#96;" :title="$t('取消')" @pointerdown.prevent @click="cancelShortcutRecording"&gt;&lt;X :size="14"/&gt;&lt;/button&gt;&lt;button v-else class="short…</code> |
| [123](../src/PreferencesPanel.vue:123) | 界面文案 | 清除${item.label}快捷键 | <code>…:size="14"/&gt;&lt;/button&gt;&lt;button v-else class="shortcut-action" :disabled="!assignedChord(item.id)" :aria-label="&#96;清除${item.label}快捷键&#96;" :title="$t('清除快捷键')" @click="clearShortcut(item.id)"&gt;&lt;Trash2 :size="14"/&gt;&lt;/button&gt;&lt;/div&gt;&lt;/div&gt;&lt;/div&gt;&lt;/sect…</code> |
| [123](../src/PreferencesPanel.vue:123) | 界面文案 | 清除快捷键 | <code>…lse class="shortcut-action" :disabled="!assignedChord(item.id)" :aria-label="&#96;清除${item.label}快捷键&#96;" :title="$t('清除快捷键')" @click="clearShortcut(item.id)"&gt;&lt;Trash2 :size="14"/&gt;&lt;/button&gt;&lt;/div&gt;&lt;/div&gt;&lt;/div&gt;&lt;/section&gt;</code> |
| [128](../src/PreferencesPanel.vue:128) | 界面文案 | 启用拼写检查 | <code>&lt;div class="setting-row setting-row-borderless"&gt;{{ $t('启用拼写检查') }} &lt;input :aria-label="$t('启用拼写检查')" v-model="spellcheckEnabled" type="checkbox"/&gt;&lt;/div&gt;</code> |
| [130](../src/PreferencesPanel.vue:130) | 界面文案 | 离线文件 | <code>…:key="dictionary.id"&gt;&lt;span&gt;&lt;strong&gt;{{ dictionary.name }}&lt;/strong&gt;&lt;small&gt;{{ dictionary.source === 'local' ? $t('离线文件') : $t('下载地址') }}&lt;/small&gt;&lt;/span&gt;&lt;button :aria-label="&#96;删除词典${dictionary.name}&#96;" @click="deleteSpellDictionary…</code> |
| [130](../src/PreferencesPanel.vue:130) | 界面文案 | 下载地址 | <code>…ary.id"&gt;&lt;span&gt;&lt;strong&gt;{{ dictionary.name }}&lt;/strong&gt;&lt;small&gt;{{ dictionary.source === 'local' ? $t('离线文件') : $t('下载地址') }}&lt;/small&gt;&lt;/span&gt;&lt;button :aria-label="&#96;删除词典${dictionary.name}&#96;" @click="deleteSpellDictionary(dictionary.i…</code> |
| [130](../src/PreferencesPanel.vue:130) | 界面文案 | 删除词典${dictionary.name} | <code>…trong&gt;&lt;small&gt;{{ dictionary.source === 'local' ? $t('离线文件') : $t('下载地址') }}&lt;/small&gt;&lt;/span&gt;&lt;button :aria-label="&#96;删除词典${dictionary.name}&#96;" @click="deleteSpellDictionary(dictionary.id)"&gt;&lt;Trash2 :size="14"/&gt;&lt;/button&gt;&lt;/div&gt;&lt;p v-if="!spellDictionari…</code> |
| [130](../src/PreferencesPanel.vue:130) | 界面文案 | 添加词典后即可检查拼写。 | <code>…eSpellDictionary(dictionary.id)"&gt;&lt;Trash2 :size="14"/&gt;&lt;/button&gt;&lt;/div&gt;&lt;p v-if="!spellDictionaries.length"&gt;{{ $t('添加词典后即可检查拼写。') }}&lt;/p&gt;&lt;/div&gt;</code> |
| [131](../src/PreferencesPanel.vue:131) | 界面文案 | 离线词典 | <code>&lt;div class="dictionary-source-card"&gt;&lt;strong&gt;{{ $t('离线词典') }}&lt;/strong&gt;&lt;p&gt;{{ $t('选择同名的 .dic 和 .aff 文件。') }}&lt;/p&gt;&lt;input ref="dictionaryFiles" class="visually-hidden" ty…</code> |
| [131](../src/PreferencesPanel.vue:131) | 界面文案 | 选择同名的 .dic 和 .aff 文件。 | <code>&lt;div class="dictionary-source-card"&gt;&lt;strong&gt;{{ $t('离线词典') }}&lt;/strong&gt;&lt;p&gt;{{ $t('选择同名的 .dic 和 .aff 文件。') }}&lt;/p&gt;&lt;input ref="dictionaryFiles" class="visually-hidden" type="file" accept=".dic,.aff" multiple @change…</code> |
| [131](../src/PreferencesPanel.vue:131) | 界面文案 | 选择 .dic 与 .aff 文件 | <code>…e @change="importSpellDictionary"/&gt;&lt;button :disabled="dictionaryBusy" @click="dictionaryFiles?.click()"&gt;{{ $t('选择 .dic 与 .aff 文件') }}&lt;/button&gt;&lt;/div&gt;</code> |
| [132](../src/PreferencesPanel.vue:132) | 界面文案 | 从 下载地址添加 | <code>&lt;div class="dictionary-source-card"&gt;&lt;strong&gt;{{ $t('从 下载地址添加') }}&lt;/strong&gt;&lt;input v-model.trim="dictionaryRawDic" :placeholder="$t('.dic 下载地址')"/&gt;&lt;input v-model.trim="dic…</code> |
| [132](../src/PreferencesPanel.vue:132) | 界面文案 | .dic 下载地址 | <code>…ary-source-card"&gt;&lt;strong&gt;{{ $t('从 下载地址添加') }}&lt;/strong&gt;&lt;input v-model.trim="dictionaryRawDic" :placeholder="$t('.dic 下载地址')"/&gt;&lt;input v-model.trim="dictionaryRawAff" :placeholder="$t('.aff 下载地址')"/&gt;&lt;button :disabled="dictionaryBusy…</code> |
| [132](../src/PreferencesPanel.vue:132) | 界面文案 | .aff 下载地址 | <code>…im="dictionaryRawDic" :placeholder="$t('.dic 下载地址')"/&gt;&lt;input v-model.trim="dictionaryRawAff" :placeholder="$t('.aff 下载地址')"/&gt;&lt;button :disabled="dictionaryBusy" @click="downloadSpellDictionary"&gt;{{ $t('下载并添加') }}&lt;/button&gt;&lt;/div&gt;</code> |
| [132](../src/PreferencesPanel.vue:132) | 界面文案 | 下载并添加 | <code>…ff" :placeholder="$t('.aff 下载地址')"/&gt;&lt;button :disabled="dictionaryBusy" @click="downloadSpellDictionary"&gt;{{ $t('下载并添加') }}&lt;/button&gt;&lt;/div&gt;</code> |
| [136](../src/PreferencesPanel.vue:136) | 界面文案 | PDF 与 Word | <code>&lt;p&gt;{{ $t('PDF 与 Word') }}&lt;/p&gt;</code> |
| [137](../src/PreferencesPanel.vue:137) | 界面文案 | 导出字体 | <code>&lt;FontPicker v-model="exportFontFamily" :fonts="systemFonts" :loading="fontsLoading" default-value="-apple-system" :label="$t('导出字体')" @open="loadSystemFonts"/&gt;</code> |
| [138](../src/PreferencesPanel.vue:138) | 界面文案 | 纸张大小 | <code>&lt;div class="setting-row"&gt;{{ $t('纸张大小') }} &lt;SettingSelect v-model="exportPageSize" :label="$t('纸张尺寸')" :options="[{ value: 'A4', label: 'A4' }, { value: 'Letter', label: 'Letter' }, { value: 'custom', label: $t('自定义') }]"/&gt;&lt;/div&gt;</code> |
| [138](../src/PreferencesPanel.vue:138) | 界面文案 | 纸张尺寸 | <code>&lt;div class="setting-row"&gt;{{ $t('纸张大小') }} &lt;SettingSelect v-model="exportPageSize" :label="$t('纸张尺寸')" :options="[{ value: 'A4', label: 'A4' }, { value: 'Letter', label: 'Letter' }, { value: 'custom', label: $t('自定义') }]"/&gt;&lt;/div&gt;</code> |
| [138](../src/PreferencesPanel.vue:138) | 界面文案 | A4 | <code>&lt;div class="setting-row"&gt;{{ $t('纸张大小') }} &lt;SettingSelect v-model="exportPageSize" :label="$t('纸张尺寸')" :options="[{ value: 'A4', label: 'A4' }, { value: 'Letter', label: 'Letter' }, { value: 'custom', label: $t('自定义') }]"/&gt;&lt;/div&gt;</code> |
| [138](../src/PreferencesPanel.vue:138) | 界面文案 | Letter | <code>&lt;div class="setting-row"&gt;{{ $t('纸张大小') }} &lt;SettingSelect v-model="exportPageSize" :label="$t('纸张尺寸')" :options="[{ value: 'A4', label: 'A4' }, { value: 'Letter', label: 'Letter' }, { value: 'custom', label: $t('自定义') }]"/&gt;&lt;/div&gt;</code> |
| [138](../src/PreferencesPanel.vue:138) | 界面文案 | 自定义 | <code>&lt;div class="setting-row"&gt;{{ $t('纸张大小') }} &lt;SettingSelect v-model="exportPageSize" :label="$t('纸张尺寸')" :options="[{ value: 'A4', label: 'A4' }, { value: 'Letter', label: 'Letter' }, { value: 'custom', label: $t('自定义') }]"/&gt;&lt;/div&gt;</code> |
| [139](../src/PreferencesPanel.vue:139) | 界面文案 | 纸张尺寸（宽 × 高，mm） | <code>&lt;div class="export-size-grid"&gt;&lt;span&gt;{{ $t('纸张尺寸（宽 × 高，mm）') }}&lt;/span&gt;&lt;label&gt;&lt;input :value="exportPageWidth &#124;&#124; ''" type="number" :disabled="exportPageSize !== 'custom'…</code> |
| [139](../src/PreferencesPanel.vue:139) | 界面文案 | x | <code>…nt.target as HTMLInputElement).value ? Number(($event.target as HTMLInputElement).value) : 0"/&gt;&lt;/label&gt;&lt;label&gt;x&lt;/label&gt;&lt;label&gt;&lt;input :value="exportPageHeight &#124;&#124; ''" type="number" :disabled="exportPageSize !== 'custom'" mi…</code> |
| [140](../src/PreferencesPanel.vue:140) | 界面文案 | 页边距 | <code>&lt;div class="setting-row"&gt;{{ $t('页边距') }} &lt;SettingSelect v-model="exportMarginPreset" :label="$t('页边距')" :options="[{ value: 'normal', label: $t('常规（18 mm）') }, { value: 'narrow', label: $t('窄（10 mm）') }, { val…</code> |
| [140](../src/PreferencesPanel.vue:140) | 界面文案 | 常规（18 mm） | <code>…距') }} &lt;SettingSelect v-model="exportMarginPreset" :label="$t('页边距')" :options="[{ value: 'normal', label: $t('常规（18 mm）') }, { value: 'narrow', label: $t('窄（10 mm）') }, { value: 'wide', label: $t('宽（25 mm）') }, { value: 'custom'…</code> |
| [140](../src/PreferencesPanel.vue:140) | 界面文案 | 窄（10 mm） | <code>…eset" :label="$t('页边距')" :options="[{ value: 'normal', label: $t('常规（18 mm）') }, { value: 'narrow', label: $t('窄（10 mm）') }, { value: 'wide', label: $t('宽（25 mm）') }, { value: 'custom', label: $t('自定义') }]"/&gt;&lt;/div&gt;&lt;div v-if="exp…</code> |
| [140](../src/PreferencesPanel.vue:140) | 界面文案 | 宽（25 mm） | <code>…e: 'normal', label: $t('常规（18 mm）') }, { value: 'narrow', label: $t('窄（10 mm）') }, { value: 'wide', label: $t('宽（25 mm）') }, { value: 'custom', label: $t('自定义') }]"/&gt;&lt;/div&gt;&lt;div v-if="exportMarginPreset === 'custom'" class="setti…</code> |
| [140](../src/PreferencesPanel.vue:140) | 界面文案 | 自定义 | <code>…ue: 'narrow', label: $t('窄（10 mm）') }, { value: 'wide', label: $t('宽（25 mm）') }, { value: 'custom', label: $t('自定义') }]"/&gt;&lt;/div&gt;&lt;div v-if="exportMarginPreset === 'custom'" class="setting-row"&gt;{{ $t('自定义页边距（mm）') }} &lt;input :…</code> |
| [140](../src/PreferencesPanel.vue:140) | 界面文案 | 自定义页边距（mm） | <code>…&lt;div v-if="exportMarginPreset === 'custom'" class="setting-row"&gt;{{ $t('自定义页边距（mm）') }} &lt;input :aria-label="$t('自定义页边距（mm）')" :value="exportMargin &#124;&#124; ''" type="number" min="0" max="100" @input="exportMargin = ($event.target as HTML…</code> |

<a id="src-previews-plugin-system-validation-ts"></a>

## src/previews/plugin-system-validation.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [9](../src/previews/plugin-system-validation.ts:9) | 文案定义／其他 | let api, item, count=0;<br>export async function activate(host){<br> api=host;<br> await api.ui.sidebar.register({id:'counter',title:'计数器',multiple:true,render:()=&gt;({tag:'div',children:[{tag:'h3',text:'隔离面板'},{tag:'p',text:'计数 '+count},{tag:'button',text:'增加',on:{click:async()=&gt;{count++;await item.refresh()}}}]})});<br> await api.ui.sidebar.register({id:'notes',title:'便笺',render:()=&gt;({tag:'div',children:[{tag:'p',text:'切换面板或移动到其他区域'},{tag:'textarea',attrs:{'aria-label':'便笺',rows:5,placeholder:'输入文字，移动后仍保留'}}]})});<br> await api.commands.register({id:'inspect',title:'隔离环境检查',run:()=&gt;api.ui.notify([typeof document,typeof fetch,typeof process].join('/'))});<br> await api.ui.registerAction({id:'inspect',commandId:'inspect',location:'topbar-menu'});<br> item=await api.ui.sidebar.open('counter');<br> await api.ui.sidebar.open('notes');<br>} | <code>const source=&#96;let api, item, count=0;</code> |
| [23](../src/previews/plugin-system-validation.ts:23) | 文案定义／其他 | 侧栏面板验证 | <code>const manifest=parsePluginManifest({apiVersion:2,id:'dev.markart.validation',name:'侧栏面板验证',version:'0.1.0',permissions:{required:['editor.read','index.read'],optional:['background']}})</code> |

<a id="src-previews-pluginpanelspreview-vue"></a>

## src/previews/PluginPanelsPreview.vue

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [8](../src/previews/PluginPanelsPreview.vue:8) | 文案定义／其他 | 插件系统设计.md | <code>{ id: 'design', name: '插件系统设计.md', title: '插件系统设计', tags: ['产品设计', 'Markart'], intro: '插件负责拓展功能，应用负责组织界面。让写作保持在中心，也让需要的工具随手可及。' },</code> |
| [8](../src/previews/PluginPanelsPreview.vue:8) | 文案定义／其他 | 插件系统设计 | <code>{ id: 'design', name: '插件系统设计.md', title: '插件系统设计', tags: ['产品设计', 'Markart'], intro: '插件负责拓展功能，应用负责组织界面。让写作保持在中心，也让需要的工具随手可及。' },</code> |
| [8](../src/previews/PluginPanelsPreview.vue:8) | 文案定义／其他 | 产品设计 | <code>{ id: 'design', name: '插件系统设计.md', title: '插件系统设计', tags: ['产品设计', 'Markart'], intro: '插件负责拓展功能，应用负责组织界面。让写作保持在中心，也让需要的工具随手可及。' },</code> |
| [8](../src/previews/PluginPanelsPreview.vue:8) | 文案定义／其他 | 插件负责拓展功能，应用负责组织界面。让写作保持在中心，也让需要的工具随手可及。 | <code>{ id: 'design', name: '插件系统设计.md', title: '插件系统设计', tags: ['产品设计', 'Markart'], intro: '插件负责拓展功能，应用负责组织界面。让写作保持在中心，也让需要的工具随手可及。' },</code> |
| [9](../src/previews/PluginPanelsPreview.vue:9) | 文案定义／其他 | 写作流程.md | <code>{ id: 'writing', name: '写作流程.md', title: '写作流程', tags: ['写作', '工作流'], intro: '从一个想法开始，收集资料、组织结构，再逐步完成正文。工具在需要的时候出现。' },</code> |
| [9](../src/previews/PluginPanelsPreview.vue:9) | 文案定义／其他 | 写作流程 | <code>{ id: 'writing', name: '写作流程.md', title: '写作流程', tags: ['写作', '工作流'], intro: '从一个想法开始，收集资料、组织结构，再逐步完成正文。工具在需要的时候出现。' },</code> |
| [9](../src/previews/PluginPanelsPreview.vue:9) | 文案定义／其他 | 写作 | <code>{ id: 'writing', name: '写作流程.md', title: '写作流程', tags: ['写作', '工作流'], intro: '从一个想法开始，收集资料、组织结构，再逐步完成正文。工具在需要的时候出现。' },</code> |
| [9](../src/previews/PluginPanelsPreview.vue:9) | 文案定义／其他 | 工作流 | <code>{ id: 'writing', name: '写作流程.md', title: '写作流程', tags: ['写作', '工作流'], intro: '从一个想法开始，收集资料、组织结构，再逐步完成正文。工具在需要的时候出现。' },</code> |
| [9](../src/previews/PluginPanelsPreview.vue:9) | 文案定义／其他 | 从一个想法开始，收集资料、组织结构，再逐步完成正文。工具在需要的时候出现。 | <code>{ id: 'writing', name: '写作流程.md', title: '写作流程', tags: ['写作', '工作流'], intro: '从一个想法开始，收集资料、组织结构，再逐步完成正文。工具在需要的时候出现。' },</code> |
| [10](../src/previews/PluginPanelsPreview.vue:10) | 文案定义／其他 | 知识索引.md | <code>{ id: 'index', name: '知识索引.md', title: '知识索引', tags: ['知识管理', 'Markart'], intro: '文件之间的链接构成可探索的关系。索引记录这些联系，图谱帮助我们看见它们。' },</code> |
| [10](../src/previews/PluginPanelsPreview.vue:10) | 文案定义／其他 | 知识索引 | <code>{ id: 'index', name: '知识索引.md', title: '知识索引', tags: ['知识管理', 'Markart'], intro: '文件之间的链接构成可探索的关系。索引记录这些联系，图谱帮助我们看见它们。' },</code> |
| [10](../src/previews/PluginPanelsPreview.vue:10) | 文案定义／其他 | 知识管理 | <code>{ id: 'index', name: '知识索引.md', title: '知识索引', tags: ['知识管理', 'Markart'], intro: '文件之间的链接构成可探索的关系。索引记录这些联系，图谱帮助我们看见它们。' },</code> |
| [10](../src/previews/PluginPanelsPreview.vue:10) | 文案定义／其他 | 文件之间的链接构成可探索的关系。索引记录这些联系，图谱帮助我们看见它们。 | <code>{ id: 'index', name: '知识索引.md', title: '知识索引', tags: ['知识管理', 'Markart'], intro: '文件之间的链接构成可探索的关系。索引记录这些联系，图谱帮助我们看见它们。' },</code> |
| [11](../src/previews/PluginPanelsPreview.vue:11) | 文案定义／其他 | 项目计划.md | <code>{ id: 'plan', name: '项目计划.md', title: '项目计划', tags: ['产品设计', '工作流'], intro: '先验证交互，再明确接口边界。每个阶段都留下可运行、可观察、可调整的结果。' },</code> |
| [11](../src/previews/PluginPanelsPreview.vue:11) | 文案定义／其他 | 项目计划 | <code>{ id: 'plan', name: '项目计划.md', title: '项目计划', tags: ['产品设计', '工作流'], intro: '先验证交互，再明确接口边界。每个阶段都留下可运行、可观察、可调整的结果。' },</code> |
| [11](../src/previews/PluginPanelsPreview.vue:11) | 文案定义／其他 | 产品设计 | <code>{ id: 'plan', name: '项目计划.md', title: '项目计划', tags: ['产品设计', '工作流'], intro: '先验证交互，再明确接口边界。每个阶段都留下可运行、可观察、可调整的结果。' },</code> |
| [11](../src/previews/PluginPanelsPreview.vue:11) | 文案定义／其他 | 工作流 | <code>{ id: 'plan', name: '项目计划.md', title: '项目计划', tags: ['产品设计', '工作流'], intro: '先验证交互，再明确接口边界。每个阶段都留下可运行、可观察、可调整的结果。' },</code> |
| [11](../src/previews/PluginPanelsPreview.vue:11) | 文案定义／其他 | 先验证交互，再明确接口边界。每个阶段都留下可运行、可观察、可调整的结果。 | <code>{ id: 'plan', name: '项目计划.md', title: '项目计划', tags: ['产品设计', '工作流'], intro: '先验证交互，再明确接口边界。每个阶段都留下可运行、可观察、可调整的结果。' },</code> |
| [16](../src/previews/PluginPanelsPreview.vue:16) | 文案定义／其他 | 左侧上方 | <code>const regions: {id: Region; label:string}[] = [{id:'leftTop',label:'左侧上方'},{id:'leftBottom',label:'左侧下方'},{id:'rightTop',label:'右侧上方'},{id:'rightBottom',label:'右侧下方'}]</code> |
| [16](../src/previews/PluginPanelsPreview.vue:16) | 文案定义／其他 | 左侧下方 | <code>const regions: {id: Region; label:string}[] = [{id:'leftTop',label:'左侧上方'},{id:'leftBottom',label:'左侧下方'},{id:'rightTop',label:'右侧上方'},{id:'rightBottom',label:'右侧下方'}]</code> |
| [16](../src/previews/PluginPanelsPreview.vue:16) | 文案定义／其他 | 右侧上方 | <code>const regions: {id: Region; label:string}[] = [{id:'leftTop',label:'左侧上方'},{id:'leftBottom',label:'左侧下方'},{id:'rightTop',label:'右侧上方'},{id:'rightBottom',label:'右侧下方'}]</code> |
| [16](../src/previews/PluginPanelsPreview.vue:16) | 文案定义／其他 | 右侧下方 | <code>const regions: {id: Region; label:string}[] = [{id:'leftTop',label:'左侧上方'},{id:'leftBottom',label:'左侧下方'},{id:'rightTop',label:'右侧上方'},{id:'rightBottom',label:'右侧下方'}]</code> |
| [17](../src/previews/PluginPanelsPreview.vue:17) | 文案定义／其他 | 文件 | <code>const titles: Record&lt;Panel,string&gt; = {files:'文件',outline:'大纲',graph:'图谱',tags:'标签',backlinks:'反向链接'}</code> |
| [17](../src/previews/PluginPanelsPreview.vue:17) | 文案定义／其他 | 大纲 | <code>const titles: Record&lt;Panel,string&gt; = {files:'文件',outline:'大纲',graph:'图谱',tags:'标签',backlinks:'反向链接'}</code> |
| [17](../src/previews/PluginPanelsPreview.vue:17) | 文案定义／其他 | 图谱 | <code>const titles: Record&lt;Panel,string&gt; = {files:'文件',outline:'大纲',graph:'图谱',tags:'标签',backlinks:'反向链接'}</code> |
| [17](../src/previews/PluginPanelsPreview.vue:17) | 文案定义／其他 | 标签 | <code>const titles: Record&lt;Panel,string&gt; = {files:'文件',outline:'大纲',graph:'图谱',tags:'标签',backlinks:'反向链接'}</code> |
| [17](../src/previews/PluginPanelsPreview.vue:17) | 文案定义／其他 | 反向链接 | <code>const titles: Record&lt;Panel,string&gt; = {files:'文件',outline:'大纲',graph:'图谱',tags:'标签',backlinks:'反向链接'}</code> |
| [70](../src/previews/PluginPanelsPreview.vue:70) | 界面文案 | 展开左侧栏 | <code>&lt;header class="preview-editorbar"&gt;&lt;button v-if="!leftOpen" class="icon-button" aria-label="展开左侧栏" @click="leftOpen=true"&gt;&lt;PanelLeft :size="15"/&gt;&lt;/button&gt;&lt;div class="preview-file-tabs"&gt;&lt;div v-for="id in ope…</code> |
| [70](../src/previews/PluginPanelsPreview.vue:70) | 界面文案 | 关闭标签页 | <code>…"/&gt;&lt;span&gt;{{files.find(item=&gt;item.id===id)?.name}}&lt;/span&gt;&lt;/button&gt;&lt;button class="preview-tab-close" aria-label="关闭标签页" @click="closeFile(id)"&gt;&lt;X :size="11"/&gt;&lt;/button&gt;&lt;/div&gt;&lt;/div&gt;&lt;button class="icon-button" aria-label="打开项目计划"…</code> |
| [70](../src/previews/PluginPanelsPreview.vue:70) | 界面文案 | 打开项目计划 | <code>…bel="关闭标签页" @click="closeFile(id)"&gt;&lt;X :size="11"/&gt;&lt;/button&gt;&lt;/div&gt;&lt;/div&gt;&lt;button class="icon-button" aria-label="打开项目计划" @click="openFile('plan')"&gt;&lt;Plus :size="15"/&gt;&lt;/button&gt;&lt;span class="preview-bar-separator"/&gt;&lt;button class="ic…</code> |
| [70](../src/previews/PluginPanelsPreview.vue:70) | 界面文案 | 展开或收起右侧栏 | <code>…lan')"&gt;&lt;Plus :size="15"/&gt;&lt;/button&gt;&lt;span class="preview-bar-separator"/&gt;&lt;button class="icon-button" aria-label="展开或收起右侧栏" :aria-expanded="rightOpen" @click="rightOpen=!rightOpen"&gt;&lt;PanelRight :size="15"/&gt;&lt;/button&gt;&lt;/header&gt;</code> |
| [71](../src/previews/PluginPanelsPreview.vue:71) | 界面文案 | 界面与内容 | <code>…iew-article"&gt;&lt;div class="preview-prose"&gt;&lt;h1&gt;{{file.title}}&lt;/h1&gt;&lt;p class="preview-intro"&gt;{{file.intro}}&lt;/p&gt;&lt;h2&gt;界面与内容&lt;/h2&gt;&lt;p&gt;左右侧栏各分上下两个区域。每个区域可以放入多个面板，点击名称切换，同一时间显示一个面板。&lt;/p&gt;&lt;blockquote&gt;四个位置，自由组织，内容始终在中心。&lt;/blockquote&gt;&lt;h2&gt;面板的工作方式…</code> |
| [71](../src/previews/PluginPanelsPreview.vue:71) | 界面文案 | 左右侧栏各分上下两个区域。每个区域可以放入多个面板，点击名称切换，同一时间显示一个面板。 | <code>…&lt;div class="preview-prose"&gt;&lt;h1&gt;{{file.title}}&lt;/h1&gt;&lt;p class="preview-intro"&gt;{{file.intro}}&lt;/p&gt;&lt;h2&gt;界面与内容&lt;/h2&gt;&lt;p&gt;左右侧栏各分上下两个区域。每个区域可以放入多个面板，点击名称切换，同一时间显示一个面板。&lt;/p&gt;&lt;blockquote&gt;四个位置，自由组织，内容始终在中心。&lt;/blockquote&gt;&lt;h2&gt;面板的工作方式&lt;/h2&gt;&lt;p&gt;通过“管理侧栏”，将面板移到其他区域。切换和移动都会保留面板状态。&lt;/p&gt;&lt;ul&gt;&lt;li…</code> |
| [71](../src/previews/PluginPanelsPreview.vue:71) | 界面文案 | 四个位置，自由组织，内容始终在中心。 | <code>…preview-intro"&gt;{{file.intro}}&lt;/p&gt;&lt;h2&gt;界面与内容&lt;/h2&gt;&lt;p&gt;左右侧栏各分上下两个区域。每个区域可以放入多个面板，点击名称切换，同一时间显示一个面板。&lt;/p&gt;&lt;blockquote&gt;四个位置，自由组织，内容始终在中心。&lt;/blockquote&gt;&lt;h2&gt;面板的工作方式&lt;/h2&gt;&lt;p&gt;通过“管理侧栏”，将面板移到其他区域。切换和移动都会保留面板状态。&lt;/p&gt;&lt;ul&gt;&lt;li&gt;点击区域顶部的名称切换面板。&lt;/li&gt;&lt;li&gt;在菜单中选择面板的新…</code> |
| [71](../src/previews/PluginPanelsPreview.vue:71) | 界面文案 | 面板的工作方式 | <code>…2&gt;界面与内容&lt;/h2&gt;&lt;p&gt;左右侧栏各分上下两个区域。每个区域可以放入多个面板，点击名称切换，同一时间显示一个面板。&lt;/p&gt;&lt;blockquote&gt;四个位置，自由组织，内容始终在中心。&lt;/blockquote&gt;&lt;h2&gt;面板的工作方式&lt;/h2&gt;&lt;p&gt;通过“管理侧栏”，将面板移到其他区域。切换和移动都会保留面板状态。&lt;/p&gt;&lt;ul&gt;&lt;li&gt;点击区域顶部的名称切换面板。&lt;/li&gt;&lt;li&gt;在菜单中选择面板的新位置。&lt;/li&gt;&lt;li&gt;拖动侧栏中间的分割线调整…</code> |
| [71](../src/previews/PluginPanelsPreview.vue:71) | 界面文案 | 通过“管理侧栏”，将面板移到其他区域。切换和移动都会保留面板状态。 | <code>…左右侧栏各分上下两个区域。每个区域可以放入多个面板，点击名称切换，同一时间显示一个面板。&lt;/p&gt;&lt;blockquote&gt;四个位置，自由组织，内容始终在中心。&lt;/blockquote&gt;&lt;h2&gt;面板的工作方式&lt;/h2&gt;&lt;p&gt;通过“管理侧栏”，将面板移到其他区域。切换和移动都会保留面板状态。&lt;/p&gt;&lt;ul&gt;&lt;li&gt;点击区域顶部的名称切换面板。&lt;/li&gt;&lt;li&gt;在菜单中选择面板的新位置。&lt;/li&gt;&lt;li&gt;拖动侧栏中间的分割线调整上下高度。&lt;/li&gt;&lt;/ul&gt;&lt;h2&gt;下一步&lt;/h2&gt;&lt;p&gt;确认交互后，再将四个区…</code> |
| [71](../src/previews/PluginPanelsPreview.vue:71) | 界面文案 | 点击区域顶部的名称切换面板。 | <code>…/p&gt;&lt;blockquote&gt;四个位置，自由组织，内容始终在中心。&lt;/blockquote&gt;&lt;h2&gt;面板的工作方式&lt;/h2&gt;&lt;p&gt;通过“管理侧栏”，将面板移到其他区域。切换和移动都会保留面板状态。&lt;/p&gt;&lt;ul&gt;&lt;li&gt;点击区域顶部的名称切换面板。&lt;/li&gt;&lt;li&gt;在菜单中选择面板的新位置。&lt;/li&gt;&lt;li&gt;拖动侧栏中间的分割线调整上下高度。&lt;/li&gt;&lt;/ul&gt;&lt;h2&gt;下一步&lt;/h2&gt;&lt;p&gt;确认交互后，再将四个区域接入统一的面板 API。&lt;/p&gt;&lt;/div&gt;&lt;/a…</code> |
| [71](../src/previews/PluginPanelsPreview.vue:71) | 界面文案 | 在菜单中选择面板的新位置。 | <code>…织，内容始终在中心。&lt;/blockquote&gt;&lt;h2&gt;面板的工作方式&lt;/h2&gt;&lt;p&gt;通过“管理侧栏”，将面板移到其他区域。切换和移动都会保留面板状态。&lt;/p&gt;&lt;ul&gt;&lt;li&gt;点击区域顶部的名称切换面板。&lt;/li&gt;&lt;li&gt;在菜单中选择面板的新位置。&lt;/li&gt;&lt;li&gt;拖动侧栏中间的分割线调整上下高度。&lt;/li&gt;&lt;/ul&gt;&lt;h2&gt;下一步&lt;/h2&gt;&lt;p&gt;确认交互后，再将四个区域接入统一的面板 API。&lt;/p&gt;&lt;/div&gt;&lt;/article&gt;&lt;footer class="…</code> |
| [71](../src/previews/PluginPanelsPreview.vue:71) | 界面文案 | 拖动侧栏中间的分割线调整上下高度。 | <code>…&gt;&lt;h2&gt;面板的工作方式&lt;/h2&gt;&lt;p&gt;通过“管理侧栏”，将面板移到其他区域。切换和移动都会保留面板状态。&lt;/p&gt;&lt;ul&gt;&lt;li&gt;点击区域顶部的名称切换面板。&lt;/li&gt;&lt;li&gt;在菜单中选择面板的新位置。&lt;/li&gt;&lt;li&gt;拖动侧栏中间的分割线调整上下高度。&lt;/li&gt;&lt;/ul&gt;&lt;h2&gt;下一步&lt;/h2&gt;&lt;p&gt;确认交互后，再将四个区域接入统一的面板 API。&lt;/p&gt;&lt;/div&gt;&lt;/article&gt;&lt;footer class="preview-status"&gt;&lt;span&gt;交互预览…</code> |
| [71](../src/previews/PluginPanelsPreview.vue:71) | 界面文案 | 下一步 | <code>…板移到其他区域。切换和移动都会保留面板状态。&lt;/p&gt;&lt;ul&gt;&lt;li&gt;点击区域顶部的名称切换面板。&lt;/li&gt;&lt;li&gt;在菜单中选择面板的新位置。&lt;/li&gt;&lt;li&gt;拖动侧栏中间的分割线调整上下高度。&lt;/li&gt;&lt;/ul&gt;&lt;h2&gt;下一步&lt;/h2&gt;&lt;p&gt;确认交互后，再将四个区域接入统一的面板 API。&lt;/p&gt;&lt;/div&gt;&lt;/article&gt;&lt;footer class="preview-status"&gt;&lt;span&gt;交互预览 · 示例文件&lt;/span&gt;&lt;/f…</code> |
| [71](../src/previews/PluginPanelsPreview.vue:71) | 界面文案 | 确认交互后，再将四个区域接入统一的面板 API。 | <code>…移动都会保留面板状态。&lt;/p&gt;&lt;ul&gt;&lt;li&gt;点击区域顶部的名称切换面板。&lt;/li&gt;&lt;li&gt;在菜单中选择面板的新位置。&lt;/li&gt;&lt;li&gt;拖动侧栏中间的分割线调整上下高度。&lt;/li&gt;&lt;/ul&gt;&lt;h2&gt;下一步&lt;/h2&gt;&lt;p&gt;确认交互后，再将四个区域接入统一的面板 API。&lt;/p&gt;&lt;/div&gt;&lt;/article&gt;&lt;footer class="preview-status"&gt;&lt;span&gt;交互预览 · 示例文件&lt;/span&gt;&lt;/footer&gt;</code> |
| [71](../src/previews/PluginPanelsPreview.vue:71) | 界面文案 | 交互预览 · 示例文件 | <code>…下高度。&lt;/li&gt;&lt;/ul&gt;&lt;h2&gt;下一步&lt;/h2&gt;&lt;p&gt;确认交互后，再将四个区域接入统一的面板 API。&lt;/p&gt;&lt;/div&gt;&lt;/article&gt;&lt;footer class="preview-status"&gt;&lt;span&gt;交互预览 · 示例文件&lt;/span&gt;&lt;/footer&gt;</code> |
| [74](../src/previews/PluginPanelsPreview.vue:74) | 界面文案 | 收起左侧栏 | <code>…-if="side === 'left'"&gt;&lt;span class="preview-traffic"&gt;&lt;i/&gt;&lt;i/&gt;&lt;i/&gt;&lt;/span&gt;&lt;button class="icon-button" aria-label="收起左侧栏" @click="leftOpen=false"&gt;&lt;PanelLeft :size="15"/&gt;&lt;/button&gt;&lt;FolderOpen :size="15" class="preview-muted"/&gt;&lt;/tem…</code> |
| [74](../src/previews/PluginPanelsPreview.vue:74) | 界面文案 | 面板 | <code>…5"/&gt;&lt;/button&gt;&lt;FolderOpen :size="15" class="preview-muted"/&gt;&lt;/template&gt;&lt;span v-else class="preview-side-label"&gt;面板&lt;/span&gt;&lt;/header&gt;</code> |
| [75](../src/previews/PluginPanelsPreview.vue:75) | 界面文案 | 调整右侧栏宽度 | <code>&lt;div v-if="side === 'right'" class="preview-right-resizer" role="separator" aria-label="调整右侧栏宽度" aria-orientation="vertical" tabindex="0" @pointerdown="resize($event,side)" @keydown.left.prevent="rightWid…</code> |
| [78](../src/previews/PluginPanelsPreview.vue:78) | 界面文案 | 调整${side==='left'?'左':'右'}侧上下区域高度 | <code>&lt;div v-if="index" class="preview-height-resizer" role="separator" :aria-label="&#96;调整${side==='left'?'左':'右'}侧上下区域高度&#96;" aria-orientation="horizontal" tabindex="0" @pointerdown="resize($event,side,true)" @keydown.up.prevent="ra…</code> |
| [80](../src/previews/PluginPanelsPreview.vue:80) | 界面文案 | 搜索文件 | <code>…&gt;&lt;label class="preview-file-search"&gt;&lt;Search :size="13"/&gt;&lt;input v-model="search" placeholder="搜索文件" aria-label="搜索文件"/&gt;&lt;/label&gt;&lt;button class="preview-root" @click="folderOpen=!folderOpen"&gt;&lt;ChevronDown v-if="folderOpen" :size=…</code> |
| [80](../src/previews/PluginPanelsPreview.vue:80) | 界面文案 | Markart | <code>…en"&gt;&lt;ChevronDown v-if="folderOpen" :size="14"/&gt;&lt;ChevronRight v-else :size="14"/&gt;&lt;FolderOpen :size="16"/&gt;&lt;span&gt;Markart&lt;/span&gt;&lt;/button&gt;&lt;div v-if="folderOpen" class="preview-file-list"&gt;&lt;button v-for="item in filteredFiles" :key="i…</code> |
| [80](../src/previews/PluginPanelsPreview.vue:80) | 界面文案 | 没有匹配的文件 | <code>…le :size="15"/&gt;&lt;span&gt;{{item.name}}&lt;/span&gt;&lt;/button&gt;&lt;p v-if="!filteredFiles.length" class="preview-empty-small"&gt;没有匹配的文件&lt;/p&gt;&lt;/div&gt;&lt;/template&gt;</code> |
| [87](../src/previews/PluginPanelsPreview.vue:87) | 界面文案 | 左右侧栏预览 | <code>&lt;/div&gt;&lt;div class="preview-note"&gt;&lt;span&gt;左右侧栏预览&lt;/span&gt;&lt;span&gt;切换面板、移动位置或调整上下高度。&lt;/span&gt;&lt;button @click="managerOpen=true"&gt;管理侧栏&lt;/button&gt;&lt;button @click="reset"&gt;恢复布局&lt;/button&gt;&lt;/div&gt;</code> |
| [87](../src/previews/PluginPanelsPreview.vue:87) | 界面文案 | 切换面板、移动位置或调整上下高度。 | <code>&lt;/div&gt;&lt;div class="preview-note"&gt;&lt;span&gt;左右侧栏预览&lt;/span&gt;&lt;span&gt;切换面板、移动位置或调整上下高度。&lt;/span&gt;&lt;button @click="managerOpen=true"&gt;管理侧栏&lt;/button&gt;&lt;button @click="reset"&gt;恢复布局&lt;/button&gt;&lt;/div&gt;</code> |
| [87](../src/previews/PluginPanelsPreview.vue:87) | 界面文案 | 管理侧栏 | <code>&lt;/div&gt;&lt;div class="preview-note"&gt;&lt;span&gt;左右侧栏预览&lt;/span&gt;&lt;span&gt;切换面板、移动位置或调整上下高度。&lt;/span&gt;&lt;button @click="managerOpen=true"&gt;管理侧栏&lt;/button&gt;&lt;button @click="reset"&gt;恢复布局&lt;/button&gt;&lt;/div&gt;</code> |
| [87](../src/previews/PluginPanelsPreview.vue:87) | 界面文案 | 恢复布局 | <code>&lt;/div&gt;&lt;div class="preview-note"&gt;&lt;span&gt;左右侧栏预览&lt;/span&gt;&lt;span&gt;切换面板、移动位置或调整上下高度。&lt;/span&gt;&lt;button @click="managerOpen=true"&gt;管理侧栏&lt;/button&gt;&lt;button @click="reset"&gt;恢复布局&lt;/button&gt;&lt;/div&gt;</code> |

<a id="src-previews-previewpanelcontent-vue"></a>

## src/previews/PreviewPanelContent.vue

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [11](../src/previews/PreviewPanelContent.vue:11) | 界面文案 | 文件关系 | <code>&lt;template v-if="id === 'graph'"&gt;&lt;div class="preview-graph-heading"&gt;&lt;h3&gt;文件关系&lt;/h3&gt;&lt;span&gt;4 个文件 · 5 条链接&lt;/span&gt;&lt;/div&gt;&lt;svg class="preview-graph" viewBox="0 0 310 360" aria-label="示例文件关系图"&gt;&lt;g…</code> |
| [11](../src/previews/PreviewPanelContent.vue:11) | 界面文案 | 4 个文件 · 5 条链接 | <code>&lt;template v-if="id === 'graph'"&gt;&lt;div class="preview-graph-heading"&gt;&lt;h3&gt;文件关系&lt;/h3&gt;&lt;span&gt;4 个文件 · 5 条链接&lt;/span&gt;&lt;/div&gt;&lt;svg class="preview-graph" viewBox="0 0 310 360" aria-label="示例文件关系图"&gt;&lt;g stroke="var(--line-stron…</code> |
| [11](../src/previews/PreviewPanelContent.vue:11) | 界面文案 | 示例文件关系图 | <code>…ing"&gt;&lt;h3&gt;文件关系&lt;/h3&gt;&lt;span&gt;4 个文件 · 5 条链接&lt;/span&gt;&lt;/div&gt;&lt;svg class="preview-graph" viewBox="0 0 310 360" aria-label="示例文件关系图"&gt;&lt;g stroke="var(--line-strong)" stroke-width="1.2"&gt;&lt;path d="M150 155L76 65M150 155L246 108M150 155L220 285M7…</code> |
| [11](../src/previews/PreviewPanelContent.vue:11) | 界面文案 | 插件系统设计 | <code>…L246 108M150 155L220 285M76 65L246 108M246 108L220 285"/&gt;&lt;/g&gt;&lt;g v-for="node in [{x:150,y:155,id:'design',name:'插件系统设计'},{x:76,y:65,id:'writing',name:'写作流程'},{x:246,y:108,id:'index',name:'知识索引'},{x:220,y:285,id:'plan',name:'项目计…</code> |
| [11](../src/previews/PreviewPanelContent.vue:11) | 界面文案 | 写作流程 | <code>…246 108L220 285"/&gt;&lt;/g&gt;&lt;g v-for="node in [{x:150,y:155,id:'design',name:'插件系统设计'},{x:76,y:65,id:'writing',name:'写作流程'},{x:246,y:108,id:'index',name:'知识索引'},{x:220,y:285,id:'plan',name:'项目计划'}]" :key="node.id" role="button" ta…</code> |
| [11](../src/previews/PreviewPanelContent.vue:11) | 界面文案 | 知识索引 | <code>…in [{x:150,y:155,id:'design',name:'插件系统设计'},{x:76,y:65,id:'writing',name:'写作流程'},{x:246,y:108,id:'index',name:'知识索引'},{x:220,y:285,id:'plan',name:'项目计划'}]" :key="node.id" role="button" tabindex="0" :aria-label="&#96;打开${node.nam…</code> |
| [11](../src/previews/PreviewPanelContent.vue:11) | 界面文案 | 项目计划 | <code>…件系统设计'},{x:76,y:65,id:'writing',name:'写作流程'},{x:246,y:108,id:'index',name:'知识索引'},{x:220,y:285,id:'plan',name:'项目计划'}]" :key="node.id" role="button" tabindex="0" :aria-label="&#96;打开${node.name}&#96;" :class="{ selected: file.id ===…</code> |
| [11](../src/previews/PreviewPanelContent.vue:11) | 界面文案 | 打开${node.name} | <code>…ex',name:'知识索引'},{x:220,y:285,id:'plan',name:'项目计划'}]" :key="node.id" role="button" tabindex="0" :aria-label="&#96;打开${node.name}&#96;" :class="{ selected: file.id === node.id }" @click="emit('openFile', node.id)" @keydown.enter="emit('openFi…</code> |
| [11](../src/previews/PreviewPanelContent.vue:11) | 界面文案 | 点击节点打开文件 | <code>…"node.x" :y="node.y+25" text-anchor="middle"&gt;{{ node.name }}&lt;/text&gt;&lt;/g&gt;&lt;/svg&gt;&lt;p class="preview-graph-caption"&gt;点击节点打开文件&lt;/p&gt;&lt;div class="preview-related"&gt;&lt;span&gt;当前文件&lt;/span&gt;&lt;strong&gt;{{ file.name }}&lt;/strong&gt;&lt;p&gt;与其他 3 个文件相连&lt;/p&gt;&lt;/div&gt;&lt;/te…</code> |
| [11](../src/previews/PreviewPanelContent.vue:11) | 界面文案 | 当前文件 | <code>…node.name }}&lt;/text&gt;&lt;/g&gt;&lt;/svg&gt;&lt;p class="preview-graph-caption"&gt;点击节点打开文件&lt;/p&gt;&lt;div class="preview-related"&gt;&lt;span&gt;当前文件&lt;/span&gt;&lt;strong&gt;{{ file.name }}&lt;/strong&gt;&lt;p&gt;与其他 3 个文件相连&lt;/p&gt;&lt;/div&gt;&lt;/template&gt;</code> |
| [11](../src/previews/PreviewPanelContent.vue:11) | 界面文案 | 与其他 3 个文件相连 | <code>…w-graph-caption"&gt;点击节点打开文件&lt;/p&gt;&lt;div class="preview-related"&gt;&lt;span&gt;当前文件&lt;/span&gt;&lt;strong&gt;{{ file.name }}&lt;/strong&gt;&lt;p&gt;与其他 3 个文件相连&lt;/p&gt;&lt;/div&gt;&lt;/template&gt;</code> |
| [12](../src/previews/PreviewPanelContent.vue:12) | 界面文案 | 全部标签 | <code>&lt;template v-else-if="id === 'tags'"&gt;&lt;div class="preview-section-title"&gt;&lt;h3&gt;全部标签&lt;/h3&gt;&lt;small&gt;{{ tags.length }}&lt;/small&gt;&lt;/div&gt;&lt;button v-for="tag in tags" :key="tag.name" class="preview-list-row…</code> |
| [12](../src/previews/PreviewPanelContent.vue:12) | 界面文案 | # | <code>…}&lt;/span&gt;&lt;small&gt;{{ tag.files.length }}&lt;/small&gt;&lt;/button&gt;&lt;div v-if="pickedTag" class="preview-tag-results"&gt;&lt;span&gt;#{{ pickedTag.name }} 中的文件&lt;/span&gt;&lt;button v-for="item in pickedTag.files" :key="item.id" @click="emit('openFile'…</code> |
| [12](../src/previews/PreviewPanelContent.vue:12) | 界面文案 | 中的文件 | <code>….files.length }}&lt;/small&gt;&lt;/button&gt;&lt;div v-if="pickedTag" class="preview-tag-results"&gt;&lt;span&gt;#{{ pickedTag.name }} 中的文件&lt;/span&gt;&lt;button v-for="item in pickedTag.files" :key="item.id" @click="emit('openFile', item.id)"&gt;&lt;File :size="…</code> |
| [13](../src/previews/PreviewPanelContent.vue:13) | 界面文案 | 链接到当前文件 | <code>&lt;template v-else-if="id === 'backlinks'"&gt;&lt;div class="preview-section-title"&gt;&lt;h3&gt;链接到当前文件&lt;/h3&gt;&lt;small&gt;3&lt;/small&gt;&lt;/div&gt;&lt;button v-for="item in files.filter(item =&gt; item.id !== file.id)" :key="item.id" cl…</code> |
| [13](../src/previews/PreviewPanelContent.vue:13) | 界面文案 | 3 | <code>&lt;template v-else-if="id === 'backlinks'"&gt;&lt;div class="preview-section-title"&gt;&lt;h3&gt;链接到当前文件&lt;/h3&gt;&lt;small&gt;3&lt;/small&gt;&lt;/div&gt;&lt;button v-for="item in files.filter(item =&gt; item.id !== file.id)" :key="item.id" class="preview-…</code> |
| [13](../src/previews/PreviewPanelContent.vue:13) | 界面文案 | 参见「 | <code>…d" class="preview-reference" @click="emit('openFile', item.id)"&gt;&lt;File :size="14"/&gt;&lt;span&gt;{{ item.name }}&lt;small&gt;参见「{{ file.title }}」中的界面与内容。&lt;/small&gt;&lt;/span&gt;&lt;ChevronRight :size="12"/&gt;&lt;/button&gt;&lt;/template&gt;</code> |
| [13](../src/previews/PreviewPanelContent.vue:13) | 界面文案 | 」中的界面与内容。 | <code>…eference" @click="emit('openFile', item.id)"&gt;&lt;File :size="14"/&gt;&lt;span&gt;{{ item.name }}&lt;small&gt;参见「{{ file.title }}」中的界面与内容。&lt;/small&gt;&lt;/span&gt;&lt;ChevronRight :size="12"/&gt;&lt;/button&gt;&lt;/template&gt;</code> |
| [14](../src/previews/PreviewPanelContent.vue:14) | 界面文案 | 当前文件大纲 | <code>&lt;template v-else&gt;&lt;div class="preview-section-title"&gt;&lt;h3&gt;当前文件大纲&lt;/h3&gt;&lt;/div&gt;&lt;button v-for="(heading,index) in [file.title, '界面与内容', '面板的工作方式', '下一步']" :key="heading" class="pr…</code> |
| [14](../src/previews/PreviewPanelContent.vue:14) | 界面文案 | 界面与内容 | <code>…v-else&gt;&lt;div class="preview-section-title"&gt;&lt;h3&gt;当前文件大纲&lt;/h3&gt;&lt;/div&gt;&lt;button v-for="(heading,index) in [file.title, '界面与内容', '面板的工作方式', '下一步']" :key="heading" class="preview-outline-row" @click="emit('scrollHeading', index)"&gt;&lt;Chevr…</code> |
| [14](../src/previews/PreviewPanelContent.vue:14) | 界面文案 | 面板的工作方式 | <code>…iv class="preview-section-title"&gt;&lt;h3&gt;当前文件大纲&lt;/h3&gt;&lt;/div&gt;&lt;button v-for="(heading,index) in [file.title, '界面与内容', '面板的工作方式', '下一步']" :key="heading" class="preview-outline-row" @click="emit('scrollHeading', index)"&gt;&lt;ChevronRight :si…</code> |
| [14](../src/previews/PreviewPanelContent.vue:14) | 界面文案 | 下一步 | <code>…review-section-title"&gt;&lt;h3&gt;当前文件大纲&lt;/h3&gt;&lt;/div&gt;&lt;button v-for="(heading,index) in [file.title, '界面与内容', '面板的工作方式', '下一步']" :key="heading" class="preview-outline-row" @click="emit('scrollHeading', index)"&gt;&lt;ChevronRight :size="12"…</code> |

<a id="src-previews-previewsidebargroup-vue"></a>

## src/previews/PreviewSidebarGroup.vue

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [12](../src/previews/PreviewSidebarGroup.vue:12) | 界面文案 | ${label}面板 | <code>&lt;div class="preview-region-switches" role="tablist" :aria-label="&#96;${label}面板&#96;"&gt;</code> |
| [16](../src/previews/PreviewSidebarGroup.vue:16) | 界面文案 | 在“管理侧栏”中添加面板 | <code>&lt;div class="preview-region-content"&gt;&lt;slot v-if="active"/&gt;&lt;div v-else class="preview-empty"&gt;&lt;p&gt;在“管理侧栏”中添加面板&lt;/p&gt;&lt;/div&gt;&lt;/div&gt;</code> |

<a id="src-quickpanels-vue"></a>

## src/QuickPanels.vue

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [29](../src/QuickPanels.vue:29) | 文案定义／其他 | 行内语法 | <code>{ get group() { return t('行内语法') }, get label() { return t('粗体') }, syntax: '**粗体**' },</code> |
| [29](../src/QuickPanels.vue:29) | 文案定义／其他 | 粗体 | <code>{ get group() { return t('行内语法') }, get label() { return t('粗体') }, syntax: '**粗体**' },</code> |
| [29](../src/QuickPanels.vue:29) | 文案定义／其他 | **粗体** | <code>{ get group() { return t('行内语法') }, get label() { return t('粗体') }, syntax: '**粗体**' },</code> |
| [30](../src/QuickPanels.vue:30) | 文案定义／其他 | 行内语法 | <code>{ get group() { return t('行内语法') }, get label() { return t('斜体') }, syntax: '*斜体*' },</code> |
| [30](../src/QuickPanels.vue:30) | 文案定义／其他 | 斜体 | <code>{ get group() { return t('行内语法') }, get label() { return t('斜体') }, syntax: '*斜体*' },</code> |
| [30](../src/QuickPanels.vue:30) | 文案定义／其他 | *斜体* | <code>{ get group() { return t('行内语法') }, get label() { return t('斜体') }, syntax: '*斜体*' },</code> |
| [31](../src/QuickPanels.vue:31) | 文案定义／其他 | 行内语法 | <code>{ get group() { return t('行内语法') }, get label() { return t('删除线') }, syntax: '~~删除线~~' },</code> |
| [31](../src/QuickPanels.vue:31) | 文案定义／其他 | 删除线 | <code>{ get group() { return t('行内语法') }, get label() { return t('删除线') }, syntax: '~~删除线~~' },</code> |
| [31](../src/QuickPanels.vue:31) | 文案定义／其他 | ~~删除线~~ | <code>{ get group() { return t('行内语法') }, get label() { return t('删除线') }, syntax: '~~删除线~~' },</code> |
| [32](../src/QuickPanels.vue:32) | 文案定义／其他 | 行内语法 | <code>{ get group() { return t('行内语法') }, get label() { return t('下划线') }, syntax: '&lt;u&gt;下划线&lt;/u&gt;' },</code> |
| [32](../src/QuickPanels.vue:32) | 文案定义／其他 | 下划线 | <code>{ get group() { return t('行内语法') }, get label() { return t('下划线') }, syntax: '&lt;u&gt;下划线&lt;/u&gt;' },</code> |
| [32](../src/QuickPanels.vue:32) | 文案定义／其他 | &lt;u&gt;下划线&lt;/u&gt; | <code>{ get group() { return t('行内语法') }, get label() { return t('下划线') }, syntax: '&lt;u&gt;下划线&lt;/u&gt;' },</code> |
| [33](../src/QuickPanels.vue:33) | 文案定义／其他 | 行内语法 | <code>{ get group() { return t('行内语法') }, get label() { return t('行内代码') }, syntax: '&#96;代码&#96;' },</code> |
| [33](../src/QuickPanels.vue:33) | 文案定义／其他 | 行内代码 | <code>{ get group() { return t('行内语法') }, get label() { return t('行内代码') }, syntax: '&#96;代码&#96;' },</code> |
| [33](../src/QuickPanels.vue:33) | 文案定义／其他 | &#96;代码&#96; | <code>{ get group() { return t('行内语法') }, get label() { return t('行内代码') }, syntax: '&#96;代码&#96;' },</code> |
| [34](../src/QuickPanels.vue:34) | 文案定义／其他 | 行内语法 | <code>{ get group() { return t('行内语法') }, get label() { return t('链接') }, syntax: '[文字](https://example.com)' },</code> |
| [34](../src/QuickPanels.vue:34) | 文案定义／其他 | 链接 | <code>{ get group() { return t('行内语法') }, get label() { return t('链接') }, syntax: '[文字](https://example.com)' },</code> |
| [34](../src/QuickPanels.vue:34) | 文案定义／其他 | [文字](https://example.com) | <code>{ get group() { return t('行内语法') }, get label() { return t('链接') }, syntax: '[文字](https://example.com)' },</code> |
| [35](../src/QuickPanels.vue:35) | 文案定义／其他 | 行内语法 | <code>{ get group() { return t('行内语法') }, get label() { return t('图片') }, syntax: '![说明](image.png)' },</code> |
| [35](../src/QuickPanels.vue:35) | 文案定义／其他 | 图片 | <code>{ get group() { return t('行内语法') }, get label() { return t('图片') }, syntax: '![说明](image.png)' },</code> |
| [35](../src/QuickPanels.vue:35) | 文案定义／其他 | ![说明](image.png) | <code>{ get group() { return t('行内语法') }, get label() { return t('图片') }, syntax: '![说明](image.png)' },</code> |
| [36](../src/QuickPanels.vue:36) | 文案定义／其他 | 行内语法 | <code>{ get group() { return t('行内语法') }, get label() { return t('自动链接') }, syntax: '&lt;https://example.com&gt;' },</code> |
| [36](../src/QuickPanels.vue:36) | 文案定义／其他 | 自动链接 | <code>{ get group() { return t('行内语法') }, get label() { return t('自动链接') }, syntax: '&lt;https://example.com&gt;' },</code> |
| [37](../src/QuickPanels.vue:37) | 文案定义／其他 | 行内语法 | <code>{ get group() { return t('行内语法') }, get label() { return t('脚注引用') }, syntax: '文字[^1]' },</code> |
| [37](../src/QuickPanels.vue:37) | 文案定义／其他 | 脚注引用 | <code>{ get group() { return t('行内语法') }, get label() { return t('脚注引用') }, syntax: '文字[^1]' },</code> |
| [37](../src/QuickPanels.vue:37) | 文案定义／其他 | 文字[^1] | <code>{ get group() { return t('行内语法') }, get label() { return t('脚注引用') }, syntax: '文字[^1]' },</code> |
| [38](../src/QuickPanels.vue:38) | 文案定义／其他 | 行内语法 | <code>{ get group() { return t('行内语法') }, get label() { return t('行内公式') }, syntax: '$E=mc^2$' },</code> |
| [38](../src/QuickPanels.vue:38) | 文案定义／其他 | 行内公式 | <code>{ get group() { return t('行内语法') }, get label() { return t('行内公式') }, syntax: '$E=mc^2$' },</code> |
| [39](../src/QuickPanels.vue:39) | 文案定义／其他 | 行内语法 | <code>{ get group() { return t('行内语法') }, get label() { return t('转义字符') }, syntax: '\\*原样星号\\*' },</code> |
| [39](../src/QuickPanels.vue:39) | 文案定义／其他 | 转义字符 | <code>{ get group() { return t('行内语法') }, get label() { return t('转义字符') }, syntax: '\\*原样星号\\*' },</code> |
| [39](../src/QuickPanels.vue:39) | 文案定义／其他 | \*原样星号\* | <code>{ get group() { return t('行内语法') }, get label() { return t('转义字符') }, syntax: '\\*原样星号\\*' },</code> |
| [40](../src/QuickPanels.vue:40) | 文案定义／其他 | 行内语法 | <code>{ get group() { return t('行内语法') }, get label() { return t('注释') }, syntax: '&lt;!-- 注释 --&gt;' },</code> |
| [40](../src/QuickPanels.vue:40) | 文案定义／其他 | 注释 | <code>{ get group() { return t('行内语法') }, get label() { return t('注释') }, syntax: '&lt;!-- 注释 --&gt;' },</code> |
| [40](../src/QuickPanels.vue:40) | 文案定义／其他 | &lt;!-- 注释 --&gt; | <code>{ get group() { return t('行内语法') }, get label() { return t('注释') }, syntax: '&lt;!-- 注释 --&gt;' },</code> |
| [41](../src/QuickPanels.vue:41) | 文案定义／其他 | 行内语法 | <code>{ get group() { return t('行内语法') }, get label() { return t('强制换行') }, syntax: '行末两个空格 + 回车' },</code> |
| [41](../src/QuickPanels.vue:41) | 文案定义／其他 | 强制换行 | <code>{ get group() { return t('行内语法') }, get label() { return t('强制换行') }, syntax: '行末两个空格 + 回车' },</code> |
| [41](../src/QuickPanels.vue:41) | 文案定义／其他 | 行末两个空格 + 回车 | <code>{ get group() { return t('行内语法') }, get label() { return t('强制换行') }, syntax: '行末两个空格 + 回车' },</code> |
| [42](../src/QuickPanels.vue:42) | 文案定义／其他 | 块级语法 | <code>{ get group() { return t('块级语法') }, get label() { return t('一级至六级标题') }, syntax: '# 标题　…　###### 标题' },</code> |
| [42](../src/QuickPanels.vue:42) | 文案定义／其他 | 一级至六级标题 | <code>{ get group() { return t('块级语法') }, get label() { return t('一级至六级标题') }, syntax: '# 标题　…　###### 标题' },</code> |
| [42](../src/QuickPanels.vue:42) | 文案定义／其他 | # 标题　…　###### 标题 | <code>{ get group() { return t('块级语法') }, get label() { return t('一级至六级标题') }, syntax: '# 标题　…　###### 标题' },</code> |
| [43](../src/QuickPanels.vue:43) | 文案定义／其他 | 块级语法 | <code>{ get group() { return t('块级语法') }, get label() { return t('普通段落') }, syntax: '空行分隔两个段落' },</code> |
| [43](../src/QuickPanels.vue:43) | 文案定义／其他 | 普通段落 | <code>{ get group() { return t('块级语法') }, get label() { return t('普通段落') }, syntax: '空行分隔两个段落' },</code> |
| [43](../src/QuickPanels.vue:43) | 文案定义／其他 | 空行分隔两个段落 | <code>{ get group() { return t('块级语法') }, get label() { return t('普通段落') }, syntax: '空行分隔两个段落' },</code> |
| [44](../src/QuickPanels.vue:44) | 文案定义／其他 | 块级语法 | <code>{ get group() { return t('块级语法') }, get label() { return t('引用块') }, syntax: '&gt; 引用内容' },</code> |
| [44](../src/QuickPanels.vue:44) | 文案定义／其他 | 引用块 | <code>{ get group() { return t('块级语法') }, get label() { return t('引用块') }, syntax: '&gt; 引用内容' },</code> |
| [44](../src/QuickPanels.vue:44) | 文案定义／其他 | &gt; 引用内容 | <code>{ get group() { return t('块级语法') }, get label() { return t('引用块') }, syntax: '&gt; 引用内容' },</code> |
| [45](../src/QuickPanels.vue:45) | 文案定义／其他 | 块级语法 | <code>{ get group() { return t('块级语法') }, get label() { return t('无序列表') }, syntax: '- 项目' },</code> |
| [45](../src/QuickPanels.vue:45) | 文案定义／其他 | 无序列表 | <code>{ get group() { return t('块级语法') }, get label() { return t('无序列表') }, syntax: '- 项目' },</code> |
| [45](../src/QuickPanels.vue:45) | 文案定义／其他 | - 项目 | <code>{ get group() { return t('块级语法') }, get label() { return t('无序列表') }, syntax: '- 项目' },</code> |
| [46](../src/QuickPanels.vue:46) | 文案定义／其他 | 块级语法 | <code>{ get group() { return t('块级语法') }, get label() { return t('有序列表') }, syntax: '1. 项目' },</code> |
| [46](../src/QuickPanels.vue:46) | 文案定义／其他 | 有序列表 | <code>{ get group() { return t('块级语法') }, get label() { return t('有序列表') }, syntax: '1. 项目' },</code> |
| [46](../src/QuickPanels.vue:46) | 文案定义／其他 | 1. 项目 | <code>{ get group() { return t('块级语法') }, get label() { return t('有序列表') }, syntax: '1. 项目' },</code> |
| [47](../src/QuickPanels.vue:47) | 文案定义／其他 | 块级语法 | <code>{ get group() { return t('块级语法') }, get label() { return t('任务列表') }, syntax: '- [ ] 待办　- [x] 完成' },</code> |
| [47](../src/QuickPanels.vue:47) | 文案定义／其他 | 任务列表 | <code>{ get group() { return t('块级语法') }, get label() { return t('任务列表') }, syntax: '- [ ] 待办　- [x] 完成' },</code> |
| [47](../src/QuickPanels.vue:47) | 文案定义／其他 | - [ ] 待办　- [x] 完成 | <code>{ get group() { return t('块级语法') }, get label() { return t('任务列表') }, syntax: '- [ ] 待办　- [x] 完成' },</code> |
| [48](../src/QuickPanels.vue:48) | 文案定义／其他 | 块级语法 | <code>{ get group() { return t('块级语法') }, get label() { return t('嵌套列表') }, syntax: '  - 子项目' },</code> |
| [48](../src/QuickPanels.vue:48) | 文案定义／其他 | 嵌套列表 | <code>{ get group() { return t('块级语法') }, get label() { return t('嵌套列表') }, syntax: '  - 子项目' },</code> |
| [48](../src/QuickPanels.vue:48) | 文案定义／其他 | - 子项目 | <code>{ get group() { return t('块级语法') }, get label() { return t('嵌套列表') }, syntax: '  - 子项目' },</code> |
| [49](../src/QuickPanels.vue:49) | 文案定义／其他 | 块级语法 | <code>{ get group() { return t('块级语法') }, get label() { return t('带语言的代码块') }, syntax: '&#96;&#96;&#96;js\n代码\n&#96;&#96;&#96;' },</code> |
| [49](../src/QuickPanels.vue:49) | 文案定义／其他 | 带语言的代码块 | <code>{ get group() { return t('块级语法') }, get label() { return t('带语言的代码块') }, syntax: '&#96;&#96;&#96;js\n代码\n&#96;&#96;&#96;' },</code> |
| [49](../src/QuickPanels.vue:49) | 文案定义／其他 | &#96;&#96;&#96;js<br>代码<br>&#96;&#96;&#96; | <code>{ get group() { return t('块级语法') }, get label() { return t('带语言的代码块') }, syntax: '&#96;&#96;&#96;js\n代码\n&#96;&#96;&#96;' },</code> |
| [50](../src/QuickPanels.vue:50) | 文案定义／其他 | 块级语法 | <code>{ get group() { return t('块级语法') }, get label() { return t('无语言代码块') }, syntax: '&#96;&#96;&#96;\n代码\n&#96;&#96;&#96;' },</code> |
| [50](../src/QuickPanels.vue:50) | 文案定义／其他 | 无语言代码块 | <code>{ get group() { return t('块级语法') }, get label() { return t('无语言代码块') }, syntax: '&#96;&#96;&#96;\n代码\n&#96;&#96;&#96;' },</code> |
| [50](../src/QuickPanels.vue:50) | 文案定义／其他 | &#96;&#96;&#96;<br>代码<br>&#96;&#96;&#96; | <code>{ get group() { return t('块级语法') }, get label() { return t('无语言代码块') }, syntax: '&#96;&#96;&#96;\n代码\n&#96;&#96;&#96;' },</code> |
| [51](../src/QuickPanels.vue:51) | 文案定义／其他 | 块级语法 | <code>{ get group() { return t('块级语法') }, get label() { return t('缩进代码块') }, syntax: '    代码' },</code> |
| [51](../src/QuickPanels.vue:51) | 文案定义／其他 | 缩进代码块 | <code>{ get group() { return t('块级语法') }, get label() { return t('缩进代码块') }, syntax: '    代码' },</code> |
| [51](../src/QuickPanels.vue:51) | 文案定义／其他 | 代码 | <code>{ get group() { return t('块级语法') }, get label() { return t('缩进代码块') }, syntax: '    代码' },</code> |
| [52](../src/QuickPanels.vue:52) | 文案定义／其他 | 块级语法 | <code>{ get group() { return t('块级语法') }, get label() { return t('表格') }, syntax: '&#124; 列 1 &#124; 列 2 &#124;\n&#124; --- &#124; --- &#124;' },</code> |
| [52](../src/QuickPanels.vue:52) | 文案定义／其他 | 表格 | <code>{ get group() { return t('块级语法') }, get label() { return t('表格') }, syntax: '&#124; 列 1 &#124; 列 2 &#124;\n&#124; --- &#124; --- &#124;' },</code> |
| [52](../src/QuickPanels.vue:52) | 文案定义／其他 | &#124; 列 1 &#124; 列 2 &#124;<br>&#124; --- &#124; --- &#124; | <code>{ get group() { return t('块级语法') }, get label() { return t('表格') }, syntax: '&#124; 列 1 &#124; 列 2 &#124;\n&#124; --- &#124; --- &#124;' },</code> |
| [53](../src/QuickPanels.vue:53) | 文案定义／其他 | 块级语法 | <code>{ get group() { return t('块级语法') }, get label() { return t('脚注定义') }, syntax: '[^1]: 脚注内容' },</code> |
| [53](../src/QuickPanels.vue:53) | 文案定义／其他 | 脚注定义 | <code>{ get group() { return t('块级语法') }, get label() { return t('脚注定义') }, syntax: '[^1]: 脚注内容' },</code> |
| [53](../src/QuickPanels.vue:53) | 文案定义／其他 | [^1]: 脚注内容 | <code>{ get group() { return t('块级语法') }, get label() { return t('脚注定义') }, syntax: '[^1]: 脚注内容' },</code> |
| [54](../src/QuickPanels.vue:54) | 文案定义／其他 | 块级语法 | <code>{ get group() { return t('块级语法') }, get label() { return t('公式块') }, syntax: '$$\nE=mc^2\n$$' },</code> |
| [54](../src/QuickPanels.vue:54) | 文案定义／其他 | 公式块 | <code>{ get group() { return t('块级语法') }, get label() { return t('公式块') }, syntax: '$$\nE=mc^2\n$$' },</code> |
| [55](../src/QuickPanels.vue:55) | 文案定义／其他 | 块级语法 | <code>{ get group() { return t('块级语法') }, get label() { return t('提示与警告框') }, syntax: '&gt; [!TIP]　[!NOTE]　[!WARNING]' },</code> |
| [55](../src/QuickPanels.vue:55) | 文案定义／其他 | 提示与警告框 | <code>{ get group() { return t('块级语法') }, get label() { return t('提示与警告框') }, syntax: '&gt; [!TIP]　[!NOTE]　[!WARNING]' },</code> |
| [56](../src/QuickPanels.vue:56) | 文案定义／其他 | 块级语法 | <code>{ get group() { return t('块级语法') }, get label() { return t('重要与注意框') }, syntax: '&gt; [!IMPORTANT]　[!CAUTION]' },</code> |
| [56](../src/QuickPanels.vue:56) | 文案定义／其他 | 重要与注意框 | <code>{ get group() { return t('块级语法') }, get label() { return t('重要与注意框') }, syntax: '&gt; [!IMPORTANT]　[!CAUTION]' },</code> |
| [57](../src/QuickPanels.vue:57) | 文案定义／其他 | 块级语法 | <code>{ get group() { return t('块级语法') }, get label() { return t('水平分割线') }, syntax: '---' }</code> |
| [57](../src/QuickPanels.vue:57) | 文案定义／其他 | 水平分割线 | <code>{ get group() { return t('块级语法') }, get label() { return t('水平分割线') }, syntax: '---' }</code> |
| [59](../src/QuickPanels.vue:59) | 文案定义／其他 | 行内语法 | <code>const syntaxGroups = computed(() =&gt; { const query = referenceSearch.value.trim().toLowerCase(); return ['行内语法', '块级语法'].map(group =&gt; ({ group, items: syntaxGuide.filter(item =&gt; item.group === group &amp;&amp; (!query &#124;&#124; &#96;${ite…</code> |
| [59](../src/QuickPanels.vue:59) | 文案定义／其他 | 块级语法 | <code>…nst syntaxGroups = computed(() =&gt; { const query = referenceSearch.value.trim().toLowerCase(); return ['行内语法', '块级语法'].map(group =&gt; ({ group, items: syntaxGuide.filter(item =&gt; item.group === group &amp;&amp; (!query &#124;&#124; &#96;${item.group}…</code> |
| [63](../src/QuickPanels.vue:63) | 界面文案 | 搜索操作… | <code>…class="command-search"&gt;&lt;Search :size="19"/&gt;&lt;input ref="commandInput" v-model="commandSearch" :placeholder="$t('搜索操作…')" @keydown.esc="emit('closeCommands')"/&gt;&lt;span&gt;ESC&lt;/span&gt;&lt;/div&gt;&lt;div class="command-list"&gt;&lt;button v-for="comm…</code> |
| [63](../src/QuickPanels.vue:63) | 界面文案 | ESC | <code>…"commandInput" v-model="commandSearch" :placeholder="$t('搜索操作…')" @keydown.esc="emit('closeCommands')"/&gt;&lt;span&gt;ESC&lt;/span&gt;&lt;/div&gt;&lt;div class="command-list"&gt;&lt;button v-for="command in filteredCommands" :key="command.id" @click="r…</code> |
| [63](../src/QuickPanels.vue:63) | 界面文案 | 使用 ⌘ K 快速打开 | <code>…nd.marker" class="command-markdown"&gt;{{ command.marker }}&lt;/code&gt;&lt;/button&gt;&lt;/div&gt;&lt;div class="command-hint"&gt;{{ $t('使用 ⌘ K 快速打开') }}&lt;/div&gt;&lt;/div&gt;&lt;/div&gt;</code> |
| [64](../src/QuickPanels.vue:64) | 界面文案 | 搜索语法或快捷键 | <code>…"reference-search"&gt;&lt;Search :size="16"/&gt;&lt;input ref="referenceInput" v-model="referenceSearch" :placeholder="$t('搜索语法或快捷键')" :aria-label="$t('搜索 Markdown 语法和快捷键')" @keydown.esc="emit('closeReference')"/&gt;&lt;span class="reference-esc"…</code> |
| [64](../src/QuickPanels.vue:64) | 界面文案 | 搜索 Markdown 语法和快捷键 | <code>…ize="16"/&gt;&lt;input ref="referenceInput" v-model="referenceSearch" :placeholder="$t('搜索语法或快捷键')" :aria-label="$t('搜索 Markdown 语法和快捷键')" @keydown.esc="emit('closeReference')"/&gt;&lt;span class="reference-esc"&gt;ESC&lt;/span&gt;&lt;/div&gt;&lt;div class="reference-…</code> |
| [64](../src/QuickPanels.vue:64) | 界面文案 | ESC | <code>…')" :aria-label="$t('搜索 Markdown 语法和快捷键')" @keydown.esc="emit('closeReference')"/&gt;&lt;span class="reference-esc"&gt;ESC&lt;/span&gt;&lt;/div&gt;&lt;div class="reference-tabs"&gt;&lt;button :class="{ active: referenceTab === 'syntax' }" @click="emit('…</code> |
| [64](../src/QuickPanels.vue:64) | 界面文案 | Markdown 语法 | <code>…"&gt;&lt;button :class="{ active: referenceTab === 'syntax' }" @click="emit('update:referenceTab', 'syntax')"&gt;{{ $t('Markdown 语法') }}&lt;/button&gt;&lt;button :class="{ active: referenceTab === 'shortcuts' }" @click="emit('update:referenceTab', '…</code> |
| [64](../src/QuickPanels.vue:64) | 界面文案 | 快捷键 | <code>…ton :class="{ active: referenceTab === 'shortcuts' }" @click="emit('update:referenceTab', 'shortcuts')"&gt;{{ $t('快捷键') }}&lt;/button&gt;&lt;/div&gt;&lt;div class="reference-list"&gt;&lt;template v-if="referenceTab === 'syntax'"&gt;&lt;section v-for="se…</code> |

<a id="src-settings-fontpicker-vue"></a>

## src/settings/FontPicker.vue

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [12](../src/settings/FontPicker.vue:12) | 文案定义／其他 | 系统默认 | <code>const defaults = computed(() =&gt; [{ value: props.defaultValue, get label() { return t('系统默认') } }, { value: 'ui-monospace', get label() { return t('等宽字体') } }])</code> |
| [12](../src/settings/FontPicker.vue:12) | 文案定义／其他 | 等宽字体 | <code>const defaults = computed(() =&gt; [{ value: props.defaultValue, get label() { return t('系统默认') } }, { value: 'ui-monospace', get label() { return t('等宽字体') } }])</code> |
| [56](../src/settings/FontPicker.vue:56) | 界面文案 | 字体预览 | <code>&lt;div v-else class="font-picker-preview" :style="{ fontFamily: cssFont(previewFont) }" :aria-label="$t('字体预览')"&gt;&lt;div&gt;{{ $t('文字预览，让阅读更舒适。') }}&lt;/div&gt;&lt;div&gt;The quick brown fox · 0123456789&lt;/div&gt;&lt;/div&gt;</code> |
| [56](../src/settings/FontPicker.vue:56) | 界面文案 | 文字预览，让阅读更舒适。 | <code>&lt;div v-else class="font-picker-preview" :style="{ fontFamily: cssFont(previewFont) }" :aria-label="$t('字体预览')"&gt;&lt;div&gt;{{ $t('文字预览，让阅读更舒适。') }}&lt;/div&gt;&lt;div&gt;The quick brown fox · 0123456789&lt;/div&gt;&lt;/div&gt;</code> |
| [56](../src/settings/FontPicker.vue:56) | 界面文案 | The quick brown fox · 0123456789 | <code>&lt;div v-else class="font-picker-preview" :style="{ fontFamily: cssFont(previewFont) }" :aria-label="$t('字体预览')"&gt;&lt;div&gt;{{ $t('文字预览，让阅读更舒适。') }}&lt;/div&gt;&lt;div&gt;The quick brown fox · 0123456789&lt;/div&gt;&lt;/div&gt;</code> |
| [57](../src/settings/FontPicker.vue:57) | 界面文案 | 搜索字体 | <code>…key"&gt;&lt;div class="font-picker-search"&gt;&lt;Search :size="14"/&gt;&lt;input ref="search" v-model="query" :placeholder="$t('搜索字体')" :aria-label="&#96;搜索${label}&#96;" @input="active = 0; preview(null)"/&gt;&lt;/div&gt;&lt;div class="font-picker-options" rol…</code> |
| [57](../src/settings/FontPicker.vue:57) | 界面文案 | 搜索${label} | <code>…picker-search"&gt;&lt;Search :size="14"/&gt;&lt;input ref="search" v-model="query" :placeholder="$t('搜索字体')" :aria-label="&#96;搜索${label}&#96;" @input="active = 0; preview(null)"/&gt;&lt;/div&gt;&lt;div class="font-picker-options" role="listbox" :aria-label="lab…</code> |
| [57](../src/settings/FontPicker.vue:57) | 界面文案 | 未找到匹配字体 | <code>…="modelValue === item.value" :size="14"/&gt;&lt;/button&gt;&lt;div v-if="!options.length" class="font-picker-empty"&gt;{{ $t('未找到匹配字体') }}&lt;/div&gt;&lt;div v-if="loading" class="font-picker-empty"&gt;{{ $t('正在读取本机字体…') }}&lt;/div&gt;&lt;/div&gt;&lt;/div&gt;&lt;/Teleport&gt;</code> |
| [57](../src/settings/FontPicker.vue:57) | 界面文案 | 正在读取本机字体… | <code>…ength" class="font-picker-empty"&gt;{{ $t('未找到匹配字体') }}&lt;/div&gt;&lt;div v-if="loading" class="font-picker-empty"&gt;{{ $t('正在读取本机字体…') }}&lt;/div&gt;&lt;/div&gt;&lt;/div&gt;&lt;/Teleport&gt;</code> |

<a id="src-settings-shortcuts-ts"></a>

## src/settings/shortcuts.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [3](../src/settings/shortcuts.ts:3) | 文案定义／其他 | 切换侧栏 | <code>{ id: 'sidebar', get label() { return t('切换侧栏') }, get category() { return t('界面与视图') }, defaultChord: 'Meta+Backslash' },</code> |
| [3](../src/settings/shortcuts.ts:3) | 文案定义／其他 | 界面与视图 | <code>{ id: 'sidebar', get label() { return t('切换侧栏') }, get category() { return t('界面与视图') }, defaultChord: 'Meta+Backslash' },</code> |
| [4](../src/settings/shortcuts.ts:4) | 文案定义／其他 | 偏好设置 | <code>{ id: 'settings', get label() { return t('偏好设置') }, get category() { return t('界面与视图') }, defaultChord: 'Meta+Comma' },</code> |
| [4](../src/settings/shortcuts.ts:4) | 文案定义／其他 | 界面与视图 | <code>{ id: 'settings', get label() { return t('偏好设置') }, get category() { return t('界面与视图') }, defaultChord: 'Meta+Comma' },</code> |
| [5](../src/settings/shortcuts.ts:5) | 文案定义／其他 | 打开文件 | <code>{ id: 'openFile', get label() { return t('打开文件') }, get category() { return t('文件') }, defaultChord: 'Meta+Shift+KeyO' },</code> |
| [5](../src/settings/shortcuts.ts:5) | 文案定义／其他 | 文件 | <code>{ id: 'openFile', get label() { return t('打开文件') }, get category() { return t('文件') }, defaultChord: 'Meta+Shift+KeyO' },</code> |
| [6](../src/settings/shortcuts.ts:6) | 文案定义／其他 | 打开文件夹 | <code>{ id: 'openFolder', get label() { return t('打开文件夹') }, get category() { return t('文件') }, defaultChord: 'Meta+KeyO' },</code> |
| [6](../src/settings/shortcuts.ts:6) | 文案定义／其他 | 文件 | <code>{ id: 'openFolder', get label() { return t('打开文件夹') }, get category() { return t('文件') }, defaultChord: 'Meta+KeyO' },</code> |
| [7](../src/settings/shortcuts.ts:7) | 文案定义／其他 | 最近打开文件夹 | <code>{ id: 'recentFolders', get label() { return t('最近打开文件夹') }, get category() { return t('文件') }, defaultChord: 'Meta+Alt+KeyO' },</code> |
| [7](../src/settings/shortcuts.ts:7) | 文案定义／其他 | 文件 | <code>{ id: 'recentFolders', get label() { return t('最近打开文件夹') }, get category() { return t('文件') }, defaultChord: 'Meta+Alt+KeyO' },</code> |
| [8](../src/settings/shortcuts.ts:8) | 文案定义／其他 | 历史版本 | <code>{ id: 'history', get label() { return t('历史版本') }, get category() { return t('文件') }, defaultChord: 'Meta+Shift+KeyH' },</code> |
| [8](../src/settings/shortcuts.ts:8) | 文案定义／其他 | 文件 | <code>{ id: 'history', get label() { return t('历史版本') }, get category() { return t('文件') }, defaultChord: 'Meta+Shift+KeyH' },</code> |
| [9](../src/settings/shortcuts.ts:9) | 文案定义／其他 | 最近打开文件 | <code>{ id: 'recentFiles', get label() { return t('最近打开文件') }, get category() { return t('文件') }, defaultChord: 'Meta+Shift+KeyR' },</code> |
| [9](../src/settings/shortcuts.ts:9) | 文案定义／其他 | 文件 | <code>{ id: 'recentFiles', get label() { return t('最近打开文件') }, get category() { return t('文件') }, defaultChord: 'Meta+Shift+KeyR' },</code> |
| [10](../src/settings/shortcuts.ts:10) | 文案定义／其他 | 搜索文件与内容 | <code>{ id: 'workspaceSearch', get label() { return t('搜索文件与内容') }, get category() { return t('搜索与校对') }, defaultChord: 'Meta+Shift+KeyF' },</code> |
| [10](../src/settings/shortcuts.ts:10) | 文案定义／其他 | 搜索与校对 | <code>{ id: 'workspaceSearch', get label() { return t('搜索文件与内容') }, get category() { return t('搜索与校对') }, defaultChord: 'Meta+Shift+KeyF' },</code> |
| [11](../src/settings/shortcuts.ts:11) | 文案定义／其他 | 文内查找 | <code>{ id: 'find', get label() { return t('文内查找') }, get category() { return t('搜索与校对') }, defaultChord: 'Meta+KeyF' },</code> |
| [11](../src/settings/shortcuts.ts:11) | 文案定义／其他 | 搜索与校对 | <code>{ id: 'find', get label() { return t('文内查找') }, get category() { return t('搜索与校对') }, defaultChord: 'Meta+KeyF' },</code> |
| [12](../src/settings/shortcuts.ts:12) | 文案定义／其他 | 检查当前文件拼写 | <code>{ id: 'spellcheck', get label() { return t('检查当前文件拼写') }, get category() { return t('搜索与校对') }, defaultChord: 'Meta+Shift+KeyP' },</code> |
| [12](../src/settings/shortcuts.ts:12) | 文案定义／其他 | 搜索与校对 | <code>{ id: 'spellcheck', get label() { return t('检查当前文件拼写') }, get category() { return t('搜索与校对') }, defaultChord: 'Meta+Shift+KeyP' },</code> |
| [13](../src/settings/shortcuts.ts:13) | 文案定义／其他 | 文件排序 | <code>{ id: 'sort', get label() { return t('文件排序') }, get category() { return t('文件') }, defaultChord: 'Meta+Alt+KeyS' },</code> |
| [13](../src/settings/shortcuts.ts:13) | 文案定义／其他 | 文件 | <code>{ id: 'sort', get label() { return t('文件排序') }, get category() { return t('文件') }, defaultChord: 'Meta+Alt+KeyS' },</code> |
| [14](../src/settings/shortcuts.ts:14) | 文案定义／其他 | 新建文件或文件夹 | <code>{ id: 'new', get label() { return t('新建文件或文件夹') }, get category() { return t('文件') }, defaultChord: 'Meta+KeyN' },</code> |
| [14](../src/settings/shortcuts.ts:14) | 文案定义／其他 | 文件 | <code>{ id: 'new', get label() { return t('新建文件或文件夹') }, get category() { return t('文件') }, defaultChord: 'Meta+KeyN' },</code> |
| [15](../src/settings/shortcuts.ts:15) | 文案定义／其他 | 新建窗口 | <code>{ id: 'newWindow', get label() { return t('新建窗口') }, get category() { return t('文件') }, defaultChord: 'Meta+Shift+KeyN' },</code> |
| [15](../src/settings/shortcuts.ts:15) | 文案定义／其他 | 文件 | <code>{ id: 'newWindow', get label() { return t('新建窗口') }, get category() { return t('文件') }, defaultChord: 'Meta+Shift+KeyN' },</code> |
| [16](../src/settings/shortcuts.ts:16) | 文案定义／其他 | 关闭当前文件 | <code>{ id: 'closeFile', get label() { return t('关闭当前文件') }, get category() { return t('文件') }, defaultChord: 'Meta+KeyW' },</code> |
| [16](../src/settings/shortcuts.ts:16) | 文案定义／其他 | 文件 | <code>{ id: 'closeFile', get label() { return t('关闭当前文件') }, get category() { return t('文件') }, defaultChord: 'Meta+KeyW' },</code> |
| [17](../src/settings/shortcuts.ts:17) | 文案定义／其他 | 另存为 | <code>{ id: 'saveAs', get label() { return t('另存为') }, get category() { return t('文件') }, defaultChord: 'Meta+Shift+KeyS' },</code> |
| [17](../src/settings/shortcuts.ts:17) | 文案定义／其他 | 文件 | <code>{ id: 'saveAs', get label() { return t('另存为') }, get category() { return t('文件') }, defaultChord: 'Meta+Shift+KeyS' },</code> |
| [18](../src/settings/shortcuts.ts:18) | 文案定义／其他 | 切换编辑视图 | <code>{ id: 'mode', get label() { return t('切换编辑视图') }, get category() { return t('界面与视图') }, defaultChord: 'Meta+Shift+KeyM' },</code> |
| [18](../src/settings/shortcuts.ts:18) | 文案定义／其他 | 界面与视图 | <code>{ id: 'mode', get label() { return t('切换编辑视图') }, get category() { return t('界面与视图') }, defaultChord: 'Meta+Shift+KeyM' },</code> |
| [19](../src/settings/shortcuts.ts:19) | 文案定义／其他 | 切换到所见即所得 | <code>{ id: 'wysiwygView', get label() { return t('切换到所见即所得') }, get category() { return t('界面与视图') }, defaultChord: '' },</code> |
| [19](../src/settings/shortcuts.ts:19) | 文案定义／其他 | 界面与视图 | <code>{ id: 'wysiwygView', get label() { return t('切换到所见即所得') }, get category() { return t('界面与视图') }, defaultChord: '' },</code> |
| [20](../src/settings/shortcuts.ts:20) | 文案定义／其他 | 切换到源代码 | <code>{ id: 'sourceView', get label() { return t('切换到源代码') }, get category() { return t('界面与视图') }, defaultChord: '' },</code> |
| [20](../src/settings/shortcuts.ts:20) | 文案定义／其他 | 界面与视图 | <code>{ id: 'sourceView', get label() { return t('切换到源代码') }, get category() { return t('界面与视图') }, defaultChord: '' },</code> |
| [21](../src/settings/shortcuts.ts:21) | 文案定义／其他 | 切换到分栏视图 | <code>{ id: 'splitView', get label() { return t('切换到分栏视图') }, get category() { return t('界面与视图') }, defaultChord: '' },</code> |
| [21](../src/settings/shortcuts.ts:21) | 文案定义／其他 | 界面与视图 | <code>{ id: 'splitView', get label() { return t('切换到分栏视图') }, get category() { return t('界面与视图') }, defaultChord: '' },</code> |
| [22](../src/settings/shortcuts.ts:22) | 文案定义／其他 | 切换文件视图 | <code>{ id: 'sideView', get label() { return t('切换文件视图') }, get category() { return t('界面与视图') }, defaultChord: 'Meta+Shift+KeyL' },</code> |
| [22](../src/settings/shortcuts.ts:22) | 文案定义／其他 | 界面与视图 | <code>{ id: 'sideView', get label() { return t('切换文件视图') }, get category() { return t('界面与视图') }, defaultChord: 'Meta+Shift+KeyL' },</code> |
| [23](../src/settings/shortcuts.ts:23) | 文案定义／其他 | 主题 | <code>{ id: 'theme', get label() { return t('主题') }, get category() { return t('界面与视图') }, defaultChord: 'Meta+Shift+KeyT' },</code> |
| [23](../src/settings/shortcuts.ts:23) | 文案定义／其他 | 界面与视图 | <code>{ id: 'theme', get label() { return t('主题') }, get category() { return t('界面与视图') }, defaultChord: 'Meta+Shift+KeyT' },</code> |
| [24](../src/settings/shortcuts.ts:24) | 文案定义／其他 | Markdown 速查 | <code>{ id: 'reference', get label() { return t('Markdown 速查') }, get category() { return t('辅助工具') }, defaultChord: 'Meta+Slash' },</code> |
| [24](../src/settings/shortcuts.ts:24) | 文案定义／其他 | 辅助工具 | <code>{ id: 'reference', get label() { return t('Markdown 速查') }, get category() { return t('辅助工具') }, defaultChord: 'Meta+Slash' },</code> |
| [25](../src/settings/shortcuts.ts:25) | 文案定义／其他 | 导出 | <code>{ id: 'export', get label() { return t('导出') }, get category() { return t('文件') }, defaultChord: 'Meta+KeyE' },</code> |
| [25](../src/settings/shortcuts.ts:25) | 文案定义／其他 | 文件 | <code>{ id: 'export', get label() { return t('导出') }, get category() { return t('文件') }, defaultChord: 'Meta+KeyE' },</code> |
| [26](../src/settings/shortcuts.ts:26) | 文案定义／其他 | 专注模式 | <code>{ id: 'focus', get label() { return t('专注模式') }, get category() { return t('界面与视图') }, defaultChord: 'Meta+Shift+KeyD' },</code> |
| [26](../src/settings/shortcuts.ts:26) | 文案定义／其他 | 界面与视图 | <code>{ id: 'focus', get label() { return t('专注模式') }, get category() { return t('界面与视图') }, defaultChord: 'Meta+Shift+KeyD' },</code> |
| [27](../src/settings/shortcuts.ts:27) | 文案定义／其他 | 命令菜单 | <code>{ id: 'commands', get label() { return t('命令菜单') }, get category() { return t('界面与视图') }, defaultChord: 'Meta+KeyK' },</code> |
| [27](../src/settings/shortcuts.ts:27) | 文案定义／其他 | 界面与视图 | <code>{ id: 'commands', get label() { return t('命令菜单') }, get category() { return t('界面与视图') }, defaultChord: 'Meta+KeyK' },</code> |
| [28](../src/settings/shortcuts.ts:28) | 文案定义／其他 | 保存 | <code>{ id: 'save', get label() { return t('保存') }, get category() { return t('文件') }, defaultChord: 'Meta+KeyS' },</code> |
| [28](../src/settings/shortcuts.ts:28) | 文案定义／其他 | 文件 | <code>{ id: 'save', get label() { return t('保存') }, get category() { return t('文件') }, defaultChord: 'Meta+KeyS' },</code> |
| [29](../src/settings/shortcuts.ts:29) | 文案定义／其他 | 显示或隐藏工具栏 | <code>{ id: 'toggleToolbar', get label() { return t('显示或隐藏工具栏') }, get category() { return t('界面与视图') }, defaultChord: '' },</code> |
| [29](../src/settings/shortcuts.ts:29) | 文案定义／其他 | 界面与视图 | <code>{ id: 'toggleToolbar', get label() { return t('显示或隐藏工具栏') }, get category() { return t('界面与视图') }, defaultChord: '' },</code> |
| [30](../src/settings/shortcuts.ts:30) | 文案定义／其他 | 粗体 | <code>{ id: 'bold', get label() { return t('粗体') }, get category() { return t('编辑与格式') }, defaultChord: 'Meta+KeyB' },</code> |
| [30](../src/settings/shortcuts.ts:30) | 文案定义／其他 | 编辑与格式 | <code>{ id: 'bold', get label() { return t('粗体') }, get category() { return t('编辑与格式') }, defaultChord: 'Meta+KeyB' },</code> |
| [31](../src/settings/shortcuts.ts:31) | 文案定义／其他 | 斜体 | <code>{ id: 'italic', get label() { return t('斜体') }, get category() { return t('编辑与格式') }, defaultChord: 'Meta+KeyI' },</code> |
| [31](../src/settings/shortcuts.ts:31) | 文案定义／其他 | 编辑与格式 | <code>{ id: 'italic', get label() { return t('斜体') }, get category() { return t('编辑与格式') }, defaultChord: 'Meta+KeyI' },</code> |
| [32](../src/settings/shortcuts.ts:32) | 文案定义／其他 | 删除线 | <code>{ id: 'strikethrough', get label() { return t('删除线') }, get category() { return t('编辑与格式') }, defaultChord: 'Meta+Shift+KeyX' },</code> |
| [32](../src/settings/shortcuts.ts:32) | 文案定义／其他 | 编辑与格式 | <code>{ id: 'strikethrough', get label() { return t('删除线') }, get category() { return t('编辑与格式') }, defaultChord: 'Meta+Shift+KeyX' },</code> |
| [33](../src/settings/shortcuts.ts:33) | 文案定义／其他 | 下划线 | <code>{ id: 'underline', get label() { return t('下划线') }, get category() { return t('编辑与格式') }, defaultChord: 'Meta+KeyU' },</code> |
| [33](../src/settings/shortcuts.ts:33) | 文案定义／其他 | 编辑与格式 | <code>{ id: 'underline', get label() { return t('下划线') }, get category() { return t('编辑与格式') }, defaultChord: 'Meta+KeyU' },</code> |
| [34](../src/settings/shortcuts.ts:34) | 文案定义／其他 | 行内代码 | <code>{ id: 'inlineCode', get label() { return t('行内代码') }, get category() { return t('编辑与格式') }, defaultChord: '' },</code> |
| [34](../src/settings/shortcuts.ts:34) | 文案定义／其他 | 编辑与格式 | <code>{ id: 'inlineCode', get label() { return t('行内代码') }, get category() { return t('编辑与格式') }, defaultChord: '' },</code> |
| [35](../src/settings/shortcuts.ts:35) | 文案定义／其他 | 清除格式 | <code>{ id: 'clearFormat', get label() { return t('清除格式') }, get category() { return t('编辑与格式') }, defaultChord: '' },</code> |
| [35](../src/settings/shortcuts.ts:35) | 文案定义／其他 | 编辑与格式 | <code>{ id: 'clearFormat', get label() { return t('清除格式') }, get category() { return t('编辑与格式') }, defaultChord: '' },</code> |
| [36](../src/settings/shortcuts.ts:36) | 文案定义／其他 | 链接 | <code>{ id: 'link', get label() { return t('链接') }, get category() { return t('插入') }, defaultChord: 'Meta+KeyL' },</code> |
| [36](../src/settings/shortcuts.ts:36) | 文案定义／其他 | 插入 | <code>{ id: 'link', get label() { return t('链接') }, get category() { return t('插入') }, defaultChord: 'Meta+KeyL' },</code> |
| [37](../src/settings/shortcuts.ts:37) | 文案定义／其他 | 图片 | <code>{ id: 'image', get label() { return t('图片') }, get category() { return t('插入') }, defaultChord: '' },</code> |
| [37](../src/settings/shortcuts.ts:37) | 文案定义／其他 | 插入 | <code>{ id: 'image', get label() { return t('图片') }, get category() { return t('插入') }, defaultChord: '' },</code> |
| [38](../src/settings/shortcuts.ts:38) | 文案定义／其他 | 表格 | <code>{ id: 'table', get label() { return t('表格') }, get category() { return t('插入') }, defaultChord: '' },</code> |
| [38](../src/settings/shortcuts.ts:38) | 文案定义／其他 | 插入 | <code>{ id: 'table', get label() { return t('表格') }, get category() { return t('插入') }, defaultChord: '' },</code> |
| [39](../src/settings/shortcuts.ts:39) | 文案定义／其他 | 代码块 | <code>{ id: 'codeBlock', get label() { return t('代码块') }, get category() { return t('插入') }, defaultChord: '' },</code> |
| [39](../src/settings/shortcuts.ts:39) | 文案定义／其他 | 插入 | <code>{ id: 'codeBlock', get label() { return t('代码块') }, get category() { return t('插入') }, defaultChord: '' },</code> |
| [40](../src/settings/shortcuts.ts:40) | 文案定义／其他 | 公式块 | <code>{ id: 'formula', get label() { return t('公式块') }, get category() { return t('插入') }, defaultChord: '' },</code> |
| [40](../src/settings/shortcuts.ts:40) | 文案定义／其他 | 插入 | <code>{ id: 'formula', get label() { return t('公式块') }, get category() { return t('插入') }, defaultChord: '' },</code> |
| [41](../src/settings/shortcuts.ts:41) | 文案定义／其他 | 提示框 | <code>{ id: 'calloutTip', get label() { return t('提示框') }, get category() { return t('插入') }, defaultChord: '' },</code> |
| [41](../src/settings/shortcuts.ts:41) | 文案定义／其他 | 插入 | <code>{ id: 'calloutTip', get label() { return t('提示框') }, get category() { return t('插入') }, defaultChord: '' },</code> |
| [42](../src/settings/shortcuts.ts:42) | 文案定义／其他 | 备注框 | <code>{ id: 'calloutNote', get label() { return t('备注框') }, get category() { return t('插入') }, defaultChord: '' },</code> |
| [42](../src/settings/shortcuts.ts:42) | 文案定义／其他 | 插入 | <code>{ id: 'calloutNote', get label() { return t('备注框') }, get category() { return t('插入') }, defaultChord: '' },</code> |
| [43](../src/settings/shortcuts.ts:43) | 文案定义／其他 | 重要框 | <code>{ id: 'calloutImportant', get label() { return t('重要框') }, get category() { return t('插入') }, defaultChord: '' },</code> |
| [43](../src/settings/shortcuts.ts:43) | 文案定义／其他 | 插入 | <code>{ id: 'calloutImportant', get label() { return t('重要框') }, get category() { return t('插入') }, defaultChord: '' },</code> |
| [44](../src/settings/shortcuts.ts:44) | 状态文案 | 警告框 | <code>{ id: 'calloutWarning', get label() { return t('警告框') }, get category() { return t('插入') }, defaultChord: '' },</code> |
| [44](../src/settings/shortcuts.ts:44) | 状态文案 | 插入 | <code>{ id: 'calloutWarning', get label() { return t('警告框') }, get category() { return t('插入') }, defaultChord: '' },</code> |
| [45](../src/settings/shortcuts.ts:45) | 文案定义／其他 | 注意框 | <code>{ id: 'calloutCaution', get label() { return t('注意框') }, get category() { return t('插入') }, defaultChord: '' },</code> |
| [45](../src/settings/shortcuts.ts:45) | 文案定义／其他 | 插入 | <code>{ id: 'calloutCaution', get label() { return t('注意框') }, get category() { return t('插入') }, defaultChord: '' },</code> |
| [46](../src/settings/shortcuts.ts:46) | 文案定义／其他 | 引用 | <code>{ id: 'quote', get label() { return t('引用') }, get category() { return t('段落') }, defaultChord: 'Meta+Shift+KeyQ' },</code> |
| [46](../src/settings/shortcuts.ts:46) | 文案定义／其他 | 段落 | <code>{ id: 'quote', get label() { return t('引用') }, get category() { return t('段落') }, defaultChord: 'Meta+Shift+KeyQ' },</code> |
| [47](../src/settings/shortcuts.ts:47) | 文案定义／其他 | 无序列表 | <code>{ id: 'unorderedList', get label() { return t('无序列表') }, get category() { return t('段落') }, defaultChord: 'Meta+Shift+Digit7' },</code> |
| [47](../src/settings/shortcuts.ts:47) | 文案定义／其他 | 段落 | <code>{ id: 'unorderedList', get label() { return t('无序列表') }, get category() { return t('段落') }, defaultChord: 'Meta+Shift+Digit7' },</code> |
| [48](../src/settings/shortcuts.ts:48) | 文案定义／其他 | 有序列表 | <code>{ id: 'orderedList', get label() { return t('有序列表') }, get category() { return t('段落') }, defaultChord: 'Meta+Shift+Digit8' },</code> |
| [48](../src/settings/shortcuts.ts:48) | 文案定义／其他 | 段落 | <code>{ id: 'orderedList', get label() { return t('有序列表') }, get category() { return t('段落') }, defaultChord: 'Meta+Shift+Digit8' },</code> |
| [49](../src/settings/shortcuts.ts:49) | 文案定义／其他 | 任务列表 | <code>{ id: 'taskList', get label() { return t('任务列表') }, get category() { return t('段落') }, defaultChord: 'Meta+Shift+Digit9' },</code> |
| [49](../src/settings/shortcuts.ts:49) | 文案定义／其他 | 段落 | <code>{ id: 'taskList', get label() { return t('任务列表') }, get category() { return t('段落') }, defaultChord: 'Meta+Shift+Digit9' },</code> |
| [50](../src/settings/shortcuts.ts:50) | 文案定义／其他 | 增加列表缩进 | <code>{ id: 'indentList', get label() { return t('增加列表缩进') }, get category() { return t('段落') }, defaultChord: 'Meta+BracketRight' },</code> |
| [50](../src/settings/shortcuts.ts:50) | 文案定义／其他 | 段落 | <code>{ id: 'indentList', get label() { return t('增加列表缩进') }, get category() { return t('段落') }, defaultChord: 'Meta+BracketRight' },</code> |
| [51](../src/settings/shortcuts.ts:51) | 文案定义／其他 | 减少列表缩进 | <code>{ id: 'outdentList', get label() { return t('减少列表缩进') }, get category() { return t('段落') }, defaultChord: 'Meta+BracketLeft' },</code> |
| [51](../src/settings/shortcuts.ts:51) | 文案定义／其他 | 段落 | <code>{ id: 'outdentList', get label() { return t('减少列表缩进') }, get category() { return t('段落') }, defaultChord: 'Meta+BracketLeft' },</code> |
| [52](../src/settings/shortcuts.ts:52) | 文案定义／其他 | 增加标题级别 | <code>{ id: 'headingIncrease', get label() { return t('增加标题级别') }, get category() { return t('段落') }, defaultChord: 'Alt+ArrowDown' },</code> |
| [52](../src/settings/shortcuts.ts:52) | 文案定义／其他 | 段落 | <code>{ id: 'headingIncrease', get label() { return t('增加标题级别') }, get category() { return t('段落') }, defaultChord: 'Alt+ArrowDown' },</code> |
| [53](../src/settings/shortcuts.ts:53) | 文案定义／其他 | 降低标题级别 | <code>{ id: 'headingDecrease', get label() { return t('降低标题级别') }, get category() { return t('段落') }, defaultChord: 'Alt+ArrowUp' },</code> |
| [53](../src/settings/shortcuts.ts:53) | 文案定义／其他 | 段落 | <code>{ id: 'headingDecrease', get label() { return t('降低标题级别') }, get category() { return t('段落') }, defaultChord: 'Alt+ArrowUp' },</code> |
| [54](../src/settings/shortcuts.ts:54) | 文案定义／其他 | 插入脚注 | <code>{ id: 'footnote', get label() { return t('插入脚注') }, get category() { return t('插入') }, defaultChord: 'Meta+Alt+KeyF' },</code> |
| [54](../src/settings/shortcuts.ts:54) | 文案定义／其他 | 插入 | <code>{ id: 'footnote', get label() { return t('插入脚注') }, get category() { return t('插入') }, defaultChord: 'Meta+Alt+KeyF' },</code> |
| [55](../src/settings/shortcuts.ts:55) | 文案定义／其他 | 水平分割线 | <code>{ id: 'horizontalRule', get label() { return t('水平分割线') }, get category() { return t('插入') }, defaultChord: 'Meta+Alt+KeyR' },</code> |
| [55](../src/settings/shortcuts.ts:55) | 文案定义／其他 | 插入 | <code>{ id: 'horizontalRule', get label() { return t('水平分割线') }, get category() { return t('插入') }, defaultChord: 'Meta+Alt+KeyR' },</code> |
| [56](../src/settings/shortcuts.ts:56) | 文案定义／其他 | 注释 | <code>{ id: 'comment', get label() { return t('注释') }, get category() { return t('编辑与格式') }, defaultChord: 'Meta+Alt+Slash' },</code> |
| [56](../src/settings/shortcuts.ts:56) | 文案定义／其他 | 编辑与格式 | <code>{ id: 'comment', get label() { return t('注释') }, get category() { return t('编辑与格式') }, defaultChord: 'Meta+Alt+Slash' },</code> |
| [57](../src/settings/shortcuts.ts:57) | 文案定义／其他 | 打字机模式 | <code>{ id: 'typewriter', get label() { return t('打字机模式') }, get category() { return t('界面与视图') }, defaultChord: '' },</code> |
| [57](../src/settings/shortcuts.ts:57) | 文案定义／其他 | 界面与视图 | <code>{ id: 'typewriter', get label() { return t('打字机模式') }, get category() { return t('界面与视图') }, defaultChord: '' },</code> |
| [58](../src/settings/shortcuts.ts:58) | 文案定义／其他 | 切换只读模式 | <code>{ id: 'readOnly', get label() { return t('切换只读模式') }, get category() { return t('界面与视图') }, defaultChord: '' },</code> |
| [58](../src/settings/shortcuts.ts:58) | 文案定义／其他 | 界面与视图 | <code>{ id: 'readOnly', get label() { return t('切换只读模式') }, get category() { return t('界面与视图') }, defaultChord: '' },</code> |
| [59](../src/settings/shortcuts.ts:59) | 文案定义／其他 | 显示或隐藏大纲 | <code>{ id: 'outline', get label() { return t('显示或隐藏大纲') }, get category() { return t('界面与视图') }, defaultChord: '' },</code> |
| [59](../src/settings/shortcuts.ts:59) | 文案定义／其他 | 界面与视图 | <code>{ id: 'outline', get label() { return t('显示或隐藏大纲') }, get category() { return t('界面与视图') }, defaultChord: '' },</code> |
| [60](../src/settings/shortcuts.ts:60) | 文案定义／其他 | 插入行内公式 | <code>{ id: 'inlineFormula', get label() { return t('插入行内公式') }, get category() { return t('插入') }, defaultChord: '' },</code> |
| [60](../src/settings/shortcuts.ts:60) | 文案定义／其他 | 插入 | <code>{ id: 'inlineFormula', get label() { return t('插入行内公式') }, get category() { return t('插入') }, defaultChord: '' },</code> |
| [61](../src/settings/shortcuts.ts:61) | 文案定义／其他 | 插入流程图 | <code>{ id: 'insertMermaid', get label() { return t('插入流程图') }, get category() { return t('插入') }, defaultChord: '' },</code> |
| [61](../src/settings/shortcuts.ts:61) | 文案定义／其他 | 插入 | <code>{ id: 'insertMermaid', get label() { return t('插入流程图') }, get category() { return t('插入') }, defaultChord: '' },</code> |
| [62](../src/settings/shortcuts.ts:62) | 文案定义／其他 | 插入脑图 | <code>{ id: 'insertMindmap', get label() { return t('插入脑图') }, get category() { return t('插入') }, defaultChord: '' },</code> |
| [62](../src/settings/shortcuts.ts:62) | 文案定义／其他 | 插入 | <code>{ id: 'insertMindmap', get label() { return t('插入脑图') }, get category() { return t('插入') }, defaultChord: '' },</code> |
| [63](../src/settings/shortcuts.ts:63) | 文案定义／其他 | 插入 | <code>{ id: 'frontmatter', get label() { return t('Front matter') }, get category() { return t('插入') }, defaultChord: '' },</code> |
| [64](../src/settings/shortcuts.ts:64) | 文案定义／其他 | 图片链接 | <code>{ id: 'imageUrl', get label() { return t('图片链接') }, get category() { return t('插入') }, defaultChord: '' },</code> |
| [64](../src/settings/shortcuts.ts:64) | 文案定义／其他 | 插入 | <code>{ id: 'imageUrl', get label() { return t('图片链接') }, get category() { return t('插入') }, defaultChord: '' },</code> |
| [65](../src/settings/shortcuts.ts:65) | 文案定义／其他 | 格式化 | <code>{ id: 'formatDocument', get label() { return t('格式化') }, get category() { return t('编辑与格式') }, defaultChord: '' },</code> |
| [65](../src/settings/shortcuts.ts:65) | 文案定义／其他 | 编辑与格式 | <code>{ id: 'formatDocument', get label() { return t('格式化') }, get category() { return t('编辑与格式') }, defaultChord: '' },</code> |
| [66](../src/settings/shortcuts.ts:66) | 文案定义／其他 | 复制为 Markdown | <code>{ id: 'copyMarkdown', get label() { return t('复制为 Markdown') }, get category() { return t('编辑与格式') }, defaultChord: '' },</code> |
| [66](../src/settings/shortcuts.ts:66) | 文案定义／其他 | 编辑与格式 | <code>{ id: 'copyMarkdown', get label() { return t('复制为 Markdown') }, get category() { return t('编辑与格式') }, defaultChord: '' },</code> |
| [67](../src/settings/shortcuts.ts:67) | 文案定义／其他 | 复制为 HTML | <code>{ id: 'copyHtml', get label() { return t('复制为 HTML') }, get category() { return t('编辑与格式') }, defaultChord: '' },</code> |
| [67](../src/settings/shortcuts.ts:67) | 文案定义／其他 | 编辑与格式 | <code>{ id: 'copyHtml', get label() { return t('复制为 HTML') }, get category() { return t('编辑与格式') }, defaultChord: '' },</code> |
| [68](../src/settings/shortcuts.ts:68) | 文案定义／其他 | 复制为图片 | <code>{ id: 'copyImage', get label() { return t('复制为图片') }, get category() { return t('编辑与格式') }, defaultChord: '' },</code> |
| [68](../src/settings/shortcuts.ts:68) | 文案定义／其他 | 编辑与格式 | <code>{ id: 'copyImage', get label() { return t('复制为图片') }, get category() { return t('编辑与格式') }, defaultChord: '' },</code> |
| [69](../src/settings/shortcuts.ts:69) | 文案定义／其他 | 复制为纯文本 | <code>{ id: 'copyPlain', get label() { return t('复制为纯文本') }, get category() { return t('编辑与格式') }, defaultChord: '' },</code> |
| [69](../src/settings/shortcuts.ts:69) | 文案定义／其他 | 编辑与格式 | <code>{ id: 'copyPlain', get label() { return t('复制为纯文本') }, get category() { return t('编辑与格式') }, defaultChord: '' },</code> |
| [70](../src/settings/shortcuts.ts:70) | 文案定义／其他 | 普通段落 | <code>...Array.from({ length: 7 }, (_, index) =&gt; ({ id: &#96;heading${index}&#96;, label: index === 0 ? '普通段落' : &#96;${index} 级标题&#96;, get category() { return t('段落') }, defaultChord: &#96;Meta+Digit${index}&#96; }))</code> |
| [70](../src/settings/shortcuts.ts:70) | 文案定义／其他 | ${index} 级标题 | <code>...Array.from({ length: 7 }, (_, index) =&gt; ({ id: &#96;heading${index}&#96;, label: index === 0 ? '普通段落' : &#96;${index} 级标题&#96;, get category() { return t('段落') }, defaultChord: &#96;Meta+Digit${index}&#96; }))</code> |
| [70](../src/settings/shortcuts.ts:70) | 文案定义／其他 | 段落 | <code>...Array.from({ length: 7 }, (_, index) =&gt; ({ id: &#96;heading${index}&#96;, label: index === 0 ? '普通段落' : &#96;${index} 级标题&#96;, get category() { return t('段落') }, defaultChord: &#96;Meta+Digit${index}&#96; }))</code> |
| [98](../src/settings/shortcuts.ts:98) | 文案定义／其他 | 此快捷键由 macOS 或窗口操作保留 | <code>if (reserved.has(chord)) return '此快捷键由 macOS 或窗口操作保留'</code> |
| [99](../src/settings/shortcuts.ts:99) | 文案定义／其他 | 快捷键需要 ⌘、⌃ 或 ⌥ | <code>if (!chordPattern.test(chord) &#124;&#124; !/^(?:(?:Meta&#124;Control&#124;Alt&#124;Shift)\+)*(?:Meta&#124;Control&#124;Alt)\+/.test(chord)) return '快捷键需要 ⌘、⌃ 或 ⌥'</code> |
| [101](../src/settings/shortcuts.ts:101) | 文案定义／其他 | 与「${clash.label}」冲突 | <code>return clash ? &#96;与「${clash.label}」冲突&#96; : null</code> |

<a id="src-settings-themecards-vue"></a>

## src/settings/ThemeCards.vue

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [9](../src/settings/ThemeCards.vue:9) | 界面文案 | 删除主题{0} | <code>…{{ theme.description }}&lt;/small&gt;&lt;/button&gt;&lt;button v-if="theme.custom" class="theme-grid-delete" :aria-label="$t('删除主题{0}', { '0': theme.name })" @click="emit('remove', theme.name)"&gt;&lt;Trash2 :size="13"/&gt;&lt;/button&gt;&lt;/div&gt;&lt;/ThemeCarous…</code> |
| [9](../src/settings/ThemeCards.vue:9) | 界面文案 | 添加主题 | <code>…13"/&gt;&lt;/button&gt;&lt;/div&gt;&lt;/ThemeCarousel&gt;&lt;button class="setting-add" @click="emit('add')"&gt;&lt;Plus :size="15"/&gt; {{ $t('添加主题') }}&lt;/button&gt;&lt;/div&gt;</code> |

<a id="src-settings-themecarousel-vue"></a>

## src/settings/ThemeCarousel.vue

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [24](../src/settings/ThemeCarousel.vue:24) | 界面文案 | 向右查看主题 | <code>&lt;div v-if="canScrollRight" class="theme-carousel-edge"&gt;&lt;button type="button" class="theme-carousel-next" :aria-label="$t('向右查看主题')" @click="advance"&gt;&lt;ChevronRight :size="20"/&gt;&lt;/button&gt;&lt;/div&gt;</code> |

<a id="src-settings-usepreferences-ts"></a>

## src/settings/usePreferences.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [25](../src/settings/usePreferences.ts:25) | 文案定义／其他 | 设置未保存，请检查填写内容和存储权限 | <code>set: value =&gt; { if (store.set(key, value)) revision.value++; else notify(t('设置未保存，请检查填写内容和存储权限')) },</code> |
| [31](../src/settings/usePreferences.ts:31) | 文案定义／其他 | 布局设置未保存 | <code>set: value =&gt; { const normalized = key === 'previewWidth' &amp;&amp; typeof value === 'number' ? Math.round(value) : value; if (store.set(key, normalized)) { revision.value++; applyLayoutSettings() } else notify(t('布局设置未保存')) },</code> |
| [48](../src/settings/usePreferences.ts:48) | 文案定义／其他 | 插件 | <code>const settingCategoryNames: Record&lt;BuiltinSettingTab, string&gt; = { plugins: '插件', layout: '布局', appearance: '外观', startup: '系统', storage: '存储', sync: '同步', editor: '编辑器', templates: '模板', snippets: '片段', shortcuts: '快捷键', spellcheck: '拼写检查', export: '导出' }</code> |
| [48](../src/settings/usePreferences.ts:48) | 文案定义／其他 | 布局 | <code>const settingCategoryNames: Record&lt;BuiltinSettingTab, string&gt; = { plugins: '插件', layout: '布局', appearance: '外观', startup: '系统', storage: '存储', sync: '同步', editor: '编辑器', templates: '模板', snippets: '片段', shortcuts: '快捷键', spellcheck: '拼写检查', export: '导出' }</code> |
| [48](../src/settings/usePreferences.ts:48) | 文案定义／其他 | 外观 | <code>const settingCategoryNames: Record&lt;BuiltinSettingTab, string&gt; = { plugins: '插件', layout: '布局', appearance: '外观', startup: '系统', storage: '存储', sync: '同步', editor: '编辑器', templates: '模板', snippets: '片段', shortcuts: '快捷键', spellcheck: '拼写检查', export: '导出' }</code> |
| [48](../src/settings/usePreferences.ts:48) | 文案定义／其他 | 系统 | <code>const settingCategoryNames: Record&lt;BuiltinSettingTab, string&gt; = { plugins: '插件', layout: '布局', appearance: '外观', startup: '系统', storage: '存储', sync: '同步', editor: '编辑器', templates: '模板', snippets: '片段', shortcuts: '快捷键', spellcheck: '拼写检查', export: '导出' }</code> |
| [48](../src/settings/usePreferences.ts:48) | 文案定义／其他 | 存储 | <code>const settingCategoryNames: Record&lt;BuiltinSettingTab, string&gt; = { plugins: '插件', layout: '布局', appearance: '外观', startup: '系统', storage: '存储', sync: '同步', editor: '编辑器', templates: '模板', snippets: '片段', shortcuts: '快捷键', spellcheck: '拼写检查', export: '导出' }</code> |
| [48](../src/settings/usePreferences.ts:48) | 文案定义／其他 | 同步 | <code>const settingCategoryNames: Record&lt;BuiltinSettingTab, string&gt; = { plugins: '插件', layout: '布局', appearance: '外观', startup: '系统', storage: '存储', sync: '同步', editor: '编辑器', templates: '模板', snippets: '片段', shortcuts: '快捷键', spellcheck: '拼写检查', export: '导出' }</code> |
| [48](../src/settings/usePreferences.ts:48) | 文案定义／其他 | 编辑器 | <code>const settingCategoryNames: Record&lt;BuiltinSettingTab, string&gt; = { plugins: '插件', layout: '布局', appearance: '外观', startup: '系统', storage: '存储', sync: '同步', editor: '编辑器', templates: '模板', snippets: '片段', shortcuts: '快捷键', spellcheck: '拼写检查', export: '导出' }</code> |
| [48](../src/settings/usePreferences.ts:48) | 文案定义／其他 | 模板 | <code>const settingCategoryNames: Record&lt;BuiltinSettingTab, string&gt; = { plugins: '插件', layout: '布局', appearance: '外观', startup: '系统', storage: '存储', sync: '同步', editor: '编辑器', templates: '模板', snippets: '片段', shortcuts: '快捷键', spellcheck: '拼写检查', export: '导出' }</code> |
| [48](../src/settings/usePreferences.ts:48) | 文案定义／其他 | 片段 | <code>const settingCategoryNames: Record&lt;BuiltinSettingTab, string&gt; = { plugins: '插件', layout: '布局', appearance: '外观', startup: '系统', storage: '存储', sync: '同步', editor: '编辑器', templates: '模板', snippets: '片段', shortcuts: '快捷键', spellcheck: '拼写检查', export: '导出' }</code> |
| [48](../src/settings/usePreferences.ts:48) | 文案定义／其他 | 快捷键 | <code>const settingCategoryNames: Record&lt;BuiltinSettingTab, string&gt; = { plugins: '插件', layout: '布局', appearance: '外观', startup: '系统', storage: '存储', sync: '同步', editor: '编辑器', templates: '模板', snippets: '片段', shortcuts: '快捷键', spellcheck: '拼写检查', export: '导出' }</code> |
| [48](../src/settings/usePreferences.ts:48) | 文案定义／其他 | 拼写检查 | <code>const settingCategoryNames: Record&lt;BuiltinSettingTab, string&gt; = { plugins: '插件', layout: '布局', appearance: '外观', startup: '系统', storage: '存储', sync: '同步', editor: '编辑器', templates: '模板', snippets: '片段', shortcuts: '快捷键', spellcheck: '拼写检查', export: '导出' }</code> |
| [48](../src/settings/usePreferences.ts:48) | 文案定义／其他 | 导出 | <code>const settingCategoryNames: Record&lt;BuiltinSettingTab, string&gt; = { plugins: '插件', layout: '布局', appearance: '外观', startup: '系统', storage: '存储', sync: '同步', editor: '编辑器', templates: '模板', snippets: '片段', shortcuts: '快捷键', spellcheck: '拼写检查', export: '导出' }</code> |
| [57](../src/settings/usePreferences.ts:57) | 文案定义／其他 | 布局 | <code>{ tab: 'layout' as const, label: '布局', keywords: '侧栏 大纲 面板 位置 拖动 排序 sidebar panel layout' },</code> |
| [57](../src/settings/usePreferences.ts:57) | 文案定义／其他 | 侧栏 大纲 面板 位置 拖动 排序 sidebar panel layout | <code>{ tab: 'layout' as const, label: '布局', keywords: '侧栏 大纲 面板 位置 拖动 排序 sidebar panel layout' },</code> |
| [58](../src/settings/usePreferences.ts:58) | 文案定义／其他 | 语言 | <code>{ tab: 'startup' as const, get label() { return t('语言') }, keywords: '语言 language locale 简体 繁體 English 日本語 한국어 Deutsch Français Español Português Русский' },</code> |
| [58](../src/settings/usePreferences.ts:58) | 文案定义／其他 | 语言 language locale 简体 繁體 English 日本語 한국어 Deutsch Français Español Português Русский | <code>{ tab: 'startup' as const, get label() { return t('语言') }, keywords: '语言 language locale 简体 繁體 English 日本語 한국어 Deutsch Français Español Português Русский' },</code> |
| [59](../src/settings/usePreferences.ts:59) | 文案定义／其他 | 社区插件 | <code>{ tab: 'plugins' as const, get label() { return t('社区插件') }, keywords: '插件 第三方 扩展 MCP CLI Agent' },</code> |
| [59](../src/settings/usePreferences.ts:59) | 文案定义／其他 | 插件 第三方 扩展 MCP CLI Agent | <code>{ tab: 'plugins' as const, get label() { return t('社区插件') }, keywords: '插件 第三方 扩展 MCP CLI Agent' },</code> |
| [60](../src/settings/usePreferences.ts:60) | 文案定义／其他 | 文件操作栏常驻 | <code>{ tab: 'appearance' as const, get label() { return t('文件操作栏常驻') }, keywords: '文件 操作栏 工具栏 常驻 悬停 隐藏' },</code> |
| [60](../src/settings/usePreferences.ts:60) | 文案定义／其他 | 文件 操作栏 工具栏 常驻 悬停 隐藏 | <code>{ tab: 'appearance' as const, get label() { return t('文件操作栏常驻') }, keywords: '文件 操作栏 工具栏 常驻 悬停 隐藏' },</code> |
| [61](../src/settings/usePreferences.ts:61) | 文案定义／其他 | 主题 | <code>{ tab: 'appearance' as const, get label() { return t('主题') }, keywords: '主题 外观 CSS 晴空 陶纸 深海' }, { tab: 'appearance' as const, get label() { return t('界面字体与缩放') }, keywords: 'UI 字体 预览 缩放 比例' },</code> |
| [61](../src/settings/usePreferences.ts:61) | 文案定义／其他 | 主题 外观 CSS 晴空 陶纸 深海 | <code>{ tab: 'appearance' as const, get label() { return t('主题') }, keywords: '主题 外观 CSS 晴空 陶纸 深海' }, { tab: 'appearance' as const, get label() { return t('界面字体与缩放') }, keywords: 'UI 字体 预览 缩放 比例' },</code> |
| [61](../src/settings/usePreferences.ts:61) | 文案定义／其他 | 界面字体与缩放 | <code>{ tab: 'appearance' as const, get label() { return t('主题') }, keywords: '主题 外观 CSS 晴空 陶纸 深海' }, { tab: 'appearance' as const, get label() { return t('界面字体与缩放') }, keywords: 'UI 字体 预览 缩放 比例' },</code> |
| [61](../src/settings/usePreferences.ts:61) | 文案定义／其他 | UI 字体 预览 缩放 比例 | <code>{ tab: 'appearance' as const, get label() { return t('主题') }, keywords: '主题 外观 CSS 晴空 陶纸 深海' }, { tab: 'appearance' as const, get label() { return t('界面字体与缩放') }, keywords: 'UI 字体 预览 缩放 比例' },</code> |
| [62](../src/settings/usePreferences.ts:62) | 文案定义／其他 | 启动时 | <code>{ tab: 'startup' as const, get label() { return t('启动时') }, keywords: '启动 上次目录 文件 空白窗口' },</code> |
| [62](../src/settings/usePreferences.ts:62) | 文案定义／其他 | 启动 上次目录 文件 空白窗口 | <code>{ tab: 'startup' as const, get label() { return t('启动时') }, keywords: '启动 上次目录 文件 空白窗口' },</code> |
| [63](../src/settings/usePreferences.ts:63) | 文案定义／其他 | 默认编辑器 | <code>{ tab: 'startup' as const, get label() { return t('默认编辑器') }, keywords: '默认应用 Markdown 文件关联 打开方式' },</code> |
| [63](../src/settings/usePreferences.ts:63) | 文案定义／其他 | 默认应用 Markdown 文件关联 打开方式 | <code>{ tab: 'startup' as const, get label() { return t('默认编辑器') }, keywords: '默认应用 Markdown 文件关联 打开方式' },</code> |
| [64](../src/settings/usePreferences.ts:64) | 文案定义／其他 | 自动检测更新 | <code>{ tab: 'startup' as const, get label() { return t('自动检测更新') }, keywords: '系统 更新 检测 自动' },</code> |
| [64](../src/settings/usePreferences.ts:64) | 文案定义／其他 | 系统 更新 检测 自动 | <code>{ tab: 'startup' as const, get label() { return t('自动检测更新') }, keywords: '系统 更新 检测 自动' },</code> |
| [65](../src/settings/usePreferences.ts:65) | 文案定义／其他 | 恢复默认设置 | <code>{ tab: 'startup' as const, get label() { return t('恢复默认设置') }, keywords: '系统 全部 恢复 默认 重置' },</code> |
| [65](../src/settings/usePreferences.ts:65) | 文案定义／其他 | 系统 全部 恢复 默认 重置 | <code>{ tab: 'startup' as const, get label() { return t('恢复默认设置') }, keywords: '系统 全部 恢复 默认 重置' },</code> |
| [66](../src/settings/usePreferences.ts:66) | 文案定义／其他 | 图片与附件存储 | <code>{ tab: 'storage' as const, get label() { return t('图片与附件存储') }, keywords: '图片附件目录 剪贴板图片目录 文件命名 变量' },</code> |
| [66](../src/settings/usePreferences.ts:66) | 文案定义／其他 | 图片附件目录 剪贴板图片目录 文件命名 变量 | <code>{ tab: 'storage' as const, get label() { return t('图片与附件存储') }, keywords: '图片附件目录 剪贴板图片目录 文件命名 变量' },</code> |
| [67](../src/settings/usePreferences.ts:67) | 文案定义／其他 | 编辑器字体与排版 | <code>{ tab: 'editor' as const, get label() { return t('编辑器字体与排版') }, keywords: '字体 正文字号 表格宽度 铺满 内容自适应 行高 段落间距 首行缩进 正文布局 铺满 居中' }, { tab: 'editor' as const, get label() { return t('编辑行为') }, keywords: '图表可视化编辑 流程图 脑图 Mermaid 代码、图表与公式行号 正文行号 自动换行 所见即所得 外部文件修改 自动加载 弹窗确认' },</code> |
| [67](../src/settings/usePreferences.ts:67) | 文案定义／其他 | 字体 正文字号 表格宽度 铺满 内容自适应 行高 段落间距 首行缩进 正文布局 铺满 居中 | <code>{ tab: 'editor' as const, get label() { return t('编辑器字体与排版') }, keywords: '字体 正文字号 表格宽度 铺满 内容自适应 行高 段落间距 首行缩进 正文布局 铺满 居中' }, { tab: 'editor' as const, get label() { return t('编辑行为') }, keywords: '图表可视化编辑 流程图 脑图 Mermaid 代码、图表与公式行号 正文行号 自动换行 所见即所得 外部文件修改 自动加载 弹窗确认' },</code> |
| [67](../src/settings/usePreferences.ts:67) | 文案定义／其他 | 编辑行为 | <code>{ tab: 'editor' as const, get label() { return t('编辑器字体与排版') }, keywords: '字体 正文字号 表格宽度 铺满 内容自适应 行高 段落间距 首行缩进 正文布局 铺满 居中' }, { tab: 'editor' as const, get label() { return t('编辑行为') }, keywords: '图表可视化编辑 流程图 脑图 Mermaid 代码、图表与公式行号 正文行号 自动换行 所见即所得 外部文件修改 自动加载 弹窗确认' },</code> |
| [67](../src/settings/usePreferences.ts:67) | 文案定义／其他 | 图表可视化编辑 流程图 脑图 Mermaid 代码、图表与公式行号 正文行号 自动换行 所见即所得 外部文件修改 自动加载 弹窗确认 | <code>{ tab: 'editor' as const, get label() { return t('编辑器字体与排版') }, keywords: '字体 正文字号 表格宽度 铺满 内容自适应 行高 段落间距 首行缩进 正文布局 铺满 居中' }, { tab: 'editor' as const, get label() { return t('编辑行为') }, keywords: '图表可视化编辑 流程图 脑图 Mermaid 代码、图表与公式行号 正文行号 自动换行 所见即所得 外部文件修改 自动加载 弹窗确认' },</code> |
| [68](../src/settings/usePreferences.ts:68) | 文案定义／其他 | 界面布局 | <code>{ tab: 'appearance' as const, get label() { return t('界面布局') }, keywords: '标签页 侧栏' },</code> |
| [68](../src/settings/usePreferences.ts:68) | 文案定义／其他 | 标签页 侧栏 | <code>{ tab: 'appearance' as const, get label() { return t('界面布局') }, keywords: '标签页 侧栏' },</code> |
| [69](../src/settings/usePreferences.ts:69) | 文案定义／其他 | 文件模板 | <code>{ tab: 'templates' as const, get label() { return t('文件模板') }, keywords: '模板 变量 新建文件' }, { tab: 'snippets' as const, get label() { return t('文本片段') }, keywords: '片段 插入' },</code> |
| [69](../src/settings/usePreferences.ts:69) | 文案定义／其他 | 模板 变量 新建文件 | <code>{ tab: 'templates' as const, get label() { return t('文件模板') }, keywords: '模板 变量 新建文件' }, { tab: 'snippets' as const, get label() { return t('文本片段') }, keywords: '片段 插入' },</code> |
| [69](../src/settings/usePreferences.ts:69) | 文案定义／其他 | 文本片段 | <code>{ tab: 'templates' as const, get label() { return t('文件模板') }, keywords: '模板 变量 新建文件' }, { tab: 'snippets' as const, get label() { return t('文本片段') }, keywords: '片段 插入' },</code> |
| [69](../src/settings/usePreferences.ts:69) | 文案定义／其他 | 片段 插入 | <code>{ tab: 'templates' as const, get label() { return t('文件模板') }, keywords: '模板 变量 新建文件' }, { tab: 'snippets' as const, get label() { return t('文本片段') }, keywords: '片段 插入' },</code> |
| [70](../src/settings/usePreferences.ts:70) | 文案定义／其他 | 快捷键设置 | <code>{ tab: 'shortcuts' as const, get label() { return t('快捷键设置') }, keywords: &#96;快捷键 录入 冲突 清除 重置 ${shortcuts.map(item =&gt; item.label).join(' ')}&#96; },</code> |
| [70](../src/settings/usePreferences.ts:70) | 文案定义／其他 | 快捷键 录入 冲突 清除 重置 ${shortcuts.map(item =&gt; item.label).join(' ')} | <code>{ tab: 'shortcuts' as const, get label() { return t('快捷键设置') }, keywords: &#96;快捷键 录入 冲突 清除 重置 ${shortcuts.map(item =&gt; item.label).join(' ')}&#96; },</code> |
| [71](../src/settings/usePreferences.ts:71) | 文案定义／其他 | 拼写检查与词典 | <code>{ tab: 'spellcheck' as const, get label() { return t('拼写检查与词典') }, keywords: '拼写检查 词典 dic aff raw 下载 离线' },</code> |
| [71](../src/settings/usePreferences.ts:71) | 文案定义／其他 | 拼写检查 词典 dic aff raw 下载 离线 | <code>{ tab: 'spellcheck' as const, get label() { return t('拼写检查与词典') }, keywords: '拼写检查 词典 dic aff raw 下载 离线' },</code> |
| [72](../src/settings/usePreferences.ts:72) | 文案定义／其他 | 导出设置 | <code>{ tab: 'export' as const, get label() { return t('导出设置') }, keywords: '导出 字体 PDF 纸张 尺寸 页边距' },</code> |
| [72](../src/settings/usePreferences.ts:72) | 文案定义／其他 | 导出 字体 PDF 纸张 尺寸 页边距 | <code>{ tab: 'export' as const, get label() { return t('导出设置') }, keywords: '导出 字体 PDF 纸张 尺寸 页边距' },</code> |
| [73](../src/settings/usePreferences.ts:73) | 文案定义／其他 | 历史版本 | <code>{ tab: 'storage' as const, get label() { return t('历史版本') }, keywords: 'Git 保存 版本数量 自动清理周期 差异 恢复' },</code> |
| [73](../src/settings/usePreferences.ts:73) | 文案定义／其他 | Git 保存 版本数量 自动清理周期 差异 恢复 | <code>{ tab: 'storage' as const, get label() { return t('历史版本') }, keywords: 'Git 保存 版本数量 自动清理周期 差异 恢复' },</code> |
| [74](../src/settings/usePreferences.ts:74) | 文案定义／其他 | 冲突处理 | <code>{ tab: 'sync' as const, get label() { return t('冲突处理') }, keywords: '远端优先 自动合并 副本 保留两份' },</code> |
| [74](../src/settings/usePreferences.ts:74) | 文案定义／其他 | 远端优先 自动合并 副本 保留两份 | <code>{ tab: 'sync' as const, get label() { return t('冲突处理') }, keywords: '远端优先 自动合并 副本 保留两份' },</code> |
| [75](../src/settings/usePreferences.ts:75) | 文案定义／其他 | GitHub 同步 | <code>{ tab: 'sync' as const, get label() { return t('GitHub 同步') }, keywords: 'GitHub 自动 同步 私有仓库 访问令牌 登录 定时 周期 失败 重试' },</code> |
| [75](../src/settings/usePreferences.ts:75) | 文案定义／其他 | GitHub 自动 同步 私有仓库 访问令牌 登录 定时 周期 失败 重试 | <code>{ tab: 'sync' as const, get label() { return t('GitHub 同步') }, keywords: 'GitHub 自动 同步 私有仓库 访问令牌 登录 定时 周期 失败 重试' },</code> |
| [76](../src/settings/usePreferences.ts:76) | 文案定义／其他 | WebDAV 同步 | <code>{ tab: 'sync' as const, get label() { return t('WebDAV 同步') }, keywords: 'WebDAV 自动 双向 同步 远端 地址 账号 密码 冲突 删除 定时 周期 失败 重试' },</code> |
| [76](../src/settings/usePreferences.ts:76) | 文案定义／其他 | WebDAV 自动 双向 同步 远端 地址 账号 密码 冲突 删除 定时 周期 失败 重试 | <code>{ tab: 'sync' as const, get label() { return t('WebDAV 同步') }, keywords: 'WebDAV 自动 双向 同步 远端 地址 账号 密码 冲突 删除 定时 周期 失败 重试' },</code> |
| [91](../src/settings/usePreferences.ts:91) | 文案定义／其他 | 主题设置未保存 | <code>set: value =&gt; { if (store.set('customThemes', value)) revision.value++; else notify(t('主题设置未保存')) },</code> |
| [96](../src/settings/usePreferences.ts:96) | 文案定义／其他 | 主题读取失败：{0} | <code>onMounted(async () =&gt; { if (isTauri) { try { folderThemes.value = await invoke&lt;FolderTheme[]&gt;('list_installed_themes') } catch (error) { notify(t('主题读取失败：{0}', { "0": String(error) })) } } })</code> |
| [103](../src/settings/usePreferences.ts:103) | 文案定义／其他 | 请在桌面版中添加主题 | <code>if (!isTauri) return notify(t('请在桌面版中添加主题'))</code> |
| [110](../src/settings/usePreferences.ts:110) | 文案定义／其他 | 主题添加失败：{0} | <code>} catch (error) { notify(t('主题添加失败：{0}', { "0": String(error) })) }</code> |
| [114](../src/settings/usePreferences.ts:114) | 文案定义／其他 | 删除主题“{0}”？应用中的主题副本将被删除，原文件夹不受影响。 | <code>if (!window.confirm(t('删除主题“{0}”？应用中的主题副本将被删除，原文件夹不受影响。', { "0": theme?.label &#124;&#124; name }))) return</code> |
| [121](../src/settings/usePreferences.ts:121) | 文案定义／其他 | 主题删除失败：{0} | <code>} catch (error) { notify(t('主题删除失败：{0}', { "0": String(error) })) }</code> |
| [123](../src/settings/usePreferences.ts:123) | 文案定义／其他 | 恢复全部默认设置？主题、快捷键等偏好将被重置。 | <code>function resetAllSettings() { if (!window.confirm(t('恢复全部默认设置？主题、快捷键等偏好将被重置。'))) return; store.resetAll(); revision.value++; applyLayoutSettings() }</code> |
| [181](../src/settings/usePreferences.ts:181) | 文案定义／其他 | 本机字体读取失败：{0} | <code>catch (error) { notify(t('本机字体读取失败：{0}', { "0": String(error) })) }</code> |
| [195](../src/settings/usePreferences.ts:195) | 文案定义／其他 | 请在桌面版中设置默认编辑器 | <code>if (!isTauri) { notify(t('请在桌面版中设置默认编辑器')); return }</code> |
| [199](../src/settings/usePreferences.ts:199) | 文案定义／其他 | 已设为 Markdown 默认编辑器 | <code>notify(applied ? t('已设为 Markdown 默认编辑器') : t('请在系统设置中选择 Markart'))</code> |
| [199](../src/settings/usePreferences.ts:199) | 文案定义／其他 | 请在系统设置中选择 Markart | <code>notify(applied ? t('已设为 Markdown 默认编辑器') : t('请在系统设置中选择 Markart'))</code> |

<a id="src-settings-useshortcutsettings-ts"></a>

## src/settings/useShortcutSettings.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [37](../src/settings/useShortcutSettings.ts:37) | 文案定义／其他 | 顶部菜单快捷键同步失败：{0} | <code>catch (error) { notify(t('顶部菜单快捷键同步失败：{0}', { "0": String(error) })) }</code> |
| [43](../src/settings/useShortcutSettings.ts:43) | 文案定义／其他 | 快捷键录入准备失败：{0} | <code>catch (error) { notify(t('快捷键录入准备失败：{0}', { "0": String(error) })) }</code> |

<a id="src-statusbar-vue"></a>

## src/StatusBar.vue

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [16](../src/StatusBar.vue:16) | 状态文案 | 同步中… | <code>const state = busy ? t('同步中…') : status?.startsWith('同步失败') &#124;&#124; status?.includes('冲突') ? status : ''</code> |
| [16](../src/StatusBar.vue:16) | 状态文案 | 同步失败 | <code>const state = busy ? t('同步中…') : status?.startsWith('同步失败') &#124;&#124; status?.includes('冲突') ? status : ''</code> |
| [16](../src/StatusBar.vue:16) | 状态文案 | 冲突 | <code>const state = busy ? t('同步中…') : status?.startsWith('同步失败') &#124;&#124; status?.includes('冲突') ? status : ''</code> |
| [25](../src/StatusBar.vue:25) | 界面文案 | 同步失败 | <code>…lass="sync-status-button" :class="{ syncing: webdavBusy, 'sync-error': !webdavBusy &amp;&amp; webdavStatus.startsWith('同步失败'), 'sync-warning': !webdavBusy &amp;&amp; webdavStatus.includes('冲突') }" :disabled="webdavBusy" :title="syncHint('We…</code> |
| [25](../src/StatusBar.vue:25) | 界面文案 | 冲突 | <code>…-error': !webdavBusy &amp;&amp; webdavStatus.startsWith('同步失败'), 'sync-warning': !webdavBusy &amp;&amp; webdavStatus.includes('冲突') }" :disabled="webdavBusy" :title="syncHint('WebDAV', webdavBusy, webdavStatus)" :aria-label="webdavBusy ?…</code> |
| [25](../src/StatusBar.vue:25) | 界面文案 | GitHub 正在同步 | <code>…}" :disabled="githubBusy" :title="syncHint('GitHub', githubBusy, githubStatus)" :aria-label="githubBusy ? $t('GitHub 正在同步') : $t('手动同步 GitHub')" @click="runGithubSync(true)"&gt;&lt;Github :size="14"/&gt;&lt;/button&gt;&lt;button v-if="webdavBoundUr…</code> |
| [25](../src/StatusBar.vue:25) | 界面文案 | 手动同步 GitHub | <code>…bBusy" :title="syncHint('GitHub', githubBusy, githubStatus)" :aria-label="githubBusy ? $t('GitHub 正在同步') : $t('手动同步 GitHub')" @click="runGithubSync(true)"&gt;&lt;Github :size="14"/&gt;&lt;/button&gt;&lt;button v-if="webdavBoundUrl &amp;&amp; webdavUsername…</code> |
| [25](../src/StatusBar.vue:25) | 界面文案 | WebDAV 正在同步 | <code>…}" :disabled="webdavBusy" :title="syncHint('WebDAV', webdavBusy, webdavStatus)" :aria-label="webdavBusy ? $t('WebDAV 正在同步') : $t('手动同步 WebDAV')" @click="runWebdavSync(true)"&gt;&lt;Cloud :size="14"/&gt;&lt;/button&gt;&lt;span&gt;{{ words }} {{ $t('字')…</code> |
| [25](../src/StatusBar.vue:25) | 界面文案 | 手动同步 WebDAV | <code>…vBusy" :title="syncHint('WebDAV', webdavBusy, webdavStatus)" :aria-label="webdavBusy ? $t('WebDAV 正在同步') : $t('手动同步 WebDAV')" @click="runWebdavSync(true)"&gt;&lt;Cloud :size="14"/&gt;&lt;/button&gt;&lt;span&gt;{{ words }} {{ $t('字') }}&lt;/span&gt;&lt;WritingMo…</code> |
| [25](../src/StatusBar.vue:25) | 界面文案 | 字 | <code>…正在同步') : $t('手动同步 WebDAV')" @click="runWebdavSync(true)"&gt;&lt;Cloud :size="14"/&gt;&lt;/button&gt;&lt;span&gt;{{ words }} {{ $t('字') }}&lt;/span&gt;&lt;WritingModeMenu :active="commandActive" :icon="commandIcon" :title-for="commandTitle" :run="onTo…</code> |
| [25](../src/StatusBar.vue:25) | 界面文案 | 界面缩放 | <code>…ive="markdownActive" :set-mode="setMode"/&gt;&lt;span class="zoom-control"&gt;&lt;SettingSelect v-model="zoom" :label="$t('界面缩放')" :options="zoomOptions.map((value: number) =&gt; ({ value, label: &#96;${value}%&#96; }))"/&gt;&lt;/span&gt;&lt;/footer&gt;</code> |
| [25](../src/StatusBar.vue:25) | 界面文案 | ${value}% | <code>…ettingSelect v-model="zoom" :label="$t('界面缩放')" :options="zoomOptions.map((value: number) =&gt; ({ value, label: &#96;${value}%&#96; }))"/&gt;&lt;/span&gt;&lt;/footer&gt;</code> |

<a id="src-sync-usecloudsync-ts"></a>

## src/sync/useCloudSync.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [38](../src/sync/useCloudSync.ts:38) | 状态文案 | 尚未同步 | <code>const webdavStatus = ref('尚未同步')</code> |
| [49](../src/sync/useCloudSync.ts:49) | 状态文案 | 尚未同步 | <code>const githubStatus = ref('尚未同步')</code> |
| [70](../src/sync/useCloudSync.ts:70) | 文案定义／其他 | ${provider.name} · ${time ? t('最近同步：{0}', { '0': new Date(time).toLocaleString() }) : t('尚未同步')} | <code>return &#96;${provider.name} · ${time ? t('最近同步：{0}', { '0': new Date(time).toLocaleString() }) : t('尚未同步')}&#96;</code> |
| [106](../src/sync/useCloudSync.ts:106) | 文案定义／其他 | 仓库列表读取失败：{0} | <code>catch (error) { notify(t('仓库列表读取失败：{0}', { "0": String(error) })) }</code> |
| [117](../src/sync/useCloudSync.ts:117) | 状态文案 | 尚未同步 | <code>githubStatus.value = '尚未同步'</code> |
| [118](../src/sync/useCloudSync.ts:118) | 文案定义／其他 | 退出 GitHub 失败：{0} | <code>} catch (error) { notify(t('退出 GitHub 失败：{0}', { "0": String(error) })) }</code> |
| [128](../src/sync/useCloudSync.ts:128) | 文案定义／其他 | 仓库关联读取失败：{0} | <code>} catch (error) { if (root === currentWorkspaceRoot.value) notify(t('仓库关联读取失败：{0}', { "0": String(error) })) }</code> |
| [137](../src/sync/useCloudSync.ts:137) | 状态文案 | 已绑定，正在同步… | <code>githubStatus.value = githubEnabled.value ? '已绑定，正在同步…' : '已绑定，可手动同步'</code> |
| [137](../src/sync/useCloudSync.ts:137) | 状态文案 | 已绑定，可手动同步 | <code>githubStatus.value = githubEnabled.value ? '已绑定，正在同步…' : '已绑定，可手动同步'</code> |
| [139](../src/sync/useCloudSync.ts:139) | 提示／错误 | 绑定失败：当前令牌无法访问此仓库。请在 GitHub Token 的 Repository access 中加入该仓库后刷新。 | <code>} catch (error) { notify(String(error).includes('HTTP 404') ? '绑定失败：当前令牌无法访问此仓库。请在 GitHub Token 的 Repository access 中加入该仓库后刷新。' : &#96;绑定失败：${String(error)}&#96;) }</code> |
| [139](../src/sync/useCloudSync.ts:139) | 提示／错误 | 绑定失败：${String(error)} | <code>} catch (error) { notify(String(error).includes('HTTP 404') ? '绑定失败：当前令牌无法访问此仓库。请在 GitHub Token 的 Repository access 中加入该仓库后刷新。' : &#96;绑定失败：${String(error)}&#96;) }</code> |
| [151](../src/sync/useCloudSync.ts:151) | 状态文案 | 尚未同步 | <code>githubStatus.value = '尚未同步'</code> |
| [153](../src/sync/useCloudSync.ts:153) | 文案定义／其他 | 创建失败：{0} | <code>} catch (error) { notify(t('创建失败：{0}', { "0": String(error) })) }</code> |
| [160](../src/sync/useCloudSync.ts:160) | 状态文案 | 尚未同步 | <code>try { await invoke('github_unbind_workspace'); githubBoundUrl.value = ''; githubStatus.value = '尚未同步' }</code> |
| [161](../src/sync/useCloudSync.ts:161) | 文案定义／其他 | 解除绑定失败：{0} | <code>catch (error) { notify(t('解除绑定失败：{0}', { "0": String(error) })) }</code> |
| [172](../src/sync/useCloudSync.ts:172) | 文案定义／其他 | 令牌保存失败：{0} | <code>} catch (error) { notify(t('令牌保存失败：{0}', { "0": String(error) })) }</code> |
| [178](../src/sync/useCloudSync.ts:178) | 状态文案 | 同步中… | <code>githubStatus.value = '同步中…'</code> |
| [187](../src/sync/useCloudSync.ts:187) | 状态文案 | 冲突 ${result.conflicts.length} 项，已暂停 | <code>githubStatus.value = result.conflicts.length ? &#96;冲突 ${result.conflicts.length} 项，已暂停&#96; : &#96;已同步 · ${result.uploaded ? '已推送' : '无待推送'} · 下载 ${result.downloaded}&#96;</code> |
| [187](../src/sync/useCloudSync.ts:187) | 状态文案 | 已同步 · ${result.uploaded ? '已推送' : '无待推送'} · 下载 ${result.downloaded} | <code>githubStatus.value = result.conflicts.length ? &#96;冲突 ${result.conflicts.length} 项，已暂停&#96; : &#96;已同步 · ${result.uploaded ? '已推送' : '无待推送'} · 下载 ${result.downloaded}&#96;</code> |
| [188](../src/sync/useCloudSync.ts:188) | 文案定义／其他 | GitHub 同步冲突：{0} | <code>if (result.conflicts.length) notify(t('GitHub 同步冲突：{0}', { "0": result.conflicts.slice(0, 3).join('、') }))</code> |
| [189](../src/sync/useCloudSync.ts:189) | 文案定义／其他 | 已另存 {0} 个版本副本 | <code>if (result.copies?.length) notify(t('已另存 {0} 个版本副本', { "0": result.copies.length }))</code> |
| [197](../src/sync/useCloudSync.ts:197) | 状态文案 | 同步失败：${String(error)} | <code>githubStatus.value = &#96;同步失败：${String(error)}&#96;</code> |
| [244](../src/sync/useCloudSync.ts:244) | 文案定义／其他 | 远端文件夹读取失败：{0} | <code>catch (error) { notify(t('远端文件夹读取失败：{0}', { "0": String(error) })) }</code> |
| [254](../src/sync/useCloudSync.ts:254) | 状态文案 | 尚未同步 | <code>webdavStatus.value = '尚未同步'</code> |
| [255](../src/sync/useCloudSync.ts:255) | 文案定义／其他 | 退出 WebDAV 失败：{0} | <code>} catch (error) { notify(t('退出 WebDAV 失败：{0}', { "0": String(error) })) }</code> |
| [265](../src/sync/useCloudSync.ts:265) | 文案定义／其他 | 远端文件夹读取失败：{0} | <code>} catch (error) { if (root === currentWorkspaceRoot.value) notify(t('远端文件夹读取失败：{0}', { "0": String(error) })) }</code> |
| [274](../src/sync/useCloudSync.ts:274) | 状态文案 | 已绑定，正在同步… | <code>webdavStatus.value = webdavEnabled.value ? '已绑定，正在同步…' : '已绑定，可手动同步'</code> |
| [274](../src/sync/useCloudSync.ts:274) | 状态文案 | 已绑定，可手动同步 | <code>webdavStatus.value = webdavEnabled.value ? '已绑定，正在同步…' : '已绑定，可手动同步'</code> |
| [276](../src/sync/useCloudSync.ts:276) | 文案定义／其他 | 绑定失败：{0} | <code>} catch (error) { notify(t('绑定失败：{0}', { "0": String(error) })) }</code> |
| [283](../src/sync/useCloudSync.ts:283) | 状态文案 | 尚未同步 | <code>try { await invoke('webdav_unbind_workspace'); webdavBoundUrl.value = ''; webdavStatus.value = '尚未同步' }</code> |
| [284](../src/sync/useCloudSync.ts:284) | 文案定义／其他 | 解除绑定失败：{0} | <code>catch (error) { notify(t('解除绑定失败：{0}', { "0": String(error) })) }</code> |
| [293](../src/sync/useCloudSync.ts:293) | 文案定义／其他 | 凭据保存失败：{0} | <code>} catch (error) { notify(t('凭据保存失败：{0}', { "0": String(error) })) }</code> |
| [299](../src/sync/useCloudSync.ts:299) | 状态文案 | 同步中… | <code>webdavStatus.value = '同步中…'</code> |
| [308](../src/sync/useCloudSync.ts:308) | 状态文案 | 已同步 · 上传 ${result.uploaded} · 下载 ${result.downloaded} · 删除 ${result.deletedLocal + result.deletedRemote}${result.conflicts.length ? &#96; · 冲突 ${result.conflicts.length}&#96; : ''} | <code>webdavStatus.value = &#96;已同步 · 上传 ${result.uploaded} · 下载 ${result.downloaded} · 删除 ${result.deletedLocal + result.deletedRemote}${result.conflicts.length ? &#96; · 冲突 ${result.conflicts.length}&#96; : ''}&#96;</code> |
| [309](../src/sync/useCloudSync.ts:309) | 文案定义／其他 | WebDAV 同步冲突：{0} | <code>if (result.conflicts.length) notify(t('WebDAV 同步冲突：{0}', { "0": result.conflicts.slice(0, 3).join('、') }))</code> |
| [310](../src/sync/useCloudSync.ts:310) | 文案定义／其他 | 已另存 {0} 个版本副本 | <code>if (result.copies?.length) notify(t('已另存 {0} 个版本副本', { "0": result.copies.length }))</code> |
| [318](../src/sync/useCloudSync.ts:318) | 状态文案 | 同步失败：${String(error)} | <code>webdavStatus.value = &#96;同步失败：${String(error)}&#96;</code> |

<a id="src-sync-usegithistory-ts"></a>

## src/sync/useGitHistory.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [61](../src/sync/useGitHistory.ts:61) | 文案定义／其他 | 版本差异读取失败：{0} | <code>if (!cancelled) historySearchError.value = t('版本差异读取失败：{0}', { '0': String(error) })</code> |
| [67](../src/sync/useGitHistory.ts:67) | 文案定义／其他 | 请先打开文件 | <code>if (!isTauri &#124;&#124; !activeDoc.value.relativePath) { notify(t('请先打开文件')); return }</code> |
| [75](../src/sync/useGitHistory.ts:75) | 文案定义／其他 | 历史版本读取失败：{0} | <code>catch (error) { notify(t('历史版本读取失败：{0}', { "0": String(error) })) }</code> |
| [80](../src/sync/useGitHistory.ts:80) | 文案定义／其他 | 版本差异读取失败：{0} | <code>catch (error) { notify(t('版本差异读取失败：{0}', { "0": String(error) })) }</code> |
| [85](../src/sync/useGitHistory.ts:85) | 文案定义／其他 | 请先处理当前文件的未保存内容或磁盘冲突 | <code>if (dirtyIds.value.includes(doc.id) &#124;&#124; conflictedIds.value.includes(doc.id)) { notify(t('请先处理当前文件的未保存内容或磁盘冲突')); return }</code> |
| [86](../src/sync/useGitHistory.ts:86) | 文案定义／其他 | 确认恢复此历史版本？将替换当前文件内容 | <code>if (!window.confirm(t('确认恢复此历史版本？将替换当前文件内容'))) return</code> |
| [98](../src/sync/useGitHistory.ts:98) | 文案定义／其他 | 恢复失败：{0} | <code>} catch (error) { notify(t('恢复失败：{0}', { "0": String(error) })) }</code> |

<a id="src-tabbar-vue"></a>

## src/TabBar.vue

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [35](../src/TabBar.vue:35) | 界面文案 | 打开的文件 | <code>…v ref="tabsElement" class="document-tabs" :style="{ '--tab-slots': tabSlots }" role="tablist" :aria-label="$t('打开的文件')"&gt;&lt;div v-for="doc in tabDocs" :key="doc.id" class="document-tab" @mousedown.right.prevent :class="{ active:…</code> |
| [35](../src/TabBar.vue:35) | 界面文案 | · 待保存 | <code>…tab-name"&gt;{{ doc.path.split('/').pop() }}&lt;/span&gt;&lt;span v-if="doc.temporary" class="document-edit-state"&gt; {{ $t('· 待保存') }}&lt;/span&gt;&lt;span v-else-if="dirtyIds.includes(doc.id)" class="document-edit-state"&gt; {{ $t('· 未保存') }}&lt;/span&gt;…</code> |
| [35](../src/TabBar.vue:35) | 界面文案 | · 未保存 | <code>…tate"&gt; {{ $t('· 待保存') }}&lt;/span&gt;&lt;span v-else-if="dirtyIds.includes(doc.id)" class="document-edit-state"&gt; {{ $t('· 未保存') }}&lt;/span&gt;&lt;span v-else-if="conflictedIds.includes(doc.id)" class="document-edit-state"&gt; {{ $t('· 磁盘冲突') }}&lt;…</code> |
| [35](../src/TabBar.vue:35) | 界面文案 | · 磁盘冲突 | <code>…&gt; {{ $t('· 未保存') }}&lt;/span&gt;&lt;span v-else-if="conflictedIds.includes(doc.id)" class="document-edit-state"&gt; {{ $t('· 磁盘冲突') }}&lt;/span&gt;&lt;/button&gt;&lt;PluginActions location="tab" :document-id="doc.id"/&gt;&lt;button class="tab-close" :aria-lab…</code> |
| [35](../src/TabBar.vue:35) | 界面文案 | 关闭${doc.path} | <code>…}}&lt;/span&gt;&lt;/button&gt;&lt;PluginActions location="tab" :document-id="doc.id"/&gt;&lt;button class="tab-close" :aria-label="&#96;关闭${doc.path}&#96;" @click="closeTab(doc.id)"&gt;&lt;X :size="11"/&gt;&lt;/button&gt;&lt;/div&gt;&lt;span v-if="!tabDocs.length" class="tab-empty"&gt;{{…</code> |
| [35](../src/TabBar.vue:35) | 界面文案 | 未打开文件 | <code>…@click="closeTab(doc.id)"&gt;&lt;X :size="11"/&gt;&lt;/button&gt;&lt;/div&gt;&lt;span v-if="!tabDocs.length" class="tab-empty"&gt;{{ $t('未打开文件') }}&lt;/span&gt;&lt;/div&gt;&lt;button type="button" class="icon-button tab-new" :title="$t('新建文件')" :aria-label="$t('新建文件…</code> |
| [35](../src/TabBar.vue:35) | 界面文案 | 新建文件 | <code>…'未打开文件') }}&lt;/span&gt;&lt;/div&gt;&lt;button type="button" class="icon-button tab-new" :title="$t('新建文件')" :aria-label="$t('新建文件')" @click="newTemporaryDoc()"&gt;&lt;Plus :size="12"/&gt;&lt;/button&gt;&lt;/div&gt;</code> |
| [36](../src/TabBar.vue:36) | 界面文案 | 待保存 | <code>…activeDoc.path.split('/').pop() }}&lt;/strong&gt;&lt;span v-if="activeDoc.temporary" class="document-edit-state"&gt;{{ $t('待保存') }}&lt;/span&gt;&lt;span v-else-if="dirtyIds.includes(activeId)" class="document-edit-state"&gt;{{ $t('未保存') }}&lt;/span&gt;&lt;…</code> |
| [36](../src/TabBar.vue:36) | 界面文案 | 未保存 | <code>…-state"&gt;{{ $t('待保存') }}&lt;/span&gt;&lt;span v-else-if="dirtyIds.includes(activeId)" class="document-edit-state"&gt;{{ $t('未保存') }}&lt;/span&gt;&lt;span v-else-if="conflictedIds.includes(activeId)" class="document-edit-state"&gt;{{ $t('磁盘冲突') }}&lt;/…</code> |
| [36](../src/TabBar.vue:36) | 界面文案 | 磁盘冲突 | <code>…e"&gt;{{ $t('未保存') }}&lt;/span&gt;&lt;span v-else-if="conflictedIds.includes(activeId)" class="document-edit-state"&gt;{{ $t('磁盘冲突') }}&lt;/span&gt;&lt;/div&gt;</code> |
| [37](../src/TabBar.vue:37) | 界面文案 | 关闭标签页 | <code>…bContext.x}px&#96;, top: &#96;${tabContext.y}px&#96; }"&gt;&lt;button @click="closeTab(tabContext.id); tabContext = null"&gt;{{ $t('关闭标签页') }}&lt;/button&gt;&lt;button :disabled="openTabs.indexOf(tabContext.id) &lt;= 0" @click="closeTabs('left')"&gt;{{ $t('关闭左侧…</code> |
| [37](../src/TabBar.vue:37) | 界面文案 | 关闭左侧标签页 | <code>…'关闭标签页') }}&lt;/button&gt;&lt;button :disabled="openTabs.indexOf(tabContext.id) &lt;= 0" @click="closeTabs('left')"&gt;{{ $t('关闭左侧标签页') }}&lt;/button&gt;&lt;button :disabled="openTabs.indexOf(tabContext.id) &gt;= openTabs.length - 1" @click="closeTabs('r…</code> |
| [37](../src/TabBar.vue:37) | 界面文案 | 关闭右侧标签页 | <code>…&gt;&lt;button :disabled="openTabs.indexOf(tabContext.id) &gt;= openTabs.length - 1" @click="closeTabs('right')"&gt;{{ $t('关闭右侧标签页') }}&lt;/button&gt;&lt;button :disabled="openTabs.length &lt;= 1" @click="closeTabs('others')"&gt;{{ $t('关闭其他标签页') }}&lt;/butt…</code> |
| [37](../src/TabBar.vue:37) | 界面文案 | 关闭其他标签页 | <code>…ht')"&gt;{{ $t('关闭右侧标签页') }}&lt;/button&gt;&lt;button :disabled="openTabs.length &lt;= 1" @click="closeTabs('others')"&gt;{{ $t('关闭其他标签页') }}&lt;/button&gt;&lt;div/&gt;&lt;button :disabled="!canReloadTab(tabContext.id)" @click="reloadTab(tabContext.id)"&gt;{{ $t(…</code> |
| [37](../src/TabBar.vue:37) | 界面文案 | 重新载入 | <code>…页') }}&lt;/button&gt;&lt;div/&gt;&lt;button :disabled="!canReloadTab(tabContext.id)" @click="reloadTab(tabContext.id)"&gt;{{ $t('重新载入') }}&lt;/button&gt;&lt;button @click="locateTabFile(tabContext.id)"&gt;{{ $t('定位当前文件') }}&lt;/button&gt;&lt;button :disabled="!ta…</code> |
| [37](../src/TabBar.vue:37) | 界面文案 | 定位当前文件 | <code>…click="reloadTab(tabContext.id)"&gt;{{ $t('重新载入') }}&lt;/button&gt;&lt;button @click="locateTabFile(tabContext.id)"&gt;{{ $t('定位当前文件') }}&lt;/button&gt;&lt;button :disabled="!tabFilePath(tabContext.id)" @click="runTabFileAction('reveal', tabContext.i…</code> |
| [37](../src/TabBar.vue:37) | 界面文案 | 在 Finder 中显示 | <code>…tton :disabled="!tabFilePath(tabContext.id)" @click="runTabFileAction('reveal', tabContext.id)"&gt;{{ isMac ? $t('在 Finder 中显示') : $t('在资源管理器中显示') }}&lt;/button&gt;&lt;button :disabled="!tabFilePath(tabContext.id)" @click="runTabFileAction('cop…</code> |
| [37](../src/TabBar.vue:37) | 界面文案 | 在资源管理器中显示 | <code>…ilePath(tabContext.id)" @click="runTabFileAction('reveal', tabContext.id)"&gt;{{ isMac ? $t('在 Finder 中显示') : $t('在资源管理器中显示') }}&lt;/button&gt;&lt;button :disabled="!tabFilePath(tabContext.id)" @click="runTabFileAction('copy', tabContext.id)…</code> |
| [37](../src/TabBar.vue:37) | 界面文案 | 复制路径 | <code>…button&gt;&lt;button :disabled="!tabFilePath(tabContext.id)" @click="runTabFileAction('copy', tabContext.id)"&gt;{{ $t('复制路径') }}&lt;/button&gt;&lt;PluginActions location="tab-context" :document-id="tabContext.id" @execute="tabContext = null"…</code> |

<a id="src-viewmodemenu-vue"></a>

## src/ViewModeMenu.vue

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [7](../src/ViewModeMenu.vue:7) | 文案定义／其他 | 所见即所得 | <code>const items = [{ value: 'wysiwyg', label: '所见即所得', icon: Eye }, { value: 'source', label: '源代码', icon: Code2 }, { value: 'split', label: '分栏', icon: Columns2 }] as const</code> |
| [7](../src/ViewModeMenu.vue:7) | 文案定义／其他 | 源代码 | <code>const items = [{ value: 'wysiwyg', label: '所见即所得', icon: Eye }, { value: 'source', label: '源代码', icon: Code2 }, { value: 'split', label: '分栏', icon: Columns2 }] as const</code> |
| [7](../src/ViewModeMenu.vue:7) | 文案定义／其他 | 分栏 | <code>const items = [{ value: 'wysiwyg', label: '所见即所得', icon: Eye }, { value: 'source', label: '源代码', icon: Code2 }, { value: 'split', label: '分栏', icon: Columns2 }] as const</code> |
| [25](../src/ViewModeMenu.vue:25) | 界面文案 | 编辑视图 | <code>&lt;button ref="trigger" type="button" class="status-view-mode" :title="$t('编辑视图')" :aria-label="$t('编辑视图')" :aria-expanded="open" aria-haspopup="menu" @click="toggle"&gt;&lt;Eye v-if="mode === 'wysiwyg'" :size="14"/&gt;&lt;Co…</code> |
| [26](../src/ViewModeMenu.vue:26) | 界面文案 | 编辑视图 | <code>…app-shell"&gt;&lt;div v-if="open" ref="menu" class="status-view-menu" :style="position" role="menu" :aria-label="$t('编辑视图')"&gt;&lt;button v-for="item in items" :key="item.value" role="menuitemradio" :aria-checked="mode === item.value"…</code> |

<a id="src-workspace-outlinepanel-vue"></a>

## src/workspace/OutlinePanel.vue

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [6](../src/workspace/OutlinePanel.vue:6) | 界面文案 | 折叠或展开{0} | <code>…ine-index="index" @pointerdown="startOutlineDrag($event, index)"&gt;&lt;button class="outline-fold" :aria-label="$t('折叠或展开{0}', { '0': item.text })" @click="toggleOutlineHeading(index)"&gt;&lt;ChevronDown v-if="!outlineAllCollapsed &amp;&amp; !coll…</code> |
| [6](../src/workspace/OutlinePanel.vue:6) | 界面文案 | 展开全部章节 | <code>…-all-toggle" :title="outlineAllCollapsed ? $t('展开全部章节') : $t('收起全部章节')" :aria-label="outlineAllCollapsed ? $t('展开全部章节') : $t('收起全部章节')" @pointerdown.stop @click.stop="toggleAllOutlineSections"&gt;&lt;ChevronRight v-if="outlineAllCol…</code> |
| [6](../src/workspace/OutlinePanel.vue:6) | 界面文案 | 收起全部章节 | <code>…itle="outlineAllCollapsed ? $t('展开全部章节') : $t('收起全部章节')" :aria-label="outlineAllCollapsed ? $t('展开全部章节') : $t('收起全部章节')" @pointerdown.stop @click.stop="toggleAllOutlineSections"&gt;&lt;ChevronRight v-if="outlineAllCollapsed" :size="…</code> |
| [6](../src/workspace/OutlinePanel.vue:6) | 界面文案 | 暂无大纲 | <code>…e="14"/&gt;&lt;ListCollapse v-else :size="14"/&gt;&lt;/button&gt;&lt;/div&gt;&lt;div v-if="!outline.length" class="empty-state"&gt;{{ $t('暂无大纲') }}&lt;/div&gt;&lt;/div&gt;&lt;/section&gt;&lt;/template&gt;</code> |

<a id="src-workspace-topbar-ts"></a>

## src/workspace/topbar.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [3](../src/workspace/topbar.ts:3) | 文案定义／其他 | 侧栏 | <code>{ id: 'sidebar', get label() { return t('侧栏') }, shortcut: '⌘\\' },</code> |
| [4](../src/workspace/topbar.ts:4) | 文案定义／其他 | 偏好设置 | <code>{ id: 'settings', get label() { return t('偏好设置') }, shortcut: '⌘,' },</code> |
| [5](../src/workspace/topbar.ts:5) | 文案定义／其他 | 文件 | <code>{ id: 'files', get label() { return t('文件') }, shortcut: '' },</code> |
| [6](../src/workspace/topbar.ts:6) | 文案定义／其他 | 搜索文件与内容 | <code>{ id: 'search', get label() { return t('搜索文件与内容') }, shortcut: '⌘⇧F' },</code> |
| [7](../src/workspace/topbar.ts:7) | 文案定义／其他 | 切换编辑视图 | <code>{ id: 'mode', get label() { return t('切换编辑视图') }, shortcut: '⌘⇧M' },</code> |
| [8](../src/workspace/topbar.ts:8) | 文案定义／其他 | 显示或隐藏大纲 | <code>{ id: 'outline', get label() { return t('显示或隐藏大纲') }, shortcut: '' },</code> |
| [9](../src/workspace/topbar.ts:9) | 文案定义／其他 | Markdown 速查 | <code>{ id: 'reference', get label() { return t('Markdown 速查') }, shortcut: '⌘/' },</code> |
| [10](../src/workspace/topbar.ts:10) | 文案定义／其他 | 命令菜单 | <code>{ id: 'commands', get label() { return t('命令菜单') }, shortcut: '⌘K' },</code> |
| [11](../src/workspace/topbar.ts:11) | 文案定义／其他 | 主题 | <code>{ id: 'theme', get label() { return t('主题') }, shortcut: '⌘⇧T' },</code> |
| [12](../src/workspace/topbar.ts:12) | 文案定义／其他 | 导出 | <code>{ id: 'export', get label() { return t('导出') }, shortcut: '⌘E' },</code> |
| [13](../src/workspace/topbar.ts:13) | 文案定义／其他 | 分享 | <code>{ id: 'share', get label() { return t('分享') }, shortcut: '' },</code> |
| [14](../src/workspace/topbar.ts:14) | 文案定义／其他 | 历史版本 | <code>{ id: 'history', get label() { return t('历史版本') }, shortcut: '' },</code> |
| [15](../src/workspace/topbar.ts:15) | 文案定义／其他 | 专注模式 | <code>{ id: 'focus', get label() { return t('专注模式') }, shortcut: '⌘⇧D' },</code> |
| [16](../src/workspace/topbar.ts:16) | 文案定义／其他 | 只读模式 | <code>{ id: 'readOnly', get label() { return t('只读模式') }, shortcut: '' },</code> |
| [17](../src/workspace/topbar.ts:17) | 文案定义／其他 | 打字机模式 | <code>{ id: 'typewriter', get label() { return t('打字机模式') }, shortcut: '' },</code> |
| [18](../src/workspace/topbar.ts:18) | 文案定义／其他 | 拼写检查 | <code>{ id: 'spellcheck', get label() { return t('拼写检查') }, shortcut: '⌘⇧P' },</code> |
| [19](../src/workspace/topbar.ts:19) | 文案定义／其他 | 片段 | <code>{ id: 'snippets', get label() { return t('片段') }, shortcut: '' }</code> |

<a id="src-workspace-usecommandpalette-ts"></a>

## src/workspace/useCommandPalette.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [36](../src/workspace/useCommandPalette.ts:36) | 文案定义／其他 | 新建文件夹 | <code>{ id: 'newFolder', get label() { return t('新建文件夹') }, action: newFolder },</code> |
| [37](../src/workspace/useCommandPalette.ts:37) | 文案定义／其他 | 关闭文件夹 | <code>{ id: 'closeFolder', get label() { return t('关闭文件夹') }, action: () =&gt; void closeFolder() },</code> |
| [38](../src/workspace/useCommandPalette.ts:38) | 文案定义／其他 | 重命名当前文件 | <code>{ id: 'renameDocument', get label() { return t('重命名当前文件') }, action: () =&gt; { if (activeDoc.value.relativePath) void manageItem(activeDoc.value.relativePath, 'rename') } },</code> |
| [39](../src/workspace/useCommandPalette.ts:39) | 文案定义／其他 | 移动当前文件 | <code>{ id: 'moveDocument', get label() { return t('移动当前文件') }, action: () =&gt; { if (activeDoc.value.relativePath) void manageItem(activeDoc.value.relativePath, 'move') } },</code> |
| [40](../src/workspace/useCommandPalette.ts:40) | 文案定义／其他 | 删除当前文件到废纸篓 | <code>{ id: 'deleteDocument', get label() { return t('删除当前文件到废纸篓') }, action: () =&gt; { if (activeDoc.value.relativePath) void manageItem(activeDoc.value.relativePath, 'trash') } },</code> |
| [41](../src/workspace/useCommandPalette.ts:41) | 文案定义／其他 | 纯文本另存为 Markdown | <code>{ id: 'convertMarkdown', get label() { return t('纯文本另存为 Markdown') }, action: convertCurrentText },</code> |
| [42](../src/workspace/useCommandPalette.ts:42) | 文案定义／其他 | 检查当前文件失效链接 | <code>{ id: 'checkDocumentLinks', get label() { return t('检查当前文件失效链接') }, action: () =&gt; void checkResources(false) },</code> |
| [43](../src/workspace/useCommandPalette.ts:43) | 文案定义／其他 | 检查当前文件夹失效链接 | <code>{ id: 'checkFolderLinks', get label() { return t('检查当前文件夹失效链接') }, action: () =&gt; void checkResources(true) },</code> |
| [44](../src/workspace/useCommandPalette.ts:44) | 文案定义／其他 | 编辑当前图片属性 | <code>{ id: 'imageProperties', get label() { return t('编辑当前图片属性') }, action: openImageProperties },</code> |
| [45](../src/workspace/useCommandPalette.ts:45) | 文案定义／其他 | 收起或展开全部章节 | <code>{ id: 'foldHeadings', get label() { return t('收起或展开全部章节') }, action: () =&gt; { if (markdownActive.value) toggleAllOutlineSections() } },</code> |
| [46](../src/workspace/useCommandPalette.ts:46) | 文案定义／其他 | 查看历史版本 | <code>{ id: 'history', get label() { return t('查看历史版本') }, action: () =&gt; { if (!gitEnabled.value) return; void openHistory() } },</code> |
| [47](../src/workspace/useCommandPalette.ts:47) | 文案定义／其他 | 导出为 HTML | <code>{ id: 'exportHtml', get label() { return t('导出为 HTML') }, action: () =&gt; void download('html') },</code> |
| [48](../src/workspace/useCommandPalette.ts:48) | 文案定义／其他 | 导出为纯文本 | <code>{ id: 'exportText', get label() { return t('导出为纯文本') }, action: () =&gt; void download('txt') },</code> |
| [49](../src/workspace/useCommandPalette.ts:49) | 文案定义／其他 | 导出为 Word | <code>{ id: 'exportWord', get label() { return t('导出为 Word') }, action: () =&gt; void download('docx') },</code> |
| [50](../src/workspace/useCommandPalette.ts:50) | 文案定义／其他 | 导出为 PNG | <code>{ id: 'exportPng', get label() { return t('导出为 PNG') }, action: () =&gt; void download('png') },</code> |
| [51](../src/workspace/useCommandPalette.ts:51) | 文案定义／其他 | 导出为 PDF | <code>{ id: 'exportPdf', get label() { return t('导出为 PDF') }, action: () =&gt; void download('pdf') },</code> |
| [52](../src/workspace/useCommandPalette.ts:52) | 文案定义／其他 | 打开快捷键速查 | <code>{ id: 'shortcutReference', get label() { return t('打开快捷键速查') }, action: () =&gt; { referenceTab.value = 'shortcuts'; showReference.value = true } },</code> |
| [60](../src/workspace/useCommandPalette.ts:60) | 文案定义／其他 | 插件 | <code>…luginRuntime.state.commands.map(command =&gt; ({ id: command.id, label: command.title, custom: true, category: t('插件'), icon: command.icon &#124;&#124; 'settings', marker: undefined, action: () =&gt; { void pluginRuntime.execute(command.i…</code> |
| [63](../src/workspace/useCommandPalette.ts:63) | 文案定义／其他 | 更多操作 | <code>return { ...item, icon, marker: ['inlineFormula', 'insertMindmap', 'insertMermaid'].includes(item.id) ? markdownMarkers[icon] : undefined, get category() { return t('更多操作') } }</code> |

<a id="src-workspace-useworkspacecommands-ts"></a>

## src/workspace/useWorkspaceCommands.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [54](../src/workspace/useWorkspaceCommands.ts:54) | 文案定义／其他 | 新建窗口失败：{0} | <code>function newWindow() { void invoke('create_workspace_window').catch(error =&gt; deps.notify?.(t('新建窗口失败：{0}', { '0': String(error) }))) }</code> |
| [74](../src/workspace/useWorkspaceCommands.ts:74) | 文案定义／其他 | ${id === 'sidebar' ? sidebar.value ? t('收起侧栏') : t('展开侧栏') : item.label}${shortcut ? &#96; ${shortcut}&#96; : ''} | <code>return item ? &#96;${id === 'sidebar' ? sidebar.value ? t('收起侧栏') : t('展开侧栏') : item.label}${shortcut ? &#96; ${shortcut}&#96; : ''}&#96; : id</code> |
| [121](../src/workspace/useWorkspaceCommands.ts:121) | 文案定义／其他 | 插入块命令 | <code>const shortcutGuide = computed(() =&gt; [...shortcuts.map(item =&gt; ({ label: item.label, keys: formatChord(assignedChord(item.id)) })), { get label() { return t('插入块命令') }, keys: '/' }])</code> |

<a id="src-workspace-useworkspacecontroller-ts"></a>

## src/workspace/useWorkspaceController.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [49](../src/workspace/useWorkspaceController.ts:49) | 文案定义／其他 | main | <code>const detachedFileWindow = isTauri &amp;&amp; (getCurrentWindow().label !== 'main' &#124;&#124; new URLSearchParams(location.search).has('openFile'))</code> |
| [67](../src/workspace/useWorkspaceController.ts:67) | 文案定义／其他 | 未打开文件夹 | <code>const currentDirectory = ref&lt;string&gt;(isTauri ? '未打开文件夹' : saved.currentDirectory &#124;&#124; '我的文件')</code> |
| [67](../src/workspace/useWorkspaceController.ts:67) | 文案定义／其他 | 我的文件 | <code>const currentDirectory = ref&lt;string&gt;(isTauri ? '未打开文件夹' : saved.currentDirectory &#124;&#124; '我的文件')</code> |
| [69](../src/workspace/useWorkspaceController.ts:69) | 文案定义／其他 | 写作计划 | <code>const folderExpanded = ref&lt;Record&lt;string, boolean&gt;&gt;({ '写作计划': true, '随笔': true })</code> |
| [69](../src/workspace/useWorkspaceController.ts:69) | 文案定义／其他 | 随笔 | <code>const folderExpanded = ref&lt;Record&lt;string, boolean&gt;&gt;({ '写作计划': true, '随笔': true })</code> |
| [153](../src/workspace/useWorkspaceController.ts:153) | 文案定义／其他 | 自动同步设置未保存 | <code>else notify(t('自动同步设置未保存'))</code> |
| [176](../src/workspace/useWorkspaceController.ts:176) | 状态文案 | 历史版本需要桌面版 | <code>if (!isTauri) { gitStatus.value = '历史版本需要桌面版'; return }</code> |
| [178](../src/workspace/useWorkspaceController.ts:178) | 状态文案 | 内置 Git 初始化失败：${String(error)} | <code>catch (error) { gitAvailable.value = false; gitStatus.value = &#96;内置 Git 初始化失败：${String(error)}&#96; }</code> |
| [215](../src/workspace/useWorkspaceController.ts:215) | 文案定义／其他 | 菜单栏设置未保存 | <code>else notify(t('菜单栏设置未保存'))</code> |
| [255](../src/workspace/useWorkspaceController.ts:255) | 文案定义／其他 | 段落 | <code>if (selectedBlock.value === 'p') return '段落'</code> |
| [256](../src/workspace/useWorkspaceController.ts:256) | 文案定义／其他 | 标题 {0} | <code>if (/^h[1-6]$/.test(selectedBlock.value)) return t('标题 {0}', { '0': selectedBlock.value.slice(1) })</code> |
| [257](../src/workspace/useWorkspaceController.ts:257) | 文案定义／其他 | 代码块 | <code>return ({ 'code-block': '代码块', quote: '引用', list: '无序列表', 'ordered-list': '有序列表', 'task-list': '任务列表', table: '表格', formula: '公式块', mindm…</code> |
| [257](../src/workspace/useWorkspaceController.ts:257) | 文案定义／其他 | 引用 | <code>return ({ 'code-block': '代码块', quote: '引用', list: '无序列表', 'ordered-list': '有序列表', 'task-list': '任务列表', table: '表格', formula: '公式块', mindmap: '脑图', mer…</code> |
| [257](../src/workspace/useWorkspaceController.ts:257) | 文案定义／其他 | 无序列表 | <code>return ({ 'code-block': '代码块', quote: '引用', list: '无序列表', 'ordered-list': '有序列表', 'task-list': '任务列表', table: '表格', formula: '公式块', mindmap: '脑图', mermaid: '流程图', f…</code> |
| [257](../src/workspace/useWorkspaceController.ts:257) | 文案定义／其他 | 有序列表 | <code>return ({ 'code-block': '代码块', quote: '引用', list: '无序列表', 'ordered-list': '有序列表', 'task-list': '任务列表', table: '表格', formula: '公式块', mindmap: '脑图', mermaid: '流程图', footnote: '脚注', hr: '分割线'…</code> |
| [257](../src/workspace/useWorkspaceController.ts:257) | 文案定义／其他 | 任务列表 | <code>return ({ 'code-block': '代码块', quote: '引用', list: '无序列表', 'ordered-list': '有序列表', 'task-list': '任务列表', table: '表格', formula: '公式块', mindmap: '脑图', mermaid: '流程图', footnote: '脚注', hr: '分割线', 'callout-tip': '提示框…</code> |
| [257](../src/workspace/useWorkspaceController.ts:257) | 文案定义／其他 | 表格 | <code>…return ({ 'code-block': '代码块', quote: '引用', list: '无序列表', 'ordered-list': '有序列表', 'task-list': '任务列表', table: '表格', formula: '公式块', mindmap: '脑图', mermaid: '流程图', footnote: '脚注', hr: '分割线', 'callout-tip': '提示框', 'callout-n…</code> |
| [257](../src/workspace/useWorkspaceController.ts:257) | 文案定义／其他 | 公式块 | <code>…-block': '代码块', quote: '引用', list: '无序列表', 'ordered-list': '有序列表', 'task-list': '任务列表', table: '表格', formula: '公式块', mindmap: '脑图', mermaid: '流程图', footnote: '脚注', hr: '分割线', 'callout-tip': '提示框', 'callout-note': '备注框', 'ca…</code> |
| [257](../src/workspace/useWorkspaceController.ts:257) | 文案定义／其他 | 脑图 | <code>…quote: '引用', list: '无序列表', 'ordered-list': '有序列表', 'task-list': '任务列表', table: '表格', formula: '公式块', mindmap: '脑图', mermaid: '流程图', footnote: '脚注', hr: '分割线', 'callout-tip': '提示框', 'callout-note': '备注框', 'callout-important…</code> |
| [257](../src/workspace/useWorkspaceController.ts:257) | 文案定义／其他 | 流程图 | <code>…st: '无序列表', 'ordered-list': '有序列表', 'task-list': '任务列表', table: '表格', formula: '公式块', mindmap: '脑图', mermaid: '流程图', footnote: '脚注', hr: '分割线', 'callout-tip': '提示框', 'callout-note': '备注框', 'callout-important': '重要提示框', 'cal…</code> |
| [257](../src/workspace/useWorkspaceController.ts:257) | 文案定义／其他 | 脚注 | <code>…red-list': '有序列表', 'task-list': '任务列表', table: '表格', formula: '公式块', mindmap: '脑图', mermaid: '流程图', footnote: '脚注', hr: '分割线', 'callout-tip': '提示框', 'callout-note': '备注框', 'callout-important': '重要提示框', 'callout-warning': '…</code> |
| [257](../src/workspace/useWorkspaceController.ts:257) | 文案定义／其他 | 分割线 | <code>…'有序列表', 'task-list': '任务列表', table: '表格', formula: '公式块', mindmap: '脑图', mermaid: '流程图', footnote: '脚注', hr: '分割线', 'callout-tip': '提示框', 'callout-note': '备注框', 'callout-important': '重要提示框', 'callout-warning': '警告框', 'call…</code> |
| [257](../src/workspace/useWorkspaceController.ts:257) | 文案定义／其他 | 提示框 | <code>…'任务列表', table: '表格', formula: '公式块', mindmap: '脑图', mermaid: '流程图', footnote: '脚注', hr: '分割线', 'callout-tip': '提示框', 'callout-note': '备注框', 'callout-important': '重要提示框', 'callout-warning': '警告框', 'callout-caution': '注意框' }…</code> |
| [257](../src/workspace/useWorkspaceController.ts:257) | 文案定义／其他 | 备注框 | <code>…rmula: '公式块', mindmap: '脑图', mermaid: '流程图', footnote: '脚注', hr: '分割线', 'callout-tip': '提示框', 'callout-note': '备注框', 'callout-important': '重要提示框', 'callout-warning': '警告框', 'callout-caution': '注意框' } as Record&lt;string, strin…</code> |
| [257](../src/workspace/useWorkspaceController.ts:257) | 文案定义／其他 | 重要提示框 | <code>…mermaid: '流程图', footnote: '脚注', hr: '分割线', 'callout-tip': '提示框', 'callout-note': '备注框', 'callout-important': '重要提示框', 'callout-warning': '警告框', 'callout-caution': '注意框' } as Record&lt;string, string&gt;)[selectedBlock.value] &#124;&#124; '段…</code> |
| [257](../src/workspace/useWorkspaceController.ts:257) | 文案定义／其他 | 警告框 | <code>…脚注', hr: '分割线', 'callout-tip': '提示框', 'callout-note': '备注框', 'callout-important': '重要提示框', 'callout-warning': '警告框', 'callout-caution': '注意框' } as Record&lt;string, string&gt;)[selectedBlock.value] &#124;&#124; '段落'</code> |
| [257](../src/workspace/useWorkspaceController.ts:257) | 文案定义／其他 | 注意框 | <code>…ip': '提示框', 'callout-note': '备注框', 'callout-important': '重要提示框', 'callout-warning': '警告框', 'callout-caution': '注意框' } as Record&lt;string, string&gt;)[selectedBlock.value] &#124;&#124; '段落'</code> |
| [257](../src/workspace/useWorkspaceController.ts:257) | 文案定义／其他 | 段落 | <code>…提示框', 'callout-warning': '警告框', 'callout-caution': '注意框' } as Record&lt;string, string&gt;)[selectedBlock.value] &#124;&#124; '段落'</code> |
| [277](../src/workspace/useWorkspaceController.ts:277) | 文案定义／其他 | 未打开文件夹/请选择文件夹 | <code>const emptyDoc: Doc = { id: '', path: '未打开文件夹/请选择文件夹', content: '', updated: 0 }</code> |
| [314](../src/workspace/useWorkspaceController.ts:314) | 文案定义／其他 | 未命名文件 | <code>workspaceRoot: computed(() =&gt; activeDoc.value.workspaceRoot &#124;&#124; ''), isTauri, activeId, content, title: computed(() =&gt; activeDoc.value.path.split('/').pop() &#124;&#124; '未命名文件'),</code> |
| [349](../src/workspace/useWorkspaceController.ts:349) | 文案定义／其他 | 最近修改 | <code>{ value: 'modifiedDesc' as const, get label() { return t('最近修改') }, icon: RecentModifiedIcon },</code> |
| [350](../src/workspace/useWorkspaceController.ts:350) | 文案定义／其他 | 创建时间 | <code>{ value: 'createdDesc' as const, get label() { return t('创建时间') }, icon: FilePlus2 },</code> |
| [351](../src/workspace/useWorkspaceController.ts:351) | 文案定义／其他 | 名称 A → Z | <code>{ value: 'nameAsc' as const, get label() { return t('名称 A → Z') }, icon: ArrowDownAZ },</code> |
| [352](../src/workspace/useWorkspaceController.ts:352) | 文案定义／其他 | 名称 Z → A | <code>{ value: 'nameDesc' as const, get label() { return t('名称 Z → A') }, icon: ArrowUpZA }</code> |
| [398](../src/workspace/useWorkspaceController.ts:398) | 文案定义／其他 | 已复制 | <code>if (action === 'copy') { await navigator.clipboard.writeText(path); notify(t('已复制')) }</code> |
| [404](../src/workspace/useWorkspaceController.ts:404) | 文案定义／其他 | 文件操作失败：{0} | <code>} catch (error) { notify(t('文件操作失败：{0}', { '0': String(error) })) }</code> |
| [424](../src/workspace/useWorkspaceController.ts:424) | 文案定义／其他 | 未命名文件 | <code>const choice = await new Promise&lt;'save' &#124; 'discard' &#124; null&gt;(resolve =&gt; { closeTabDialog.value = { name: doc.path.split('/').pop() &#124;&#124; '未命名文件', resolve } })</code> |
| [451](../src/workspace/useWorkspaceController.ts:451) | 文案定义／其他 | 请先保存或丢弃“{0}”的修改，再移动文件 | <code>if (dirty) { notify(t('请先保存或丢弃“{0}”的修改，再移动文件', { "0": dirty.path.split('/').pop() })); return false }</code> |
| [463](../src/workspace/useWorkspaceController.ts:463) | 文案定义／其他 | 已移动；更新 {0} 处本地引用 | <code>if (rewrittenLinks &gt; 0) notify(t('已移动；更新 {0} 处本地引用', { "0": rewrittenLinks }))</code> |
| [472](../src/workspace/useWorkspaceController.ts:472) | 文案定义／其他 | 打开链接失败：{0} | <code>try { await selectDoc(file.id) } catch (error) { notify(t('打开链接失败：{0}', { '0': String(error) })) }</code> |
| [477](../src/workspace/useWorkspaceController.ts:477) | 文案定义／其他 | 打开链接失败：{0} | <code>catch (error) { notify(t('打开链接失败：{0}', { '0': String(error) })) }</code> |
| [511](../src/workspace/useWorkspaceController.ts:511) | 文案定义／其他 | 打开文件失败：{0} | <code>}).catch(error =&gt; notify(t('打开文件失败：{0}', { "0": String(error) })))</code> |
| [543](../src/workspace/useWorkspaceController.ts:543) | 文案定义／其他 | 同步完成后才能关闭文件夹 | <code>if (githubBusy.value &#124;&#124; webdavBusy.value) return notify(t('同步完成后才能关闭文件夹'))</code> |
| [553](../src/workspace/useWorkspaceController.ts:553) | 文案定义／其他 | 窗口状态未保存，请检查可用存储空间 | <code>} catch { notify(t('窗口状态未保存，请检查可用存储空间')) }</code> |
| [560](../src/workspace/useWorkspaceController.ts:560) | 文案定义／其他 | 偏好配置已恢复默认，原文件已保留 | <code>onMounted(() =&gt; { if (settingsStore.recovered) notify(t('偏好配置已恢复默认，原文件已保留')); window.addEventListener('keydown', onShortcutRecordingKeydown, true); window.addEventListener('keydown',…</code> |
| [560](../src/workspace/useWorkspaceController.ts:560) | 文案定义／其他 | 文件打开入口不可用：{0} | <code>…void syncNativeMenuShortcuts(); syncNativeMenuChecks(); void initializeSystemFiles().catch(error =&gt; notify(t('文件打开入口不可用：{0}', { "0": String(error) }))).finally(restoreExternalDrafts); void listen('markart-reset-theme', restoreDefaul…</code> |
| [560](../src/workspace/useWorkspaceController.ts:560) | 文案定义／其他 | 主题恢复入口不可用：{0} | <code>…eset-theme', restoreDefaultTheme).then(unlisten =&gt; { unlistenThemeReset = unlisten }).catch(error =&gt; notify(t('主题恢复入口不可用：{0}', { "0": String(error) }))); void listen&lt;string&gt;('markart-view-mode', event =&gt; setMode(event.payload as Mode…</code> |
| [560](../src/workspace/useWorkspaceController.ts:560) | 文案定义／其他 | 编辑视图菜单不可用：{0} | <code>…=&gt; setMode(event.payload as Mode)).then(unlisten =&gt; { unlistenViewMode = unlisten }).catch(error =&gt; notify(t('编辑视图菜单不可用：{0}', { "0": String(error) }))); void listen&lt;string&gt;('markart-menu-action', event =&gt; handleNativeMenu(event.payl…</code> |
| [560](../src/workspace/useWorkspaceController.ts:560) | 文案定义／其他 | 系统菜单不可用：{0} | <code>…handleNativeMenu(event.payload)).then(unlisten =&gt; { unlistenMenuAction = unlisten }).catch(error =&gt; notify(t('系统菜单不可用：{0}', { "0": String(error) }))); void getCurrentWindow().onCloseRequested(async event =&gt; { event.preventDefault(…</code> |
| [560](../src/workspace/useWorkspaceController.ts:560) | 文案定义／其他 | 关闭前暂存失败：{0} | <code>…wait flushDrafts(); persist(); await getCurrentWindow().destroy() } catch (error) { closing = false; notify(t('关闭前暂存失败：{0}', { "0": String(error) })) } }).then(unlisten =&gt; { unlistenClose = unlisten }).catch(error =&gt; notify(t('关闭保护…</code> |
| [560](../src/workspace/useWorkspaceController.ts:560) | 文案定义／其他 | 关闭保护不可用：{0} | <code>…失败：{0}', { "0": String(error) })) } }).then(unlisten =&gt; { unlistenClose = unlisten }).catch(error =&gt; notify(t('关闭保护不可用：{0}', { "0": String(error) }))) } customStyle = document.createElement('style'); customStyle.dataset.markartThem…</code> |
| [569](../src/workspace/useWorkspaceController.ts:569) | 文案定义／其他 | 最近文件夹无法打开：{0} | <code>} catch (error) { notify(t('最近文件夹无法打开：{0}', { "0": String(error) })) }</code> |
| [660](../src/workspace/useWorkspaceController.ts:660) | 文案定义／其他 | 读取最近文件夹失败：{0} | <code>void invoke&lt;string[]&gt;('list_recent_workspaces').then(paths =&gt; { nativeRecentDirs.value = paths }).catch(error =&gt; notify(t('读取最近文件夹失败：{0}', { "0": String(error) })))</code> |
| [726](../src/workspace/useWorkspaceController.ts:726) | 文案定义／其他 | 请先打开可编辑的文件 | <code>const pluginEditor = () =&gt; { const target = formattingEditor.value; if (!target) throw new Error('请先打开可编辑的文件'); return target }</code> |
| [755](../src/workspace/useWorkspaceController.ts:755) | 文案定义／其他 | 目标文件或关联文件存在未保存的修改 | <code>if(operation==='move'){if(!await moveWithLinks(path,String(value),root))throw new Error('目标文件或关联文件存在未保存的修改');return}</code> |
| [758](../src/workspace/useWorkspaceController.ts:758) | 文案定义／其他 | 请先保存或丢弃目标文件的修改 | <code>if(affected.some(doc=&gt;dirtyIds.value.includes(doc.id)))throw new Error('请先保存或丢弃目标文件的修改')</code> |
| [759](../src/workspace/useWorkspaceController.ts:759) | 弹窗／确认 | 删除文件“${path}”？ | <code>if(await askFileAction(&#96;删除文件“${path}”？&#96;,'',true)===null)throw new Error('已取消删除')</code> |
| [759](../src/workspace/useWorkspaceController.ts:759) | 文案定义／其他 | 已取消删除 | <code>if(await askFileAction(&#96;删除文件“${path}”？&#96;,'',true)===null)throw new Error('已取消删除')</code> |
| [764](../src/workspace/useWorkspaceController.ts:764) | 文案定义／其他 | 不支持的文件操作 | <code>else throw new Error('不支持的文件操作')</code> |
| [769](../src/workspace/useWorkspaceController.ts:769) | 文案定义／其他 | 文件不存在，请刷新文件夹 | <code>open: async id =&gt; { if (!docs.value.some(doc =&gt; doc.id === id)) throw new Error('文件不存在，请刷新文件夹'); await selectDoc(id); await nextTick() },</code> |
| [792](../src/workspace/useWorkspaceController.ts:792) | 文案定义／其他 | 插件恢复失败：{0} | <code>onMounted(() =&gt; { void pluginRuntime.restore().catch(error =&gt; notify(t('插件恢复失败：{0}', { "0": String(error) }))) })</code> |

<a id="src-workspace-useworkspaceshell-ts"></a>

## src/workspace/useWorkspaceShell.ts

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [61](../src/workspace/useWorkspaceShell.ts:61) | 文案定义／其他 | 布局设置未保存 | <code>else notify(t('布局设置未保存'))</code> |

<a id="src-workspaceoverlays-vue"></a>

## src/WorkspaceOverlays.vue

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [29](../src/WorkspaceOverlays.vue:29) | 界面文案 | 图片属性 | <code>…"properties-modal" role="dialog" aria-modal="true" :aria-label="$t('图片属性')"&gt;&lt;div class="modal-head"&gt;&lt;h2&gt;{{ $t('图片属性') }}&lt;/h2&gt;&lt;button class="icon-button" :aria-label="$t('关闭图片属性')" @click="imagePropertyDraft = null"&gt;&lt;X :size=…</code> |
| [29](../src/WorkspaceOverlays.vue:29) | 界面文案 | 关闭图片属性 | <code>…bel="$t('图片属性')"&gt;&lt;div class="modal-head"&gt;&lt;h2&gt;{{ $t('图片属性') }}&lt;/h2&gt;&lt;button class="icon-button" :aria-label="$t('关闭图片属性')" @click="imagePropertyDraft = null"&gt;&lt;X :size="19"/&gt;&lt;/button&gt;&lt;/div&gt;&lt;div class="properties-content image-pro…</code> |
| [29](../src/WorkspaceOverlays.vue:29) | 界面文案 | 替代文本 | <code>…raft = null"&gt;&lt;X :size="19"/&gt;&lt;/button&gt;&lt;/div&gt;&lt;div class="properties-content image-property-fields"&gt;&lt;label&gt;{{ $t('替代文本') }} &lt;input v-model="imagePropertyDraft.alt" :aria-label="$t('图片替代文本')"/&gt;&lt;/label&gt;&lt;label&gt;{{ $t('标题') }} &lt;inpu…</code> |
| [29](../src/WorkspaceOverlays.vue:29) | 界面文案 | 图片替代文本 | <code>…ontent image-property-fields"&gt;&lt;label&gt;{{ $t('替代文本') }} &lt;input v-model="imagePropertyDraft.alt" :aria-label="$t('图片替代文本')"/&gt;&lt;/label&gt;&lt;label&gt;{{ $t('标题') }} &lt;input v-model="imagePropertyDraft.title" :aria-label="$t('图片标题')"/&gt;&lt;/labe…</code> |
| [29](../src/WorkspaceOverlays.vue:29) | 界面文案 | 标题 | <code>…bel&gt;{{ $t('替代文本') }} &lt;input v-model="imagePropertyDraft.alt" :aria-label="$t('图片替代文本')"/&gt;&lt;/label&gt;&lt;label&gt;{{ $t('标题') }} &lt;input v-model="imagePropertyDraft.title" :aria-label="$t('图片标题')"/&gt;&lt;/label&gt;&lt;label&gt;{{ $t('路径') }} &lt;inpu…</code> |
| [29](../src/WorkspaceOverlays.vue:29) | 界面文案 | 图片标题 | <code>…label="$t('图片替代文本')"/&gt;&lt;/label&gt;&lt;label&gt;{{ $t('标题') }} &lt;input v-model="imagePropertyDraft.title" :aria-label="$t('图片标题')"/&gt;&lt;/label&gt;&lt;label&gt;{{ $t('路径') }} &lt;input v-model="imagePropertyDraft.path" :aria-label="$t('图片路径')"/&gt;&lt;/label…</code> |
| [29](../src/WorkspaceOverlays.vue:29) | 界面文案 | 路径 | <code>…label&gt;{{ $t('标题') }} &lt;input v-model="imagePropertyDraft.title" :aria-label="$t('图片标题')"/&gt;&lt;/label&gt;&lt;label&gt;{{ $t('路径') }} &lt;input v-model="imagePropertyDraft.path" :aria-label="$t('图片路径')"/&gt;&lt;/label&gt;&lt;label&gt;{{ $t('本机显示宽度（px）') }…</code> |
| [29](../src/WorkspaceOverlays.vue:29) | 界面文案 | 图片路径 | <code>…ia-label="$t('图片标题')"/&gt;&lt;/label&gt;&lt;label&gt;{{ $t('路径') }} &lt;input v-model="imagePropertyDraft.path" :aria-label="$t('图片路径')"/&gt;&lt;/label&gt;&lt;label&gt;{{ $t('本机显示宽度（px）') }} &lt;input v-model.number="imagePropertyDraft.width" type="number" min…</code> |
| [29](../src/WorkspaceOverlays.vue:29) | 界面文案 | 本机显示宽度（px） | <code>…&lt;label&gt;{{ $t('路径') }} &lt;input v-model="imagePropertyDraft.path" :aria-label="$t('图片路径')"/&gt;&lt;/label&gt;&lt;label&gt;{{ $t('本机显示宽度（px）') }} &lt;input v-model.number="imagePropertyDraft.width" type="number" min="16" max="2000" :aria-label="$t('图片显…</code> |
| [29](../src/WorkspaceOverlays.vue:29) | 界面文案 | 图片显示宽度 | <code>…度（px）') }} &lt;input v-model.number="imagePropertyDraft.width" type="number" min="16" max="2000" :aria-label="$t('图片显示宽度')"/&gt;&lt;/label&gt;&lt;div class="table-edit-actions"&gt;&lt;button @click="imagePropertyDraft = null"&gt;{{ $t('取消') }}&lt;/butto…</code> |
| [29](../src/WorkspaceOverlays.vue:29) | 界面文案 | 取消 | <code>…abel="$t('图片显示宽度')"/&gt;&lt;/label&gt;&lt;div class="table-edit-actions"&gt;&lt;button @click="imagePropertyDraft = null"&gt;{{ $t('取消') }}&lt;/button&gt;&lt;button @click="saveImageProperties"&gt;{{ $t('应用') }}&lt;/button&gt;&lt;/div&gt;&lt;/div&gt;&lt;/div&gt;&lt;/div&gt;</code> |
| [29](../src/WorkspaceOverlays.vue:29) | 界面文案 | 应用 | <code>…&gt;&lt;button @click="imagePropertyDraft = null"&gt;{{ $t('取消') }}&lt;/button&gt;&lt;button @click="saveImageProperties"&gt;{{ $t('应用') }}&lt;/button&gt;&lt;/div&gt;&lt;/div&gt;&lt;/div&gt;&lt;/div&gt;</code> |
| [34](../src/WorkspaceOverlays.vue:34) | 界面文案 | 拼写检查结果 | <code>…lityPopoverPosition.left}px&#96; }"&gt;&lt;div class="properties-modal" role="dialog" aria-modal="true" :aria-label="$t('拼写检查结果')"&gt;&lt;div class="modal-head"&gt;&lt;h2&gt;{{ $t('拼写检查') }}&lt;/h2&gt;&lt;button class="icon-button" :aria-label="$t('关闭拼写检查')" @…</code> |
| [34](../src/WorkspaceOverlays.vue:34) | 界面文案 | 拼写检查 | <code>…roperties-modal" role="dialog" aria-modal="true" :aria-label="$t('拼写检查结果')"&gt;&lt;div class="modal-head"&gt;&lt;h2&gt;{{ $t('拼写检查') }}&lt;/h2&gt;&lt;button class="icon-button" :aria-label="$t('关闭拼写检查')" @click="showSpellcheck = false"&gt;&lt;X :size="19…</code> |
| [34](../src/WorkspaceOverlays.vue:34) | 界面文案 | 关闭拼写检查 | <code>…l="$t('拼写检查结果')"&gt;&lt;div class="modal-head"&gt;&lt;h2&gt;{{ $t('拼写检查') }}&lt;/h2&gt;&lt;button class="icon-button" :aria-label="$t('关闭拼写检查')" @click="showSpellcheck = false"&gt;&lt;X :size="19"/&gt;&lt;/button&gt;&lt;/div&gt;&lt;div class="spellcheck-results"&gt;&lt;p v-if="!s…</code> |
| [34](../src/WorkspaceOverlays.vue:34) | 界面文案 | 未发现拼写错误 | <code>…k = false"&gt;&lt;X :size="19"/&gt;&lt;/button&gt;&lt;/div&gt;&lt;div class="spellcheck-results"&gt;&lt;p v-if="!spellResults.length"&gt;{{ $t('未发现拼写错误') }}&lt;/p&gt;&lt;div v-for="(item, index) in spellResults" :key="&#96;${item.offset}-${index}&#96;" class="spellcheck-item"&gt;…</code> |
| [34](../src/WorkspaceOverlays.vue:34) | 界面文案 | 查看位置 | <code>…utton @click="locateMisspelling(item)"&gt;&lt;strong&gt;{{ item.word }}&lt;/strong&gt;&lt;span&gt;{{ item.suggestions.join('、') &#124;&#124; '查看位置' }}&lt;/span&gt;&lt;/button&gt;&lt;/div&gt;&lt;/div&gt;&lt;/div&gt;&lt;/div&gt;</code> |
| [38](../src/WorkspaceOverlays.vue:38) | 界面文案 | 主题 | <code>…op" @click.self="showThemes = false"&gt;&lt;div class="theme-modal" role="dialog" aria-modal="true" :aria-label="$t('主题')"&gt;&lt;div class="theme-modal-head"&gt;&lt;Palette :size="19" aria-hidden="true"/&gt;&lt;span class="reference-esc" aria-hi…</code> |
| [38](../src/WorkspaceOverlays.vue:38) | 界面文案 | ESC | <code>…ass="theme-modal-head"&gt;&lt;Palette :size="19" aria-hidden="true"/&gt;&lt;span class="reference-esc" aria-hidden="true"&gt;ESC&lt;/span&gt;&lt;/div&gt;&lt;div class="theme-modal-body"&gt;&lt;ThemeCards :themes="allThemes" :model-value="themeName" @update:mo…</code> |
| [42](../src/WorkspaceOverlays.vue:42) | 界面文案 | 正在生成链接… | <code>…hare="toggleShare" @stop-share="stopShare"&gt;&lt;template #share&gt;&lt;div class="share-body"&gt;&lt;p v-if="shareBusy"&gt;{{ $t('正在生成链接…') }}&lt;/p&gt;&lt;template v-else-if="shareUrl"&gt;&lt;img :src="shareQr" :alt="$t('局域网分享二维码')"/&gt;&lt;p&gt;{{ $t('局域网扫码查看') }}&lt;/p&gt;…</code> |
| [42](../src/WorkspaceOverlays.vue:42) | 界面文案 | 局域网分享二维码 | <code>…-body"&gt;&lt;p v-if="shareBusy"&gt;{{ $t('正在生成链接…') }}&lt;/p&gt;&lt;template v-else-if="shareUrl"&gt;&lt;img :src="shareQr" :alt="$t('局域网分享二维码')"/&gt;&lt;p&gt;{{ $t('局域网扫码查看') }}&lt;/p&gt;&lt;/template&gt;&lt;/div&gt;&lt;/template&gt;&lt;template #share-actions&gt;&lt;button :disabled="shareB…</code> |
| [42](../src/WorkspaceOverlays.vue:42) | 界面文案 | 局域网扫码查看 | <code>…sy"&gt;{{ $t('正在生成链接…') }}&lt;/p&gt;&lt;template v-else-if="shareUrl"&gt;&lt;img :src="shareQr" :alt="$t('局域网分享二维码')"/&gt;&lt;p&gt;{{ $t('局域网扫码查看') }}&lt;/p&gt;&lt;/template&gt;&lt;/div&gt;&lt;/template&gt;&lt;template #share-actions&gt;&lt;button :disabled="shareBusy &#124;&#124; !shareUrl" @cli…</code> |
| [42](../src/WorkspaceOverlays.vue:42) | 界面文案 | 复制链接 | <code>…&gt;&lt;/template&gt;&lt;template #share-actions&gt;&lt;button :disabled="shareBusy &#124;&#124; !shareUrl" @click="copyShareUrl()"&gt;{{ $t('复制链接') }}&lt;/button&gt;&lt;/template&gt;&lt;/ExportDialog&gt;</code> |
| [43](../src/WorkspaceOverlays.vue:43) | 界面文案 | 片段 | <code>…ilityPopoverPosition.left}px&#96; }" role="dialog" :aria-label="$t('片段')"&gt;&lt;div class="utility-head"&gt;&lt;strong&gt;{{ $t('片段') }}&lt;/strong&gt;&lt;button class="icon-button" :aria-label="$t('关闭片段')" @click="showSnippetMenu = false"&gt;&lt;X :size=…</code> |
| [43](../src/WorkspaceOverlays.vue:43) | 界面文案 | 关闭片段 | <code>…t('片段')"&gt;&lt;div class="utility-head"&gt;&lt;strong&gt;{{ $t('片段') }}&lt;/strong&gt;&lt;button class="icon-button" :aria-label="$t('关闭片段')" @click="showSnippetMenu = false"&gt;&lt;X :size="15"/&gt;&lt;/button&gt;&lt;/div&gt;&lt;button v-for="item in snippets" :key="ite…</code> |
| [43](../src/WorkspaceOverlays.vue:43) | 界面文案 | 在设置中添加片段后，可从这里插入 | <code>…ent); showSnippetMenu = false"&gt;{{ item.name }}&lt;/button&gt;&lt;p v-if="!snippets.length" class="utility-empty"&gt;{{ $t('在设置中添加片段后，可从这里插入') }}&lt;/p&gt;&lt;/div&gt;</code> |
| [44](../src/WorkspaceOverlays.vue:44) | 界面文案 | 历史版本 | <code>…click.self="showHistory = false"&gt;&lt;div class="history-popover" role="dialog" aria-modal="true" :aria-label="$t('历史版本')"&gt;&lt;div class="command-search history-search"&gt;&lt;div class="history-scope-picker"&gt;&lt;button class="history-scope…</code> |
| [44](../src/WorkspaceOverlays.vue:44) | 界面文案 | 搜索范围 | <code>…Down :size="12"/&gt;&lt;/button&gt;&lt;div v-if="historyScopeOpen" class="history-scope-menu" role="menu" :aria-label="$t('搜索范围')"&gt;&lt;button v-for="scope in [{ value: 'all', label: '全部' }, { value: 'removed', label: '− 删除' }, { value: 'ad…</code> |
| [44](../src/WorkspaceOverlays.vue:44) | 界面文案 | 全部 | <code>…ass="history-scope-menu" role="menu" :aria-label="$t('搜索范围')"&gt;&lt;button v-for="scope in [{ value: 'all', label: '全部' }, { value: 'removed', label: '− 删除' }, { value: 'added', label: '+ 新增' }]" :key="scope.value" role="menuit…</code> |
| [44](../src/WorkspaceOverlays.vue:44) | 界面文案 | − 删除 | <code>…" :aria-label="$t('搜索范围')"&gt;&lt;button v-for="scope in [{ value: 'all', label: '全部' }, { value: 'removed', label: '− 删除' }, { value: 'added', label: '+ 新增' }]" :key="scope.value" role="menuitemradio" :aria-checked="historySearch…</code> |
| [44](../src/WorkspaceOverlays.vue:44) | 界面文案 | + 新增 | <code>…v-for="scope in [{ value: 'all', label: '全部' }, { value: 'removed', label: '− 删除' }, { value: 'added', label: '+ 新增' }]" :key="scope.value" role="menuitemradio" :aria-checked="historySearchScope === scope.value" @click="hist…</code> |
| [44](../src/WorkspaceOverlays.vue:44) | 界面文案 | 搜索差异 | <code>…iv&gt;&lt;Search :size="18"/&gt;&lt;input v-model="historySearch" type="search" :placeholder="$t('搜索差异')" :aria-label="$t('搜索差异')"/&gt;&lt;button class="history-close reference-esc" :aria-label="$t('关闭历史版本')" @click="showHistory = false"&gt;ESC&lt;…</code> |
| [44](../src/WorkspaceOverlays.vue:44) | 界面文案 | 关闭历史版本 | <code>…laceholder="$t('搜索差异')" :aria-label="$t('搜索差异')"/&gt;&lt;button class="history-close reference-esc" :aria-label="$t('关闭历史版本')" @click="showHistory = false"&gt;ESC&lt;/button&gt;&lt;/div&gt;&lt;div class="history-popover-head"&gt;&lt;strong&gt;{{ $t('历史版本 ·')…</code> |
| [44](../src/WorkspaceOverlays.vue:44) | 界面文案 | ESC | <code>…'搜索差异')"/&gt;&lt;button class="history-close reference-esc" :aria-label="$t('关闭历史版本')" @click="showHistory = false"&gt;ESC&lt;/button&gt;&lt;/div&gt;&lt;div class="history-popover-head"&gt;&lt;strong&gt;{{ $t('历史版本 ·') }} {{ activeDoc.path.split('/').pop()…</code> |
| [44](../src/WorkspaceOverlays.vue:44) | 界面文案 | 历史版本 · | <code>…"$t('关闭历史版本')" @click="showHistory = false"&gt;ESC&lt;/button&gt;&lt;/div&gt;&lt;div class="history-popover-head"&gt;&lt;strong&gt;{{ $t('历史版本 ·') }} {{ activeDoc.path.split('/').pop() }}&lt;/strong&gt;&lt;/div&gt;&lt;p v-if="!historyVersions.length" class="history-em…</code> |
| [44](../src/WorkspaceOverlays.vue:44) | 界面文案 | 保存文件后，可在这里查看历史版本。 | <code>…ctiveDoc.path.split('/').pop() }}&lt;/strong&gt;&lt;/div&gt;&lt;p v-if="!historyVersions.length" class="history-empty"&gt;{{ $t('保存文件后，可在这里查看历史版本。') }}&lt;/p&gt;&lt;p v-if="historySearchError" class="history-empty"&gt;{{ historySearchError }}&lt;/p&gt;&lt;p v-else-if="!histor…</code> |
| [44](../src/WorkspaceOverlays.vue:44) | 界面文案 | 没有匹配的差异 | <code>…}}&lt;/div&gt;&lt;div v-if="selectedHistoryDiff.length &amp;&amp; !filteredHistoryDiff.length" class="history-identical"&gt;{{ $t('没有匹配的差异') }}&lt;/div&gt;&lt;div class="history-diff-window"&gt;&lt;span v-for="(row, rowIndex) in filteredHistoryDiff" :key="rowInd…</code> |
| [44](../src/WorkspaceOverlays.vue:44) | 界面文案 | 差异 | <code>…story-compare-toggle" :aria-expanded="selectedHistory?.id === item.id" @click="compareHistory(item.id)"&gt;{{ $t('差异') }}&lt;/button&gt;&lt;button class="history-restore" :disabled="historyBusy &#124;&#124; dirtyIds.includes(activeId) &#124;&#124; confli…</code> |
| [44](../src/WorkspaceOverlays.vue:44) | 界面文案 | 恢复 | <code>…sy &#124;&#124; dirtyIds.includes(activeId) &#124;&#124; conflictedIds.includes(activeId)" @click="restoreHistory(item.id)"&gt;{{ $t('恢复') }}&lt;/button&gt;&lt;/div&gt;&lt;div v-if="selectedHistory?.id === item.id" class="history-compare"&gt;&lt;div v-if="!selectedH…</code> |
| [44](../src/WorkspaceOverlays.vue:44) | 界面文案 | 无差异 | <code>…=== item.id" class="history-compare"&gt;&lt;div v-if="!selectedHistoryDiff.length" class="history-identical"&gt;{{ $t('无差异') }}&lt;/div&gt;&lt;div v-if="selectedHistoryDiff.length &amp;&amp; !filteredHistoryDiff.length" class="history-identical"&gt;{{…</code> |
| [45](../src/WorkspaceOverlays.vue:45) | 界面文案 | 资源修复预览 | <code>…-backdrop"&gt;&lt;div class="file-state-modal" role="dialog" aria-modal="true" :aria-label="$t('资源修复预览')"&gt;&lt;h2&gt;{{ $t('资源修复预览') }}&lt;/h2&gt;&lt;pre&gt;− {{ repairPreview.beforeLine }}&amp;#10;+ {{ repairPreview.afterLine }}&lt;/pre&gt;&lt;p&gt;{{ $t('仅修改此处链接，保存…</code> |
| [45](../src/WorkspaceOverlays.vue:45) | 界面文案 | − | <code>…"file-state-modal" role="dialog" aria-modal="true" :aria-label="$t('资源修复预览')"&gt;&lt;h2&gt;{{ $t('资源修复预览') }}&lt;/h2&gt;&lt;pre&gt;− {{ repairPreview.beforeLine }}&amp;#10;+ {{ repairPreview.afterLine }}&lt;/pre&gt;&lt;p&gt;{{ $t('仅修改此处链接，保存文件后生效。') }}&lt;/p&gt;&lt;di…</code> |
| [45](../src/WorkspaceOverlays.vue:45) | 界面文案 | + | <code>…aria-modal="true" :aria-label="$t('资源修复预览')"&gt;&lt;h2&gt;{{ $t('资源修复预览') }}&lt;/h2&gt;&lt;pre&gt;− {{ repairPreview.beforeLine }}&amp;#10;+ {{ repairPreview.afterLine }}&lt;/pre&gt;&lt;p&gt;{{ $t('仅修改此处链接，保存文件后生效。') }}&lt;/p&gt;&lt;div class="modal-actions"&gt;&lt;button @…</code> |
| [45](../src/WorkspaceOverlays.vue:45) | 界面文案 | 仅修改此处链接，保存文件后生效。 | <code>…{ $t('资源修复预览') }}&lt;/h2&gt;&lt;pre&gt;− {{ repairPreview.beforeLine }}&amp;#10;+ {{ repairPreview.afterLine }}&lt;/pre&gt;&lt;p&gt;{{ $t('仅修改此处链接，保存文件后生效。') }}&lt;/p&gt;&lt;div class="modal-actions"&gt;&lt;button @click="repairPreview = null"&gt;{{ $t('取消') }}&lt;/button&gt;&lt;button clas…</code> |
| [45](../src/WorkspaceOverlays.vue:45) | 界面文案 | 取消 | <code>…pre&gt;&lt;p&gt;{{ $t('仅修改此处链接，保存文件后生效。') }}&lt;/p&gt;&lt;div class="modal-actions"&gt;&lt;button @click="repairPreview = null"&gt;{{ $t('取消') }}&lt;/button&gt;&lt;button class="primary" @click="applyResourceRepair"&gt;{{ $t('修改链接') }}&lt;/button&gt;&lt;/div&gt;&lt;/div&gt;&lt;/div…</code> |
| [45](../src/WorkspaceOverlays.vue:45) | 界面文案 | 修改链接 | <code>…lick="repairPreview = null"&gt;{{ $t('取消') }}&lt;/button&gt;&lt;button class="primary" @click="applyResourceRepair"&gt;{{ $t('修改链接') }}&lt;/button&gt;&lt;/div&gt;&lt;/div&gt;&lt;/div&gt;</code> |
| [46](../src/WorkspaceOverlays.vue:46) | 界面文案 | 失效链接与图片 | <code>…s = null"&gt;&lt;div class="file-state-modal" role="dialog" aria-modal="true" :aria-label="$t('失效链接与图片')"&gt;&lt;h2&gt;{{ $t('失效链接与图片') }}&lt;/h2&gt;&lt;p v-if="!missingResources.length"&gt;{{ $t('未发现失效的链接或图片。') }}&lt;/p&gt;&lt;div v-for="(item, index) in missing…</code> |
| [46](../src/WorkspaceOverlays.vue:46) | 界面文案 | 未发现失效的链接或图片。 | <code>…modal="true" :aria-label="$t('失效链接与图片')"&gt;&lt;h2&gt;{{ $t('失效链接与图片') }}&lt;/h2&gt;&lt;p v-if="!missingResources.length"&gt;{{ $t('未发现失效的链接或图片。') }}&lt;/p&gt;&lt;div v-for="(item, index) in missingResources" :key="index" class="missing-resource-row"&gt;&lt;button @cl…</code> |
| [46](../src/WorkspaceOverlays.vue:46) | 界面文案 | : | <code>…ey="index" class="missing-resource-row"&gt;&lt;button @click="locateMissingResource(item)"&gt;&lt;strong&gt;{{ item.source }}:{{ item.line }}&lt;/strong&gt;&lt;span&gt;{{ item.target }} → {{ item.resolved }}&lt;/span&gt;&lt;/button&gt;&lt;button @click="previewRe…</code> |
| [46](../src/WorkspaceOverlays.vue:46) | 界面文案 | → | <code>…@click="locateMissingResource(item)"&gt;&lt;strong&gt;{{ item.source }}:{{ item.line }}&lt;/strong&gt;&lt;span&gt;{{ item.target }} → {{ item.resolved }}&lt;/span&gt;&lt;/button&gt;&lt;button @click="previewResourceRepair(item)"&gt;{{ $t('修复') }}&lt;/button&gt;&lt;/div&gt;&lt;…</code> |
| [46](../src/WorkspaceOverlays.vue:46) | 界面文案 | 修复 | <code>…pan&gt;{{ item.target }} → {{ item.resolved }}&lt;/span&gt;&lt;/button&gt;&lt;button @click="previewResourceRepair(item)"&gt;{{ $t('修复') }}&lt;/button&gt;&lt;/div&gt;&lt;div class="modal-actions"&gt;&lt;button @click="missingResources = null"&gt;{{ $t('关闭') }}&lt;/butto…</code> |
| [46](../src/WorkspaceOverlays.vue:46) | 界面文案 | 关闭 | <code>…item)"&gt;{{ $t('修复') }}&lt;/button&gt;&lt;/div&gt;&lt;div class="modal-actions"&gt;&lt;button @click="missingResources = null"&gt;{{ $t('关闭') }}&lt;/button&gt;&lt;/div&gt;&lt;/div&gt;&lt;/div&gt;</code> |
| [47](../src/WorkspaceOverlays.vue:47) | 界面文案 | 保存对“ | <code>…ue" aria-labelledby="close-tab-title" aria-describedby="close-tab-description"&gt;&lt;h2 id="close-tab-title"&gt;{{ $t('保存对“') }}{{ closeTabDialog.name }}{{ $t('”的修改？') }}&lt;/h2&gt;&lt;p id="close-tab-description"&gt;{{ $t('丢弃后，未保存的修改将丢失。') }}&lt;…</code> |
| [47](../src/WorkspaceOverlays.vue:47) | 界面文案 | ”的修改？ | <code>…a-describedby="close-tab-description"&gt;&lt;h2 id="close-tab-title"&gt;{{ $t('保存对“') }}{{ closeTabDialog.name }}{{ $t('”的修改？') }}&lt;/h2&gt;&lt;p id="close-tab-description"&gt;{{ $t('丢弃后，未保存的修改将丢失。') }}&lt;/p&gt;&lt;div class="modal-actions"&gt;&lt;button @cli…</code> |
| [47](../src/WorkspaceOverlays.vue:47) | 界面文案 | 丢弃后，未保存的修改将丢失。 | <code>…tab-title"&gt;{{ $t('保存对“') }}{{ closeTabDialog.name }}{{ $t('”的修改？') }}&lt;/h2&gt;&lt;p id="close-tab-description"&gt;{{ $t('丢弃后，未保存的修改将丢失。') }}&lt;/p&gt;&lt;div class="modal-actions"&gt;&lt;button @click="finishCloseTab('discard')"&gt;{{ $t('丢弃') }}&lt;/button&gt;&lt;button…</code> |
| [47](../src/WorkspaceOverlays.vue:47) | 界面文案 | 丢弃 | <code>…on"&gt;{{ $t('丢弃后，未保存的修改将丢失。') }}&lt;/p&gt;&lt;div class="modal-actions"&gt;&lt;button @click="finishCloseTab('discard')"&gt;{{ $t('丢弃') }}&lt;/button&gt;&lt;button autofocus @click="finishCloseTab(null)"&gt;{{ $t('取消') }}&lt;/button&gt;&lt;button class="primary"…</code> |
| [47](../src/WorkspaceOverlays.vue:47) | 界面文案 | 取消 | <code>…lick="finishCloseTab('discard')"&gt;{{ $t('丢弃') }}&lt;/button&gt;&lt;button autofocus @click="finishCloseTab(null)"&gt;{{ $t('取消') }}&lt;/button&gt;&lt;button class="primary" @click="finishCloseTab('save')"&gt;{{ $t('保存') }}&lt;/button&gt;&lt;/div&gt;&lt;/div&gt;&lt;/di…</code> |
| [47](../src/WorkspaceOverlays.vue:47) | 界面文案 | 保存 | <code>…k="finishCloseTab(null)"&gt;{{ $t('取消') }}&lt;/button&gt;&lt;button class="primary" @click="finishCloseTab('save')"&gt;{{ $t('保存') }}&lt;/button&gt;&lt;/div&gt;&lt;/div&gt;&lt;/div&gt;</code> |
| [48](../src/WorkspaceOverlays.vue:48) | 界面文案 | 取消 | <code>…l="fileDialog.title"/&gt;&lt;div class="modal-actions"&gt;&lt;button type="button" @click="finishFileAction(false)"&gt;{{ $t('取消') }}&lt;/button&gt;&lt;button class="primary" type="submit"&gt;{{ fileDialog.confirm ? $t('删除') : $t('确定') }}&lt;/button&gt;&lt;/…</code> |
| [48](../src/WorkspaceOverlays.vue:48) | 界面文案 | 删除 | <code>…ishFileAction(false)"&gt;{{ $t('取消') }}&lt;/button&gt;&lt;button class="primary" type="submit"&gt;{{ fileDialog.confirm ? $t('删除') : $t('确定') }}&lt;/button&gt;&lt;/div&gt;&lt;/form&gt;&lt;/div&gt;</code> |
| [48](../src/WorkspaceOverlays.vue:48) | 界面文案 | 确定 | <code>…on(false)"&gt;{{ $t('取消') }}&lt;/button&gt;&lt;button class="primary" type="submit"&gt;{{ fileDialog.confirm ? $t('删除') : $t('确定') }}&lt;/button&gt;&lt;/div&gt;&lt;/form&gt;&lt;/div&gt;</code> |
| [49](../src/WorkspaceOverlays.vue:49) | 界面文案 | 加载文件更新 | <code>…backdrop"&gt;&lt;div class="file-state-modal compact-confirm-modal" role="dialog" aria-modal="true" :aria-label="$t('加载文件更新')"&gt;&lt;h2&gt;{{ $t('加载文件更新？') }}&lt;/h2&gt;&lt;p&gt;{{ $t('加载磁盘上的最新内容。当前未保存的修改将被替换。') }}&lt;/p&gt;&lt;div class="modal-actions"&gt;&lt;button…</code> |
| [49](../src/WorkspaceOverlays.vue:49) | 界面文案 | 加载文件更新？ | <code>…"file-state-modal compact-confirm-modal" role="dialog" aria-modal="true" :aria-label="$t('加载文件更新')"&gt;&lt;h2&gt;{{ $t('加载文件更新？') }}&lt;/h2&gt;&lt;p&gt;{{ $t('加载磁盘上的最新内容。当前未保存的修改将被替换。') }}&lt;/p&gt;&lt;div class="modal-actions"&gt;&lt;button @click="keepCurrentEd…</code> |
| [49](../src/WorkspaceOverlays.vue:49) | 界面文案 | 加载磁盘上的最新内容。当前未保存的修改将被替换。 | <code>…onfirm-modal" role="dialog" aria-modal="true" :aria-label="$t('加载文件更新')"&gt;&lt;h2&gt;{{ $t('加载文件更新？') }}&lt;/h2&gt;&lt;p&gt;{{ $t('加载磁盘上的最新内容。当前未保存的修改将被替换。') }}&lt;/p&gt;&lt;div class="modal-actions"&gt;&lt;button @click="keepCurrentEditing"&gt;{{ $t('保留当前内容') }}&lt;/button&gt;&lt;button cl…</code> |
| [49](../src/WorkspaceOverlays.vue:49) | 界面文案 | 保留当前内容 | <code>…&gt;{{ $t('加载磁盘上的最新内容。当前未保存的修改将被替换。') }}&lt;/p&gt;&lt;div class="modal-actions"&gt;&lt;button @click="keepCurrentEditing"&gt;{{ $t('保留当前内容') }}&lt;/button&gt;&lt;button class="primary" :disabled="conflict.disk.missing" @click="reloadAfterConflict()"&gt;{{ $t(…</code> |
| [49](../src/WorkspaceOverlays.vue:49) | 界面文案 | 加载更新 | <code>…容') }}&lt;/button&gt;&lt;button class="primary" :disabled="conflict.disk.missing" @click="reloadAfterConflict()"&gt;{{ $t('加载更新') }}&lt;/button&gt;&lt;/div&gt;&lt;/div&gt;&lt;/div&gt;</code> |
| [51](../src/WorkspaceOverlays.vue:51) | 界面文案 | 深海 | <code>…&lt;Teleport to="body"&gt;&lt;div v-if="fileDragGhost" class="topbar-drag-ghost" :class="{ 'ghost-dark': themeName === '深海', 'ghost-sand': themeName === '陶纸' }" :style="{ left: &#96;${fileDragGhost.x}px&#96;, top: &#96;${fileDragGhost.y}px&#96; }"…</code> |
| [51](../src/WorkspaceOverlays.vue:51) | 界面文案 | 陶纸 | <code>…eDragGhost" class="topbar-drag-ghost" :class="{ 'ghost-dark': themeName === '深海', 'ghost-sand': themeName === '陶纸' }" :style="{ left: &#96;${fileDragGhost.x}px&#96;, top: &#96;${fileDragGhost.y}px&#96; }"&gt;&lt;FileText :size="15"/&gt;&lt;span&gt;{{ fi…</code> |

<a id="src-workspaceview-vue"></a>

## src/WorkspaceView.vue

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [27](../src/WorkspaceView.vue:27) | 界面文案 | 调整侧栏宽度 | <code>&lt;div v-if="sidebar" class="pane-resizer sidebar-resizer" role="separator" aria-orientation="vertical" :aria-label="$t('调整侧栏宽度')" @pointerdown="startResize('sidebar', $event)"/&gt;</code> |

<a id="src-writingmodemenu-vue"></a>

## src/WritingModeMenu.vue

| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |
|---|---|---|---|
| [6](../src/WritingModeMenu.vue:6) | 文案定义／其他 | 只读模式 | <code>const labels={readOnly:'只读模式',focus:'专注模式',typewriter:'打字机模式'}</code> |
| [6](../src/WritingModeMenu.vue:6) | 文案定义／其他 | 专注模式 | <code>const labels={readOnly:'只读模式',focus:'专注模式',typewriter:'打字机模式'}</code> |
| [6](../src/WritingModeMenu.vue:6) | 文案定义／其他 | 打字机模式 | <code>const labels={readOnly:'只读模式',focus:'专注模式',typewriter:'打字机模式'}</code> |
| [30](../src/WritingModeMenu.vue:30) | 界面文案 | 写作模式 | <code>…:title="enabledModes.length ? enabledModes.map(id=&gt;$t(labels[id])).join(' · ') : $t('写作模式')" :aria-label="$t('写作模式')" :aria-expanded="open" aria-haspopup="menu" @mousedown.prevent @click="toggle"&gt;&lt;component :is="triggerIcon…</code> |
| [31](../src/WritingModeMenu.vue:31) | 界面文案 | 写作模式 | <code>…eport defer to=".app-shell"&gt;&lt;div v-if="open" ref="menu" class="writing-mode-menu" role="menu" :aria-label="$t('写作模式')" :style="position"&gt;&lt;button v-for="id in ids" :key="id" role="menuitemcheckbox" :aria-checked="active(id)"…</code> |


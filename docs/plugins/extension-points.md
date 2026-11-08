# 界面扩展入口

[插件 API](../plugins.md) / 界面扩展入口

| 入口 | 接口 |
| --- | --- |
| 文件树、文件页签、页签右键、格式工具栏、`/`、右上角更多菜单 | `ui.registerAction()` |
| topbar 功能图标 | 用户将 `topbar-menu` 操作项固定到 topbar |
| 命令工具、快捷键 | `commands.register()` |
| 左右侧栏 | `ui.sidebar.register()` |
| 小窗、居中弹窗 | `ui.openDialog()` |
| 偏好设置分类、控件 | `settings.registerCategory()`、`settings.registerControl()` |

宿主管理容器、排列、尺寸、主题和资源清理。插件提供界面描述与回调。

[界面](ui.md) · [面板](sidebar.md) · [设置](preferences.md)

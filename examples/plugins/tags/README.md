# 标签插件

汇总行内标签和 Frontmatter 标签。点击标签查看对应文件，再点击文件打开。

## 构建与安装

在项目根目录运行：

```sh
node scripts/build-plugin.mjs examples/plugins/tags
```

在「偏好设置 → 插件 → 本地」导入本文件夹，启用后在「偏好设置 → 布局」放置面板，或运行「打开标签」命令。安装文件为 `manifest.json`、`main.js` 和 `styles.css`。

## 使用的 API

| API | 用途 |
| --- | --- |
| `api.ui.sidebar.register()` | 注册面板及显示、隐藏、关闭回调 |
| `api.ui.sidebar.getItem()`、`SidebarItem.refresh()` | 刷新当前面板 |
| `api.commands.register()`、`api.ui.sidebar.open()` | 注册打开面板命令 |
| `api.index.files()` | 分页读取当前目录中的文本文件 |
| `api.index.subscribe()` | 监听索引更新 |
| `api.events.whenReady()` | 等待目录索引就绪 |
| `api.files.open()` | 打开选中的文件 |
| `api.lifecycle.setTimeout()`、`track()`、`signal` | 合并刷新并清理订阅与定时器 |
| `api.ui.notify()` | 展示文件打开错误 |

`api.index.metadata()`：读取标签，按文件版本缓存。
`api.index.tagged()`：查询标签对应文件。

`SidebarItem.setState()`：保存所选标签。

## 权限与更新

声明 `editor.read`、`files.read`、`index.read`：读取当前文件上下文、打开文件、查询当前目录索引。启用时按清单提供能力，切换目录无需确认。插件不写入文件，不直接读取 SQLite 或访问编辑器实例。

数据来自宿主的持久化索引；索引变化合并为 100 毫秒后的刷新。面板隐藏时取消订阅，关闭或停用时清理定时器和缓存。

## 显示范围

最多显示 300 个标签、每个标签最多 200 个文件。所选标签通过 SidebarItem 状态保存。

## 源码

- `main.ts`：面板内容与交互。
- `../shared/indexPanel.ts`：索引分页、刷新和资源清理。
- `styles.css`：面板样式，使用宿主主题变量。

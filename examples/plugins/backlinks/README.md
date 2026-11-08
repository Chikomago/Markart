# 反向链接插件

跟随当前文件，展示链接到它的文件、引用次数和行号。点击来源打开文件。

## 构建与安装

在项目根目录运行：

```sh
node scripts/build-plugin.mjs examples/plugins/backlinks
```

在「偏好设置 → 插件 → 本地」导入本文件夹，启用后在「偏好设置 → 布局」放置面板，或运行「打开反向链接」命令。安装文件为 `manifest.json`、`main.js` 和 `styles.css`。

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

`api.index.links()`：读取链接关系并按目标文件筛选。

## 权限与更新

声明 `editor.read`、`files.read`、`index.read`：读取当前文件上下文、打开文件、查询当前目录索引。启用时按清单提供能力，切换目录无需确认。插件不写入文件，不直接读取 SQLite 或访问编辑器实例。

数据来自宿主的持久化索引；索引变化合并为 100 毫秒后的刷新。面板隐藏时取消订阅，关闭或停用时清理定时器和缓存。

## 显示范围

最多显示 200 个来源文件，每个来源显示前 5 个引用行号；点击打开来源文件，不跳转到具体行。

## 源码

- `main.ts`：面板内容与交互。
- `../shared/indexPanel.ts`：索引分页、刷新和资源清理。
- `styles.css`：面板样式，使用宿主主题变量。

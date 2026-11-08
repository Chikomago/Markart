# 插件 API v2

插件使用 `manifest.json` 和 `main.js`，插件逻辑在独立 Worker 内的 QuickJS 沙箱运行；自定义 Web 界面在应用内隔离 iframe 中显示。宿主提供编辑、文件、索引与固定界面入口。

[类型定义](../src/plugins/sdk/index.ts) · [发布与构建](plugins/publishing.md) · [权限](plugins/permissions.md)

```js
export async function activate(api) {
  await api.commands.register({
    id: 'hello', title: '问候',
    run: () => api.ui.notify('你好')
  })
}

export function deactivate() {}
```

## 接口

| 模块 | 参考 |
| --- | --- |
| 命令与快捷键 | [commands](plugins/commands.md) |
| 编辑与事务 | [editor](plugins/editor.md) · [快照](plugins/documents.md) |
| 补全、装饰与诊断 | [editor.extensions](plugins/editor.md#编辑扩展) |
| 固定界面入口与弹窗 | [ui](plugins/ui.md) · [入口表](plugins/extension-points.md) |
| 独立 Web 界面 | [ui.openWebView](plugins/webview.md) |
| 侧栏面板 | [ui.sidebar](plugins/sidebar.md) |
| 偏好设置控件 | [settings](plugins/preferences.md) |
| 文件与 Frontmatter | [files](plugins/filesystem.md) |
| SQLite 文件索引 | [index](plugins/index.md) |
| Markdown 渲染 | [markdown](plugins/markdown.md) |
| 导出钩子与格式 | [exports](plugins/exports.md) |
| 事件与就绪 | [events](plugins/events.md) |
| 数据与剪贴板 | [storage、clipboard](plugins/storage.md) |
| 系统凭据 | [secrets](plugins/secrets.md) |
| 网络请求 | [network](plugins/network.md) |
| 资源与取消 | [lifecycle](plugins/lifecycle.md) |
| 主题变量 | [样式](plugins/themes.md) |
| 错误 | [错误码](plugins/errors.md) |

跨沙箱调用返回 Promise。注册与监听返回清理函数，插件停用时由宿主自动回收。完整签名以 SDK 类型定义为准。

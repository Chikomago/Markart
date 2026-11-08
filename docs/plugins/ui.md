# 界面

[插件 API](../plugins.md) / `ui`

## 固定入口

```ts
await api.ui.registerAction({
  id: 'action',
  commandId: 'command',
  location: 'topbar-menu',
  title: '标题',
  icon: 'search',
  order: 0
})
```

先注册命令，再绑定操作项。`id` 和 `commandId` 使用插件内短 ID。图标使用宿主图标名。

| location | 入口 |
| --- | --- |
| `file-tree` | 文件树右键菜单 |
| `topbar-menu` | 右上角更多菜单；用户可固定到 topbar 并排序 |
| `tab` | 文件页签图标 |
| `tab-context` | 文件页签右键菜单 |
| `format-toolbar` | 格式工具栏 |
| `slash` | `/` 菜单 |

命令自动进入命令工具。插件不单独注册 topbar 图标。

## 弹窗

```js
const dialog = await api.ui.openDialog({
  title: '标题', mode: 'modal', width: 480,
  render: () => ({ tag: 'p', text: '内容' })
})
await dialog.close()
```

`mode` 为 `modal` 或 `popover`。宿主管理定位、焦点、关闭与外框。

`persistent: true` 时点击弹窗外部（包括正文）不会关闭，只能通过句柄 `close()` 或右上角关闭按钮关闭；适合需要一边查看正文一边保留的悬浮窗。

返回句柄 `DialogHandle`：

- `dialog.close()` 关闭弹窗；
- `dialog.refresh()` 以当前状态重新调用 `render` 并原地重画内容。弹窗内容只在打开时渲染一次，异步结果（如网络请求的回复）到达后需调用 `refresh()` 更新显示。

```js
let answer = ''
const dialog = await api.ui.openDialog({
  title: 'AI', persistent: true, width: 360,
  render: () => ({ tag: 'p', text: answer || '思考中…' })
})
answer = '回复内容'
dialog.refresh()
```

## UiNode

```ts
{
  tag: 'button',
  text: '更新',
  attrs: { disabled: false, 'aria-label': '更新' },
  on: { click: async event => { /* event.value / event.checked */ } },
  children: []
}
```

支持基础文本、输入控件及 SVG 元素。事件回调在沙箱执行，只接收值与勾选状态。`img` 仅接受 PNG、JPEG、GIF、WebP 的 base64 数据地址。完整类型见 SDK。

`styles.css` 作用于插件视图的 Shadow DOM；不接受外部资源、转义、`@` 规则或动态表达式。绘制与布局限制在面板内容区域。

## 通知与输入

```ts
await api.ui.notify(message)
const text = await api.ui.prompt(title, initial?) // string | null
```

## 自定义 Web 界面

`ui.openWebView()` 加载插件包内已构建的 HTML，与 `openDialog()` 的声明式组件分开；不允许嵌入 SidebarItem。见 [自定义 Web 界面](webview.md)。

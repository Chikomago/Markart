# 事件

[插件 API](../plugins.md) / `events`

```ts
const off = await api.events.on(event, callback)
await api.events.whenReady(stage, root?)
await off()
```

| event | 内容 |
| --- | --- |
| `document:open`、`document:change`、`document:save` | 文件内容与标识 |
| `workspace:change` | 活动目录切换 |
| `selection:change` | `{ from, to, text }` |
| `theme:change` | 主题信息 |

文件与选区事件需要编辑读取权限。未获编辑读取权限时不向插件推送正文。

`stage` 为 `app`、`layout` 或 `index`；索引就绪需要传入 `root`。索引变更通过 `index.subscribe()` 订阅。

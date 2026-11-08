# 文件快照

[插件 API](../plugins.md) / 文件快照

```ts
type Snapshot = {
  id: string
  root: string
  path?: string
  revision: number
  content: string
}
```

| 字段 | 说明 |
| --- | --- |
| `id` | 编辑器文件 ID |
| `root` | 所属目录 |
| `path` | 目录内路径；临时文件可为空 |
| `revision` | 当前宿主会话中的内容版本 |
| `content` | 原始文本 |

使用 `editor.getSnapshot()` 读取，使用 `editor.transaction()` 提交版本对应的修改。持久化文件 ID 与版本见 [files](filesystem.md) 和 [index](index.md)。

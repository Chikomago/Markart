# 编辑器

[插件 API](../plugins.md) / `editor`

| 方法 | 返回值 |
| --- | --- |
| `getSnapshot()` | 当前文件快照或 `null` |
| `getSelection()` | `{ from, to, text }` |
| `setSelection(from, to)` | 设置选区 |
| `getCursor()`、`setCursor(position)` | 读取、设置光标 |
| `getMode()` | `wysiwyg`、`source` 或 `split` |
| `applyEdits(request)` | 应用修改，返回新快照 |
| `transaction(request)` | 应用修改及可选选区，形成一次撤销记录 |
| `onChange(callback)` | 监听正文变化，返回清理函数 |

```ts
const snapshot = await api.editor.getSnapshot()
await api.editor.transaction({
  documentId: snapshot.id,
  expectedRevision: snapshot.revision,
  edits: [{ from: 0, to: 0, text: '# 标题\n' }],
  selection: { from: 5, to: 5 }
})
```

位置按 UTF-16 计数，范围为 `[from, to)`。修改需 `editor.write` 权限；版本冲突与只读状态会拒绝修改。

## 编辑扩展

```ts
await api.editor.extensions.registerCompletionProvider({ id, provide })
await api.editor.extensions.registerDecorationProvider({ id, provide })
await api.editor.extensions.registerDiagnosticProvider({ id, provide })
```

`provide(context)` 支持异步返回。上下文包含快照、选区、模式、输入法状态与取消信号。

| 类型 | 返回项 |
| --- | --- |
| 补全 | `{ label, detail?, insertText, from, to }` |
| 装饰 | `{ from, to, kind, title? }`；`kind` 为 `highlight`、`underline`、`muted`、`strong` |
| 诊断 | `{ from, to, severity, message, fix? }`；修复为 `{ title, edits }` |

宿主显示候选与标记。过期结果不应用；修复重新校验文件版本，遵守只读设置。

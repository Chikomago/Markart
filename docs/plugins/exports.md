# 导出

[插件 API](../plugins.md) / `exports`

| 方法 | 回调 |
| --- | --- |
| `beforeExport(callback)` | 接收内容、目录、路径与格式；返回 `false` 取消 |
| `transformAst(callback)` | 接收 AST 副本并返回处理后的 AST |
| `registerFormat(format)` | 注册格式标题、扩展名、导出与可选预览 |

```js
await api.exports.registerFormat({
  id: 'format', title: '格式名', extension: 'txt',
  export: snapshot => snapshot.content,
  preview: snapshot => ({ tag: 'pre', text: snapshot.content })
})
```

导出结果为文本或字节数组，上限 20 MB。`preview()` 返回 `UiNode`；未提供预览时显示导出文本。

AST 结构为 `{ type: 'root', children, links }`，`children` 使用 Marked token 结构。转换作用于副本，正文不修改。

新格式出现在现有导出选项卡中，保存路径由宿主选择。内置格式处理失败时，可在弹窗明确跳过报错插件后重试。

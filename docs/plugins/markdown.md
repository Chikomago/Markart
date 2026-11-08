# Markdown 渲染

[插件 API](../plugins.md) / `markdown`

```ts
await api.markdown.registerBlockRenderer({
  id: 'block', language: 'language-name',
  render: ({ text, language, root, source }) => ({ tag: 'pre', text })
})
await api.markdown.registerInlineRenderer({
  id: 'inline', pattern: '%%',
  render: ({ text }) => ({ tag: 'strong', text })
})
```

块渲染器使用标准围栏代码块的语言名。行内 `pattern` 是成对的字面分隔符，长度 1–8，不是正则表达式；内置 Markdown 标记不可注册。

返回 `UiNode`，支持 Promise。读取源码需要对应目录的 `editor.read` 权限。交互渲染失败保留宿主回退内容；导出失败中止本次生成。

Mermaid、脑图和公式的替代块渲染器由用户在插件设置中选择，默认保持内置渲染器。

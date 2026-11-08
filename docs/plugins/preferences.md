# 偏好设置

[插件 API](../plugins.md) / `settings`

```js
await api.settings.registerCategory({ id: 'general', title: '设置' })
await api.settings.registerControl({
  id: 'enabled', category: 'general', title: '启用', type: 'toggle',
  getValue: () => true,
  onChange: async value => {}
})
```

| type | 控件与补充字段 |
| --- | --- |
| `text`、`password`、`textarea` | 文本、密码、多行输入 |
| `number` | 数字输入；`min`、`max`、`step` |
| `select` | 下拉；`options: [{ value, label }]` |
| `segmented` | 切换块；`options: [{ value, label }]` |
| `toggle` | 开关 |
| `button` | 按钮；`buttonText`、`onClick()` |

普通控件提供 `getValue()` 和 `onChange(value)`，均支持 Promise。公共字段为 `id`、`category`、`title`、`description?`。

`category` 可使用本插件分类或内置分类：`layout`、`appearance`、`startup`、`storage`、`sync`、`editor`、`templates`、`snippets`、`shortcuts`、`spellcheck`、`export`、`plugins`。

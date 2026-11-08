# 数据与剪贴板

[插件 API](../plugins.md) / `storage`、`clipboard`

```ts
await api.storage.set(key, value)
const value = await api.storage.get(key, fallback?)
await api.storage.remove(key)

const text = await api.clipboard.readText()
await api.clipboard.writeText(text)
```

数据按插件 ID 隔离，值为 JSON，单项上限 1 MB。停用保留数据。剪贴板读写在清单中分别声明。

API Key 等敏感值使用 [系统凭据 API](secrets.md)，不要写入普通 `storage`。

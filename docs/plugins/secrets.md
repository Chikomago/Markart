# 系统凭据

[插件 API](../plugins.md) / `secrets`

需要在 `manifest.json` 声明 `secrets` 权限。macOS 使用钥匙串，Windows 使用凭据管理器；不支持的平台返回错误，不回退到普通插件存储。

| 方法 | 返回值 |
| --- | --- |
| `get(key)` | `Promise<string \| null>` |
| `set(key, value)` | `Promise<void>` |
| `remove(key)` | `Promise<void>` |

```ts
await api.secrets.set('api-key', value)
const key = await api.secrets.get('api-key')
await api.secrets.remove('api-key')
```

密钥名称限 1–120 个英文字母、数字、点、下划线或连字符；内容最多 4096 字节。不存在时读取返回 `null`，重复删除不报错。宿主自动使用当前插件 ID 作为命名空间，插件不能传入其他插件的 ID。开发版和正式版按应用标识分别存储。

自定义 Web 界面通过 `window.markart.request('secrets.get', 'api-key')` 等方式调用。权限检查与插件逻辑一致。

系统存储保护落盘凭据；读取后仍是插件运行内存中的字符串，不会防止已获此插件执行权限的代码读取它。不得将密钥记录到日志、普通配置或错误提示中。

停用或卸载不主动删除系统凭据；插件可以提供清除配置操作调用 `remove()`。删除普通插件存储不会删除系统凭据。

迁移普通配置中的密钥时，先 `set()`、再 `get()` 验证，最后删除旧字段；任一步失败都应保留原配置，允许用户再次迁移。

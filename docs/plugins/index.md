# 文件索引

[插件 API](../plugins.md) / `index`

索引由 Rust 管理，使用 SQLite 持久化。需要 `index.read`，查询范围为当前文件夹及已打开页签所属目录。

| 方法 | 参数 |
| --- | --- |
| `files(options)` | `{ root, cursor?, after?, limit? }` |
| `content(options)` | `{ root, id, version }` |
| `metadata(options)` | `{ root, id, version }` |
| `links(options)` | `{ root, id?, direction? }` |
| `tagged(options)` | `{ root, tag }` |
| `subscribe(root, callback)` | 订阅索引游标变化，返回清理函数 |

`files()` 返回 `{ cursor, files, next }`，使用 `next` 继续分页。`metadata()` 返回标题、标签、属性和解析错误；`links()` 返回链接源、目标及源码范围。

```js
await api.events.whenReady('index', root)
const page = await api.index.files({ root, limit: 100 })
const metadata = await api.index.metadata({ root, id: page.files[0].id, version: page.files[0].version })
```

接口不提供 SQL 或数据库连接。类型结构见 SDK。

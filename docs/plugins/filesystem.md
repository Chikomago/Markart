# 文件

[插件 API](../plugins.md) / `files`

文件操作限定于当前文件夹及已打开页签所属目录。`FileRef` 来自 `files.list()`、`files.get()` 或索引查询。

```ts
type FileRef = { root: string; id: string; path: string; version?: number }
```

| 方法 | 作用 |
| --- | --- |
| `list(root)`、`get(root, id)` | 查询文件标识与版本 |
| `view()` | 文件列表当前的选择与筛选结果，只读 |
| `open(file)` | 打开到编辑器页签 |
| `readText(file)` | 读取正文；已打开文件读取编辑器内容 |
| `writeText(file, text, expectedVersion)` | 校验版本后修改 |
| `readBytes(file)`、`writeBytes(file, bytes, expectedVersion)` | 附件读写，需附件权限 |
| `create(root, path, text?)`、`mkdir(root, path)` | 新建文件或文件夹 |
| `move(file, path)`、`rename(file, name)` | 移动或重命名，并更新关联链接和页签 |
| `trash(file)` | 通过宿主确认后移到回收站 |
| `readFrontmatter(file)` | 读取 YAML 键值 |
| `updateFrontmatter(file, properties, expectedVersion)` | 版本校验后写入属性 |
| `watch(root, callback)` | 监听目录变更，返回清理函数 |

先读取文件，再使用对应的 `version` 修改。打开中的文件走编辑事务，可撤销；未打开文件检查磁盘版本。附件接口不能覆盖已打开文件。

`FileRef.id` 使用 SQLite 索引中的文件 ID；`Snapshot.id` 使用编辑器 ID，不混用。索引更新与文件保存是独立阶段。

## 跟随文件列表

```ts
type FileView = {
  root: string
  files: string[]      // 当前可见的文件，已应用筛选与搜索
  folders: string[]    // 当前可见文件所在的文件夹
  selected: { path: string; kind: 'file' | 'folder' } | null
  filter: { extensions: string[]; search: string; active: boolean }
}
```

`files.view()` 返回用户在文件列表里看到的那一份内容，需要 `files.read`。路径都是工作区相对路径，不会给出工作区之外的绝对路径。

`selected` 在文件树选中文件夹时是那个文件夹，否则是当前打开的文件；`filter.active` 表示列表正在筛选或搜索。开发者不需要重复实现扩展名、隐藏文件等判断，直接用 `files.view().files` 取交集即可。

用户改动筛选、搜索或在文件树里切换选中项时，宿主会重新渲染面板，无需轮询。

# 命令

[插件 API](../plugins.md) / `commands`

```js
const unregister = await api.commands.register({
  id: 'command', title: '标题', icon: 'search', shortcut: 'mod+shift+y',
  run: async context => {}
})
await api.commands.execute('command')
const commands = await api.commands.list()
```

| 字段 | 说明 |
| --- | --- |
| `id` | 插件内唯一 ID，宿主自动加前缀 |
| `title` | 命令工具和入口标题 |
| `icon` | 可选宿主图标名 |
| `shortcut` | 可选默认快捷键，用户可在设置中覆盖 |
| `run(context)` | 执行回调，支持 Promise |

上下文包含触发入口、目标文件、所属目录、选区和锚点。文件树及页签右键使用操作目标；非活动文件的选区为 `null`。权限不足的内容不传入回调。

命令可绑定[界面操作项](ui.md)。快捷键冲突由宿主检查。

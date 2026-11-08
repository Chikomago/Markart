# 错误

[插件 API](../plugins.md) / 错误

```ts
try {
  await api.editor.transaction(request)
} catch (error) {
  // error.code、error.message
}
```

| code | 含义 |
| --- | --- |
| `permission-denied` | 权限未声明或超出文件访问范围 |
| `not-found` | 文件、实例或资源不存在 |
| `read-only` | 当前对象不可修改 |
| `stale-revision` | 内容或磁盘版本已变化 |
| `cancelled` | 用户取消或资源已关闭 |
| `timeout` | 执行或响应超时 |
| `not-ready` | 宿主服务或索引尚未就绪 |
| `invalid-argument` | 参数无效 |
| `plugin-fault` | 插件回调或运行时故障 |

预期的权限、取消和版本错误不会自动停用插件。未处理的插件故障会记录所属插件并停用它。

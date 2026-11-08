# 网络

[插件 API](../plugins.md) / `network`

```ts
const response = await api.network.request(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ key: 'value' })
})
// { status, headers, body }
```

`network` 权限不限制域名，声明后可访问任意 `http`/`https` 地址。宿主仅做协议安全校验：仅允许 `http`/`https` 协议，URL 不得内嵌用户名密码，非本机地址必须使用 `https`（本机指 `localhost`、`127.0.0.1`、`::1` 及常见内网网段）。重定向逐跳重新校验。请求体与响应体上限 2 MB，超时 30 秒。

接口经桌面端宿主代理执行，不向插件开放浏览器 fetch 或原生网络桥。

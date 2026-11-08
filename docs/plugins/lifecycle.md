# 生命周期

[插件 API](../plugins.md) / `lifecycle`

```ts
export async function activate(api) {}
export async function deactivate() {}
```

| 接口 | 作用 |
| --- | --- |
| `lifecycle.signal` | 插件停止时触发的取消信号 |
| `lifecycle.track(dispose)` | 注册自建资源的清理函数 |
| `lifecycle.setTimeout(callback, ms)` | 受管理的一次性定时器 |
| `lifecycle.setInterval(callback, ms)` | 受管理的重复定时器，需 `background` 权限 |

注册和监听由宿主自动清理。面板、弹窗、渲染任务各自拥有资源作用域；停用时统一结束。

插件逻辑使用 32 MB QuickJS 堆限制与执行中断；宿主 Worker 请求另有超时。内存限制针对插件 JS 堆，不等同于操作系统进程隔离。

未捕获的受管理回调异常、执行超时或运行时故障会停用本插件并保留错误。重新启用需要用户操作。

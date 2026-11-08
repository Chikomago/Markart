# 插件隔离验证

启动：

```sh
node scripts/check-plugin-isolation-server.mjs
```

打开 `http://127.0.0.1:5189/`，点击「运行网络测试」。页面使用真实的 `webDocument()` 构建三个 sandbox iframe，只包含模拟脚本，不读取 Markart 数据。

| 端点 | 测试 |
| --- | --- |
| `/probe/fetch` | iframe 脚本直接调用 fetch |
| `/probe/image` | 脚本动态加载图片 |
| `/probe/navigation` | iframe 自身通过 location.href 导航 |

本机服务统计到达端点的请求，不只根据客户端错误推断拦截结果。服务仅监听 127.0.0.1，计数只保存在内存中，不记录请求正文。重启或点击运行会重置计数。

2026-10-29 独立浏览器实测：fetch 0、image 0、navigation 1。网络边界问题已复现，不能据此推断原生 WebKit 或 WebView2 的行为。

已执行 750ms 有界同步计算测试，结果见下文；无限循环和内存压力测试未执行。死循环和内存压力测试必须使用单独测试进程、临时用户数据目录，并确保其他窗口没有未保存内容；不要在实际工作窗口运行。当前验证页不包含自动执行失控脚本的入口。

## 原生验证

`src-tauri/examples/navigation_probe.rs` 是独立 Tauri 窗口，无主程序命令注册，入口仅为本机验证页。

```sh
cargo run --offline --manifest-path src-tauri/Cargo.toml --example navigation_probe
```

2026-10-29 在 macOS 原生窗口中点击运行并刷新计数：fetch 0、image 0、navigation 0。与普通浏览器的 navigation 1 对比，确认原生导航回调可阻止本次 iframe 自身导航。

策略实现位于 `src-tauri/src/navigation_policy.rs`，已接入主程序插件钩子。仅允许应用内源、about:blank/srcdoc，以及开发配置的精确来源首页；不允许任意 localhost 端口或路径。应用外链接应通过宿主的外部打开能力处理。

此实测只涵盖 macOS 的这组模拟操作，不表示所有网络通道或 Windows 子框架均已验证。当前 Wry 的 Windows 实现只注册 NavigationStarting，未找到 FrameNavigationStarting；仍需 Windows 专项实现与实测。

## 有界脚本故障验证（2026-10-29）

按钮「运行 750ms 有界计算」在测试 iframe 内执行 750ms 同步计算；父页面每 16ms 记录心跳，计算结束后测量最大间隔。自动清理定时器、消息监听和测试 iframe。

| 环境 | iframe 计算 | 宿主最大心跳间隔 | 结果 |
| --- | --- | --- | --- |
| 独立浏览器 | 750ms | 17ms | 此用例未观察到共享阻塞 |
| macOS 原生 WebKit | 750ms | 752ms | 宿主执行被一起阻塞 |

这证明当前 macOS iframe 不是独立的脚本故障边界；不代表已经测试无限循环、内存耗尽或进程崩溃。Windows 未实测。测试使用模拟脚本，未接触用户文件或 Key。

## 独立进程对照（2026-10-29）

同一示例程序可作为两个进程运行：可执行文件名含 `worker` 时为计算进程，其他情况为模拟宿主。分别使用独立应用标识与窗口。测试服务仅传递任务编号、PID 和耗时，所有内容为模拟数据；这套本机轮询只用于验证，不是正式插件通信协议。

macOS 实测：宿主 PID 50916，计算进程 PID 50763，计算持续 750ms，宿主最大心跳间隔 21ms。对比单进程 iframe 的 752ms 延迟，本次用例不再出现共享阻塞。

此结果只验证 750ms 同步计算，不证明内存耗尽、崩溃、无限循环处置或 Windows 行为。正式 openWebView 目前仍使用原有 iframe 承载，尚未迁移到独立进程。

## 历史缓存测量

独立进程承载及其冷/热启动测试程序已随回退移除。历史模拟结果为冷启动 1155/751ms、预热 233/198ms，仅作为方案评估记录，不代表当前应用内浮层。

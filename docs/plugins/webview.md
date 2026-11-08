# 自定义 Web 界面

`api.ui.openDialog()` 接收 `UiNode`，由宿主组件绘制普通弹窗。
`api.ui.openWebView()` 加载插件包内的 HTML，创建应用内独立浮层，使用隔离 iframe 加载界面，不启动额外原生窗口或 helper 进程，不可嵌入 SidebarItem 或其他容器。

```ts
const view = await api.ui.openWebView({
  title: 'AI 助手',
  entry: 'views/index.html',
  width: 780,
  height: 480,
  transparent: true,
  shadow: 'floating',
  persistent: true,
  // x: 100, y: 120，省略时居中
})
await view.close()
```

位置和尺寸采用应用界面的 CSS 像素，宿主仅将其限制在可视范围内。透明模式不绘制背景和边框，阴影由 `shadow` 指定；普通模式提供背景。不附加标题栏，插件自行提供关闭按钮，也可通过 Esc 关闭。`persistent` 默认开启，点击外部不关闭；自定义界面不添加灰色遮罩，外部区域允许操作。

宽度和高度范围为 80–4096 CSS 像素，显示时按可视范围收紧。位置省略时居中。

## 打包

Vue、React、Svelte 或原生 HTML 均可。开发者自行使用 Vite 等工具编译，宿主不解析 `.vue`、JSX、TypeScript，也不共享宿主的 Vue 实例。

```text
manifest.json
main.js
views/
  index.html
  app.js
  app.css
  logo.svg
```

首版通过本地导入收集 `views/` 下资源，保存在插件包中，合计上限 20 MB；原生导入最多 1000 个资源，不允许符号链接。HTML 的脚本、样式表、图片等 `src`、`link href` 相对路径会映射到包内资源。入口路径不可包含 `..`、绝对路径或外部地址。

构建时将脚本依赖合并，关闭动态代码分块；CSS 的图片、字体等依赖使用构建工具内联为 data URL。也可直接输出单个自包含 HTML。暂不支持运行时相对模块导入、CSS 相对资源依赖、远程插件资源下载或运行时读取资源文件。

## 通信

界面通过 `window.markart.request(method, ...args)` 调用宿主：

```js
const snapshot = await window.markart.request('editor.getSnapshot')
const files = await window.markart.request('files.list', snapshot.root)
// 自定义关闭按钮
parent.postMessage({ type: 'markart-web-close' }, '*')
```

支持的接口为 `editor` 的快照、选区、光标、模式与修改接口；`files` 的 list、view、get、open、readText、readFrontmatter；`index` 的 files、content、metadata、links、tagged；`storage` 的 get、set、remove；`network.request`；剪贴板读写与 `ui.notify`。参数与返回值沿用对应 PluginAPI 定义，仅支持可序列化数据，不传递事件回调。失败时 Promise 拒绝，错误包含 `message` 和 `code`；单个视图最多 32 个并发请求，超过时返回 `not-ready`。

调用沿用当前插件声明的权限与文件范围。iframe 使用 `sandbox="allow-scripts"`，不能访问宿主 DOM、CM6 或原生桥；业务操作通过 PluginAPI 代理。直接网络连接、嵌套框架和表单提交被禁用，网络调用须经过 PluginAPI。

关闭界面时移除 iframe、主题观察器及消息监听；插件停用时关闭其全部视图。浮层随主窗口显示，不提供原生系统窗口或界面嵌套。

安全边界：sandbox 与 CSP 用于隔离宿主并限制常规资源请求，不应把它视为可运行恶意插件的完整网络沙箱；浏览器导航等通道还需要原生层的进一步限制。只安装可信插件。

## 主题

宿主在视图加载及主题变化时同步 `--markart-paper`、`--markart-ink`、`--markart-muted`、`--markart-line`、`--markart-bg`、`--markart-hover`、`--markart-accent` ，明暗模式通过根元素的 `data-markart-color-scheme` 属性提供。为避免 WebKit 给透明 iframe 绘制不透明画布，根元素的原生 `color-scheme` 保持 `normal`。插件可直接在 CSS 使用这些变量，保留独立预览的后备值。同步不强制覆盖插件自己的布局或配色。

```css
.panel { background: var(--markart-paper, #fff); color: var(--markart-ink, #303641); }
```

需要重新绘制 Canvas 等内容时，监听 `window` 的 `markart-theme-change` 事件。

透明页面的空白区域仍参与 iframe 命中测试。需要让空白区域可穿透时，页面可向父窗口发送 `{ type: "markart-web-content-bounds", top, bottom, width?, expanded }`，数值为视图内 CSS 像素。`expanded: false` 时宿主将视图窗口实际缩小到 `bottom - top` 的高度（至少 40px），可选 `width` 设置收起宽度（至少 240px），底边保持不动、默认水平居中；`expanded: true` 时恢复打开时的高度。默认保留整个视图。此消息只支持矩形窗口尺寸变化，不提供任意透明像素的鼠标穿透。

页面可监听可取消的 `markart-escape` 事件，并调用 `event.preventDefault()` 优先处理收起预览等操作；没有取消事件时，宿主关闭视图。

自定义界面也可调用 `secrets.get/set/remove`，需声明 `secrets` 权限，见 [系统凭据](secrets.md)。

## 阴影

`shadow?: "none" | "soft" | "floating"`，默认 `none`。阴影由宿主在 iframe 外绘制，不增加 iframe 尺寸。`soft` 为轻阴影，`floating` 为悬浮阴影。透明视图仅在报告收起内容范围且高度不超过 70px 时绘制，展开后的内部预览阴影由插件控制，避免给整块透明区域添加矩形阴影。

原生导航策略仅允许应用页面和内联框架页面；开发模式额外允许配置的开发入口。macOS 独立测试已验证一个 iframe 自导航拦截用例；Windows 子框架仍待专项验证。这不等于完整网络沙箱或脚本故障隔离。

macOS 实测：iframe 的 750ms 同步计算会同时阻塞宿主约 752ms。自定义视图不具备 QuickJS Worker 的执行限额，不保证失控脚本只影响插件；重计算应放入 Worker。这是当前承载的已知限制。


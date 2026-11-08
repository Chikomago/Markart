# 构建与发布

[插件 API](../plugins.md) / 构建与发布

## 包结构

```text
plugin/
├─ manifest.json
├─ main.js
├─ styles.css          可选，用于声明式视图
└─ views/              可选，自定义 Web 界面资源
```

开发入口可使用 `main.ts`，发布时编译为单文件 `main.js`。包中代码不会在安装时执行。`views/` 的构建与导入限制见 [自定义 Web 界面](webview.md#打包)。

## manifest.json

```json
{
  "apiVersion": 2,
  "id": "example.plugin",
  "name": "插件名称",
  "version": "1.0.0",
  "minAppVersion": "0.1.0",
  "description": "插件说明",
  "permissions": { "required": [], "optional": [] }
}
```

| 字段 | 说明 |
| --- | --- |
| `apiVersion` | 当前为 `2` |
| `id` | 小写字母、数字及点/连字符组成的唯一 ID |
| `name`、`version` | 名称与语义版本 |
| `minAppVersion` | 可选最低宿主版本 |
| `permissions` | [权限声明](permissions.md)；省略时不授予权限 |

## 构建

```sh
node scripts/build-plugin.mjs examples/plugins/ui-extensions
```

构建会比对产物中调用的 API 与清单声明，缺声明时打印提示：未声明的能力在运行时会被宿主拒绝，因此这一步不要忽略。

类型入口：[PluginAPI](../../src/plugins/sdk/index.ts)。运行时提供标准 ECMAScript，不提供 Node.js、浏览器 DOM 或直接模块加载；依赖随构建打包。

## 发布

GitHub Release 附件包含 `manifest.json`、`main.js` 和可选 `styles.css`。Release 标签与清单版本一致。

本项目不运营或维护官方社区插件目录。开发者可独立维护第三方插件目录，用户自行配置目录地址；目录维护与分发责任由相应维护者承担。

## 目录清单

目录是一份公开 HTTPS 地址上的 JSON 数组，只描述“仓库在哪、叫什么、给谁看”，**不写版本**：

```json
[
  {
    "id": "example.notes",
    "name": "笔记增强",
    "description": "在侧栏显示反向链接",
    "repo": "alan/markart-notes",
    "author": "Alan"
  }
]
```

- `id` 在**同一目录内必须唯一**，重复会让整份目录加载失败。
- 同一 `id` 可以出现在不同目录中，它们被当作两个独立的包：各自安装、各自更新、互不覆盖。宿主会在已安装列表里显示完整来源目录地址，同一时间只允许其中一个启用；重启后恢复此前启用的那个来源。
- 版本只存在于包内 `manifest.json`，安装时从与版本同名的 Release 下载附件。
- 目录地址必须位于 GitHub（`github.com` 或 `raw.githubusercontent.com`）的公开 HTTPS 路径下。

# 主题

主题由一个文件夹组成，可以拆分 CSS、携带图片和字体。到「偏好设置 → 外观 → 添加主题」选择文件夹，Markart 会复制整个目录，再从副本加载。

只提供外观样式时，使用主题文件夹即可。需要命令、定时切换等功能时，再通过[插件主题接口](plugins/themes.md)注册主题。

## 目录与清单

```text
my-theme/
├── theme.json
├── theme.css
├── styles/
│   └── editor.css
└── assets/
    └── texture.png
```

`theme.json` 控制显示名称、卡片预览和样式加载顺序：

```json
{
  "name": "我的主题",
  "description": "素白 · 苔绿",
  "preview": ["#f4f4f0", "#ffffff", "#52694b"],
  "styles": ["theme.css", "styles/editor.css"]
}
```

| 字段 | 类型与默认值 | 用途与限制 |
| --- | --- | --- |
| `name` | `string`，必填 | 显示名称，1～80 个字符；允许不同主题同名 |
| `description` | `string`，可省略 | 名称下方的简介，最多 120 个字符；省略时不显示 |
| `preview` | 三个颜色字符串，可省略 | 依次为侧栏、正文、强调色；支持 `#RGB`、`#RRGGBB`、`#RRGGBBAA`；省略时使用中性配色 |
| `styles` | `string[]`，默认 `["theme.css"]` | 相对于主题根目录的 CSS 路径，至少一个；按数组顺序加载 |

没有 `theme.json` 时，以文件夹名称作为主题名，加载根目录的 `theme.css`。样式路径不能是绝对路径，不能包含 `..`，并且必须指向目录内已有的 `.css` 文件。

预览颜色只控制主题卡片，不会生成正文或界面样式；实际配色写在 CSS 中。

## 完整配色示例

将下面内容保存为 `theme.css`，可得到一套浅色配色。每套主题应定义自己的完整配色，不继承上一套主题。深色主题将 `color-scheme` 改为 `dark`，并调整对应颜色。

在 macOS 上，快速记录的原生标题和保存窗口，以及主编辑器关闭未保存文档时的原生确认窗口，会按当前主题在 `.app-shell` 上实际生效的 `color-scheme` 选择深浅外观。文件夹主题、自定义 CSS 主题和插件注册的主题都应在深色配色中写 `color-scheme: dark`；浅色配色写 `color-scheme: light`。仅修改 `--paper` 等颜色变量不会切换原生窗口外观。

```css
.app-shell {
  color-scheme: light;
  --accent-ink: #ffffff;
  --bg: #fafaf8;
  --panel: #f4f4f0;
  --paper: #ffffff;
  --ink: #30332e;
  --muted: #696d64;
  --line: #e6e7e0;
  --line-strong: #cdd0c5;
  --accent: #52694b;
  --accent-soft: #e8ede3;
  --hover: #eceee7;
  --shadow:0 16px 48px rgba(44,48,36,.1);
  --tab-inactive-bg:transparent;
  --tab-hover-bg:var(--hover);
  --tab-inactive-ink:var(--muted);
  --tab-active-ink:var(--ink);
  --tabbar-bg: #fafaf8;
  --tab-active-bg: #ffffff;
  --tab-divider: #dfe2d8;
  --tab-active-shadow:0 2px 8px rgba(44,48,36,.06);
  --code-text: #404a3c;
  --syntax-keyword: #805880;
  --syntax-string: #527144;
  --syntax-number: #9b613b;
  --syntax-comment: #72766c;
  --syntax-function: #436e79;
  --syntax-type: #826b36;
  --syntax-heading: #30332e;
  --syntax-link: #52694b;
  --syntax-markup: #777e70;
  --syntax-invalid: #b64c49;
  --theme-note: #547487;
  --theme-tip: #52764c;
  --theme-important: #805880;
  --theme-warning: #a0752b;
  --theme-caution: #b15a4a;
}
```

### 变量对应位置

| 变量 | 用途 |
| --- | --- |
| `--bg`、`--panel`、`--paper` | 应用背景、侧栏等面板、正文纸面 |
| `--ink`、`--muted` | 正文和次要文字 |
| `--accent`、`--accent-soft`、`--accent-ink` | 强调色、选中底色、强调色上的文字 |
| `--hover`、`--line`、`--line-strong`、`--shadow` | 悬停底色、普通边框、强调边框、弹层阴影 |
| `--tabbar-bg`、`--tab-inactive-bg`、`--tab-hover-bg`、`--tab-active-bg` | 标签栏、未选中标签、悬停标签、选中标签的背景 |
| `--tab-inactive-ink`、`--tab-active-ink`、`--tab-divider`、`--tab-active-shadow` | 标签文字、分隔线和选中阴影 |
| `--code-text` | 代码默认文字颜色 |
| `--syntax-keyword`、`--syntax-string`、`--syntax-number`、`--syntax-comment` | 关键字、字符串、数字、注释 |
| `--syntax-function`、`--syntax-type`、`--syntax-heading`、`--syntax-link` | 函数、类型、标题、链接 |
| `--syntax-markup`、`--syntax-invalid` | 标记和无效语法 |
| `--theme-note`、`--theme-tip`、`--theme-important`、`--theme-warning`、`--theme-caution` | 五类警告框的主题色 |

## 多文件与资源

`styles` 按顺序加载，覆盖关系遵循 CSS 层叠规则。也可以在 CSS 中使用 `@import`；已导入的文件不必再写入 `styles`。

```css
/* styles/editor.css */
.app-shell .sidebar {
  background-image: url("../assets/texture.png");
}
```

`@import`、`url()` 和 `@font-face` 的相对路径以所在 CSS 文件为基准。分发主题时，把引用的资源一起放入主题文件夹。

CSS 可以覆盖界面选择器，调整间距、圆角和尺寸，不限于上述变量。选择器以 `.app-shell` 为范围，可减少对其他页面的影响。字体和正文排版已有用户设置，覆盖这些属性前需考虑是否会使设置失效。

导出使用独立样式和导出设置，不会直接复制主题 CSS。

## 文件夹主题与插件主题

| 项目 | 主题文件夹 | `api.themes.register()` |
| --- | --- | --- |
| 来源 | 用户选择本地目录 | 启用的插件 |
| 样式 | 多个 CSS 文件 | 一个 CSS 字符串 |
| 图片、字体等资源 | 支持目录内资源 | 禁止 `@import`、`url()`、`image-set()`、`expression()` |
| 卡片信息 | 名称、简介、三色预览 | ID、名称 |
| 生命周期 | 删除后移除应用中的副本 | 停用插件或注销主题时移除 |

插件注册主题后不会自动选中。当前使用的插件主题被移除时，应用切回「晴空」。接口参数和示例见[插件文件](plugins/themes.md)。

## 安装目录与内置主题

导入的主题保存在应用数据目录的 `themes/<安装 ID>/` 中。每次添加会分配独立 ID，同名主题不会互相覆盖；删除时只移除应用中的副本，原文件夹保留。修改原文件夹不会更新已安装的副本。

| 版本 | macOS 主题目录 |
| --- | --- |
| 正式版 | `~/Library/Application Support/com.markart.app/themes/` |
| 开发版 | `~/Library/Application Support/com.markart.dev/themes/` |

单个文件夹最多 50 MiB，不支持符号链接。主题加载 CSS，不执行脚本。

五套内置主题位于 [`src/themes/`](../src/themes/)，由 [`themes.ts`](../src/settings/themes.ts)显式导入。它不会扫描源码目录自动发现新主题。社区主题通过「添加主题」安装，不需要修改这个文件。

主题列表依次展示内置主题、已添加的文件夹主题和插件主题。内置主题按代码中的顺序排列；文件夹主题的显示名称不参与排序。

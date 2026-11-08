# 插件界面样式

[插件 API](../plugins.md) / 样式

以下适用于声明式视图；独立 Web 界面使用 [主题同步变量](webview.md#主题)。

视图样式放在包内 `styles.css`，宿主将其限制在插件内容容器内。

| 变量 | 用途 |
| --- | --- |
| `--paper`、`--panel` | 内容与面板背景 |
| `--ink`、`--muted` | 主要与次要文字 |
| `--line`、`--line-strong` | 分割线与边框 |
| `--accent`、`--accent-soft` | 强调色与强调背景 |

```css
.summary { color: var(--muted); }
```

通过 `UiNode.attrs.class` 绑定局部类名。容器尺寸、外框、标题与分隔条由宿主管理。

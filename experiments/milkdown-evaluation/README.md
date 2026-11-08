# Milkdown 替换验证

此目录是独立实验；Markart 现有编辑器及根目录依赖未修改。固定依赖版本为 `@milkdown/kit 7.22.3`、`jsdom 26.1.0`。

## 运行

```bash
npm ci --prefix experiments/milkdown-evaluation
npm test --prefix experiments/milkdown-evaluation
node experiments/milkdown-evaluation/roundtrip.mjs /absolute/path/to/document.md
```

不传路径时使用 `fixture.md`。实验在 DOM 模拟器中创建 Milkdown 编辑器，启用 CommonMark、GFM、代码块组件，检查加载后序列化、代码块编辑和两侧内容传递。不写入被测文件。

## 结果（2026-10-16）

| 检查 | 结果 |
| --- | --- |
| 未编辑原文往返，内置样本 | 265 → 263 字节，不一致。`\\#` 变成 `#`，行尾两个空格变成反斜杠换行。 |
| 未编辑原文往返，`test-note.md` | 3404 → 3503 字节，不一致；首处变化在转义字符。 |
| 代码块编辑 | 示例中的两个围栏代码块均生成可编辑 CodeMirror；在获得焦点后，代码块内的修改能进入 Milkdown 的 Markdown 输出。 |
| 图片宽度 | `{width=128px}` 作为普通文字保留在图片后；实际 `<img>` 没有 `width` 属性。 |
| CodeMirror 源码 → Milkdown | 可通过 `replaceAll` 传递编辑，但未编辑的前缀也被重新序列化，无法直接满足 Markart 的原文保真要求。 |
| Milkdown → CodeMirror 源码 | 内容可传回；本实验用整篇替换验证内容通路，尚未验证光标、撤销、输入法、滚动和冲突处理。 |

## 结论

Milkdown 的现成组件能减少富文本代码块、图片等交互的自研量，但不能直接替换 Markart 的双视图实现。现有的“未编辑 Markdown 原文不变”要求在基本加载／序列化中已失败；自定义图片宽度也需要扩展。若要迁移，需要另做原文差异合并层，并验证两套编辑器的增量同步、光标映射与撤销。当前建议保留现有编辑器，不做整机迁移。

此实验只检查 DOM 行为，不能证明 Milkdown 的视觉布局、桌面端实际输入或大文件性能。

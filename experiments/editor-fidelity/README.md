# CodeMirror 保真实验

`index.html`、`main.js` 和 `fidelity.mjs` 是独立的 CodeMirror 原型，用于研究局部编辑和换行保留，不是 Markart 当前编辑器的实现。

运行实验检查：

```sh
node --test experiments/editor-fidelity/fidelity.test.mjs
```

产品单元测试已移至 `tests/`，运行 `npm test`。原生编辑器交互由 `scripts/check-editor-browser.mjs` 检查。测试迁移记录见 [测试说明](../../docs/testing.md)。

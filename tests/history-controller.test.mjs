import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

test('workspace exposes the same history search scope used to filter versions', () => {
  const source = readFileSync('src/workspace/useWorkspaceController.ts', 'utf8')
  const start = source.lastIndexOf('\n  return {') + '\n  return '.length
  const expression = source.slice(start, source.lastIndexOf('\n}') ).trim()
  const historySearchScope = { value: 'all' }
  const bindings = new Proxy({ historySearchScope }, {
    has: () => true,
    get: (target, key) => key === Symbol.unscopables ? undefined : target[key]
  })
  const context = new Function('bindings', `with(bindings) { return (${expression}) }`)(bindings)
  assert.equal(context.historySearchScope, historySearchScope)
  context.historySearchScope.value = 'removed'
  assert.equal(historySearchScope.value, 'removed')
})

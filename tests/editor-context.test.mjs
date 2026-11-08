import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { parse } from '@vue/compiler-sfc'

const controller = ts.createSourceFile('useWorkspaceController.ts', readFileSync('src/workspace/useWorkspaceController.ts', 'utf8'), ts.ScriptTarget.Latest, true)
const entry = controller.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'useWorkspaceController')
const returned = entry.body.statements.filter(ts.isReturnStatement).at(-1).expression
const exposed = new Set(returned.properties.map(property => property.name?.getText(controller)))
const { descriptor } = parse(readFileSync('src/EditorWorkspace.vue', 'utf8'))

test('editor link event handler is exposed by its actual workspace controller', () => {
  const handlers = [...descriptor.template.content.matchAll(/@open-link="(\w+)"/g)].map(match => match[1])
  assert.ok(handlers.length > 0)
  for (const handler of handlers) assert.ok(exposed.has(handler), `editor cannot call missing context handler: ${handler}`)
})
test('editor completion receives the directory list from its actual workspace controller', () => {
  const binding = /:link-directories="(\w+)"/.exec(descriptor.template.content)?.[1]
  assert.ok(binding)
  assert.ok(exposed.has(binding), `editor cannot read missing context field: ${binding}`)
})

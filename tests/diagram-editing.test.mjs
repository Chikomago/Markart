import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
const bundle = await build({ entryPoints: ['src/editor/diagramEditing.ts'], bundle: true, external: ['mermaid'], platform: 'node', format: 'esm', write: false })
const { flowConnections, connectFlowNodes, disconnectFlowNodes, setFlowNodeShape, flowNodeShape, editFlowNode, addFlowNode, deleteFlowNode, addMindmapNode, editMindmapNode, deleteMindmapNode } = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64'))
const nodes = ['A', 'B', 'C'].map(id => ({ id, label: id }))
test('flow edits preserve shapes, comments and arrows without spaces', () => {
  const source = '```mermaid\ngraph TD\nA[Start]-->B{End}\n%% keep\nclassDef accent fill:#fff\n```'
  const updated = editFlowNode(source, 'B', 'Changed', nodes)
  assert.ok(updated.includes('A[Start]-->B{"Changed"}'))
  assert.ok(updated.includes('%% keep\nclassDef accent fill:#fff'))
  const added = addFlowNode(updated, 'New node', nodes, 'B')
  assert.ok(added.source.includes(`B --> ${added.id}`))
})
test('deleting a flow node removes incident edges and preserves unrelated group edges', () => {
  const source = '```mermaid\ngraph LR\nA[One] & B[Two] --> C[Three]\n```'
  const updated = deleteFlowNode(source, 'B', nodes)
  assert.ok(updated.includes('A[One] --> C[Three]'))
  assert.ok(!updated.includes('B[Two]'))
  const chain = deleteFlowNode('graph TD\nA --> B --> C\n%% keep', 'B', nodes)
  assert.equal(chain, 'graph TD\nA\nC\n%% keep')
})
test('mindmap edits preserve unrelated branches and add sibling or child at correct depth', () => {
  const source = '```mindmap\nroot((Topic))\n  First\n    Child\n  Second\n```'
  assert.ok(editMindmapNode(source, 'node0', 'Updated').includes('root((Updated))'))
  assert.ok(addMindmapNode(source, 'node1', 'New child').source.includes('First\n    Child\n    New child\n  Second'))
  assert.ok(addMindmapNode(source, 'node1', 'Sibling', true).source.includes('Child\n  Sibling\n  Second'))
  assert.equal(deleteMindmapNode(source, 'node1'), '```mindmap\nroot((Topic))\n  Second\n```')
  assert.equal(deleteMindmapNode(source, 'node0'), '')
})

test('numeric nodes and modern shape metadata retain their identity and shape', () => {
  const source = '```mermaid\ngraph TD\n1@{ shape: diamond, label: "First" } --> 2[Next]\n```'
  const changed = editFlowNode(source, '1', 'Updated', [{ id: '1' }, { id: '2' }])
  assert.match(changed, /1@\{ shape: diamond, label: "Updated" \} --> 2\[Next\]/)
})

test('shape changes preserve edges, labels, metadata and repeated definitions', () => {
  const source = 'graph TD\nA[Start] --> B[(Database)]\nA[Start] --> C{End}\n%% keep'
  const changed = setFlowNodeShape(source, 'A', 'doc', nodes)
  assert.equal((changed.match(/shape: doc/g) || []).length, 2)
  assert.ok(changed.includes(' --> B[(Database)]') && changed.includes(' --> C{End}\n%% keep'))
  assert.equal(flowNodeShape(changed, 'A'), 'doc')
  assert.equal(flowNodeShape(source, 'B'), 'cyl')
  const modern = 'graph TD\nA@{shape: diamond, label: "First", class: custom} --> B'
  assert.equal(setFlowNodeShape(modern, 'A', 'cyl', nodes), modern.replace('shape: diamond', 'shape: cyl'))
})

test('connections retain nodes, edge labels, groups, chains and comments', () => {
  const source = '```mermaid\ngraph TD\nA[Start] -->|Yes| B{Check} --> C[(Store)] %% keep\n```'
  assert.equal(flowConnections(source, nodes).length, 2)
  assert.equal(connectFlowNodes(source, 'A', 'B', nodes), source)
  const added = connectFlowNodes(source, 'C', 'A', nodes)
  assert.ok(added.includes('C --> A'))
  const removed = disconnectFlowNodes(added, 'A', 'B', nodes)
  assert.ok(removed.includes('A[Start]') && removed.includes('B{Check}') && removed.includes('C[(Store)]') && removed.includes('%% keep'))
  assert.deepEqual(flowConnections(removed, nodes).map(edge => [edge.start, edge.end]), [['B','C'],['C','A']])
  const grouped = disconnectFlowNodes('graph LR\nA[One] & B[Two] --> C[Three]', 'A', 'C', nodes)
  assert.deepEqual(flowConnections(grouped, nodes).map(edge => [edge.start, edge.end]), [['B','C']])
  assert.ok(grouped.includes('A[One]'))
  const dotted = 'graph LR\nA -.-> B\nB ==> C'
  assert.equal(flowConnections(dotted, nodes).length, 2)
  assert.equal(disconnectFlowNodes(dotted, 'A', 'B', nodes), 'graph LR\nA\nB\nB ==> C')
})

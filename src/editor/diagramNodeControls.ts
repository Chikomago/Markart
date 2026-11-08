import { t } from '../i18n'
import { mountFlowConnections } from './diagramConnections'
import { diagramDirection } from './diagramDirection'
import { isolateHistory } from '@codemirror/commands'
import type { EditorView } from '@codemirror/view'
import { connectFlowNodes, flowNodeShapes, flowNodeShape, setFlowNodeShape, addFlowNode, deleteFlowNode, editFlowNode, mindmapNodes, addMindmapNode, deleteMindmapNode, editMindmapNode, validateDiagramEdit, diagramNodeLabel, type DiagramNode } from './diagramEditing'

type Selection = { from: number; id?: string; focus?: boolean; edit?: boolean }
const selections = new WeakMap<EditorView, Selection>()
export function mountDiagramNodeControls(root: HTMLElement, source: string, from: number, view: EditorView): (() => void) | undefined {
  const diagram = root.querySelector<HTMLElement>('.cm-mermaid-preview')
  if (!diagram || (!/^\s*(?:graph|flowchart)\b/im.test(source) && !/^\s*mindmap\b/im.test(source) && !/^\s*(?:`{3,}|~{3,})mindmap\b/im.test(source))) return
  const mindmap = diagram.dataset.diagram === 'mindmap'
  const elements = [...diagram.querySelectorAll<SVGGElement>('g.node')]
  const nodes: DiagramNode[] = elements.map(node => {
    const id = node.id.match(/(?:^|-)flowchart-(.*)-\d+$/)?.[1] || node.id
    return { id, label: diagramNodeLabel(source, id, mindmap, node.querySelector('.nodeLabel')?.textContent?.trim() || node.textContent?.trim() || '') }
  })
  const retained = selections.get(view), state: Selection = retained?.from === from ? retained : { from }
  selections.set(view, state)
  const tools = document.createElement('div'); tools.className = 'cm-diagram-node-tools'; tools.contentEditable = 'false'; tools.setAttribute('role', 'toolbar'); tools.setAttribute('aria-label', t('节点操作'))
  const nodeAdd = document.createElement('button'); nodeAdd.type = 'button'; nodeAdd.className = 'cm-diagram-add-child'; nodeAdd.setAttribute('aria-label', t('节点旁添加子节点')); nodeAdd.title = t('添加子节点（Tab）'); nodeAdd.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
  if (!mindmap) { nodeAdd.setAttribute('aria-label', t('节点旁添加节点')); nodeAdd.title = t('添加节点（Tab）') }
  const nodeRemove = document.createElement('button'); nodeRemove.type = 'button'; nodeRemove.className = 'cm-diagram-remove-node'; nodeRemove.setAttribute('aria-label', t('节点旁删除节点')); nodeRemove.title = t('删除节点及子节点'); nodeRemove.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14"/></svg>'
  const status = document.createElement('span'); status.className = 'cm-diagram-edit-status'; status.setAttribute('role', 'status')
  let editor: HTMLInputElement | undefined, cancelled = false, committing = false
  let connectingFrom: string | undefined
  let connections: ReturnType<typeof mountFlowConnections> | undefined
  const snapshot = () => view.state.doc.sliceString(from, from + source.length) === source
  const commit = async (insert: string, id?: string, edit = false, focus = true) => {
    if (!snapshot()) return
    if (insert === source) { if (focus) elements[nodes.findIndex(node => node.id === id)]?.focus({ preventScroll: true }); return }
    try { await validateDiagramEdit(insert) }
    catch { status.textContent = t('图表无法更新，修改未保存。请切换到源码视图检查语法。'); return }
    if (!snapshot() || !root.isConnected) return
    state.id = id; state.focus = focus; state.edit = edit; view.contentDOM.classList.add('cm-diagram-editing')
    view.dispatch({ changes: { from, to: from + source.length, insert }, effects: view.scrollSnapshot(), userEvent: 'input', annotations: isolateHistory.of('full') })
  }
  const selected = () => nodes.find(node => node.id === state.id)
  const select = (id?: string) => {
    state.id = id
    elements.forEach((node, index) => { node.classList.toggle('cm-diagram-node-selected', nodes[index].id === id); node.setAttribute('aria-pressed', String(nodes[index].id === id)) })
    connections?.select(id)
    const directions = tools.querySelector<HTMLElement>('.cm-diagram-directions')
    if (directions) directions.hidden = !id
    shapeButton.hidden = connectButton.hidden = !id || mindmap
    const actions = root.querySelector<HTMLElement>('.cm-diagram-actions'); if (actions) actions.hidden = !id || mindmap
    shapeButton.disabled = !id; shapeMenu.hidden = true; shapeMenu.querySelectorAll<HTMLButtonElement>('button').forEach(item => item.setAttribute('aria-checked', String(item.dataset.shape === (id ? flowNodeShape(source, id) : ''))));
    nodeAdd.hidden = !id
    nodeRemove.hidden = !id; nodeRemove.disabled = mindmap && id === 'node0'; nodeRemove.title = mindmap ? t('删除节点及子节点') : t('删除节点及连线')
    const node = elements[nodes.findIndex(node => node.id === id)]
    if (node) {
      const box = node.getBoundingClientRect(), bounds = root.getBoundingClientRect(), scale = root.offsetWidth ? bounds.width / root.offsetWidth : 1, direction = diagramDirection(source)
      const x = direction === 'LR' ? box.right : direction === 'RL' ? box.left - 24 * scale : box.left + box.width / 2 - 10 * scale
      const y = direction === 'TD' ? box.bottom + 4 * scale : direction === 'BT' ? box.top - 24 * scale : box.top + box.height / 2 - 10 * scale
      nodeAdd.style.left = `${(x - bounds.left) / scale}px`; nodeAdd.style.top = `${(y - bounds.top) / scale}px`
      const removeX = direction === 'LR' ? box.left - 24 * scale : direction === 'RL' ? box.right + 4 * scale : box.left + box.width / 2 - 10 * scale
      const removeY = direction === 'TD' ? box.top - 24 * scale : direction === 'BT' ? box.bottom + 4 * scale : box.top + box.height / 2 - 10 * scale
      nodeRemove.style.left = `${(removeX - bounds.left) / scale}px`; nodeRemove.style.top = `${(removeY - bounds.top) / scale}px`
      if (actions && !actions.hidden) {
        const width = actions.offsetWidth
        actions.style.left = `${Math.max(0, Math.min(root.clientWidth - width, (box.left - bounds.left + box.width / 2) / scale - width / 2))}px`
        const above = (box.top - bounds.top) / scale - 54
        actions.style.top = `${above >= 0 ? above : (box.bottom - bounds.top) / scale + 28}px`
      }


    }
  }
  const openEditor = () => {
    if (editor) { editor.focus(); return }
    status.textContent = ''
    const node = selected(); if (!node) return
    const target = elements[nodes.findIndex(item => item.id === node?.id)]
    const box = target?.getBoundingClientRect(), bounds = root.getBoundingClientRect(), scale = root.offsetWidth ? bounds.width / root.offsetWidth : 1
    const panel = document.createElement('div'); panel.className = 'cm-diagram-label-editor'; panel.contentEditable = 'false'
    const input = document.createElement('input'); input.type = 'text'; input.value = node.label; input.placeholder = '节点名称'; input.setAttribute('aria-label', t('编辑节点名称')); input.maxLength = 2000
    const labelElement = target?.querySelector<SVGGraphicsElement>('.nodeLabel') || target?.querySelector<SVGGraphicsElement>('text')
    const labelBox = labelElement?.getBoundingClientRect() || box
    const text = target?.querySelector('text')
    const style = text ? getComputedStyle(text) : getComputedStyle(target)
    const matrix = text?.getScreenCTM()
    const fontScale = matrix ? Math.hypot(matrix.a, matrix.b) / scale : 1
    const width = Math.max(36, ((box?.width || 80) - 20 * scale) / scale)
    const height = Math.max(24, (labelBox?.height || 24) / scale)
    panel.style.left = `${((box?.left || bounds.left) - bounds.left + (box?.width || 80) / 2) / scale - width / 2}px`
    panel.style.top = `${((labelBox?.top || bounds.top) - bounds.top) / scale - (height - (labelBox?.height || 24) / scale) / 2}px`
    panel.style.width = `${width}px`; panel.style.height = `${height}px`
    input.style.fontFamily = style.fontFamily; input.style.fontWeight = style.fontWeight
    input.style.fontSize = `${parseFloat(style.fontSize) * fontScale}px`
    input.style.color = style.fill && style.fill !== 'none' ? style.fill : style.color
    if (labelElement) labelElement.style.visibility = 'hidden'
    const restoreLabel = () => { if (labelElement) labelElement.style.removeProperty('visibility') }
    panel.append(input); root.append(panel); editor = input; cancelled = false
    const finish = (restoreFocus = false) => {
      if (cancelled || committing) return
      committing = true
      const label = input.value.trim(); restoreLabel(); panel.remove(); editor = undefined
      if (label) {
        void commit(mindmap ? editMindmapNode(source, node.id, label) : editFlowNode(source, node.id, label, nodes), node.id, false, restoreFocus)
      }
      committing = false
    }
    input.addEventListener('keydown', event => {
      event.stopPropagation()
      if (event.key === 'Enter') { event.preventDefault(); finish(true) }
      if (event.key === 'Escape') { event.preventDefault(); cancelled = true; restoreLabel(); panel.remove(); editor = undefined; elements[nodes.findIndex(item => item.id === node.id)]?.focus({ preventScroll: true }) }
    })
    input.addEventListener('blur', () => finish())
    input.addEventListener('pointerdown', event => event.stopPropagation())
    queueMicrotask(() => { if (input.isConnected) { input.focus(); input.select() } })
  }
  const createNode = (sibling = false) => {
    const node = selected(); if (mindmap && !node) return
    const result = mindmap ? addMindmapNode(source, node!.id, '新节点', sibling) : addFlowNode(source, '新节点', nodes, node?.id)
    void commit(result.source, result.id, true)
  }
  nodeAdd.addEventListener('mousedown', event => event.preventDefault())
  nodeAdd.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); createNode() })
  const button = (label: string, paths: string, action: () => void) => {
    const button = document.createElement('button'); button.type = 'button'; button.title = t(label); button.setAttribute('aria-label', t(label))
    button.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`
    button.addEventListener('mousedown', event => event.preventDefault()); button.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); action() }); tools.append(button); return button
  }
  const removeNode = () => {
    const node = selected(); if (!node) return
    if (mindmap) {
      const list = mindmapNodes(source), at = list.findIndex(item => item.id === node.id), hasChildren = list[at + 1]?.indent.length > list[at].indent.length
      if ((at === 0 || hasChildren) && !window.confirm(at === 0 ? t('删除整个脑图？') : t('删除该节点及其子节点？'))) return
    }
    commit(mindmap ? deleteMindmapNode(source, node.id) : deleteFlowNode(source, node.id, nodes))
  }
  const trashIcon = '<path d="M3 6h18M9 6V4h6v2M5 6l1 14h12l1-14M10 10v6M14 10v6"/>'
  const deleteDiagram = button(mindmap ? '删除整个脑图' : '删除整个流程图', trashIcon, () => {
    if (window.confirm(mindmap ? t('删除整个脑图？所有节点和连线都会移除。') : t('删除整个流程图？所有节点和连线都会移除。'))) void commit('')
  })
  nodeRemove.addEventListener('mousedown', event => event.preventDefault())
  nodeRemove.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); removeNode() })
  const shapeMenu = document.createElement('div'); shapeMenu.className = 'cm-diagram-shape-menu'; shapeMenu.hidden = true; shapeMenu.contentEditable = 'false'; shapeMenu.setAttribute('role', 'menu'); shapeMenu.setAttribute('aria-label', t('节点形状'))
  const shapeButton = button('节点形状', '<path d="m12 3 9 9-9 9-9-9Z"/>', () => { cancelConnection(); shapeMenu.hidden = !shapeMenu.hidden; shapeButton.setAttribute('aria-expanded', String(!shapeMenu.hidden)) })
  shapeButton.hidden = mindmap; shapeButton.setAttribute('aria-haspopup', 'menu')
  for (const [shape, label] of flowNodeShapes) {
    const item = document.createElement('button'); item.type = 'button'; item.textContent = t(label); item.setAttribute('role', 'menuitemradio'); item.dataset.shape = shape
    item.addEventListener('mousedown', event => event.preventDefault())
    item.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); const node = selected(); if (node) void commit(setFlowNodeShape(source, node.id, shape, nodes), node.id); shapeMenu.hidden = true })
    shapeMenu.append(item)
  }
  shapeMenu.addEventListener('keydown', event => { event.stopPropagation(); if (event.key === 'Escape') { shapeMenu.hidden = true; shapeButton.focus() } })
  root.append(shapeMenu)
  const cancelConnection = () => { connectingFrom = undefined; connectButton.setAttribute('aria-pressed', 'false'); root.classList.remove('cm-diagram-connecting'); status.textContent = '' }
  const connectButton = button('连接节点', '<path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2"/>', () => {
    if (connectingFrom) { cancelConnection(); return }
    if (!state.id) return
    connectingFrom = state.id; connectButton.setAttribute('aria-pressed', 'true'); root.classList.add('cm-diagram-connecting')
  })
  elements.forEach((node, index) => {
    node.classList.add('cm-diagram-editable-node'); node.setAttribute('tabindex', '0'); node.setAttribute('role', 'button'); node.setAttribute('aria-label', t('节点：{0}', { "0": nodes[index].label }))
    node.addEventListener('mousedown', event => { event.preventDefault(); event.stopPropagation() })
    node.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); if (connectingFrom) {
      const start = connectingFrom, end = nodes[index].id; cancelConnection()
      if (start !== end) void commit(connectFlowNodes(source, start, end, nodes), end)
      return
    }

      if (connectingFrom) {
        const start = connectingFrom, end = nodes[index].id; cancelConnection()
        if (start !== end) void commit(connectFlowNodes(source, start, end, nodes), end)
        return
      }
      view.contentDOM.classList.add('cm-diagram-editing'); if (view.state.selection.main.head !== from) view.dispatch({ selection: { anchor: from } }); select(nodes[index].id); node.focus({ preventScroll: true }) })
    node.addEventListener('dblclick', event => { event.preventDefault(); event.stopPropagation(); select(nodes[index].id); openEditor() })
    node.addEventListener('keydown', event => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (event.key === 'Tab' && event.shiftKey) { event.preventDefault(); event.stopPropagation(); return }
      event.stopPropagation()
      if (event.key === 'Tab') { event.preventDefault(); select(nodes[index].id); createNode() }
      else if (event.key === 'Enter') { event.preventDefault(); select(nodes[index].id); createNode(mindmap && nodes[index].id !== 'node0') }
      else if (['F2', 'Delete', 'Backspace'].includes(event.key)) { event.preventDefault(); select(nodes[index].id); if (event.key === 'Delete' || event.key === 'Backspace') removeNode(); else openEditor() }
      else if (event.key.startsWith('Arrow')) { event.preventDefault(); const next = Math.max(0, Math.min(elements.length - 1, index + (event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1))); select(nodes[next].id); elements[next].focus({ preventScroll: true }) }
      else if (event.key === 'Escape') { event.preventDefault(); cancelConnection(); select() }
      else if (event.key.length === 1) { event.preventDefault(); select(nodes[index].id); openEditor(); if (editor) editor.value = event.key }
    })
  })
  diagram.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); cancelConnection(); select() })
  const outside = (event: PointerEvent) => { if (!root.contains(event.target as Node)) { view.contentDOM.classList.remove('cm-diagram-editing'); shapeMenu.hidden = true; cancelConnection(); select() } }
  document.addEventListener('pointerdown', outside, true)
  const directions = root.querySelector('.cm-diagram-toolbar')
  deleteDiagram.className = 'cm-table-delete cm-diagram-delete'; deleteDiagram.remove()
  const actions = document.createElement('div'); actions.className = 'cm-diagram-actions'; actions.setAttribute('role', 'group'); actions.setAttribute('aria-label', t('节点工具')); actions.append(...tools.children, shapeMenu)
  if (directions) {
    const group = document.createElement('div'); group.className = 'cm-diagram-directions'; group.append(...directions.children); tools.append(group); directions.remove()
  }
  root.append(actions)
  root.append(tools, deleteDiagram, nodeAdd, nodeRemove, status)
  if (!mindmap) connections = mountFlowConnections(root, diagram, source, nodes, commit, text => { status.textContent = text }, () => { cancelConnection(); select() })
  select(state.id)
  if (state.edit) { state.edit = false; queueMicrotask(() => openEditor()) }
  if (state.focus) { state.focus = false; queueMicrotask(() => { if (!editor) elements[nodes.findIndex(node => node.id === state.id)]?.focus({ preventScroll: true }) }) }
  return () => { cancelled = true; connections?.destroy(); document.removeEventListener('pointerdown', outside, true); view.contentDOM.classList.remove('cm-diagram-editing') }
}

import { t } from '../i18n'
import { disconnectFlowNodes, flowConnections, type DiagramNode } from './diagramEditing'

type Commit = (source: string, id?: string) => Promise<void>
export function mountFlowConnections(root: HTMLElement, diagram: HTMLElement, source: string, nodes: DiagramNode[], commit: Commit, report: (text: string) => void, clearNode: () => void) {
  let selectedEdge: SVGPathElement | undefined
  const clearEdge = () => { selectedEdge?.classList.remove('cm-diagram-edge-selected'); selectedEdge = undefined }
  const outside = (event: PointerEvent) => { if (!root.contains(event.target as Node)) clearEdge() }
  document.addEventListener('pointerdown', outside, true)
  const edgeCleanups: (() => void)[] = []
  const edges = flowConnections(source, nodes)
  for (const path of diagram.querySelectorAll<SVGPathElement>('path[data-edge],path.flowchart-link')) {
    const identifier = path.getAttribute('data-id') || path.id
    const edge = edges.find(edge => identifier.includes(`L_${edge.start}_${edge.end}_`))
    if (!edge) continue
    const click = (event: Event) => { event.preventDefault(); event.stopPropagation(); clearNode(); clearEdge(); selectedEdge = path; path.classList.add('cm-diagram-edge-selected'); path.focus({ preventScroll: true }) }
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { clearEdge(); return }
      if (event.key !== 'Delete' && event.key !== 'Backspace') return
      event.preventDefault(); event.stopPropagation()
      try { void commit(disconnectFlowNodes(source, edge.start, edge.end, nodes)) }
      catch { report('此连接使用了复杂语法，请在源码视图中修改') }
    }
    path.classList.add('cm-diagram-editable-edge'); path.setAttribute('tabindex', '0'); path.setAttribute('role', 'button'); path.setAttribute('aria-label', t('连接：{0} → {1}', { "0": nodes.find(node => node.id === edge.start)?.label, "1": nodes.find(node => node.id === edge.end)?.label }))
    path.addEventListener('click', click); path.addEventListener('keydown', keydown)
    edgeCleanups.push(() => { path.removeEventListener('click', click); path.removeEventListener('keydown', keydown) })
  }
  return {
    select(_id?: string) { clearEdge() },
    destroy() { clearEdge(); document.removeEventListener('pointerdown', outside, true); edgeCleanups.forEach(cleanup => cleanup()) },
  }
}

import { t } from '../i18n'
import { isolateHistory } from '@codemirror/commands'
import type { EditorView } from '@codemirror/view'
import { diagramDirection, diagramDirections, setDiagramDirection } from './diagramDirection'

export function mountDiagramControls(root: HTMLElement, source: string, from: number, view: EditorView) {
  if (!/^\s*(?:flowchart|graph)\b/im.test(source) && !/^\s*(?:`{3,}|~{3,})mindmap\b/im.test(source) && !/^\s*mindmap\b/im.test(source)) return
  root.classList.add('cm-diagram-block')
  const toolbar = document.createElement('div'); toolbar.className = 'cm-diagram-toolbar'; toolbar.hidden = true; toolbar.contentEditable = 'false'; toolbar.setAttribute('role', 'toolbar'); toolbar.setAttribute('aria-label', t('图表方向'))
  const names = ['向右展开', '向左展开', '向下展开', '向上展开']
  const paths = [
    'M3 10h4v4H3zM17 3h4v4h-4zM17 17h4v4h-4zM7 12h5M12 5v14M12 5h5M12 19h5',
    'M17 10h4v4h-4zM3 3h4v4H3zM3 17h4v4H3zM17 12h-5M12 5v14M12 5H7M12 19H7',
    'M10 3h4v4h-4zM3 17h4v4H3zM17 17h4v4h-4zM12 7v5M5 12h14M5 12v5M19 12v5',
    'M10 17h4v4h-4zM3 3h4v4H3zM17 3h4v4h-4zM12 17v-5M5 12h14M5 12V7M19 12V7',
  ]
  diagramDirections.forEach((direction, index) => {
    const button = document.createElement('button'); button.type = 'button'; button.title = t(names[index]); button.setAttribute('aria-label', t(names[index])); button.setAttribute('aria-pressed', String(diagramDirection(source) === direction))
    button.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[index]}"/></svg>`
    button.addEventListener('mousedown', event => event.preventDefault())
    button.addEventListener('click', event => {
      event.stopPropagation()
      const current = view.state.doc.sliceString(from, from + source.length)
      if (current !== source) return
      const insert = setDiagramDirection(current, direction)
      if (insert !== current) view.dispatch({ changes: { from, to: from + source.length, insert }, effects: view.scrollSnapshot(), userEvent: 'input', annotations: isolateHistory.of('full') })
    })
    toolbar.append(button)
  })
  root.append(toolbar)
}

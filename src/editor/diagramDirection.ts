export const diagramDirections = ['LR', 'RL', 'TD', 'BT'] as const
export type DiagramDirection = typeof diagramDirections[number]
export function diagramDirection(source: string): DiagramDirection {
  const value = /^\s*%%\s*direction:\s*(LR|RL|TD|TB|BT)\s*$/im.exec(source)?.[1]
    || /^\s*(?:flowchart|graph)\s+(LR|RL|TD|TB|BT)\b/im.exec(source)?.[1]
  return value?.toUpperCase() === 'TB' ? 'TD' : value ? value.toUpperCase() as DiagramDirection : /mindmap/.test(source) ? 'LR' : 'TD'
}
export function setDiagramDirection(source: string, direction: DiagramDirection): string {
  if (/^\s*(?:flowchart|graph)\b/im.test(source)) return source.replace(/^(\s*(?:flowchart|graph))(?:[ \t]+(?:LR|RL|TD|TB|BT))?\b/im, `$1 ${direction}`)
  if (/^\s*%%\s*direction:/im.test(source)) return source.replace(/^(\s*%%\s*direction:)[^\n]*/im, `$1 ${direction}`)
  const header = /^[ \t]*mindmap[^\n]*\n/m.exec(source) || /^[ \t]*(?:`{3,}|~{3,})[^\n]*\n/m.exec(source)
  const at = header ? header.index + header[0].length : 0
  return source.slice(0, at) + `%% direction: ${direction}\n` + source.slice(at)
}

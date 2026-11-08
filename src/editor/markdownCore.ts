import { frontmatterSection } from '../documents/frontmatter'
import { parser } from '@lezer/markdown'

export type Heading = { level: number; text: string; offset: number; line: number }

export function headingsOf(source: string): Heading[] {
  const headings: Heading[] = []
  const frontmatterEnd = frontmatterSection(source)?.to || 0
  const tree = parser.parse(source)
  tree.iterate({ enter(node) {
    const atx = /^ATXHeading([1-6])$/.exec(node.name)
    const setext = /^SetextHeading([12])$/.exec(node.name)
    if ((!atx && !setext) || node.from < frontmatterEnd) return
    const raw = source.slice(node.from, node.to)
    const lineText = atx ? raw.replace(/^#{1,6}[ \t]+/, '').replace(/[ \t]+#+[ \t]*$/, '') : raw.replace(/\r?\n[=-]+[ \t]*$/, '').replace(/\r?\n/g, ' ')
    const text = lineText.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*_`~]/g, '').trim()
    headings.push({ level: Number((atx || setext)![1]), text, offset: node.from, line: source.slice(0, node.from).split('\n').length })
  } })
  return headings
}

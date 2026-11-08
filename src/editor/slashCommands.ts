import { t } from '../i18n'
import { defaultTable } from './tableDefaults'

export const slashCommands = [
  { id: 'h1', get label() { return t('一级标题') }, search: '标题 heading h1', snippet: '# ' },
  { id: 'h2', get label() { return t('二级标题') }, search: '标题 heading h2', snippet: '## ' },
  { id: 'h3', get label() { return t('三级标题') }, search: '标题 heading h3', snippet: '### ' },
  { id: 'h4', get label() { return t('四级标题') }, search: '标题 heading h4', snippet: '#### ' },
  { id: 'h5', get label() { return t('五级标题') }, search: '标题 heading h5', snippet: '##### ' },
  { id: 'h6', get label() { return t('六级标题') }, search: '标题 heading h6', snippet: '###### ' },
  { id: 'frontmatter', label: 'Front matter', search: 'front matter frontmatter yaml 属性', snippet: '---\ntitle: \"\"\n---\n' },
  { id: 'bold', get label() { return t('加粗') }, search: 'bold strong 加粗', snippet: '****', select: [2, 2] },
  { id: 'italic', get label() { return t('斜体') }, search: 'italic emphasis 斜体', snippet: '**', select: [1, 1] },
  { id: 'strikethrough', get label() { return t('删除线') }, search: 'strikethrough 删除线', snippet: '~~~~', select: [2, 2] },
  { id: 'underline', get label() { return t('下划线') }, search: 'underline 下划线', snippet: '<u></u>', select: [3, 3] },
  { id: 'inline-code', get label() { return t('行内代码') }, search: 'inline code 行内代码', snippet: '``', select: [1, 1] },
  { id: 'inline-formula', get label() { return t('行内公式') }, search: 'inline math formula 行内公式', snippet: '$$', select: [1, 1] },
  { id: 'link', get label() { return t('链接') }, search: 'link url 链接', snippet: '[]()', select: [1, 1] },
  { id: 'image', get label() { return t('图片链接') }, search: 'image src 图片', snippet: '![]()', select: [2, 2] },
  { id: 'comment', get label() { return t('注释') }, search: 'comment 注释', snippet: '<!--  -->', select: [5, 5] },
  { id: 'paragraph', get label() { return t('段落') }, search: '正文 paragraph', snippet: '' },
  { id: 'list', get label() { return t('无序列表') }, search: '列表 list', snippet: '- ' },
  { id: 'ordered-list', get label() { return t('有序列表') }, search: '列表 list', snippet: '1. ' },
  { id: 'task', get label() { return t('任务列表') }, search: '待办 task checkbox', snippet: '- [ ] ' },
  { id: 'quote', get label() { return t('引用') }, search: '引用 quote', snippet: '> ' },
  { id: 'table', get label() { return t('表格') }, search: 'table', snippet: defaultTable },
  { id: 'code', get label() { return t('代码块') }, search: 'code', snippet: '```\n代码\n```' },
  { id: 'mermaid', get label() { return t('流程图') }, search: '流程图 图表 diagram mermaid', snippet: '```mermaid\ngraph TD\n  A[开始] --> B[结束]\n```' },
  { id: 'mindmap', get label() { return t('脑图') }, search: '思维导图 mindmap 脑图', snippet: '```mindmap\n  root((主题))\n    分支一\n    分支二\n```' },
  { id: 'formula', get label() { return t('公式块') }, search: 'math formula', snippet: '$$\n公式\n$$' },
  { id: 'callout-tip', get label() { return t('提示框') }, search: '警告 callout tip', snippet: '> [!TIP]\n> 提示内容' },
  { id: 'callout-note', get label() { return t('备注框') }, search: '备注 callout note', snippet: '> [!NOTE]\n> 备注内容' },
  { id: 'callout-important', get label() { return t('重要框') }, search: '重要 callout important', snippet: '> [!IMPORTANT]\n> 重要内容' },
  { id: 'callout-warning', get label() { return t('警告框') }, search: '警告 callout warning', snippet: '> [!WARNING]\n> 警告内容' },
  { id: 'callout-caution', get label() { return t('注意框') }, search: '注意 callout caution', snippet: '> [!CAUTION]\n> 注意内容' },
  { id: 'footnote', get label() { return t('脚注') }, search: '脚注 footnote', snippet: '[^1]\n\n[^1]: 脚注内容' },
  { id: 'hr', get label() { return t('水平分割线') }, search: '分隔线 divider', snippet: '---' }
] as const

export type SlashCommand = (typeof slashCommands)[number]
export type SlashRange = { from: number; to: number; query: string }

export function slashRange(source: string, cursor: number): SlashRange | null {
  const lineStart = source.lastIndexOf('\n', Math.max(0, cursor - 1)) + 1
  const beforeCursor = source.slice(lineStart, cursor)
  const match = /(^|\s)\/([^\n/]*)$/.exec(beforeCursor)
  if (!match) return null
  return { from: lineStart + match.index + match[1].length, to: cursor, query: match[2].trim().toLowerCase() }
}

const slashAliases: Record<string, string> = {
  h1: 'yijibiaoti yjbt bt title', h2: 'erjibiaoti ejbt bt title',
  h3: 'sanjibiaoti sjbt bt title', h4: 'sijibiaoti sjbt bt title',
  h5: 'wujibiaoti wjbt bt title', h6: 'liujibiaoti ljbt bt title',
  frontmatter: 'shuxing sx yuanshuju ysj metadata', bold: 'jiacu jc cuti ct',
  italic: 'xieti xt', strikethrough: 'shanchuxian scx strike del', underline: 'xiahuaxian xhx',
  'inline-code': 'hangneidaima hndm daima dm', 'inline-formula': 'hangneigongshi hngs gongshi gs latex',
  link: 'lianjie lj chaolianjie clj hyperlink', image: 'tupian tp img', comment: 'zhushi zs',
  paragraph: 'duanluo dl zhengwen zw text', list: 'wuxuliebiao wxlb liebiao lb bullet',
  'ordered-list': 'youxuliebiao yxlb liebiao lb numbered', task: 'renwuliebiao rwlb daiban db todo',
  quote: 'yinyong yy blockquote', table: 'biaoge bg', code: 'daimakuai dmk daima dm codeblock',
  mermaid: 'liuchengtu lct tubiao tb flowchart graph', mindmap: 'naotu nt siweidaotu swdt',
  formula: 'gongshikuai gsk gongshi gs latex', 'callout-tip': 'tishikuang tsk tishi ts',
  'callout-note': 'beizhukuang bzk beizhu bz', 'callout-important': 'zhongyaokuang zyk zhongyao zy',
  'callout-warning': 'jinggaokuang jgk jinggao jg alert', 'callout-caution': 'zhuyikuang zyk zhuyi zy',
  footnote: 'jiaozhu jz', hr: 'shuipingfengexian spfgx fengexian fgx separator horizontal rule'
}

export function slashKeywordMatches(query: string, ...keywords: string[]): boolean {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const searchable = keywords.join(' ').toLowerCase()
  return terms.every(term => searchable.includes(term))
}

export function matchingSlashCommands(query: string): readonly SlashCommand[] {
  return slashCommands.filter(command => slashKeywordMatches(query, command.id, command.label, command.search, slashAliases[command.id] || ''))
}

export function slashCommandChange(source: string, cursor: number, command: SlashCommand): { from: number; to: number; insert: string; selection?: { anchor: number; head: number } } | null {
  const range = slashRange(source, cursor)
  if (!range) return null
  const lineEnd = source.indexOf('\n', range.to)
  const hasFollowingText = range.to < (lineEnd < 0 ? source.length : lineEnd)
  const insert = hasFollowingText && (command.snippet.includes('\n') || command.id === 'hr')
    ? `${command.snippet}\n` : command.snippet
  const selection = 'select' in command ? { anchor: range.from + command.select[0], head: range.from + command.select[1] } : undefined
  return { from: range.from, to: range.to, insert, ...(selection ? { selection } : {}) }
}

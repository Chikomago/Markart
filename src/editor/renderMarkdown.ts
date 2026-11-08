import { frontmatterSection } from '../documents/frontmatter'
import { Marked, type MarkedExtension, type Token, type TokensList } from 'marked'
import markedFootnote from 'marked-footnote'
import katex from 'katex'
import { widthExtensionImages } from '../documents/imageProperties'

// Match the editor: a newline typed in prose is a visible line break.
const markdown = new Marked({ gfm: true, breaks: true }, markedFootnote())
const attr = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
const calloutTitles: Record<string, string> = { TIP: '💡 Tip', NOTE: '✏️ Note', IMPORTANT: '❗ Important', WARNING: '⚠️ Warning', CAUTION: '🚨 Caution' }
const mathExtensions: MarkedExtension = { extensions: [
  {
    name: 'displayMath', level: 'block', start: source => /(?:^|\n)[ \t]*\$\$[ \t]*(?:\n|$)/.exec(source)?.index,
    tokenizer(source) {
      const match = /^\$\$[ \t]*\n([\s\S]*?)\n[ \t]*\$\$[ \t]*(?:\n|$)/.exec(source)
      return match ? { type: 'displayMath', raw: match[0], text: match[1] } : undefined
    },
    renderer(token) { return `<div class="markart-display-math" data-math-source="${attr(token.text)}">${katex.renderToString(token.text, { displayMode: true, output: 'mathml', throwOnError: false })}</div>` }
  },
  {
    name: 'inlineMath', level: 'inline', start: source => source.indexOf('$'),
    tokenizer(source) {
      const match = /^\$(?!\$)([^\n$]+)\$/.exec(source)
      return match ? { type: 'inlineMath', raw: match[0], text: match[1] } : undefined
    },
    renderer(token) { return `<span class="markart-inline-math" data-math-source="${attr(token.text)}">${katex.renderToString(token.text, { displayMode: false, output: 'mathml', throwOnError: false })}</span>` }
  }
] }
markdown.use(mathExtensions)
// Source ranges must use the same math grammar as the rendered document.
const blockMarkdown = new Marked({ gfm: true }, mathExtensions)
export function lexMarkdownBlocks(source: string) {
  const prefix = source.slice(0, frontmatterSection(source)?.to || 0)
  const tokens = blockMarkdown.lexer(source.slice(prefix.length))
  if (prefix) tokens.unshift({ type: 'space', raw: prefix })
  return tokens
}

export function renderMarkdown(source: string, options: { showComments?: boolean; ast?: Token[]; links?: TokensList['links'] } = {}): string {
  const html = (options.ast ? markdown.parser(Object.assign(options.ast,{links:options.links||{}})) : markdown.parse(widthExtensionImages(source.slice(frontmatterSection(source)?.to || 0)), { async: false, breaks: true })) as string
  const container = document.createElement('div')
  container.innerHTML = html
  const comments: Comment[] = [], walker = document.createTreeWalker(container, NodeFilter.SHOW_COMMENT)
  while (walker.nextNode()) comments.push(walker.currentNode as Comment)
  for (const comment of comments) {
    if (options.showComments) { const note = document.createElement(comment.parentElement === container ? 'aside' : 'span'); note.className = 'markart-comment'; note.textContent = `<!--${comment.data}-->`; comment.replaceWith(note) }
    else comment.remove()
  }
  for (const quote of container.querySelectorAll('blockquote')) {
    const first = quote.firstElementChild
    if (!first?.matches('p')) continue
    const callout = /^\[!(TIP|NOTE|IMPORTANT|WARNING|CAUTION)\]/i.exec(first.textContent || '')
    if (!callout || !first) continue
    const kind = callout[1].toUpperCase()
    const lines = first.innerHTML.split('\n')
    const customTitle = lines.shift()!.replace(/^\[![A-Z]+\][ \t]*/i, '').replace(/<br\s*\/?>\s*$/i, '').trim()
    const title = document.createElement('p')
    title.className = 'callout-title'
    title.innerHTML = customTitle || calloutTitles[kind]
    quote.classList.add('callout', `callout-${kind.toLowerCase()}`)
    quote.setAttribute('data-callout-default-title', calloutTitles[kind])
    quote.setAttribute('data-callout-custom-title', String(!!customTitle))
    const body = lines.join('\n').trim()
    if (body) first.innerHTML = body
    else first.remove()
    quote.prepend(title)
  }
  for (const code of container.querySelectorAll('pre > code')) {
    const language = [...code.classList].find(name => name.startsWith('language-'))?.slice(9) || ''
    if (language === 'math') {
      const expression = code.textContent || ''
      code.parentElement!.outerHTML = `<div class="markart-display-math" data-math-source="${attr(expression)}">${katex.renderToString(expression, { displayMode: true, output: 'mathml', throwOnError: false })}</div>`
      continue
    }
    if (language) {
      code.parentElement?.setAttribute('data-language', language)
    }
  }
  container.querySelectorAll('annotation,annotation-xml').forEach(node => node.remove())
  container.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach((heading, index) => heading.setAttribute('data-heading-index', String(index)))
  return container.innerHTML
}

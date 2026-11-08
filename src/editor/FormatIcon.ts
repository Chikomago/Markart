import { defineComponent, h, type Component } from 'vue'
import {
  Heading1, Heading2, Heading3, Heading4, Heading5, Heading6,
  CaseSensitive, Bold, Italic, Strikethrough, Underline, Code2, SquareCode, SquareFunction, Sigma,
  Link2, Image, ImageUp, MessageSquare, List, ListOrdered, ListChecks, Quote, Table2,
  Workflow, GitBranch, Lightbulb, Info, CircleAlert, TriangleAlert, OctagonAlert,
  Minus, Pilcrow, Superscript, Settings2, FileType, FileCode, FileImage, ClipboardType,
  FolderOpen, FolderPlus, FolderX, FileUp, FileX, FileClock, FolderClock,
  Save, SaveAll, Search, FolderSearch, FileCheck2, FolderCheck, PanelLeft, Palette,
  Download, Focus, History, SlidersHorizontal, ListCollapse, FoldVertical,
  PanelsTopLeft, Columns2, PanelTop, PanelBottom, Eye, Braces, Files, AppWindow,
  NotebookText, Keyboard, SpellCheck, Plus, Trash2, FolderInput, Pencil,
  LockKeyhole, Type, Eraser, IndentIncrease, IndentDecrease, ArrowUp, ArrowDown,
  ArrowUpDown, FileOutput, ImageUpscale, Globe, TextSelect, FileText, ImageDown,
  FileType2, FilePlus2, WandSparkles, EyeOff, MoreHorizontal
} from 'lucide-vue-next'

export const formatIcons: Record<string, Component> = {
  h1: Heading1, h2: Heading2, h3: Heading3, h4: Heading4, h5: Heading5, h6: Heading6,
  'text-style': CaseSensitive, bold: Bold, italic: Italic, strikethrough: Strikethrough, underline: Underline,
  'inline-code': Code2, code: SquareCode, 'inline-formula': SquareFunction, formula: Sigma,
  link: Link2, image: Image, 'image-local': ImageUp, comment: MessageSquare,
  list: List, 'ordered-list': ListOrdered, task: ListChecks, quote: Quote, table: Table2,
  mermaid: Workflow, mindmap: GitBranch, hr: Minus, paragraph: Pilcrow,
  footnote: Superscript, frontmatter: Settings2,
  'callout-tip': Lightbulb, 'callout-note': Info, 'callout-important': CircleAlert,
  'callout-warning': TriangleAlert, 'callout-caution': OctagonAlert,
  'copy-markdown': FileType, 'copy-html': FileCode, 'copy-image': FileImage, 'copy-plain': ClipboardType,
  'open-file': FileUp, folder: FolderOpen, 'new-folder': FolderPlus, 'close-folder': FolderX,
  'close-file': FileX, 'recent-files': FileClock, 'recent-folders': FolderClock, history: History,
  save: Save, 'save-as': SaveAll, search: Search, 'workspace-search': FolderSearch,
  'check-document-links': FileCheck2, 'check-folder-links': FolderCheck,
  sidebar: PanelLeft, theme: Palette, export: Download, focus: Focus, settings: SlidersHorizontal,
  outline: ListCollapse, 'fold-headings': FoldVertical, 'view-mode': PanelsTopLeft,
  'split-view': Columns2, tabs: PanelTop, toolbar: PanelBottom, 'wysiwyg-view': Eye,
  'source-view': Braces, 'file-view': Files, 'new-window': AppWindow,
  help: NotebookText, shortcuts: Keyboard, spellcheck: SpellCheck, new: Plus,
  delete: Trash2, move: FolderInput, rename: Pencil, readonly: LockKeyhole, typewriter: Type,
  clear: Eraser, indent: IndentIncrease, outdent: IndentDecrease,
  'heading-up': ArrowUp, 'heading-down': ArrowDown, sort: ArrowUpDown,
  'convert-markdown': FileOutput, 'image-properties': ImageUpscale,
  'export-html': Globe, 'export-text': TextSelect, 'export-word': FileText,
  'export-png': ImageDown, 'export-pdf': FileType2,
  snippet: FilePlus2, 'format-document': WandSparkles, 'hide-toolbar': EyeOff, more: MoreHorizontal
}

export default defineComponent({
  name: 'FormatIcon',
  props: { name: { type: String, required: true }, size: { type: Number, default: 16 } },
  setup(props) {
    return () => h(formatIcons[props.name] || FileText, { size: props.size, 'aria-hidden': true })
  }
})

<script setup lang="ts">
import { t } from './i18n'

import { computed, nextTick, ref, watch } from 'vue'
import { Search } from 'lucide-vue-next'
import FormatIcon from './editor/FormatIcon'

type ReferenceTab = 'syntax' | 'shortcuts'
type CommandItem = { id: string; label: string; category: string; icon?: string; marker?: string; custom?: boolean; action: () => void | Promise<void> }
const props = defineProps<{
  commandsOpen: boolean
  referenceOpen: boolean
  referenceTab: ReferenceTab
  commands: CommandItem[]
  shortcuts: { label: string; keys: string }[]
}>()
const emit = defineEmits<{ closeCommands: []; closeReference: []; 'update:referenceTab': [tab: ReferenceTab] }>()
const commandSearch = ref('')
const referenceSearch = ref('')
const commandInput = ref<HTMLInputElement | null>(null)
const referenceInput = ref<HTMLInputElement | null>(null)
watch(() => props.commandsOpen, open => { if (open) void nextTick(() => commandInput.value?.focus()) })
watch(() => props.referenceOpen, open => { if (open) { referenceSearch.value = ''; void nextTick(() => referenceInput.value?.focus()) } })
const filteredCommands = computed(() => { const query = commandSearch.value.trim().toLowerCase(); return query ? props.commands.filter(item => `${item.label} ${item.category}`.toLowerCase().includes(query)) : props.commands })
const filteredShortcuts = computed(() => { const query = referenceSearch.value.trim().toLowerCase(); return query ? props.shortcuts.filter(item => `${item.label} ${item.keys}`.toLowerCase().includes(query)) : props.shortcuts })
function runCommand(command: CommandItem) { void command.action(); emit('closeCommands') }

const syntaxGuide = [
  { get group() { return t('行内语法') }, get label() { return t('粗体') }, syntax: '**粗体**' },
  { get group() { return t('行内语法') }, get label() { return t('斜体') }, syntax: '*斜体*' },
  { get group() { return t('行内语法') }, get label() { return t('删除线') }, syntax: '~~删除线~~' },
  { get group() { return t('行内语法') }, get label() { return t('下划线') }, syntax: '<u>下划线</u>' },
  { get group() { return t('行内语法') }, get label() { return t('行内代码') }, syntax: '`代码`' },
  { get group() { return t('行内语法') }, get label() { return t('链接') }, syntax: '[文字](https://example.com)' },
  { get group() { return t('行内语法') }, get label() { return t('图片') }, syntax: '![说明](image.png)' },
  { get group() { return t('行内语法') }, get label() { return t('自动链接') }, syntax: '<https://example.com>' },
  { get group() { return t('行内语法') }, get label() { return t('脚注引用') }, syntax: '文字[^1]' },
  { get group() { return t('行内语法') }, get label() { return t('行内公式') }, syntax: '$E=mc^2$' },
  { get group() { return t('行内语法') }, get label() { return t('转义字符') }, syntax: '\\*原样星号\\*' },
  { get group() { return t('行内语法') }, get label() { return t('注释') }, syntax: '<!-- 注释 -->' },
  { get group() { return t('行内语法') }, get label() { return t('强制换行') }, syntax: '行末两个空格 + 回车' },
  { get group() { return t('块级语法') }, get label() { return t('一级至六级标题') }, syntax: '# 标题　…　###### 标题' },
  { get group() { return t('块级语法') }, get label() { return t('普通段落') }, syntax: '空行分隔两个段落' },
  { get group() { return t('块级语法') }, get label() { return t('引用块') }, syntax: '> 引用内容' },
  { get group() { return t('块级语法') }, get label() { return t('无序列表') }, syntax: '- 项目' },
  { get group() { return t('块级语法') }, get label() { return t('有序列表') }, syntax: '1. 项目' },
  { get group() { return t('块级语法') }, get label() { return t('任务列表') }, syntax: '- [ ] 待办　- [x] 完成' },
  { get group() { return t('块级语法') }, get label() { return t('嵌套列表') }, syntax: '  - 子项目' },
  { get group() { return t('块级语法') }, get label() { return t('带语言的代码块') }, syntax: '```js\n代码\n```' },
  { get group() { return t('块级语法') }, get label() { return t('无语言代码块') }, syntax: '```\n代码\n```' },
  { get group() { return t('块级语法') }, get label() { return t('缩进代码块') }, syntax: '    代码' },
  { get group() { return t('块级语法') }, get label() { return t('表格') }, syntax: '| 列 1 | 列 2 |\n| --- | --- |' },
  { get group() { return t('块级语法') }, get label() { return t('脚注定义') }, syntax: '[^1]: 脚注内容' },
  { get group() { return t('块级语法') }, get label() { return t('公式块') }, syntax: '$$\nE=mc^2\n$$' },
  { get group() { return t('块级语法') }, get label() { return t('提示与警告框') }, syntax: '> [!TIP]　[!NOTE]　[!WARNING]' },
  { get group() { return t('块级语法') }, get label() { return t('重要与注意框') }, syntax: '> [!IMPORTANT]　[!CAUTION]' },
  { get group() { return t('块级语法') }, get label() { return t('水平分割线') }, syntax: '---' }
]
const syntaxGroups = computed(() => { const query = referenceSearch.value.trim().toLowerCase(); return ['行内语法', '块级语法'].map(group => ({ group, items: syntaxGuide.filter(item => item.group === group && (!query || `${item.group} ${item.label} ${item.syntax}`.toLowerCase().includes(query))) })).filter(section => section.items.length) })
</script>

<template>
  <div v-if="commandsOpen" class="modal-backdrop" @click.self="emit('closeCommands')"><div class="command-modal"><div class="command-search"><Search :size="19"/><input ref="commandInput" v-model="commandSearch" :placeholder="$t('搜索操作…')" @keydown.esc="emit('closeCommands')"/><span>ESC</span></div><div class="command-list"><button v-for="command in filteredCommands" :key="command.id" @click="runCommand(command)"><FormatIcon :name="command.icon || 'paragraph'" :size="16"/><span>{{ command.custom ? command.label : $t(command.label) }}</span><code v-if="command.marker" class="command-markdown">{{ command.marker }}</code></button></div><div class="command-hint">{{ $t('使用 ⌘ K 快速打开') }}</div></div></div>
  <div v-if="referenceOpen" class="modal-backdrop" @click.self="emit('closeReference')"><div class="reference-modal"><div class="reference-search"><Search :size="16"/><input ref="referenceInput" v-model="referenceSearch" :placeholder="$t('搜索语法或快捷键')" :aria-label="$t('搜索 Markdown 语法和快捷键')" @keydown.esc="emit('closeReference')"/><span class="reference-esc">ESC</span></div><div class="reference-tabs"><button :class="{ active: referenceTab === 'syntax' }" @click="emit('update:referenceTab', 'syntax')">{{ $t('Markdown 语法') }}</button><button :class="{ active: referenceTab === 'shortcuts' }" @click="emit('update:referenceTab', 'shortcuts')">{{ $t('快捷键') }}</button></div><div class="reference-list"><template v-if="referenceTab === 'syntax'"><section v-for="section in syntaxGroups" :key="section.group" class="reference-section"><h3>{{ section.group }}</h3><div v-for="item in section.items" :key="item.label" class="reference-row"><span>{{ $t(item.label) }}</span><code>{{ item.syntax }}</code></div></section></template><template v-else><div v-for="item in filteredShortcuts" :key="item.label" class="reference-row"><span>{{ $t(item.label) }}</span><kbd>{{ item.keys }}</kbd></div></template></div></div></div>
</template>

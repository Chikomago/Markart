import { computed, nextTick, ref, watch, type Ref, type WritableComputedRef } from 'vue'
import type { PersonalItem } from './personalItems'

export function usePersonalItems(deps: {
  settingTab: Readonly<Ref<string>>
  templates: WritableComputedRef<PersonalItem[]>
  snippets: WritableComputedRef<PersonalItem[]>
}) {
const { settingTab, templates, snippets } = deps
const selectedPersonalId = ref('')
const personalContent = ref('')
const personalRenamingId = ref('')
const personalRenameDraft = ref('')
const personalRenameInput = ref<HTMLInputElement | HTMLInputElement[] | null>(null)
const personalItems = computed(() => settingTab.value === 'templates' ? templates.value : snippets.value)
function variableSyntax(key: string) { return `{{${key}}}` }
watch(settingTab, tab => {
  personalRenamingId.value = ''
  editPersonalItem(tab === 'templates' ? templates.value[0] : tab === 'snippets' ? snippets.value[0] : undefined)
})
function editPersonalItem(item?: PersonalItem) { selectedPersonalId.value = item?.id || ''; personalContent.value = item?.content || '' }
function addPersonalItem() {
  const item: PersonalItem = { id: crypto.randomUUID(), name: settingTab.value === 'templates' ? '新模板' : '新片段', content: '' }
  if (settingTab.value === 'templates') templates.value = [...templates.value, item]
  else snippets.value = [...snippets.value, item]
  editPersonalItem(item)
}
function updatePersonalItemContent(value: string) {
  if (!selectedPersonalId.value) return
  const next = personalItems.value.map(item => item.id === selectedPersonalId.value ? { ...item, content: value } : item)
  if (settingTab.value === 'templates') templates.value = next
  else snippets.value = next
}
function startPersonalRename(item: PersonalItem) {
  editPersonalItem(item)
  personalRenamingId.value = item.id
  personalRenameDraft.value = item.name
  void nextTick(() => {
    const input = Array.isArray(personalRenameInput.value) ? personalRenameInput.value[0] : personalRenameInput.value
    input?.focus()
  })
}
function commitPersonalRename() {
  const id = personalRenamingId.value
  if (!id) return
  const name = personalRenameDraft.value.trim()
  personalRenamingId.value = ''
  if (!name) return
  const next = personalItems.value.map(item => item.id === id ? { ...item, name } : item)
  if (settingTab.value === 'templates') templates.value = next
  else snippets.value = next
}
function removePersonalItem(item: PersonalItem) {
  if (!item) return
  const index = personalItems.value.findIndex(entry => entry.id === item.id)
  const next = personalItems.value.filter(entry => entry.id !== item.id)
  if (settingTab.value === 'templates') templates.value = next
  else snippets.value = next
  editPersonalItem(next[Math.min(index, next.length - 1)])
}

return { selectedPersonalId, personalContent, personalRenamingId, personalRenameDraft,
  personalRenameInput, personalItems, variableSyntax,
  editPersonalItem, addPersonalItem, updatePersonalItemContent, startPersonalRename,
  commitPersonalRename, removePersonalItem }
}

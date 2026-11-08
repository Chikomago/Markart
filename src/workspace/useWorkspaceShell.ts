import { t } from '../i18n'
import { computed, nextTick, ref, watch, type Ref } from 'vue'
import { SettingsStore } from '../settings/settings'
import type { Doc } from './sample'

export function useWorkspaceLayout({ settingsStore, settingsRevision, mode, notify }: {
  settingsStore: SettingsStore
  settingsRevision: Ref<number>
  mode: Readonly<Ref<'wysiwyg' | 'source' | 'split'>>
  notify: (message: string) => void
}) {
const sidebar = ref(settingsStore.get('sidebarOpen'))
const sidebarWidth = ref<number>(settingsStore.get('sidebarWidth'))
const previewWidth = ref<number>(settingsStore.get('previewWidth'))
const previewWidthCustomized = ref(settingsStore.get('previewWidthCustomized') || previewWidth.value !== 480)
type ResizePane = 'sidebar' | 'preview'
let resizing: { pane: ResizePane; startX: number; startWidth: number } | null = null
function startResize(pane: ResizePane, event: PointerEvent) {
  event.preventDefault()
  resizing = { pane, startX: event.clientX, startWidth: pane === 'sidebar' ? sidebarWidth.value : document.querySelector<HTMLElement>('.preview-pane')?.getBoundingClientRect().width || previewWidth.value }
  if (pane === 'preview') { previewWidth.value = Math.round(resizing.startWidth); previewWidthCustomized.value = true }
  document.body.classList.add('resizing-panes')
  window.addEventListener('pointermove', moveResize)
  window.addEventListener('pointerup', stopResize, { once: true })
}
function moveResize(event: PointerEvent) {
  if (!resizing) return
  const { pane, startX, startWidth } = resizing
  const delta = event.clientX - startX
  const workspaceWidth = document.querySelector<HTMLElement>('.workspace')?.clientWidth || window.innerWidth
  const minimumEditor = mode.value === 'split' ? 220 : 340
  if (pane === 'sidebar') sidebarWidth.value = Math.max(190, Math.min(420, workspaceWidth - minimumEditor - (mode.value === 'split' ? document.querySelector<HTMLElement>('.preview-pane')?.getBoundingClientRect().width || previewWidth.value : 0), startWidth + delta))
  if (pane === 'preview') previewWidth.value = Math.round(Math.max(220, Math.min(2400, workspaceWidth - minimumEditor - (sidebar.value ? sidebarWidth.value : 0), startWidth - delta)))
}
function stopResize() {
  const resized = resizing?.pane
  resizing = null
  document.body.classList.remove('resizing-panes')
  window.removeEventListener('pointermove', moveResize)
  if (resized === 'sidebar') saveLayoutSetting('sidebarWidth', sidebarWidth.value)
  if (resized === 'preview') {
    previewWidthCustomized.value = true
    saveLayoutSetting('previewWidth', previewWidth.value)
    saveLayoutSetting('previewWidthCustomized', true)
  }
}
const outlineOpen = ref(settingsStore.get('outlineOpen'))
let applyingLayoutSettings = false
function applyLayoutSettings() {
  applyingLayoutSettings = true
  sidebar.value = settingsStore.get('sidebarOpen')
  outlineOpen.value = settingsStore.get('outlineOpen')
  sidebarWidth.value = settingsStore.get('sidebarWidth')
  previewWidth.value = settingsStore.get('previewWidth')
  previewWidthCustomized.value = settingsStore.get('previewWidthCustomized') || previewWidth.value !== 480
  applyingLayoutSettings = false
}
function saveLayoutSetting(key: 'sidebarOpen' | 'outlineOpen' | 'sidebarWidth' | 'previewWidth' | 'previewWidthCustomized', value: boolean | number) {
  if (applyingLayoutSettings) return
  if (settingsStore.set(key, value)) settingsRevision.value++
  else notify(t('布局设置未保存'))
}
watch(sidebar, value => saveLayoutSetting('sidebarOpen', value), { flush: 'sync' })
watch(outlineOpen, value => saveLayoutSetting('outlineOpen', value), { flush: 'sync' })

  return { sidebar, sidebarWidth, previewWidth, previewWidthCustomized, outlineOpen, startResize, stopResize, applyLayoutSettings }
}

export function useWorkspaceTabs({ docs, dirtyIds, activeId, sidebar, sideView, folderExpanded, selectDoc, confirmClose }: {
  docs: Ref<Doc[]>
  dirtyIds: Ref<string[]>
  activeId: Ref<string>
  sidebar: Ref<boolean>
  sideView: Ref<'tree' | 'list'>
  folderExpanded: Ref<Record<string, boolean>>
  selectDoc: (id: string) => Promise<unknown>
  confirmClose: (id: string) => Promise<string | null>
}) {
const openTabs = ref<string[]>([])
const draggedTabId = ref('')
const tabContext = ref<{ id: string; x: number; y: number } | null>(null)
const tabDocs = computed(() => openTabs.value.map(id => docs.value.find(doc => doc.id === id)).filter((doc): doc is Doc => !!doc))
let closingTab = false
async function closeTab(id: string) {
  if (closingTab) return false
  if (dirtyIds.value.includes(id)) {
    closingTab = true
    try {
      const approved = await confirmClose(id)
      if (!approved) return false
      id = approved
    } finally { closingTab = false }
  }
  const doc = docs.value.find(item => item.id === id)
  const index = openTabs.value.indexOf(id)
  openTabs.value = openTabs.value.filter(item => item !== id)
  if (doc?.temporary) {
    docs.value = docs.value.filter(item => item.id !== id)
    dirtyIds.value = dirtyIds.value.filter(item => item !== id)
  }
  if (activeId.value === id) {
    const next = openTabs.value[Math.min(index, openTabs.value.length - 1)]
    if (next) void selectDoc(next)
    else activeId.value = ''
  }
  return true
}
function dropTab(beforeId: string) {
  if (!draggedTabId.value || draggedTabId.value === beforeId) return
  const next = openTabs.value.filter(id => id !== draggedTabId.value)
  next.splice(next.indexOf(beforeId), 0, draggedTabId.value)
  openTabs.value = next
  draggedTabId.value = ''
}
async function closeTabs(where: 'left' | 'right' | 'others') {
  const id = tabContext.value?.id
  if (!id) return
  const index = openTabs.value.indexOf(id)
  const closing = where === 'left' ? openTabs.value.slice(0, index) : where === 'right' ? openTabs.value.slice(index + 1) : openTabs.value.filter(item => item !== id)
  for (const tab of closing) { if (!await closeTab(tab)) break }
  tabContext.value = null
}
function locateTabFile(id: string) {
  sidebar.value = true
  sideView.value = 'tree'
  const doc = docs.value.find(item => item.id === id)
  const path = doc?.relativePath || doc?.sourceRelativePath || ''
  const parts = path.split('/')
  for (let index = 1; index < parts.length; index++) folderExpanded.value[parts.slice(0, index).join('/')] = true
  void selectDoc(id).then(() => nextTick(() => document.querySelector<HTMLElement>('.file-row.selected')?.scrollIntoView({ block: 'center' })))
  tabContext.value = null
}

  return { openTabs, draggedTabId, tabContext, tabDocs, closeTab, dropTab, closeTabs, locateTabFile }
}

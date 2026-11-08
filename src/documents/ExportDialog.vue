<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { ArrowUp } from 'lucide-vue-next'
import { t } from '../i18n'
import ExportPreviewPane from './ExportPreviewPane.vue'
import { exportFormats, exportFilename, formatExportDimensions, type ExportDimensions, type ExportArtifact, type ExportKind } from './exportPreview'
const props = defineProps<{
  open: boolean; shareOpen?: boolean; filename: string; revision: string; busy: boolean; isTauri: boolean
  prepare: (kind: ExportKind, options?: {skipPlugins:string[]}) => Promise<ExportArtifact>
}>()
const emit = defineEmits<{ close: []; download: [kind: ExportKind]; share: []; stopShare: [] }>()
const kind = ref<ExportKind>('html')
const shareSelected = ref(false)
const tabs = computed(()=>[...exportFormats, { kind: 'share' as const, label: '分享' }])
function selectTab(value: ExportKind | 'share') {
  if (value === 'share' && !props.isTauri) return
  shareSelected.value = value === 'share'
  if (value === 'share') { if (!props.shareOpen) emit('share') }
  else { kind.value = value; if (props.shareOpen) emit('stopShare') }
}
watch(() => props.shareOpen, open => { if (open) shareSelected.value = true })
watch(() => props.open, open => { if (!open) {shareSelected.value = false;skippedPlugins.value=[]} })
const skippedPlugins=ref<string[]>([])
function skipFailedPlugin(){const owner=current.value?.owner;if(owner){skippedPlugins.value=[...new Set([...skippedPlugins.value,owner])];retry()}}
const attempt = ref(0)
type PreviewEntry = { artifact?: ExportArtifact; loading: boolean; error: string; owner?:string; dimensions?: ExportDimensions }
const entries = ref<Partial<Record<ExportKind, PreviewEntry>>>({})
const current = computed(() => entries.value[kind.value])
const details = computed(() => formatExportDimensions(current.value?.dimensions))
const loading = computed(() => current.value?.loading || false), error = computed(() => current.value?.error || '')
const selected = computed(() => exportFormats.find(item => item.kind === kind.value)!)
const canSave = computed(() => !props.busy && !loading.value && !error.value && !!current.value?.artifact && (props.isTauri || (['html', 'txt'].includes(kind.value)||kind.value.startsWith('plugin:'))))
let generation = 0
watch([() => props.open, () => props.revision], () => { generation++; entries.value = {} }, { immediate: true, flush: 'sync' })
watch([() => props.open, kind, shareSelected, () => props.revision, attempt], async ([open]) => {
  if (!open || shareSelected.value || entries.value[kind.value]) return
  const format = kind.value, ticket = generation
  entries.value[format] = { loading: true, error: '' }
  const entry = entries.value[format]!
  try {
    const artifact = await props.prepare(format,{skipPlugins:skippedPlugins.value})
    if (ticket === generation) entry.artifact = artifact
  } catch (cause) {
    if (ticket === generation) { entry.owner=(cause as any)?.owner;entry.error = String(cause).replace(/^Error: /, ''); entry.loading = false }
  }
}, { immediate: true })
function ready(format: ExportKind) { const entry = entries.value[format]; if (entry) entry.loading = false }
function failed(format: ExportKind, message: string) { const entry = entries.value[format]; if (entry) { entry.error = message; entry.loading = false } }
function dimensions(format: ExportKind, value: ExportDimensions) { const entry = entries.value[format]; if (entry) entry.dimensions = value }
function retry() { delete entries.value[kind.value]; attempt.value++ }
onBeforeUnmount(() => { generation++ })
function moveTab(event: KeyboardEvent, index: number) {
  const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
  if (!delta && !['Home', 'End'].includes(event.key)) return
  event.preventDefault()
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.value.length - 1 : (index + delta + tabs.value.length) % tabs.value.length
  selectTab(tabs.value[next].kind)
  void nextTick(() => document.getElementById(`export-tab-${shareSelected.value ? 'share' : kind.value}`)?.focus())
}
</script>
<template>
  <div v-if="open" class="modal-backdrop export-backdrop" @click.self="emit('close')">
    <div class="export-preview-modal" role="dialog" aria-modal="true" :aria-label="$t('导出文件')">
      <div class="export-preview-head"><ArrowUp :size="19" aria-hidden="true"/><span class="export-preview-title" :title="shareSelected ? filename : exportFilename(filename, kind)">{{ shareSelected ? filename.split('/').pop() : exportFilename(filename, kind) }}</span><span class="reference-esc" aria-hidden="true">ESC</span></div>
      <div class="export-tabs-section"><div class="reference-tabs export-format-tabs" role="tablist" :aria-label="$t('导出格式')">
        <button v-for="(item, index) in tabs" :id="`export-tab-${item.kind}`" :key="item.kind" role="tab" :disabled="item.kind === 'share' && !isTauri" :aria-selected="(shareSelected ? 'share' : kind) === item.kind" :class="{ active: (shareSelected ? 'share' : kind) === item.kind }" :aria-controls="`export-preview-${item.kind}`" :tabindex="(shareSelected ? 'share' : kind) === item.kind ? 0 : -1" @keydown="moveTab($event, index)" @click="selectTab(item.kind)">{{ $t(item.label) }}</button>
      </div></div>
      <div v-show="!shareSelected" :id="`export-preview-${kind}`" class="export-preview-pane" role="tabpanel" :aria-labelledby="`export-tab-${kind}`" :aria-busy="loading">
        <div v-if="error" class="export-preview-status" role="alert"><p>{{ error }}</p><button @click="retry">{{ $t('重新生成') }}</button><button v-if="current?.owner && !kind.startsWith('plugin:')" @click="skipFailedPlugin">{{ $t('跳过此插件后重试') }}</button></div>
        <template v-for="item in exportFormats" :key="item.kind">
          <ExportPreviewPane v-if="entries[item.kind]?.artifact" v-show="kind === item.kind" :artifact="entries[item.kind]!.artifact!" :active="kind === item.kind" @ready="ready(item.kind)" @dimensions="dimensions(item.kind, $event)" @error="failed(item.kind, $event)" @close="emit('close')"/>
        </template>
        <div v-if="loading" class="export-preview-loading" role="status">{{ $t('正在生成预览…') }}</div>
      </div>
      <div v-if="shareSelected" id="export-preview-share" class="export-share-pane" role="tabpanel" aria-labelledby="export-tab-share"><slot name="share"/></div>
      <div v-if="shareSelected" class="export-preview-footer"><slot name="share-actions"/></div>
      <div v-else class="export-preview-footer"><span class="export-preview-details">{{ details }}</span><button :disabled="!canSave" @click="emit('download', kind)">{{ busy ? $t('正在导出…') : `${$t('导出')} ${$t(selected.label)}` }}</button></div>
    </div>
  </div>
</template>

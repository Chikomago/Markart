<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import FormatIcon from '../editor/FormatIcon'
import { Pin } from 'lucide-vue-next'
import { pluginRuntime } from './runtime'
import type { PluginAction, PluginActionLocation } from './host/types'
const props = defineProps<{ location: PluginActionLocation; documentId?: string; targetPath?: string; actionId?: string; presentation?: 'icon'; pinned?: string[] }>()
const emit = defineEmits<{ execute: []; pin: [id: string] }>()
function context() { return pluginRuntime.context({ location: props.location, documentId: props.documentId, target: props.targetPath ? { path: props.targetPath, kind: 'file' } : undefined }) }
const captured = ref(context())
watch(() => [props.documentId, props.targetPath], () => { captured.value = context() })
const menu = computed(() => props.presentation !== 'icon' && ['file-tree', 'tab-context', 'topbar-menu'].includes(props.location))
const items = computed(() => pluginRuntime.actionsAt(props.location, menu.value ? captured.value : context()).filter(action => !props.actionId || action.id === props.actionId))
function title(action: PluginAction) { return action.title || pluginRuntime.state.commands.find(command => command.id === action.commandId)?.title || action.commandId }
function icon(action: PluginAction) { return action.icon || pluginRuntime.state.commands.find(command => command.id === action.commandId)?.icon || 'settings' }
function run(action: PluginAction, event: MouseEvent) {
  event.stopPropagation()
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const target = menu.value ? captured.value : context()
  void pluginRuntime.runAction(action, { ...target, anchor: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom } })
  emit('execute')
}
</script>
<template>
  <span v-if="items.length" class="plugin-actions" :class="{ 'plugin-actions-menu': menu }" :data-topbar-id="presentation === 'icon' ? actionId : undefined">
    <template v-for="action in items" :key="action.id">
      <div v-if="menu && location === 'topbar-menu' && pinned !== undefined" class="topbar-more-row">
        <button type="button" class="topbar-more-item plugin-action" role="menuitem" :title="title(action)" :aria-label="title(action)" @pointerdown.stop @mousedown.prevent.stop @click.stop="run(action, $event)"><span>{{ title(action) }}</span></button>
        <button type="button" class="topbar-more-pin" :title="pinned.includes(action.id) ? $t('取消固定') : $t('固定到菜单栏')" :aria-label="pinned.includes(action.id) ? $t('取消固定{0}', { '0': title(action) }) : $t('固定{0}到菜单栏', { '0': title(action) })" :aria-pressed="pinned.includes(action.id)" @pointerdown.stop @mousedown.prevent.stop @click.stop="emit('pin', action.id)"><Pin :size="13" :fill="pinned.includes(action.id) ? 'currentColor' : 'none'"/></button>
      </div>
      <button v-else type="button" class="plugin-action" :class="{ 'icon-button': !menu }" :role="menu ? 'menuitem' : undefined" :title="title(action)" :aria-label="title(action)" @pointerdown="presentation !== 'icon' && $event.stopPropagation()" @mousedown.prevent.stop @click.stop="run(action, $event)"><FormatIcon v-if="!menu || location !== 'topbar-menu'" :name="icon(action)" :size="15"/><span v-if="menu">{{ title(action) }}</span></button>
    </template>
  </span>
</template>
<style scoped>
.plugin-actions{display:inline-flex;align-items:center;gap:2px;flex:none}
.plugin-actions-menu{display:flex;align-items:stretch;flex-direction:column;border-top:1px solid var(--line);margin-top:4px;padding-top:4px}
.plugin-actions-menu .plugin-action{width:100%;display:flex;align-items:center;gap:8px;border:0;background:transparent;color:var(--ink);padding:7px 10px;font:inherit;text-align:left;border-radius:4px;cursor:pointer}
.plugin-actions-menu .plugin-action:hover{background:var(--hover)}
</style>

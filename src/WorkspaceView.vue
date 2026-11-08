<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import MenuBar from './MenuBar.vue'
import PluginDialogs from './plugins/PluginDialogs.vue'
import PluginWorkspace from './plugins/PluginWorkspace.vue'
import SidebarPane from './SidebarPane.vue'
import EditorWorkspace from './EditorWorkspace.vue'
import WorkspaceOverlays from './WorkspaceOverlays.vue'

export default defineComponent({
  name: 'WorkspaceView',
  components: { PluginWorkspace, PluginDialogs, MenuBar, SidebarPane, EditorWorkspace, WorkspaceOverlays },
  props: { context: { type: Object as PropType<Record<string, any>>, required: true } },
  setup(props) { return props.context }
})
</script>

<template>

  <div class="app-shell" :class="{ focused: focusMode, 'tauri-shell': isTauri, 'editor-align-left': editorAlignment === 'left', 'editor-table-full': tableWidth === 'full' }" :style="{ '--ui-font-family': uiFontFamily, '--editor-font-size': `${fontSize}px`, '--editor-font-family': editorFontFamily, '--editor-line-height': lineHeight, '--editor-paragraph-spacing': `${paragraphSpacing}px`, '--editor-indent': `${indent}em`, zoom: zoom === 100 ? undefined : `${zoom}%`, '--collapsed-topbar-inset': `${collapsedTopbarInset}px` }">
    <PluginWorkspace :context="workspaceUiContext" :inert="showSettings ? true : undefined">
    <main class="workspace" :class="{ 'sidebar-collapsed': !sidebar }" :style="{ '--traffic-light-inset': `${trafficLightInset}px` }" :inert="showSettings ? true : undefined">
      <MenuBar area="sidebarTop" :context="workspaceUiContext"/>
      <Transition name="sidebar-slide">
      <SidebarPane :context="workspaceUiContext"/>
      </Transition>
      <div v-if="sidebar" class="pane-resizer sidebar-resizer" role="separator" aria-orientation="vertical" :aria-label="$t('调整侧栏宽度')" @pointerdown="startResize('sidebar', $event)"/>

      <EditorWorkspace :context="context"/>

    </main>
    </PluginWorkspace>


    <PluginDialogs/>
    <WorkspaceOverlays :context="context"/>
  </div>

</template>

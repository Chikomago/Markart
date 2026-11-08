<script lang="ts">
import PluginActions from '../plugins/PluginActions.vue'
import { renderTemplate } from '../documents/personalItems'
import { FileFilterIcon, FileTreeViewIcon } from './icons'
import FileHeadingMenu from './FileHeadingMenu.vue'
import { computed, defineComponent, nextTick, onBeforeUnmount, onMounted, ref, toRef, unref, watch, type PropType } from 'vue'
import { Cloud, LayoutList, Search, Check, Github, RotateCcw, RefreshCw, FolderOpen, ChevronDown, ChevronRight, FileText, ListCollapse } from 'lucide-vue-next'

export default defineComponent({
  name: 'FileTreePanel',
  components: { FileFilterIcon, FileTreeViewIcon, FileHeadingMenu, PluginActions, Cloud, LayoutList, Search, Check, Github, RotateCcw, RefreshCw, FolderOpen, ChevronDown, ChevronRight, FileText, ListCollapse },
  props: { context: { type: Object as PropType<Record<string, any>>, required: true }, headingTarget: { type: Object as PropType<HTMLElement>, default: undefined } },
  setup(props) {
    const fileArea = ref<HTMLElement>(), syncTrigger = ref<HTMLElement>()
    const sidebarElement = ref<HTMLElement>()
    const selectedFolder = toRef(props.context, 'selectedFolder')
    const itemActions = toRef(props.context, 'itemActions')
    const contextTemplatesOpen = ref(false)
    watch(itemActions, () => { contextTemplatesOpen.value = false })
    function clearFolderSelection() { selectedFolder.value = null }
    function blurFolderSelection(event: Event) { if (!(event.target instanceof Element) || !event.target.closest('.tree-folder,.workspace-heading-trigger,.workspace-create-menu,.workspace-template-menu,.item-actions-menu,.directory-sync-popup')) clearFolderSelection() }
    onMounted(() => { window.addEventListener('pointerdown', blurFolderSelection, true); window.addEventListener('focusin', blurFolderSelection); window.addEventListener('blur', clearFolderSelection) })
    onBeforeUnmount(() => { window.removeEventListener('pointerdown', blurFolderSelection, true); window.removeEventListener('focusin', blurFolderSelection); window.removeEventListener('blur', clearFolderSelection) })
    const creationRowIndex = computed(() => {
      const pending = unref(props.context.inlineCreation)
      const rows = unref(props.context.treeRows) || []
      if (!pending) return -1
      const prefix = pending.parent ? `${pending.parent}/` : ''
      const belongs = (path: string) => pending.parent ? path === pending.parent || path.startsWith(prefix) : true
      if (pending.kind === 'folder') {
        const firstFile = rows.findIndex((row: { path: string; kind: string }) => row.kind === 'file' && row.path.split('/').slice(0, -1).join('/') === pending.parent)
        if (firstFile !== -1) return firstFile - 1
      }
      let last = -1
      rows.forEach((row: { path: string }, index: number) => { if (belongs(row.path)) last = index })
      return last
    })
    let creationInput: HTMLInputElement | null = null
    function focusCreationInput(element: unknown) {
      if (!(element instanceof HTMLInputElement)) { creationInput = null; return }
      if (creationInput === element) return
      creationInput = element
      void nextTick(() => {
        if (creationInput !== element || !element.isConnected) return
        element.scrollIntoView({ block: 'nearest' })
        element.focus({ preventScroll: true })
        element.select()
      })
    }
    watch(() => unref(props.context.inlineCreation), pending => { if (pending) rootExpanded.value = true })
    const rootExpanded = ref(true)
    function createFromContextMenu(kind: 'file' | 'folder', template?: any) {
      const item = itemActions.value
      if (!item) return
      const path = item.path as string
      const isFile = (unref(props.context.docs) || []).some((doc: { relativePath?: string }) => doc.relativePath === path)
      const parent = isFile ? path.split('/').slice(0, -1).join('/') : path
      itemActions.value = null
      if (kind === 'file') props.context.newDoc(template, parent)
      else props.context.newFolder(parent)
    }
    const directoryScroll = new Map<string, number>()
    watch(() => unref(props.context.currentWorkspaceRoot), (root, previous) => {
      if (previous) directoryScroll.set(previous, fileArea.value?.scrollTop || 0)
      rootExpanded.value = true
      void nextTick(() => { if (fileArea.value) fileArea.value.scrollTop = directoryScroll.get(root) || 0 })
    })
    const filterTrigger = ref<HTMLElement>(), sortTrigger = ref<HTMLElement>()
    const syncEnabled = computed(() => !!unref(props.context.isTauri) && !!unref(props.context.currentWorkspaceRoot) && !!unref(props.context.directorySyncAvailable))
    const showSync = toRef(props.context, 'showDirectorySync')
    const filterOpen = toRef(props.context, 'showFileFilter'), sortOpen = toRef(props.context, 'showSortMenu')
    function closeFileMenus() { filterOpen.value = false; sortOpen.value = false }
    const syncPosition = ref({ left: '0px', top: '0px', width: '213px', maxHeight: '360px' })
    function positionSyncPanel() {
      const button = syncTrigger.value
      if (!button) return
      const rect = button.getBoundingClientRect(), shell = button.closest('.app-shell')!
      const scale = Number.parseFloat(getComputedStyle(shell).zoom) || 1
      const width = Math.min(213, innerWidth / scale - 16)
      const top = Math.min(rect.bottom / scale + 6, innerHeight / scale - 100)
      syncPosition.value = { left: `${Math.max(8, Math.min(rect.left / scale, innerWidth / scale - width - 8))}px`, top: `${top}px`, width: `${width}px`, maxHeight: `${innerHeight / scale - top - 8}px` }
    }
    function toggleSyncPanel() { closeFileMenus(); showSync.value = !showSync.value }
    function closeSidebarMenus() { closeFileMenus(); showSync.value = false }
    function closeSyncOutside(event: PointerEvent) { if (!(event.target as Element).closest('.directory-sync-panel,.directory-sync-trigger')) showSync.value = false }
    function closeSyncOnEscape(event: KeyboardEvent) { if (event.key === 'Escape') { showSync.value = false } }
    watch(() => unref(props.context.showDirectorySync), open => { if (open) void nextTick(positionSyncPanel) })
    watch([syncEnabled, () => unref(props.context.currentWorkspaceRoot)], () => { showSync.value = false })
    function toggleRoot() { toRef(props.context, 'selectedFolder').value = ''; rootExpanded.value = !rootExpanded.value }
    const fileMenuPosition = ref({ left: '0px', top: '0px', maxHeight: '360px' })
    function positionFileMenu() {
      const button = unref(props.context.showFileFilter) ? filterTrigger.value : sortTrigger.value
      if (!button) return
      const rect = button.getBoundingClientRect(), shell = button.closest('.app-shell')!
      const scale = Number.parseFloat(getComputedStyle(shell).zoom) || 1
      fileMenuPosition.value = { left: `${Math.max(8, Math.min(rect.left / scale, innerWidth / scale - 228))}px`, top: `${rect.bottom / scale + 6}px`, maxHeight: `${Math.max(80, innerHeight / scale - rect.bottom / scale - 14)}px` }
    }
    watch([() => unref(props.context.showFileFilter), () => unref(props.context.showSortMenu)], () => { void nextTick(positionFileMenu) })
    watch(fileArea, (element, _, onCleanup) => { element?.addEventListener('scroll', closeSidebarMenus); onCleanup(() => element?.removeEventListener('scroll', closeSidebarMenus)) })
    onMounted(() => { window.addEventListener('resize', closeSidebarMenus); window.addEventListener('pointerdown', closeSyncOutside); window.addEventListener('keydown', closeSyncOnEscape) })
    onBeforeUnmount(() => { window.removeEventListener('resize', closeSidebarMenus); window.removeEventListener('pointerdown', closeSyncOutside); window.removeEventListener('keydown', closeSyncOnEscape) })
    return { ...props.context, creationRowIndex, focusCreationInput, selectedFolder, itemActions, contextTemplatesOpen, renderTemplate, createFromContextMenu, fileArea, syncTrigger, syncEnabled, syncPosition, toggleSyncPanel, rootExpanded, toggleRoot, filterTrigger, sortTrigger, fileMenuPosition } as Record<string, any>
  }
})
</script>

<template>
<section ref="sidebarElement" class="builtin-files-panel" @mousedown.capture="($event.button===2&&!($event.target as HTMLElement).closest('input,textarea,[contenteditable]'))&&$event.preventDefault()" @contextmenu="($event.target as HTMLElement).closest('input,textarea,[contenteditable]') || $event.preventDefault()">
        <FileHeadingMenu :context="$props.context" :target="$props.headingTarget"/>
        <input v-if="!isTauri" ref="folderInput" class="visually-hidden" type="file" webkitdirectory multiple @change="openFolder"/>
        <template v-if="!isTauri || currentWorkspaceRoot">
        <div class="side-tools file-tree-tools" :class="{'is-always-visible':fileActionsAlwaysVisible}"><span class="side-tools-spacer"/><button class="icon-button view-toggle" :title="`${sideView === 'tree' ? $t('切换到文件列表') : $t('切换到文件树')} ⌘⇧L`" :aria-label="sideView === 'tree' ? $t('切换到文件列表') : $t('切换到文件树')" @click="sideView = sideView === 'tree' ? 'list' : 'tree'"><LayoutList v-if="sideView === 'tree'" :size="14"/><FileTreeViewIcon v-else :size="14"/></button><button class="icon-button" :title="$t('搜索文件与内容 ⌘⇧F')" @click="toggleWorkspaceSearch"><Search :size="14"/></button><span class="file-menu-anchor"><button ref="filterTrigger" class="icon-button file-filter-trigger" :class="{ active: filterActive }" :title="$t('筛选文件')" :aria-label="$t('筛选文件')" :aria-expanded="showFileFilter" @click="showFileFilter = !showFileFilter; showSortMenu = false"><FileFilterIcon :size="14"/></button><Teleport defer to=".app-shell"><div v-if="showFileFilter" class="file-filter-menu file-tree-floating-menu" :style="fileMenuPosition" role="group" :aria-label="$t('文件筛选')"><div class="menu-heading">{{ $t('筛选文件') }}</div><label><input v-model="utf8Only" type="checkbox">UTF-8</label><label><input v-model="excludeExtensionless" type="checkbox">{{ $t('排除无扩展名') }}</label><label><input v-model="excludeHidden" type="checkbox">{{ $t('排除隐藏文件') }}</label><label><input v-model="hideEmptyFolders" type="checkbox">{{ $t('隐藏空文件夹') }}</label><div class="file-filter-presets" :aria-label="$t('常用扩展名')"><button v-for="extension in commonFileExtensions" :key="extension" type="button" :aria-pressed="selectedFileExtensions.includes(extension)" @click="toggleFileExtension(extension)">{{ extension }}</button><button type="button" :aria-pressed="includeExtensionless" :aria-label="$t('无扩展名')" @click="includeExtensionless = !includeExtensionless">{{ $t('无') }}</button></div><label class="file-filter-extensions"><input v-model="fileExtensions" :aria-label="$t('筛选扩展名')" placeholder="md, txt, js" type="text"/></label></div></Teleport></span><span class="file-menu-anchor"><button ref="sortTrigger" class="icon-button sort-trigger" :title="`${$t('排序：{0}', { '0': selectedSort.label })} ⌘⇧S`" :aria-label="$t('排序：{0}', { '0': selectedSort.label })" :aria-expanded="showSortMenu" @click="showSortMenu = !showSortMenu; showFileFilter = false; showNewMenu = false"><component :is="selectedSort.icon" :size="14"/></button><Teleport defer to=".app-shell"><div v-if="showSortMenu" class="sort-menu file-tree-floating-menu" :style="fileMenuPosition"><div class="menu-heading">{{ $t('排序方式') }}</div><button v-for="option in sortOptions" :key="option.value" :class="{ selected: sortMode === option.value }" @click="sortMode = option.value; showSortMenu = false"><component :is="option.icon" :size="16"/><span>{{ option.label }}</span><Check v-if="sortMode === option.value" :size="14"/></button></div></Teleport></span><span class="side-tools-spacer"/></div>
        <div ref="fileArea" class="file-area" data-folder-target="">

          <Teleport defer to=".app-shell">
        <div v-if="syncEnabled && showDirectorySync" id="directory-sync-panel" class="directory-sync-panel directory-sync-popup" :style="syncPosition">
          <div class="directory-sync-title">{{ $t('同步') }}</div>
          <section v-if="githubHasToken" class="directory-sync-section">
            <div class="directory-sync-heading"><Github :size="15"/><strong>GitHub</strong></div>
              <template v-if="githubBoundUrl"><div class="directory-sync-bound"><span class="directory-sync-target" :title="githubBoundUrl">{{ githubBoundUrl.replace('https://github.com/', '').replace(/\.git$/, '') }}</span><div class="directory-sync-actions"><button :disabled="githubRepoBusy || !!githubUnbindPendingRoot" @click="unbindGithubRepo">{{ githubUnbindPendingRoot ? $t('正在解除绑定…') : $t('解除绑定') }}</button></div></div></template>
              <template v-else><div class="directory-sync-list-head"><span><button class="directory-sync-create-link" @click="githubCreatingRepo = true">{{ $t('新建') }}</button>{{ $t('或') }}<button class="directory-sync-create-link" @click="githubCreatingRepo = false; githubRepoDraft = ''">{{ $t('选择') }}</button>{{ $t('私有仓库') }}</span><button v-if="!githubCreatingRepo" class="directory-sync-refresh" :disabled="githubRepoBusy" :title="$t('刷新仓库列表')" :aria-label="$t('刷新仓库列表')" @click="loadGithubRepos"><RotateCcw :size="14"/></button></div><div v-if="githubCreatingRepo" class="directory-sync-create github-repo-create"><input v-model.trim="githubRepoDraft" :placeholder="$t('私有仓库名称')" :aria-label="$t('新建私有仓库名称')" @keydown.enter.prevent="createGithubRepo"/><button :disabled="githubRepoBusy || !githubRepoDraft" @click="createGithubRepo">{{ $t('新建') }}</button></div><div v-else class="directory-sync-list"><div v-for="repo in githubRepos" :key="repo.url"><span :title="repo.fullName">{{ repo.fullName }}</span><button :disabled="githubRepoBusy" @click="bindGithubRepo(repo.url)">{{ $t('绑定') }}</button></div><p v-if="!githubRepos.length">{{ $t('没有可选仓库，可创建私有仓库后绑定') }}</p></div></template>
          </section>
          <section v-if="webdavHasPassword" class="directory-sync-section">
            <div class="directory-sync-heading"><Cloud :size="15"/><strong>WebDAV</strong></div>
              <template v-if="webdavBoundUrl"><div class="directory-sync-bound"><span class="directory-sync-target" :title="webdavBoundUrl">{{ webdavBoundUrl }}</span><div class="directory-sync-actions"><button :disabled="webdavBindingBusy || !!webdavUnbindPendingRoot" @click="unbindWebdavFolder">{{ webdavUnbindPendingRoot ? $t('正在解除绑定…') : $t('解除绑定') }}</button></div></div></template>
              <template v-else><div class="directory-sync-create"><input v-model.trim="webdavFolderDraft" :placeholder="$t('新建或输入远端文件夹路径')" :aria-label="$t('WebDAV 远端文件夹路径')"/><button :disabled="webdavBindingBusy || !webdavFolderDraft" @click="bindWebdavFolder()">{{ $t('创建并绑定') }}</button></div><div class="directory-sync-list-head"><span>{{ $t('已有远端文件夹') }}</span><button :disabled="webdavFoldersBusy" @click="loadWebdavFolders">{{ $t('刷新') }}</button></div><div class="directory-sync-list"><div v-for="folder in webdavFolders" :key="folder"><span :title="folder">{{ folder }}</span><button :disabled="webdavBindingBusy" @click="bindWebdavFolder(folder)">{{ $t('绑定') }}</button></div><p v-if="!webdavFolders.length">{{ $t('没有可选文件夹，可输入路径创建') }}</p></div></template>
          </section>
        </div>
          </Teleport>
        <input v-if="showSearch" ref="searchInput" v-model="search" class="search-input" :placeholder="$t('搜索文件名或文件内容')" :aria-label="$t('搜索文件名或文件内容')" />
          <div v-if="sideView === 'tree'" class="tree-folder file-tree-root" data-folder-target="" @contextmenu.prevent="showItemActions('', $event)"><button type="button" class="folder-row file-tree-directory" :class="{ selected: selectedFolder === '' }" :aria-current="selectedFolder === '' ? 'location' : undefined" :title="currentDirectory" :aria-expanded="rootExpanded" aria-controls="file-tree-children" @click="toggleRoot"><ChevronDown v-if="rootExpanded" :size="14"/><ChevronRight v-else :size="14"/><span class="root-folder-icon-slot"><FolderOpen v-if="!syncEnabled" :size="16"/></span><span>{{ currentDirectory }}</span></button><button v-if="syncEnabled" ref="syncTrigger" type="button" class="icon-button directory-sync-trigger root-sync-icon" :class="{ active: showDirectorySync }" :title="$t('{0} 同步设置', { '0': currentDirectory })" :aria-label="$t('{0} 同步设置', { '0': currentDirectory })" :aria-expanded="showDirectorySync" aria-controls="directory-sync-panel" @click="toggleSyncPanel"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 1024 1024" aria-hidden="true"><path v-if="directorySyncBound" fill="currentColor" d="M811.4 418.7C765.6 297.9 648.9 212 512.2 212S258.8 297.8 213 418.6C127.3 441.1 64 519.1 64 612c0 110.5 89.5 200 199.9 200h496.2C870.5 812 960 722.5 960 612c0-92.7-63.1-170.7-148.6-193.3m36.3 281a123.07 123.07 0 0 1-87.6 36.3H263.9c-33.1 0-64.2-12.9-87.6-36.3A123.3 123.3 0 0 1 140 612c0-28 9.1-54.3 26.2-76.3a125.7 125.7 0 0 1 66.1-43.7l37.9-9.9l13.9-36.6c8.6-22.8 20.6-44.1 35.7-63.4a245.6 245.6 0 0 1 52.4-49.9c41.1-28.9 89.5-44.2 140-44.2s98.9 15.3 140 44.2c19.9 14 37.5 30.8 52.4 49.9c15.1 19.3 27.1 40.7 35.7 63.4l13.8 36.5l37.8 10c54.3 14.5 92.1 63.8 92.1 120c0 33.1-12.9 64.3-36.3 87.7"/><g v-else fill="currentColor"><path d="M704 446H320c-4.4 0-8 3.6-8 8v402c0 4.4 3.6 8 8 8h384c4.4 0 8-3.6 8-8V454c0-4.4-3.6-8-8-8m-328 64h272v117H376zm272 290H376V683h272z"/><path d="M424 748a32 32 0 1 0 64 0a32 32 0 1 0-64 0m0-178a32 32 0 1 0 64 0a32 32 0 1 0-64 0"/><path d="M811.4 368.9C765.6 248 648.9 162 512.2 162S258.8 247.9 213 368.8C126.9 391.5 63.5 470.2 64 563.6C64.6 668 145.6 752.9 247.6 762c4.7.4 8.7-3.3 8.7-8v-60.4c0-4-3-7.4-7-7.9c-27-3.4-52.5-15.2-72.1-34.5c-24-23.5-37.2-55.1-37.2-88.6c0-28 9.1-54.4 26.2-76.4c16.7-21.4 40.2-36.9 66.1-43.7l37.9-10l13.9-36.7c8.6-22.8 20.6-44.2 35.7-63.5c14.9-19.2 32.6-36 52.4-50c41.1-28.9 89.5-44.2 140-44.2s98.9 15.3 140 44.3c19.9 14 37.5 30.8 52.4 50c15.1 19.3 27.1 40.7 35.7 63.5l13.8 36.6l37.8 10c54.2 14.4 92.1 63.7 92.1 120c0 33.6-13.2 65.1-37.2 88.6c-19.5 19.2-44.9 31.1-71.9 34.5c-4 .5-6.9 3.9-6.9 7.9V754c0 4.7 4.1 8.4 8.8 8c101.7-9.2 182.5-94 183.2-198.2c.6-93.4-62.7-172.1-148.6-194.9"/></g></svg></button><button v-if="directorySyncBound" type="button" class="icon-button root-manual-sync" :disabled="directorySyncBusy" :title="directorySyncHint" :aria-label="$t('手动同步')" @click.stop="runDirectorySync"><RefreshCw :size="12"/></button></div>
          <div v-show="sideView !== 'tree' || rootExpanded" id="file-tree-children" class="file-tree-children">
          <div v-if="isTauri && !docs.length" class="empty-state">{{ $t('打开文件夹后，可在这里浏览文件。') }}</div>
          <template v-if="sideView === 'tree'">
            <div v-if="inlineCreation && creationRowIndex === -1" class="file-row tree-inline-rename"><FolderOpen v-if="inlineCreation.kind === 'folder'" :size="16"/><FileText v-else :size="15"/><input :ref="focusCreationInput" v-model="inlineCreation.name" :aria-label="inlineCreation.kind === 'folder' ? $t('新建文件夹') : $t('新建文件')" @keydown.enter.prevent="finishInlineCreation(true)" @keydown.esc.prevent.stop="finishInlineCreation(false)" @blur="finishInlineCreation(true)"/></div>

            <template v-for="(row, rowIndex) in treeRows" :key="row.path">
              <div v-if="row.kind === 'folder'" @contextmenu.prevent="showItemActions(row.path, $event)" class="tree-folder" :data-folder-target="row.path" :class="{ 'file-drop-over': fileDropTarget === row.path }" :style="{ paddingLeft: `${row.depth * 14}px` }"><div v-if="inlineRename?.path === row.path" class="folder-row tree-inline-rename"><FolderOpen :size="16"/><input :value="inlineRename?.name || ''" @input="inlineRename && (inlineRename.name = ($event.target as HTMLInputElement).value)" :aria-label="`重命名${row.path}`" @keydown.enter.prevent="commitInlineRename" @keydown.esc.prevent="inlineRename = null" @blur="commitInlineRename"/></div><button v-else class="folder-row" :class="{ selected: selectedFolder === row.path }" :aria-current="selectedFolder === row.path ? 'location' : undefined" @click="selectedFolder = row.path; folderExpanded[row.path] = !folderExpanded[row.path]"><ChevronDown v-if="search.trim() || folderExpanded[row.path]" :size="14"/><ChevronRight v-else :size="14"/><FolderOpen :size="16"/><span>{{ row.path.split('/').pop() }}</span></button></div>
              <div v-else class="tree-file" :data-file-path="row.doc.relativePath"><div v-if="inlineRename && inlineRename.path === row.doc.relativePath" class="file-row tree-inline-rename" :style="{ paddingLeft: `${30 + row.depth * 14}px` }"><FileText :size="15"/><input :value="inlineRename?.name || ''" @input="inlineRename && (inlineRename.name = ($event.target as HTMLInputElement).value)" :aria-label="`重命名${row.doc.path}`" @keydown.enter.prevent="commitInlineRename" @keydown.esc.prevent="inlineRename = null" @blur="commitInlineRename"/></div><button v-else class="file-row" :class="{ selected: row.doc.id === activeId }" :style="{ paddingLeft: `${30 + row.depth * 14}px` }" @pointerdown="row.doc.relativePath && startFileDrag($event, row.doc.relativePath)" @click="!suppressFileClick && selectDoc(row.doc.id)" @contextmenu.prevent="row.doc.relativePath && showItemActions(row.doc.relativePath, $event)"><FileText :size="15"/><span>{{ row.doc.path.split('/').pop() }}</span><span v-if="dirtyIds.includes(row.doc.id)" class="dirty-mark" :title="$t('未保存')">*</span></button></div>
              <div v-if="inlineCreation && rowIndex === creationRowIndex" class="file-row tree-inline-rename" :style="{ paddingLeft: `${30 + inlineCreation.parent.split('/').filter(Boolean).length * 14}px` }"><FolderOpen v-if="inlineCreation.kind === 'folder'" :size="16"/><FileText v-else :size="15"/><input :ref="focusCreationInput" v-model="inlineCreation.name" :aria-label="inlineCreation.kind === 'folder' ? $t('新建文件夹') : $t('新建文件')" @keydown.enter.prevent="finishInlineCreation(true)" @keydown.esc.prevent.stop="finishInlineCreation(false)" @blur="finishInlineCreation(true)"/></div>
            </template>

          </template>
          <template v-else><button v-for="doc in filteredDocs" :key="doc.id" class="document-card" :data-file-path="doc.relativePath" :class="{ selected: doc.id === activeId }" @click="selectDoc(doc.id)"><span class="doc-meta"><span>{{ doc.path.split('/').slice(0,-1).join('/') }}</span><span>{{ new Date(doc.updated).toLocaleDateString('zh-CN') }}</span></span><strong>{{ doc.path.split('/').pop() }}<span v-if="dirtyIds.includes(doc.id)" class="dirty-mark" :title="$t('未保存')">*</span></strong><span class="doc-excerpt"><span>{{ documentExcerpts[doc.id]?.before }}</span><mark v-if="documentExcerpts[doc.id]?.match">{{ documentExcerpts[doc.id]?.match }}</mark><span>{{ documentExcerpts[doc.id]?.after }}</span></span></button></template>
          </div>
        </div>
        <div v-if="itemActions" class="item-actions-menu" :style="{ left: `${itemActions.x}px`, top: `${itemActions.y}px` }"><button @click="createFromContextMenu('file')">{{ $t('新建文件') }}</button><button @click="createFromContextMenu('folder')">{{ $t('新建文件夹') }}</button><button :disabled="!templates.length" :aria-expanded="contextTemplatesOpen" @click="contextTemplatesOpen = !contextTemplatesOpen">{{ $t('从模板创建') }}</button><template v-if="contextTemplatesOpen"><button v-for="template in templates" :key="template.id" class="context-template-item" @click="createFromContextMenu('file', template)">{{ renderTemplate(template.name, '未命名文件.md') }}</button></template><div class="item-menu-separator"/><button :disabled="itemActions.path === ''" @click="runItemAction('rename')">{{ $t('重命名') }}</button><button :disabled="itemActions.path === ''" @click="runItemAction('trash')">{{ $t('删除') }}</button><div class="item-menu-separator"/><button @click="runItemUtility('window')">{{ $t('从新窗口打开') }}</button><button @click="runItemUtility('reveal')">{{ isMac ? $t('在 Finder 中显示') : $t('在资源管理器中显示') }}</button><button @click="runItemUtility('copy')">{{ $t('复制路径') }}</button><button @click="runItemUtility('info')">{{ isMac ? $t('显示简介') : $t('显示属性') }}</button><PluginActions location="file-tree" :target-path="itemActions.path" @execute="itemActions = null"/></div>
        </template>
        <div v-if="isTauri && !currentWorkspaceRoot" class="empty-state">{{ $t('打开文件夹后，可在这里浏览文件。') }}</div>
      </section>
</template>

<style scoped>.item-actions-menu .context-template-item{padding-left:20px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.builtin-files-panel{display:flex;flex-direction:column;flex:1;min-height:0;height:100%;overflow:hidden}.builtin-files-panel .file-tree-tools{flex:none;height:32px;min-height:32px;margin:0 9px 4px;padding:0;gap:1px;border:0}.builtin-files-panel .file-area{flex:1;min-height:0;height:auto}.builtin-files-panel{position:relative;overflow:visible}.builtin-files-panel .side-tools.file-tree-tools{position:absolute;top:-30px;right:9px;width:max-content;height:30px;min-height:30px;margin:0;padding:0;gap:1px;flex:none;z-index:1}.builtin-files-panel .file-tree-tools .side-tools-spacer{display:none}.builtin-files-panel .file-tree-tools .icon-button{width:27px;min-width:27px;height:27px}.file-tree-tools.is-always-visible .icon-button{opacity:1;pointer-events:auto}.file-tree-tools .icon-button.active,.file-tree-tools .icon-button:active,.file-tree-tools .icon-button[aria-expanded="true"]{background:transparent;box-shadow:none}.file-tree-tools .icon-button:focus:not(:focus-visible){outline:none;box-shadow:none}.file-tree-tools .icon-button:hover{background:transparent;box-shadow:none}.builtin-files-panel .file-tree-tools .icon-button,.builtin-files-panel .file-tree-tools .icon-button:hover,.builtin-files-panel .file-tree-tools .icon-button:active,.builtin-files-panel .file-tree-tools .icon-button:focus,.builtin-files-panel .file-tree-tools .icon-button.active,.builtin-files-panel .file-tree-tools .icon-button[aria-expanded="true"]{color:var(--muted);background:transparent;box-shadow:none}.builtin-files-panel .file-tree-tools .icon-button:hover{background:color-mix(in srgb,var(--ink) 6%,transparent);color:var(--muted)}.builtin-files-panel .folder-row,.builtin-files-panel .file-row,.builtin-files-panel .document-card{user-select:none;-webkit-user-select:none}.builtin-files-panel input{user-select:text;-webkit-user-select:text}.file-tree-tools .icon-button :deep(svg.lucide){stroke-width:1.7}.file-tree-view-icon :deep(path[fill="currentColor"]){stroke:currentColor;stroke-width:.4;stroke-linejoin:round}
</style>

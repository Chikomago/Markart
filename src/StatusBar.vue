<script lang="ts">
import { t } from './i18n'
import { defineComponent, unref, type PropType } from 'vue'
import ViewModeMenu from './ViewModeMenu.vue'
import WritingModeMenu from './WritingModeMenu.vue'
import SettingSelect from './settings/SettingSelect.vue'
import { Github, Cloud } from 'lucide-vue-next'

export default defineComponent({
  name: 'StatusBar',
  components: { WritingModeMenu, ViewModeMenu, SettingSelect, Github, Cloud },
  props: { context: { type: Object as PropType<Record<string, any>>, required: true } },
  setup(props) {
    function syncHint(provider: string, busy: boolean, status: string) {
      const time = (unref(props.context.directorySyncHint) || '').split('\n').find((line: string) => line.startsWith(`${provider} ·`)) || ''
      const state = busy ? t('同步中…') : status?.startsWith('同步失败') || status?.includes('冲突') ? status : ''
      return [state, time].filter(Boolean).join('\n')
    }
    return { ...props.context, syncHint } as Record<string, any>
  }
})
</script>

<template>
<footer class="statusbar"><span class="status-spacer"/><button v-if="githubBoundUrl && githubHasToken" class="sync-status-button" :class="{ syncing: githubBusy, 'sync-error': !githubBusy && githubStatus.startsWith('同步失败'), 'sync-warning': !githubBusy && githubStatus.includes('冲突') }" :disabled="githubBusy" :title="syncHint('GitHub', githubBusy, githubStatus)" :aria-label="githubBusy ? $t('GitHub 正在同步') : $t('手动同步 GitHub')" @click="runGithubSync(true)"><Github :size="14"/></button><button v-if="webdavBoundUrl && webdavUsername && webdavHasPassword" class="sync-status-button" :class="{ syncing: webdavBusy, 'sync-error': !webdavBusy && webdavStatus.startsWith('同步失败'), 'sync-warning': !webdavBusy && webdavStatus.includes('冲突') }" :disabled="webdavBusy" :title="syncHint('WebDAV', webdavBusy, webdavStatus)" :aria-label="webdavBusy ? $t('WebDAV 正在同步') : $t('手动同步 WebDAV')" @click="runWebdavSync(true)"><Cloud :size="14"/></button><span>{{ words }} {{ $t('字') }}</span><WritingModeMenu :active="commandActive" :icon="commandIcon" :title-for="commandTitle" :run="onTopbarClick"/><ViewModeMenu :mode="mode" :markdown-active="markdownActive" :set-mode="setMode"/><span class="zoom-control"><SettingSelect v-model="zoom" :label="$t('界面缩放')" :options="zoomOptions.map((value: number) => ({ value, label: `${value}%` }))"/></span></footer>
</template>

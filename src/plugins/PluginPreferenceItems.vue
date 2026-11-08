<script setup lang="ts">
import { computed } from 'vue'
import { pluginRuntime } from './runtime'
import PluginSettingControl from './PluginSettingControl.vue'
const props = defineProps<{ category: string }>()
const settings = computed(() => pluginRuntime.state.settings.filter(item => item.category === props.category).slice().sort((a, b) => (a.order || 0) - (b.order || 0)))
</script>
<template><section v-if="settings.length" class="plugin-preference-items"><PluginSettingControl v-for="setting in settings" :key="setting.id" :setting="setting"/></section></template>

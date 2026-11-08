<script setup lang="ts">
import PluginUninstallDialog from './ui/PluginUninstallDialog.vue'
import PluginUpdateDialog from './ui/PluginUpdateDialog.vue'
import { pluginRuntime } from './runtime'; import PluginDialogFrame from './PluginDialogFrame.vue';
</script>
<template><PluginUninstallDialog/><PluginUpdateDialog/><PluginDialogFrame v-for="(dialog, index) in pluginRuntime.state.dialogs" :key="dialog.id" :dialog="dialog" :top="index === pluginRuntime.state.dialogs.length - 1"/></template>

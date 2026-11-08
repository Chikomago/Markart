<script setup lang="ts">
import WorkspaceView from './WorkspaceView.vue'
import QuickCapture from './QuickCapture.vue'
import { useWorkspaceController } from './workspace/useWorkspaceController'

const quickCapture = new URLSearchParams(location.search).has('quickCapture')
const controller = quickCapture ? null : useWorkspaceController()
</script>

<template>
  <QuickCapture v-if="quickCapture"/><WorkspaceView v-else :context="controller!"/>
</template>

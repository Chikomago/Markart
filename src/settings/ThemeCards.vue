<script setup lang="ts">
import ThemeCarousel from './ThemeCarousel.vue'
import { Check, Trash2, Plus } from 'lucide-vue-next'
import type { Theme } from './usePreferences'
defineProps<{ themes: Theme[]; modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [name: string]; remove: [name: string]; add: [] }>()
</script>
<template>
  <div class="theme-cards"><ThemeCarousel><div v-for="theme in themes" :key="theme.name" class="theme-grid-item"><button :class="{ active: modelValue === theme.name }" @click="emit('update:modelValue', theme.name)"><span class="theme-preview" :style="theme.preview ? { '--preview-panel': theme.preview[0], '--preview-paper': theme.preview[1], '--preview-accent': theme.preview[2] } : {}"><i class="theme-preview-sidebar"><i/><i/><i/></i><i class="theme-preview-page"><i/><i/><i/></i></span><span class="theme-card-name">{{ theme.label || theme.name }}<Check v-if="modelValue === theme.name" :size="13"/></span><small v-if="theme.description" class="theme-card-description">{{ theme.description }}</small></button><button v-if="theme.custom" class="theme-grid-delete" :aria-label="$t('删除主题{0}', { '0': theme.name })" @click="emit('remove', theme.name)"><Trash2 :size="13"/></button></div></ThemeCarousel><button class="setting-add" @click="emit('add')"><Plus :size="15"/> {{ $t('添加主题') }}</button></div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, onUpdated, ref } from 'vue'
import { ChevronRight } from 'lucide-vue-next'
const viewport = ref<HTMLElement | null>(null)
const canScrollRight = ref(false)
let observer: ResizeObserver | undefined
function update() {
  const element = viewport.value
  canScrollRight.value = !!element && element.scrollWidth - element.clientWidth - element.scrollLeft > 2
}
function advance() {
  const element = viewport.value
  if (!element) return
  element.scrollBy({ left: Math.max(168, element.clientWidth - 48), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
}
onMounted(() => { observer = new ResizeObserver(update); if (viewport.value) observer.observe(viewport.value); update() })
onUpdated(() => { void nextTick(update) })
onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div class="theme-carousel">
    <div ref="viewport" class="theme-grid" @scroll="update"><slot/></div>
    <div v-if="canScrollRight" class="theme-carousel-edge"><button type="button" class="theme-carousel-next" :aria-label="$t('向右查看主题')" @click="advance"><ChevronRight :size="20"/></button></div>
  </div>
</template>

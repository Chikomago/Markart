<script setup lang="ts">
import { computed,ref,watch,nextTick,onBeforeUnmount } from 'vue'
import { updateRequest } from './update'
const frame=ref<HTMLElement>(),previous=ref<HTMLElement>()
const detail=computed(()=>updateRequest.value?.detail)
const added=computed(()=>detail.value?detail.value.permissions.join('、'):'')
function key(event:KeyboardEvent){if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();updateRequest.value?.resolve(false)}if(event.key==='Tab'){const nodes=[...frame.value!.querySelectorAll<HTMLElement>('button')],index=nodes.indexOf(document.activeElement as HTMLElement);event.preventDefault();nodes[(index+(event.shiftKey?-1:1)+nodes.length)%nodes.length]?.focus()}}
watch(updateRequest,async request=>{if(request){previous.value=document.activeElement as HTMLElement;window.addEventListener('keydown',key,true);await nextTick();frame.value?.querySelector<HTMLButtonElement>('button')?.focus()}else{window.removeEventListener('keydown',key,true);previous.value?.focus()}})
onBeforeUnmount(()=>{window.removeEventListener('keydown',key,true);updateRequest.value?.resolve(false)})
</script>
<template><div v-if="detail" class="plugin-update-backdrop"><section ref="frame" class="plugin-update-dialog" role="alertdialog" aria-modal="true" :aria-label="$t('更新插件')"><h3>{{$t('更新插件')}} · {{detail.name}} {{detail.version}}</h3><p>{{$t('此更新将新增以下权限：{0}', { 0: added })}}</p><p class="plugin-update-note">{{$t('未声明的能力不会被授予。取消则保留当前版本。')}}</p><footer><button @click="updateRequest?.resolve(false)">{{$t('取消')}}</button><button @click="updateRequest?.resolve(true)">{{$t('继续更新')}}</button></footer></section></div></template>
<style scoped>.plugin-update-backdrop{position:absolute;inset:0;z-index:160;display:grid;place-items:center;background:#0003}.plugin-update-dialog{width:420px;max-width:calc(100% - 32px);padding:22px;border:1px solid var(--line-strong);border-radius:12px;background:var(--paper);color:var(--ink);box-shadow:var(--shadow);font-size:13px;line-height:1.8}.plugin-update-dialog h3{margin:0;font-size:16px}.plugin-update-dialog p{margin:12px 0 0}.plugin-update-note{color:var(--ink-soft)}.plugin-update-dialog footer{display:flex;gap:10px;justify-content:flex-end;margin-top:18px}.plugin-update-dialog button{padding:6px 15px;border:1px solid var(--line);border-radius:6px;background:var(--panel);color:var(--ink);font:inherit}</style>

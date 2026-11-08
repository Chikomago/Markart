<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, unref, watch } from 'vue'
import { ChevronDown, ChevronRight, FilePlus2, FolderPlus } from 'lucide-vue-next'
import { renderTemplate } from '../documents/personalItems'
const props=defineProps<{context:Record<string,any>;target?:HTMLElement}>()
const creationParent=ref<string | null>(null)
const open=ref(false),templatesOpen=ref(false),trigger=ref<HTMLElement>(),menu=ref<HTMLElement>(),templateMenu=ref<HTMLElement>(),date=ref(new Date())
const position=ref({left:'0px',top:'0px',maxHeight:'320px'})
const templatePosition=ref({left:'0px',top:'0px',maxHeight:'320px'})
const templates=computed(()=>unref(props.context.templates)||[])
const canCreate=computed(()=>!!unref(props.context.currentWorkspaceRoot)&&(unref(props.context.selectedFolder)!==null||!!unref(props.context.activeDoc)?.relativePath||!!unref(props.context.activeDoc)?.sourceRelativePath))
function close(){open.value=false;templatesOpen.value=false}
function dismiss(event:Event){if(event instanceof KeyboardEvent){if(event.key==='Escape'&&open.value){close();trigger.value?.focus()}return}if(event.target instanceof Node&&!trigger.value?.contains(event.target)&&!menu.value?.contains(event.target)&&!templateMenu.value?.contains(event.target))close()}
async function toggle(){open.value=!open.value;templatesOpen.value=false;if(!open.value)return;date.value=new Date();creationParent.value=unref(props.context.selectedFolder);await nextTick();const rect=trigger.value!.getBoundingClientRect(),shell=trigger.value!.closest('.app-shell'),scale=shell?parseFloat(getComputedStyle(shell).zoom)||1:1;position.value={left:`${Math.max(8,Math.min(rect.left/scale,innerWidth/scale-198))}px`,top:`${rect.bottom/scale+4}px`,maxHeight:`${Math.max(80,innerHeight/scale-rect.bottom/scale-12)}px`}}
async function toggleTemplates(event:MouseEvent){
 const anchor=event.currentTarget as HTMLElement
 templatesOpen.value=!templatesOpen.value;if(!templatesOpen.value)return
 await nextTick();const rect=anchor.getBoundingClientRect(),bounds=menu.value!.getBoundingClientRect(),shell=trigger.value!.closest('.app-shell'),scale=shell?parseFloat(getComputedStyle(shell).zoom)||1:1
 const width=190,height=Math.min(templateMenu.value?.offsetHeight||320,innerHeight/scale-16),right=bounds.right/scale+5
 templatePosition.value={left:`${Math.max(8,right+width<=innerWidth/scale-8?right:bounds.left/scale-width-5)}px`,top:`${Math.max(8,Math.min(rect.top/scale,innerHeight/scale-height-8))}px`,maxHeight:`${Math.max(80,innerHeight/scale-16)}px`}
}
function create(folder=false,template?:any){close();if(folder)void props.context.newFolder();else void props.context.newDoc(template,creationParent.value ?? undefined)}
watch(()=>props.target,close)
onMounted(()=>{document.addEventListener('pointerdown',dismiss);document.addEventListener('keydown',dismiss);window.addEventListener('resize',close);window.addEventListener('blur',close)})
onBeforeUnmount(()=>{document.removeEventListener('pointerdown',dismiss);document.removeEventListener('keydown',dismiss);window.removeEventListener('resize',close);window.removeEventListener('blur',close)})
</script>
<template>
<Teleport :to="target||'.app-shell'" :disabled="!target"><button v-show="!!target" ref="trigger" class="workspace-heading-trigger new-menu-trigger file-heading-menu-trigger" :aria-expanded="open" aria-haspopup="menu" @click="toggle">{{$t('文件')}}<ChevronDown :size="11"/></button></Teleport>
<Teleport defer to=".app-shell"><div v-if="open" ref="menu" class="workspace-create-menu new-item-menu file-heading-menu" role="menu" :aria-label="$t('文件')" :style="position"><button role="menuitem" :disabled="!canCreate" @click="create()"><FilePlus2 :size="14"/>{{$t('新建文件')}}</button><button role="menuitem" :disabled="!canCreate" @click="create(true)"><FolderPlus :size="14"/>{{$t('新建文件夹')}}</button><button role="menuitem" :disabled="!canCreate||!templates.length" :aria-expanded="templatesOpen" aria-haspopup="menu" @click="toggleTemplates"><FilePlus2 :size="14"/><span>{{$t('从模板创建')}}</span><ChevronRight :size="12"/></button></div></Teleport>
<Teleport defer to=".app-shell"><div v-if="templatesOpen" ref="templateMenu" class="workspace-template-menu new-item-menu file-heading-template-menu" role="menu" :aria-label="$t('从模板创建')" :style="templatePosition"><button v-for="item in templates" :key="item.id" role="menuitem" :disabled="!canCreate" @click="create(false,item)"><span>{{renderTemplate(item.name,'未命名文件.md',date)}}</span></button></div></Teleport>
</template>
<style scoped>.file-heading-menu-trigger{display:flex;align-items:center;gap:5px;padding:0;min-width:0;max-width:100%;color:var(--ink);font-size:13px;font-weight:600;white-space:nowrap}.file-heading-menu{border-color:var(--line-strong)}.file-heading-template-menu{width:190px;border-color:var(--line-strong)}.file-heading-menu-trigger:focus-visible{outline:2px solid var(--accent);outline-offset:2px}</style>

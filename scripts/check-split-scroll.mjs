import { build } from 'esbuild'
import { readFileSync } from 'node:fs'
const source=readFileSync('src/EditorWorkspace.vue','utf8')
const handlers=[...source.matchAll(/@user-scroll="([^"]+)"/g)].map(match=>match[1])
const result=await build({stdin:{resolveDir:process.cwd()+'/src',loader:'ts',contents:`
import {ref} from 'vue';import {useSplitScroll} from './editor/useSplitScroll'
const source={scrollHeight:2000,clientHeight:500,scrollTop:0},preview={scrollHeight:3500,clientHeight:500,scrollTop:0}
globalThis.document={querySelector:s=>s.startsWith('.editor-pane')?source:preview}
const {claimUserScroll,scrollSyncGate,syncScroll,onPreviewEditorScroll}=useSplitScroll({mode:ref('split')})
function sourceGesture(){${handlers[0]}}
function previewGesture(){${handlers[1]}}
previewGesture();preview.scrollTop=1200;onPreviewEditorScroll(preview)
if(source.scrollTop!==600)throw Error('Right scrolling did not synchronize left: '+source.scrollTop)
syncScroll('source',source);if(preview.scrollTop!==1200)throw Error('Synthetic event caused feedback')
sourceGesture();source.scrollTop=900;syncScroll('source',source)
if(preview.scrollTop!==1800)throw Error('Left scrolling did not synchronize right')
console.log('PASS actual editor gesture bindings synchronize both directions without feedback')
`},bundle:true,platform:'node',format:'esm',write:false})
await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'))

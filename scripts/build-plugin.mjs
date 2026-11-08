import {build} from 'esbuild'
import {existsSync,readFileSync} from 'node:fs'
import {resolve,join} from 'node:path'
const directory=resolve(process.argv[2]||'examples/plugins/ui-extensions')
const source=join(directory,existsSync(join(directory,'main.ts'))?'main.ts':'source.js')
if(!existsSync(source))throw new Error('插件需要 main.ts 或 source.js 开发入口')
const manifest=JSON.parse(readFileSync(join(directory,'manifest.json'),'utf8'))
if(manifest.apiVersion!==2)throw new Error('插件需要 apiVersion: 2')
const output=join(directory,'main.js')
await build({entryPoints:[source],outfile:output,bundle:true,format:'esm',platform:'neutral',target:'es2022',sourcemap:'inline'})
// 打包产物保留属性访问的原始名称，因此可以据此比对清单声明；漏声明在运行时会被宿主拒绝，这里提前提示。
const rules=[
  [/secrets\.(?:get|set|remove)\s*\(/,'secrets'],
  [/network\.request\s*\(/,'network'],
  [/clipboard\.readText\s*\(/,'clipboard.read'],
  [/clipboard\.writeText\s*\(/,'clipboard.write'],
  [/\bindex\.(?:files|changes|content|metadata|links|tagged|subscribe)\s*\(/,'index.read'],
  [/files\.(?:list|get|view|open|readText|readBytes|readFrontmatter|watch)\s*\(/,'files.read'],
  [/files\.(?:writeText|writeBytes|create|mkdir|move|rename|trash|updateFrontmatter)\s*\(/,'files.write'],
  [/editor\.(?:applyEdits|transaction|setSelection|setCursor)\s*\(/,'editor.write'],
  [/editor\.(?:getSnapshot|getSelection|getCursor|getMode|onChange|extensions)/,'editor.read'],
]
const bundle=readFileSync(output,'utf8')
const declaration=manifest.permissions||{}
const declared=new Set([...(declaration.required||[]),...(declaration.optional||[])])
const missing=rules.filter(([pattern])=>pattern.test(bundle)).map(([,permission])=>permission).filter(permission=>!declared.has(permission))
if(missing.length)console.warn(`权限清单缺少：${[...new Set(missing)].join('、')}。未声明的能力在运行时会被拒绝，请补充 manifest.json 的 permissions 后重新构建。`)
console.log(output)

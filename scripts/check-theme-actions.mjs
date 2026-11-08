import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
const controller = readFileSync('src/workspace/useWorkspaceController.ts','utf8')
let calls = 0
const addTheme = () => { calls++ }
const scope = new Proxy({}, { has:()=>true, get:(_,key)=>key===Symbol.unscopables?undefined:key==='addTheme'?addTheme:{} })
for (const name of ['preferencesContext','workspaceUiContext']) {
  const start=controller.indexOf(`const ${name} = {`)
  const literal=controller.slice(controller.indexOf('{',start),controller.indexOf('\n}',start)+2)
  const context=Function('scope',`with(scope){return (${literal})}`)(scope)
  assert.equal(typeof context.addTheme,'function',`${name}.addTheme is undefined; theme button cannot open picker`)
  context.addTheme()
}
assert.equal(calls,2)
console.log('PASS theme action reaches preferences and all shared menu regions')

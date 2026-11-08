import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
test('main and secondary windows have native dragging permission',()=>{
 const capability=JSON.parse(readFileSync('src-tauri/capabilities/default.json','utf8'))
 assert.ok(capability.windows.includes('main'))
 assert.ok(capability.windows.includes('markart-*'))
 assert.ok(capability.permissions.includes('core:window:allow-start-dragging'))
})

import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
const result = await build({ stdin: { contents: "export * from './plugins/settingControls'", resolveDir: process.cwd() + '/src', loader: 'ts' }, bundle: true, platform: 'node', format: 'esm', write: false })
const { validateSettingControl, validateSettingValue, updateSettingValue } = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`)
const base = { id:'test',title:'Test',category:'editor',getValue:()=>'',onChange(){} }
test('text lengths, numeric bounds and steps, option identity and boolean values are validated', async () => {
 assert.throws(() => validateSettingValue({...base,type:'text',maxLength:2},'abc'))
 assert.throws(() => validateSettingValue({...base,type:'number',min:1,max:10},NaN))
 assert.throws(() => validateSettingValue({...base,type:'number',min:1,max:10},11))
 assert.throws(() => validateSettingValue({...base,type:'number',min:1,step:2},2))
 validateSettingValue({...base,type:'number',min:0,step:0.1},0.3)
 assert.throws(() => validateSettingValue({...base,type:'toggle'},'true'))
 const select = {...base,type:'select',options:[{value:1,label:'One'},{value:'1',label:'String one'}]}
 validateSettingControl(select); validateSettingValue(select,1); validateSettingValue(select,'1')
 assert.throws(() => validateSettingValue(select,2))
 assert.throws(() => validateSettingControl({...select,options:[{value:1,label:'One'},{value:1,label:'Duplicate'}]}))
 let calls=0
 await assert.rejects(updateSettingValue({...base,type:'number',min:0,onChange(){calls++}},-1))
 assert.equal(calls,0)
 await assert.rejects(updateSettingValue({...base,type:'toggle',onChange:async()=>{throw new Error('not saved')}},true),/not saved/)
})

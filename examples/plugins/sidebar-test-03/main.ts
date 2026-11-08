import type { PluginAPI } from '../../../src/plugins/sdk/index'
let api: PluginAPI
let item: Awaited<ReturnType<PluginAPI['ui']['sidebar']['open']>>
let count = 0
export async function activate(host: PluginAPI) {
  api = host
  await api.ui.sidebar.register({
    id: 'panel', title: 'sidebar-test-03',
    stateVersion: 1,
    setState(state) { count = Number((state as {count?:number})?.count || 0) },
    getState() { return {count} },
    render: context => ({ tag: 'div', attrs: {class: 'example-panel'}, children: [
      {tag: 'p', text: '计数 ' + count},
      {tag: 'button', text: '增加', on: {click: async () => {count++;const current=await api.ui.sidebar.getItem(context.itemId);await current?.setState({count})}}}
    ] })
  })
  await api.commands.register({id:'open',title:'打开 sidebar-test-03',run:async()=>{item=await api.ui.sidebar.open('panel')}})
  await api.ui.registerAction({id:'open',commandId:'open',location:'topbar-menu',icon:'puzzle'})
}
export function deactivate() {}

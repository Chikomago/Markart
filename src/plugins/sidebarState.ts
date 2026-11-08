import { reactive } from 'vue'

const key = 'markart-plugin-sidebar-v1'
export class PluginSidebarState {
  state = reactive({ open: false, width: 280, selected: [] as string[] })
  constructor(private storage?: Pick<Storage, 'getItem' | 'setItem'>) {
    try {
      const value = JSON.parse(storage?.getItem(key) || '{}')
      this.state.open = value.open === true
      if (typeof value.width === 'number' && Number.isFinite(value.width)) this.state.width = Math.max(220, Math.min(560, Math.round(value.width)))
      if (Array.isArray(value.selected)) this.state.selected = [...new Set(value.selected.filter((id: unknown): id is string => typeof id === 'string'))] as string[]
    } catch { /* Start with an empty sidebar if saved preferences are invalid. */ }
  }
  private save() { try { this.storage?.setItem(key, JSON.stringify(this.state)) } catch { /* Keep the current session usable when storage is unavailable. */ } }
  setOpen(open: boolean) { this.state.open = open; this.save() }
  setWidth(width: number) {
    if (!Number.isFinite(width)) return
    this.state.width = Math.max(220, Math.min(560, Math.round(width))); this.save()
  }
  toggle() { this.setOpen(!this.state.open) }
  add(ids: string[], before?: string) {
    const added = [...new Set(ids)].filter(id => !this.state.selected.includes(id))
    const selected = [...this.state.selected], index = before ? selected.indexOf(before) : -1
    selected.splice(index < 0 ? selected.length : index, 0, ...added)
    this.state.selected = selected; this.save()
  }
  move(id: string, before?: string) {
    if (!this.state.selected.includes(id) || id === before) return
    const selected = this.state.selected.filter(value => value !== id), index = before ? selected.indexOf(before) : -1
    selected.splice(index < 0 ? selected.length : index, 0, id)
    this.state.selected = selected; this.save()
  }
  remove(id: string) { this.state.selected = this.state.selected.filter(value => value !== id); this.save() }
}
export const pluginSidebar = new PluginSidebarState(typeof localStorage === 'undefined' ? undefined : localStorage)

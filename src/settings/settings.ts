import { localeOptions, type Language } from '../i18n'
import { DEFAULT_THEME } from './defaults'
import { isValidShortcutOverrides, type ShortcutOverrides } from './shortcuts'

export const SETTINGS_KEY = 'markart-settings-v5'
const PREVIOUS_KEY = 'markart-settings-v4'
export const SETTINGS_VERSION = 5

export const settingRegistry = {
  quickCaptureEnabled: { category: 'quickCapture', default: false as boolean, valid: isBoolean },
  menuBarIconVisible: { category: 'startup', default: false as boolean, valid: isBoolean },
  quickCaptureCorner: { category: 'quickCapture', default: 'top-right' as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right', valid: (value: unknown) => ['top-left', 'top-right', 'bottom-left', 'bottom-right'].includes(value as string) },
  fileActionsAlwaysVisible: { category: 'appearance', default: true as boolean, valid: isBoolean },
  language: { category: 'startup', default: 'system' as Language, valid: (value: unknown) => localeOptions.some(option => option.value === value) },
  themeName: { category: 'appearance', default: DEFAULT_THEME as string, valid: (value: unknown) => typeof value === 'string' && value.length > 0 && value.length <= 80 },
  customThemes: { category: 'appearance', default: [] as { name: string; css: string; custom: true }[], valid: (value: unknown) => Array.isArray(value) && value.length <= 100 && value.every(theme => theme && typeof theme.name === 'string' && theme.name.length <= 80 && typeof theme.css === 'string' && theme.css.length <= 100000) },
  uiFontFamily: { category: 'appearance', default: 'system-ui' as string, valid: (value: unknown) => typeof value === 'string' && value.length > 0 && value.length <= 120 },
  fontSize: { category: 'editor', default: 17 as number, valid: numberBetween(13, 24) },
  editorFontFamily: { category: 'editor', default: 'system-ui' as string, valid: (value: unknown) => typeof value === 'string' && value.length > 0 && value.length <= 120 },
  editorAlignment: { category: 'editor', default: 'left' as 'left' | 'center', valid: (value: unknown) => value === 'left' || value === 'center' },
  tableWidth: { category: 'editor', default: 'content' as 'content' | 'full', valid: (value: unknown) => value === 'content' || value === 'full' },
  paragraphSpacing: { category: 'editor', default: 12 as number, valid: numberBetween(0, 48) },
  lineHeight: { category: 'editor', default: 1.85 as number, valid: numberBetween(1.3, 2.4) },
  indent: { category: 'editor', default: 0 as number, valid: numberBetween(0, 3) },
  attachmentDirectory: { category: 'editor', default: 'assets' as string, valid: (value: unknown) => typeof value === 'string' && value.length > 0 && value.length <= 120 && !value.startsWith('/') && !value.split('/').some(part => !part || part === '.' || part === '..') },
  clipboardDirectory: { category: 'storage', default: 'assets/clipboard' as string, valid: relativeDirectory },
  attachmentNaming: { category: 'storage', default: 'pasted-image-{date}-{time}' as string, valid: (value: unknown) => typeof value === 'string' && value.length > 0 && value.length <= 120 && /^[\w\-{}\u4e00-\u9fff]+$/.test(value) },
  startupBehavior: { category: 'startup', default: 'blank' as 'restore' | 'blank', valid: (value: unknown) => value === 'restore' || value === 'blank' },
  autoCheckUpdates: { category: 'startup', default: true as boolean, valid: isBoolean },
  templates: { category: 'workflow', default: [] as { id: string; name: string; content: string }[], valid: isPersonalItems },
  snippets: { category: 'workflow', default: [] as { id: string; name: string; content: string }[], valid: isPersonalItems },
  shortcutOverrides: { category: 'workflow', default: {} as ShortcutOverrides, valid: isValidShortcutOverrides },
  spellcheckEnabled: { category: 'editor', default: true as boolean, valid: isBoolean },
  exportFontFamily: { category: 'export', default: '-apple-system' as string, valid: (value: unknown) => typeof value === 'string' && value.length > 0 && value.length <= 120 },
  exportPageSize: { category: 'export', default: 'A4' as 'A4' | 'Letter' | 'custom', valid: (value: unknown) => ['A4', 'Letter', 'custom'].includes(value as string) },
  exportPageWidth: { category: 'export', default: 210 as number, valid: numberBetween(0, 1000) },
  exportPageHeight: { category: 'export', default: 297 as number, valid: numberBetween(0, 1000) },
  exportMarginPreset: { category: 'export', default: 'normal' as 'normal' | 'narrow' | 'wide' | 'custom', valid: (value: unknown) => ['normal', 'narrow', 'wide', 'custom'].includes(value as string) },
  exportMargin: { category: 'export', default: 18 as number, valid: numberBetween(0, 100) },
  gitEnabled: { category: 'storage', default: false as boolean, valid: isBoolean },
  gitMaxVersions: { category: 'storage', default: 20 as number, valid: numberBetween(1, 200) },
  gitRetentionDays: { category: 'storage', default: 0 as number, valid: numberBetween(0, 3650) },
  syncConflictPolicy: { category: 'sync', default: 'merge' as 'merge' | 'remote', valid: (value: unknown) => value === 'merge' || value === 'remote' },
  webdavEnabled: { category: 'sync', default: false as boolean, valid: isBoolean },
  webdavSyncIntervalSeconds: { category: 'sync', default: 30 as number, valid: numberBetween(10, 3600) },
  webdavRetryOnFailure: { category: 'sync', default: false as boolean, valid: isBoolean },
  webdavUrl: { category: 'sync', default: '' as string, valid: (value: unknown) => typeof value === 'string' && value.length <= 1000 },
  webdavUsername: { category: 'sync', default: '' as string, valid: (value: unknown) => typeof value === 'string' && value.length <= 200 },
  githubEnabled: { category: 'sync', default: false as boolean, valid: isBoolean },
  githubSyncIntervalSeconds: { category: 'sync', default: 60 as number, valid: numberBetween(10, 3600) },
  githubRetryOnFailure: { category: 'sync', default: false as boolean, valid: isBoolean },
  githubUrl: { category: 'sync', default: '' as string, valid: (value: unknown) => typeof value === 'string' && value.length <= 500 },
  githubUsername: { category: 'sync', default: '' as string, valid: (value: unknown) => typeof value === 'string' && value.length <= 100 },
  zoom: { category: 'appearance', default: 100 as number, valid: numberBetween(75, 150) },
  outlineRatio: { category: 'layout', default: 0.34 as number, valid: numberBetween(0.1, 0.85) },
  sidebarWidth: { category: 'layout', default: 258 as number, valid: numberBetween(190, 420) },
  previewWidth: { category: 'layout', default: 480 as number, valid: numberBetween(220, 2400) },
  previewWidthCustomized: { category: 'layout', default: false as boolean, valid: isBoolean },
  sidebarOpen: { category: 'layout', default: true as boolean, valid: isBoolean },
  outlineOpen: { category: 'layout', default: true as boolean, valid: isBoolean },
  sidebarLayout: { category: 'layout', default: 'stack' as 'stack' | 'tabs', valid: (value: unknown) => value === 'stack' || value === 'tabs' },
  focusMode: { category: 'editor', default: false as boolean, valid: isBoolean },
  typewriter: { category: 'editor', default: false as boolean, valid: isBoolean },
  toolbarEnabled: { category: 'layout', default: true as boolean, valid: isBoolean },
  wrapLines: { category: 'editor', default: true as boolean, valid: isBoolean },
  externalFileChanges: { category: 'editor', default: 'auto' as 'auto' | 'confirm', valid: (value: unknown) => value === 'auto' || value === 'confirm' },
  diagramVisualEditing: { category: 'editor', default: true as boolean, valid: isBoolean },
  bodyLineNumbers: { category: 'editor', default: false as boolean, valid: isBoolean },
  codeBlockLineNumbers: { category: 'editor', default: false as boolean, valid: isBoolean },
  sidebarTop: { category: 'topbar', default: ['sidebar', 'settings', 'files'] as string[], valid: isCommandList },
  editorTop: { category: 'topbar', default: ['mode', 'reference', 'commands', 'theme', 'export', 'focus'] as string[], valid: isCommandList }
} as const

export type SettingKey = keyof typeof settingRegistry
type Values = Partial<Record<SettingKey, unknown>>
type Document = { version: number; global: Values }

function numberBetween(min: number, max: number) { return (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max }
function isBoolean(value: unknown) { return typeof value === 'boolean' }
function relativeDirectory(value: unknown) { return typeof value === 'string' && value.length > 0 && value.length <= 120 && !value.startsWith('/') && !value.split('/').some(part => !part || part === '.' || part === '..') }
function isCommandList(value: unknown) { return Array.isArray(value) && value.length <= 64 && value.every(id => typeof id === 'string' && /^[a-z][a-z0-9-]*$/.test(id)) && new Set(value).size === value.length }
function isPersonalItems(value: unknown) { return Array.isArray(value) && value.length <= 100 && value.every(item => item && typeof item.id === 'string' && /^[a-z0-9-]{1,64}$/.test(item.id) && typeof item.name === 'string' && item.name.trim().length > 0 && item.name.length <= 80 && typeof item.content === 'string' && item.content.length <= 200000) && new Set(value.map(item => item.id)).size === value.length }
function object(value: unknown): Record<string, unknown> { return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {} }
function valid(key: SettingKey, value: unknown): boolean { return (settingRegistry[key].valid as (value: unknown) => boolean)(value) }
function cleanValues(input: unknown): Values {
  const source = object(input)
  const values: Values = {}
  for (const key of Object.keys(settingRegistry) as SettingKey[]) if (key in source && valid(key, source[key])) values[key] = source[key]
  return values
}

export class SettingsStore {
  private document: Document = { version: SETTINGS_VERSION, global: {} }
  readonly recovered: boolean

  constructor(private storage: Pick<Storage, 'getItem' | 'setItem'>, legacy: unknown = {}) {
    let raw: string | null = null
    let previous: string | null = null
    try { raw = storage.getItem(SETTINGS_KEY); if (!raw) previous = storage.getItem(PREVIOUS_KEY) || storage.getItem('markart-settings-v1') } catch { /* use defaults */ }
    let invalid = false
    if (raw) {
      try {
        const parsed = object(JSON.parse(raw))
        if (parsed.version !== SETTINGS_VERSION) throw new Error('Unsupported settings version')
        this.document.global = cleanValues(parsed.global)
        invalid = JSON.stringify(this.document) !== JSON.stringify(parsed)
      } catch { invalid = true }
    } else if (previous) {
      try { this.document.global = cleanValues(object(JSON.parse(previous)).global) }
      catch { invalid = true }
      this.save()
    } else {
      this.document.global = cleanValues(legacy)
      const oldSidebar = object(legacy).sidebar
      if (isBoolean(oldSidebar)) this.document.global.sidebarOpen = oldSidebar
      this.save()
    }
    if (invalid) {
      try { storage.setItem(`${SETTINGS_KEY}-recovery`, raw || previous || '') } catch { /* storage may be full */ }
      this.save()
    }
    this.recovered = invalid
  }

  get<K extends SettingKey>(key: K): (typeof settingRegistry)[K]['default'] {
    return (this.document.global[key] ?? settingRegistry[key].default) as (typeof settingRegistry)[K]['default']
  }
  set(key: SettingKey, value: unknown): boolean { return this.setMany({ [key]: value }) }
  setMany(values: Values): boolean {
    if (Object.entries(values).some(([key, value]) => !(key in settingRegistry) || !valid(key as SettingKey, value))) return false
    const previous = JSON.stringify(this.document)
    Object.assign(this.document.global, values)
    if (this.save()) return true
    this.document = JSON.parse(previous) as Document
    return false
  }
  resetAll(): void { const previous = this.document; this.document = { version: SETTINGS_VERSION, global: {} }; if (!this.save()) this.document = previous }
  exportSnapshot(): string { return JSON.stringify(this.document) }
  canRestoreSnapshot(snapshot: string): boolean {
    let parsed: Record<string, unknown>
    try { parsed = object(JSON.parse(snapshot)) } catch { return false }
    if (parsed.version !== SETTINGS_VERSION || !parsed.global || typeof parsed.global !== 'object' || Array.isArray(parsed.global)) return false
    const supplied = object(parsed.global)
    return !Object.entries(supplied).some(([key, value]) => !(key in settingRegistry) || !valid(key as SettingKey, value))
  }
  restoreSnapshot(snapshot: string): boolean {
    if (!this.canRestoreSnapshot(snapshot)) return false
    const parsed = object(JSON.parse(snapshot))
    const supplied = object(parsed.global)
    const previous = this.document
    this.document = { version: SETTINGS_VERSION, global: cleanValues(supplied) }
    if (this.save()) return true
    this.document = previous
    return false
  }
  private save(): boolean { try { this.storage.setItem(SETTINGS_KEY, JSON.stringify(this.document)); return true } catch { return false } }
}

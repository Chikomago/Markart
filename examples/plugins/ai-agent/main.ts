import { migrateKey } from './secrets'
import type { CommandContext, PluginAPI } from '../../../src/plugins/sdk/index'

type Provider = 'openai' | 'claude' | 'ollama'
type Config = { provider: Provider; endpoint: string; apiKey: string; model: string }

const DEFAULT_ENDPOINT: Record<Provider, string> = {
  openai: 'https://api.openai.com/v1',
  claude: 'https://api.anthropic.com/v1',
  ollama: 'http://127.0.0.1:11434',
}
const DEFAULT_MODEL: Record<Provider, string> = {
  openai: 'gpt-4o-mini',
  claude: 'claude-sonnet-4-5',
  ollama: 'qwen2.5:7b',
}
const PROVIDER_LABEL: Record<Provider, string> = { openai: 'OpenAI', claude: 'Claude', ollama: 'Ollama' }

let api: PluginAPI
let config: Config = { provider: 'openai', endpoint: '', apiKey: '', model: '' }
let dialog: { close(): Promise<void> | void } | null = null
let maxContext = 24000
let instructions = ''
async function persist() { const { apiKey: _secret, ...safe } = config; await api.storage.set('config', safe) }
async function open(_context: CommandContext) {
  await dialog?.close()
  dialog = await api.ui.openWebView({ title: 'AI 助手', entry: 'views/index.html', width: 860, height: 560, transparent: true, persistent: true, shadow: 'soft' })
}

export async function activate(host: PluginAPI) {
  api = host
  const saved = (await api.storage.get<Partial<Config>>('config')) || {}
  const apiKey = await migrateKey(api, saved)
  config = {
    provider: (['openai', 'claude', 'ollama'] as const).includes(saved.provider as Provider) ? (saved.provider as Provider) : 'openai',
    endpoint: typeof saved.endpoint === 'string' ? saved.endpoint : '',
    apiKey,
    model: typeof saved.model === 'string' ? saved.model : '',
  }
  maxContext = Number(await api.storage.get<number>('maxContext')) || 24000
  instructions = (await api.storage.get<string>('instructions')) || ''
  await api.settings.registerCategory({ id: 'ai', title: 'AI 配置' })
  await api.settings.registerControl({
    id: 'provider', category: 'ai', title: '服务商', type: 'segmented',
    description: 'OpenAI 与 Claude 走官方接口，Ollama 走本机 11434 端口',
    options: [{ value: 'openai', label: 'OpenAI' }, { value: 'claude', label: 'Claude' }, { value: 'ollama', label: 'Ollama' }],
    getValue: () => config.provider,
    onChange: value => { config.provider = value as Provider; return persist() },
  })
  await api.settings.registerControl({
    id: 'apiKey', category: 'ai', title: 'API Key', type: 'password',
    description: 'OpenAI 与 Claude 必填，Ollama 空',
    getValue: () => config.apiKey,
    onChange: async value => { const key = String(value).trim(); if(key) { await api.secrets.set('api-key',key); if(await api.secrets.get('api-key')!==key)throw new Error('密钥保存未完成'); } else await api.secrets.remove('api-key'); config.apiKey=key; await persist() },
  })
  await api.settings.registerControl({
    id: 'model', category: 'ai', title: '模型', type: 'text',
    description: `留空使用默认：${DEFAULT_MODEL.openai} / ${DEFAULT_MODEL.claude} / ${DEFAULT_MODEL.ollama}`,
    getValue: () => config.model,
    onChange: value => { config.model = String(value); return persist() },
  })
  await api.settings.registerControl({
    id: 'endpoint', category: 'ai', title: '接口地址', type: 'text',
    description: `留空使用默认 ${DEFAULT_ENDPOINT[config.provider]}；可填写任意 http/https 接口地址（非本机地址须 https）`,
    getValue: () => config.endpoint || DEFAULT_ENDPOINT[config.provider],
    onChange: value => {
      const next = String(value).trim()
      config.endpoint = Object.values(DEFAULT_ENDPOINT).includes(next) ? '' : next
      return persist()
    },
  })
  await api.settings.registerControl({ id: 'maxContext', category: 'ai', title: '上下文字符上限', type: 'number', min: 1000, max: 200000, step: 1000, getValue: () => maxContext, onChange: value => { maxContext = Math.min(200000, Math.max(1000, Number(value) || 24000)); return api.storage.set('maxContext', maxContext) } })
  await api.settings.registerControl({ id: 'instructions', category: 'ai', title: '自定义指令', type: 'textarea', description: '用于调整回复语言与写作风格', getValue: () => instructions, onChange: value => { instructions = String(value); return api.storage.set('instructions', instructions) } })
  await api.commands.register({
    id: 'ask', title: 'AI 助手：提问', shortcut: 'Mod+Shift+A', icon: 'format-document',
    run: context => open(context),
  })
  await api.ui.registerAction({ id: 'menu', commandId: 'ask', location: 'topbar-menu', icon: 'format-document' })
}

export function deactivate() { dialog = null }

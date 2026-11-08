import type { PluginAPI } from '../../../src/plugins/sdk/index'
export async function migrateKey(api: PluginAPI, saved: Record<string, unknown>) {
  const old = typeof saved.apiKey === 'string' ? saved.apiKey : ''
  if (old) {
    await api.secrets.set('api-key', old)
    if (await api.secrets.get('api-key') !== old) throw new Error('密钥迁移未完成，原配置已保留')
  }
  if (Object.prototype.hasOwnProperty.call(saved, 'apiKey')) {
    const { apiKey: _removed, ...safe } = saved
    await api.storage.set('config', safe as any)
  }
  return old || await api.secrets.get('api-key') || ''
}

import { invoke, isTauri } from '@tauri-apps/api/core'
import { parsePluginManifest, type PluginManifest } from './manifest'
export type CommunityPlugin = { id: string; name: string; description: string; repo: string; author?: string }
export type PluginSource = { directoryUrl?: string; author?: string }
export type DownloadedPlugin = PluginSource & { key: string; manifest: PluginManifest; repo: string; releaseUrl?: string; main: string; styles?: string; resources?: Record<string, number[]>; downloadedAt: string }
/** Packages are identified by their catalog, not by manifest id alone: the same id may come from two catalogs. */
export function pluginKey(value: { manifest: { id: string }; directoryUrl?: string }): string {
  return `${value.directoryUrl || 'local'}::${value.manifest.id}`
}
export function repository(value: string): string {
  const repo = value.trim().replace(/^https:\/\/github\.com\//, '').replace(/\/$/, '').replace(/\.git$/, '')
  if (!/^[\w-]+\/[\w.-]+$/.test(repo) || repo.includes('..')) throw new Error('请填写 GitHub 仓库，例如 author/markart-plugin')
  return repo
}
export function publicGithubUrl(value: string): string {
  const url = new URL(value)
  if (url.protocol !== 'https:' || !['raw.githubusercontent.com', 'github.com'].includes(url.hostname) || url.username || url.password || url.port) throw new Error('请使用 GitHub 上的公开 HTTPS 地址')
  return url.href
}
export async function remoteText(url: string, optional = false): Promise<string | null> {
  publicGithubUrl(url)
  if (isTauri()) return invoke<string | null>('plugin_fetch_text', { url, optional })
  const response = await fetch(url, { credentials: 'omit', referrerPolicy: 'no-referrer' })
  if (optional && response.status === 404) return null
  if (!response.ok) throw new Error(`下载失败：HTTP ${response.status}`)
  const text = await response.text(); if (new TextEncoder().encode(text).length > 5 * 1024 * 1024) throw new Error('插件文件超过 5 MB')
  return text
}
export function parseCommunityDirectory(value: unknown): CommunityPlugin[] {
  if (!Array.isArray(value)) throw new Error('社区目录必须是 JSON 数组')
  const ids = new Set<string>()
  return value.map(item => {
    if (!item || typeof item.id !== 'string' || typeof item.name !== 'string' || typeof item.description !== 'string') throw new Error('社区目录格式无效')
    // Use the same identity validation as downloaded manifests.
    parsePluginManifest({ apiVersion: 2, id: item.id, name: item.name, version: '0.0.0' })
    if (ids.has(item.id)) throw new Error(`同一目录内存在重复插件 ID：${item.id}`); ids.add(item.id)
    return { id: item.id, name: item.name, description: item.description, repo: repository(item.repo), author: typeof item.author === 'string' ? item.author : undefined }
  })
}
export async function releaseManifest(repo: string): Promise<PluginManifest> {
  return parsePluginManifest(JSON.parse((await remoteText(`https://github.com/${repository(repo)}/releases/latest/download/manifest.json`))!))
}
export async function downloadPlugin(repo: string, expectedId?: string, source: PluginSource = {}): Promise<DownloadedPlugin> {
  repo = repository(repo)
  const latest = await releaseManifest(repo)
  if (expectedId && latest.id !== expectedId) throw new Error('插件 ID 与社区目录不一致')
  const base = `https://github.com/${repo}/releases/download/${encodeURIComponent(latest.version)}`
  const manifest = parsePluginManifest(JSON.parse((await remoteText(`${base}/manifest.json`))!))
  if (manifest.id !== latest.id || manifest.version !== latest.version) throw new Error('发布版本与插件清单不一致')
  const main = await remoteText(`${base}/main.js`)
  if (!main?.trim()) throw new Error('插件缺少 main.js')
  const styles = await remoteText(`${base}/styles.css`, true)
  const directoryUrl = source.directoryUrl ? publicGithubUrl(source.directoryUrl) : undefined
  const pkg: Omit<DownloadedPlugin, 'key'> = { manifest, repo, releaseUrl: base, directoryUrl, author: source.author, main, styles: styles ?? undefined, downloadedAt: new Date().toISOString() }
  return { ...pkg, key: pluginKey(pkg) }
}
// Update from the repository saved with this package, never from the active catalog.
export async function checkPluginUpdate(plugin: DownloadedPlugin): Promise<PluginManifest | null> {
  const latest = await releaseManifest(plugin.repo)
  if (latest.id !== plugin.manifest.id) throw new Error('更新来源中的插件 ID 与已安装插件不一致')
  return latest.version !== plugin.manifest.version ? latest : null
}
// Packages are stored separately from lightweight settings. Nothing evaluates these assets.
const database = 'markart-plugins-v1'
const storeName = 'packages-v2'
// v2 keys packages by catalog + id, so two catalogs can ship the same plugin id without overwriting each other.
async function store(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(database, 2)
    request.onupgradeneeded = () => {
      const db = request.result, transaction = request.transaction!
      const next = db.objectStoreNames.contains(storeName) ? transaction.objectStore(storeName) : db.createObjectStore(storeName, { keyPath: 'key' })
      if (!db.objectStoreNames.contains('packages')) return
      const legacy = transaction.objectStore('packages')
      legacy.getAll().onsuccess = event => {
        for (const record of (event.target as IDBRequest<DownloadedPlugin[]>).result || []) next.put({ ...record, key: pluginKey(record) })
        db.deleteObjectStore('packages')
      }
    }
    request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error)
  })
}
async function transaction<T>(mode: IDBTransactionMode, action: (object: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await store()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode), request = action(tx.objectStore(storeName))
    tx.oncomplete = () => { db.close(); resolve(request.result) }
    tx.onabort = tx.onerror = () => { db.close(); reject(tx.error || request.error) }
  })
}
export const savedPlugins = async () => (await transaction('readonly', object => object.getAll()) as DownloadedPlugin[]).map(item => ({ ...item, key: item.key || pluginKey(item) }))
export const savePlugin = (plugin: DownloadedPlugin) => transaction('readwrite', object => object.put({ ...plugin, key: pluginKey(plugin) }))
export const removePlugin = (key: string) => transaction('readwrite', object => object.delete(key))

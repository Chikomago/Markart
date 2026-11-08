import { resourcePath } from './webview/content'
import { invoke, isTauri } from '@tauri-apps/api/core'
import { parsePluginManifest } from './manifest'
import { pluginKey, type DownloadedPlugin } from './community'

type LocalPluginFiles = { manifest: string; main: string; styles?: string | null; resources?: Record<string, number[]> }
export function parseLocalPlugin(files: LocalPluginFiles): DownloadedPlugin {
  let total = 0
  for (const [path, bytes] of Object.entries(files.resources || {})) {
    resourcePath(path)
    if (!path.startsWith('views/') || !Array.isArray(bytes) || bytes.some(byte => !Number.isInteger(byte) || byte < 0 || byte > 255)) throw new Error('界面资源格式无效')
    total += bytes.length
    if (total > 20 * 1024 * 1024 || Object.keys(files.resources || {}).length > 1000) throw new Error('界面资源超过 20 MB 或 1000 个文件')
  }
  const manifest = parsePluginManifest(JSON.parse(files.manifest))
  if (!files.main.trim()) throw new Error('插件缺少 main.js 内容')
  for (const value of [files.manifest, files.main, files.styles || '']) {
    if (new TextEncoder().encode(value).length > 5 * 1024 * 1024) throw new Error('插件文件超过 5 MB')
  }
  const pkg: Omit<DownloadedPlugin, 'key'> = { manifest, repo: '', resources: files.resources, main: files.main, styles: files.styles ?? undefined, downloadedAt: new Date().toISOString() }
  return { ...pkg, key: pluginKey(pkg) }
}
export async function importLocalPlugin(): Promise<DownloadedPlugin | null> {
  if (isTauri()) {
    const files = await invoke<LocalPluginFiles | null>('plugin_import_local')
    return files ? parseLocalPlugin(files) : null
  }
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'; input.setAttribute('webkitdirectory', '')
    input.oncancel = () => resolve(null)
    input.onchange = async () => {
      try {
        const files = Array.from(input.files || [])
        const root = files[0]?.webkitRelativePath.split('/')[0]
        const read = async (name: string, optional = false) => {
          const file = files.find(item => item.webkitRelativePath === `${root}/${name}`)
          if (!file) { if (optional) return undefined; throw new Error(`插件缺少 ${name}`) }
          if (file.size > 5 * 1024 * 1024) throw new Error('插件文件超过 5 MB')
          return new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer())
        }
        if (!files.length) { resolve(null); return }
        const resources: Record<string,number[]> = {}; let total = 0
        for (const file of files.filter(file => file.webkitRelativePath.startsWith(`${root}/views/`))) { total += file.size; if (total > 20 * 1024 * 1024) throw new Error('界面资源总大小超过 20 MB'); resources[file.webkitRelativePath.slice(root!.length + 1)] = Array.from(new Uint8Array(await file.arrayBuffer())) }
        resolve(parseLocalPlugin({ resources, manifest: (await read('manifest.json'))!, main: (await read('main.js'))!, styles: await read('styles.css', true) }))
      } catch (error) { reject(error) }
    }
    input.click()
  })
}

import { parseCommunityDirectory, remoteText, type CommunityPlugin } from './community'
export const pluginDirectoryKey = 'markart-plugin-directory-v1'
export const defaultPluginDirectory = import.meta.env.VITE_COMMUNITY_PLUGIN_DIRECTORY || ''
export async function fetchPluginCatalog(url: string): Promise<CommunityPlugin[]> {
  if (!url.trim()) throw new Error('请先填写插件目录地址（JSON）')
  return parseCommunityDirectory(JSON.parse((await remoteText(url.trim()))!))
}

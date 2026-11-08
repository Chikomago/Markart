import { PluginError } from '../sdk/protocol'
import type { PluginHost } from './types'

// Directory access follows host state, never a path supplied only by a plugin.
export function hasWorkspaceRoot(host: PluginHost, root: string) {
  return typeof root === 'string' && !!root &&
    (root === host.workspace.root() || host.documents.list().some(file => file.root === root))
}
export function requireWorkspaceRoot(host: PluginHost, root: string) {
  if (!hasWorkspaceRoot(host, root))
    throw new PluginError('permission-denied', '请先在 Markart 中打开此文件夹或其中的文件')
}

import type { DownloadedPlugin } from '../community'
import { pluginGrants, type Permission, type PermissionDeclaration } from './grants'
import { PluginError } from '../sdk/protocol'

export const permissionLabels: Record<Permission,string> = {
  'secrets':'存取本插件的系统凭据',
  'editor.read':'读取编辑器内容','editor.write':'修改编辑器内容',
  'files.read':'读取目录中的文本文件','files.write':'修改目录中的文本文件',
  'attachments.read':'读取附件','attachments.write':'修改附件',
  'index.read':'查询文件索引','network':'访问网络',
  'clipboard.read':'读取剪贴板','clipboard.write':'写入剪贴板','background':'运行后台任务',
}

export function initializePluginPermissions(pkg: DownloadedPlugin, signal?: AbortSignal) {
  if (signal?.aborted) throw new PluginError('cancelled','插件已停用')
  const declaration=pkg.manifest.permissions
  pluginGrants.approve(pkg.manifest.id,declaration,declaration.optional)
}

/** Turns a recorded denial key into display copy. */
export function describeDenial(key: string): { label: string; origin: string } {
  const origin = key.startsWith('network:') ? key.slice('network:'.length) : ''
  const permission = (origin ? 'network' : key) as Permission
  return { label: permissionLabels[permission] ?? key, origin }
}

/** Capabilities an update adds. Shrinking a declaration is always allowed; growing one needs the user's consent. */
export function addedPermissions(before: PermissionDeclaration, after: PermissionDeclaration): { permissions: Permission[] } {
  const declared = new Set<Permission>([...before.required, ...before.optional])
  return {
    permissions: [...new Set<Permission>([...after.required, ...after.optional])].filter(permission => !declared.has(permission)),
  }
}

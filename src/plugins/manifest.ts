import { permissionNames, type PermissionDeclaration, type Permission } from './permissions/grants'
/** Package metadata. Installation alone does not execute code; enabling does. */
export interface PluginManifest {
  apiVersion: 2
  minAppVersion?: string
  permissions: PermissionDeclaration
  id: string
  name: string
  version: string
  description?: string
}
export type { PluginAPI, MarkartPlugin } from './sdk/index'
export function parsePluginManifest(value: unknown): PluginManifest {
  if (!value || typeof value !== 'object') throw new Error('插件清单必须是 JSON 对象')
  const item = value as Record<string, unknown>
  if (item.apiVersion !== 2 || typeof item.id !== 'string' || !/^[a-z0-9]+(?:[.-][a-z0-9]+)+$/.test(item.id)
    || typeof item.name !== 'string' || !item.name.trim() || typeof item.version !== 'string' || !/^\d+\.\d+\.\d+(?:[-+][\w.-]+)?$/.test(item.version)) throw new Error('插件清单格式无效，请检查 apiVersion、id、name 和 version')
  const declared = item.permissions as Partial<PermissionDeclaration> | undefined
  const parsePermissions = (value: unknown): Permission[] => {
    if (value === undefined) return []
    if (!Array.isArray(value) || value.some(entry => !permissionNames.includes(entry as Permission))) throw new Error('插件权限声明无效')
    return [...new Set(value)] as Permission[]
  }
  const permissions: PermissionDeclaration={required:parsePermissions(declared?.required),optional:parsePermissions(declared?.optional)}
  if(item.minAppVersion !== undefined && (typeof item.minAppVersion !== 'string'||!/^\d+\.\d+\.\d+$/.test(item.minAppVersion)))throw new Error('插件最低应用版本无效')
  return { apiVersion: 2, id: item.id, name: item.name, version: item.version, description: typeof item.description === 'string' ? item.description : undefined, minAppVersion: item.minAppVersion as string|undefined, permissions }
}

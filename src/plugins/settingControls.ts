import type { PluginSetting } from './host/types'
export function validateSettingControl(setting: PluginSetting) {
  const type = setting.type || 'custom'
  if (type === 'custom') { if (!('mount' in setting) || typeof setting.mount !== 'function') throw new Error('自定义设置项需要 mount 函数'); return }
  if (setting.type === 'button') { if (!setting.buttonText?.trim() || typeof setting.onClick !== 'function') throw new Error('按钮设置项需要按钮文字和 onClick 函数'); return }
  if (!['text', 'password', 'textarea', 'number', 'select', 'segmented', 'toggle'].includes(type) || !('getValue' in setting) || typeof setting.getValue !== 'function' || typeof setting.onChange !== 'function') throw new Error('设置项类型或取值、变更函数无效')
  if (setting.type === 'select' || setting.type === 'segmented') {
    if (!Array.isArray(setting.options) || !setting.options.length || setting.options.some(option => !option || !['string', 'number'].includes(typeof option.value) || typeof option.value === 'number' && !Number.isFinite(option.value) || typeof option.label !== 'string') || new Set(setting.options.map(option => option.value)).size !== setting.options.length) throw new Error('设置项选项不能为空，且选项值不能重复')
  }
  if (setting.type === 'number') {
    if ([setting.min, setting.max, setting.step].some(value => value !== undefined && !Number.isFinite(value)) || setting.min !== undefined && setting.max !== undefined && setting.min > setting.max || setting.step !== undefined && setting.step <= 0) throw new Error('数字设置项的范围或步长无效')
  }
  if ('maxLength' in setting && setting.maxLength !== undefined && (!Number.isInteger(setting.maxLength) || setting.maxLength < 0)) throw new Error('文本长度上限应为非负整数')
  if ('rows' in setting && setting.rows !== undefined && (!Number.isInteger(setting.rows) || setting.rows < 1)) throw new Error('文本框行数应为正整数')
}
export function validateSettingValue(setting: PluginSetting, value: unknown) {
  switch (setting.type) {
    case 'text': case 'password': case 'textarea':
      if (typeof value !== 'string' || setting.maxLength !== undefined && value.length > setting.maxLength) throw new Error('设置值应为文本，且不能超过长度上限')
      break
    case 'number':
      if (typeof value !== 'number' || !Number.isFinite(value) || setting.min !== undefined && value < setting.min || setting.max !== undefined && value > setting.max) throw new Error('请输入范围内的数字')
      if (setting.step !== undefined) { const steps = (value - (setting.min ?? 0)) / setting.step; if (Math.abs(steps - Math.round(steps)) > 1e-7) throw new Error('数字不符合设置步长') }
      break
    case 'toggle': if (typeof value !== 'boolean') throw new Error('开关设置值应为布尔值'); break
    case 'select': case 'segmented': if (!setting.options.some(option => option.value === value)) throw new Error('设置值不在可选列表中'); break
  }
}
export async function updateSettingValue(setting: PluginSetting, value: unknown) {
  validateSettingValue(setting, value)
  switch (setting.type) {
    case 'text': case 'password': case 'textarea': return setting.onChange(value as string)
    case 'number': return setting.onChange(value as number)
    case 'toggle': return setting.onChange(value as boolean)
    case 'select': case 'segmented': return setting.onChange(value as string | number)
  }
}

import { t } from '../i18n'
export type PersonalItem = { id: string; name: string; content: string }

export const templateVariables = [
  { key: 'title', get label() { return t('文件标题') } },
  { key: 'filename', get label() { return t('文件名') } },
  { key: 'date', get label() { return t('当前日期') } },
  { key: 'time', get label() { return t('当前时间') } },
  { key: 'datetime', get label() { return t('日期与时间') } },
  { key: 'year', get label() { return t('年份') } },
  { key: 'month', get label() { return t('月份') } },
  { key: 'day', get label() { return t('日期') } },
  { key: 'weekday', get label() { return t('星期') } },
  { key: 'timestamp', get label() { return t('Unix 时间戳') } },
  { key: 'uuid', get label() { return t('随机 UUID') } }
] as const

export function renderTemplate(content: string, filename: string, now = new Date()): string {
  const title = filename.replace(/\.(?:md|markdown|mdown|mkd)$/i, '')
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const values: Record<string, string> = { title, filename, date, time, datetime: `${date} ${time}`, year: String(now.getFullYear()), month: String(now.getMonth() + 1).padStart(2, '0'), day: String(now.getDate()).padStart(2, '0'), weekday: ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'][now.getDay()], timestamp: String(Math.floor(now.getTime() / 1000)), uuid: crypto.randomUUID() }
  return content.replace(/\{\{(title|filename|date|time|datetime|year|month|day|weekday|timestamp|uuid)\}\}/g, (_, key: string) => values[key])
}

export function templateFilename(name: string, now = new Date()): string {
  const resolved = renderTemplate(name, '未命名文件.md', now).trim()
    .replace(/[\x00-\x1f<>:"/\\|?*]/g, '-').replace(/[. ]+$/, '') || '未命名文件'
  return /\.(?:md|markdown|mdown|mkd)$/i.test(resolved) ? resolved : `${resolved}.md`
}

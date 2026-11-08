import { ref, type App } from 'vue'
import zhTW from './locales/zh-TW.json'
import { sourceCopy } from './sourceCopy'
import en from './locales/en.json'
import ja from './locales/ja.json'
import ko from './locales/ko.json'
import de from './locales/de.json'
import fr from './locales/fr.json'
import es from './locales/es.json'
import pt from './locales/pt.json'
import ru from './locales/ru.json'

export const localeOptions = [
  { value: 'system', label: '跟随系统' },
  { value: 'zh-CN', label: '简体中文' }, { value: 'zh-TW', label: '繁體中文' },
  { value: 'en', label: 'English' }, { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' }, { value: 'de', label: 'Deutsch' },
  { value: 'fr', label: 'Français' }, { value: 'es', label: 'Español' },
  { value: 'pt', label: 'Português' }, { value: 'ru', label: 'Русский' },
] as const
export type Locale = Exclude<typeof localeOptions[number]['value'], 'system'>
export type Language = Locale | 'system'
const messages: Record<string, Record<string, string>> = { 'zh-TW': zhTW, en, ja, ko, de, fr, es, pt, ru }
export const activeLocale = ref<Locale>('zh-CN')
export function resolveLocale(preference: Language, languages: readonly string[] = []): Locale {
  if (preference !== 'system') return preference
  for (const language of languages) {
    const code = language.toLowerCase().replaceAll('_', '-')
    if (code === 'zh' || code.startsWith('zh-')) {
      if (code.split('-').includes('hans')) return 'zh-CN'
      return /(?:tw|hk|mo|hant)/.test(code) ? 'zh-TW' : 'zh-CN'
    }
    const base = code.split('-')[0]
    if (base in messages) return base as Locale
  }
  return 'en'
}
export function setLanguage(preference: Language, languages = typeof navigator === 'undefined' ? [] : navigator.languages) {
  activeLocale.value = resolveLocale(preference, languages)
  if (typeof document !== 'undefined') { document.documentElement.lang = activeLocale.value; document.title = t('Markart · Markdown 写作空间') }
}
/** Translate application copy only. Never pass document text or user-defined names. */
export function t(source: string, parameters?: Record<string, unknown>): string {
  const locale = activeLocale.value
  const translated = locale === 'zh-CN' ? sourceCopy[source] ?? source : messages[locale]?.[source] ?? messages.en[source] ?? source
  return parameters ? translated.replace(/\{(\w+)\}/g, (match, key) => key in parameters ? String(parameters[key]) : match) : translated
}
export function localeMessages(): Record<string, string> {
  if (activeLocale.value === 'zh-CN') return Object.fromEntries(Object.keys(en).map(key => [key, sourceCopy[key] ?? key]))
  return { ...en, ...messages[activeLocale.value] }
}
export function installI18n(app: App) { app.config.globalProperties.$t = t }
declare module 'vue' { interface ComponentCustomProperties { $t: typeof t } }

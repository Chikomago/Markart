import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { build } from 'esbuild'
const result = await build({ entryPoints: ['src/i18n/index.ts'], bundle: true, platform: 'node', format: 'esm', write: false })
const { resolveLocale, setLanguage, t, localeOptions, activeLocale, localeMessages } = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`)

test('language matching recognizes regional variants and falls back to English', () => {
  for (const tag of ['zh-TW', 'zh-HK', 'zh-Hant', 'zh_MO']) assert.equal(resolveLocale('system', [tag]), 'zh-TW')
  for (const tag of ['zh-CN', 'zh-SG', 'zh-Hans', 'zh-Hans-HK']) assert.equal(resolveLocale('system', [tag]), 'zh-CN')
  assert.equal(resolveLocale('system', ['it-IT', 'ja-JP']), 'ja')
  assert.equal(resolveLocale('system', ['pt-BR']), 'pt')
  assert.equal(resolveLocale('system', ['unknown']), 'en')
  assert.equal(resolveLocale('fr', ['en-US']), 'fr')
  assert.equal(localeOptions.length, 11)
})

test('switching language translates application copy and preserves interpolation values', () => {
  setLanguage('en')
  assert.equal(t('偏好设置'), 'Preferences')
  assert.equal(t('节点：{0}', { 0: '保存 / English 日本語' }), 'Node: 保存 / English 日本語')
  assert.equal(t('这是用户正文，不是界面文案'), '这是用户正文，不是界面文案')
  setLanguage('ja')
  assert.equal(t('偏好设置'), '設定')
  setLanguage('zh-TW')
  assert.equal(t('偏好设置'), '偏好設定')
  setLanguage('zh-CN')
  assert.equal(activeLocale.value, 'zh-CN')
  assert.equal(t('偏好设置'), '偏好设置')
})

test('all locale catalogs have identical keys and preserve parameter names', () => {
  const directory = 'src/i18n/locales'
  const english = JSON.parse(readFileSync(`${directory}/en.json`, 'utf8'))
  const keys = Object.keys(english).sort()
  const parameters = text => [...new Set(text.match(/\{\w+\}/g) || [])].sort()
  for (const filename of readdirSync(directory)) {
    const catalog = JSON.parse(readFileSync(`${directory}/${filename}`, 'utf8'))
    assert.deepEqual(Object.keys(catalog).sort(), keys, filename)
    for (const key of keys) {
      assert.ok(catalog[key].trim(), `${filename}: ${key}`)
      assert.deepEqual(parameters(catalog[key]), parameters(key), `${filename}: ${key}`)
    }
  }
})

test('tab copy changes in UI and native menu messages without renaming translation keys', () => {
  setLanguage('zh-CN')
  assert.equal(t('标签视图'), '标签页')
  assert.equal(t('切换标签视图'), '切换标签页')
  assert.equal(t('标签视图菜单不可用：{0}', { 0: 'error' }), '标签页菜单不可用：error')
  assert.equal(localeMessages()['切换标签视图'], '切换标签页')
  setLanguage('en')
  assert.equal(t('标签视图'), 'Tabs')
  setLanguage('zh-TW')
  assert.equal(t('标签视图'), '分頁')
  setLanguage('zh-CN')
})

import { t } from '../i18n'
import { nextTick, ref, type Ref } from 'vue'
import type CodeEditor from '../CodeEditor.vue'
import { checkWithDictionaries, listSpellDictionaries, removeSpellDictionary, saveSpellDictionary, type SpellDictionaryMeta } from './spellDictionaries'

export function useSpellcheck({ spellcheckEnabled, activeId, content, editor, notify }: {
  spellcheckEnabled: Readonly<Ref<boolean>>
  activeId: Ref<string>
  content: Readonly<Ref<string>>
  editor: Ref<InstanceType<typeof CodeEditor> | null>
  notify: (message: string) => void
}) {
const spellDictionaries = ref<SpellDictionaryMeta[]>([])
const dictionaryFiles = ref<HTMLInputElement | null>(null)
const dictionaryRawDic = ref('')
const dictionaryRawAff = ref('')
const dictionaryBusy = ref(false)
async function refreshSpellDictionaries() { spellDictionaries.value = await listSpellDictionaries() }
async function importSpellDictionary(event: Event) {
  const input = event.target as HTMLInputElement
  const files = [...(input.files || [])]
  input.value = ''
  const dic = files.find(file => file.name.toLowerCase().endsWith('.dic'))
  const aff = files.find(file => file.name.toLowerCase().endsWith('.aff'))
  if (!dic || !aff || dic.name.replace(/\.dic$/i, '') !== aff.name.replace(/\.aff$/i, '')) return notify(t('请选择文件名相同的 .dic 和 .aff 文件'))
  dictionaryBusy.value = true
  try { await saveSpellDictionary(dic.name.replace(/\.dic$/i, ''), await aff.text(), await dic.text(), 'local'); await refreshSpellDictionaries() }
  catch (error) { notify(t('词典添加失败：{0}', { "0": String(error) })) }
  finally { dictionaryBusy.value = false }
}
async function downloadSpellDictionary() {
  if (!/^https:\/\//i.test(dictionaryRawDic.value) || !/^https:\/\//i.test(dictionaryRawAff.value)) return notify(t('请填写可直接下载文件的 HTTPS 地址'))
  dictionaryBusy.value = true
  try {
    const [dicResponse, affResponse] = await Promise.all([fetch(dictionaryRawDic.value), fetch(dictionaryRawAff.value)])
    if (!dicResponse.ok || !affResponse.ok) throw new Error('下载地址不可用')
    const [dic, aff] = await Promise.all([dicResponse.text(), affResponse.text()])
    const name = new URL(dictionaryRawDic.value).pathname.split('/').pop()?.replace(/\.dic$/i, '') || '下载词典'
    await saveSpellDictionary(name, aff, dic, 'raw'); dictionaryRawDic.value = ''; dictionaryRawAff.value = ''; await refreshSpellDictionaries()
  } catch (error) { notify(t('词典下载失败：{0}', { "0": String(error) })) }
  finally { dictionaryBusy.value = false }
}
async function deleteSpellDictionary(id: string) { await removeSpellDictionary(id); await refreshSpellDictionaries() }
type Misspelling = { word: string; offset: number; length: number; suggestions: string[] }
const spellResults = ref<Misspelling[]>([])
const spellDocId = ref('')
const spellSource = ref('')
const showSpellcheck = ref(false)
async function checkSpelling() {
  if (!spellcheckEnabled.value) return notify(t('请在设置中启用拼写检查'))
  const documentId = activeId.value
  const source = content.value
  try {
    const results = await checkWithDictionaries(source)
    if (activeId.value !== documentId) return
    spellResults.value = results
    spellDocId.value = documentId
    spellSource.value = source
    showSpellcheck.value = true
  } catch (error) { notify(t('拼写检查失败：{0}', { "0": String(error) })) }
}
function locateMisspelling(result: Misspelling) {
  if (spellDocId.value !== activeId.value || spellSource.value !== content.value) return notify(t('文件已修改，请重新检查拼写'))
  showSpellcheck.value = false
  void nextTick(() => editor.value?.selectRange(result.offset, result.length))
}

  return { spellDictionaries, dictionaryFiles, dictionaryRawDic, dictionaryRawAff,
    dictionaryBusy, refreshSpellDictionaries, importSpellDictionary, downloadSpellDictionary,
    deleteSpellDictionary, spellResults, showSpellcheck, checkSpelling, locateMisspelling }
}

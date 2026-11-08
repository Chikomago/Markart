import nspell from 'nspell'

export type SpellDictionaryMeta = { id: string; name: string; source: 'local' | 'raw'; added: number }
type SpellDictionary = SpellDictionaryMeta & { aff: string; dic: string }
export type DictionaryMisspelling = { word: string; offset: number; length: number; suggestions: string[] }
const databaseName = 'markart-spell-dictionaries-v1'
const storeName = 'dictionaries'

function database(): Promise<IDBDatabase> {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(storeName, { keyPath: 'id' })
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}
async function all(): Promise<SpellDictionary[]> {
  const db = await database()
  return new Promise<SpellDictionary[]>((resolve, reject) => {
    const request = db.transaction(storeName, 'readonly').objectStore(storeName).getAll()
    request.onsuccess = () => resolve(request.result as SpellDictionary[])
    request.onerror = () => reject(request.error)
  }).finally(() => db.close())
}
export async function listSpellDictionaries(): Promise<SpellDictionaryMeta[]> {
  return (await all()).map(({ id, name, source, added }) => ({ id, name, source, added }))
}
export async function saveSpellDictionary(name: string, aff: string, dic: string, source: 'local' | 'raw'): Promise<void> {
  if (!name.trim() || !aff.trim() || !/^\s*\d+\s*\r?\n/.test(dic)) throw new Error('词典文件内容无效')
  if (aff.length + dic.length > 30_000_000) throw new Error('词典超过 30 MB 限制')
  nspell(aff, dic)
  const db = await database()
  await new Promise<void>((resolve, reject) => {
    const request = db.transaction(storeName, 'readwrite').objectStore(storeName).put({ id: crypto.randomUUID(), name: name.trim().slice(0, 80), aff, dic, source, added: Date.now() } satisfies SpellDictionary)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  }).finally(() => db.close())
}
export async function removeSpellDictionary(id: string): Promise<void> {
  const db = await database()
  await new Promise<void>((resolve, reject) => {
    const request = db.transaction(storeName, 'readwrite').objectStore(storeName).delete(id)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  }).finally(() => db.close())
}
export async function checkWithDictionaries(content: string): Promise<DictionaryMisspelling[]> {
  const dictionaries = await all()
  if (!dictionaries.length) throw new Error('请在拼写检查设置中添加同名的 .dic 和 .aff 文件')
  const checkers = dictionaries.map(dictionary => nspell(dictionary.aff, dictionary.dic))
  const results: DictionaryMisspelling[] = []
  for (const match of content.matchAll(/[\p{L}][\p{L}'’-]*/gu)) {
    const word = match[0]
    const offset = match.index ?? 0
    if (word.length < 2 || checkers.some(checker => checker.correct(word))) continue
    const suggestions = [...new Set(checkers.flatMap(checker => checker.suggest(word).slice(0, 3)))].slice(0, 3)
    results.push({ word, offset, length: word.length, suggestions })
    if (results.length >= 300) break
  }
  return results
}

import { build } from 'esbuild'
import assert from 'node:assert/strict'
const { outputFiles } = await build({ entryPoints: ['src/plugins/community.ts'], bundle: true, platform: 'node', format: 'esm', write: false })
const api = await import('data:text/javascript;base64,' + Buffer.from(outputFiles[0].text).toString('base64'))
globalThis.window = {}
const manifest = { apiVersion: 2, id: 'example.notes', name: 'Notes', version: '1.0.0' }
const original = globalThis.fetch
let requested = []
globalThis.fetch = async url => {
  requested.push(url)
  if (url.endsWith('styles.css')) return new Response('', { status: 404 })
  if (url.endsWith('manifest.json')) return new Response(JSON.stringify(manifest))
  if (url.endsWith('main.js')) return new Response('throw new Error("must never execute")')
  return new Response('', { status: 500 })
}
try {
  const list = api.parseCommunityDirectory([{ id: manifest.id, name: 'Notes', description: 'Test', repo: 'author/notes' }])
  assert.equal(list[0].repo, 'author/notes')
  assert.throws(() => api.parseCommunityDirectory([list[0], list[0]]), /重复/)
  for (const repo of ['../../escape', 'https://evil.test/a/b', 'author/notes/main']) assert.throws(() => api.repository(repo))
  assert.throws(() => api.publicGithubUrl('http://github.com/a/b'))
  const pkg = await api.downloadPlugin('https://github.com/author/notes', manifest.id)
  assert.equal(pkg.manifest.id, manifest.id); assert.equal(pkg.styles, undefined)
  assert.ok(pkg.main.includes('must never execute'))
  assert.ok(requested.some(url => url.includes('/releases/download/1.0.0/main.js')))
  await assert.rejects(api.downloadPlugin('author/notes', 'another.plugin'), /不一致/)
  globalThis.fetch = async () => new Response('', { status: 500 })
  await assert.rejects(api.downloadPlugin('author/notes'), /HTTP 500/)
  const versions = { alpha: '1.0.0', beta: '1.0.0' }
  const directoryA = 'https://raw.githubusercontent.com/catalog/one/main/plugins.json'
  const directoryB = 'https://raw.githubusercontent.com/catalog/two/main/list.json'
  requested = []
  globalThis.fetch = async url => {
    requested.push(url)
    const name = url.includes('/author/alpha/') ? 'alpha' : url.includes('/other/beta/') ? 'beta' : null
    if (!name) throw Error('Unexpected source: ' + url)
    if (url.endsWith('manifest.json')) return new Response(JSON.stringify({ ...manifest, id: `example.${name}`, version: versions[name] }))
    if (url.endsWith('main.js')) return new Response('export function activate() {}')
    return new Response('', { status: 404 })
  }
  const a = await api.downloadPlugin('author/alpha', 'example.alpha', { directoryUrl: directoryA, author: 'Alpha' })
  const b = await api.downloadPlugin('other/beta', 'example.beta', { directoryUrl: directoryB, author: 'Beta' })
  assert.equal(a.directoryUrl, directoryA); assert.equal(b.directoryUrl, directoryB)
  assert.equal(a.releaseUrl, 'https://github.com/author/alpha/releases/download/1.0.0')
  assert.equal(a.author, 'Alpha')
  versions.alpha = '2.0.0'
  requested = []
  assert.equal((await api.checkPluginUpdate(a)).version, '2.0.0')
  assert.equal(await api.checkPluginUpdate(b), null)
  assert.ok(requested[0].includes('/author/alpha/')); assert.ok(requested[1].includes('/other/beta/'))
  assert.ok(!requested.includes(directoryA) && !requested.includes(directoryB), 'update depends on a mutable catalog')
  const updated = await api.downloadPlugin(a.repo, a.manifest.id, { directoryUrl: a.directoryUrl, author: a.author })
  assert.equal(updated.directoryUrl, directoryA); assert.equal(updated.manifest.version, '2.0.0')
  await assert.rejects(api.checkPluginUpdate({ ...b, manifest: { ...b.manifest, id: 'wrong.plugin' } }), /不一致/)
  const legacy = { ...a }; delete legacy.directoryUrl; delete legacy.releaseUrl
  assert.equal((await api.checkPluginUpdate(legacy)).version, '2.0.0')
  console.log('PASS directory validation, release downloads, two independent install sources, per-plugin updates, source retention, legacy packages, ID mismatch, HTTP failure')
} finally { globalThis.fetch = original }

import { build } from 'esbuild'
import assert from 'node:assert/strict'
const result = await build({ entryPoints: ['src/editor/documentSearch.ts'], bundle: true, platform: 'node', format: 'esm', write: false })
const { documentMatches } = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`)
const defaults = { caseSensitive: false, regexp: false, wildcard: false, ignoreSpaces: false, ignorePunctuation: false, distinguishWidth: false }
const find = (source, query, options = {}, replace = '') => documentMatches(source, query, replace, { ...defaults, ...options })
assert.equal(find('Cat cat', 'cat').length, 2)
assert.equal(find('Cat cat', 'cat', { caseSensitive: true }).length, 1)
assert.deepEqual(find('x你 好，世界y', '你好世界', { ignoreSpaces: true, ignorePunctuation: true }), [{ from: 1, to: 7, replacement: '' }])
assert.equal(find('ＡＢＣ abc', 'abc').length, 2)
assert.equal(find('ＡＢＣ abc', 'abc', { distinguishWidth: true }).length, 1)
assert.equal(find('cat42 dog', 'cat??', { wildcard: true })[0].to, 5)
assert.equal(find('one dog', 'o*', { wildcard: true })[0].to, 7)
assert.equal(find('a 42!', '(\\d+)', { regexp: true }, '[$1]')[0].replacement, '[42]')
assert.throws(() => find('text', '[', { regexp: true }))
assert.equal(find('text', ' ', { ignoreSpaces: true }).length, 0)
console.log('PASS advanced search matching, original offsets, width, wildcards, regex capture replacement')

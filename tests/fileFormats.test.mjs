import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'

const bundle = await build({ entryPoints: ['src/files/fileFormats.ts'], bundle: true, platform: 'node', format: 'esm', write: false })
const { fileKind, formatLabel } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`)

test('code and YAML files open as plain text while only DOCX and PDF convert', () => {
  for (const extension of ['txt', 'css', 'js', 'ts', 'html', 'py', 'yaml', 'yml', 'rs', 'json']) assert.equal(fileKind(`folder/FILE.${extension.toUpperCase()}`), 'text')
  for (const extension of ['md', 'markdown', 'mdown', 'mkd']) assert.equal(fileKind(`note.${extension}`), 'markdown')
  for (const extension of ['docx', 'pdf']) assert.equal(fileKind(`note.${extension}`), 'convertible')
  for (const extension of ['xyz', 'pptx', 'xlsx', 'rtf', 'csv']) assert.equal(fileKind(`note.${extension}`), 'text')
  assert.equal(formatLabel('text'), '纯文本')
  assert.equal(formatLabel('text', 'example.xyz'), 'unknown')
  assert.equal(fileKind('.gitignore'), 'text')
})

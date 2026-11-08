import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import ts from 'typescript'

const source = readFileSync(new URL('../src/sync/githubRepoList.ts', import.meta.url), 'utf8')
const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
const { mergeGithubRepos } = await import(`data:text/javascript;base64,${Buffer.from(output).toString('base64')}`)

const created = { name: 'new-notes', fullName: 'owner/new-notes', url: 'https://github.com/owner/new-notes.git' }

test('refresh preserves a newly created repository omitted by a restricted token', () => {
  assert.deepEqual(mergeGithubRepos([], [created]), { repos: [created], missing: [created] })
})

test('refresh deduplicates a newly created repository once the token can list it', () => {
  assert.deepEqual(mergeGithubRepos([created], [created]), { repos: [created], missing: [] })
})

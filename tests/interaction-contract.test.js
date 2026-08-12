import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const appSource = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')
const websiteSource = readFileSync(new URL('../src/WebsiteStudio.jsx', import.meta.url), 'utf8')

test('shared GEO pages use route-specific keys so filters and forms never leak between modules', () => {
  const resourcePages = [...appSource.matchAll(/<ResourcePage key="([^"]+)" type="([^"]+)"/g)]
  const modulePages = [...appSource.matchAll(/<ModulePage key="([^"]+)" module="([^"]+)"/g)]

  assert.equal(resourcePages.length, 4)
  assert.equal(modulePages.length, 17)
  assert.ok([...resourcePages, ...modulePages].every(([, key, module]) => key === module))
  assert.equal(new Set([...resourcePages, ...modulePages].map(([, key]) => key)).size, 21)
})

test('public contact action declares an explicit submit contract', () => {
  assert.match(websiteSource, /<button type="submit">提交留言/)
  assert.doesNotMatch(websiteSource, /<button>提交留言/)
})

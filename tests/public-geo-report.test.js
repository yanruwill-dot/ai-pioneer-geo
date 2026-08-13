import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  filterPublicGeoRows,
  paginatePublicGeoRows,
  publicGeoPlatforms,
  publicGeoRows,
} from '../src/publicGeoReportData.js'

test('public GEO report contains the eleven target AI platforms', () => {
  assert.equal(publicGeoPlatforms.length, 11)
  assert.equal(new Set(publicGeoPlatforms.map((row) => row.name)).size, 11)
  assert.equal(publicGeoPlatforms.find((row) => row.name === '抖音AI')?.value, 225492)
})

test('public GEO report filters and paginates deterministic table rows', () => {
  const doubao = filterPublicGeoRows(publicGeoRows, { platform: '豆包', query: '学校' })
  assert.ok(doubao.length > 0)
  assert.ok(doubao.every((row) => row.platform === '豆包' && row.keyword.includes('学校')))
  assert.ok(doubao.every((row) => row.platformUrl === 'https://www.doubao.com/chat/'))
  assert.ok(publicGeoRows.every((row) => row.platformUrl === 'https://www.doubao.com/chat/'))
  assert.ok(publicGeoRows.every((row) => row.snapshotUrl === 'https://geo.zxaigc.com/snapshot-voucher?id=1000000109341681&keyword_type=0&sign=YvDyOw'))
  assert.equal(publicGeoRows.length, 50)
  const paged = paginatePublicGeoRows(publicGeoRows, 5, 10)
  assert.equal(paged.page, 5)
  assert.equal(paged.totalPages, 5)
  assert.equal(paged.rows.length, 10)
  assert.equal(paged.rows.at(0)?.id, 41)
})

test('public report route is reachable before authentication and uses AI先行者 branding', async () => {
  const [app, page] = await Promise.all([
    readFile(new URL('../src/App.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/PublicGeoDashboardPage.jsx', import.meta.url), 'utf8'),
  ])
  assert.match(app, /location === '\/geo-dashboard\/index-1\/YvDyOw' \|\| location === '\/geo'/)
  assert.ok(app.indexOf("location === '/geo-dashboard/index-1/YvDyOw'") < app.indexOf('if (loading)'))
  assert.match(page, /AI先行者/)
  assert.match(page, /href=\{row\.platformUrl\}/)
  assert.match(page, /href=\{row\.snapshotUrl\}/)
  assert.doesNotMatch(page, /target="_blank"/)
  assert.doesNotMatch(page, /暂无原会话/)
  assert.doesNotMatch(page, /摘星/)
})

import test from 'node:test'
import assert from 'node:assert/strict'
import {
  CRM_ROUTE_META,
  caseCockpitRoute,
  crmTitleFor,
  findCaseBySlug,
  filterCases,
  filterOrders,
  filterTransactions,
  seedCases,
  seedOrders,
  seedTransactions,
  summarizeFinance,
} from '../src/crmData.js'
import { safeHttpUrl, snapshotFingerprint, snapshotRoute } from '../src/evidence.js'

test('CRM exposes five unique business routes and matching titles', () => {
  const routes = Object.keys(CRM_ROUTE_META)
  assert.deepEqual(routes, ['/crm/overview', '/crm/customers', '/crm/orders', '/crm/finance', '/crm/cases'])
  assert.equal(new Set(routes).size, 5)
  assert.equal(crmTitleFor('/crm/finance'), '财务流水')
  assert.equal(crmTitleFor('/crm/unknown'), '合作商业务管理')
})

test('order filters combine query and status deterministically', () => {
  assert.deepEqual(filterOrders(seedOrders, 'ORD-202608-006').map((row) => row.brand), ['向海咨询'])
  assert.deepEqual(filterOrders(seedOrders, '', '已完成').map((row) => row.id), ['ORD-202607-028'])
  assert.equal(filterOrders(seedOrders, '澄明', '服务中').length, 1)
})

test('finance summaries and filters use explicit ledger status', () => {
  assert.deepEqual(summarizeFinance(seedTransactions), { received: 175800, paid: 21200, pending: 6800 })
  assert.equal(filterTransactions(seedTransactions, 'ORD-202608-012').at(0)?.id, 'FIN-260805-018')
  assert.ok(filterTransactions(seedTransactions, '', '支出').every((row) => row.direction === '支出'))
})

test('case filter returns only the selected industry', () => {
  assert.deepEqual(filterCases(seedCases, '教育培训').map((row) => row.brand), ['澄明课堂'])
  assert.equal(filterCases(seedCases).length, seedCases.length)
})

test('case library combines region, product, industry and status filters', () => {
  assert.deepEqual(filterCases(seedCases, { region: '杭州市', query: '企业 GEO' }).map((row) => row.brand), ['智焰 AI'])
  assert.deepEqual(filterCases(seedCases, { industry: '智能制造', enabled: '已启用' }).map((row) => row.brand), ['云帆智造'])
  assert.equal(filterCases(seedCases, { query: '不存在的产品词' }).length, 0)
  assert.equal(filterCases([{ ...seedCases[0], enabled: false }], { enabled: '已停用' }).length, 1)
})

test('every GEO case has a unique, directly addressable cockpit route', () => {
  const routes = seedCases.map((row) => caseCockpitRoute(row.slug))
  assert.equal(new Set(routes).size, seedCases.length)
  assert.ok(routes.every((route) => route.startsWith('/geo-dashboard/index-1/')))
  assert.equal(findCaseBySlug('zhiyan-ai')?.brand, '智焰 AI')
  assert.equal(findCaseBySlug('missing-case'), null)
  assert.equal(caseCockpitRoute('missing-case'), '/crm/cases')
})

test('snapshot routes and consistency codes are stable and field-sensitive', () => {
  const row = { id: 7, customer_id: 1, platform: '千问', keyword: '企业 GEO 怎么做', rank: 2, mentioned: 1, cited: 1, sentiment: '正向', device: 'PC', observed_at: '2026-08-05 09:00:00' }
  assert.equal(snapshotRoute(7, 1), '/geo/evidence/1/7')
  assert.equal(snapshotRoute(7), '/geo/report')
  assert.equal(snapshotRoute(7, 'bad'), '/geo/report')
  assert.equal(snapshotRoute('bad'), '/geo/report')
  assert.equal(snapshotFingerprint(row), snapshotFingerprint({ ...row }))
  assert.notEqual(snapshotFingerprint(row), snapshotFingerprint({ ...row, device: '移动端' }))
  assert.equal(safeHttpUrl('https://www.doubao.com/chat/1'), 'https://www.doubao.com/chat/1')
  assert.equal(safeHttpUrl('javascript:alert(1)'), '')
})

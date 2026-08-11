import test, { beforeEach } from 'node:test'
import assert from 'node:assert/strict'

const storage = new Map()
globalThis.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: (key) => storage.delete(key),
}
globalThis.location = { origin: 'http://localhost' }

const { demoApi } = await import('../src/demoApi.js')

beforeEach(() => storage.clear())

test('Pages demo keeps customer resources, metrics, modules and settings isolated', async () => {
  const customer2Keyword = '客户二隔离关键词'
  await demoApi('/keywords', {
    method: 'POST',
    body: JSON.stringify({ customerId: 2, word: customer2Keyword, category: '问题词', searchVolume: 1 }),
  })
  await demoApi('/observations', {
    method: 'POST',
    body: JSON.stringify({ customerId: 2, platform: '客户二平台', keyword: customer2Keyword, mentioned: 1, cited: 1, rank: 1, observedAt: '2026-08-08 09:00:00' }),
  })
  await demoApi('/module-items', {
    method: 'POST',
    body: JSON.stringify({ customerId: 2, module: 'targets', title: '客户二品牌', itemType: '品牌名称', status: '已生效' }),
  })
  await demoApi('/module-settings/agent', {
    method: 'PUT',
    body: JSON.stringify({ customerId: 2, data: { name: '客户二智能体' } }),
  })

  const [customer1Keywords, customer2Keywords, customer1Observations, customer2Observations, customer1Dashboard, customer2Dashboard, customer1Targets, customer2Targets, customer1Settings, customer2Settings] = await Promise.all([
    demoApi('/keywords?customerId=1'),
    demoApi('/keywords?customerId=2'),
    demoApi('/observations?customerId=1'),
    demoApi('/observations?customerId=2'),
    demoApi('/dashboard?customerId=1'),
    demoApi('/dashboard?customerId=2'),
    demoApi('/module-items?customerId=1&module=targets'),
    demoApi('/module-items?customerId=2&module=targets'),
    demoApi('/module-settings/agent?customerId=1'),
    demoApi('/module-settings/agent?customerId=2'),
  ])

  assert.equal(customer1Keywords.some((row) => row.word === customer2Keyword), false)
  assert.equal(customer2Keywords.some((row) => row.word === customer2Keyword), true)
  assert.equal(customer1Observations.some((row) => row.platform === '客户二平台'), false)
  assert.equal(customer2Observations.some((row) => row.platform === '客户二平台'), true)
  assert.equal(customer1Dashboard.platformStats.some((row) => row.platform === '客户二平台'), false)
  assert.equal(customer2Dashboard.platformStats.some((row) => row.platform === '客户二平台'), true)
  assert.equal(customer1Targets.some((row) => row.title === '客户二品牌'), false)
  assert.equal(customer2Targets.some((row) => row.title === '客户二品牌'), true)
  assert.notEqual(customer1Settings.data.name, '客户二智能体')
  assert.equal(customer2Settings.data.name, '客户二智能体')

  for (const endpoint of ['/knowledge', '/publish-tasks', '/automations']) {
    assert.equal((await demoApi(`${endpoint}?customerId=2`)).length, 0)
  }
})

test('Pages demo rejects invalid dates and matches server rank normalization', async () => {
  await assert.rejects(
    demoApi('/observations', {
      method: 'POST',
      body: JSON.stringify({ customerId: 1, platform: '测试平台', keyword: '非法时间', mentioned: 1, observedAt: 'not-a-date' }),
    }),
    /\u91c7样时间格式不正确/,
  )

  const fractional = await demoApi('/observations', {
    method: 'POST',
    body: JSON.stringify({ customerId: 1, platform: '测试平台', keyword: '小数排名', mentioned: 1, rank: 1.7, observedAt: '2026-08-08 09:00:00' }),
  })
  const zero = await demoApi('/observations', {
    method: 'POST',
    body: JSON.stringify({ customerId: 1, platform: '测试平台', keyword: '零排名', mentioned: 1, rank: 0, observedAt: '2026-08-08 10:00:00' }),
  })
  assert.equal(fractional.rank, 2)
  assert.equal(zero.rank, null)
})

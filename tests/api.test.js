import test, { after, before } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { createApp } from '../server/app.js'
import { createDatabase, dashboardFor } from '../server/database.js'

const database = createDatabase(':memory:')
const app = createApp({ database })
let token

before(async () => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ username: 'yanru', password: '123456' })
  assert.equal(response.status, 200)
  token = response.body.token
})

after(() => database.close())

test('rejects unauthenticated CRM access', async () => {
  const response = await request(app).get('/api/crm/customers')
  assert.equal(response.status, 401)
})

test('accepts the local demo account and returns the operator', async () => {
  const response = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${token}`)
  assert.equal(response.status, 200)
  assert.equal(response.body.username, 'yanru')
  assert.equal(response.body.name, 'AI运营官')
  assert.equal(response.body.role, '超级管理员')
})

test('CRM one-click login returns a GEO customer context', async () => {
  const customers = await request(app)
    .get('/api/crm/customers')
    .set('Authorization', `Bearer ${token}`)
  const target = customers.body.at(-1)
  const response = await request(app)
    .post(`/api/crm/customers/${target.id}/enter-geo`)
    .set('Authorization', `Bearer ${token}`)
  assert.equal(response.status, 200)
  assert.equal(response.body.product, 'GEO')
  assert.equal(response.body.redirect, '/geo/dashboard')
  assert.equal(response.body.customer.id, target.id)
})

test('new keywords are persisted and returned by the API', async () => {
  const created = await request(app)
    .post('/api/keywords')
    .set('Authorization', `Bearer ${token}`)
    .send({ customerId: 1, word: 'GEO 运营中台', category: '问题词', searchVolume: 320 })
  assert.equal(created.status, 201)
  assert.equal(created.body.word, 'GEO 运营中台')

  const list = await request(app)
    .get('/api/keywords?customerId=1')
    .set('Authorization', `Bearer ${token}`)
  assert.ok(list.body.some((row) => row.word === 'GEO 运营中台'))
})

test('dashboard metrics are derived from observation rows', () => {
  const dashboard = dashboardFor(database, 1)
  assert.equal(dashboard.samples, 25)
  assert.equal(dashboard.platforms, 5)
  assert.equal(dashboard.words, 5)
  assert.ok(dashboard.visibilityRate > 0 && dashboard.visibilityRate <= 100)
  assert.equal(dashboard.platformStats.length, 5)
})

test('deep GEO module records can be created, filtered and moved to a new status', async () => {
  const created = await request(app)
    .post('/api/module-items')
    .set('Authorization', `Bearer ${token}`)
    .send({ customerId: 1, module: 'targets', title: 'AI先行者', itemType: '品牌名称', status: '待生效', metric: '主目标', detail: '用于端到端测试' })
  assert.equal(created.status, 201)
  assert.equal(created.body.module, 'targets')

  const updated = await request(app)
    .patch(`/api/module-items/${created.body.id}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ status: '已生效' })
  assert.equal(updated.status, 200)
  assert.equal(updated.body.status, '已生效')

  const list = await request(app)
    .get('/api/module-items?customerId=1&module=targets')
    .set('Authorization', `Bearer ${token}`)
  assert.ok(list.body.some((row) => row.id === created.body.id && row.status === '已生效'))
})

test('AI agent settings persist as customer-scoped JSON', async () => {
  const saved = await request(app)
    .put('/api/module-settings/agent')
    .set('Authorization', `Bearer ${token}`)
    .send({ customerId: 1, data: { name: 'AI先行者品牌顾问', tone: '专业可信', enabled: true } })
  assert.equal(saved.status, 200)
  assert.equal(saved.body.data.name, 'AI先行者品牌顾问')

  const read = await request(app)
    .get('/api/module-settings/agent?customerId=1')
    .set('Authorization', `Bearer ${token}`)
  assert.equal(read.body.data.tone, '专业可信')
})

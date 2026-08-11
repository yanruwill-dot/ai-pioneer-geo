import express from 'express'
import crypto from 'node:crypto'
import { resolve } from 'node:path'
import { createDatabase, dashboardFor } from './database.js'
import { normalizeObservationRank, normalizeObservedAt } from '../shared/geoInsights.js'

function passwordHash(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex')
}

function safeEqual(a, b) {
  const left = Buffer.from(a, 'hex')
  const right = Buffer.from(b, 'hex')
  return left.length === right.length && crypto.timingSafeEqual(left, right)
}

function rowList(db, table, customerId) {
  const allowed = new Set(['keywords', 'knowledge', 'publish_tasks', 'automations', 'observations'])
  if (!allowed.has(table)) throw new Error('Unsupported resource')
  if (table === 'observations') {
    return db.prepare(`SELECT
      id, customer_id, external_id, platform, keyword, rank, mentioned, cited, sentiment, device,
      observed_at, source_url, reference_count, captured_at, conversion_target,
      CASE WHEN answer_text IS NOT NULL AND TRIM(answer_text) <> '' THEN 1 ELSE 0 END AS has_content
      FROM observations WHERE customer_id = ? ORDER BY id DESC`).all(customerId)
  }
  return db.prepare(`SELECT * FROM ${table} WHERE customer_id = ? ORDER BY id DESC`).all(customerId)
}

function normalizeSourceUrl(value) {
  const raw = String(value ?? '').trim()
  if (!raw) return { value: null }
  try {
    const parsed = new URL(raw)
    if (!['http:', 'https:'].includes(parsed.protocol)) return { error: true }
    return { value: parsed.toString() }
  } catch {
    return { error: true }
  }
}

export function createApp({ database } = {}) {
  const db = database || createDatabase()
  const app = express()
  app.locals.db = db
  app.use(express.json({ limit: '1mb' }))

  app.post('/api/auth/login', (req, res) => {
    const username = String(req.body?.username || '').trim()
    const password = String(req.body?.password || '')
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username)
    if (!user || !safeEqual(passwordHash(password, user.password_salt), user.password_hash)) {
      return res.status(401).json({ message: '账号或密码不正确' })
    }
    const token = crypto.randomBytes(24).toString('hex')
    db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').run(token, user.id)
    res.json({ token, user: { id: user.id, username: user.username, name: user.name, role: user.role } })
  })

  const requireAuth = (req, res, next) => {
    const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '')
    const user = db.prepare(`SELECT users.id, users.username, users.name, users.role
      FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token = ?`).get(token)
    if (!user) return res.status(401).json({ message: '登录已过期，请重新登录' })
    req.user = user
    req.token = token
    next()
  }

  app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'ai-pioneer-geo-console' }))
  app.get('/api/auth/me', requireAuth, (req, res) => res.json(req.user))
  app.post('/api/auth/logout', requireAuth, (req, res) => {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(req.token)
    res.status(204).end()
  })

  app.get('/api/crm/customers', requireAuth, (_req, res) => {
    res.json(db.prepare('SELECT * FROM customers ORDER BY id DESC').all())
  })
  app.post('/api/crm/customers', requireAuth, (req, res) => {
    const { company, brand, account, phone = '', city = '', status = '待配置' } = req.body || {}
    if (!company || !brand || !account) return res.status(400).json({ message: '公司、品牌和登录账号不能为空' })
    const result = db.prepare(`INSERT INTO customers
      (company, brand, account, phone, city, status, product) VALUES (?, ?, ?, ?, ?, ?, 'GEO')`)
      .run(company, brand, account, phone, city, status)
    res.status(201).json(db.prepare('SELECT * FROM customers WHERE id = ?').get(result.lastInsertRowid))
  })
  app.post('/api/crm/customers/:id/enter-geo', requireAuth, (req, res) => {
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id)
    if (!customer) return res.status(404).json({ message: '客户不存在' })
    res.json({ customer, product: 'GEO', redirect: '/geo/dashboard' })
  })

  app.get('/api/dashboard', requireAuth, (req, res) => {
    res.json(dashboardFor(db, Number(req.query.customerId || 1)))
  })
  app.get('/api/observations', requireAuth, (req, res) => {
    res.json(rowList(db, 'observations', Number(req.query.customerId || 1)))
  })
  app.get('/api/observations/:id', requireAuth, (req, res) => {
    const row = db.prepare(`SELECT observations.*, customers.brand AS customer_brand, customers.company AS customer_company
      FROM observations JOIN customers ON customers.id = observations.customer_id
      WHERE observations.id = ? AND observations.customer_id = ?`).get(Number(req.params.id), Number(req.query.customerId || 1))
    if (!row) return res.status(404).json({ message: '采样凭证不存在' })
    res.json(row)
  })
  app.post('/api/observations', requireAuth, (req, res) => {
    const {
      customerId = 1,
      externalId = null,
      platform,
      keyword,
      rank = null,
      mentioned = 0,
      cited = 0,
      sentiment = '正向',
      device = '未记录',
      observedAt,
      answerText = null,
      sourceUrl = null,
      referenceCount = 0,
      capturedAt = null,
      conversionTarget = null,
    } = req.body || {}
    const normalizedPlatform = String(platform || '').trim()
    const normalizedKeyword = String(keyword || '').trim()
    const customer = db.prepare('SELECT id FROM customers WHERE id = ?').get(Number(customerId))
    if (!customer) return res.status(404).json({ message: '客户不存在' })
    if (!normalizedPlatform || !normalizedKeyword) return res.status(400).json({ message: '平台和问题词不能为空' })
    const isMentioned = Number(mentioned) ? 1 : 0
    const isCited = isMentioned && Number(cited) ? 1 : 0
    const normalizedRank = normalizeObservationRank(rank, isMentioned)
    const timestamp = normalizeObservedAt(observedAt, new Date())
    if (!timestamp) return res.status(400).json({ message: '采样时间格式不正确' })
    const normalizedDevice = ['PC', '移动端'].includes(device) ? device : '未记录'
    const normalizedSource = normalizeSourceUrl(sourceUrl)
    if (normalizedSource.error) return res.status(400).json({ message: '原始会话链接必须是有效的 HTTP 或 HTTPS 地址' })
    const normalizedAnswer = String(answerText ?? '').trim() || null
    const normalizedCapturedAt = capturedAt
      ? normalizeObservedAt(capturedAt)
      : (normalizedAnswer ? timestamp : null)
    if (capturedAt && !normalizedCapturedAt) return res.status(400).json({ message: '凭证保存时间格式不正确' })
    const normalizedExternalId = String(externalId ?? '').trim() || null
    if (normalizedExternalId && db.prepare('SELECT id FROM observations WHERE external_id = ?').get(normalizedExternalId)) {
      return res.status(409).json({ message: '外部凭证编号已存在' })
    }
    const normalizedReferenceCount = Math.max(0, Math.trunc(Number(referenceCount) || 0))
    const normalizedConversionTarget = String(conversionTarget ?? '').trim() || null
    const result = db.prepare(`INSERT INTO observations
      (customer_id, external_id, platform, keyword, rank, mentioned, cited, sentiment, device, observed_at,
        answer_text, source_url, reference_count, captured_at, conversion_target)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      Number(customerId),
      normalizedExternalId,
      normalizedPlatform,
      normalizedKeyword,
      normalizedRank,
      isMentioned,
      isCited,
      String(sentiment || '正向'),
      normalizedDevice,
      timestamp,
      normalizedAnswer,
      normalizedSource.value,
      normalizedReferenceCount,
      normalizedCapturedAt,
      normalizedConversionTarget,
    )
    res.status(201).json(db.prepare('SELECT * FROM observations WHERE id = ?').get(result.lastInsertRowid))
  })

  app.get('/api/keywords', requireAuth, (req, res) => {
    res.json(rowList(db, 'keywords', Number(req.query.customerId || 1)))
  })
  app.post('/api/keywords', requireAuth, (req, res) => {
    const { customerId = 1, word, category = '问题词', searchVolume = 0 } = req.body || {}
    if (!String(word || '').trim()) return res.status(400).json({ message: '关键词不能为空' })
    const result = db.prepare(`INSERT INTO keywords
      (customer_id, word, category, search_volume, status) VALUES (?, ?, ?, ?, '训练中')`)
      .run(customerId, String(word).trim(), category, Number(searchVolume) || 0)
    res.status(201).json(db.prepare('SELECT * FROM keywords WHERE id = ?').get(result.lastInsertRowid))
  })

  app.get('/api/knowledge', requireAuth, (req, res) => {
    res.json(rowList(db, 'knowledge', Number(req.query.customerId || 1)))
  })
  app.post('/api/knowledge', requireAuth, (req, res) => {
    const { customerId = 1, title, type = '企业资料', content } = req.body || {}
    if (!title || !content) return res.status(400).json({ message: '标题和内容不能为空' })
    const result = db.prepare(`INSERT INTO knowledge
      (customer_id, title, type, content) VALUES (?, ?, ?, ?)`)
      .run(customerId, title, type, content)
    res.status(201).json(db.prepare('SELECT * FROM knowledge WHERE id = ?').get(result.lastInsertRowid))
  })

  app.get('/api/publish-tasks', requireAuth, (req, res) => {
    res.json(rowList(db, 'publish_tasks', Number(req.query.customerId || 1)))
  })
  app.post('/api/publish-tasks', requireAuth, (req, res) => {
    const { customerId = 1, title, channel = '新闻媒体', scheduledAt = null } = req.body || {}
    if (!title) return res.status(400).json({ message: '任务标题不能为空' })
    const result = db.prepare(`INSERT INTO publish_tasks
      (customer_id, title, channel, scheduled_at) VALUES (?, ?, ?, ?)`)
      .run(customerId, title, channel, scheduledAt)
    res.status(201).json(db.prepare('SELECT * FROM publish_tasks WHERE id = ?').get(result.lastInsertRowid))
  })
  app.patch('/api/publish-tasks/:id', requireAuth, (req, res) => {
    const { status, progress } = req.body || {}
    db.prepare(`UPDATE publish_tasks SET status = COALESCE(?, status), progress = COALESCE(?, progress) WHERE id = ?`)
      .run(status ?? null, progress ?? null, req.params.id)
    res.json(db.prepare('SELECT * FROM publish_tasks WHERE id = ?').get(req.params.id))
  })

  app.get('/api/automations', requireAuth, (req, res) => {
    res.json(rowList(db, 'automations', Number(req.query.customerId || 1)))
  })
  app.patch('/api/automations/:id/toggle', requireAuth, (req, res) => {
    db.prepare('UPDATE automations SET enabled = CASE WHEN enabled = 1 THEN 0 ELSE 1 END WHERE id = ?').run(req.params.id)
    res.json(db.prepare('SELECT * FROM automations WHERE id = ?').get(req.params.id))
  })

  app.get('/api/module-items', requireAuth, (req, res) => {
    const customerId = Number(req.query.customerId || 1)
    const module = String(req.query.module || '').trim()
    if (!module) return res.status(400).json({ message: '模块标识不能为空' })
    res.json(db.prepare(`SELECT * FROM module_items WHERE customer_id = ? AND module = ? ORDER BY id DESC`).all(customerId, module))
  })
  app.post('/api/module-items', requireAuth, (req, res) => {
    const { customerId = 1, module, title, itemType = '自定义', status = '待处理', metric = '', detail = '' } = req.body || {}
    if (!module || !String(title || '').trim()) return res.status(400).json({ message: '模块和名称不能为空' })
    const result = db.prepare(`INSERT INTO module_items
      (customer_id, module, title, item_type, status, metric, detail) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(customerId, module, String(title).trim(), itemType, status, metric, detail)
    res.status(201).json(db.prepare('SELECT * FROM module_items WHERE id = ?').get(result.lastInsertRowid))
  })
  app.patch('/api/module-items/:id', requireAuth, (req, res) => {
    const { title, itemType, status, metric, detail } = req.body || {}
    const exists = db.prepare('SELECT id FROM module_items WHERE id = ?').get(req.params.id)
    if (!exists) return res.status(404).json({ message: '记录不存在' })
    db.prepare(`UPDATE module_items SET
      title = COALESCE(?, title), item_type = COALESCE(?, item_type), status = COALESCE(?, status),
      metric = COALESCE(?, metric), detail = COALESCE(?, detail), updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .run(title ?? null, itemType ?? null, status ?? null, metric ?? null, detail ?? null, req.params.id)
    res.json(db.prepare('SELECT * FROM module_items WHERE id = ?').get(req.params.id))
  })

  app.get('/api/module-settings/:module', requireAuth, (req, res) => {
    const customerId = Number(req.query.customerId || 1)
    const row = db.prepare('SELECT * FROM module_settings WHERE customer_id = ? AND module = ?').get(customerId, req.params.module)
    res.json(row ? { ...row, data: JSON.parse(row.data) } : { customer_id: customerId, module: req.params.module, data: {} })
  })
  app.put('/api/module-settings/:module', requireAuth, (req, res) => {
    const customerId = Number(req.body?.customerId || 1)
    const data = req.body?.data
    if (!data || typeof data !== 'object' || Array.isArray(data)) return res.status(400).json({ message: '配置数据格式不正确' })
    db.prepare(`INSERT INTO module_settings (customer_id, module, data) VALUES (?, ?, ?)
      ON CONFLICT(customer_id, module) DO UPDATE SET data = excluded.data, updated_at = CURRENT_TIMESTAMP`)
      .run(customerId, req.params.module, JSON.stringify(data))
    const row = db.prepare('SELECT * FROM module_settings WHERE customer_id = ? AND module = ?').get(customerId, req.params.module)
    res.json({ ...row, data: JSON.parse(row.data) })
  })

  const dist = resolve('dist')
  app.use(express.static(dist))
  app.get('/{*path}', (_req, res) => res.sendFile(resolve(dist, 'index.html')))
  return app
}

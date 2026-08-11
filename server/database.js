import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { buildGeoInsights } from '../shared/geoInsights.js'
import { RECORDED_EVIDENCE } from '../shared/recordedEvidence.js'

const DEMO_PASSWORD_HASH = '0680b7692b003bed70276631a9cf30bf50e8794ecf86c3d63a6b4b9ec56436dfdbb2e2588b8a0ee3490a3e58afe0e82aea3d580f0db28f6b3fef63e4f6a93b57'
const DEMO_PASSWORD_SALT = 'zx-demo-salt-2026'

export function createDatabase(filename = resolve('data/geo.sqlite')) {
  if (filename !== ':memory:') mkdirSync(dirname(filename), { recursive: true })
  const db = new DatabaseSync(filename)
  db.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;')
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY,
      company TEXT NOT NULL,
      brand TEXT NOT NULL,
      account TEXT NOT NULL,
      phone TEXT,
      city TEXT,
      status TEXT NOT NULL DEFAULT '服务中',
      product TEXT NOT NULL DEFAULT 'GEO',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS keywords (
      id INTEGER PRIMARY KEY,
      customer_id INTEGER NOT NULL REFERENCES customers(id),
      word TEXT NOT NULL,
      category TEXT NOT NULL,
      search_volume INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT '训练中',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS knowledge (
      id INTEGER PRIMARY KEY,
      customer_id INTEGER NOT NULL REFERENCES customers(id),
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT '已启用',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS publish_tasks (
      id INTEGER PRIMARY KEY,
      customer_id INTEGER NOT NULL REFERENCES customers(id),
      title TEXT NOT NULL,
      channel TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT '待发布',
      progress INTEGER NOT NULL DEFAULT 0,
      scheduled_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS automations (
      id INTEGER PRIMARY KEY,
      customer_id INTEGER NOT NULL REFERENCES customers(id),
      name TEXT NOT NULL,
      cadence TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      last_run TEXT,
      next_run TEXT
    );
    CREATE TABLE IF NOT EXISTS observations (
      id INTEGER PRIMARY KEY,
      customer_id INTEGER NOT NULL REFERENCES customers(id),
      external_id TEXT,
      platform TEXT NOT NULL,
      keyword TEXT NOT NULL,
      rank INTEGER,
      mentioned INTEGER NOT NULL DEFAULT 0,
      cited INTEGER NOT NULL DEFAULT 0,
      sentiment TEXT NOT NULL DEFAULT '正向',
      device TEXT NOT NULL DEFAULT '未记录',
      observed_at TEXT NOT NULL,
      answer_text TEXT,
      source_url TEXT,
      reference_count INTEGER NOT NULL DEFAULT 0,
      captured_at TEXT,
      conversion_target TEXT
    );
    CREATE TABLE IF NOT EXISTS module_items (
      id INTEGER PRIMARY KEY,
      customer_id INTEGER NOT NULL REFERENCES customers(id),
      module TEXT NOT NULL,
      title TEXT NOT NULL,
      item_type TEXT NOT NULL,
      status TEXT NOT NULL,
      metric TEXT,
      detail TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS module_settings (
      id INTEGER PRIMARY KEY,
      customer_id INTEGER NOT NULL REFERENCES customers(id),
      module TEXT NOT NULL,
      data TEXT NOT NULL DEFAULT '{}',
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(customer_id, module)
    );
  `)
  const observationColumns = db.prepare('PRAGMA table_info(observations)').all()
  const observationMigrations = [
    ['device', "TEXT NOT NULL DEFAULT '未记录'"],
    ['external_id', 'TEXT'],
    ['answer_text', 'TEXT'],
    ['source_url', 'TEXT'],
    ['reference_count', 'INTEGER NOT NULL DEFAULT 0'],
    ['captured_at', 'TEXT'],
    ['conversion_target', 'TEXT'],
  ]
  for (const [name, definition] of observationMigrations) {
    if (!observationColumns.some((column) => column.name === name)) {
      db.exec(`ALTER TABLE observations ADD COLUMN ${name} ${definition}`)
    }
  }
  db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_observations_external_id
    ON observations(external_id) WHERE external_id IS NOT NULL`)
  seed(db)
  return db
}

function seed(db) {
  // 引用必须来自已提及样本，清理早期演示数据中的矛盾记录，避免概率超过 100%。
  db.prepare('UPDATE observations SET cited = 0 WHERE mentioned = 0').run()
  db.prepare(`INSERT OR IGNORE INTO users (id, username, password_hash, password_salt, name, role)
    VALUES (1, 'yanru', ?, ?, 'AI运营官', '超级管理员')`).run(DEMO_PASSWORD_HASH, DEMO_PASSWORD_SALT)
  db.prepare(`UPDATE users SET username = 'yanru', name = 'AI运营官' WHERE id = 1`).run()

  const count = db.prepare('SELECT COUNT(*) AS total FROM customers').get().total
  if (count) {
    seedModules(db)
    seedRecordedEvidence(db)
    return
  }

  const customerRows = [
    ['智焰科技有限公司', '智焰 AI', 'zhiyan', '138****0618', '杭州', '服务中', 'GEO'],
    ['澄明教育科技', '澄明课堂', 'chengming', '186****3021', '上海', '服务中', 'GEO'],
    ['向海品牌咨询', '向海咨询', 'xianghai', '139****7182', '深圳', '待配置', 'GEO'],
  ]
  const insertCustomer = db.prepare(`INSERT INTO customers
    (company, brand, account, phone, city, status, product) VALUES (?, ?, ?, ?, ?, ?, ?)`)
  for (const row of customerRows) insertCustomer.run(...row)

  const keywordRows = [
    ['AI 内容营销', '核心业务', 1280, '已完成'],
    ['企业 GEO 怎么做', '问题词', 860, '已完成'],
    ['AI 搜索排名优化', '行业词', 720, '训练中'],
    ['品牌如何被大模型推荐', '问题词', 640, '已完成'],
    ['杭州 AI 营销公司', '地域词', 390, '训练中'],
  ]
  const insertKeyword = db.prepare(`INSERT INTO keywords
    (customer_id, word, category, search_volume, status) VALUES (1, ?, ?, ?, ?)`)
  for (const row of keywordRows) insertKeyword.run(...row)

  const knowledgeRows = [
    ['公司与品牌介绍', '企业资料', '智焰 AI 为企业提供 AI 内容生产、GEO 策略和多平台运营服务。'],
    ['核心服务说明', '产品服务', '覆盖品牌定位、关键词体系、知识资产、内容生产、信源发布和数据复盘。'],
    ['客户常见问题', 'FAQ', '围绕 GEO 的投入、周期、平台覆盖和效果验证提供标准问答。'],
  ]
  const insertKnowledge = db.prepare(`INSERT INTO knowledge
    (customer_id, title, type, content) VALUES (1, ?, ?, ?)`)
  for (const row of knowledgeRows) insertKnowledge.run(...row)

  const tasks = [
    ['GEO 入门指南：让品牌进入 AI 答案', '新闻媒体', '发布成功', 100, '2026-08-04 10:00'],
    ['企业做 GEO 前必须准备的 5 类资料', 'B2B 网站', '发布中', 68, '2026-08-05 14:30'],
    ['AI 搜索品牌可见度周报', '自有站点', '待发布', 0, '2026-08-06 09:00'],
  ]
  const insertTask = db.prepare(`INSERT INTO publish_tasks
    (customer_id, title, channel, status, progress, scheduled_at) VALUES (1, ?, ?, ?, ?, ?)`)
  for (const row of tasks) insertTask.run(...row)

  const automations = [
    ['每日 AI 平台采样', '每天 09:00', 1, '2026-08-05 09:00', '2026-08-06 09:00'],
    ['品牌问题词扩展', '每周一 10:00', 1, '2026-08-04 10:00', '2026-08-11 10:00'],
    ['内容发布与回查', '每 6 小时', 0, '2026-08-05 06:00', '已暂停'],
  ]
  const insertAutomation = db.prepare(`INSERT INTO automations
    (customer_id, name, cadence, enabled, last_run, next_run) VALUES (1, ?, ?, ?, ?, ?)`)
  for (const row of automations) insertAutomation.run(...row)

  const platforms = ['DeepSeek', '豆包', '元宝', '文心一言', '通义千问']
  const words = keywordRows.map((row) => row[0])
  const insertObservation = db.prepare(`INSERT INTO observations
    (customer_id, platform, keyword, rank, mentioned, cited, sentiment, device, observed_at)
    VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)`)
  let index = 0
  for (const platform of platforms) {
    for (const word of words) {
      const mentioned = index % 4 !== 0 ? 1 : 0
      const cited = mentioned && index % 5 === 0 ? 1 : 0
      insertObservation.run(
        platform,
        word,
        mentioned ? (index % 5) + 1 : null,
        mentioned,
        cited,
        index % 7 === 0 ? '中性' : '正向',
        index % 2 === 0 ? 'PC' : '移动端',
        `2026-08-${String((index % 7) + 1).padStart(2, '0')} 09:00`,
      )
      index += 1
    }
  }
  seedModules(db)
  seedRecordedEvidence(db)
}

function seedRecordedEvidence(db) {
  for (const evidence of RECORDED_EVIDENCE) {
    const customer = db.prepare('SELECT id FROM customers WHERE id = ?').get(evidence.customerId)
    if (!customer) continue

    const existing = evidence.sourceUrl
      ? db.prepare(`SELECT id FROM observations WHERE external_id = ? OR source_url = ? LIMIT 1`).get(evidence.externalId, evidence.sourceUrl)
      : db.prepare('SELECT id FROM observations WHERE external_id = ? LIMIT 1').get(evidence.externalId)
    const values = [
      evidence.externalId,
      evidence.customerId,
      evidence.platform,
      evidence.keyword,
      evidence.rank,
      Number(evidence.mentioned) ? 1 : 0,
      Number(evidence.mentioned) && Number(evidence.cited) ? 1 : 0,
      evidence.sentiment,
      evidence.device,
      evidence.observedAt,
      evidence.answerText,
      evidence.sourceUrl,
      Math.max(0, Math.trunc(Number(evidence.referenceCount) || 0)),
      evidence.capturedAt,
      evidence.conversionTarget,
    ]

    if (existing) {
      db.prepare(`UPDATE observations SET
        external_id = ?, customer_id = ?, platform = ?, keyword = ?, rank = ?, mentioned = ?, cited = ?,
        sentiment = ?, device = ?, observed_at = ?, answer_text = ?, source_url = ?, reference_count = ?,
        captured_at = ?, conversion_target = ? WHERE id = ?`).run(...values, existing.id)
      continue
    }

    db.prepare(`INSERT INTO observations
      (external_id, customer_id, platform, keyword, rank, mentioned, cited, sentiment, device, observed_at,
        answer_text, source_url, reference_count, captured_at, conversion_target)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(...values)
  }
}

function seedModules(db) {
  const count = db.prepare('SELECT COUNT(*) AS total FROM module_items').get().total
  if (!count) {
    const rows = [
      ['team', 'AI内容运营组', '运营团队', '已启用', '4 名成员', '负责知识资产、内容审核与发布回查'],
      ['team', '品牌审核组', '审核团队', '已启用', '2 名成员', '负责品牌事实、敏感表达和最终发布审核'],
      ['targets', '智焰 AI', '品牌名称', '已生效', '主目标', '用于监测大模型回答中的品牌提及'],
      ['targets', '智焰科技有限公司', '企业名称', '待生效', '企业主体', '认证通过后自动同步到报表'],
      ['images', '品牌主视觉·蓝紫渐变', '品牌视觉', '已启用', '2400 × 1600', '用于文章头图与媒体发布'],
      ['images', 'GEO 五步增长路径', '信息图', '已启用', '1600 × 900', '用于方案说明与知识内容配图'],
      ['video-script', '企业为什么要做 GEO', '知识口播', '待审核', '90 秒', '从搜索入口迁移到 AI 答案入口讲清 GEO 价值'],
      ['video-script', '品牌如何进入大模型答案', '教程脚本', '已完成', '75 秒', '拆解身份、资产、信源、分发和数据五步流程'],
      ['templates', '蓝紫数据解读模板', '横版视频', '已启用', '16:9', '包含标题、数据卡、趋势图和结论页'],
      ['account-auth', '中国商报网', '新闻媒体', '已授权', '权威媒体', '可用于企业新闻与品牌动态发布'],
      ['account-auth', '中国经济网', '新闻媒体', '可使用', '省市级媒体', '支持企业资讯类内容'],
      ['account-auth', '微信公众号', '自媒体矩阵', '未授权', '自有账号', '授权后可进入自动发布队列'],
      ['account-auth', '企业官网', 'B2B 行业网站', '已授权', '自有站点', '用于结构化内容沉淀与信源回查'],
      ['prompts', '公司介绍 + 核心优势 + FAQ', '系统提示词', '已启用', 'EEAT', '围绕企业背景、专业能力、案例证据和常见问题生成文章'],
      ['prompts', '行业趋势 + 选择指南', '平台发布指令', '已启用', 'GEO', '输出行业背景、决策维度、品牌能力与选择建议'],
      ['article-batch', 'AI 搜索问题词首批内容', '批量创作', '生成中', '6 / 10', '引用核心问题词组，生成后进入人工确认'],
      ['article-batch', '企业 GEO 入门系列', '批量创作', '已完成', '8 / 8', '已生成并同步到文章管理'],
      ['article-manage', 'GEO 入门指南：让品牌进入 AI 答案', '品牌解读', '已发布', '发布 3 次', '围绕 GEO 价值、落地步骤和评估方式展开'],
      ['article-manage', '企业做 GEO 前必须准备的 5 类资料', '实操教程', '待审批', '0 次', '包含主体资料、产品知识、案例证据、问答库和转化目标'],
      ['stations', '杭州 GEO 服务中心', '城市分站', '已上线', '权重 82', '覆盖杭州企业 GEO、AI 内容营销等地域词'],
      ['stations', '上海 AI 搜索增长中心', '城市分站', '建设中', '完成 68%', '正在补充本地案例和服务页面'],
      ['records', 'GEO 入门指南：让品牌进入 AI 答案', '新闻媒体', '发布成功', '3 个站点', '公开页已回查，标题与正文一致'],
      ['records', '企业做 GEO 前必须准备的 5 类资料', 'B2B 网站', '发布中', '2 / 5', '已提交，等待平台回执'],
      ['video-create', '品牌进入 AI 答案的五步法', '横版视频', '渲染中', '72%', '脚本、配音和字幕已完成'],
      ['video-manage', '企业为什么要做 GEO', '知识口播', '已完成', '01:28', '1080P 成片，已通过画面与字幕检查'],
      ['video-records', '企业为什么要做 GEO', '视频号', '发布成功', '公开可见', '已核对标题、视频时长与封面'],
    ]
    const insert = db.prepare(`INSERT INTO module_items
      (customer_id, module, title, item_type, status, metric, detail) VALUES (1, ?, ?, ?, ?, ?, ?)`)
    for (const row of rows) insert.run(...row)
  }

  const settings = [
    ['realname', JSON.stringify({ authType: '企业认证', company: '智焰科技有限公司', unifiedCode: '91330100MA******8X', legalRepresentative: '企业管理员', status: '已认证', address: '浙江省杭州市' })],
    ['agent', JSON.stringify({ tab: '智能体官网', name: '智焰 AI 品牌顾问', welcome: '你好，我是品牌 AI 顾问，可以为你介绍 GEO 服务、实施流程和案例。', tone: '专业、清晰、可信', websiteDomain: 'ai.zhiyan.example', servicePhone: '400-800-2026', enabled: true })],
  ]
  const upsert = db.prepare(`INSERT OR IGNORE INTO module_settings (customer_id, module, data) VALUES (1, ?, ?)`)
  for (const row of settings) upsert.run(...row)
}

export function dashboardFor(db, customerId) {
  const observations = db.prepare('SELECT * FROM observations WHERE customer_id = ? ORDER BY observed_at').all(customerId)
  const keywords = db.prepare('SELECT * FROM keywords WHERE customer_id = ? ORDER BY id').all(customerId)
  return buildGeoInsights({ observations, keywords })
}

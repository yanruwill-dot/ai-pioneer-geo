import { buildGeoInsights, normalizeObservationRank, normalizeObservedAt } from '../shared/geoInsights.js'
import { RECORDED_EVIDENCE } from '../shared/recordedEvidence.js'

const STORE_KEY = 'ai_pioneer_pages_demo_db_v2'
const SESSION_TOKEN = 'ai-pioneer-pages-session'

const moduleRows = [
  ['team', 'AI内容运营组', '运营团队', '已启用', '4 名成员', '负责知识资产、内容审核与发布回查'],
  ['team', '品牌审核组', '审核团队', '已启用', '2 名成员', '负责品牌事实和最终发布审核'],
  ['targets', '智焰 AI', '品牌名称', '已生效', '主目标', '用于监测大模型回答中的品牌提及'],
  ['targets', '智焰科技有限公司', '企业名称', '待生效', '企业主体', '认证通过后同步到报表'],
  ['images', '品牌主视觉·蓝紫渐变', '品牌视觉', '已启用', '2400 × 1600', '用于文章头图与媒体发布'],
  ['images', 'GEO 五步增长路径', '信息图', '已启用', '1600 × 900', '用于知识内容配图'],
  ['video-script', '企业为什么要做 GEO', '知识口播', '待审核', '90 秒', '讲清 GEO 的商业价值'],
  ['templates', '蓝紫数据解读模板', '横版视频', '已启用', '16:9', '包含标题、数据卡和结论页'],
  ['account-auth', '中国商报网', '新闻媒体', '已授权', '权威媒体', '可用于企业新闻与品牌动态发布'],
  ['account-auth', '中国经济网', '新闻媒体', '可使用', '省市级媒体', '支持企业资讯类内容'],
  ['account-auth', '微信公众号', '自媒体矩阵', '未授权', '自有账号', '授权后可进入自动发布队列'],
  ['account-auth', '企业官网', 'B2B 行业网站', '已授权', '自有站点', '用于结构化内容沉淀与信源回查'],
  ['prompts', '公司介绍 + 核心优势 + FAQ', '系统提示词', '已启用', 'EEAT', '围绕企业背景、专业能力和常见问题生成文章'],
  ['prompts', '行业趋势 + 选择指南', '平台发布指令', '已启用', 'GEO', '输出行业背景、决策维度与品牌能力'],
  ['article-batch', 'AI 搜索问题词首批内容', '批量创作', '生成中', '6 / 10', '生成后进入人工确认'],
  ['article-batch', '企业 GEO 入门系列', '批量创作', '已完成', '8 / 8', '已同步到文章管理'],
  ['article-manage', 'GEO 入门指南：让品牌进入 AI 答案', '品牌解读', '已发布', '发布 3 次', '围绕 GEO 价值、步骤和评估方式展开'],
  ['article-manage', '企业做 GEO 前必须准备的 5 类资料', '实操教程', '待审批', '0 次', '包含主体资料、产品知识和案例证据'],
  ['stations', '杭州 GEO 服务中心', '城市分站', '已上线', '权重 82', '覆盖杭州企业 GEO 等地域词'],
  ['stations', '上海 AI 搜索增长中心', '城市分站', '建设中', '完成 68%', '正在补充本地案例和服务页面'],
  ['records', 'GEO 入门指南：让品牌进入 AI 答案', '新闻媒体', '发布成功', '3 个站点', '公开页已回查'],
  ['records', '企业做 GEO 前必须准备的 5 类资料', 'B2B 网站', '发布中', '2 / 5', '已提交，等待平台回执'],
  ['video-create', '品牌进入 AI 答案的五步法', '横版视频', '渲染中', '72%', '脚本、配音和字幕已完成'],
  ['video-manage', '企业为什么要做 GEO', '知识口播', '已完成', '01:28', '1080P 成片已通过检查'],
  ['video-records', '企业为什么要做 GEO', '视频号', '发布成功', '公开可见', '已核对标题、时长与封面'],
]

function isoDate(day = 5) {
  return `2026-08-${String(day).padStart(2, '0')} 09:00:00`
}

function recordedObservation(evidence, id) {
  return {
    id,
    external_id: evidence.externalId,
    customer_id: evidence.customerId,
    platform: evidence.platform,
    keyword: evidence.keyword,
    rank: evidence.rank,
    mentioned: evidence.mentioned,
    cited: evidence.cited,
    sentiment: evidence.sentiment,
    device: evidence.device,
    observed_at: evidence.observedAt,
    captured_at: evidence.capturedAt,
    source_url: evidence.sourceUrl,
    reference_count: evidence.referenceCount,
    conversion_target: evidence.conversionTarget,
    answer_text: evidence.answerText,
    has_content: 1,
  }
}

function observationListItem(row) {
  const { answer_text: _answerText, ...item } = row
  return { ...item, has_content: Number(Boolean(row.answer_text)) }
}

function normalizeSourceUrl(value) {
  if (!value) return ''
  try {
    const url = new URL(String(value))
    if (!['http:', 'https:'].includes(url.protocol)) return null
    return url.href
  } catch {
    return null
  }
}

function initialState() {
  const keywords = [
    ['AI 内容营销', '核心业务', 1280, '已完成'],
    ['企业 GEO 怎么做', '问题词', 860, '已完成'],
    ['AI 搜索排名优化', '行业词', 720, '训练中'],
    ['品牌如何被大模型推荐', '问题词', 640, '已完成'],
    ['杭州 AI 营销公司', '地域词', 390, '训练中'],
  ].map(([word, category, search_volume, status], index) => ({ id: index + 1, customer_id: 1, word, category, search_volume, status, created_at: isoDate(index + 1) }))
  const knowledge = [
    ['公司与品牌介绍', '企业资料', '智焰 AI 为企业提供 AI 内容生产、GEO 策略和多平台运营服务。'],
    ['核心服务说明', '产品服务', '覆盖品牌定位、关键词体系、知识资产、内容生产、信源发布和数据复盘。'],
    ['客户常见问题', 'FAQ', '围绕 GEO 的投入、周期、平台覆盖和效果验证提供标准问答。'],
  ].map(([title, type, content], index) => ({ id: index + 1, customer_id: 1, title, type, content, status: '已启用', created_at: isoDate(index + 1) }))
  const publishTasks = [
    ['GEO 入门指南：让品牌进入 AI 答案', '新闻媒体', '发布成功', 100],
    ['企业做 GEO 前必须准备的 5 类资料', 'B2B 网站', '发布中', 68],
    ['AI 搜索品牌可见度周报', '自有站点', '待发布', 0],
  ].map(([title, channel, status, progress], index) => ({ id: index + 1, customer_id: 1, title, channel, status, progress, scheduled_at: isoDate(index + 4), created_at: isoDate(index + 1) }))
  const automations = [
    ['每日 AI 平台采样', '每天 09:00', 1],
    ['品牌问题词扩展', '每周一 10:00', 1],
    ['内容发布与回查', '每 6 小时', 0],
  ].map(([name, cadence, enabled], index) => ({ id: index + 1, customer_id: 1, name, cadence, enabled, last_run: isoDate(4), next_run: enabled ? isoDate(6) : '已暂停' }))
  const platforms = ['DeepSeek', '豆包', '元宝', '文心一言', '通义千问']
  const observations = []
  let observationId = 1
  platforms.forEach((platform, platformIndex) => keywords.forEach((keyword, wordIndex) => {
    const mentioned = (platformIndex * 5 + wordIndex) % 4 !== 0 ? 1 : 0
    observations.push({ id: observationId++, customer_id: 1, platform, keyword: keyword.word, rank: mentioned ? ((platformIndex + wordIndex) % 5) + 1 : null, mentioned, cited: mentioned && (platformIndex + wordIndex) % 5 === 0 ? 1 : 0, sentiment: (platformIndex + wordIndex) % 7 === 0 ? '中性' : '正向', device: (platformIndex * keywords.length + wordIndex) % 2 === 0 ? 'PC' : '移动端', observed_at: isoDate(wordIndex + 1) })
  }))
  for (const evidence of RECORDED_EVIDENCE) observations.push(recordedObservation(evidence, observationId++))
  return {
    customers: [
      { id: 1, company: '智焰科技有限公司', brand: '智焰 AI', account: 'zhiyan', city: '杭州', status: '服务中', product: 'GEO', created_at: isoDate() },
      { id: 2, company: '澄明教育科技', brand: '澄明课堂', account: 'chengming', city: '上海', status: '服务中', product: 'GEO', created_at: isoDate() },
      { id: 3, company: '向海品牌咨询', brand: '向海咨询', account: 'xianghai', city: '深圳', status: '待配置', product: 'GEO', created_at: isoDate() },
    ],
    keywords,
    knowledge,
    publishTasks,
    automations,
    observations,
    moduleItems: moduleRows.map(([module, title, item_type, status, metric, detail], index) => ({ id: index + 1, customer_id: 1, module, title, item_type, status, metric, detail, created_at: isoDate(), updated_at: isoDate() })),
    settings: {
      1: {
        realname: { authType: '企业认证', company: '智焰科技有限公司', unifiedCode: '91330100MA******8X', legalRepresentative: '企业管理员', status: '已认证', address: '浙江省杭州市' },
        agent: { tab: '智能体官网', name: '智焰 AI 品牌顾问', welcome: '你好，我是品牌 AI 顾问，可以为你介绍 GEO 服务、实施流程和案例。', tone: '专业、清晰、可信', websiteDomain: 'ai.zhiyan.example', servicePhone: '400-800-2026', enabled: true },
      },
    },
  }
}

function readState() {
  try {
    const state = JSON.parse(localStorage.getItem(STORE_KEY)) || initialState()
    state.observations = (state.observations || []).map((row) => ({ ...row, cited: row.mentioned ? Number(row.cited || 0) : 0, device: row.device || '未记录', has_content: Number(Boolean(row.answer_text)) }))
    let changed = false
    for (const evidence of RECORDED_EVIDENCE) {
      const recordedIndex = state.observations.findIndex((row) => row.external_id === evidence.externalId || (evidence.sourceUrl && row.source_url === evidence.sourceUrl))
      if (recordedIndex === -1) {
        state.observations.push(recordedObservation(evidence, nextId(state.observations)))
        changed = true
        continue
      }
      const current = state.observations[recordedIndex]
      const upgraded = recordedObservation(evidence, current.id)
      if (JSON.stringify(current) !== JSON.stringify(upgraded)) {
        state.observations[recordedIndex] = upgraded
        changed = true
      }
    }
    if (changed) writeState(state)
    return state
  } catch {
    return initialState()
  }
}

function writeState(state) {
  localStorage.setItem(STORE_KEY, JSON.stringify(state))
}

function nextId(rows) {
  return Math.max(0, ...rows.map((row) => Number(row.id) || 0)) + 1
}

function scoped(rows, customerId) {
  return rows.filter((row) => Number(row.customer_id || 1) === customerId)
}

function dashboard(state, customerId) {
  return buildGeoInsights({ observations: scoped(state.observations, customerId), keywords: scoped(state.keywords, customerId) })
}

export async function demoApi(path, options = {}) {
  await new Promise((resolve) => setTimeout(resolve, 90))
  const method = options.method || 'GET'
  const body = options.body ? JSON.parse(options.body) : {}
  const url = new URL(path, location.origin)
  const state = readState()
  const pathname = url.pathname
  const parsedCustomerId = Number(url.searchParams.get('customerId') || body.customerId || 1)
  const customerId = Number.isInteger(parsedCustomerId) && parsedCustomerId > 0 ? parsedCustomerId : 1

  if (pathname === '/auth/login' && method === 'POST') {
    if (body.username !== 'yanru' || body.password !== '123456') throw new Error('账号或密码不正确')
    return { token: SESSION_TOKEN, user: { id: 1, username: 'yanru', name: 'AI运营官', role: '超级管理员' } }
  }
  if (pathname === '/auth/me') return { id: 1, username: 'yanru', name: 'AI运营官', role: '超级管理员' }
  if (pathname === '/auth/logout') return null
  if (pathname === '/crm/customers' && method === 'GET') return [...state.customers].reverse()
  if (pathname === '/crm/customers' && method === 'POST') {
    const row = { id: nextId(state.customers), ...body, phone: body.phone || '', status: body.status || '待配置', product: 'GEO', created_at: isoDate() }
    state.customers.push(row); writeState(state); return row
  }
  const customerMatch = pathname.match(/^\/crm\/customers\/(\d+)\/enter-geo$/)
  if (customerMatch) {
    const customer = state.customers.find((row) => row.id === Number(customerMatch[1]))
    if (!customer) throw new Error('客户不存在')
    return { customer, product: 'GEO', redirect: '/geo/dashboard' }
  }
  if (pathname === '/dashboard') return dashboard(state, customerId)
  if (pathname === '/observations' && method === 'GET') return [...scoped(state.observations, customerId)].reverse().map(observationListItem)
  const observationMatch = pathname.match(/^\/observations\/(\d+)$/)
  if (observationMatch && method === 'GET') {
    const row = state.observations.find((item) => item.id === Number(observationMatch[1]) && item.customer_id === customerId)
    if (!row) throw new Error('采样凭证不存在')
    const customer = state.customers.find((item) => item.id === customerId)
    return { ...row, has_content: Number(Boolean(row.answer_text)), customer_brand: customer?.brand || '', customer_company: customer?.company || '' }
  }
  if (pathname === '/observations' && method === 'POST') {
    const mentioned = Number(body.mentioned) ? 1 : 0
    const observedAt = normalizeObservedAt(body.observedAt, isoDate())
    const sourceUrl = normalizeSourceUrl(body.sourceUrl)
    const answerText = String(body.answerText || '').trim()
    const row = { id: nextId(state.observations), external_id: String(body.externalId || '').trim() || null, customer_id: customerId, platform: String(body.platform || '').trim(), keyword: String(body.keyword || '').trim(), rank: normalizeObservationRank(body.rank, mentioned), mentioned, cited: mentioned && Number(body.cited) ? 1 : 0, sentiment: body.sentiment || '正向', device: ['PC', '移动端'].includes(body.device) ? body.device : '未记录', observed_at: observedAt, captured_at: normalizeObservedAt(body.capturedAt, observedAt) || observedAt, source_url: sourceUrl || '', reference_count: Math.max(0, Math.trunc(Number(body.referenceCount) || 0)), conversion_target: String(body.conversionTarget || '').trim(), answer_text: answerText, has_content: Number(Boolean(answerText)) }
    if (!row.platform || !row.keyword) throw new Error('平台和问题词不能为空')
    if (!observedAt) throw new Error('采样时间格式不正确')
    if (sourceUrl === null) throw new Error('原始会话链接必须为 HTTP(S) 地址')
    state.observations.push(row); writeState(state); return row
  }

  const resources = { '/keywords': 'keywords', '/knowledge': 'knowledge', '/publish-tasks': 'publishTasks', '/automations': 'automations' }
  const resourceKey = resources[pathname]
  if (resourceKey && method === 'GET') return [...scoped(state[resourceKey], customerId)].reverse()
  if (pathname === '/keywords' && method === 'POST') {
    const row = { id: nextId(state.keywords), customer_id: customerId, word: body.word, category: body.category, search_volume: Number(body.searchVolume) || 0, status: '训练中', created_at: isoDate() }
    state.keywords.push(row); writeState(state); return row
  }
  if (pathname === '/knowledge' && method === 'POST') {
    const row = { id: nextId(state.knowledge), customer_id: customerId, title: body.title, type: body.type, content: body.content, status: '已启用', created_at: isoDate() }
    state.knowledge.push(row); writeState(state); return row
  }
  if (pathname === '/publish-tasks' && method === 'POST') {
    const row = { id: nextId(state.publishTasks), customer_id: customerId, title: body.title, channel: body.channel, status: '待发布', progress: 0, scheduled_at: body.scheduledAt, created_at: isoDate() }
    state.publishTasks.push(row); writeState(state); return row
  }
  const automationMatch = pathname.match(/^\/automations\/(\d+)\/toggle$/)
  if (automationMatch) {
    const row = state.automations.find((item) => item.id === Number(automationMatch[1])); row.enabled = row.enabled ? 0 : 1; writeState(state); return row
  }
  if (pathname === '/module-items' && method === 'GET') return scoped(state.moduleItems, customerId).filter((row) => row.module === url.searchParams.get('module')).reverse()
  if (pathname === '/module-items' && method === 'POST') {
    const row = { id: nextId(state.moduleItems), customer_id: customerId, module: body.module, title: body.title, item_type: body.itemType, status: body.status, metric: body.metric, detail: body.detail, created_at: isoDate(), updated_at: isoDate() }
    state.moduleItems.push(row); writeState(state); return row
  }
  const itemMatch = pathname.match(/^\/module-items\/(\d+)$/)
  if (itemMatch && method === 'PATCH') {
    const row = state.moduleItems.find((item) => item.id === Number(itemMatch[1])); Object.assign(row, { ...(body.title !== undefined && { title: body.title }), ...(body.itemType !== undefined && { item_type: body.itemType }), ...(body.status !== undefined && { status: body.status }), ...(body.metric !== undefined && { metric: body.metric }), ...(body.detail !== undefined && { detail: body.detail }), updated_at: isoDate() }); writeState(state); return row
  }
  const settingsMatch = pathname.match(/^\/module-settings\/([^/]+)$/)
  if (settingsMatch && method === 'GET') return { customer_id: customerId, module: settingsMatch[1], data: state.settings[customerId]?.[settingsMatch[1]] || {} }
  if (settingsMatch && method === 'PUT') {
    state.settings[customerId] ||= {}
    state.settings[customerId][settingsMatch[1]] = body.data; writeState(state); return { customer_id: customerId, module: settingsMatch[1], data: body.data }
  }
  throw new Error(`演示接口暂不支持：${method} ${pathname}`)
}

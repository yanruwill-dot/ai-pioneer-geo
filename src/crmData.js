export const CRM_ROUTE_META = Object.freeze({
  '/crm/overview': { title: '工作台', eyebrow: 'PARTNER OPERATIONS' },
  '/crm/customers': { title: '客户管理', eyebrow: 'CUSTOMER RELATIONSHIP MANAGEMENT' },
  '/crm/orders': { title: '订单管理', eyebrow: 'SERVICE ORDER CENTER' },
  '/crm/finance': { title: '财务流水', eyebrow: 'FINANCE & SETTLEMENT' },
  '/crm/cases': { title: 'GEO 案例', eyebrow: 'GEO SUCCESS LIBRARY' },
})

export const seedOrders = [
  { id: 'ORD-202608-012', customer: '智焰科技有限公司', brand: '智焰 AI', packageName: 'GEO 增长版', amount: 68000, status: '服务中', signedAt: '2026-08-05', expiresAt: '2027-08-03', progress: 64, owner: '颜汝' },
  { id: 'ORD-202608-009', customer: '澄明教育科技', brand: '澄明课堂', packageName: 'GEO 基础版', amount: 39800, status: '服务中', signedAt: '2026-08-03', expiresAt: '2027-08-02', progress: 42, owner: '颜汝' },
  { id: 'ORD-202608-006', customer: '向海品牌咨询', brand: '向海咨询', packageName: '品牌诊断包', amount: 19800, status: '待确认', signedAt: '2026-08-01', expiresAt: '2026-11-01', progress: 12, owner: '颜汝' },
  { id: 'ORD-202607-028', customer: '云帆智能制造', brand: '云帆智造', packageName: 'GEO 增长版', amount: 68000, status: '已完成', signedAt: '2026-07-22', expiresAt: '2027-07-21', progress: 100, owner: 'AI先行者团队' },
  { id: 'ORD-202607-017', customer: '山海新消费研究院', brand: '山海消费', packageName: '行业影响力包', amount: 52800, status: '已暂停', signedAt: '2026-07-13', expiresAt: '2027-01-12', progress: 35, owner: 'AI先行者团队' },
]

export const seedTransactions = [
  { id: 'FIN-260805-018', date: '2026-08-05 15:26', customer: '智焰科技有限公司', type: '订单收款', direction: '收入', amount: 68000, status: '已到账', channel: '企业转账', orderId: 'ORD-202608-012' },
  { id: 'FIN-260803-011', date: '2026-08-03 10:08', customer: '澄明教育科技', type: '订单收款', direction: '收入', amount: 39800, status: '已到账', channel: '企业转账', orderId: 'ORD-202608-009' },
  { id: 'FIN-260802-007', date: '2026-08-02 18:12', customer: '平台媒体资源池', type: '媒体采购', direction: '支出', amount: 12600, status: '已支付', channel: '对公付款', orderId: '-' },
  { id: 'FIN-260801-003', date: '2026-08-01 09:40', customer: '向海品牌咨询', type: '订单定金', direction: '收入', amount: 6800, status: '待结算', channel: '企业转账', orderId: 'ORD-202608-006' },
  { id: 'FIN-260731-026', date: '2026-07-31 17:55', customer: '内容生产协作组', type: '内容服务', direction: '支出', amount: 8600, status: '已支付', channel: '对公付款', orderId: '-' },
  { id: 'FIN-260729-019', date: '2026-07-29 11:30', customer: '云帆智能制造', type: '订单收款', direction: '收入', amount: 68000, status: '已到账', channel: '企业转账', orderId: 'ORD-202607-028' },
]

export const seedCases = [
  { id: 'CASE-001', brand: '智焰 AI', company: '智焰科技有限公司', industry: 'AI 科技', title: '从“被搜索”到“被引用”的 GEO 内容资产建设', summary: '围绕企业 AI 内容营销与本地决策词，统一品牌身份、知识资产和可验证信源。', mentionRate: 69.2, citationProbability: 22.2, keywords: 5, cycle: '30 天演示周期', highlights: ['建立统一品牌实体页', '覆盖 5 个 AI 平台样本', '问题词与地域词同步监测'], tone: 'violet' },
  { id: 'CASE-002', brand: '澄明课堂', company: '澄明教育科技', industry: '教育培训', title: '课程品牌的问答型内容与专家信源布局', summary: '将课程方法论拆成高频问题词和专家回答，形成从知识库到平台内容的连续证据。', mentionRate: 62.5, citationProbability: 18.8, keywords: 8, cycle: '45 天演示周期', highlights: ['课程知识结构化', '专家观点可信化', '平台问答持续回查'], tone: 'blue' },
  { id: 'CASE-003', brand: '向海咨询', company: '向海品牌咨询', industry: '企业服务', title: '咨询服务的行业比较词与决策场景覆盖', summary: '针对企业选择咨询服务时的比较、预算和本地决策场景，构建可复用案例资产。', mentionRate: 55, citationProbability: 16.7, keywords: 6, cycle: '28 天演示周期', highlights: ['行业比较词建模', '客户案例结构化', '决策路径内容补齐'], tone: 'cyan' },
  { id: 'CASE-004', brand: '云帆智造', company: '云帆智能制造', industry: '智能制造', title: '工业解决方案的技术问答与采购词覆盖', summary: '把复杂参数、交付能力和应用场景转成 AI 可理解、可核验的采购决策内容。', mentionRate: 71.4, citationProbability: 28.6, keywords: 7, cycle: '60 天演示周期', highlights: ['技术参数知识库', '采购问题词覆盖', '行业媒体信源分发'], tone: 'orange' },
]

export function crmTitleFor(pathname) {
  return CRM_ROUTE_META[pathname]?.title || '合作商业务管理'
}

export function filterOrders(rows, query = '', status = '全部订单') {
  const normalized = query.trim().toLowerCase()
  return rows.filter((row) => {
    const matchesQuery = `${row.id}${row.customer}${row.brand}${row.packageName}`.toLowerCase().includes(normalized)
    return matchesQuery && (status === '全部订单' || row.status === status)
  })
}

export function filterTransactions(rows, query = '', direction = '全部流水') {
  const normalized = query.trim().toLowerCase()
  return rows.filter((row) => {
    const matchesQuery = `${row.id}${row.customer}${row.type}${row.orderId}`.toLowerCase().includes(normalized)
    return matchesQuery && (direction === '全部流水' || row.direction === direction)
  })
}

export function summarizeFinance(rows) {
  return rows.reduce((summary, row) => {
    if (row.direction === '收入' && row.status === '已到账') summary.received += row.amount
    if (row.direction === '支出' && row.status === '已支付') summary.paid += row.amount
    if (row.status === '待结算') summary.pending += row.amount
    return summary
  }, { received: 0, paid: 0, pending: 0 })
}

export function filterCases(rows, industry = '全部行业') {
  return rows.filter((row) => industry === '全部行业' || row.industry === industry)
}

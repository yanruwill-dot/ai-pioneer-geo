export const SITE_PAGES = [
  { slug: 'home', label: '网站首页' },
  { slug: 'about', label: '关于我们' },
  { slug: 'products', label: '产品中心' },
  { slug: 'news', label: '新闻资讯' },
  { slug: 'gallery', label: '企业图集' },
  { slug: 'contact', label: '联系我们' },
]

const publicBase = import.meta.env?.BASE_URL || '/'

export const ADMIN_SECTIONS = [
  { group: '网站总览', slug: 'overview', label: '管理首页' },
  { group: '外观与入口', slug: 'templates', label: '模板选择' },
  { group: '外观与入口', slug: 'domain', label: '域名绑定' },
  { group: '外观与入口', slug: 'hero', label: '首页轮播图' },
  { group: '外观与入口', slug: 'navigation', label: '栏目管理' },
  { group: '内容管理', slug: 'settings', label: '网站设置' },
  { group: '内容管理', slug: 'company', label: '公司资料' },
  { group: '内容管理', slug: 'content', label: '内容页管理' },
  { group: '内容管理', slug: 'products', label: '产品管理' },
  { group: '内容管理', slug: 'news', label: '新闻管理' },
  { group: '内容管理', slug: 'faq', label: 'FAQ 管理' },
  { group: '内容管理', slug: 'images', label: '图片管理' },
  { group: '内容管理', slug: 'geo-articles', label: 'GEO 文章列表' },
  { group: 'SEO 优化', slug: 'seo-keywords', label: '自定义关键词' },
  { group: 'SEO 优化', slug: 'links', label: '友情链接' },
  { group: '城市分站', slug: 'city-settings', label: '分站设置' },
  { group: '城市分站', slug: 'city-keywords', label: '关键词规划' },
  { group: '城市分站', slug: 'city-list', label: '分站列表' },
  { group: '客户线索', slug: 'messages', label: '在线留言' },
]

const fallbackProducts = [
  { title: 'GEO 策略诊断', description: '梳理品牌实体、问题词与大模型认知差距，形成可执行的增长路径。' },
  { title: '知识资产建设', description: '把企业介绍、产品能力、案例和 FAQ 整理为可被检索和引用的结构化内容。' },
  { title: '全域内容运营', description: '围绕真实业务问题持续创作、发布、回查，并用数据验证品牌可见度。' },
]

const fallbackFaqs = [
  { question: '什么是 GEO？', answer: 'GEO 是面向生成式 AI 搜索结果的内容与信源优化，让品牌在相关问题中更容易被准确提及和引用。' },
  { question: '官网为什么是重要信源？', answer: '官网集中承载可核验的企业主体、产品、案例和联系方式，是品牌长期积累可信数字资产的基础。' },
  { question: '生成后还能继续修改吗？', answer: '可以。模板、栏目、公司资料、产品、新闻、FAQ、SEO 与城市分站均可在管理后台继续修改。' },
]

export function slugifyBrand(value = '') {
  const slug = String(value).normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return slug || 'brand-site'
}

export function safeAssetUrl(value = '') {
  const input = String(value).trim()
  if (!input) return ''
  if (input.startsWith('/') && !input.startsWith('//')) return input
  try {
    const parsed = new URL(input)
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.toString() : ''
  } catch {
    return ''
  }
}

export function siteRoute(customerId, page = 'home') {
  const safePage = SITE_PAGES.some((item) => item.slug === page) ? page : 'home'
  return `/site/${Number(customerId) || 1}/${safePage}`
}

export function adminRoute(section = 'overview') {
  const safeSection = ADMIN_SECTIONS.some((item) => item.slug === section) ? section : 'overview'
  return `/geo/site-admin/${safeSection}`
}

export function findAdminSection(slug) {
  return ADMIN_SECTIONS.find((item) => item.slug === slug) || ADMIN_SECTIONS[0]
}

export function buildWebsiteDraft({ customer = {}, realname = {}, agent = {}, knowledge = [], images = [], articles = [] } = {}) {
  const company = realname.company || customer.company || '企业名称'
  const brand = customer.brand || company
  const introduction = knowledge.find((item) => item.type === '企业资料' || /公司|品牌|企业/.test(item.title))?.content
    || `${brand}专注于企业 AI 应用、知识资产建设与生成式搜索增长，为客户提供从策略到落地的完整服务。`
  const products = knowledge.filter((item) => item.content && item.content !== introduction).slice(0, 6)
    .map((item) => ({ title: item.title, description: item.content }))
  const gallery = images.slice(0, 8).map((item) => ({ title: item.title, description: item.detail || item.item_type, image: safeAssetUrl(item.image || item.url) }))
  const news = articles.slice(0, 8).map((item) => ({ title: item.title, summary: item.detail || '来自企业 GEO 内容资产的最新文章。', date: item.updated_at?.slice(0, 10) || item.created_at?.slice(0, 10) || '' }))
  const slug = slugifyBrand(agent.websiteDomain || brand)

  return {
    status: 'draft',
    siteId: 4400 + (Number(customer.id) || 1),
    company,
    brand,
    shortName: brand,
    domain: String(agent.websiteDomain || '').trim(),
    previewDomain: `${slug}.preview.local`,
    phone: agent.servicePhone || customer.phone || '400-800-2026',
    address: realname.address || customer.city || '浙江省杭州市',
    headline: `${brand}，让可信知识进入 AI 答案`,
    subhead: '把企业身份、产品能力与真实案例沉淀为可检索、可引用、可持续更新的品牌官网。',
    introduction,
    heroImage: `${publicBase}generated-site/zhiyan-ai-hero.png`,
    logoImage: '',
    theme: 'midnight',
    accent: '#155eef',
    pages: SITE_PAGES.map((item) => item.slug),
    products: products.length ? products : fallbackProducts,
    news: news.length ? news : [
      { title: `${brand}官网完成 AI 信源升级`, summary: '企业身份、核心服务、常见问题与联系方式已完成结构化整理。', date: '2026-08-12' },
      { title: '生成式搜索正在改变客户决策入口', summary: '从传统关键词排名走向大模型答案中的品牌提及与可信引用。', date: '2026-08-11' },
    ],
    gallery: gallery.length ? gallery : [
      { title: '品牌主视觉', description: '来自图片素材中心的默认品牌资产', image: '' },
      { title: 'GEO 增长路径', description: '身份、资产、信源、分发与数据闭环', image: '' },
    ],
    faqs: fallbackFaqs,
    seo: { primary: ['企业 GEO', 'AI 搜索优化', brand], secondary: ['品牌如何被大模型推荐'] },
    links: [],
    city: { enabled: false, shortName: brand, domain: '', keywords: ['GEO 服务', 'AI 搜索优化'], cities: ['杭州'] },
    icp: '',
    policeRecord: '',
    headVerify: '',
    analytics: '',
    autoUpdateArticles: true,
  }
}

import { readFile, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

const topics = [
  {
    title: '企业做 GEO，为什么要先统一品牌身份',
    summary: '从企业名称、品牌简称到产品口径，统一身份是大模型准确理解企业的第一步。',
    points: ['固定企业名称、品牌名称和核心业务的标准写法', '让官网、知识库与公开内容使用同一套事实口径', '定期检查旧页面，避免联系方式和服务描述互相冲突'],
  },
  {
    title: '把企业知识库变成可被 AI 理解的内容资产',
    summary: '知识库不只是资料仓库，还要回答客户真实问题，并提供清楚、可核验的业务信息。',
    points: ['按企业介绍、产品服务、案例和常见问题分类整理', '一页只解决一个核心问题，标题直接表达用户意图', '重要结论补充时间、适用范围和事实依据'],
  },
  {
    title: '企业官网如何成为稳定的 AI 信源',
    summary: '持续更新的官网能集中承载企业身份、产品能力与联系方式，形成长期可信入口。',
    points: ['保持公司主体、地址和联系方式完整可查', '围绕客户决策问题持续发布原创业务内容', '用清晰栏目和内部链接连接产品、案例与问答'],
  },
  {
    title: 'GEO 内容更新，频率和质量哪个更重要',
    summary: '稳定频率有助于积累内容资产，但每篇文章仍需解决真实问题，不能只追求数量。',
    points: ['建立固定更新节奏，避免长期停更后集中堆量', '每次更新都围绕一个具体客户问题展开', '发布后检查页面可访问性、标题与摘要是否一致'],
  },
  {
    title: '企业 GEO 文章应该写给谁看',
    summary: '好文章同时服务客户阅读和机器理解，先把目标客户的决策问题讲清楚。',
    points: ['从客户咨询记录中提炼高频问题', '用明确小标题表达条件、步骤和结果边界', '避免空泛口号，用企业真实能力回答问题'],
  },
  {
    title: '如何检查品牌是否进入 AI 答案',
    summary: '需要区分品牌提及、候选出现、推荐和直接引用，并保留可回查的采样记录。',
    points: ['固定问题词、平台、设备和采样时间', '分别记录品牌是否提及以及是否出现直接引用', '把结果回连到原始回答，避免只看汇总数字'],
  },
  {
    title: '产品页怎样写，更容易被客户和 AI 看懂',
    summary: '产品页需要说明服务对象、解决问题、交付内容和适用边界，而不是只写功能名称。',
    points: ['先说明目标客户与典型使用场景', '把服务过程拆成可验证的交付步骤', '明确不适用情况，减少模糊和过度承诺'],
  },
  {
    title: 'FAQ 为什么是企业官网的重要内容',
    summary: 'FAQ 能把零散咨询沉淀为结构化答案，帮助客户快速判断，也便于 AI 准确提取。',
    points: ['优先回答价格、周期、适用场景和准备材料', '每个答案先给结论，再补充条件与说明', '随产品和服务变化及时修订旧答案'],
  },
]

export function shanghaiDate(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}

export function generateArticle(date) {
  const dayNumber = Math.floor(Date.parse(`${date}T00:00:00Z`) / 86400000)
  const topic = topics[Math.abs(dayNumber) % topics.length]
  const slug = `${date}-${Math.abs(dayNumber) % topics.length + 1}`
  return {
    id: `auto-${date}`,
    slug,
    title: topic.title,
    summary: topic.summary,
    date,
    source: '智能体官网自动更新',
    body: [
      `${topic.summary} 对企业来说，关键不是增加一篇孤立文章，而是把这次更新接入持续维护的官网知识体系。`,
      ...topic.points.map((point, index) => `${index + 1}. ${point}。`),
      '智焰 AI 建议企业把每次内容更新与身份资料、产品页面和客户常见问题同步校验，让官网中的事实口径始终一致。',
    ],
  }
}

export function updateFeed(feed, date) {
  const articles = Array.isArray(feed?.articles) ? feed.articles : []
  if (articles.some((article) => article.id === `auto-${date}`)) return { feed, changed: false }
  const article = generateArticle(date)
  return {
    changed: true,
    feed: {
      version: 1,
      schedule: '每天 09:15（北京时间）',
      updatedAt: `${date}T09:15:00+08:00`,
      articles: [article, ...articles.filter((saved) => saved.title !== article.title)].slice(0, 30),
    },
  }
}

export async function updateFeedFile(file, date = shanghaiDate()) {
  let feed = { version: 1, schedule: '每天 09:15（北京时间）', updatedAt: null, articles: [] }
  try {
    const saved = await readFile(file, 'utf8')
    if (saved.trim()) feed = JSON.parse(saved)
  } catch (cause) {
    if (cause.code !== 'ENOENT') throw cause
  }
  const result = updateFeed(feed, date)
  if (result.changed) await writeFile(file, `${JSON.stringify(result.feed, null, 2)}\n`, 'utf8')
  return result
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const file = process.env.AUTO_ARTICLE_FILE || new URL('../public/auto-articles.json', import.meta.url)
  const result = await updateFeedFile(file, process.env.AUTO_ARTICLE_DATE || shanghaiDate())
  console.log(result.changed ? `Generated article for ${result.feed.updatedAt.slice(0, 10)}` : 'Article already exists for today')
}

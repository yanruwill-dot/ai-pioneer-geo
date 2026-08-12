import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'wouter'
import {
  ArrowLeft,
  ArrowUpRight,
  Bot,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  FileText,
  Globe2,
  Image as ImageIcon,
  LayoutTemplate,
  LoaderCircle,
  MapPinned,
  MessageSquareText,
  Palette,
  Phone,
  Save,
  Settings2,
  ShieldCheck,
  Sparkles,
  WandSparkles,
} from 'lucide-react'
import { api, currentCustomer } from './api.js'
import { ADMIN_SECTIONS, SITE_PAGES, adminRoute, buildWebsiteDraft, findAdminSection, safeAssetUrl, siteRoute } from './websiteBuilder.js'

const agentTabs = [
  { label: '智能体官网', path: '/geo/agent', view: 'website' },
  { label: '智能体名片', path: '/geo/agent/card', view: 'card' },
  { label: '智能体客服', path: '/geo/agent/service', view: 'service' },
]

const templates = [
  { id: 'midnight', name: '深海智识', description: '深色权威 · 科技服务', colors: ['#07152c', '#155eef', '#dca953'] },
  { id: 'ivory', name: '象牙编辑部', description: '明亮克制 · 专业咨询', colors: ['#f4efe5', '#1d2738', '#b96b45'] },
  { id: 'forest', name: '青岚制造', description: '自然稳健 · 实业品牌', colors: ['#0e332c', '#d4b56e', '#eef3ec'] },
]

function useSiteBundle(customerId) {
  const [bundle, setBundle] = useState(null)
  const [error, setError] = useState('')
  const load = async () => {
    setError('')
    try {
      const [realname, agent, knowledge, images, articles] = await Promise.all([
        api(`/module-settings/realname?customerId=${customerId}`),
        api(`/module-settings/agent?customerId=${customerId}`),
        api(`/knowledge?customerId=${customerId}`),
        api(`/module-items?customerId=${customerId}&module=images`),
        api(`/module-items?customerId=${customerId}&module=article-manage`),
      ])
      setBundle({ realname: realname.data || {}, agent: agent.data || {}, knowledge, images, articles })
    } catch (cause) {
      setError(cause.message || '资料读取失败')
    }
  }
  useEffect(() => { load() }, [customerId])
  return { bundle, setBundle, error, reload: load }
}

function usePublicSite(customerId) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    api(`/public/site/${customerId}`).then(setData).catch((cause) => setError(cause.message || '官网读取失败'))
  }, [customerId])
  return { data, error }
}

function LoadingState({ error }) {
  return <div className="site-loading">{error ? <><CircleDot /><b>{error}</b></> : <><LoaderCircle className="spin" /><b>正在读取立身份资料</b></>}</div>
}

function AgentHeader({ view }) {
  const [, navigate] = useLocation()
  return <>
    <div className="page-heading agent-heading"><div><span className="section-kicker">VERIFIED BRAND IDENTITY</span><h1>AI 智能体</h1><p>按照摘星操作手册，配置智能体官网、品牌名片与智能客服。</p></div><span className="certified-pill"><ShieldCheck size={16} /> 身份资料已连接</span></div>
    <div className="agent-tabs">{agentTabs.map((item) => <button key={item.view} className={view === item.view ? 'active' : ''} onClick={() => navigate(item.path)}>{item.label}</button>)}</div>
  </>
}

function SourceBadge({ icon: Icon, title, value }) {
  return <div className="source-badge"><span><Icon /></span><div><b>{title}</b><em>{value}</em></div><CheckCircle2 /></div>
}

function AuxiliaryAgentPage({ view, bundle, onSaved }) {
  const customer = currentCustomer()
  const isCard = view === 'card'
  const defaults = isCard ? {
    name: customer.brand, title: '企业 GEO 顾问', phone: bundle.agent.servicePhone || '', email: 'hello@example.com', introduction: bundle.agent.welcome || '',
  } : {
    name: `${customer.brand}智能客服`, phone: bundle.agent.servicePhone || '', tone: bundle.agent.tone || '专业、清晰、可信', welcome: bundle.agent.welcome || '', scope: '企业介绍、产品服务、案例与常见问题',
  }
  const [form, setForm] = useState({ ...defaults, ...(bundle.agent[view] || {}) })
  const [saved, setSaved] = useState(false)
  const save = async (event) => {
    event.preventDefault()
    const data = { ...bundle.agent, [view]: form, tab: isCard ? '智能体名片' : '智能体客服' }
    await api('/module-settings/agent', { method: 'PUT', body: JSON.stringify({ customerId: customer.id, data }) })
    setSaved(true); onSaved(data); setTimeout(() => setSaved(false), 1800)
  }
  const fields = isCard
    ? [['name', '名片姓名'], ['title', '职位'], ['phone', '联系电话'], ['email', '联系邮箱'], ['introduction', '个人与企业介绍', 'textarea']]
    : [['name', '客服名称'], ['phone', '客服电话'], ['tone', '回答风格'], ['scope', '知识范围'], ['welcome', '欢迎语', 'textarea']]
  return <section className="settings-card auxiliary-agent-card"><div className="settings-intro"><div className="settings-icon">{isCard ? <Building2 /> : <Bot />}</div><div><h2>{isCard ? '智能体名片' : '智能体客服'}</h2><p>{isCard ? '生成可分享的品牌名片，统一企业身份与咨询入口。' : '用企业知识与统一口径承接网站访客咨询。'}</p></div><span><CheckCircle2 /> 可独立保存</span></div><form className="settings-form" onSubmit={save}>{fields.map(([key, label, kind]) => <label className={kind ? 'full' : ''} key={key}>{label}{kind ? <textarea rows="5" value={form[key] || ''} onChange={(event) => setForm({ ...form, [key]: event.target.value })} /> : <input required value={form[key] || ''} onChange={(event) => setForm({ ...form, [key]: event.target.value })} />}</label>)}<div className="settings-actions"><span className={saved ? 'save-toast show' : 'save-toast'}><CheckCircle2 /> 配置已保存</span><button className="primary-button" type="submit"><Save /> 保存配置</button></div></form></section>
}

function WebsiteBuilder({ bundle, onSaved }) {
  const customer = currentCustomer()
  const [, navigate] = useLocation()
  const initial = useMemo(() => bundle.agent.website || buildWebsiteDraft({ customer, realname: bundle.realname, agent: bundle.agent, knowledge: bundle.knowledge, images: bundle.images, articles: bundle.articles }), [bundle])
  const [draft, setDraft] = useState(initial)
  const [step, setStep] = useState(1)
  const [editing, setEditing] = useState(initial.status !== 'generated')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  const patch = (next) => setDraft((current) => ({ ...current, ...next }))
  const togglePage = (slug) => patch({ pages: draft.pages.includes(slug) ? draft.pages.filter((item) => item !== slug) : [...draft.pages, slug] })
  const generate = async () => {
    if (!draft.company.trim() || !draft.brand.trim() || !draft.introduction.trim()) return setError('企业名称、品牌名称和企业介绍不能为空')
    if (!draft.pages.length) return setError('至少保留一个网站栏目')
    setError(''); setGenerating(true)
    const website = { ...draft, heroImage: safeAssetUrl(draft.heroImage) || `${import.meta.env.BASE_URL}generated-site/zhiyan-ai-hero.png`, status: 'generated', generatedAt: new Date().toISOString() }
    const data = { ...bundle.agent, website, tab: '智能体官网', websiteDomain: website.domain, servicePhone: website.phone }
    try {
      await api('/module-settings/agent', { method: 'PUT', body: JSON.stringify({ customerId: customer.id, data }) })
      setDraft(website); onSaved(data); setEditing(false)
    } catch (cause) {
      setError(cause.message || '生成失败')
    } finally {
      setGenerating(false)
    }
  }

  if (!editing && draft.status === 'generated') return <section className="website-live-card">
    <div className="live-card-top"><div><span><Globe2 /></span><div><em>AI WEBSITE · READY</em><h2>{draft.company}</h2><p>{draft.headline}</p></div></div><strong><CheckCircle2 /> 智能体官网已生成</strong></div>
    <div className="live-site-preview" style={{ backgroundImage: `linear-gradient(90deg,rgba(3,12,28,.95),rgba(3,12,28,.25)),url("${safeAssetUrl(draft.heroImage)}")` }}><span>{draft.brand}</span><h3>{draft.headline}</h3><p>{draft.subhead}</p></div>
    <div className="live-site-meta"><dl><div><dt>网站 ID</dt><dd>{draft.siteId}</dd></div><div><dt>预览二级域名</dt><dd>{draft.previewDomain}</dd></div><div><dt>绑定域名</dt><dd>{draft.domain || '未绑定 · 当前使用预览地址'}</dd></div><div><dt>模板方案</dt><dd>{templates.find((item) => item.id === draft.theme)?.name || '深海智识'}</dd></div><div><dt>HTTPS / SSL</dt><dd className="pending">本地预览不提供证书</dd></div><div><dt>已生成页面</dt><dd>{draft.pages.length} 个</dd></div></dl><div className="live-site-actions"><button onClick={() => navigate(siteRoute(customer.id))}><ArrowUpRight /> 预览网站</button><button className="primary-button" onClick={() => navigate(adminRoute())}><Settings2 /> 管理网站</button><button onClick={() => { setEditing(true); setStep(1) }}><WandSparkles /> 重新生成</button></div></div>
  </section>

  return <section className="website-builder-card">
    <div className="builder-status"><div><span>01</span><b>读取立身份</b></div><i /><div className={step >= 2 ? 'done' : ''}><span>02</span><b>设计网站</b></div><i /><div className={step >= 3 ? 'done' : ''}><span>03</span><b>确认生成</b></div></div>
    {step === 1 && <div className="builder-step"><header><span>STEP 01 · IDENTITY INPUT</span><h2>确认企业身份与官网内容</h2><p>已自动读取实名认证、企业知识库和图片素材中心；缺少的内容可在这里补充。</p></header><div className="source-grid"><SourceBadge icon={Building2} title="实名认证" value={bundle.realname.company || customer.company} /><SourceBadge icon={FileText} title="企业知识库" value={`${bundle.knowledge.length} 条资料`} /><SourceBadge icon={ImageIcon} title="图片素材" value={`${bundle.images.length} 项素材`} /></div><div className="builder-form-grid"><label>企业名称<input value={draft.company} onChange={(event) => patch({ company: event.target.value })} /></label><label>品牌名称<input value={draft.brand} onChange={(event) => patch({ brand: event.target.value })} /></label><label>客服电话<input value={draft.phone} onChange={(event) => patch({ phone: event.target.value })} /></label><label>拟绑定域名<input value={draft.domain} onChange={(event) => patch({ domain: event.target.value })} placeholder="可暂不填写，先使用预览地址" /></label><label className="full">官网主标题<input value={draft.headline} onChange={(event) => patch({ headline: event.target.value })} /></label><label className="full">企业介绍<textarea rows="7" value={draft.introduction} onChange={(event) => patch({ introduction: event.target.value })} /></label></div></div>}
    {step === 2 && <div className="builder-step"><header><span>STEP 02 · DESIGN SYSTEM</span><h2>选择模板、主视觉与网站栏目</h2><p>换模板不会丢失企业资料；前台每个栏目都会生成独立页面。</p></header><div className="template-grid">{templates.map((item) => <button key={item.id} className={draft.theme === item.id ? 'selected' : ''} onClick={() => patch({ theme: item.id })}><span className={`template-shot theme-${item.id}`}><i /><i /><i /></span><strong>{item.name}</strong><em>{item.description}</em><span className="swatches">{item.colors.map((color) => <i key={color} style={{ background: color }} />)}</span>{draft.theme === item.id && <b><Check /> 已选择</b>}</button>)}</div><label className="hero-url-field">首页主视觉图片<input value={draft.heroImage} onChange={(event) => patch({ heroImage: event.target.value })} placeholder="填写图片链接，留空使用系统生成主视觉" /></label><div className="page-selector"><b>网站栏目</b><span>手册默认 6 个一级栏目，可修改名称与排序；当前版本先确保所有页面可打开。</span><div>{SITE_PAGES.map((page) => <button key={page.slug} className={draft.pages.includes(page.slug) ? 'selected' : ''} onClick={() => togglePage(page.slug)}><span>{draft.pages.includes(page.slug) ? <Check /> : <CircleDot />}</span>{page.label}</button>)}</div></div></div>}
    {step === 3 && <div className="builder-step builder-review"><header><span>STEP 03 · GENERATE</span><h2>生成前最后确认</h2><p>系统会保存配置，并生成可独立打开的企业官网和完整管理后台。</p></header><div className="review-grid"><div><span>企业主体</span><b>{draft.company}</b><em>{draft.brand}</em></div><div><span>内容来源</span><b>{bundle.knowledge.length + bundle.images.length} 项</b><em>知识资料 + 图片素材</em></div><div><span>模板</span><b>{templates.find((item) => item.id === draft.theme)?.name}</b><em>{draft.pages.length} 个前台页面</em></div><div><span>域名状态</span><b>{draft.domain || draft.previewDomain}</b><em>{draft.domain ? '已填写待解析域名' : '先使用本地预览地址'}</em></div></div><div className="generation-list">{['生成首页、关于、产品、新闻、图集与联系页面', '生成模板、域名、栏目、内容、SEO、城市与留言管理页', '保存到当前客户的 AI 智能体配置，后续可继续修改'].map((item) => <div key={item}><CheckCircle2 /><span>{item}</span></div>)}</div>{error && <div className="builder-error">{error}</div>}</div>}
    <footer className="builder-actions"><button disabled={step === 1 || generating} onClick={() => setStep((current) => current - 1)}><ArrowLeft /> 上一步</button>{step < 3 ? <button className="primary-button" onClick={() => setStep((current) => current + 1)}>下一步 <ChevronRight /></button> : <button className="primary-button generate-button" disabled={generating} onClick={generate}>{generating ? <><LoaderCircle className="spin" /> 正在生成网站</> : <><Sparkles /> 生成 AI 官网</>}</button>}</footer>
  </section>
}

export function AgentStudioPage({ view = 'website' }) {
  const customer = currentCustomer()
  const { bundle, setBundle, error } = useSiteBundle(customer.id)
  const updateAgent = (agent) => setBundle((current) => ({ ...current, agent }))
  return <main className="content-page agent-studio-page"><AgentHeader view={view} />{!bundle ? <LoadingState error={error} /> : view === 'website' ? <WebsiteBuilder bundle={bundle} onSaved={updateAgent} /> : <AuxiliaryAgentPage view={view} bundle={bundle} onSaved={updateAgent} />}</main>
}

function SiteHeader({ website, customerId, page, navigate }) {
  return <><div className="site-preview-bar"><span><Sparkles /> AI先行者 · 官网预览</span><button onClick={() => navigate(adminRoute())}><Settings2 /> 返回管理后台</button></div><header className={`generated-site-header theme-${website.theme}`}><button className="site-logo" onClick={() => navigate(siteRoute(customerId))}>{website.logoImage ? <img src={safeAssetUrl(website.logoImage)} alt={website.brand} /> : <span>{website.brand.slice(0, 2)}</span>}<div><b>{website.brand}</b><em>{website.company}</em></div></button><nav>{SITE_PAGES.filter((item) => website.pages.includes(item.slug)).map((item) => <button className={page === item.slug ? 'active' : ''} key={item.slug} onClick={() => navigate(siteRoute(customerId, item.slug))}>{item.label}</button>)}</nav><a href={`tel:${website.phone}`}><Phone /> <span>服务热线<em>{website.phone}</em></span></a></header></>
}

function ContactForm({ customerId, website }) {
  const [form, setForm] = useState({ name: '', phone: '', need: '' })
  const [sent, setSent] = useState(false)
  const submit = (event) => {
    event.preventDefault()
    const key = `ai_pioneer_site_messages_${customerId}`
    const messages = JSON.parse(localStorage.getItem(key) || '[]')
    messages.unshift({ ...form, id: Date.now(), createdAt: new Date().toISOString(), status: '待跟进' })
    localStorage.setItem(key, JSON.stringify(messages)); setSent(true)
  }
  return <form className="public-contact-form" onSubmit={submit}><span>ONLINE MESSAGE</span><h2>告诉我们你的业务问题</h2>{sent ? <div className="message-success"><CheckCircle2 /><b>留言已保存</b><p>可在官网管理后台的“在线留言”页面查看。</p></div> : <><label>姓名<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>联系电话<input required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label><label>咨询内容<textarea required rows="5" value={form.need} onChange={(event) => setForm({ ...form, need: event.target.value })} /></label><button>提交留言 <ArrowUpRight /></button></>}<p>{website.company} · {website.phone}</p></form>
}

function SitePageBody({ page, website, customerId, articles }) {
  const [, navigate] = useLocation()
  if (page === 'home') return <><section className="public-hero" style={{ backgroundImage: `linear-gradient(90deg,rgba(3,12,28,.96) 0%,rgba(3,12,28,.72) 42%,rgba(3,12,28,.1) 100%),url("${safeAssetUrl(website.heroImage)}")` }}><div><span>TRUSTED KNOWLEDGE · AI VISIBILITY</span><h1>{website.headline}</h1><p>{website.subhead}</p><div><button onClick={() => navigate(siteRoute(customerId, 'products'))}>了解核心服务 <ArrowUpRight /></button><button onClick={() => navigate(siteRoute(customerId, 'contact'))}>预约沟通</button></div></div></section><section className="public-intro"><div><span>ABOUT THE BRAND</span><h2>可信身份，是进入 AI 答案的第一步</h2></div><p>{website.introduction}</p></section><section className="public-services">{website.products.slice(0, 3).map((item, index) => <article key={item.title}><span>0{index + 1}</span><h3>{item.title}</h3><p>{item.description}</p><button onClick={() => navigate(siteRoute(customerId, 'products'))}>查看服务 <ChevronRight /></button></article>)}</section></>
  if (page === 'about') return <section className="public-page"><header><span>ABOUT US</span><h1>关于 {website.brand}</h1><p>{website.subhead}</p></header><div className="about-layout"><article><h2>{website.company}</h2><p>{website.introduction}</p><p>我们把企业主体、产品服务、案例证据与常见问题整理为长期可维护的数字资产，让客户在传统搜索和生成式 AI 搜索中都能找到准确、可信的信息。</p></article><aside>{[['6', '官网栏目'], [String(website.products.length), '核心服务'], [String(website.faqs.length), '标准问答'], ['24h', '内容可更新']].map(([value, label]) => <div key={label}><b>{value}</b><span>{label}</span></div>)}</aside></div></section>
  if (page === 'products') return <section className="public-page"><header><span>PRODUCTS & SERVICES</span><h1>产品与服务</h1><p>从品牌身份到内容资产，再到信源与数据回查，形成完整的 GEO 增长闭环。</p></header><div className="product-public-grid">{website.products.map((item, index) => <article key={`${item.title}-${index}`}><span>{String(index + 1).padStart(2, '0')}</span><h2>{item.title}</h2><p>{item.description}</p><button onClick={() => navigate(siteRoute(customerId, 'contact'))}>咨询方案 <ArrowUpRight /></button></article>)}</div></section>
  if (page === 'news') { const rows = articles.length ? articles.map((item) => ({ title: item.title, summary: item.detail, date: item.updated_at?.slice(0, 10) || item.created_at?.slice(0, 10) })) : website.news; return <section className="public-page"><header><span>NEWS & INSIGHTS</span><h1>新闻资讯</h1><p>持续更新企业动态、行业洞察与 GEO 实践内容。</p></header><div className="news-public-list">{rows.map((item, index) => <article key={`${item.title}-${index}`}><time>{item.date || '2026-08-12'}</time><div><h2>{item.title}</h2><p>{item.summary}</p></div><ArrowUpRight /></article>)}</div></section> }
  if (page === 'gallery') return <section className="public-page"><header><span>BRAND GALLERY</span><h1>企业图集</h1><p>品牌视觉、业务路径与企业知识资产的统一展示。</p></header><div className="gallery-public-grid">{website.gallery.map((item, index) => <article key={`${item.title}-${index}`} style={item.image ? { backgroundImage: `url("${safeAssetUrl(item.image)}")` } : {}}><div><span>0{index + 1}</span><h2>{item.title}</h2><p>{item.description}</p></div></article>)}</div></section>
  return <section className="public-page contact-public-page"><header><span>CONTACT</span><h1>联系我们</h1><p>从一个真实业务问题开始，建立企业在 AI 搜索中的可信存在。</p></header><div className="contact-public-layout"><aside><MapPinned /><h2>{website.company}</h2><dl><div><dt>咨询电话</dt><dd>{website.phone}</dd></div><div><dt>联系地址</dt><dd>{website.address}</dd></div><div><dt>品牌名称</dt><dd>{website.brand}</dd></div></dl></aside><ContactForm customerId={customerId} website={website} /></div></section>
}

export function GeneratedSitePage({ customerId, page = 'home' }) {
  const [, navigate] = useLocation()
  const { data, error } = usePublicSite(customerId)
  if (!data) return <main className="generated-site"><LoadingState error={error} /></main>
  const website = data.website
  const safePage = website.pages.includes(page) ? page : website.pages[0] || 'home'
  return <main className={`generated-site public-theme-${website.theme}`}><SiteHeader website={website} customerId={customerId} page={safePage} navigate={navigate} /><SitePageBody page={safePage} website={website} customerId={customerId} articles={data.articles} /><footer className="generated-site-footer"><div><b>{website.brand}</b><p>{website.company}</p></div><span>企业可信数字资产 · AI先行者智能体官网</span><em>{website.icp || '本地预览 · 暂未绑定备案域名'}</em></footer></main>
}

function linesToObjects(value, first, second) {
  return String(value).split('\n').map((line) => line.trim()).filter(Boolean).map((line) => { const [a, ...rest] = line.split('|'); return { [first]: a.trim(), [second]: rest.join('|').trim() } })
}

function objectsToLines(rows, first, second) {
  return (rows || []).map((item) => `${item[first] || ''}|${item[second] || ''}`).join('\n')
}

function AdminEditor({ section, draft, setDraft, bundle, customerId }) {
  const patch = (next) => setDraft((current) => ({ ...current, ...next }))
  if (section.slug === 'overview') return <div className="admin-overview-grid">{[
    [Globe2, '前台页面', `${draft.pages.length} 个页面可访问`], [LayoutTemplate, '当前模板', templates.find((item) => item.id === draft.theme)?.name], [FileText, '内容资产', `${bundle.knowledge.length + bundle.articles.length} 条`], [MapPinned, '城市分站', draft.city.enabled ? `${draft.city.cities.length} 个已配置` : '尚未开启'],
  ].map(([Icon, title, value]) => <article key={title}><Icon /><span>{title}</span><b>{value}</b></article>)}</div>
  if (section.slug === 'templates') return <div className="admin-template-list">{templates.map((item) => <button className={draft.theme === item.id ? 'selected' : ''} key={item.id} onClick={() => patch({ theme: item.id })}><span className={`template-shot theme-${item.id}`}><i /><i /><i /></span><b>{item.name}</b><em>{item.description}</em>{draft.theme === item.id && <CheckCircle2 />}</button>)}</div>
  if (section.slug === 'navigation') return <div className="admin-check-list">{SITE_PAGES.map((page, index) => <label key={page.slug}><span>{index + 1}</span><b>{page.label}</b><em>/{page.slug}</em><input type="checkbox" checked={draft.pages.includes(page.slug)} onChange={() => patch({ pages: draft.pages.includes(page.slug) ? draft.pages.filter((item) => item !== page.slug) : [...draft.pages, page.slug] })} /></label>)}</div>
  if (section.slug === 'messages') {
    const messages = JSON.parse(localStorage.getItem(`ai_pioneer_site_messages_${customerId}`) || '[]')
    return <div className="admin-message-list">{messages.length ? messages.map((item) => <article key={item.id}><MessageSquareText /><div><b>{item.name} · {item.phone}</b><p>{item.need}</p><span>{item.createdAt.slice(0, 16).replace('T', ' ')} · {item.status}</span></div></article>) : <div className="admin-empty"><MessageSquareText /><b>暂无在线留言</b><p>前台“联系我们”页面提交的留言会显示在这里。</p></div>}</div>
  }
  if (section.slug === 'products' || section.slug === 'news' || section.slug === 'faq' || section.slug === 'images' || section.slug === 'geo-articles' || section.slug === 'links') {
    const mapping = {
      products: ['products', 'title', 'description', '产品名称|产品说明'], news: ['news', 'title', 'summary', '新闻标题|新闻摘要'], faq: ['faqs', 'question', 'answer', '问题|答案'], images: ['gallery', 'title', 'description', '图片名称|图片说明'], 'geo-articles': ['news', 'title', 'summary', '文章标题|文章摘要'], links: ['links', 'name', 'url', '站点名称|https://example.com'],
    }[section.slug]
    const [key, first, second, placeholder] = mapping
    return <label className="admin-textarea-editor"><span>每行一项，使用竖线分隔</span><textarea rows="14" value={objectsToLines(draft[key], first, second)} onChange={(event) => patch({ [key]: linesToObjects(event.target.value, first, second) })} placeholder={placeholder} /></label>
  }
  if (section.slug === 'city-keywords' || section.slug === 'city-list') {
    const key = section.slug === 'city-keywords' ? 'keywords' : 'cities'
    return <label className="admin-textarea-editor"><span>{key === 'keywords' ? '每行一个关键词，建议 10-200 个，不包含地区词' : '每行一个城市，保存后生成对应分站配置'}</span><textarea rows="14" value={(draft.city[key] || []).join('\n')} onChange={(event) => patch({ city: { ...draft.city, [key]: event.target.value.split('\n').map((item) => item.trim()).filter(Boolean) } })} /></label>
  }
  if (section.slug === 'seo-keywords') return <div className="admin-form-grid"><label>主关键词（逗号分隔）<input value={draft.seo.primary.join('，')} onChange={(event) => patch({ seo: { ...draft.seo, primary: event.target.value.split(/[，,]/).map((item) => item.trim()).filter(Boolean) } })} /></label><label>辅助关键词（逗号分隔）<input value={draft.seo.secondary.join('，')} onChange={(event) => patch({ seo: { ...draft.seo, secondary: event.target.value.split(/[，,]/).map((item) => item.trim()).filter(Boolean) } })} /></label><div className="admin-tip"><ShieldCheck /> 至少填写 3 个主关键词和 1 个辅助关键词，用于首页 TDK。</div></div>
  if (section.slug === 'city-settings') return <div className="admin-form-grid"><label className="switch-field">是否开启城市分站<input type="checkbox" checked={draft.city.enabled} onChange={(event) => patch({ city: { ...draft.city, enabled: event.target.checked } })} /></label><label>公司简称<input value={draft.city.shortName} onChange={(event) => patch({ city: { ...draft.city, shortName: event.target.value } })} /></label><label>分站绑定域名<input value={draft.city.domain} onChange={(event) => patch({ city: { ...draft.city, domain: event.target.value } })} /></label></div>
  const fields = {
    domain: [['domain', '拟绑定顶级域名'], ['previewDomain', '预览二级域名']],
    hero: [['headline', '首页主标题'], ['subhead', '首页副标题'], ['heroImage', '轮播主视觉图片']],
    settings: [['logoImage', '网站 Logo 图片'], ['icp', '工信部备案号'], ['policeRecord', '公安备案号'], ['headVerify', 'Head 验证代码'], ['analytics', '统计代码']],
    company: [['company', '企业名称'], ['brand', '品牌名称'], ['phone', '联系电话'], ['address', '联系地址'], ['introduction', '企业介绍', 'textarea']],
    content: [['introduction', '关于我们正文', 'textarea'], ['subhead', '网站统一价值说明', 'textarea']],
  }[section.slug] || []
  return <div className="admin-form-grid">{fields.map(([key, label, kind]) => <label className={kind ? 'full' : ''} key={key}>{label}{kind ? <textarea rows="8" value={draft[key] || ''} onChange={(event) => patch({ [key]: event.target.value })} /> : <input value={draft[key] || ''} onChange={(event) => patch({ [key]: event.target.value })} />}</label>)}</div>
}

export function SiteAdminPage({ sectionSlug = 'overview' }) {
  const customer = currentCustomer()
  const [, navigate] = useLocation()
  const { bundle, setBundle, error } = useSiteBundle(customer.id)
  const section = findAdminSection(sectionSlug)
  const [draft, setDraft] = useState(null)
  const [saved, setSaved] = useState(false)
  useEffect(() => { if (bundle) setDraft(bundle.agent.website || buildWebsiteDraft({ customer, realname: bundle.realname, agent: bundle.agent, knowledge: bundle.knowledge, images: bundle.images, articles: bundle.articles })) }, [bundle])
  if (!bundle || !draft) return <main className="content-page"><LoadingState error={error} /></main>
  const save = async () => {
    const website = { ...draft, status: 'generated', updatedAt: new Date().toISOString() }
    const data = { ...bundle.agent, website }
    await api('/module-settings/agent', { method: 'PUT', body: JSON.stringify({ customerId: customer.id, data }) })
    setDraft(website); setBundle({ ...bundle, agent: data }); setSaved(true); setTimeout(() => setSaved(false), 1700)
  }
  const groups = [...new Set(ADMIN_SECTIONS.map((item) => item.group))]
  return <main className="content-page site-admin-page"><div className="site-admin-heading"><div><button onClick={() => navigate('/geo/agent')}><ArrowLeft /> 返回智能体官网</button><span>AI WEBSITE CONTROL CENTER</span><h1>{draft.brand} · 官网管理</h1></div><div><button onClick={() => navigate(siteRoute(customer.id))}><ArrowUpRight /> 预览网站</button><button className="primary-button" onClick={save}><Save /> {saved ? '已保存' : '保存修改'}</button></div></div><div className="site-admin-shell"><aside>{groups.map((group) => <section key={group}><b>{group}</b>{ADMIN_SECTIONS.filter((item) => item.group === group).map((item) => <button className={section.slug === item.slug ? 'active' : ''} key={item.slug} onClick={() => navigate(adminRoute(item.slug))}>{item.label}<ChevronRight /></button>)}</section>)}</aside><section className="site-admin-content"><header><span>{section.group}</span><h2>{section.label}</h2><p>{section.slug === 'overview' ? '网站已根据立身份资料生成，所有前台和管理页面均可独立访问。' : '修改后点击右上角“保存修改”，前台网站会立即使用新配置。'}</p></header><AdminEditor section={section} draft={draft} setDraft={setDraft} bundle={bundle} customerId={customer.id} /></section></div></main>
}

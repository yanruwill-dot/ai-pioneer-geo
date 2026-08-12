import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Redirect, Route, Router, Switch, useLocation } from 'wouter'
import { useHashLocation } from 'wouter/use-hash-location'
import {
  BadgeCheck,
  BarChart3,
  Bell,
  BookOpenText,
  Bot,
  Boxes,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleUserRound,
  Database,
  FileChartColumn,
  Gauge,
  Globe2,
  Image as ImageIcon,
  KeyRound,
  Layers3,
  LogOut,
  Menu,
  PanelLeftClose,
  Play,
  Plus,
  Save,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  UsersRound,
  WandSparkles,
  X,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api, authStore, currentCustomer, isStaticDemo, setCurrentCustomer } from './api.js'
import { crmTitleFor } from './crmData.js'
import { CaseCockpitPage } from './CaseCockpitPage.jsx'
import { CrmCases, CrmFinance, CrmOrders, CrmOverview } from './crmPages.jsx'
import { EvidenceSnapshotPage } from './EvidenceSnapshotPage.jsx'
import { EVIDENCE_RETURN_STORAGE_KEY, safeHttpUrl, snapshotRoute } from './evidence.js'
import { AgentStudioPage, GeneratedSitePage, SiteAdminPage } from './WebsiteStudio.jsx'

const AuthContext = createContext(null)

function Brand({ compact = false, crm = false }) {
  return (
    <div className={`brand ${compact ? 'compact' : ''}`}>
      <div className="brand-mark"><i /><i /><i /></div>
      {!compact && <div><b>AI先行者</b><span>{crm ? '合作商业务管理' : '全域 AI 搜索'}</span></div>}
    </div>
  )
}

function LoginPage() {
  const [, navigate] = useLocation()
  const { setUser } = useContext(AuthContext)
  const [form, setForm] = useState({ username: 'yanru', password: '123456' })
  const [loginMode, setLoginMode] = useState('account')
  const [agreed, setAgreed] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    if (!agreed) return setError('请先同意平台隐私政策与用户服务协议')
    if (loginMode === 'sms') return setError('演示环境暂未接入短信验证码，请切换到账号登录')
    setLoading(true)
    setError('')
    try {
      const result = await api('/auth/login', { method: 'POST', body: JSON.stringify(form) })
      authStore.set(result.token)
      setUser(result.user)
      navigate('/crm/customers')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <div className="login-aurora one" /><div className="login-aurora two" />
      <section className="login-story">
        <div className="brand-line"><Brand /><span className="brand-divider" /><span className="research-badge">CBAI<br /><small>中国商业研究中心</small></span></div>
        <div className="login-headline">
          <p className="eyebrow">AI PIONEER · GENERATIVE ENGINE OPTIMIZATION</p>
          <h1>AI先行者·全域AI<br />搜索</h1>
          <h2>搜索无界&nbsp; 全域共生</h2>
          <span className="model-pill">大模型搜索 + 平台 AI 搜索</span>
        </div>
        <div className="orbital-logo"><span>AI</span></div>
      </section>
      <section className="login-panel-wrap">
        <form className="login-panel" onSubmit={submit}>
          <div className="login-tabs"><button type="button" className={loginMode === 'account' ? 'active' : ''} onClick={() => { setLoginMode('account'); setError('') }}>账号登录</button><button type="button" className={loginMode === 'sms' ? 'active' : ''} onClick={() => { setLoginMode('sms'); setError('') }}>短信登录</button></div>
          <label className="field"><CircleUserRound size={20} /><input aria-label="账号" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="请输入账号" /></label>
          <label className="field"><KeyRound size={20} /><input aria-label="密码" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="请输入密码" /></label>
          <div className="remember-row"><label><input type="checkbox" /> 记住密码</label><button type="button" onClick={() => navigate('/support/forgot-password')}>忘记密码</button></div>
          {error && <div className="form-error">{error}</div>}
          <button className="gradient-button" type="submit" disabled={loading}>{loading ? '正在进入…' : '登录'}</button>
          <label className="agree"><input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} /><span>我已阅读并同意 《平台隐私政策》 与 《平台用户服务协议》</span></label>
          {isStaticDemo && <div className="public-demo-note"><Globe2 size={15} /><span>GitHub Pages 演示版 · 操作数据只保存在当前浏览器</span></div>}
          <div className="register-hint">没有注册？ <button type="button" onClick={() => navigate('/register')}>点击注册</button></div>
        </form>
      </section>
    </main>
  )
}

function Modal({ open, onClose, title, children, wide = false }) {
  if (!open) return null
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'wide' : ''}`}>
        <div className="modal-title"><div><span>AI先行者工作台</span><h3>{title}</h3></div><button aria-label="关闭" onClick={onClose}><X /></button></div>
        {children}
      </div>
    </div>
  )
}

function Topbar({ crm = false, crmTitle = '客户管理', onMenu }) {
  const { user, logout } = useContext(AuthContext)
  const [, navigate] = useLocation()
  return (
    <header className="topbar">
      <button className="mobile-menu" aria-label="打开导航菜单" onClick={onMenu}><Menu /></button>
      <div className="topbar-breadcrumb"><span>{crm ? '合作商业务管理' : currentCustomer().brand}</span><ChevronRight size={14} /><b>{crm ? crmTitle : 'GEO 运营中台'}</b></div>
      {isStaticDemo && <span className="demo-mode-badge"><Globe2 size={13} /> 浏览器演示数据</span>}
      <div className="topbar-actions"><button title="消息" aria-label="消息" onClick={() => navigate('/messages')}><Bell size={19} /><i /></button><div className="avatar">{user?.name?.slice(0, 1) || 'AI'}</div><div className="user-copy"><b>{user?.name}</b><span>{user?.role}</span></div><button title="退出登录" aria-label="退出登录" onClick={logout}><LogOut size={18} /></button></div>
    </header>
  )
}

const crmNav = [
  [Gauge, '工作台', '/crm/overview'], [UsersRound, '客户管理', '/crm/customers'], [Target, '订单管理', '/crm/orders'], [FileChartColumn, '财务流水', '/crm/finance'], [BookOpenText, 'GEO 案例', '/crm/cases'],
]

function CrmShell({ children }) {
  const [open, setOpen] = useState(false)
  const [location, navigate] = useLocation()
  const crmTitle = crmTitleFor(location)
  return (
    <div className="app-shell crm-shell">
      <aside className={`sidebar crm-sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-brand"><Brand crm /></div>
        <nav>{crmNav.map(([Icon, name, path]) => <button className={location === path ? 'active' : ''} key={name} onClick={() => { navigate(path); setOpen(false) }}><Icon size={19} /><span>{name}</span>{location === path && <i />}</button>)}</nav>
        <button className="sidebar-foot" onClick={() => navigate('/settings')}><Settings2 size={18} /><span>系统设置</span></button>
      </aside>
      <div className="app-main"><Topbar crm crmTitle={crmTitle} onMenu={() => setOpen(!open)} />{children}</div>
    </div>
  )
}

function CrmCustomers() {
  const [, navigate] = useLocation()
  const [customers, setCustomers] = useState([])
  const [launch, setLaunch] = useState(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ company: '', brand: '', account: '', city: '' })
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('全部客户')
  const load = () => api('/crm/customers').then(setCustomers)
  useEffect(() => { load() }, [])

  const createCustomer = async (event) => {
    event.preventDefault()
    await api('/crm/customers', { method: 'POST', body: JSON.stringify(form) })
    setAdding(false); setForm({ company: '', brand: '', account: '', city: '' }); load()
  }
  const enterGeo = async () => {
    const result = await api(`/crm/customers/${launch.id}/enter-geo`, { method: 'POST' })
    setCurrentCustomer(result.customer)
    navigate(result.redirect)
  }
  const visible = customers.filter((item) => {
    const matchesQuery = `${item.company}${item.brand}${item.account}`.toLowerCase().includes(query.toLowerCase())
    const matchesStatus = statusFilter === '全部客户' || (statusFilter === '待跟进' && item.status === '待配置') || (statusFilter === '已到期' && item.status === '已到期')
    return matchesQuery && matchesStatus
  })
  const primaryCustomer = customers.find((item) => item.id === currentCustomer().id) || customers.find((item) => item.status === '服务中') || customers[0]

  return (
    <main className="content-page crm-content">
      <div className="page-heading"><div><span className="section-kicker">CUSTOMER RELATIONSHIP MANAGEMENT</span><h1>客户管理</h1><p>选择客户后进入完整的 GEO 运营工作台。</p></div><div className="heading-actions"><button className="geo-launch-button" disabled={!primaryCustomer} onClick={() => setLaunch(primaryCustomer)}><Sparkles size={18} /> 进入 GEO 工作台 <ChevronRight size={17} /></button><button className="primary-button secondary-create" onClick={() => setAdding(true)}><Plus size={18} /> 新建客户</button></div></div>
      <section className="geo-entry-banner"><div className="geo-entry-icon"><Sparkles /></div><div><span>GEO 已开通</span><h2>从客户管理进入 AI 搜索运营平台</h2><p>可使用关键词、知识库、内容创作、全域发布和 AI 搜索数据报表。</p></div><button onClick={() => setLaunch(primaryCustomer)} disabled={!primaryCustomer}>选择客户进入 GEO <ChevronRight size={17} /></button></section>
      <div className="stat-strip">
        <div><span>客户总数</span><b>{customers.length}</b><small>家</small></div>
        <div><span>服务中</span><b>{customers.filter((c) => c.status === '服务中').length}</b><small>家</small></div>
        <div><span>GEO 已开通</span><b>{customers.filter((c) => c.product === 'GEO').length}</b><small>个</small></div>
        <div><span>本月新增</span><b>2</b><small>家</small></div>
      </div>
      <section className="data-card">
        <div className="data-toolbar"><div className="search-box"><Search size={17} /><input placeholder="搜索客户名称、品牌或账号" value={query} onChange={(e) => setQuery(e.target.value)} /></div><div className="table-tabs">{['全部客户', '待跟进', '已到期'].map((item) => <button key={item} className={statusFilter === item ? 'active' : ''} onClick={() => setStatusFilter(item)}>{item}</button>)}</div></div>
        <div className="table-scroll"><table><thead><tr><th>客户名称 / 品牌</th><th>登录账号</th><th>所属城市</th><th>产品</th><th>客户状态</th><th>创建时间</th><th>操作</th></tr></thead><tbody>{visible.map((customer) => <tr key={customer.id}><td><div className="company-cell"><span>{customer.brand.slice(0, 1)}</span><div><b>{customer.company}</b><small>{customer.brand}</small></div></div></td><td>{customer.account}</td><td>{customer.city || '-'}</td><td><span className="tag blue">{customer.product}</span></td><td><span className={`status-dot ${customer.status === '服务中' ? 'success' : ''}`}>{customer.status}</span></td><td>{customer.created_at?.slice(0, 10)}</td><td><button className="geo-row-action" aria-label={`进入 ${customer.brand} 的 GEO 工作台`} onClick={() => setLaunch(customer)}><CircleUserRound size={17} /><span>进入 GEO</span><ChevronRight size={15} /></button></td></tr>)}</tbody></table></div>
      </section>
      <Modal open={!!launch} onClose={() => setLaunch(null)} title={`进入 ${launch?.brand || ''}`} wide>
        <p className="modal-copy">选择要进入的业务平台。GEO 将带入该客户身份和数据权限。</p>
        <div className="product-grid">
          <button className="product-card active" onClick={enterGeo}><div className="product-icon"><Sparkles /></div><div><b>GEO 工作台</b><span>全域 AI 搜索营销 · 点击进入</span></div><ChevronRight /></button>
          <button className="product-card" onClick={() => { setLaunch(null); navigate('/geo/video-seo') }}><div className="product-icon"><Play /></div><div><b>短视频 SEO</b><span>视频搜索与分发</span></div><span className="soon">查看入口</span></button>
          <button className="product-card" onClick={() => { setLaunch(null); navigate('/geo/seo') }}><div className="product-icon"><Globe2 /></div><div><b>搜索引擎 SEO</b><span>传统搜索增长</span></div><span className="soon">查看入口</span></button>
        </div>
      </Modal>
      <Modal open={adding} onClose={() => setAdding(false)} title="新建客户">
        <form className="modal-form" onSubmit={createCustomer}>
          <label>公司名称<input required value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></label>
          <label>品牌名称<input required value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} /></label>
          <label>登录账号<input required value={form.account} onChange={(e) => setForm({ ...form, account: e.target.value })} /></label>
          <label>所属城市<input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></label>
          <div className="form-actions"><button type="button" onClick={() => setAdding(false)}>取消</button><button className="primary-button" type="submit">创建客户</button></div>
        </form>
      </Modal>
    </main>
  )
}

const geoNav = [
  { icon: Gauge, label: '首页', path: '/geo/dashboard' },
  { icon: BadgeCheck, label: '立身份', children: [{ label: '团队管理', path: '/geo/team' }, { label: '实名认证', path: '/geo/realname' }, { label: 'AI 智能体', path: '/geo/agent' }] },
  { icon: Database, label: '建资产', children: [{ label: '关键词营销定位', path: '/geo/keywords' }, { label: '企业知识库', path: '/geo/knowledge' }, { label: '转化目标', path: '/geo/targets' }, { label: '图片素材中心', path: '/geo/images' }, { label: '视频脚本创作', path: '/geo/video-script' }, { label: '视频模板与素材', path: '/geo/templates' }] },
  { icon: Layers3, label: '布信源', children: [{ label: '账号与授权', path: '/geo/account-auth' }, { label: '提示词中心', path: '/geo/prompts' }, { label: '文章批量创作', path: '/geo/article-batch' }, { label: '文章管理', path: '/geo/article-manage' }, { label: '自动化任务', path: '/geo/automations' }, { label: '执行日志', path: '/geo/automation-logs' }, { label: '分站管理入口', path: '/geo/stations' }, { label: '分站菜单设置', path: '/geo/station-menu' }, { label: '分站资料设置', path: '/geo/station-profile' }, { label: '城市分站设置', path: '/geo/station-cities' }, { label: '分站产品与服务', path: '/geo/station-products' }, { label: '视频创作与发布', path: '/geo/video-create' }, { label: '视频管理', path: '/geo/video-manage' }] },
  { icon: Send, label: '发全域', children: [{ label: '文章发布队列', path: '/geo/publish' }, { label: '文章发布记录', path: '/geo/records' }, { label: '视频发布记录', path: '/geo/video-records' }] },
  { icon: BarChart3, label: '盯数据', children: [{ label: 'AI搜索营销报表', path: '/geo/report' }, { label: 'AI搜索竞争力分析报告', path: '/geo/competition' }] },
]

function GeoShell({ children }) {
  const [location, navigate] = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobile, setMobile] = useState(false)
  const [opened, setOpened] = useState(() => new Set())
  useEffect(() => {
    const currentGroup = geoNav.find((item) => item.children?.some((child) => child.path === location || (child.path === '/geo/agent' && (location.startsWith('/geo/agent/') || location.startsWith('/geo/site-admin/')))))
    setOpened(currentGroup ? new Set([currentGroup.label]) : new Set())
  }, [location])
  const toggle = (label) => setOpened((prev) => {
    const next = new Set(prev); next.has(label) ? next.delete(label) : next.add(label); return next
  })
  return (
    <div className={`app-shell geo-shell ${collapsed ? 'is-collapsed' : ''}`}>
      <aside className={`sidebar geo-sidebar ${mobile ? 'open' : ''}`}>
        <div className="sidebar-brand"><Brand compact={collapsed} /><button onClick={() => setCollapsed(!collapsed)}><PanelLeftClose size={18} /></button></div>
        <nav>{geoNav.map((item) => {
          const active = item.path ? location === item.path : item.children?.some((child) => location === child.path || (child.path === '/geo/agent' && (location.startsWith('/geo/agent/') || location.startsWith('/geo/site-admin/'))))
          const isOpen = opened.has(item.label)
          const Icon = item.icon
          return <div className="nav-group" key={item.label}><button className={active ? 'active' : ''} onClick={() => item.path ? navigate(item.path) : toggle(item.label)}><Icon size={19} /><span>{item.label}</span>{item.children && (isOpen ? <ChevronDown className="chev" size={15} /> : <ChevronRight className="chev" size={15} />)}</button>{item.children && isOpen && !collapsed && <div className="subnav">{item.children.map((child) => <button className={location === child.path ? 'active' : ''} onClick={() => { navigate(child.path); setMobile(false) }} key={child.path}>{child.label}</button>)}</div>}</div>
        })}</nav>
        <button className="back-crm" onClick={() => navigate('/crm/customers')}><CircleUserRound size={18} /><span>返回 CRM</span></button>
      </aside>
      <div className="app-main"><Topbar onMenu={() => setMobile(!mobile)} />{children}</div>
    </div>
  )
}

function MetricCard({ icon: Icon, label, value, suffix, color, detail }) {
  return <div className="metric-card" style={{ '--metric': color }}><div className="metric-icon"><Icon /></div><div className="metric-copy"><span>{label}</span><div><b>{value ?? '-'}</b><small>{suffix}</small></div><em>{detail}</em></div></div>
}

function RateCard({ icon: Icon, label, value, baseline, delta: change, definition, samples, color }) {
  const positive = change >= 0
  return <article className="rate-card" style={{ '--rate-color': color }}>
    <div className="rate-card-head"><span className="rate-icon"><Icon size={18} /></span><span>{label}</span><small>{samples} 个样本</small></div>
    <div className="rate-card-value"><b>{value}%</b><span className={positive ? 'up' : 'down'}>{positive ? '↑' : '↓'} {Math.abs(change)} 个百分点</span></div>
    <div className="rate-card-compare"><span>基线 {baseline}%</span><div><i style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div><span>当前 {value}%</span></div>
    <p>{definition}</p>
  </article>
}

function GeoDashboard() {
  const customer = currentCustomer()
  const [, navigate] = useLocation()
  const [data, setData] = useState(null)
  const load = () => api(`/dashboard?customerId=${customer.id}`).then(setData)
  useEffect(() => { load() }, [customer.id])
  if (!data) return <div className="page-loader"><Sparkles /> 正在汇总 GEO 数据</div>
  const pieData = data.platformStats.map((item) => ({ name: item.platform, value: item.mentions }))
  const colors = ['#315ff4', '#6e71fc', '#9d66f5', '#ff835d', '#16b77a']
  const guide = [
    ['立身份', '让AI认识你', '建立可信数字身份'],
    ['建资产', '让AI了解你', '构建结构化数字资产'],
    ['布信源', '让AI相信你', '权威信源背书'],
    ['发全域', '让AI推荐你', '全域内容分发'],
    ['盯数据', '让AI提升你', '数据与分析报表'],
  ]
  return (
    <main className="content-page dashboard-page">
      <div className="geo-home-grid">
        <section className="guide-card"><div className="home-card-title"><WandSparkles size={18} /><b>AI搜索营销指引</b></div><div className="guide-steps">{guide.map(([name, promise, desc], index) => <div key={name}><div className="guide-icon"><span>{String(index + 1).padStart(2, '0')}</span></div><h3>{String(index + 1).padStart(2, '0')} {name}</h3><b>{promise}</b><p>{desc}</p></div>)}</div></section>
        <aside className="home-aside"><section className="company-summary"><div className="company-avatar">公司</div><div><b>{customer.company}</b><span>团队名：{customer.brand}</span></div><em><BadgeCheck size={14} /> 已认证</em></section><section className="package-summary"><div className="home-card-title"><Boxes size={17} /><b>套餐资源剩余</b></div>{[['媒体发布（篇）', '0 / 5000', 0], ['平台发布（篇）', '0 / 3500', 0], ['视频发布（条）', '0 / 500', 0]].map(([name, value, percent]) => <div className="package-row" key={name}><span>{name}</span><b>{value}</b><div><i style={{ width: `${percent}%` }} /></div></div>)}<div className="package-expiry"><span>套餐有效期至</span><b>2027-08-03</b></div></section></aside>
      </div>
      <section className="report-entry-card"><div className="home-card-title"><FileChartColumn size={18} /><b>数据报表</b></div><div className="report-entry-grid">
        <button onClick={() => navigate('/geo/report')}><span className="report-entry-icon blue"><Search /></span><span><b>AI搜索排名</b><em>AI搜索营销报表</em></span><ChevronRight /></button>
        <button onClick={() => navigate('/geo/competition')}><span className="report-entry-icon purple"><BarChart3 /></span><span><b>行业竞争力</b><em>AI搜索竞争力分析</em></span><ChevronRight /></button>
        <button onClick={() => navigate('/geo/report')}><span className="report-entry-icon coral"><Bell /></span><span><b>舆情监测</b><em>品牌倾向与引用明细</em></span><ChevronRight /></button>
      </div></section>
      <div className="dashboard-heading"><div><span className="section-kicker">DATA OVERVIEW · 可追溯指标</span><h2>AI 搜索效果</h2><p className="dashboard-period">样本周期：{data.dateRange.from || '-'} 至 {data.dateRange.to || '-'} · 当前周期 {data.currentPeriod.samples} 条 / 基线周期 {data.baselinePeriod.samples} 条</p></div><div className="dashboard-heading-right"><div className="hero-score"><div className="score-ring" style={{ '--score': `${data.visibilityRate * 3.6}deg` }}><span><b>{data.visibilityRate}</b><small>当前提及率</small></span></div><div><b>数据健康</b><span>{data.samples} 条采样，指标可回查</span></div></div><button className="filter-button" onClick={load}>刷新数据</button></div></div>
      <div className="rate-grid">
        <RateCard icon={Sparkles} label="AI 提及率" value={data.mentionRate} baseline={data.baselineMentionRate} delta={data.mentionRateDelta} samples={data.currentPeriod.samples} color="#315ff4" definition="品牌在 AI 回答中被明确提及的采样占比。" />
        <RateCard icon={Target} label="被引用概率" value={data.citationProbability} baseline={data.baselineCitationProbability} delta={data.citationProbabilityDelta} samples={data.currentPeriod.mentions} color="#16b77a" definition="在已提及品牌的回答中，出现官网或可验证信源的概率。" />
        <RateCard icon={FileChartColumn} label="全样本引用率" value={data.citationRate} baseline={data.baselineCitationRate} delta={data.citationRateDelta} samples={data.currentPeriod.samples} color="#a25eef" definition="全部 AI 采样中出现直接引用、链接或转化目标的占比。" />
      </div>
      <div className="metrics-grid">
        <MetricCard icon={Sparkles} label="AI 回答提及总量" value={data.mentions} suffix="次" color="#fb8458" detail={`当前周期 ${data.currentPeriod.mentions} 次`} />
        <MetricCard icon={Search} label="AI 搜索问题词" value={data.words} suffix="个" color="#315ff4" detail={`${data.keywordScenes.length} 个场景`} />
        <MetricCard icon={Boxes} label="有回传样本的平台" value={data.platforms} suffix="个" color="#963bff" detail={`${data.platformStats.length} 个平台已接入样本`} />
        <MetricCard icon={Target} label="直接引用总量" value={data.citations} suffix="次" color="#16b77a" detail={`当前周期 ${data.currentPeriod.citations} 次`} />
      </div>
      <div className="dashboard-grid">
        <section className="chart-card wide"><div className="card-heading"><div><span>趋势观察 · 采样明细</span><h3>提及率与被引用概率趋势</h3></div><span className="chart-note">按日回传样本计算</span></div><div className="chart-box"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data.trend}><defs><linearGradient id="mentionRateFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#315ff4" stopOpacity={0.32} /><stop offset="100%" stopColor="#315ff4" stopOpacity={0.02} /></linearGradient></defs><CartesianGrid stroke="#edf0f8" vertical={false} /><XAxis dataKey="date" axisLine={false} tickLine={false} /><YAxis domain={[0, 100]} unit="%" axisLine={false} tickLine={false} /><Tooltip formatter={(value) => `${value}%`} /><Area type="monotone" dataKey="mentionRate" name="AI 提及率" stroke="#315ff4" strokeWidth={3} fill="url(#mentionRateFill)" /><Area type="monotone" dataKey="citationProbability" name="被引用概率" stroke="#16b77a" strokeWidth={2} fill="transparent" /></AreaChart></ResponsiveContainer></div></section>
        <section className="chart-card"><div className="card-heading"><div><span>平台分布</span><h3>AI 平台曝光统计</h3></div></div><div className="pie-wrap"><ResponsiveContainer width="100%" height={220}><PieChart><Pie data={pieData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={86} paddingAngle={3}>{pieData.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer><div className="pie-legend">{pieData.map((item, i) => <div key={item.name}><i style={{ background: colors[i] }} /><span>{item.name}</span><b>{item.value}</b></div>)}</div></div></section>
        <section className="chart-card wide"><div className="card-heading"><div><span>排名表现</span><h3>各平台收录与平均排名</h3></div><button className="text-button" onClick={() => navigate('/geo/report')}>查看完整报告 <ChevronRight size={15} /></button></div><div className="platform-bars">{data.platformStats.map((item, index) => <div className="platform-row" key={item.platform}><div className="platform-name"><span style={{ background: colors[index] }}>{item.platform.slice(0, 1)}</span><b>{item.platform}</b></div><div className="bar-track"><i style={{ width: `${(item.mentions / Math.max(...data.platformStats.map((p) => p.samples))) * 100}%`, background: colors[index] }} /></div><b>{item.mentions}/{item.samples}</b><span>平均排名 {item.averageRank || '-'}</span></div>)}</div></section>
        <section className="chart-card scene-card"><div className="card-heading"><div><span>LONG-TAIL CONTEXT</span><h3>拓展词出现的场景</h3></div><span className="chart-note">按关键词分类聚合</span></div><div className="scene-list">{data.keywordScenes.map((item) => <div className="scene-row" key={`${item.category}-${item.scene}`}><div className="scene-title"><b>{item.scene}</b><span>{item.category} · {item.keywordCount} 个词</span></div><div className="scene-bar"><i style={{ width: `${item.mentionRate}%` }} /></div><strong>{item.mentionRate}%</strong><small>提及率</small><div className="scene-meta"><span>被引用 {item.citationProbability}%</span><em>{item.topTerms.join('、')}</em></div></div>)}</div></section>
        <section className="chart-card evidence-card"><div className="card-heading"><div><span>MEASUREMENT RULES</span><h3>指标口径与回查</h3></div></div><dl className="evidence-list"><div><dt>提及率</dt><dd>{data.currentPeriod.mentions} / {data.currentPeriod.samples} = {data.mentionRate}%</dd></div><div><dt>被引用概率</dt><dd>{data.currentPeriod.citations} / {data.currentPeriod.mentions || 0} = {data.citationProbability}%</dd></div><div><dt>当前周期</dt><dd>{data.currentPeriod.from || '-'} 至 {data.currentPeriod.to || '-'}</dd></div><div><dt>基线周期</dt><dd>{data.baselinePeriod.from || '-'} 至 {data.baselinePeriod.to || '-'} · {data.baselinePeriod.samples} 条</dd></div></dl><button className="text-button" onClick={() => navigate('/geo/report')}>查看每条采样答案 <ChevronRight size={15} /></button></section>
        <section className="journey-card"><div><span>当前 GEO 阶段</span><h3>从“被看见”走向“被推荐”</h3></div><div className="journey-steps">{['立身份', '建资产', '布信源', '发全域', '盯数据'].map((step, i) => <div className={i < 4 ? 'done' : 'active'} key={step}><i>{i + 1}</i><span>{step}</span></div>)}</div><button className="primary-button" onClick={() => navigate('/geo/keywords')}>继续优化 <WandSparkles size={17} /></button></section>
      </div>
    </main>
  )
}

const resourceConfig = {
  keywords: { title: '关键词营销定位', subtitle: '从核心业务词扩展可被 AI 理解和回答的问题词。', endpoint: '/keywords', button: '新增关键词', icon: Search },
  knowledge: { title: '企业知识库', subtitle: '沉淀可信的企业、产品、案例与问答资产。', endpoint: '/knowledge', button: '新增知识', icon: BookOpenText },
  publish: { title: '发布任务', subtitle: '将已审核内容分发到高质量信源并持续回查。', endpoint: '/publish-tasks', button: '新建发布任务', icon: Send },
  automations: { title: '自动化任务', subtitle: '配置采样、扩词、创作和发布回查的自动流程。', endpoint: '/automations', button: null, icon: Bot },
}

function ResourcePage({ type }) {
  const customer = currentCustomer()
  const config = resourceConfig[type]
  const [rows, setRows] = useState([])
  const [open, setOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState({})
  const Icon = config.icon
  const load = () => api(`${config.endpoint}?customerId=${customer.id}`).then(setRows)
  useEffect(() => { load() }, [type, customer.id])

  const create = async (event) => {
    event.preventDefault(); setError('')
    const payload = type === 'keywords'
      ? { customerId: customer.id, word: form.title, category: form.option, searchVolume: form.number }
      : type === 'knowledge'
        ? { customerId: customer.id, title: form.title, type: form.option, content: form.content }
        : { customerId: customer.id, title: form.title, channel: form.option, scheduledAt: form.date }
    try { await api(config.endpoint, { method: 'POST', body: JSON.stringify(payload) }); setOpen(false); setForm({}); load() } catch (err) { setError(err.message) }
  }
  const toggle = async (id) => { await api(`/automations/${id}/toggle`, { method: 'PATCH' }); load() }
  const visible = rows.filter((row) => `${row.name || ''}${row.word || ''}${row.title || ''}${row.content || ''}`.toLowerCase().includes(query.toLowerCase()))

  const columns = useMemo(() => {
    if (type === 'keywords') return ['关键词', '分类', '搜索量', '训练状态', '创建时间']
    if (type === 'knowledge') return ['知识标题', '知识类型', '内容摘要', '状态', '创建时间']
    if (type === 'publish') return ['任务标题', '发布渠道', '任务进度', '状态', '计划时间']
    return ['自动化任务', '执行周期', '上次执行', '下次执行', '状态']
  }, [type])
  const cells = (row) => {
    if (type === 'keywords') return [<b>{row.word}</b>, row.category, row.search_volume, <span className={`tag ${row.status === '已完成' ? 'green' : 'orange'}`}>{row.status}</span>, row.created_at?.slice(0, 10)]
    if (type === 'knowledge') return [<b>{row.title}</b>, row.type, <span className="ellipsis">{row.content}</span>, <span className="tag green">{row.status}</span>, row.created_at?.slice(0, 10)]
    if (type === 'publish') return [<b>{row.title}</b>, row.channel, <div className="progress"><i style={{ width: `${row.progress}%` }} /><span>{row.progress}%</span></div>, <span className={`tag ${row.status === '发布成功' ? 'green' : row.status === '发布中' ? 'blue' : 'orange'}`}>{row.status}</span>, row.scheduled_at || '-']
    return [<b>{row.name}</b>, row.cadence, row.last_run, row.next_run, <button className={`switch ${row.enabled ? 'on' : ''}`} onClick={() => toggle(row.id)}><i /></button>]
  }

  return (
    <main className="content-page resource-page">
      <div className="page-heading"><div><span className="section-kicker">{type === 'automations' ? 'INTELLIGENT WORKFLOW' : 'GEO ASSET CENTER'}</span><h1>{config.title}</h1><p>{config.subtitle}</p></div>{config.button && <button className="primary-button" onClick={() => setOpen(true)}><Plus size={18} /> {config.button}</button>}</div>
      <div className="resource-summary"><div className="resource-icon"><Icon /></div><div><span>当前共 {rows.length} 项</span><b>{type === 'publish' ? '把内容送到 AI 信任的地方' : type === 'automations' ? '让系统持续执行重复工作' : '让品牌成为可信答案源'}</b></div><div className="summary-progress"><span>完成度</span><div><i style={{ width: type === 'automations' ? '72%' : '84%' }} /></div><b>{type === 'automations' ? '72%' : '84%'}</b></div></div>
      <section className="data-card"><div className="data-toolbar"><div className="search-box"><Search size={17} /><input placeholder={`搜索${config.title}`} value={query} onChange={(e) => setQuery(e.target.value)} /></div><button className="filter-button" onClick={() => setFilterOpen((current) => !current)}><Settings2 size={16} /> {filterOpen ? '收起筛选' : '筛选'}</button></div>{filterOpen && <div className="notice-bar"><Settings2 size={16} /><span>筛选面板已打开：输入关键词可即时过滤当前{config.title}。</span></div>}<div className="table-scroll"><table><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{visible.map((row) => <tr key={row.id}>{cells(row).map((cell, index) => <td key={index}>{cell}</td>)}</tr>)}</tbody></table></div>{!visible.length && <div className="empty-state"><Search /><b>暂无匹配数据</b><span>调整搜索条件后再试。</span></div>}</section>
      <Modal open={open} onClose={() => setOpen(false)} title={config.button}>
        <form className="modal-form" onSubmit={create}>
          <label>{type === 'keywords' ? '关键词' : type === 'knowledge' ? '知识标题' : '任务标题'}<input required value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
          <label>{type === 'keywords' ? '关键词分类' : type === 'knowledge' ? '知识类型' : '发布渠道'}<select required value={form.option || ''} onChange={(e) => setForm({ ...form, option: e.target.value })}><option value="">请选择</option>{(type === 'keywords' ? ['核心业务', '行业词', '问题词', '地域词'] : type === 'knowledge' ? ['企业资料', '产品服务', '案例', 'FAQ'] : ['新闻媒体', 'B2B 网站', '自有站点']).map((option) => <option key={option}>{option}</option>)}</select></label>
          {type === 'keywords' && <label>月搜索量<input type="number" min="0" value={form.number || ''} onChange={(e) => setForm({ ...form, number: e.target.value })} /></label>}
          {type === 'knowledge' && <label>知识内容<textarea required rows="5" value={form.content || ''} onChange={(e) => setForm({ ...form, content: e.target.value })} /></label>}
          {type === 'publish' && <label>计划时间<input type="datetime-local" value={form.date || ''} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label>}
          {error && <div className="form-error">{error}</div>}
          <div className="form-actions"><button type="button" onClick={() => setOpen(false)}>取消</button><button className="primary-button" type="submit">确认创建</button></div>
        </form>
      </Modal>
    </main>
  )
}

function ReportPage() {
  const customer = currentCustomer()
  const [, navigate] = useLocation()
  const [data, setData] = useState(null)
  const [rows, setRows] = useState([])
  const [platform, setPlatform] = useState('全部平台')
  const [device, setDevice] = useState('全部设备')
  const [query, setQuery] = useState('')
  const [reportTab, setReportTab] = useState('全部')
  const [shared, setShared] = useState(false)
  useEffect(() => { Promise.all([api(`/dashboard?customerId=${customer.id}`), api(`/observations?customerId=${customer.id}`)]).then(([summary, observations]) => { setData(summary); setRows(observations) }) }, [customer.id])
  if (!data) return <div className="page-loader"><FileChartColumn /> 正在生成分析报告</div>
  const platformNames = ['DeepSeek', '豆包', '元宝', '文心一言', '千问', '纳米AI', 'Kimi', '讯飞星火', '百度AI', '抖音AI', '夸克AI']
  const normalizePlatform = (name) => name === '通义千问' ? '千问' : name
  const platformLookup = Object.fromEntries(data.platformStats.map((item) => [normalizePlatform(item.platform), item]))
  const filteredRows = rows.filter((row) => {
    const matchesPlatform = platform === '全部平台' || normalizePlatform(row.platform) === platform
    return matchesPlatform && (device === '全部设备' || device === row.device) && row.keyword.toLowerCase().includes(query.toLowerCase()) && (reportTab === '全部' || row.mentioned)
  })
  const conversionRows = [
    { label: '可验证信源曝光', value: data.citations, percent: data.citationRate, tone: 'source' },
    { label: '品牌名称曝光', value: data.mentions, percent: data.mentionRate, tone: 'brand' },
    { label: '未形成引用', value: Math.max(0, data.samples - data.citations), percent: Math.max(0, 100 - data.citationRate), tone: 'missing' },
  ]
  const openReportEvidence = (row) => {
    try { window.sessionStorage.removeItem(EVIDENCE_RETURN_STORAGE_KEY) } catch {}
    navigate(snapshotRoute(row.id, row.customer_id))
  }
  return <main className="content-page report-page">
    <div className="report-command"><div><span>AI SEARCH MARKETING REPORT</span><h1>AI搜索营销报表</h1><p>数据更新时间：{data.dateRange.to || '-'} · 当前回传 {data.samples} 条采样</p></div><button className="primary-button" onClick={async () => { await navigator.clipboard?.writeText(location.href); setShared(true); setTimeout(() => setShared(false), 1800) }}>{shared ? '链接已复制' : '分享报表'}</button></div>
    <section className="model-map-card"><div className="model-map-center"><Sparkles /><b>AI 搜索</b><span>{data.samples} 次采样</span></div><div className="model-platforms">{platformNames.map((name, index) => <button key={name} className={platform === name ? 'active' : ''} onClick={() => setPlatform(platform === name ? '全部平台' : name)}><i>{name.slice(0, 1)}</i><span>{name}</span><b>{platformLookup[name]?.mentions || 0}</b><em>{index < 8 ? '大模型' : 'AI搜索'}</em></button>)}</div></section>
    <div className="report-metrics report-metrics-detailed"><div><span>AI 提及率</span><b>{data.mentionRate}%</b><em>基线 {data.baselineMentionRate}% · {data.mentionRateDelta >= 0 ? '+' : ''}{data.mentionRateDelta} 个百分点</em></div><div><span>被引用概率</span><b>{data.citationProbability}%</b><em>基线 {data.baselineCitationProbability}% · {data.currentPeriod.citations}/{data.currentPeriod.mentions || 0}</em></div><div><span>AI搜索词数量</span><b>{data.words}</b><em>{data.keywordScenes.length} 个场景，{data.samples} 条样本</em></div><div><span>有回传样本的平台</span><b>{data.platforms}</b><em>当前数据范围 {data.dateRange.from || '-'} 至 {data.dateRange.to || '-'}</em></div></div>
    <div className="report-analysis-grid"><section className="chart-card"><div className="card-heading"><div><span>ARTICLE &amp; CITATION TREND</span><h3>文章数据与收录趋势</h3></div><select><option>全部周期</option></select></div><div className="chart-box"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data.trend}><CartesianGrid stroke="#edf0f8" vertical={false} /><XAxis dataKey="date" axisLine={false} tickLine={false} /><YAxis domain={[0, 100]} unit="%" axisLine={false} tickLine={false} /><Tooltip formatter={(value) => `${value}%`} /><Area type="monotone" dataKey="mentionRate" name="AI 提及率" stroke="#315ff4" strokeWidth={3} fill="#e9edff" /><Area type="monotone" dataKey="citationProbability" name="被引用概率" stroke="#a25eef" strokeWidth={2} fill="transparent" /></AreaChart></ResponsiveContainer></div></section><aside className="conversion-card"><header><div className="home-card-title"><Target size={17} /><b>AI 搜索转化目标</b></div><span>当前采样口径</span></header><div className="conversion-list">{conversionRows.map((row) => <article className={`conversion-row tone-${row.tone}`} key={row.label}><div><span>{row.label}</span><b>{row.value}<small>条</small></b></div><div className="conversion-track"><i style={{ width: `${row.percent}%` }} /></div><em>{row.percent}%</em></article>)}</div><footer>曝光、提及与引用分开计算，未保存原回答的记录不作引用证明。</footer></aside></div>
    <section className="data-card report-detail-card"><div className="report-table-tabs"><button className={reportTab === '全部' ? 'active' : ''} onClick={() => setReportTab('全部')}>全部 <span>{rows.length}</span></button><button className={reportTab === '搜索报表' ? 'active' : ''} onClick={() => setReportTab('搜索报表')}>搜索报表 <span>{rows.filter((row) => row.mentioned).length}</span></button></div><div className="report-note">由于大模型动态学习和结果个性化，不同时间、区域与设备的查询结果可能存在差异。</div><div className="data-toolbar"><div className="filter-line"><select value={platform} onChange={(e) => setPlatform(e.target.value)}><option>全部平台</option>{platformNames.map((name) => <option key={name}>{name}</option>)}</select><select value={device} onChange={(e) => setDevice(e.target.value)}><option>全部设备</option><option>PC</option><option>移动端</option><option>未记录</option></select><div className="search-box"><Search size={17} /><input aria-label="搜索问题" placeholder="请输入问题" value={query} onChange={(e) => setQuery(e.target.value)} /></div></div><button className="filter-button" onClick={() => { setPlatform('全部平台'); setDevice('全部设备'); setQuery(''); setReportTab('全部') }}><SlidersHorizontal size={16} /> 重置筛选</button></div><div className="table-scroll"><table><thead><tr><th>序号</th><th>问题</th><th>平台</th><th>设备</th><th>查询时间</th><th>转化目标</th><th>操作</th></tr></thead><tbody>{filteredRows.slice(0, 30).map((row, index) => <tr key={row.id}><td>{index + 1}</td><td><b>{row.keyword}</b></td><td>{normalizePlatform(row.platform)}</td><td>{row.device || '未记录'}</td><td>{row.observed_at?.slice(0, 16)}</td><td><span className={`tag ${row.cited ? 'green' : 'blue'}`}>{row.conversion_target || (row.cited ? '官网链接 / 品牌名' : row.mentioned ? '品牌名称' : '未收录')}</span></td><td><div className="report-row-actions"><button className="table-action" onClick={() => openReportEvidence(row)}>{row.has_content ? '查看答案' : '查看采样'}</button><button className="table-action evidence-action" aria-label={`打开 ${row.keyword} 的快照凭证`} onClick={() => openReportEvidence(row)}>快照凭证</button>{safeHttpUrl(row.source_url) && <a className="table-action" href={safeHttpUrl(row.source_url)} target="_blank" rel="noreferrer">转到平台</a>}</div></td></tr>)}</tbody></table></div>{!filteredRows.length && <div className="empty-state"><Search /><b>暂无匹配数据</b><span>切换平台、设备或问题关键词后再试。</span></div>}</section>
  </main>
}

function ArticleManagePage() {
  const customer = currentCustomer()
  const statuses = ['全部文章', '待确认', '待审批', '审批驳回', '已确认', '待发布', '发布中', '已发布', '发布失败']
  const [rows, setRows] = useState([])
  const [status, setStatus] = useState('全部文章')
  const [query, setQuery] = useState('')
  const [type, setType] = useState('全部类型')
  const [autoDays, setAutoDays] = useState(0)
  const [selected, setSelected] = useState(new Set())
  const [adding, setAdding] = useState(false)
  const [detail, setDetail] = useState(null)
  const [form, setForm] = useState({ title: '', itemType: '品牌解读', keyword: '', detail: '' })
  const load = () => api(`/module-items?customerId=${customer.id}&module=article-manage`).then(setRows)
  useEffect(() => { load() }, [customer.id])
  const visible = rows.filter((row) => (status === '全部文章' || row.status === status) && (type === '全部类型' || row.item_type === type) && `${row.title}${row.detail}`.toLowerCase().includes(query.toLowerCase()))
  const create = async (event) => {
    event.preventDefault()
    await api('/module-items', { method: 'POST', body: JSON.stringify({ customerId: customer.id, module: 'article-manage', title: form.title, itemType: form.itemType, status: '待确认', metric: '0 次', detail: `${form.keyword ? `关键词：${form.keyword}。` : ''}${form.detail}` }) })
    setAdding(false); setForm({ title: '', itemType: '品牌解读', keyword: '', detail: '' }); load()
  }
  const updateStatus = async (row, next) => {
    await api(`/module-items/${row.id}`, { method: 'PATCH', body: JSON.stringify({ status: next }) })
    setDetail((current) => current?.id === row.id ? { ...current, status: next } : current); load()
  }
  const confirmSelected = async () => {
    await Promise.all(rows.filter((row) => selected.has(row.id)).map((row) => api(`/module-items/${row.id}`, { method: 'PATCH', body: JSON.stringify({ status: '已确认' }) })))
    setSelected(new Set()); load()
  }
  return <main className="content-page article-pipeline-page"><div className="article-page-head"><div><span className="section-kicker">CONTENT PRODUCTION PIPELINE</span><h1>文章管理</h1></div><label>设置自动确认时间：<input aria-label="自动确认天数" type="number" min="0" max="30" value={autoDays} onChange={(e) => setAutoDays(e.target.value)} /> 天</label></div><section className="data-card article-manager-card"><div className="status-tabs article-status-tabs">{statuses.map((item) => <button key={item} className={status === item ? 'active' : ''} onClick={() => setStatus(item)}>{item}<span>{item === '全部文章' ? rows.length : rows.filter((row) => row.status === item).length}</span></button>)}</div><div className="data-toolbar article-toolbar"><div className="filter-line"><div className="search-box"><Search size={17} /><input aria-label="搜索文章标题" placeholder="输入文章标题" value={query} onChange={(e) => setQuery(e.target.value)} /></div><select value={type} onChange={(e) => setType(e.target.value)}><option>全部类型</option><option>品牌解读</option><option>实操教程</option><option>行业观察</option></select><input className="date-input" aria-label="开始日期" type="date" /></div><div className="article-actions"><button className="primary-button" onClick={() => setAdding(true)}><Plus size={17} /> 新增文章</button><button className="filter-button" disabled={!selected.size} onClick={confirmSelected}>批量确认 ({selected.size})</button></div></div><div className="table-scroll"><table><thead><tr><th><input aria-label="全选文章" type="checkbox" checked={!!visible.length && visible.every((row) => selected.has(row.id))} onChange={(e) => setSelected(e.target.checked ? new Set(visible.map((row) => row.id)) : new Set())} /></th><th>封面</th><th>标题</th><th>任务类型</th><th>关键词</th><th>生成任务</th><th>文章生成时间</th><th>发布次数</th><th>创建人</th><th>文章状态</th><th>操作</th></tr></thead><tbody>{visible.map((row, index) => <tr key={row.id}><td><input aria-label={`选择文章 ${row.title}`} type="checkbox" checked={selected.has(row.id)} onChange={(e) => setSelected((current) => { const next = new Set(current); e.target.checked ? next.add(row.id) : next.delete(row.id); return next })} /></td><td><div className={`article-cover tone-${index % 4}`}><FileChartColumn /></div></td><td><b>{row.title}</b></td><td>{row.item_type}</td><td>{row.detail?.match(/关键词：([^。]+)/)?.[1] || 'GEO品牌增长'}</td><td>内容资产批次 #{String(row.id).padStart(3, '0')}</td><td>{row.created_at?.slice(0, 16)}</td><td>{row.metric || '0 次'}</td><td>AI运营官</td><td><span className={`tag ${row.status === '已发布' ? 'green' : row.status.includes('失败') || row.status.includes('驳回') ? 'orange' : 'blue'}`}>{row.status}</span></td><td><button className="table-action" onClick={() => setDetail(row)}>查看</button></td></tr>)}</tbody></table></div>{!visible.length && <div className="empty-state"><FileChartColumn /><b>当前状态暂无文章</b><span>新增文章后会先进入待确认队列。</span></div>}</section>
    <Modal open={adding} onClose={() => setAdding(false)} title="新增文章"><form className="modal-form" onSubmit={create}><label>文章标题<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label><label>任务类型<select value={form.itemType} onChange={(e) => setForm({ ...form, itemType: e.target.value })}><option>品牌解读</option><option>实操教程</option><option>行业观察</option></select></label><label>关键词<input value={form.keyword} onChange={(e) => setForm({ ...form, keyword: e.target.value })} /></label><label className="full">内容摘要<textarea required rows="5" value={form.detail} onChange={(e) => setForm({ ...form, detail: e.target.value })} /></label><div className="form-actions"><button type="button" onClick={() => setAdding(false)}>取消</button><button className="primary-button" type="submit">保存到待确认</button></div></form></Modal>
    <Modal open={!!detail} onClose={() => setDetail(null)} title="文章审核与流转">{detail && <div className="detail-panel"><div className="detail-hero"><div><span>{detail.item_type}</span><h3>{detail.title}</h3></div><em className="tag blue">{detail.status}</em></div><dl><div><dt>生成任务</dt><dd>内容资产批次 #{String(detail.id).padStart(3, '0')}</dd></div><div><dt>发布次数</dt><dd>{detail.metric}</dd></div><div className="full"><dt>文章摘要</dt><dd>{detail.detail}</dd></div></dl><div className="form-actions"><button onClick={() => setDetail(null)}>关闭</button>{detail.status !== '已发布' && <button className="filter-button" onClick={() => updateStatus(detail, '待审批')}>提交审批</button>}<button className="primary-button" onClick={() => updateStatus(detail, detail.status === '待审批' ? '已确认' : detail.status === '已确认' ? '待发布' : '已发布')}>流转到下一状态</button></div></div>}</Modal>
  </main>
}

function MediaAuthPage() {
  const customer = currentCustomer()
  const tabs = ['新闻媒体', '自媒体矩阵', 'B2B 行业网站']
  const [rows, setRows] = useState([])
  const [tab, setTab] = useState(tabs[0])
  const [detail, setDetail] = useState(null)
  const load = () => api(`/module-items?customerId=${customer.id}&module=account-auth`).then(setRows)
  useEffect(() => { load() }, [customer.id])
  const directory = [
    ['华东产业资讯', '新闻媒体', '省市级媒体'], ['城市商业观察', '新闻媒体', '省市级媒体'], ['科技产业参考', '新闻媒体', '商业媒体'], ['财经品牌周刊', '新闻媒体', '商业媒体'], ['创业前线', '新闻媒体', '商业媒体'], ['产业数字化网', '新闻媒体', '商业媒体'],
    ['抖音企业号', '自媒体矩阵', '内容平台'], ['小红书企业号', '自媒体矩阵', '内容平台'], ['视频号', '自媒体矩阵', '自有账号'], ['百家号', '自媒体矩阵', '内容平台'], ['头条号', '自媒体矩阵', '内容平台'],
    ['行业门户专区', 'B2B 行业网站', '行业平台'], ['供应链服务平台', 'B2B 行业网站', '行业平台'], ['品牌知识官网', 'B2B 行业网站', '自有站点'],
  ].filter(([title]) => !rows.some((row) => row.title === title)).map(([title, item_type, metric], index) => ({ id: `directory-${index}`, title, item_type, metric, status: '可接入', detail: '媒体资源目录，开通后可进入内容发布和结果回查流程。', directory: true }))
  const visible = [...rows, ...directory].filter((row) => row.item_type === tab)
  const groups = tab === '新闻媒体' ? ['权威媒体', '省市级媒体', '商业媒体'] : tab === '自媒体矩阵' ? ['自有账号', '内容平台'] : ['自有站点', '行业平台']
  const authorize = async (row) => { await api(`/module-items/${row.id}`, { method: 'PATCH', body: JSON.stringify({ status: '已授权' }) }); setDetail(null); load() }
  return <main className="content-page media-auth-page"><div className="page-heading"><div><span className="section-kicker">TRUSTED SOURCE NETWORK</span><h1>账号与授权</h1><p>管理新闻媒体、自媒体矩阵与 B2B 行业网站的信源能力。</p></div><span className="certified-pill"><ShieldCheck size={16} /> 已接入 {rows.filter((row) => row.status === '已授权').length} 个信源</span></div><section className="media-library"><div className="settings-tabs">{tabs.map((item) => <button className={tab === item ? 'active' : ''} onClick={() => setTab(item)} key={item}>{item}</button>)}</div>{groups.map((group, groupIndex) => { const groupRows = visible.filter((row) => row.metric === group || (groupIndex === 0 && !groups.includes(row.metric))); return <section className="media-group" key={group}><div className="media-group-title"><span className={`media-level level-${groupIndex}`}>{groupIndex + 1}</span><div><b>{group}</b><em>{groupIndex === 0 ? '优先建立高可信品牌信源' : '扩展行业与地域覆盖'}</em></div><span>{groupRows.length} 个</span></div><div className="media-logo-grid">{groupRows.map((row, index) => <button key={row.id} onClick={() => setDetail(row)}><span className={`media-logo tone-${index % 4}`}>{row.title.slice(0, 2)}</span><span><b>{row.title}</b><em>{row.detail}</em></span><i className={row.status === '已授权' ? 'authorized' : ''}>{row.status}</i></button>)}{!groupRows.length && <div className="media-empty">该分组暂无可用信源</div>}</div></section>})}</section><Modal open={!!detail} onClose={() => setDetail(null)} title="信源授权详情">{detail && <div className="detail-panel"><div className="detail-hero"><div><span>{detail.metric} · {detail.item_type}</span><h3>{detail.title}</h3></div><em className={`tag ${detail.status === '已授权' ? 'green' : 'orange'}`}>{detail.status}</em></div><dl><div><dt>信源类型</dt><dd>{detail.item_type}</dd></div><div><dt>接入级别</dt><dd>{detail.metric}</dd></div><div className="full"><dt>能力说明</dt><dd>{detail.detail}</dd></div></dl><div className="form-actions"><button onClick={() => setDetail(null)}>关闭</button>{detail.directory ? <button className="filter-button" onClick={() => setDetail(null)}>已了解接入方式</button> : detail.status !== '已授权' && <button className="primary-button" onClick={() => authorize(detail)}>模拟完成授权</button>}</div></div>}</Modal></main>
}

const moduleConfigs = {
  team: { title: '团队管理', subtitle: '管理成员、部门与 GEO 业务权限。', button: '新增团队', noun: '团队', types: ['运营团队', '审核团队', '客户团队'], statuses: ['已启用', '已停用'], metric: '成员与权限' },
  targets: { title: '转化目标', subtitle: '设置企业希望在大模型答案中展示的公司名、品牌名与咨询入口。', button: '添加转化目标', noun: '目标', types: ['品牌名称', '企业名称', '官网链接', '咨询电话'], statuses: ['已生效', '待生效'], metric: '目标属性', notice: '系统最多支持 10 个转化目标。目标应与企业或品牌直接相关，建议控制在 10 个字以内。' },
  images: { title: '图片素材中心', subtitle: '集中管理文章、官网与视频使用的品牌视觉资产。', button: '新增图片素材', noun: '素材', types: ['品牌视觉', '信息图', '产品图片', '案例图片'], statuses: ['已启用', '待审核'], metric: '图片规格', cards: true },
  'video-script': { title: '视频脚本创作', subtitle: '围绕关键词和企业知识库生成可审核的视频脚本。', button: '新建视频脚本', noun: '脚本', types: ['知识口播', '教程脚本', '案例解读'], statuses: ['待审核', '已完成', '创作中'], metric: '预计时长' },
  templates: { title: '视频模板与素材', subtitle: '维护封面、片头、字幕和数据解读视频模板。', button: '新增视频模板', noun: '模板', types: ['横版视频', '竖版视频', '口播包装'], statuses: ['已启用', '待审核'], metric: '画面比例', cards: true },
  'account-auth': { title: '账号与授权', subtitle: '管理新闻媒体、自媒体矩阵与 B2B 行业网站的可用状态。', button: null, noun: '媒体', types: ['新闻媒体', '自媒体矩阵', 'B2B 行业网站'], statuses: ['全部', '已授权', '可使用', '未授权'], metric: '媒体级别', cards: true },
  prompts: { title: '提示词中心', subtitle: '沉淀符合 EEAT 与 GEO 目标的文章创作指令。', button: '新建提示词', noun: '提示词', types: ['系统提示词', '平台发布指令', '媒体发布指令'], statuses: ['已启用', '已停用'], metric: '策略标签' },
  'article-batch': { title: '文章批量创作', subtitle: '基于关键词、知识库和提示词批量生成文章任务。', button: '新建任务', noun: '任务', types: ['批量创作', '单篇扩写', '地域内容'], statuses: ['生成中', '已完成', '待开始'], metric: '已生成' },
  'article-manage': { title: '文章管理', subtitle: '统一管理待确认、审批、发布和失败内容。', button: '新增文章', noun: '文章', types: ['品牌解读', '实操教程', '行业观察'], statuses: ['全部', '待审批', '已确认', '待发布', '已发布', '发布失败'], metric: '发布次数' },
  stations: { title: '高权重城市分站', subtitle: '建设地域信源与城市级 AI 搜索入口。', button: '新建城市分站', noun: '分站', types: ['城市分站', '行业分站'], statuses: ['已上线', '建设中', '已暂停'], metric: '建设进度' },
  'automation-logs': { title: '执行日志', subtitle: '回查文章自动发布任务的时间、步骤、回执与失败原因。', button: null, noun: '日志', types: ['创作任务', '发布任务', '回查任务'], statuses: ['全部', '执行成功', '执行中', '执行失败'], metric: '执行结果' },
  'station-menu': { title: '分站菜单设置', subtitle: '维护高权重城市分站的栏目名称、排序、打开方式与跳转入口。', button: '新增子栏目', noun: '栏目', types: ['一级栏目', '子栏目', '跳转栏目'], statuses: ['已启用', '已停用'], metric: '排序与层级' },
  'station-profile': { title: '分站资料设置', subtitle: '统一管理分站企业介绍、联系信息、品牌图片与备案资料。', button: '新增资料', noun: '资料', types: ['公司资料', '联系信息', '品牌图片'], statuses: ['已启用', '待完善'], metric: '资料完整度' },
  'station-cities': { title: '城市分站设置', subtitle: '导入城市、配置分站 TDK，并逐站确认页面可正常访问。', button: '导入城市', noun: '城市', types: ['重点城市', '服务城市', '测试城市'], statuses: ['已上线', '待生成', '已暂停'], metric: '访问状态' },
  'station-products': { title: '分站产品与服务', subtitle: '维护分站展示的产品、服务内容、推荐状态与排序。', button: '新增产品服务', noun: '产品服务', types: ['产品', '解决方案', '服务项目'], statuses: ['已启用', '已推荐', '已停用'], metric: '分站覆盖' },
  records: { title: '文章发布记录', subtitle: '查看媒体回执、公开页核验和失败原因。', button: null, noun: '记录', types: ['新闻媒体', 'B2B 网站', '自有站点'], statuses: ['全部', '发布成功', '发布中', '发布失败'], metric: '发布结果' },
  'video-create': { title: '视频创作与发布', subtitle: '编排脚本、画面、字幕与多平台发布任务。', button: '新建视频任务', noun: '视频任务', types: ['横版视频', '竖版视频', '数字人口播'], statuses: ['渲染中', '待审核', '已完成'], metric: '创作进度' },
  'video-manage': { title: '视频管理', subtitle: '统一管理成片、审核状态和发布准备情况。', button: '导入视频', noun: '视频', types: ['知识口播', '案例解读', '教程视频'], statuses: ['已完成', '待审核', '处理中'], metric: '视频时长' },
  'video-records': { title: '视频发布记录', subtitle: '查看视频号、抖音等渠道的发布回执。', button: null, noun: '记录', types: ['视频号', '抖音', '小红书'], statuses: ['全部', '发布成功', '发布中', '发布失败'], metric: '公开状态' },
}

function ModulePage({ module }) {
  const customer = currentCustomer()
  const config = moduleConfigs[module]
  const [rows, setRows] = useState([])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState(config.statuses[0])
  const [type, setType] = useState('全部类型')
  const [adding, setAdding] = useState(false)
  const [detail, setDetail] = useState(null)
  const [form, setForm] = useState({ title: '', itemType: config.types[0], metric: '', detail: '' })
  const load = () => api(`/module-items?customerId=${customer.id}&module=${module}`).then(setRows)
  useEffect(() => { load() }, [customer.id, module])

  const visible = rows.filter((row) => {
    const matchQuery = `${row.title}${row.item_type}${row.detail}`.toLowerCase().includes(query.toLowerCase())
    const matchStatus = status === '全部' || row.status === status
    const matchType = type === '全部类型' || row.item_type === type
    return matchQuery && matchStatus && matchType
  })
  const create = async (event) => {
    event.preventDefault()
    await api('/module-items', { method: 'POST', body: JSON.stringify({ customerId: customer.id, module, ...form, status: config.statuses.find((item) => item !== '全部') || '待处理' }) })
    setAdding(false); setForm({ title: '', itemType: config.types[0], metric: '', detail: '' }); load()
  }
  const advance = async (row) => {
    const choices = config.statuses.filter((item) => item !== '全部')
    const next = choices[(Math.max(choices.indexOf(row.status), 0) + 1) % choices.length]
    await api(`/module-items/${row.id}`, { method: 'PATCH', body: JSON.stringify({ status: next }) })
    setDetail((current) => current?.id === row.id ? { ...current, status: next } : current)
    load()
  }

  return <main className="content-page module-page">
    <div className="page-heading"><div><span className="section-kicker">AI PIONEER · GEO WORKSPACE</span><h1>{config.title}</h1><p>{config.subtitle}</p></div>{config.button && <button className="primary-button" onClick={() => setAdding(true)}><Plus size={18} /> {config.button}</button>}</div>
    {config.notice && <div className="notice-bar"><ShieldCheck size={18} /><span>{config.notice}</span></div>}
    <section className="module-overview"><div><span>全部{config.noun}</span><b>{rows.length}</b></div><div><span>当前筛选</span><b>{visible.length}</b></div><div><span>最近更新</span><b>{rows[0]?.updated_at?.slice(0, 10) || '-'}</b></div><div className="module-health"><CheckCircle2 /><span>数据已同步到当前客户工作区</span></div></section>
    <section className="data-card">
      <div className="status-tabs">{config.statuses.map((item) => <button key={item} className={status === item ? 'active' : ''} onClick={() => setStatus(item)}>{item}<span>{item === '全部' ? rows.length : rows.filter((row) => row.status === item).length}</span></button>)}</div>
      <div className="data-toolbar"><div className="filter-line"><div className="search-box"><Search size={17} /><input aria-label={`搜索${config.title}`} placeholder={`输入${config.noun}名称`} value={query} onChange={(e) => setQuery(e.target.value)} /></div><select value={type} onChange={(e) => setType(e.target.value)}><option>全部类型</option>{config.types.map((item) => <option key={item}>{item}</option>)}</select></div><button className="filter-button" onClick={() => { setQuery(''); setType('全部类型') }}><SlidersHorizontal size={16} /> 重置筛选</button></div>
      {config.cards ? <div className="asset-grid">{visible.map((row, index) => <article className="asset-card" key={row.id}><div className={`asset-visual tone-${index % 4}`}><span>{module === 'account-auth' ? row.title.slice(0, 4) : module === 'images' ? <ImageIcon /> : <Play />}</span></div><div className="asset-copy"><div><span>{row.item_type}</span><em className={`tag ${row.status.includes('已') ? 'green' : row.status.includes('未') ? 'orange' : 'blue'}`}>{row.status}</em></div><h3>{row.title}</h3><p>{row.detail}</p><footer><b>{row.metric}</b><button onClick={() => setDetail(row)}>{module === 'account-auth' && row.status === '未授权' ? '去授权' : '查看详情'}</button></footer></div></article>)}</div> : <div className="table-scroll"><table><thead><tr><th>{config.noun}ID</th><th>{config.noun}名称</th><th>类型</th><th>{config.metric}</th><th>状态</th><th>更新时间</th><th>操作</th></tr></thead><tbody>{visible.map((row) => <tr key={row.id}><td>#{row.id}</td><td><b>{row.title}</b></td><td>{row.item_type}</td><td>{row.metric || '-'}</td><td><span className={`tag ${row.status.includes('成功') || row.status.includes('完成') || row.status.includes('启用') || row.status.includes('生效') || row.status.includes('上线') || row.status.includes('发布') ? 'green' : row.status.includes('失败') ? 'orange' : 'blue'}`}>{row.status}</span></td><td>{row.updated_at?.slice(0, 16)}</td><td><button className="table-action" onClick={() => setDetail(row)}>查看</button></td></tr>)}</tbody></table></div>}
      {!visible.length && <div className="empty-state"><Search /><b>没有匹配的{config.noun}</b><span>调整状态、类型或搜索条件后再试。</span></div>}
    </section>
    <Modal open={adding} onClose={() => setAdding(false)} title={config.button}>
      <form className="modal-form" onSubmit={create}><label>{config.noun}名称<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label><label>类型<select value={form.itemType} onChange={(e) => setForm({ ...form, itemType: e.target.value })}>{config.types.map((item) => <option key={item}>{item}</option>)}</select></label><label>{config.metric}<input value={form.metric} onChange={(e) => setForm({ ...form, metric: e.target.value })} placeholder="例如：80%、3 个站点" /></label><label>说明<textarea required rows="5" value={form.detail} onChange={(e) => setForm({ ...form, detail: e.target.value })} /></label><div className="form-actions"><button type="button" onClick={() => setAdding(false)}>取消</button><button className="primary-button" type="submit">保存并创建</button></div></form>
    </Modal>
    <Modal open={!!detail} onClose={() => setDetail(null)} title={`${config.noun}详情`}>
      {detail && <div className="detail-panel"><div className="detail-hero"><div><span>{detail.item_type}</span><h3>{detail.title}</h3></div><em className="tag blue">{detail.status}</em></div><dl><div><dt>{config.metric}</dt><dd>{detail.metric || '-'}</dd></div><div><dt>创建时间</dt><dd>{detail.created_at?.slice(0, 16)}</dd></div><div className="full"><dt>内容说明</dt><dd>{detail.detail || '暂无说明'}</dd></div></dl><div className="form-actions"><button onClick={() => setDetail(null)}>关闭</button><button className="primary-button" onClick={() => advance(detail)}>{module === 'account-auth' && detail.status === '未授权' ? '模拟完成授权' : '流转到下一状态'}</button></div></div>}
    </Modal>
  </main>
}

const settingFields = {
  realname: { title: '实名认证', subtitle: '认证企业主体，建立可验证的品牌数字身份。', tabs: ['企业认证', '个人认证'], fields: [['company', '企业名称'], ['unifiedCode', '统一社会信用代码'], ['legalRepresentative', '企业负责人'], ['address', '注册地址']] },
  agent: { title: 'AI 智能体', subtitle: '配置智能体官网、品牌名片与智能客服的统一身份。', tabs: ['智能体官网', '智能体名片', '智能体客服'], fields: [['name', '智能体名称'], ['websiteDomain', '官网域名'], ['servicePhone', '客服电话'], ['tone', '回答风格'], ['welcome', '欢迎语', 'textarea']] },
}

function SettingsPage({ module }) {
  const customer = currentCustomer()
  const config = settingFields[module]
  const [form, setForm] = useState({})
  const [tab, setTab] = useState(config.tabs[0])
  const [saved, setSaved] = useState(false)
  useEffect(() => { api(`/module-settings/${module}?customerId=${customer.id}`).then((row) => { setForm(row.data); setTab(row.data.tab || config.tabs[0]) }) }, [customer.id, module])
  const save = async (event) => {
    event.preventDefault(); setSaved(false)
    const result = await api(`/module-settings/${module}`, { method: 'PUT', body: JSON.stringify({ customerId: customer.id, data: { ...form, tab } }) })
    setForm(result.data); setSaved(true); setTimeout(() => setSaved(false), 2200)
  }
  return <main className="content-page settings-page"><div className="page-heading"><div><span className="section-kicker">VERIFIED BRAND IDENTITY</span><h1>{config.title}</h1><p>{config.subtitle}</p></div><span className="certified-pill"><BadgeCheck size={16} /> {module === 'realname' ? form.status || '待认证' : '配置已启用'}</span></div><section className="settings-card"><div className="settings-tabs">{config.tabs.map((item) => <button className={tab === item ? 'active' : ''} onClick={() => setTab(item)} key={item}>{item}</button>)}</div><div className="settings-intro"><div className="settings-icon">{module === 'realname' ? <Building2 /> : <Bot />}</div><div><h2>{tab}</h2><p>{module === 'realname' ? '企业认证信息将作为品牌身份和转化目标的可信基础。' : '填写品牌能力和服务信息，保存后智能体页面会立即使用本配置。'}</p></div><span><CheckCircle2 /> 当前资料完整度 92%</span></div><form className="settings-form" onSubmit={save}>{config.fields.map(([key, label, kind]) => <label className={kind === 'textarea' ? 'full' : ''} key={key}>{label}{kind === 'textarea' ? <textarea rows="5" value={form[key] || ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} /> : <input required value={form[key] || ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />}</label>)}<div className="settings-actions"><span className={saved ? 'save-toast show' : 'save-toast'}><CheckCircle2 /> 配置已保存</span><button className="primary-button" type="submit"><Save size={17} /> 保存配置</button></div></form></section></main>
}

function CompetitionPage() {
  const customer = currentCustomer()
  const [data, setData] = useState(null)
  const [shared, setShared] = useState(false)
  useEffect(() => { api(`/dashboard?customerId=${customer.id}`).then(setData) }, [customer.id])
  if (!data) return <div className="page-loader"><BarChart3 /> 正在计算竞争力报告</div>
  const competitors = data.platformStats.map((item, index) => ({ platform: item.platform, brand: Math.round((item.mentions / item.samples) * 100), benchmark: [64, 72, 58, 69, 61][index] || 60 }))
  const citedPlatforms = data.platformStats.filter((item) => item.citations > 0).length
  return <main className="content-page competition-page"><div className="competition-hero"><div><span>AI SEARCH COMPETITIVENESS</span><h1>{customer.brand} AI搜索竞争力分析报告</h1><p>基于当前工作区采样记录和配置参考值，分析品牌认知与平台表现。</p></div><button className="filter-button" onClick={async () => { await navigator.clipboard?.writeText(window.location.href); setShared(true); setTimeout(() => setShared(false), 1800) }}>{shared ? '链接已复制' : '分享报告'}</button></div><div className="report-section-title"><b>一. 报告概述</b><span>最近采样：{data.dateRange.to || '暂无样本'}</span></div><div className="report-metrics"><div><span>蒸馏词数量</span><b>{data.words}</b><em>核心问题资产</em></div><div><span>竞争力分析次数</span><b>{data.samples}</b><em>跨平台样本</em></div><div><span>覆盖 AI 平台</span><b>{data.platforms}</b><em>已回传样本</em></div><div><span>引用信源平台数</span><b>{citedPlatforms}</b><em>按引用明细聚合</em></div></div><section className="competition-grid"><div className="chart-card"><div className="card-heading"><div><span>平台对比</span><h3>品牌可见度与配置参考值</h3></div></div><div className="chart-box"><ResponsiveContainer width="100%" height="100%"><BarChart data={competitors}><CartesianGrid stroke="#edf0f8" vertical={false} /><XAxis dataKey="platform" axisLine={false} tickLine={false} /><YAxis domain={[0, 100]} axisLine={false} tickLine={false} /><Tooltip /><Bar dataKey="brand" name={customer.brand} fill="#315ff4" radius={[6, 6, 0, 0]} /><Bar dataKey="benchmark" name="配置参考值" fill="#c9d1ef" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></div><aside className="brand-profile"><span>二. 品牌画像</span><h2>{customer.brand}</h2><dl><div><dt>公司名称</dt><dd>{customer.company}</dd></div><div><dt>核心服务</dt><dd>GEO 策略、内容资产与多平台运营</dd></div><div><dt>综合可见度</dt><dd>{data.visibilityRate}%</dd></div><div><dt>正向样本率</dt><dd>{data.positiveSentimentRate}%</dd></div></dl><div className="profile-score"><span>竞争力指数</span><b>{Math.round((data.visibilityRate + data.positiveSentimentRate) / 2)}</b></div></aside></section><section className="data-card competitor-table"><div className="data-toolbar"><h3>三. AI 搜索平台分析</h3><span>品牌样本表现与配置参考值对比</span></div><div className="table-scroll"><table><thead><tr><th>平台</th><th>品牌可见度</th><th>配置参考值</th><th>差值</th><th>改进建议</th></tr></thead><tbody>{competitors.map((row) => <tr key={row.platform}><td><b>{row.platform}</b></td><td>{row.brand}%</td><td>{row.benchmark}%</td><td><span className={`tag ${row.brand >= row.benchmark ? 'green' : 'orange'}`}>{row.brand - row.benchmark >= 0 ? '+' : ''}{row.brand - row.benchmark}%</span></td><td>{row.brand >= row.benchmark ? '保持高质量引用与品牌问答覆盖' : '补充权威信源与平台适配内容'}</td></tr>)}</tbody></table></div></section></main>
}

function PlaceholderPage({ title, subtitle, backPath = '/geo/dashboard', backLabel = '返回 GEO 首页' }) {
  const [, navigate] = useLocation()
  return <main className="content-page">
    <div className="page-heading"><div><span className="section-kicker">AI PIONEER · WORKSPACE</span><h1>{title}</h1><p>{subtitle}</p></div><button className="filter-button" onClick={() => navigate(backPath)}>{backLabel}</button></div>
    <section className="data-card"><div className="notice-bar"><ShieldCheck size={18} /><span>这是可操作的工作台入口，后续业务数据会在当前模块内继续沉淀。</span></div><div className="empty-state"><Sparkles /><b>{title}已打开</b><span>当前演示数据暂未配置更深层记录。</span><div className="form-actions"><button onClick={() => navigate(backPath)}>{backLabel}</button><button className="primary-button" onClick={() => navigate('/geo/dashboard')}>回到 GEO 首页</button></div></div></section>
  </main>
}

function PublicSupportPage({ title, subtitle }) {
  const [, navigate] = useLocation()
  return <main className="login-page"><section className="login-panel-wrap"><div className="login-panel"><div className="login-headline"><p className="eyebrow">AI PIONEER · DEMO SUPPORT</p><h1>{title}</h1><p>{subtitle}</p></div><div className="form-actions"><button onClick={() => navigate('/login')}>返回登录</button><button className="gradient-button" onClick={() => navigate('/login')}>使用演示账号登录</button></div></div></section></main>
}

function ProtectedApp() {
  const { user, loading } = useContext(AuthContext)
  const [location] = useLocation()
  if (loading) return <div className="page-loader"><Sparkles /> 正在加载工作台</div>
  if (location.startsWith('/site/')) {
    const [customerId, page = 'home'] = location.slice('/site/'.length).split('/').filter(Boolean)
    return <GeneratedSitePage customerId={Number(customerId) || currentCustomer().id} page={page} />
  }
  if (!user) return <Redirect to="/login" />
  if (location.startsWith('/geo-dashboard/index-1/')) {
    const caseSlug = location.slice('/geo-dashboard/index-1/'.length).split('/')[0]
    return <CaseCockpitPage caseSlug={caseSlug} />
  }
  if (location.startsWith('/crm')) {
    const crmPages = {
      '/crm/overview': <CrmOverview />,
      '/crm/customers': <CrmCustomers />,
      '/crm/orders': <CrmOrders />,
      '/crm/finance': <CrmFinance />,
      '/crm/cases': <CrmCases />,
    }
    return <CrmShell>{crmPages[location] || <CrmOverview />}</CrmShell>
  }
  if (location === '/settings') return <CrmShell><PlaceholderPage title="系统设置" subtitle="管理工作台显示、账号和运行偏好。" backPath="/crm/customers" backLabel="返回客户管理" /></CrmShell>
  if (location === '/messages') return <CrmShell><PlaceholderPage title="消息中心" subtitle="查看系统通知、任务回执和数据更新提醒。" backPath="/crm/customers" backLabel="返回客户管理" /></CrmShell>

  if (location.startsWith('/geo/evidence/')) {
    const parts = location.slice('/geo/evidence/'.length).split('/').filter(Boolean)
    const [customerId, snapshotId] = parts.length === 2
      ? parts.map(Number)
      : parts.length === 1 ? [currentCustomer().id, Number(parts[0])] : [NaN, NaN]
    return <GeoShell><EvidenceSnapshotPage customerId={customerId} snapshotId={snapshotId} /></GeoShell>
  }

  if (location.startsWith('/geo/site-admin')) {
    const sectionSlug = location.slice('/geo/site-admin'.length).split('/').filter(Boolean)[0] || 'overview'
    return <GeoShell><SiteAdminPage sectionSlug={sectionSlug} /></GeoShell>
  }

  const geoPages = {
    '/geo/dashboard': <GeoDashboard />,
    '/geo/keywords': <ResourcePage key="keywords" type="keywords" />,
    '/geo/knowledge': <ResourcePage key="knowledge" type="knowledge" />,
    '/geo/publish': <ResourcePage key="publish" type="publish" />,
    '/geo/automations': <ResourcePage key="automations" type="automations" />,
    '/geo/report': <ReportPage />,
    '/geo/video-seo': <PlaceholderPage title="短视频 SEO" subtitle="视频搜索与分发入口已打开，后续可在此配置脚本、素材和发布任务。" />,
    '/geo/seo': <PlaceholderPage title="搜索引擎 SEO" subtitle="传统搜索增长入口已打开，后续可在此配置关键词、页面和排名任务。" />,
    '/geo/team': <ModulePage key="team" module="team" />,
    '/geo/realname': <SettingsPage module="realname" />,
    '/geo/agent': <AgentStudioPage view="website" />,
    '/geo/agent/card': <AgentStudioPage view="card" />,
    '/geo/agent/service': <AgentStudioPage view="service" />,
    '/geo/targets': <ModulePage key="targets" module="targets" />,
    '/geo/images': <ModulePage key="images" module="images" />,
    '/geo/video-script': <ModulePage key="video-script" module="video-script" />,
    '/geo/templates': <ModulePage key="templates" module="templates" />,
    '/geo/account-auth': <MediaAuthPage />,
    '/geo/prompts': <ModulePage key="prompts" module="prompts" />,
    '/geo/article-batch': <ModulePage key="article-batch" module="article-batch" />,
    '/geo/article-manage': <ArticleManagePage />,
    '/geo/automation-logs': <ModulePage key="automation-logs" module="automation-logs" />,
    '/geo/stations': <ModulePage key="stations" module="stations" />,
    '/geo/station-menu': <ModulePage key="station-menu" module="station-menu" />,
    '/geo/station-profile': <ModulePage key="station-profile" module="station-profile" />,
    '/geo/station-cities': <ModulePage key="station-cities" module="station-cities" />,
    '/geo/station-products': <ModulePage key="station-products" module="station-products" />,
    '/geo/records': <ModulePage key="records" module="records" />,
    '/geo/video-create': <ModulePage key="video-create" module="video-create" />,
    '/geo/video-manage': <ModulePage key="video-manage" module="video-manage" />,
    '/geo/video-records': <ModulePage key="video-records" module="video-records" />,
    '/geo/competition': <CompetitionPage />,
  }
  if (location.startsWith('/geo')) return <GeoShell>{geoPages[location] || <GeoDashboard />}</GeoShell>
  return <Redirect to="/crm/customers" />
}

function AppContent() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!authStore.get()) return setLoading(false)
    api('/auth/me').then(setUser).catch(authStore.clear).finally(() => setLoading(false))
  }, [])
  const logout = async () => { try { await api('/auth/logout', { method: 'POST' }) } catch {} authStore.clear(); setUser(null) }
  const auth = useMemo(() => ({ user, setUser, loading, logout }), [user, loading])
  return <AuthContext.Provider value={auth}><Switch><Route path="/login"><LoginPage /></Route><Route path="/register"><PublicSupportPage title="注册 AI先行者账号" subtitle="演示环境暂不创建真实账号，返回登录即可继续体验工作台。" /></Route><Route path="/support/forgot-password"><PublicSupportPage title="找回登录密码" subtitle="演示环境不发送真实短信或邮件，请使用演示账号重新登录。" /></Route><Route><ProtectedApp /></Route></Switch></AuthContext.Provider>
}

function App() {
  const base = import.meta.env.BASE_URL === '/' ? '' : import.meta.env.BASE_URL.replace(/\/$/, '')
  const routerProps = isStaticDemo ? { hook: useHashLocation } : { base }
  return <Router {...routerProps}><AppContent /></Router>
}

export default App

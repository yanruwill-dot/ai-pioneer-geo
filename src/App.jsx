import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Redirect, Route, Router, Switch, useLocation } from 'wouter'
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
  const [agreed, setAgreed] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    if (!agreed) return setError('请先同意平台隐私政策与用户服务协议')
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
          <div className="login-tabs"><button type="button" className="active">账号登录</button><button type="button">短信登录</button></div>
          <label className="field"><CircleUserRound size={20} /><input aria-label="账号" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="请输入账号" /></label>
          <label className="field"><KeyRound size={20} /><input aria-label="密码" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="请输入密码" /></label>
          <div className="remember-row"><label><input type="checkbox" /> 记住密码</label><button type="button">忘记密码</button></div>
          {error && <div className="form-error">{error}</div>}
          <button className="gradient-button" type="submit" disabled={loading}>{loading ? '正在进入…' : '登录'}</button>
          <label className="agree"><input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} /><span>我已阅读并同意 《平台隐私政策》 与 《平台用户服务协议》</span></label>
          {isStaticDemo && <div className="public-demo-note"><Globe2 size={15} /><span>GitHub Pages 演示版 · 操作数据只保存在当前浏览器</span></div>}
          <div className="register-hint">没有注册？ <button type="button">点击注册</button></div>
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

function Topbar({ crm = false, onMenu }) {
  const { user, logout } = useContext(AuthContext)
  return (
    <header className="topbar">
      <button className="mobile-menu" onClick={onMenu}><Menu /></button>
      <div className="topbar-breadcrumb"><span>{crm ? '合作商业务管理' : currentCustomer().brand}</span><ChevronRight size={14} /><b>{crm ? '客户管理' : 'GEO 运营中台'}</b></div>
      <div className="topbar-actions"><button title="消息"><Bell size={19} /><i /></button><div className="avatar">{user?.name?.slice(0, 1) || 'AI'}</div><div className="user-copy"><b>{user?.name}</b><span>{user?.role}</span></div><button title="退出登录" onClick={logout}><LogOut size={18} /></button></div>
    </header>
  )
}

const crmNav = [
  [Gauge, '工作台'], [UsersRound, '客户管理'], [Target, '订单管理'], [FileChartColumn, '财务流水'], [BookOpenText, 'GEO 案例'],
]

function CrmShell({ children }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="app-shell crm-shell">
      <aside className={`sidebar crm-sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-brand"><Brand crm /></div>
        <nav>{crmNav.map(([Icon, name], index) => <button className={index === 1 ? 'active' : ''} key={name}><Icon size={19} /><span>{name}</span>{index === 1 && <i />}</button>)}</nav>
        <div className="sidebar-foot"><Settings2 size={18} /><span>系统设置</span></div>
      </aside>
      <div className="app-main"><Topbar crm onMenu={() => setOpen(!open)} />{children}</div>
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
  const visible = customers.filter((item) => `${item.company}${item.brand}${item.account}`.toLowerCase().includes(query.toLowerCase()))
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
        <div className="data-toolbar"><div className="search-box"><Search size={17} /><input placeholder="搜索客户名称、品牌或账号" value={query} onChange={(e) => setQuery(e.target.value)} /></div><div className="table-tabs"><button className="active">全部客户</button><button>待跟进</button><button>已到期</button></div></div>
        <div className="table-scroll"><table><thead><tr><th>客户名称 / 品牌</th><th>登录账号</th><th>所属城市</th><th>产品</th><th>客户状态</th><th>创建时间</th><th>操作</th></tr></thead><tbody>{visible.map((customer) => <tr key={customer.id}><td><div className="company-cell"><span>{customer.brand.slice(0, 1)}</span><div><b>{customer.company}</b><small>{customer.brand}</small></div></div></td><td>{customer.account}</td><td>{customer.city || '-'}</td><td><span className="tag blue">{customer.product}</span></td><td><span className={`status-dot ${customer.status === '服务中' ? 'success' : ''}`}>{customer.status}</span></td><td>{customer.created_at?.slice(0, 10)}</td><td><button className="geo-row-action" aria-label={`进入 ${customer.brand} 的 GEO 工作台`} onClick={() => setLaunch(customer)}><CircleUserRound size={17} /><span>进入 GEO</span><ChevronRight size={15} /></button></td></tr>)}</tbody></table></div>
      </section>
      <Modal open={!!launch} onClose={() => setLaunch(null)} title={`进入 ${launch?.brand || ''}`} wide>
        <p className="modal-copy">选择要进入的业务平台。GEO 将带入该客户身份和数据权限。</p>
        <div className="product-grid">
          <button className="product-card active" onClick={enterGeo}><div className="product-icon"><Sparkles /></div><div><b>GEO 工作台</b><span>全域 AI 搜索营销 · 点击进入</span></div><ChevronRight /></button>
          <button className="product-card disabled"><div className="product-icon"><Play /></div><div><b>短视频 SEO</b><span>视频搜索与分发</span></div><span className="soon">未开通</span></button>
          <button className="product-card disabled"><div className="product-icon"><Globe2 /></div><div><b>搜索引擎 SEO</b><span>传统搜索增长</span></div><span className="soon">未开通</span></button>
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
  { icon: Layers3, label: '布信源', children: [{ label: '账号与授权', path: '/geo/account-auth' }, { label: '提示词中心', path: '/geo/prompts' }, { label: '文章批量创作', path: '/geo/article-batch' }, { label: '文章管理', path: '/geo/article-manage' }, { label: '文章自动发布', path: '/geo/automations' }, { label: '高权重城市分站', path: '/geo/stations' }, { label: '视频创作与发布', path: '/geo/video-create' }, { label: '视频管理', path: '/geo/video-manage' }] },
  { icon: Send, label: '发全域', children: [{ label: '文章发布队列', path: '/geo/publish' }, { label: '文章发布记录', path: '/geo/records' }, { label: '视频发布记录', path: '/geo/video-records' }] },
  { icon: BarChart3, label: '盯数据', children: [{ label: 'AI搜索营销报表', path: '/geo/report' }, { label: 'AI搜索竞争力分析报告', path: '/geo/competition' }] },
]

function GeoShell({ children }) {
  const [location, navigate] = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobile, setMobile] = useState(false)
  const [opened, setOpened] = useState(() => new Set(['建资产', '发全域', '盯数据']))
  const toggle = (label) => setOpened((prev) => {
    const next = new Set(prev); next.has(label) ? next.delete(label) : next.add(label); return next
  })
  return (
    <div className={`app-shell geo-shell ${collapsed ? 'is-collapsed' : ''}`}>
      <aside className={`sidebar geo-sidebar ${mobile ? 'open' : ''}`}>
        <div className="sidebar-brand"><Brand compact={collapsed} /><button onClick={() => setCollapsed(!collapsed)}><PanelLeftClose size={18} /></button></div>
        <nav>{geoNav.map((item) => {
          const active = item.path ? location === item.path : item.children?.some((child) => location === child.path)
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

function GeoDashboard() {
  const customer = currentCustomer()
  const [data, setData] = useState(null)
  useEffect(() => { api(`/dashboard?customerId=${customer.id}`).then(setData) }, [customer.id])
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
      <div className="dashboard-heading"><div><span className="section-kicker">DATA OVERVIEW</span><h2>数据指标</h2></div><div className="hero-score"><div className="score-ring" style={{ '--score': `${data.visibilityRate * 3.6}deg` }}><span><b>{data.visibilityRate}</b><small>综合可见度</small></span></div><div><b>品牌健康</b><span>较上周提升 8.4%</span></div></div></div>
      <div className="metrics-grid">
        <MetricCard icon={Sparkles} label="AI 大模型排名收录总量" value={data.mentions} suffix="次" color="#fb8458" detail="近 7 日 +12" />
        <MetricCard icon={Search} label="AI 搜索词数量" value={data.words} suffix="个" color="#315ff4" detail="覆盖核心业务与问题词" />
        <MetricCard icon={Boxes} label="收录 AI 平台数量" value={data.platforms} suffix="个" color="#963bff" detail="共监测 5 个主流平台" />
        <MetricCard icon={Target} label="AI 搜索直接转化曝光" value={data.citations} suffix="次" color="#16b77a" detail="官网链接与联系方式" />
      </div>
      <div className="dashboard-grid">
        <section className="chart-card wide"><div className="card-heading"><div><span>趋势观察</span><h3>品牌收录与引用趋势</h3></div><select><option>近 7 日</option><option>近 30 日</option></select></div><div className="chart-box"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data.trend}><defs><linearGradient id="mentionFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#315ff4" stopOpacity={0.32} /><stop offset="100%" stopColor="#315ff4" stopOpacity={0.02} /></linearGradient></defs><CartesianGrid stroke="#edf0f8" vertical={false} /><XAxis dataKey="date" axisLine={false} tickLine={false} /><YAxis axisLine={false} tickLine={false} allowDecimals={false} /><Tooltip /><Area type="monotone" dataKey="mentions" name="收录次数" stroke="#315ff4" strokeWidth={3} fill="url(#mentionFill)" /><Area type="monotone" dataKey="citations" name="直接引用" stroke="#ff835d" strokeWidth={2} fill="transparent" /></AreaChart></ResponsiveContainer></div></section>
        <section className="chart-card"><div className="card-heading"><div><span>平台分布</span><h3>AI 平台曝光统计</h3></div></div><div className="pie-wrap"><ResponsiveContainer width="100%" height={220}><PieChart><Pie data={pieData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={86} paddingAngle={3}>{pieData.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer><div className="pie-legend">{pieData.map((item, i) => <div key={item.name}><i style={{ background: colors[i] }} /><span>{item.name}</span><b>{item.value}</b></div>)}</div></div></section>
        <section className="chart-card wide"><div className="card-heading"><div><span>排名表现</span><h3>各平台收录与平均排名</h3></div><button className="text-button">查看完整报告 <ChevronRight size={15} /></button></div><div className="platform-bars">{data.platformStats.map((item, index) => <div className="platform-row" key={item.platform}><div className="platform-name"><span style={{ background: colors[index] }}>{item.platform.slice(0, 1)}</span><b>{item.platform}</b></div><div className="bar-track"><i style={{ width: `${(item.mentions / Math.max(...data.platformStats.map((p) => p.samples))) * 100}%`, background: colors[index] }} /></div><b>{item.mentions}/{item.samples}</b><span>平均排名 {item.averageRank || '-'}</span></div>)}</div></section>
        <section className="journey-card"><div><span>当前 GEO 阶段</span><h3>从“被看见”走向“被推荐”</h3></div><div className="journey-steps">{['立身份', '建资产', '布信源', '发全域', '盯数据'].map((step, i) => <div className={i < 4 ? 'done' : 'active'} key={step}><i>{i + 1}</i><span>{step}</span></div>)}</div><button className="primary-button">继续优化 <WandSparkles size={17} /></button></section>
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
      <section className="data-card"><div className="data-toolbar"><div className="search-box"><Search size={17} /><input placeholder={`搜索${config.title}`} /></div><button className="filter-button"><Settings2 size={16} /> 筛选</button></div><div className="table-scroll"><table><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.id}>{cells(row).map((cell, index) => <td key={index}>{cell}</td>)}</tr>)}</tbody></table></div></section>
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
  const [data, setData] = useState(null)
  const [rows, setRows] = useState([])
  useEffect(() => { Promise.all([api(`/dashboard?customerId=${customer.id}`), api(`/observations?customerId=${customer.id}`)]).then(([summary, observations]) => { setData(summary); setRows(observations) }) }, [customer.id])
  if (!data) return <div className="page-loader"><FileChartColumn /> 正在生成分析报告</div>
  return <main className="content-page report-page"><div className="report-banner"><div><span>AI SEARCH VISIBILITY REPORT</span><h1>{customer.brand} AI 搜索营销报表</h1><p>基于已采样的大模型回答，展示品牌可见度、排名和引用情况。</p></div><div className="report-date"><span>报告周期</span><b>2026.07.30 — 2026.08.05</b><small>最近更新：今天 09:00</small></div></div><div className="report-metrics"><div><span>综合可见度</span><b>{data.visibilityRate}%</b><em>↑ 8.4%</em></div><div><span>品牌 TOP1 率</span><b>{data.top1Rate}%</b><em>↑ 3.2%</em></div><div><span>收录总量</span><b>{data.mentions}</b><em>↑ 12 次</em></div><div><span>直接引用</span><b>{data.citations}</b><em>官网 / 联系方式</em></div></div><section className="chart-card report-chart"><div className="card-heading"><div><span>跨平台表现</span><h3>大模型收录对比</h3></div></div><div className="chart-box"><ResponsiveContainer width="100%" height="100%"><BarChart data={data.platformStats}><CartesianGrid stroke="#edf0f8" vertical={false} /><XAxis dataKey="platform" axisLine={false} tickLine={false} /><YAxis axisLine={false} tickLine={false} /><Tooltip /><Bar dataKey="mentions" name="品牌收录" fill="#315ff4" radius={[7, 7, 0, 0]} /><Bar dataKey="citations" name="直接引用" fill="#9d66f5" radius={[7, 7, 0, 0]} /></BarChart></ResponsiveContainer></div></section><section className="data-card"><div className="data-toolbar"><h3>搜索词采样明细</h3><button className="filter-button">导出报告</button></div><div className="table-scroll"><table><thead><tr><th>AI 平台</th><th>搜索词</th><th>是否收录</th><th>排名</th><th>直接引用</th><th>情感倾向</th><th>采样时间</th></tr></thead><tbody>{rows.slice(0, 12).map((row) => <tr key={row.id}><td><b>{row.platform}</b></td><td>{row.keyword}</td><td><span className={`tag ${row.mentioned ? 'green' : ''}`}>{row.mentioned ? '已收录' : '未收录'}</span></td><td>{row.rank ? `TOP ${row.rank}` : '-'}</td><td>{row.cited ? '是' : '否'}</td><td>{row.sentiment}</td><td>{row.observed_at?.slice(0, 10)}</td></tr>)}</tbody></table></div></section></main>
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
  useEffect(() => { api(`/dashboard?customerId=${customer.id}`).then(setData) }, [customer.id])
  if (!data) return <div className="page-loader"><BarChart3 /> 正在计算竞争力报告</div>
  const competitors = data.platformStats.map((item, index) => ({ platform: item.platform, brand: Math.round((item.mentions / item.samples) * 100), benchmark: [64, 72, 58, 69, 61][index] || 60 }))
  return <main className="content-page competition-page"><div className="competition-hero"><div><span>AI SEARCH COMPETITIVENESS</span><h1>{customer.brand} AI搜索竞争力分析报告</h1><p>基于历史搜索词收录数据，分析品牌认知、平台表现与同行差距。</p></div><button className="filter-button">分享报告</button></div><div className="report-section-title"><b>一. 报告概述</b><span>最近更新：2026-08-05</span></div><div className="report-metrics"><div><span>蒸馏词数量</span><b>{data.words}</b><em>核心问题资产</em></div><div><span>竞争力分析次数</span><b>{data.samples}</b><em>跨平台样本</em></div><div><span>覆盖 AI 平台</span><b>{data.platforms}</b><em>主流模型</em></div><div><span>引用信源平台数</span><b>{Math.max(data.citations, 1)}</b><em>已验证引用</em></div></div><section className="competition-grid"><div className="chart-card"><div className="card-heading"><div><span>平台对比</span><h3>品牌与行业基准可见度</h3></div></div><div className="chart-box"><ResponsiveContainer width="100%" height="100%"><BarChart data={competitors}><CartesianGrid stroke="#edf0f8" vertical={false} /><XAxis dataKey="platform" axisLine={false} tickLine={false} /><YAxis domain={[0, 100]} axisLine={false} tickLine={false} /><Tooltip /><Bar dataKey="brand" name={customer.brand} fill="#315ff4" radius={[6, 6, 0, 0]} /><Bar dataKey="benchmark" name="行业基准" fill="#c9d1ef" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></div><aside className="brand-profile"><span>二. 品牌画像</span><h2>{customer.brand}</h2><dl><div><dt>公司名称</dt><dd>{customer.company}</dd></div><div><dt>核心服务</dt><dd>GEO 策略、内容资产与多平台运营</dd></div><div><dt>综合可见度</dt><dd>{data.visibilityRate}%</dd></div><div><dt>正向舆情</dt><dd>86%</dd></div></dl><div className="profile-score"><span>竞争力指数</span><b>{Math.round((data.visibilityRate + 86) / 2)}</b></div></aside></section><section className="data-card competitor-table"><div className="data-toolbar"><h3>三. AI 搜索平台分析</h3><span>品牌推荐表现与行业基准对比</span></div><div className="table-scroll"><table><thead><tr><th>平台</th><th>品牌可见度</th><th>行业基准</th><th>差值</th><th>改进建议</th></tr></thead><tbody>{competitors.map((row) => <tr key={row.platform}><td><b>{row.platform}</b></td><td>{row.brand}%</td><td>{row.benchmark}%</td><td><span className={`tag ${row.brand >= row.benchmark ? 'green' : 'orange'}`}>{row.brand - row.benchmark >= 0 ? '+' : ''}{row.brand - row.benchmark}%</span></td><td>{row.brand >= row.benchmark ? '保持高质量引用与品牌问答覆盖' : '补充权威信源与平台适配内容'}</td></tr>)}</tbody></table></div></section></main>
}

function ProtectedApp() {
  const { user, loading } = useContext(AuthContext)
  const [location] = useLocation()
  if (loading) return <div className="page-loader"><Sparkles /> 正在加载工作台</div>
  if (!user) return <Redirect to="/login" />
  if (location.startsWith('/crm')) return <CrmShell><CrmCustomers /></CrmShell>

  const geoPages = {
    '/geo/dashboard': <GeoDashboard />,
    '/geo/keywords': <ResourcePage type="keywords" />,
    '/geo/knowledge': <ResourcePage type="knowledge" />,
    '/geo/publish': <ResourcePage type="publish" />,
    '/geo/automations': <ResourcePage type="automations" />,
    '/geo/report': <ReportPage />,
    '/geo/team': <ModulePage module="team" />,
    '/geo/realname': <SettingsPage module="realname" />,
    '/geo/agent': <SettingsPage module="agent" />,
    '/geo/targets': <ModulePage module="targets" />,
    '/geo/images': <ModulePage module="images" />,
    '/geo/video-script': <ModulePage module="video-script" />,
    '/geo/templates': <ModulePage module="templates" />,
    '/geo/account-auth': <ModulePage module="account-auth" />,
    '/geo/prompts': <ModulePage module="prompts" />,
    '/geo/article-batch': <ModulePage module="article-batch" />,
    '/geo/article-manage': <ModulePage module="article-manage" />,
    '/geo/stations': <ModulePage module="stations" />,
    '/geo/records': <ModulePage module="records" />,
    '/geo/video-create': <ModulePage module="video-create" />,
    '/geo/video-manage': <ModulePage module="video-manage" />,
    '/geo/video-records': <ModulePage module="video-records" />,
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
  return <AuthContext.Provider value={auth}><Switch><Route path="/login"><LoginPage /></Route><Route><ProtectedApp /></Route></Switch></AuthContext.Provider>
}

function App() {
  const base = import.meta.env.BASE_URL === '/' ? '' : import.meta.env.BASE_URL.replace(/\/$/, '')
  return <Router base={base}><AppContent /></Router>
}

export default App

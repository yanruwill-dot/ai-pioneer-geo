import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'wouter'
import {
  ArrowUpRight,
  Banknote,
  BookOpenText,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Database,
  FileText,
  Layers3,
  MapPin,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Target,
  TrendingUp,
  UsersRound,
  WalletCards,
  X,
} from 'lucide-react'
import { api, currentCustomer, setCurrentCustomer } from './api.js'
import {
  caseCockpitRoute,
  filterCases,
  filterOrders,
  filterTransactions,
  initialCaseVisibility,
  seedCases,
  seedOrders,
  seedTransactions,
  summarizeFinance,
} from './crmData.js'

const money = new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 0 })
const ORDER_STORAGE_KEY = 'ai-pioneer-crm-orders-v1'
const CASE_VISIBILITY_STORAGE_KEY = 'ai-pioneer-crm-case-visibility-v1'

function usePersistentRows(key, seed, normalize = (value) => value) {
  const [rows, setRows] = useState(() => {
    try {
      const saved = window.localStorage.getItem(key)
      return saved ? normalize(JSON.parse(saved)) : seed
    } catch {
      return seed
    }
  })
  useEffect(() => {
    try { window.localStorage.setItem(key, JSON.stringify(rows)) } catch {}
  }, [key, rows])
  return [rows, setRows]
}

function PageHeading({ eyebrow, title, subtitle, children }) {
  return <div className="page-heading"><div><span className="section-kicker">{eyebrow}</span><h1>{title}</h1><p>{subtitle}</p></div>{children && <div className="heading-actions">{children}</div>}</div>
}

function CrmDrawer({ open, onClose, title, eyebrow = 'AI先行者 · 业务工作台', children }) {
  if (!open) return null
  return <div className="crm-drawer-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <aside className="crm-drawer" role="dialog" aria-modal="true" aria-label={title}>
      <header><div><span>{eyebrow}</span><h2>{title}</h2></div><button aria-label="关闭详情" onClick={onClose}><X /></button></header>
      <div className="crm-drawer-body">{children}</div>
    </aside>
  </div>
}

function DemoLedgerNote() {
  return <span className="crm-demo-note"><CheckCircle2 size={14} /> 演示业务台账 · 可筛选与回查</span>
}

export function CrmOverview() {
  const [, navigate] = useLocation()
  const [customers, setCustomers] = useState([])
  const [orders] = usePersistentRows(ORDER_STORAGE_KEY, seedOrders)
  const [busy, setBusy] = useState(false)
  useEffect(() => { api('/crm/customers').then(setCustomers) }, [])
  const finance = summarizeFinance(seedTransactions)
  const activeOrders = orders.filter((row) => row.status === '服务中').length

  const enterGeo = async () => {
    const customer = customers.find((row) => row.id === currentCustomer().id) || customers.find((row) => row.status === '服务中') || customers[0]
    if (!customer) return navigate('/crm/customers')
    setBusy(true)
    try {
      const result = await api(`/crm/customers/${customer.id}/enter-geo`, { method: 'POST' })
      setCurrentCustomer(result.customer)
      navigate(result.redirect)
    } finally {
      setBusy(false)
    }
  }

  return <main className="content-page crm-business-page crm-overview-page">
    <PageHeading eyebrow="PARTNER OPERATIONS COMMAND CENTER" title="工作台" subtitle="从客户、订单和回款状态出发，统一进入 GEO 运营工作区。"><DemoLedgerNote /></PageHeading>
    <section className="crm-command-hero">
      <div><span>AI PIONEER · OPERATIONS</span><h2>今天先处理高价值客户，再进入 GEO 看增长数据</h2><p>客户服务、订单履约、回款和案例沉淀已经汇总到同一个经营视图。</p><div><button className="primary-button" onClick={enterGeo} disabled={busy}><Sparkles size={17} /> {busy ? '正在进入…' : '进入当前客户 GEO'}</button><button className="crm-ghost-button" onClick={() => navigate('/crm/customers')}>查看客户列表 <ChevronRight size={16} /></button></div></div>
      <div className="crm-focus-score"><i style={{ '--score': '76%' }}><span><b>76</b><small>经营健康度</small></span></i><div><b>本周重点</b><span>2 个服务中订单</span><span>1 笔待结算流水</span></div></div>
    </section>
    <section className="crm-kpi-grid">
      <article><span className="crm-kpi-icon blue"><UsersRound /></span><div><span>客户总数</span><b>{customers.length || 3}</b><small>服务中 {customers.filter((row) => row.status === '服务中').length || 2} 家</small></div></article>
      <article><span className="crm-kpi-icon violet"><BriefcaseBusiness /></span><div><span>当前订单</span><b>{orders.length}</b><small>{activeOrders} 个正在履约</small></div></article>
      <article><span className="crm-kpi-icon green"><CircleDollarSign /></span><div><span>已到账</span><b>{money.format(finance.received)}</b><small>待结算 {money.format(finance.pending)}</small></div></article>
      <article><span className="crm-kpi-icon orange"><BookOpenText /></span><div><span>案例资产</span><b>{seedCases.length}</b><small>覆盖 {new Set(seedCases.map((row) => row.industry)).size} 个行业</small></div></article>
    </section>
    <section className="crm-work-grid">
      <div className="data-card crm-recent-orders">
        <div className="crm-card-heading"><div><span>DELIVERY PULSE</span><h3>近期订单履约</h3></div><button onClick={() => navigate('/crm/orders')}>全部订单 <ArrowUpRight size={15} /></button></div>
        <div className="crm-order-list">{orders.slice(0, 4).map((order) => <button key={order.id} onClick={() => navigate('/crm/orders')}><span className="crm-order-brand">{order.brand.slice(0, 1)}</span><span><b>{order.brand}</b><small>{order.packageName} · {order.id}</small></span><span className="crm-mini-progress"><i style={{ width: `${order.progress}%` }} /></span><em>{order.progress}%</em></button>)}</div>
      </div>
      <aside className="data-card crm-quick-panel">
        <div className="crm-card-heading"><div><span>QUICK ROUTES</span><h3>业务快捷入口</h3></div></div>
        <div className="crm-quick-grid">
          <button onClick={() => navigate('/crm/customers')}><UsersRound /><span><b>客户管理</b><small>进入客户 GEO</small></span><ChevronRight /></button>
          <button onClick={() => navigate('/crm/orders')}><Target /><span><b>订单管理</b><small>履约与到期</small></span><ChevronRight /></button>
          <button onClick={() => navigate('/crm/finance')}><WalletCards /><span><b>财务流水</b><small>收入与结算</small></span><ChevronRight /></button>
          <button onClick={() => navigate('/crm/cases')}><Layers3 /><span><b>GEO 案例</b><small>查看增长案例</small></span><ChevronRight /></button>
        </div>
      </aside>
    </section>
  </main>
}

export function CrmOrders() {
  const [rows, setRows] = usePersistentRows(ORDER_STORAGE_KEY, seedOrders)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('全部订单')
  const [detail, setDetail] = useState(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ customer: '智焰科技有限公司', brand: '智焰 AI', packageName: 'GEO 增长版', amount: '68000' })
  const visible = filterOrders(rows, query, status)
  const total = rows.reduce((sum, row) => sum + Number(row.amount || 0), 0)

  const createOrder = (event) => {
    event.preventDefault()
    const stamp = new Date().toISOString().slice(2, 10).replaceAll('-', '')
    const row = { id: `ORD-${stamp}-${String(rows.length + 1).padStart(3, '0')}`, ...form, amount: Number(form.amount), status: '待确认', signedAt: new Date().toISOString().slice(0, 10), expiresAt: '2027-08-10', progress: 8, owner: '颜汝' }
    setRows([row, ...rows]); setAdding(false); setDetail(row)
  }

  return <main className="content-page crm-business-page">
    <PageHeading eyebrow="SERVICE ORDER CENTER" title="订单管理" subtitle="查看套餐、合同金额、履约进度和服务到期时间。"><DemoLedgerNote /><button className="primary-button" onClick={() => setAdding(true)}><Plus size={17} /> 新建订单</button></PageHeading>
    <div className="stat-strip crm-stat-strip"><div><span>订单总数</span><b>{rows.length}</b><small>笔</small></div><div><span>合同总额</span><b>{money.format(total)}</b></div><div><span>服务中</span><b>{rows.filter((row) => row.status === '服务中').length}</b><small>笔</small></div><div><span>待确认</span><b>{rows.filter((row) => row.status === '待确认').length}</b><small>笔</small></div></div>
    <section className="data-card">
      <div className="data-toolbar"><div className="search-box"><Search size={17} /><input aria-label="搜索订单" placeholder="搜索订单号、客户或套餐" value={query} onChange={(event) => setQuery(event.target.value)} /></div><div className="table-tabs">{['全部订单', '服务中', '待确认', '已完成', '已暂停'].map((item) => <button key={item} className={status === item ? 'active' : ''} onClick={() => setStatus(item)}>{item}</button>)}</div></div>
      <div className="table-scroll"><table><thead><tr><th>订单号</th><th>客户 / 品牌</th><th>服务套餐</th><th>合同金额</th><th>履约进度</th><th>状态</th><th>到期时间</th><th>操作</th></tr></thead><tbody>{visible.map((row) => <tr key={row.id}><td><b>{row.id}</b></td><td><div className="company-cell compact"><span>{row.brand.slice(0, 1)}</span><div><b>{row.customer}</b><small>{row.brand}</small></div></div></td><td>{row.packageName}</td><td><b>{money.format(row.amount)}</b></td><td><span className="crm-table-progress"><i style={{ width: `${row.progress}%` }} /></span><small>{row.progress}%</small></td><td><span className={`tag ${row.status === '服务中' || row.status === '已完成' ? 'green' : row.status === '已暂停' ? 'orange' : 'blue'}`}>{row.status}</span></td><td>{row.expiresAt}</td><td><button className="table-action" onClick={() => setDetail(row)}>查看详情</button></td></tr>)}</tbody></table></div>
      {!visible.length && <div className="empty-state"><Search /><b>没有匹配订单</b><span>调整筛选条件后再试。</span></div>}
    </section>
    <CrmDrawer open={!!detail} onClose={() => setDetail(null)} title="订单详情">{detail && <div className="crm-detail-stack"><div className="crm-detail-hero"><span>{detail.brand.slice(0, 1)}</span><div><small>{detail.id}</small><h3>{detail.customer}</h3><p>{detail.packageName}</p></div><em className="tag blue">{detail.status}</em></div><dl className="crm-detail-grid"><div><dt>合同金额</dt><dd>{money.format(detail.amount)}</dd></div><div><dt>履约进度</dt><dd>{detail.progress}%</dd></div><div><dt>签约日期</dt><dd>{detail.signedAt}</dd></div><div><dt>到期日期</dt><dd>{detail.expiresAt}</dd></div><div><dt>服务负责人</dt><dd>{detail.owner}</dd></div><div><dt>关联品牌</dt><dd>{detail.brand}</dd></div></dl><button className="primary-button" onClick={() => setDetail(null)}>确认并关闭</button></div>}</CrmDrawer>
    <CrmDrawer open={adding} onClose={() => setAdding(false)} title="新建演示订单"><form className="crm-create-form" onSubmit={createOrder}><label>客户名称<input required value={form.customer} onChange={(event) => setForm({ ...form, customer: event.target.value })} /></label><label>品牌名称<input required value={form.brand} onChange={(event) => setForm({ ...form, brand: event.target.value })} /></label><label>服务套餐<select value={form.packageName} onChange={(event) => setForm({ ...form, packageName: event.target.value })}><option>GEO 增长版</option><option>GEO 基础版</option><option>行业影响力包</option></select></label><label>合同金额<input required type="number" min="1" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} /></label><button className="primary-button" type="submit">保存订单</button></form></CrmDrawer>
  </main>
}

export function CrmFinance() {
  const [query, setQuery] = useState('')
  const [direction, setDirection] = useState('全部流水')
  const [detail, setDetail] = useState(null)
  const [statement, setStatement] = useState(false)
  const visible = filterTransactions(seedTransactions, query, direction)
  const summary = summarizeFinance(seedTransactions)

  return <main className="content-page crm-business-page">
    <PageHeading eyebrow="FINANCE & SETTLEMENT" title="财务流水" subtitle="按订单追踪收入、支出和待结算金额，所有数字均可回查到流水。"><DemoLedgerNote /><button className="primary-button" onClick={() => setStatement(true)}><FileText size={17} /> 生成本月对账单</button></PageHeading>
    <section className="crm-finance-banner"><div><span><TrendingUp /></span><div><small>本月经营净流入</small><b>{money.format(summary.received - summary.paid)}</b><em>已到账收入减去已支付支出</em></div></div><dl><div><dt>已到账</dt><dd>{money.format(summary.received)}</dd></div><div><dt>已支付</dt><dd>{money.format(summary.paid)}</dd></div><div><dt>待结算</dt><dd>{money.format(summary.pending)}</dd></div></dl></section>
    <section className="data-card">
      <div className="data-toolbar"><div className="search-box"><Search size={17} /><input aria-label="搜索财务流水" placeholder="搜索流水号、客户或订单号" value={query} onChange={(event) => setQuery(event.target.value)} /></div><div className="table-tabs">{['全部流水', '收入', '支出'].map((item) => <button key={item} className={direction === item ? 'active' : ''} onClick={() => setDirection(item)}>{item}</button>)}</div></div>
      <div className="table-scroll"><table><thead><tr><th>流水号</th><th>发生时间</th><th>客户 / 项目</th><th>类型</th><th>方向</th><th>金额</th><th>状态</th><th>操作</th></tr></thead><tbody>{visible.map((row) => <tr key={row.id}><td><b>{row.id}</b></td><td>{row.date}</td><td>{row.customer}</td><td>{row.type}</td><td><span className={`crm-flow-direction ${row.direction === '收入' ? 'income' : 'expense'}`}>{row.direction === '收入' ? '+' : '−'} {row.direction}</span></td><td><b>{money.format(row.amount)}</b></td><td><span className={`tag ${row.status === '已到账' || row.status === '已支付' ? 'green' : 'orange'}`}>{row.status}</span></td><td><button className="table-action" onClick={() => setDetail(row)}>查看凭证</button></td></tr>)}</tbody></table></div>
    </section>
    <CrmDrawer open={!!detail} onClose={() => setDetail(null)} title="流水凭证">{detail && <div className="crm-receipt"><span className={detail.direction === '收入' ? 'income' : 'expense'}>{detail.direction === '收入' ? <Banknote /> : <WalletCards />}</span><small>{detail.id}</small><h3>{detail.type}</h3><b>{detail.direction === '收入' ? '+' : '−'}{money.format(detail.amount)}</b><dl><div><dt>客户 / 项目</dt><dd>{detail.customer}</dd></div><div><dt>关联订单</dt><dd>{detail.orderId}</dd></div><div><dt>结算渠道</dt><dd>{detail.channel}</dd></div><div><dt>发生时间</dt><dd>{detail.date}</dd></div></dl><em><CheckCircle2 /> {detail.status} · 演示凭证已核对</em></div>}</CrmDrawer>
    <CrmDrawer open={statement} onClose={() => setStatement(false)} title="2026 年 8 月经营对账单"><div className="crm-statement"><div><span>已到账收入</span><b>{money.format(summary.received)}</b></div><div><span>已支付支出</span><b>{money.format(summary.paid)}</b></div><div><span>待结算金额</span><b>{money.format(summary.pending)}</b></div><div className="total"><span>本月净流入</span><b>{money.format(summary.received - summary.paid)}</b></div><p>本对账单基于当前演示流水实时汇总，不代表银行或第三方支付平台凭证。</p><button className="primary-button" onClick={() => setStatement(false)}>已核对</button></div></CrmDrawer>
  </main>
}

export function CrmCases() {
  const [, navigate] = useLocation()
  const [tab, setTab] = useState('案例查询')
  const [expanded, setExpanded] = useState(false)
  const [draft, setDraft] = useState({ region: '全部区域', query: '', industry: '全部行业', enabled: '全部状态' })
  const [filters, setFilters] = useState(draft)
  const [enabled, setEnabled] = usePersistentRows(CASE_VISIBILITY_STORAGE_KEY, initialCaseVisibility(), initialCaseVisibility)
  const industries = useMemo(() => ['全部行业', ...new Set(seedCases.map((row) => row.industry))], [])
  const regions = useMemo(() => ['全部区域', ...new Set(seedCases.map((row) => row.region))], [])
  const rows = seedCases.map((row) => ({ ...row, enabled: enabled[row.slug] }))
  const filtered = filterCases(rows, filters)
  const visible = tab === '高权重分站' ? [...filtered].sort((a, b) => b.includedPoints - a.includedPoints).slice(0, 3) : filtered
  const searchCases = (event) => {
    event.preventDefault()
    setFilters(draft)
  }
  const resetCases = () => {
    const empty = { region: '全部区域', query: '', industry: '全部行业', enabled: '全部状态' }
    setDraft(empty)
    setFilters(empty)
  }

  return <main className="content-page crm-business-page crm-cases-page">
    <PageHeading eyebrow="GEO SUCCESS LIBRARY" title="GEO 案例库" subtitle="按区域与核心产品词找到案例，再进入独立 GEO 数据驾驶舱。"><DemoLedgerNote /></PageHeading>
    <section className="case-library-panel">
      <div className="case-library-tabs"><button className={tab === '案例查询' ? 'active' : ''} onClick={() => setTab('案例查询')}>案例查询</button><button className={tab === '高权重分站' ? 'active' : ''} onClick={() => setTab('高权重分站')}>高权重分站</button><span>{tab === '案例查询' ? `当前 ${visible.length} 个案例` : '按结构化要点排序'}</span></div>
      <form className="case-library-filters" onSubmit={searchCases}>
        <label><span>所在区域</span><select value={draft.region} onChange={(event) => setDraft({ ...draft, region: event.target.value })}>{regions.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="case-product-search"><span>核心产品词</span><input placeholder="请输入核心产品词" value={draft.query} onChange={(event) => setDraft({ ...draft, query: event.target.value })} /></label>
        <div className="case-filter-actions"><button type="button" onClick={resetCases}><RotateCcw /> 重置</button><button className="search" type="submit"><Search /> 搜索</button><button type="button" className={expanded ? 'expanded' : ''} onClick={() => setExpanded((current) => !current)}><SlidersHorizontal /> {expanded ? '收起' : '展开'}</button></div>
        {expanded && <div className="case-more-filters"><label><span>所属行业</span><select value={draft.industry} onChange={(event) => setDraft({ ...draft, industry: event.target.value })}>{industries.map((item) => <option key={item}>{item}</option>)}</select></label><label><span>案例状态</span><select value={draft.enabled} onChange={(event) => setDraft({ ...draft, enabled: event.target.value })}><option>全部状态</option><option>已启用</option><option>已停用</option></select></label></div>}
      </form>

      <section className="case-library-grid">{visible.map((item) => <article key={item.id} className={`case-library-card ${item.enabled ? '' : 'disabled'}`}>
        <header><div><span>{item.id}</span><h2>{item.company}</h2><small>{item.brand} · {item.industry}</small></div><button onClick={() => navigate(caseCockpitRoute(item.slug))}>查看驾驶舱 <ArrowUpRight /></button></header>
        <div className="case-card-products"><b>核心产品词</b><p>{item.coreProducts.join('、')}</p></div>
        <dl><div><dt><MapPin /> 所在区域</dt><dd>{item.region}</dd></div><div><dt><CalendarDays /> 开通日期</dt><dd>{item.openedAt}</dd></div><div><dt><Database /> 纳入要点</dt><dd>{item.includedPoints}</dd></div></dl>
        <footer><span>{item.enabled ? '已启用展示' : '已暂停展示'}</span><button role="switch" aria-checked={item.enabled} aria-label={`${item.brand}案例展示状态`} className={item.enabled ? 'on' : ''} onClick={() => setEnabled((current) => ({ ...current, [item.slug]: !item.enabled }))}><i /></button></footer>
      </article>)}</section>
      {!visible.length && <div className="empty-state"><Search /><b>没有匹配案例</b><span>调整区域、产品词、行业或状态后再试。</span></div>}
    </section>
  </main>
}

import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'wouter'
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  CheckCircle2,
  Database,
  FileSearch,
  Gauge,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api, setCurrentCustomer } from './api.js'
import { caseCockpitRoute, cockpitViewKey, findCaseBySlug, findCaseEvidenceRoute } from './crmData.js'
import { EVIDENCE_RETURN_STORAGE_KEY } from './evidence.js'

export function CaseCockpitPage({ caseSlug }) {
  const [, navigate] = useLocation()
  const item = findCaseBySlug(caseSlug)
  const [platform, setPlatform] = useState('全部平台')
  const [query, setQuery] = useState('')
  const [view, setView] = useState('AI搜索营销报表')
  const [evidenceRoute, setEvidenceRoute] = useState('')
  const [evidenceLoaded, setEvidenceLoaded] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'auto' }) }, [caseSlug])
  useEffect(() => {
    let active = true
    setEvidenceRoute('')
    setEvidenceLoaded(false)
    if (!item?.customerId || !item.evidenceExternalId) {
      setEvidenceLoaded(true)
      return () => { active = false }
    }
    api(`/observations?customerId=${item.customerId}`)
      .then((rows) => { if (active) setEvidenceRoute(findCaseEvidenceRoute(item, rows)) })
      .catch(() => { if (active) setEvidenceRoute('') })
      .finally(() => { if (active) setEvidenceLoaded(true) })
    return () => { active = false }
  }, [caseSlug, item])

  const questions = useMemo(() => item ? item.questions.filter((row) => {
    return (platform === '全部平台' || row.platform === platform)
      && row.keyword.toLowerCase().includes(query.trim().toLowerCase())
  }) : [], [item, platform, query])

  if (!item) return <main className="case-cockpit-missing"><FileSearch /><h1>没有找到这个 GEO 案例驾驶舱</h1><p>案例标识不存在或已经失效。</p><button onClick={() => navigate('/crm/cases')}><ArrowLeft /> 返回 GEO 案例库</button></main>

  const totalMentions = item.platforms.reduce((sum, row) => sum + row.mentions, 0)
  const platformNames = [...new Set(item.questions.map((row) => row.platform))]
  const viewKey = cockpitViewKey(view)
  const openEvidence = () => {
    if (!evidenceRoute) return
    try { window.sessionStorage.setItem(EVIDENCE_RETURN_STORAGE_KEY, caseCockpitRoute(item.slug)) } catch {}
    navigate(evidenceRoute)
  }
  const enterGeo = async () => {
    if (!item.customerId) return
    setBusy(true)
    setError('')
    try {
      const result = await api(`/crm/customers/${item.customerId}/enter-geo`, { method: 'POST' })
      setCurrentCustomer(result.customer)
      navigate(result.redirect)
    } catch (reason) {
      setError(reason.message)
    } finally {
      setBusy(false)
    }
  }

  return <div className="case-cockpit-shell">
    <header className="case-cockpit-topbar">
      <button onClick={() => navigate('/crm/cases')}><ArrowLeft /> 返回案例库</button>
      <div><span>{item.company}</span><small>演示案例驾驶舱 · 数据更新 2026-08-11</small></div>
      <select aria-label="驾驶舱视图" value={view} onChange={(event) => setView(event.target.value)}><option>AI搜索营销报表</option><option>问题词覆盖视图</option></select>
    </header>
    <main className="case-cockpit-main">
      <section className="case-cockpit-hero">
        <div className="case-cockpit-title"><span>AI PIONEER · GEO CASE COCKPIT</span><h1>{view}</h1><p>{item.brand} · {item.region} · {item.cycle}</p></div>
        <div className="case-platform-orbit">
          <div className="case-orbit-center"><Sparkles /><b>{item.brand}</b><span>{item.samples} 条演示采样</span></div>
          <div className="case-platform-list">{item.platforms.map((row) => <article key={row.name}><span>{row.name.slice(0, 1)}</span><div><b>{row.name}</b><small>{row.samples} 次采样</small></div><em>{row.mentions} 次提及</em></article>)}</div>
        </div>
      </section>

      <section className="case-cockpit-kpis">
        <article><i className="blue"><Gauge /></i><div><span>AI 提及率</span><b>{item.mentionRate}%</b><small>{totalMentions}/{item.samples} 条演示样本检出</small></div></article>
        <article><i className="violet"><Target /></i><div><span>被引用概率</span><b>{item.citationProbability}%</b><small>与提及率分开计算</small></div></article>
        <article><i className="green"><Database /></i><div><span>结构化要点</span><b>{item.includedPoints}</b><small>{item.keywords} 个核心问题词</small></div></article>
        <article><i className="orange"><BarChart3 /></i><div><span>覆盖平台</span><b>{item.platforms.length}</b><small>演示案例当前范围</small></div></article>
      </section>

      {viewKey === 'report' ? <section className="case-cockpit-analysis" data-view="report">
        <article className="case-trend-card"><header><div><span>VISIBILITY TREND</span><h2>提及与引用趋势</h2></div><em>近 4 周演示变化</em></header><div className="case-trend-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={item.trend}><defs><linearGradient id="caseMention" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4166f5" stopOpacity={0.3}/><stop offset="95%" stopColor="#4166f5" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="#edf0fa" vertical={false} /><XAxis dataKey="date" axisLine={false} tickLine={false} /><YAxis domain={[0, 100]} unit="%" axisLine={false} tickLine={false} /><Tooltip formatter={(value) => `${value}%`} /><Area type="monotone" dataKey="mentionRate" name="AI 提及率" stroke="#4166f5" strokeWidth={3} fill="url(#caseMention)" /><Area type="monotone" dataKey="citationProbability" name="被引用概率" stroke="#9a59e5" strokeWidth={2} fill="transparent" /></AreaChart></ResponsiveContainer></div></article>
        <article className="case-term-cloud"><header><span>EXPANDED QUERY SCENES</span><h2>拓展词出现的场景</h2></header><div>{item.coreProducts.map((term, index) => <span key={term} style={{ '--size': `${12 + (index % 3) * 4}px`, '--delay': `${index * 35}ms` }}>{term}</span>)}{item.questions.map((row, index) => <span key={row.keyword} className="question-term" style={{ '--size': `${11 + (index % 2) * 3}px` }}>{row.keyword}</span>)}</div><p>词云来自本案例演示问题词，不代表平台搜索量或模型推荐结论。</p></article>
      </section> : <section className="case-question-coverage" data-view="coverage">
        <header><div><span>QUESTION COVERAGE MAP</span><h2>问题词覆盖视图</h2></div><em>{item.questions.length} 个问题词 · {platformNames.length} 个平台</em></header>
        <div>{item.questions.map((row) => <article key={`${row.platform}-${row.keyword}`}><span>{row.platform}</span><h3>{row.keyword}</h3><p>{row.device} · 转化目标：{row.target}</p><em className={row.saved ? 'ready' : ''}>{row.saved ? '已保存真实快照' : '待补充原回答'}</em></article>)}</div>
        <p>此视图按问题词展示平台、设备、转化目标和凭证完整度；与趋势报表是不同的分析视角。</p>
      </section>}

      <section className="case-query-report">
        <header><div><span>SEARCH OBSERVATION REPORT</span><h2>问题词与凭证入口</h2></div><div className="case-query-filters"><select aria-label="筛选采样平台" value={platform} onChange={(event) => setPlatform(event.target.value)}><option>全部平台</option>{platformNames.map((name) => <option key={name}>{name}</option>)}</select><label><Search /><input aria-label="搜索案例问题词" placeholder="请输入问题" value={query} onChange={(event) => setQuery(event.target.value)} /></label></div></header>
        <div className="case-report-note"><ShieldCheck /> 案例指标为演示数据；只有标注“已保存真实快照”的记录可以打开原回答凭证。</div>
        <div className="table-scroll"><table><thead><tr><th>序号</th><th>问题词</th><th>平台</th><th>设备</th><th>转化目标</th><th>凭证状态</th><th>操作</th></tr></thead><tbody>{questions.map((row, index) => <tr key={`${row.platform}-${row.keyword}`}><td>{index + 1}</td><td><b>{row.keyword}</b></td><td>{row.platform}</td><td>{row.device}</td><td><span className="tag blue">{row.target}</span></td><td>{row.saved ? <span className="case-evidence-ready"><CheckCircle2 /> 已保存真实快照</span> : <span className="case-evidence-missing"><FileSearch /> 未保存原回答</span>}</td><td>{row.saved && evidenceRoute ? <button className="table-action evidence-action" onClick={openEvidence}>快照凭证</button> : <button className="table-action" disabled title={row.saved ? '凭证记录读取中或已失效' : '没有保存可回查的回答正文'}>{row.saved && !evidenceLoaded ? '读取中…' : '暂无凭证'}</button>}</td></tr>)}</tbody></table></div>
        {!questions.length && <div className="empty-state"><Search /><b>没有匹配的问题词</b><span>调整平台或关键词后再试。</span></div>}
      </section>

      <section className="case-cockpit-footer">
        <div><BadgeCheck /><span><b>数据口径说明</b><small>本页用于展示案例驾驶舱交互，指标来自仓库演示台账；不把页面打开、发布或平台收录等同于模型推荐。</small></span></div>
        <div className="case-cockpit-actions"><button onClick={() => navigate('/crm/cases')}>返回案例库</button>{item.customerId ? <button className="primary" onClick={enterGeo} disabled={busy}><ArrowUpRight /> {busy ? '正在进入…' : '进入关联 GEO 工作台'}</button> : <button disabled title="该演示案例没有精确匹配的 CRM 客户">未关联 CRM 客户</button>}</div>
      </section>
      {error && <div className="case-cockpit-error">{error}</div>}
    </main>
  </div>
}

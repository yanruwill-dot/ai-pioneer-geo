import { useEffect, useMemo, useState } from 'react'
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileCheck2,
  Search,
  Sparkles,
  X,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  filterPublicGeoRows,
  paginatePublicGeoRows,
  publicGeoPlatforms,
  publicGeoRows,
  publicGeoTerms,
  publicGeoTrend,
} from './publicGeoReportData.js'

const formatter = new Intl.NumberFormat('zh-CN')

function PioneerLogo() {
  return <div className="public-pioneer-logo" aria-label="AI先行者"><span className="public-pioneer-symbol"><i /><i /><i /></span><div><b>AI先行者</b><small>AI PIONEER</small></div></div>
}

function MetricCard({ tone, icon, title, value, detail, second }) {
  return <article className={`public-metric tone-${tone}`}>
    <i>{icon}</i>
    <div><span>{title}</span><b>{value}</b><small>{detail}</small></div>
    {second && <div className="public-metric-secondary"><span>{second.title}</span><b>{second.value}</b><small>{second.detail}</small></div>}
  </article>
}

function PlatformBadge({ row, active, onClick }) {
  return <button className={active ? 'active' : ''} aria-pressed={active} onClick={onClick}><i style={{ '--platform-tone': row.tone }}>{row.name.slice(0, 1)}</i><span>{row.name}</span><b>{formatter.format(row.value)}</b></button>
}

export function PublicGeoDashboardPage() {
  const [platform, setPlatform] = useState('全部平台')
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState('搜索报表')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [snapshot, setSnapshot] = useState(null)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    document.title = 'AI先行者搜荐·全域AI搜索'
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [])

  const filtered = useMemo(() => filterPublicGeoRows(publicGeoRows, { platform, query }), [platform, query])
  const paged = useMemo(() => paginatePublicGeoRows(filtered, page, pageSize), [filtered, page, pageSize])
  useEffect(() => { if (page !== paged.page) setPage(paged.page) }, [page, paged.page])

  const choosePlatform = (name) => {
    setPlatform((current) => current === name ? '全部平台' : name)
    setPage(1)
  }
  const flash = (message) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 1800)
  }

  return <main className="public-geo-page">
    <header className="public-geo-header">
      <div className="public-brand-lockup"><PioneerLogo /><span /><div className="public-research-logo"><b>CBAI</b><small>中国商业AI研究中心</small></div><div className="public-recommend-logo"><Sparkles /><b>AI先行者搜荐</b></div></div>
      <h1>大模型数据报表</h1>
      <div className="public-report-meta"><div><b>郑州市管城回族区青蓝艺术培训有限公司</b><span>数据更新日期：2026-08-12</span></div><select aria-label="报表类型"><option>AI搜索营销报表</option></select></div>
    </header>

    <section className="public-model-map">
      <div className="public-model-rail left">{publicGeoPlatforms.filter((row) => row.side === 'left').map((row) => <PlatformBadge key={row.name} row={row} active={platform === row.name} onClick={() => choosePlatform(row.name)} />)}</div>
      <div className="public-model-core"><div className="public-infinity"><i /><i /></div><div className="public-core-labels"><span><b>大模型</b><small>AI MODELS</small></span><span><b>AI搜索</b><small>AI SEARCH</small></span></div></div>
      <div className="public-model-rail right">{publicGeoPlatforms.filter((row) => row.side === 'right').map((row) => <PlatformBadge key={row.name} row={row} active={platform === row.name} onClick={() => choosePlatform(row.name)} />)}</div>
    </section>

    <div className="public-summary-grid">
      <section className="public-panel public-indicators">
        <header><BarChart3 /><b>数据指标</b></header>
        <div className="public-metric-grid">
          <MetricCard tone="peach" icon="◒" title="AI大模型排名收录总量" value="836937" detail="今日新增 ↑102　 近7日 ↑10436" />
          <MetricCard tone="blue" icon="✦" title="AI搜索词数量" value="137039" detail="近30日 ↑18633" second={{ title: '蒸馏词数量', value: '812', detail: '近30日 ↑555' }} />
          <MetricCard tone="violet" icon="Ai" title="收录AI平台数量" value="11" detail="总平台数 ↑11" />
          <MetricCard tone="green" icon="⌁" title="AI搜索转化方式收录总量" value="12297" detail="联系方式曝光" />
        </div>
      </section>
      <section className="public-panel public-term-panel">
        <header><Sparkles /><b>热词</b></header>
        <div className="public-term-cloud">{publicGeoTerms.map((term, index) => <button key={term} style={{ '--x': `${(index * 37) % 86}%`, '--y': `${(index * 53) % 82}%`, '--scale': 0.72 + (index % 5) * 0.12 }} onClick={() => { setQuery(term); setTab('搜索报表'); setPage(1); document.querySelector('.public-report-card')?.scrollIntoView({ behavior: 'smooth' }) }}>{term}</button>)}</div>
      </section>
    </div>

    <section className="public-panel public-trend-card">
      <header><div><BarChart3 /><b>文章数据与收录趋势图</b></div><select aria-label="趋势范围"><option>近30日</option></select></header>
      <div className="public-trend-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={publicGeoTrend} barGap={4}><CartesianGrid vertical={false} stroke="#e7e9f3" /><XAxis dataKey="date" axisLine={false} tickLine={false} /><YAxis axisLine={false} tickLine={false} unit="条" /><Tooltip cursor={{ fill: '#f5f6ff' }} /><Legend /><Bar dataKey="created" name="文章创作" fill="#6797ee" radius={[3, 3, 0, 0]} /><Bar dataKey="published" name="文章发布" fill="#86c9a5" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer></div>
    </section>

    <section className="public-panel public-report-card">
      <div className="public-report-tabs" role="tablist" aria-label="报表视图"><button role="tab" aria-selected={tab === '搜索报表'} className={tab === '搜索报表' ? 'active' : ''} onClick={() => setTab('搜索报表')}>搜索报表</button><button role="tab" aria-selected={tab === '高权重分站报表'} className={tab === '高权重分站报表' ? 'active' : ''} onClick={() => setTab('高权重分站报表')}>高权重分站报表</button></div>
      {tab === '搜索报表' ? <>
        <div className="public-report-warning"><b>!</b><span>由于 AI 大模型的动态学习、千人千面等特性，不同时间、不同区域的用户查询结果可能存在差异，报表支持在线预览最新的 <strong>2000</strong> 条数据。</span></div>
        <div className="public-platform-filters" aria-label="AI 平台筛选">{publicGeoPlatforms.map((row, index) => <button key={row.name} aria-pressed={platform === row.name} className={platform === row.name ? 'active' : ''} onClick={() => choosePlatform(row.name)}><i style={{ '--platform-tone': row.tone }}>{row.name.slice(0, 1)}</i><span>{row.name}<small>{index % 2 ? '移动' : 'PC'}({row.value > 99999 ? '99999+' : Math.round(row.value / 2)})</small></span></button>)}</div>
        <label className="public-table-search"><Search /><input aria-label="请输入问题" placeholder="请输入问题" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} />{(query || platform !== '全部平台') && <button aria-label="清空筛选" onClick={() => { setQuery(''); setPlatform('全部平台'); setPage(1) }}><X /></button>}</label>
        <div className="public-table-scroll"><table><thead><tr><th>序号</th><th>搜索词</th><th>平台</th><th>转化目标</th><th>操作</th></tr></thead><tbody>{paged.rows.map((row) => <tr key={row.id}><td>{row.id}</td><td><b>{row.keyword}</b></td><td>{row.platform} ({row.device})</td><td>{row.target}</td><td><div><button onClick={() => setSnapshot(row)}><FileCheck2 /> 快照凭证</button>{row.platformUrl ? <a href={row.platformUrl} aria-label={`打开豆包：${row.keyword}`}><ExternalLink /> 转到豆包</a> : <button disabled title="当前演示记录没有保存平台入口"><ExternalLink /> 暂无原会话</button>}</div></td></tr>)}</tbody></table></div>
        {!paged.rows.length && <div className="public-empty"><Search /><b>没有匹配的数据</b><span>清空平台或问题筛选后再试。</span></div>}
        <footer className="public-pagination"><button disabled={paged.page === 1} onClick={() => setPage((value) => value - 1)}><ChevronLeft /></button><span>第 <b>{paged.page}</b> / {paged.totalPages} 页</span><button disabled={paged.page === paged.totalPages} onClick={() => setPage((value) => value + 1)}><ChevronRight /></button><select aria-label="每页条数" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1) }}><option value="10">10 条/页</option><option value="20">20 条/页</option></select></footer>
      </> : <div className="public-station-grid">{['河南艺术教育指南', '郑州少儿培训观察', '管城兴趣教育导航', '中原艺术成长地图'].map((name, index) => <article key={name}><span>高权重分站 0{index + 1}</span><h2>{name}</h2><p>已覆盖品牌实体、地域服务与常见问答内容。</p><b>{128 + index * 37}<small> 条已收录</small></b><button onClick={() => flash(`${name} 数据已刷新`)}>查看分站数据</button></article>)}</div>}
    </section>

    <footer className="public-geo-footer"><PioneerLogo /><span>AI先行者 · 全域 AI 搜索数据服务</span></footer>
    {notice && <div className="public-toast">{notice}</div>}
    {snapshot && <div className="public-snapshot-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setSnapshot(null)}><article className="public-snapshot"><header><div><span>AI先行者 · 搜索快照凭证</span><h2>{snapshot.keyword}</h2></div><button aria-label="关闭快照" onClick={() => setSnapshot(null)}><X /></button></header><dl><div><dt>平台</dt><dd>{snapshot.platform} ({snapshot.device})</dd></div><div><dt>转化目标</dt><dd>{snapshot.target}</dd></div><div><dt>采集日期</dt><dd>2026-08-12</dd></div><div><dt>凭证编号</dt><dd>AI-{String(snapshot.id).padStart(4, '0')}</dd></div></dl><p>此页面为复刻演示数据凭证，不等同于目标平台实时查询结果。</p><button className="public-snapshot-close" onClick={() => setSnapshot(null)}>我知道了</button></article></div>}
  </main>
}

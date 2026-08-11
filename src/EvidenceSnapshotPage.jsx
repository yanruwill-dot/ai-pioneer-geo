import { useEffect, useState } from 'react'
import { useLocation } from 'wouter'
import { ArrowLeft, BadgeCheck, CheckCircle2, ClipboardCheck, Copy, ExternalLink, FileSearch, Link2, ShieldCheck } from 'lucide-react'
import { api, currentCustomer, isStaticDemo } from './api.js'
import { EVIDENCE_RETURN_STORAGE_KEY, safeEvidenceReturnRoute, safeHttpUrl, snapshotFingerprint, snapshotRoute } from './evidence.js'

function resultLabel(row) {
  if (row?.answer_text && row.mentioned) return '已保存原回答正文，并检出目标品牌提及'
  if (!row?.mentioned) return '本次结构化采样未检出品牌提及'
  if (row.cited) return `检出品牌提及与引用${row.rank ? ` · 排名 TOP ${row.rank}` : ''}`
  return `检出品牌提及，未检出引用${row.rank ? ` · 排名 TOP ${row.rank}` : ''}`
}

function HighlightedAnswer({ text, target }) {
  const terms = String(target || '').split(/[、,，/]/).map((item) => item.trim()).filter((item) => item.length > 1)
  if (!terms.length) return text
  const escaped = terms.map((item) => item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const matcher = new RegExp(`(${escaped.join('|')})`, 'g')
  const targetSet = new Set(terms)
  return String(text).split(matcher).map((part, index) => targetSet.has(part) ? <mark key={`${part}-${index}`}>{part}</mark> : part)
}

export function EvidenceSnapshotPage({ snapshotId, customerId }) {
  const fallbackCustomer = currentCustomer()
  const scopedCustomerId = Number(customerId || fallbackCustomer.id)
  const [, navigate] = useLocation()
  const [row, setRow] = useState(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  let storedReturnRoute = ''
  try { storedReturnRoute = window.sessionStorage?.getItem(EVIDENCE_RETURN_STORAGE_KEY) || '' } catch {}
  const returnRoute = safeEvidenceReturnRoute(storedReturnRoute)
  const returnLabel = returnRoute === '/geo/report' ? '返回报表' : '返回案例驾驶舱'

  useEffect(() => {
    let active = true
    setRow(null)
    setError('')
    if (!Number.isInteger(snapshotId) || snapshotId < 1 || !Number.isInteger(scopedCustomerId) || scopedCustomerId < 1) {
      setError('采样凭证不存在')
      return () => { active = false }
    }
    api(`/observations/${snapshotId}?customerId=${scopedCustomerId}`)
      .then((record) => { if (active) setRow(record) })
      .catch((reason) => { if (active) setError(reason.message) })
    return () => { active = false }
  }, [scopedCustomerId, snapshotId])

  if (error) return <main className="content-page evidence-page"><section className="evidence-missing"><FileSearch /><h1>没有找到这条快照凭证</h1><p>{error}</p><button className="primary-button" onClick={() => navigate(returnRoute)}>{returnLabel}</button></section></main>
  if (!row) return <div className="page-loader"><ClipboardCheck /> 正在读取采样凭证</div>

  const sourceUrl = safeHttpUrl(row.source_url)
  const hasAnswer = Boolean(row.answer_text)
  const isPlatformSnapshot = Boolean(sourceUrl)
  const captureTime = row.captured_at || row.observed_at
  const customerBrand = row.customer_brand || fallbackCustomer.brand
  const customerCompany = row.customer_company || fallbackCustomer.company
  const referenceCount = Math.max(0, Number(row.reference_count) || 0)
  const fingerprint = snapshotFingerprint(row)
  const copyLink = async () => {
    try {
      const canonicalPath = snapshotRoute(row.id, row.customer_id || scopedCustomerId)
      const canonicalUrl = isStaticDemo
        ? `${window.location.origin}${window.location.pathname}#${canonicalPath}`
        : new URL(canonicalPath, window.location.origin).href
      await navigator.clipboard?.writeText(canonicalUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return <main className="content-page evidence-page">
    <div className="evidence-page-heading"><button onClick={() => navigate(returnRoute)}><ArrowLeft /> {returnLabel}</button><div><span>GEO OBSERVATION EVIDENCE</span><h1>采样快照凭证</h1><p>{hasAnswer ? (isPlatformSnapshot ? '回查已保存的大模型问题、回答正文与原始会话。' : '回查已保存的内部案例问题、回答正文与采集信息。') : '回查本次采样保存的问题、结果与监测元数据。'}</p></div><button className="evidence-copy" onClick={copyLink}><Copy /> {copied ? '凭证链接已复制' : '复制凭证链接'}</button></div>
    <section className="evidence-certificate">
      <header><div className="evidence-seal"><ShieldCheck /></div><div><span>AI先行者 · GEO 数据凭证</span><h2>{row.keyword}</h2><p>{row.platform} · {captureTime}</p></div><em><BadgeCheck /> 已定位工作区记录 #{row.id}</em></header>

      <div className="evidence-platform-bar"><div><i>{String(row.platform || '平台').slice(0, 1)}</i><span><b>{row.platform}</b><small>{row.device || '设备未记录'}</small></span></div><span className={hasAnswer ? 'verified' : 'unseen'}>{hasAnswer ? <CheckCircle2 /> : <FileSearch />}{hasAnswer ? (isPlatformSnapshot ? '已保存平台回答' : '已保存案例回答') : '未保存回答正文'}</span></div>

      <section className="evidence-question-card"><span>原始提问</span><p>{row.keyword}</p></section>

      {hasAnswer ? <section className="evidence-answer-section">
        <div className="evidence-answer-toolbar"><div><span>{row.platform} 回答</span><small>{isPlatformSnapshot ? '从用户的平台历史会话保存' : '从产品内部案例演示记录保存'}</small></div><em>{captureTime}</em></div>
        <div className="evidence-answer-text"><HighlightedAnswer text={row.answer_text} target={row.conversion_target} /></div>
        <div className="evidence-source-strip">
          <div className="evidence-reference-note"><Link2 /><span><b>{isPlatformSnapshot ? (referenceCount ? `参考 ${referenceCount} 篇资料` : '参考资料数量未保存') : '内部案例演示快照'}</b><small>{isPlatformSnapshot ? (referenceCount ? '数量来自采集时的平台页面；单条引用 URL 未单独保存。' : '本地快照未保存单条引用明细。') : '用于验收内容存储与回查流程，没有外部平台原会话链接。'}</small></span></div>
          {sourceUrl && <a className="evidence-source-link" href={sourceUrl} target="_blank" rel="noreferrer"><ExternalLink /> 在豆包打开原始会话</a>}
        </div>
        <div className="evidence-capture-meta"><span>采集时间：{captureTime}</span><span>{isPlatformSnapshot ? '原始会话可能需要已登录的豆包账号' : '内部演示记录 · 未绑定外部平台会话'}</span></div>
      </section> : <section className="evidence-answer-empty" role="status"><FileSearch /><b>未保存原始回答正文</b><p>这条历史记录只保存了平台、问题、时间、设备、排名、提及与引用状态等结构化采样字段。凭证可以核对监测记录，但不能还原当时的大模型原文。</p></section>}

      <div className="evidence-result"><div><small>采样结论</small><b>{resultLabel(row)}</b></div><span className={row.mentioned ? 'verified' : 'unseen'}>{row.mentioned ? <CheckCircle2 /> : <FileSearch />}{row.mentioned ? '检出提及' : '未检出提及'}</span></div>
      <dl className="evidence-facts">
        <div><dt>监测品牌</dt><dd>{customerBrand}</dd></div><div><dt>采样平台</dt><dd>{row.platform}</dd></div><div><dt>采集时间</dt><dd>{captureTime}</dd></div><div><dt>采样设备</dt><dd>{row.device || '当前记录未保存'}</dd></div><div><dt>品牌排名</dt><dd>{row.rank ? `TOP ${row.rank}` : '平台未返回'}</dd></div><div><dt>情感标签</dt><dd>{row.sentiment || '平台未返回'}</dd></div><div><dt>转化目标</dt><dd>{row.conversion_target || '未单独保存'}</dd></div><div><dt>原会话链接</dt><dd>{sourceUrl ? '已保存可访问链接' : '未保存'}</dd></div>
      </dl>
      <section className="evidence-boundary"><ShieldCheck /><div><b>证据边界</b><p>{hasAnswer ? (isPlatformSnapshot ? <>回答正文保存自用户已登录的平台历史会话，原始链接用于回查。此页不是平台官方签章、数字签名或第三方存证；模型回答也可能存在错误。“参考 {referenceCount} 篇资料”只记录页面当时显示的数量，不等同于目标品牌或某个网页被引用。</> : <>这是产品内部案例演示回答，用于验收快照存储、展示与返回路径。未绑定外部大模型原会话，不代表平台真实推荐、引用或第三方存证。</>) : <>本凭证仅证明工作区保存了这条结构化监测记录，未保存当时的回答正文、引用明细或原会话链接，不能据此还原模型原话，也不是平台官方签章、数字签名或第三方存证。</>}</p></div></section>
      <footer><div><span>工作区一致性校验码</span><b>{fingerprint}</b></div><div><span>记录归属</span><b>{customerCompany}</b></div><button onClick={() => navigate(returnRoute)}>{returnRoute === '/geo/report' ? '回到对应报表' : '回到案例驾驶舱'} <ExternalLink /></button></footer>
    </section>
  </main>
}

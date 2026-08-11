const SCENE_BY_CATEGORY = {
  核心业务: '需求检索',
  问题词: '问题求解',
  行业词: '行业比较',
  地域词: '本地决策',
}

const round = (value, digits = 1) => Number(Number(value || 0).toFixed(digits))
const percent = (value, total) => total ? round((value / total) * 100) : 0

export function normalizeObservedAt(value, fallback = null) {
  const fallbackValue = fallback instanceof Date
    ? fallback.toISOString().replace('T', ' ').slice(0, 19)
    : fallback
  const raw = String(value ?? '').trim() || String(fallbackValue ?? '').trim()
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d{1,9})?(?:Z|([+-])(\d{2}):(\d{2}))?)?$/)
  if (!match) return null

  const [, yearText, monthText, dayText, hourText = '0', minuteText = '0', secondText = '0', , offsetHourText, offsetMinuteText] = match
  const [year, month, day, hour, minute, second] = [yearText, monthText, dayText, hourText, minuteText, secondText].map(Number)
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  if (year < 1000 || month < 1 || month > 12 || day < 1 || day > daysInMonth || hour > 23 || minute > 59 || second > 59) return null
  if (offsetHourText && (Number(offsetHourText) > 14 || Number(offsetMinuteText) > 59 || (Number(offsetHourText) === 14 && Number(offsetMinuteText) > 0))) return null
  return raw
}

export function normalizeObservationRank(value, mentioned) {
  const rank = Number(value)
  return Number(mentioned) && Number.isFinite(rank) && rank > 0 ? Math.max(1, Math.round(rank)) : null
}

export function sceneForCategory(category = '') {
  return SCENE_BY_CATEGORY[category] || '待识别场景'
}

function aggregate(rows) {
  const samples = rows.length
  const mentions = rows.reduce((sum, row) => sum + Number(row.mentioned || 0), 0)
  const citations = rows.reduce((sum, row) => sum + Number(row.cited || 0), 0)
  return {
    samples,
    mentions,
    citations,
    mentionRate: percent(mentions, samples),
    citationRate: percent(citations, samples),
    citationProbability: percent(citations, mentions),
  }
}

function period(rows, label) {
  const metrics = aggregate(rows)
  const dates = [...new Set(rows.map((row) => String(row.observed_at || '').slice(0, 10)).filter(Boolean))].sort()
  return { label, from: dates[0] || null, to: dates.at(-1) || null, ...metrics }
}

function delta(current, baseline, key) {
  return round(current[key] - baseline[key])
}

export function buildGeoInsights({ observations = [], keywords = [] } = {}) {
  // 引用是提及的子集；脏数据里出现“未提及但被引用”时，按保守口径不计入引用概率。
  const rows = observations.flatMap((row) => {
    const observedAt = normalizeObservedAt(row.observed_at)
    if (!observedAt) return []
    const mentioned = Number(row.mentioned || 0)
    return [{ ...row, observed_at: observedAt, mentioned, cited: mentioned ? Number(row.cited || 0) : 0 }]
  })
  const dates = [...new Set(rows.map((row) => String(row.observed_at || '').slice(0, 10)).filter(Boolean))].sort()
  const split = dates.length > 1 ? Math.max(1, Math.floor(dates.length / 2)) : 0
  const baselineDates = new Set(dates.slice(0, split))
  const currentDates = new Set(dates.slice(split))
  const baselineRows = split ? rows.filter((row) => baselineDates.has(String(row.observed_at).slice(0, 10))) : []
  const currentRows = split ? rows.filter((row) => currentDates.has(String(row.observed_at).slice(0, 10))) : rows
  const baseline = period(baselineRows, '基线周期')
  const current = period(currentRows, '当前周期')

  const platformMap = new Map()
  for (const row of rows) {
    const item = platformMap.get(row.platform) || []
    item.push(row)
    platformMap.set(row.platform, item)
  }
  const platformStats = [...platformMap.entries()].map(([platform, platformRows]) => {
    const metrics = aggregate(platformRows)
    const ranked = platformRows.filter((row) => row.rank !== null && row.rank !== undefined)
    return {
      platform,
      ...metrics,
      averageRank: ranked.length ? round(ranked.reduce((sum, row) => sum + Number(row.rank), 0) / ranked.length) : null,
    }
  }).sort((a, b) => b.mentions - a.mentions || a.platform.localeCompare(b.platform))

  const keywordMap = new Map(keywords.map((keyword) => [keyword.word, keyword]))
  const keywordGroups = new Map()
  const keywordPerformance = [...new Set(rows.map((row) => row.keyword))].map((word) => {
    const keyword = keywordMap.get(word) || { word, category: '未分类' }
    const keywordRows = rows.filter((row) => row.keyword === word)
    const metrics = aggregate(keywordRows)
    const item = {
      word,
      category: keyword.category,
      scene: sceneForCategory(keyword.category),
      searchVolume: Number(keyword.search_volume || keyword.searchVolume || 0),
      ...metrics,
      platforms: [...new Set(keywordRows.map((row) => row.platform))],
      lastObserved: [...keywordRows].sort((a, b) => String(b.observed_at).localeCompare(String(a.observed_at)))[0]?.observed_at || null,
    }
    const groupKey = `${item.category}::${item.scene}`
    const group = keywordGroups.get(groupKey) || { category: item.category, scene: item.scene, keywords: [], rows: [] }
    group.keywords.push(item)
    group.rows.push(...keywordRows)
    keywordGroups.set(groupKey, group)
    return item
  }).sort((a, b) => b.mentionRate - a.mentionRate || b.samples - a.samples)

  const keywordScenes = [...keywordGroups.values()].map((group) => {
    const metrics = aggregate(group.rows)
    return {
      category: group.category,
      scene: group.scene,
      keywordCount: group.keywords.length,
      topTerms: group.keywords.sort((a, b) => b.mentionRate - a.mentionRate).slice(0, 3).map((item) => item.word),
      platforms: [...new Set(group.rows.map((row) => row.platform))],
      ...metrics,
    }
  }).sort((a, b) => b.mentionRate - a.mentionRate)

  const trend = dates.map((date) => {
    const dayRows = rows.filter((row) => String(row.observed_at).slice(0, 10) === date)
    return { date: date.slice(5), ...aggregate(dayRows) }
  })

  const metrics = {
    mentionRate: current.mentionRate,
    baselineMentionRate: baseline.mentionRate,
    mentionRateDelta: delta(current, baseline, 'mentionRate'),
    citationProbability: current.citationProbability,
    baselineCitationProbability: baseline.citationProbability,
    citationProbabilityDelta: delta(current, baseline, 'citationProbability'),
    citationRate: current.citationRate,
    baselineCitationRate: baseline.citationRate,
    citationRateDelta: delta(current, baseline, 'citationRate'),
  }

  return {
    ...aggregate(rows),
    platforms: platformStats.filter((item) => item.mentions > 0).length,
    words: new Set(rows.map((row) => row.keyword)).size,
    visibilityRate: current.mentionRate,
    top1: rows.filter((row) => Number(row.rank) === 1).length,
    top1Rate: percent(rows.filter((row) => Number(row.rank) === 1).length, rows.length),
    positiveSentimentRate: percent(rows.filter((row) => row.sentiment === '正向').length, rows.length),
    currentPeriod: current,
    baselinePeriod: baseline,
    dateRange: { from: dates[0] || null, to: dates.at(-1) || null, dates },
    ...metrics,
    platformStats,
    keywordScenes,
    keywordPerformance,
    trend,
  }
}

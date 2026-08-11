export function snapshotFingerprint(row = {}) {
  const canonical = [
    row.id,
    row.customer_id,
    row.platform,
    row.keyword,
    row.rank ?? '',
    Number(row.mentioned || 0),
    Number(row.cited || 0),
    row.sentiment,
    row.device,
    row.observed_at,
    row.captured_at,
    row.source_url,
    row.reference_count ?? 0,
    row.conversion_target,
    row.answer_text,
  ].join('|')
  let hash = 2166136261
  for (let index = 0; index < canonical.length; index += 1) {
    hash ^= canonical.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  const customer = String(row.customer_id || 0).padStart(3, '0')
  const record = String(row.id || 0).padStart(5, '0')
  return `GEO-${customer}-${record}-${(hash >>> 0).toString(16).toUpperCase().padStart(8, '0')}`
}

export function safeHttpUrl(value) {
  try {
    const url = new URL(String(value || ''))
    return ['http:', 'https:'].includes(url.protocol) ? url.href : ''
  } catch {
    return ''
  }
}

export function snapshotRoute(id, customerId) {
  const numericId = Number(id)
  const numericCustomerId = Number(customerId)
  return Number.isInteger(numericId) && numericId > 0 && Number.isInteger(numericCustomerId) && numericCustomerId > 0
    ? `/geo/evidence/${numericCustomerId}/${numericId}`
    : '/geo/report'
}

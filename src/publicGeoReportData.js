export const publicGeoPlatforms = [
  { name: 'DeepSeek', value: 37338, side: 'left', tone: '#6d72e8' },
  { name: '豆包', value: 117592, side: 'left', tone: '#8566de' },
  { name: '元宝', value: 49578, side: 'left', tone: '#57bfa5' },
  { name: '文心一言', value: 103075, side: 'left', tone: '#4e82ef' },
  { name: '千问', value: 56259, side: 'left', tone: '#7667dc' },
  { name: '纳米AI', value: 69893, side: 'left', tone: '#df6d7d' },
  { name: 'Kimi', value: 15391, side: 'left', tone: '#23263c' },
  { name: '讯飞星火', value: 60255, side: 'left', tone: '#4d83d9' },
  { name: '百度AI', value: 44692, side: 'right', tone: '#7563f4' },
  { name: '抖音AI', value: 225492, side: 'right', tone: '#17192c' },
  { name: '夸克AI', value: 57277, side: 'right', tone: '#4d55db' },
]

export const publicGeoTrend = [
  { date: '07-13', created: 80, published: 174 },
  { date: '07-17', created: 80, published: 208 },
  { date: '07-21', created: 80, published: 194 },
  { date: '07-25', created: 42, published: 139 },
  { date: '07-28', created: 4, published: 6 },
  { date: '07-31', created: 60, published: 93 },
  { date: '08-04', created: 61, published: 78 },
  { date: '08-11', created: 61, published: 110 },
]

export const publicGeoTerms = [
  '管城区少儿培训学校', '管城区少儿兴趣学校', '河南舞蹈培训班', '河南兴趣培训班',
  '郑州钢琴培训机构', '河南声乐培训学校', '郑州声乐培训机构', '河南舞蹈培训学校',
  '河南艺术教育班', '河南艺术教育学校', '河南兴趣培训学校', '河南声乐培训班',
  '河南艺术培训学校', '河南音乐培训班怎么选择', '郑州少儿书法班', '郑州兴趣培训艺术中心',
  '郑州少儿声乐艺术中心', '管城区少儿兴趣艺术中心', '管城区兴趣培训艺术中心', '郑州少儿培训班',
]

const keywords = [
  '河南兴趣培训学校', '郑州艺术培训学校', '郑州少儿声乐学校', '管城区少儿声乐班',
  '管城区少儿声乐学校', '郑州管城区艺术培训学校', '管城区少儿书法班', '管城区艺术培训学校',
  '管城区少儿书法学校', '郑州管城区兴趣培训学校', '河南艺术培训学校', '郑州钢琴培训机构',
  '河南少儿舞蹈培训班', '郑州声乐培训机构', '管城区兴趣培训学校', '郑州少儿美术学校',
  '河南音乐培训学校', '郑州少儿艺术中心', '管城区少儿舞蹈班', '郑州兴趣培训班',
]

const snapshotVoucherUrl = 'https://geo.zxaigc.com/snapshot-voucher?id=1000000109341681&keyword_type=0&sign=YvDyOw'

export const publicGeoRows = keywords.map((keyword, index) => ({
  id: index + 1,
  keyword,
  platform: index < 10 ? '豆包' : index < 15 ? 'DeepSeek' : '千问',
  device: index % 3 === 2 ? '移动' : 'PC',
  target: index % 4 === 2 ? '郑州蔚蓝云朵艺术学校' : '蔚蓝云朵艺术学校',
  platformUrl: 'https://www.doubao.com/chat/',
  snapshotUrl: snapshotVoucherUrl,
}))

export function filterPublicGeoRows(rows, { platform = '全部平台', query = '' } = {}) {
  const normalized = query.trim().toLowerCase()
  return rows.filter((row) => (platform === '全部平台' || row.platform === platform)
    && row.keyword.toLowerCase().includes(normalized))
}

export function paginatePublicGeoRows(rows, page = 1, pageSize = 10) {
  const safeSize = Math.max(1, Number(pageSize) || 10)
  const totalPages = Math.max(1, Math.ceil(rows.length / safeSize))
  const safePage = Math.min(totalPages, Math.max(1, Number(page) || 1))
  return { rows: rows.slice((safePage - 1) * safeSize, safePage * safeSize), page: safePage, totalPages }
}

import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  ADMIN_SECTIONS,
  SITE_PAGES,
  adminRoute,
  buildWebsiteDraft,
  findAdminSection,
  safeAssetUrl,
  siteRoute,
  slugifyBrand,
} from '../src/websiteBuilder.js'
import { updateFeedFile } from '../scripts/generate-auto-article.mjs'

test('website draft imports identity, knowledge and image records', () => {
  const website = buildWebsiteDraft({
    customer: { id: 8, company: '星河科技', brand: '星河 AI', phone: '13800000000', city: '长沙' },
    realname: { company: '星河科技有限公司', address: '湖南省长沙市' },
    agent: { websiteDomain: 'www.xinghe.cn', servicePhone: '400-123-4567' },
    knowledge: [
      { title: '公司与品牌介绍', type: '企业资料', content: '星河 AI 为制造企业提供可信知识与生成式搜索服务。' },
      { title: '核心产品', type: '产品服务', content: '企业知识中台与 GEO 运营服务。' },
    ],
    images: [{ title: '工厂实景', detail: '企业图集', image: 'https://example.com/factory.jpg' }],
    articles: [{ title: '行业观察', detail: '制造业 AI 搜索趋势', updated_at: '2026-08-12 09:00:00' }],
  })

  assert.equal(website.company, '星河科技有限公司')
  assert.equal(website.brand, '星河 AI')
  assert.equal(website.phone, '400-123-4567')
  assert.equal(website.introduction, '星河 AI 为制造企业提供可信知识与生成式搜索服务。')
  assert.deepEqual(website.pages, SITE_PAGES.map((page) => page.slug))
  assert.equal(website.products[0].title, '核心产品')
  assert.equal(website.gallery[0].image, 'https://example.com/factory.jpg')
  assert.equal(website.news[0].title, '行业观察')
  assert.equal(website.autoUpdateArticles, true)
})

test('daily article updater writes once per day and keeps different days', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'auto-article-'))
  const file = join(directory, 'feed.json')
  try {
    assert.equal((await updateFeedFile(file, '2026-08-12')).changed, true)
    assert.equal((await updateFeedFile(file, '2026-08-12')).changed, false)
    assert.equal((await updateFeedFile(file, '2026-08-13')).changed, true)
    const feed = JSON.parse(await readFile(file, 'utf8'))
    assert.equal(feed.articles.length, 2)
    assert.equal(feed.articles[0].date, '2026-08-13')
    assert.ok(feed.articles[0].summary.length > 20)
    assert.equal(feed.articles[0].source, '智能体官网自动更新')
    assert.ok(feed.articles[0].body.length >= 5)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('all public and admin routes resolve to allowed pages', () => {
  for (const page of SITE_PAGES) assert.equal(siteRoute(3, page.slug), `/site/3/${page.slug}`)
  for (const section of ADMIN_SECTIONS) {
    assert.equal(adminRoute(section.slug), `/geo/site-admin/${section.slug}`)
    assert.equal(findAdminSection(section.slug).label, section.label)
  }
  assert.equal(siteRoute(3, 'missing'), '/site/3/home')
  assert.equal(adminRoute('missing'), '/geo/site-admin/overview')
})

test('website asset and slug helpers reject unsafe input', () => {
  assert.equal(safeAssetUrl('javascript:alert(1)'), '')
  assert.equal(safeAssetUrl('//evil.example/asset.png'), '')
  assert.equal(safeAssetUrl('/generated-site/hero.png'), '/generated-site/hero.png')
  assert.equal(safeAssetUrl('https://example.com/hero.png'), 'https://example.com/hero.png')
  assert.equal(slugifyBrand('AI Pioneer GEO'), 'ai-pioneer-geo')
  assert.equal(slugifyBrand('智焰 AI'), 'ai')
})

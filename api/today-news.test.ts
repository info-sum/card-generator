import assert from 'node:assert/strict'
import test from 'node:test'

import { ADDITIONAL_NEWS_RSS_SOURCES, parseRssItems, selectCardNewsCandidates } from './today-news.js'

test('additional news feeds include the selected Korean IT and AI sources', () => {
  const feedUrls = ADDITIONAL_NEWS_RSS_SOURCES.map((source) => source.url)

  assert.deepEqual(feedUrls, [
    'https://feeds.feedburner.com/zdkorea',
    'https://techcrunch.com/category/artificial-intelligence/feed/',
  ])
})

test('parseRssItems excludes escaped code blocks from the article summary', () => {
  const items = parseRssItems(`
    <rss><channel><item>
      <title>새 AI 모델 공개 - Example News</title>
      <link>https://example.com/article</link>
      <description><![CDATA[<p>새 모델은 응답 속도와 비용 효율을 개선했습니다.</p><pre>const secret = process.env.SECRET;</pre>]]></description>
      <pubDate>Tue, 22 Jul 2026 10:00:00 GMT</pubDate>
    </item></channel></rss>
  `)

  assert.deepEqual(items, [{
    title: '새 AI 모델 공개',
    summary: '새 모델은 응답 속도와 비용 효율을 개선했습니다.',
    publisher: 'Example News',
    sourcePlatform: '뉴스',
    url: 'https://example.com/article',
    publishedAt: 'Tue, 22 Jul 2026 10:00:00 GMT',
  }])
})

test('selectCardNewsCandidates keeps only the last 48 hours in publication order', () => {
  const now = Date.parse('2026-07-22T12:00:00.000Z')
  const candidates = selectCardNewsCandidates([
    {
      title: '25 hours old technology update',
      summary: '',
      publisher: 'Example',
      sourcePlatform: 'X',
      url: 'https://example.com/old',
      publishedAt: '2026-07-21T10:59:59.000Z',
    },
    {
      title: 'Earlier technology update',
      summary: '',
      publisher: 'Example',
      sourcePlatform: 'X',
      url: 'https://example.com/earlier',
      publishedAt: '2026-07-22T09:00:00.000Z',
    },
    {
      title: 'Latest technology update',
      summary: '',
      publisher: 'Example',
      sourcePlatform: '뉴스',
      url: 'https://example.com/latest',
      publishedAt: '2026-07-22T11:00:00.000Z',
    },
  ], now)

  assert.deepEqual(candidates.map((candidate) => candidate.url), [
    'https://example.com/latest',
    'https://example.com/earlier',
    'https://example.com/old',
  ])
})

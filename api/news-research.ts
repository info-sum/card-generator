import { parseRssItems } from './today-news.js'
import type { NewsResearchInput, NewsResearchResult, RelatedNewsArticle } from '../src/lib/newsResearch.js'

type ApiRequest = {
  readonly method?: string
  readonly body?: unknown
}

type ApiResponse = {
  status(code: number): ApiResponse
  json(body: unknown): void
  setHeader(name: string, value: string): void
}

type ArticleCandidate = RelatedNewsArticle & { readonly score: number }

const MAX_ARTICLE_HTML_BYTES = 700_000
const MAX_ARTICLE_EXCERPT_CHARS = 1_200
const MAX_RELATED_ARTICLES = 3
const GOOGLE_NEWS_SEARCH_URL = 'https://news.google.com/rss/search?hl=ko&gl=KR&ceid=KR:ko&q='
const STOP_WORDS = new Set(['그리고', '에서', '으로', '에게', '대한', '관련', '한다', '했다', '위한', '통해', '이후', '이번', '뉴스', '기사', 'the', 'with', 'from', 'this', 'that', 'into', 'over'])

export default async function handler(request: ApiRequest, response: ApiResponse) {
  response.setHeader('cache-control', 'no-store')
  if (request.method !== 'POST') {
    response.status(405).json({ message: 'POST 요청만 지원합니다.' })
    return
  }

  const selected = normalizeInput(request.body)
  if (selected == null) {
    response.status(400).json({ message: '뉴스 제목과 원문 링크가 필요해요.' })
    return
  }

  try {
    const [articleSummary, relatedArticles] = await Promise.all([
      fetchArticleSummary(selected),
      fetchRelatedArticles(selected),
    ])
    const body: NewsResearchResult = { articleSummary, relatedArticles }
    response.status(200).json(body)
  } catch (error) {
    const message = error instanceof Error ? error.message : '뉴스 내용을 정리하지 못했어요.'
    response.status(502).json({ message })
  }
}

async function fetchArticleSummary(selected: NewsResearchInput) {
  const fallback = selected.summary?.trim() || `${selected.title} 관련 공개 기사입니다.`
  try {
    const articleResponse = await fetch(selected.url, {
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; CardStudio News Research/1.0)' },
      redirect: 'follow',
    })
    if (!articleResponse.ok) return fallback
    const html = (await articleResponse.text()).slice(0, MAX_ARTICLE_HTML_BYTES)
    const metaDescription = readMeta(html, 'description') || readMeta(html, 'og:description')
    const paragraphs = Array.from(html.matchAll(/<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/gi), (match) => cleanText(match[1] ?? ''))
      .filter((paragraph) => paragraph.length >= 40)
      .slice(0, 4)
    const sourceText = [metaDescription, ...paragraphs].filter(Boolean).join(' ')
    return trimToSentence(sourceText || fallback, MAX_ARTICLE_EXCERPT_CHARS)
  } catch {
    return fallback
  }
}

async function fetchRelatedArticles(selected: NewsResearchInput): Promise<readonly RelatedNewsArticle[]> {
  const keywords = buildSearchKeywords(`${selected.title} ${selected.summary ?? ''}`)
  if (keywords.length === 0) return []
  const rssResponse = await fetch(`${GOOGLE_NEWS_SEARCH_URL}${encodeURIComponent(keywords.join(' '))}`, {
    headers: { 'user-agent': 'CardStudio News Research/1.0' },
  })
  if (!rssResponse.ok) return []

  const selectedTitleKey = normalizedTitle(selected.title)
  return parseRssItems((await rssResponse.text()).slice(0, MAX_ARTICLE_HTML_BYTES))
    .map((item): ArticleCandidate => ({
      title: item.title,
      publisher: item.publisher,
      url: item.url,
      summary: trimToSentence(item.summary, 360),
      publishedAt: item.publishedAt,
      score: overlapScore(selected.title, `${item.title} ${item.summary}`),
    }))
    .filter((item) => normalizedTitle(item.title) !== selectedTitleKey && item.score > 0)
    .filter(dedupeBy((item) => `${normalizedTitle(item.title)}|${item.url}`))
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RELATED_ARTICLES)
    .map((item) => ({
      title: item.title,
      publisher: item.publisher,
      url: item.url,
      summary: item.summary,
      publishedAt: item.publishedAt,
    }))
}

function normalizeInput(input: unknown): NewsResearchInput | null {
  if (!isRecord(input)) return null
  const title = readText(input.title)
  const url = normalizeHttpUrl(readText(input.url))
  if (title.length === 0 || url.length === 0) return null
  return {
    title: title.slice(0, 200),
    url,
    publisher: readText(input.publisher).slice(0, 100),
    summary: readText(input.summary).slice(0, 1_000) || undefined,
    publishedAt: readText(input.publishedAt).slice(0, 100) || undefined,
  }
}

function buildSearchKeywords(value: string) {
  return Array.from(new Set(value.toLowerCase().match(/[\p{L}\p{N}]{2,}/gu) ?? []))
    .filter((term) => !STOP_WORDS.has(term))
    .slice(0, 7)
}

function overlapScore(source: string, candidate: string) {
  const sourceTerms = buildSearchKeywords(source)
  const candidateLower = candidate.toLowerCase()
  return sourceTerms.reduce((score, term) => score + (candidateLower.includes(term) ? 1 : 0), 0)
}

function readMeta(html: string, key: string) {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const patterns = [
    new RegExp(`<meta[^>]+(?:name|property)=["']${escapedKey}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${escapedKey}["']`, 'i'),
  ]
  for (const pattern of patterns) {
    const value = cleanText(pattern.exec(html)?.[1] ?? '')
    if (value.length > 0) return value
  }
  return ''
}

function trimToSentence(value: string, maxLength: number) {
  const compact = cleanText(value)
  if (compact.length <= maxLength) return compact
  const boundary = compact.lastIndexOf('.', maxLength)
  return `${compact.slice(0, boundary > maxLength * 0.55 ? boundary + 1 : maxLength).trim()}…`
}

function cleanText(value: string) {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizedTitle(value: string) {
  return value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '')
}

function dedupeBy<T>(keyOf: (value: T) => string) {
  const seen = new Set<string>()
  return (value: T) => {
    const key = keyOf(value)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }
}

function readText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : ''
  } catch {
    return ''
  }
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

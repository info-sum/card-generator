import type { TodayNewsItem, TodayNewsResponse } from '../src/lib/todayNews.js'
import { parseRssItems, toNewsSummary } from './news-rss.js'

export { parseRssItems } from './news-rss.js'

type ApiRequest = {
  readonly method?: string
}

type ApiResponse = {
  status(code: number): ApiResponse
  json(body: unknown): void
  setHeader(name: string, value: string): void
}

type SourcePlatform = TodayNewsItem['sourcePlatform']

type FeedItem = {
  readonly title: string
  readonly summary: string
  readonly publisher: string
  readonly sourcePlatform: SourcePlatform
  readonly url: string
  readonly publishedAt: string
}

type Triage = {
  readonly score: number
  readonly category: string
  readonly whyNow: string
  readonly suggestedAngle: string
}

const GOOGLE_NEWS_RSS_URL = 'https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko'
const AI_MODEL_RSS_URL = `https://news.google.com/rss/search?hl=ko&gl=KR&ceid=KR:ko&q=${encodeURIComponent('OpenAI OR Anthropic OR Gemini OR Claude OR GPT OR Grok OR Llama OR Qwen OR DeepSeek OR Mistral AI 모델')}`
const X_WATCHED_ACCOUNTS = ['OpenAI', 'AnthropicAI', 'GoogleDeepMind', 'xai', 'MistralAI', 'huggingface']
export const ADDITIONAL_NEWS_RSS_SOURCES = [
  { publisher: 'ZDNet Korea', url: 'https://feeds.feedburner.com/zdkorea' },
  { publisher: 'TechCrunch', url: 'https://techcrunch.com/category/artificial-intelligence/feed/' },
] as const satisfies readonly { readonly publisher: string; readonly url: string }[]
const MAX_CANDIDATES = 12
const MAX_NEWS_AGE_MS = 48 * 60 * 60 * 1_000
const MAX_FEED_BYTES = 1_000_000
const MODEL_TERMS = ['openai', 'anthropic', 'gemini', 'claude', 'gpt', 'grok', 'llama', 'qwen', 'deepseek', 'mistral', '모델', 'llm']
const TOPIC_SIGNALS = [
  { category: 'AI 모델', terms: MODEL_TERMS },
  { category: 'AI · 테크', terms: ['ai', '인공지능', '반도체', '로봇', '앱', '플랫폼', '테크', '디지털', '데이터', '보안'] },
  { category: '경제 · 비즈니스', terms: ['금리', '환율', '증시', '주가', '경제', '투자', '기업', '시장', '물가', '부동산'] },
  { category: '사회 · 정책', terms: ['정부', '정책', '법', '국회', '선거', '교육', '의료', '노동', '환경', '교통'] },
  { category: '라이프 · 문화', terms: ['문화', '콘텐츠', '영화', '음악', '스포츠', '여행', '건강', '소비', '트렌드'] },
] as const

export default async function handler(request: ApiRequest, response: ApiResponse) {
  response.setHeader('cache-control', 'public, s-maxage=300, stale-while-revalidate=900')

  if (request.method !== 'GET') {
    response.status(405).json({ message: 'GET 요청만 지원합니다.' })
    return
  }

  try {
    const [generalFeed, modelFeed, ...additionalFeeds] = await Promise.allSettled([
      fetchRssItems(GOOGLE_NEWS_RSS_URL),
      fetchRssItems(AI_MODEL_RSS_URL),
      ...ADDITIONAL_NEWS_RSS_SOURCES.map((source) => fetchRssItems(source.url, source.publisher)),
      ...X_WATCHED_ACCOUNTS.map(fetchXTimeline),
    ])
    const items = [generalFeed, modelFeed, ...additionalFeeds].flatMap(readSettledItems)
    const body: TodayNewsResponse = {
      generatedAt: new Date().toISOString(),
      items: selectCardNewsCandidates(items),
    }
    response.status(200).json(body)
  } catch (error) {
    const message = error instanceof Error ? error.message : '오늘의 뉴스를 불러오지 못했어요.'
    response.status(502).json({ message })
  }
}

async function fetchRssItems(url: string, fallbackPublisher = ''): Promise<readonly FeedItem[]> {
  const feedResponse = await fetch(url, { headers: { 'user-agent': 'CardStudio Today News/1.1' } })
  if (!feedResponse.ok) throw new Error(`뉴스 피드 요청 실패 (${feedResponse.status})`)
  const items = parseRssItems((await feedResponse.text()).slice(0, MAX_FEED_BYTES))
  return fallbackPublisher.length === 0
    ? items
    : items.map((item) => item.publisher.length === 0 ? { ...item, publisher: fallbackPublisher } : item)
}

async function fetchXTimeline(handle: string): Promise<readonly FeedItem[]> {
  const url = `https://syndication.twitter.com/srv/timeline-profile/screen-name/${handle}`
  const timelineResponse = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 CardStudio AI model radar' } })
  if (!timelineResponse.ok) throw new Error(`X 공개 타임라인 요청 실패 (${timelineResponse.status})`)
  return parseXTimeline((await timelineResponse.text()).slice(0, MAX_FEED_BYTES), handle)
}

function readSettledItems(result: PromiseSettledResult<readonly FeedItem[]>) {
  return result.status === 'fulfilled' ? result.value : []
}

export function parseXTimeline(html: string, handle: string): readonly FeedItem[] {
  const dataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/i)
  if (dataMatch?.[1] == null) return []

  try {
    const payload = JSON.parse(dataMatch[1]) as { props?: { pageProps?: { timeline?: { entries?: readonly unknown[] } } } }
    const entries = payload.props?.pageProps?.timeline?.entries ?? []
    return entries.flatMap((entry) => parseXEntry(entry, handle))
  } catch {
    return []
  }
}

function parseXEntry(entry: unknown, handle: string): readonly FeedItem[] {
  if (!isRecord(entry) || entry.type !== 'tweet' || !isRecord(entry.content) || !isRecord(entry.content.tweet)) return []
  const tweet = entry.content.tweet
  const id = readText(tweet.id_str) || readText(tweet.conversation_id_str)
  const text = cleanText(readText(tweet.full_text) || readText(tweet.text))
  if (id.length === 0 || text.length < 16) return []

  return [{
    title: text.slice(0, 100),
    summary: toNewsSummary(text).slice(0, 220),
    publisher: `@${handle}`,
    sourcePlatform: 'X',
    url: `https://x.com/${handle}/status/${id}`,
    publishedAt: readText(tweet.created_at),
  }]
}

export function selectCardNewsCandidates(items: readonly FeedItem[], now = Date.now()): readonly TodayNewsItem[] {
  const seenTitles = new Set<string>()
  const ranked = items
    .map((item, index) => ({ item, index, publishedAt: Date.parse(item.publishedAt), triage: triageItem(item) }))
    .filter(({ publishedAt }) => Number.isFinite(publishedAt) && publishedAt <= now && publishedAt >= now - MAX_NEWS_AGE_MS)
    .sort((a, b) => b.publishedAt - a.publishedAt || b.triage.score - a.triage.score || a.index - b.index)
    .filter(({ item }) => {
      const key = item.title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '')
      if (key.length < 8 || seenTitles.has(key)) return false
      seenTitles.add(key)
      return true
    })
  const selected = [
    ...ranked.filter(({ item }) => item.sourcePlatform === 'X').slice(0, 4),
    ...ranked.filter(({ item, triage }) => item.sourcePlatform === '뉴스' && triage.category === 'AI 모델').slice(0, 4),
    ...ranked.filter(({ item, triage }) => item.sourcePlatform === '뉴스' && triage.category !== 'AI 모델').slice(0, 4),
  ]
  const selectedIds = new Set(selected.map(({ item }) => item.url))
  const balanced = [...selected, ...ranked.filter(({ item }) => !selectedIds.has(item.url))]
    .slice(0, MAX_CANDIDATES)
    .sort((a, b) => b.publishedAt - a.publishedAt || b.triage.score - a.triage.score || a.index - b.index)
  return balanced.map(({ item, index, triage }) => ({
      id: `news-${index}-${simpleHash(item.url)}`,
      title: item.title.slice(0, 100),
      summary: item.summary.slice(0, 220),
      publisher: item.publisher,
      sourcePlatform: item.sourcePlatform,
      url: item.url,
      publishedAt: item.publishedAt,
      category: triage.category,
      whyNow: triage.whyNow,
      suggestedAngle: triage.suggestedAngle,
    }))
}

function triageItem(item: FeedItem): Triage {
  const text = `${item.title} ${item.summary}`.toLowerCase()
  const matched = TOPIC_SIGNALS.find((signal) => signal.terms.some((term) => text.includes(term)))
  const category = matched?.category ?? '오늘의 이슈'
  const hasNumber = /\d/.test(item.title)
  const hasChangeSignal = /(출시|발표|도입|변화|확대|인상|인하|돌파|협력|규제|개정|선정|release|launch|introducing|available)/i.test(item.title)
  const isModelSignal = category === 'AI 모델'
  const whyNow = item.sourcePlatform === 'X'
    ? 'AI 모델 공식 계정의 공개 업데이트라 제품 발표·사용 맥락을 빠르게 잡기 좋아요.'
    : hasChangeSignal
      ? '변화 지점이 분명해 배경·영향·다음 행동으로 풀기 좋아요.'
      : hasNumber
        ? '구체적인 숫자나 비교 포인트를 확인해 저장형 카드로 만들기 좋아요.'
        : '사건의 핵심과 내 생활·업계에 미칠 영향을 나눠 설명하기 좋아요.'
  const suggestedAngle = isModelSignal
    ? '무엇이 바뀌었나 → 기존 모델과 차이 → 실제 업무에 미칠 영향'
    : hasChangeSignal
      ? '무슨 변화가 있었고, 왜 지금 주목해야 하는지'
      : '핵심 사실 → 맥락 → 우리에게 남는 의미'
  return {
    score: (matched == null ? 0 : 3) + (isModelSignal ? 5 : 0) + (item.sourcePlatform === 'X' ? 3 : 0) + (hasNumber ? 1 : 0) + (hasChangeSignal ? 2 : 0),
    category,
    whyNow,
    suggestedAngle,
  }
}

function cleanText(value: string) {
  return value
    .replace(/^<!\[CDATA\[|\]\]>$/g, '')
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replace(/\s+/g, ' ')
    .trim()
}

function readText(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

function simpleHash(value: string) {
  let hash = 0
  for (const char of value) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return hash.toString(36)
}

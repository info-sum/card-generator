export const NEWS_RESEARCH_ENDPOINT = '/api/news-research'

export type RelatedNewsArticle = {
  readonly title: string
  readonly publisher: string
  readonly url: string
  readonly summary: string
  readonly publishedAt: string
}

export type NewsResearchInput = {
  readonly title: string
  readonly publisher: string
  readonly url: string
  readonly summary?: string
  readonly publishedAt?: string
}

export type NewsResearchResult = {
  readonly articleSummary: string
  readonly relatedArticles: readonly RelatedNewsArticle[]
}

type NewsResearchFetch = (url: string, init: {
  readonly method: 'POST'
  readonly headers: Readonly<Record<string, string>>
  readonly body: string
  readonly signal?: AbortSignal
}) => Promise<{
  readonly ok: boolean
  readonly status: number
  json(): Promise<unknown>
}>

export class NewsResearchRequestError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'NewsResearchRequestError'
    this.status = status
  }
}

export async function requestNewsResearch(
  input: NewsResearchInput,
  fetcher: NewsResearchFetch = defaultFetch,
  signal?: AbortSignal,
): Promise<NewsResearchResult> {
  const response = await fetcher(NEWS_RESEARCH_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
    signal,
  })
  const body = await response.json()
  if (!response.ok) throw new NewsResearchRequestError(response.status, readMessage(body))

  const parsed = normalizeNewsResearchResult(body)
  if (parsed.ok === false) throw new NewsResearchRequestError(response.status, parsed.reason)
  return parsed.value
}

export function normalizeNewsResearchResult(input: unknown):
  | { readonly ok: true; readonly value: NewsResearchResult }
  | { readonly ok: false; readonly reason: string } {
  if (!isRecord(input) || typeof input.articleSummary !== 'string' || !Array.isArray(input.relatedArticles)) {
    return { ok: false, reason: '뉴스 분석 응답 형식이 올바르지 않아요.' }
  }

  const relatedArticles = input.relatedArticles.map(normalizeRelatedArticle)
  if (relatedArticles.some((article) => article == null)) {
    return { ok: false, reason: '연관 기사 응답 형식이 올바르지 않아요.' }
  }

  return {
    ok: true,
    value: {
      articleSummary: input.articleSummary.trim(),
      relatedArticles: relatedArticles.filter(isRelatedArticle).slice(0, 3),
    },
  }
}

function normalizeRelatedArticle(input: unknown): RelatedNewsArticle | null {
  if (!isRecord(input)) return null
  const title = readText(input.title)
  const url = normalizeHttpUrl(readText(input.url))
  if (title.length === 0 || url.length === 0) return null
  return {
    title,
    publisher: readText(input.publisher),
    url,
    summary: readText(input.summary),
    publishedAt: readText(input.publishedAt),
  }
}

function isRelatedArticle(input: RelatedNewsArticle | null): input is RelatedNewsArticle {
  return input != null
}

async function defaultFetch(url: string, init: Parameters<NewsResearchFetch>[1]) {
  return fetch(url, init)
}

function readMessage(input: unknown) {
  return isRecord(input) && typeof input.message === 'string' ? input.message : '뉴스 내용을 정리하지 못했어요.'
}

function readText(input: unknown) {
  return typeof input === 'string' ? input.trim() : ''
}

function normalizeHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : ''
  } catch {
    return ''
  }
}

function isRecord(input: unknown): input is Readonly<Record<string, unknown>> {
  return input != null && typeof input === 'object' && !Array.isArray(input)
}

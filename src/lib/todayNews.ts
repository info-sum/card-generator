export const TODAY_NEWS_ENDPOINT = '/api/today-news'

export type TodayNewsItem = {
  readonly id: string
  readonly title: string
  readonly summary: string
  readonly publisher: string
  readonly sourcePlatform: '뉴스' | 'X' | 'Threads'
  readonly url: string
  readonly publishedAt: string
  readonly category: string
  readonly whyNow: string
  readonly suggestedAngle: string
}

export type TodayNewsResponse = {
  readonly generatedAt: string
  readonly items: readonly TodayNewsItem[]
}

type TodayNewsFetch = (url: string, init?: { readonly signal?: AbortSignal }) => Promise<{
  readonly ok: boolean
  readonly status: number
  json(): Promise<unknown>
}>

export class TodayNewsRequestError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'TodayNewsRequestError'
    this.status = status
  }
}

export async function requestTodayNews(
  fetcher: TodayNewsFetch = defaultFetch,
  signal?: AbortSignal,
): Promise<TodayNewsResponse> {
  const response = await fetcher(TODAY_NEWS_ENDPOINT, { signal })
  const body = await response.json()

  if (!response.ok) {
    throw new TodayNewsRequestError(response.status, readMessage(body))
  }

  const parsed = normalizeTodayNewsResponse(body)
  if (parsed.ok === false) {
    throw new TodayNewsRequestError(response.status, parsed.reason)
  }

  return parsed.value
}

export function normalizeTodayNewsResponse(input: unknown):
  | { readonly ok: true; readonly value: TodayNewsResponse }
  | { readonly ok: false; readonly reason: string } {
  if (!isRecord(input) || typeof input.generatedAt !== 'string' || !Array.isArray(input.items)) {
    return { ok: false, reason: '오늘의 뉴스 응답 형식이 올바르지 않아요.' }
  }

  const items = input.items.map(normalizeTodayNewsItem)
  if (items.some((item) => item == null)) {
    return { ok: false, reason: '오늘의 뉴스 항목 형식이 올바르지 않아요.' }
  }

  return { ok: true, value: { generatedAt: input.generatedAt, items: items.filter(isTodayNewsItem) } }
}

function normalizeTodayNewsItem(input: unknown): TodayNewsItem | null {
  if (!isRecord(input)) {
    return null
  }

  const id = readText(input.id)
  const title = readText(input.title)
  const url = normalizeHttpUrl(readText(input.url))
  if (id.length === 0 || title.length === 0 || url.length === 0) {
    return null
  }

  return {
    id,
    title,
    summary: readText(input.summary),
    publisher: readText(input.publisher),
    sourcePlatform: readSourcePlatform(input.sourcePlatform),
    url,
    publishedAt: readText(input.publishedAt),
    category: readText(input.category) || '오늘의 이슈',
    whyNow: readText(input.whyNow),
    suggestedAngle: readText(input.suggestedAngle),
  }
}

function isTodayNewsItem(input: TodayNewsItem | null): input is TodayNewsItem {
  return input != null
}

async function defaultFetch(url: string, init?: { readonly signal?: AbortSignal }) {
  return fetch(url, init)
}

function readMessage(input: unknown) {
  return isRecord(input) && typeof input.message === 'string' ? input.message : '오늘의 뉴스를 불러오지 못했어요.'
}

function readText(input: unknown) {
  return typeof input === 'string' ? input.trim() : ''
}

function readSourcePlatform(input: unknown): TodayNewsItem['sourcePlatform'] {
  return input === 'X' || input === 'Threads' ? input : '뉴스'
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

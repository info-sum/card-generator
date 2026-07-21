export const GOOGLE_IMAGE_SEARCH_ENDPOINT = '/api/google-image-search'

export type GoogleImageSearchCard = {
  readonly cardId: string
  readonly title: string
  readonly description: string
  readonly content2?: string
  readonly searchKeywords: string
  readonly relatedSearchKeywords?: string
}

export type GoogleImageSearchResult = {
  readonly originalUrl: string
  readonly thumbnailUrl: string
  readonly sourcePageUrl: string
  readonly title: string
  readonly searchKeyword: string
  readonly cardId: string
}

export type GoogleImageSearchCardResponse = {
  readonly cardId: string
  readonly searchKeyword: string
  readonly status: 'ok' | 'empty' | 'error'
  readonly message?: string
  readonly images: readonly GoogleImageSearchResult[]
}

type Fetcher = (url: string, init: { method: 'POST'; headers: Record<string, string>; body: string }) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>
type AvailabilityFetcher = (url: string) => Promise<{ ok: boolean; json(): Promise<unknown> }>

export async function requestGoogleImageSearchAvailability(fetcher: AvailabilityFetcher = defaultAvailabilityFetch): Promise<boolean> {
  const response = await fetcher(GOOGLE_IMAGE_SEARCH_ENDPOINT)
  if (!response.ok) return false
  const body = await response.json()
  return isRecord(body) && body.available === true
}

export async function requestGoogleImageSearch(
  cards: readonly GoogleImageSearchCard[],
  topN = 6,
  apiKey?: string,
  fetcher: Fetcher = defaultFetch,
): Promise<readonly GoogleImageSearchCardResponse[]> {
  const response = await fetcher(GOOGLE_IMAGE_SEARCH_ENDPOINT, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ cards, topN, apiKey: apiKey?.trim() || undefined }),
  })
  const body = await response.json()
  if (!response.ok) throw new GoogleImageSearchRequestError(response.status, readMessage(body))
  if (!isRecord(body) || !Array.isArray(body.items)) throw new GoogleImageSearchRequestError(response.status, '이미지 검색 응답 형식이 올바르지 않아요.')
  return body.items.flatMap(normalizeCardResponse)
}

export class GoogleImageSearchRequestError extends Error {
  readonly status: number
  constructor(status: number, message: string) { super(message); this.name = 'GoogleImageSearchRequestError'; this.status = status }
}

function normalizeCardResponse(value: unknown): readonly GoogleImageSearchCardResponse[] {
  if (!isRecord(value)) return []
  const cardId = readText(value.cardId)
  const searchKeyword = readText(value.searchKeyword)
  const status = value.status === 'ok' || value.status === 'empty' || value.status === 'error' ? value.status : null
  if (cardId.length === 0 || status == null) return []
  const images = Array.isArray(value.images) ? value.images.flatMap((image) => normalizeImage(image, cardId)) : []
  return [{ cardId, searchKeyword, status, message: readText(value.message) || undefined, images }]
}

function normalizeImage(value: unknown, expectedCardId: string): readonly GoogleImageSearchResult[] {
  if (!isRecord(value)) return []
  const originalUrl = readUrl(value.originalUrl)
  const thumbnailUrl = readUrl(value.thumbnailUrl)
  const cardId = readText(value.cardId)
  if (originalUrl.length === 0 || thumbnailUrl.length === 0 || cardId !== expectedCardId) return []
  return [{ originalUrl, thumbnailUrl, sourcePageUrl: readUrl(value.sourcePageUrl), title: readText(value.title) || originalUrl, searchKeyword: readText(value.searchKeyword), cardId }]
}
function readMessage(value: unknown) { return isRecord(value) && typeof value.message === 'string' ? value.message : 'Google 이미지 검색에 실패했어요.' }
function readText(value: unknown) { return typeof value === 'string' ? value.trim() : '' }
function readUrl(value: unknown) { const text = readText(value); try { const url = new URL(text); return /^https?:$/.test(url.protocol) ? url.toString() : '' } catch { return '' } }
function isRecord(value: unknown): value is Record<string, unknown> { return value != null && typeof value === 'object' && !Array.isArray(value) }
async function defaultFetch(url: string, init: Parameters<Fetcher>[1]): ReturnType<Fetcher> { return fetch(url, init) }
async function defaultAvailabilityFetch(url: string): ReturnType<AvailabilityFetcher> { return fetch(url) }

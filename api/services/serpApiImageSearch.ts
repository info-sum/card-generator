export type SerpApiImageSearchCard = {
  readonly cardId: string
  readonly title: string
  readonly description: string
  readonly content2: string
  readonly searchKeywords: string
  readonly relatedSearchKeywords: string
}

export type SerpApiImageResult = {
  readonly originalUrl: string
  readonly thumbnailUrl: string
  readonly sourcePageUrl: string
  readonly title: string
  readonly searchKeyword: string
  readonly cardId: string
}

export type SerpApiCardSearchResult = {
  readonly cardId: string
  readonly searchKeyword: string
  readonly status: 'ok' | 'empty' | 'error'
  readonly message?: string
  readonly images: readonly SerpApiImageResult[]
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>

export class SerpApiImageSearchError extends Error {
  readonly status: number
  readonly code: 'missing_key' | 'quota' | 'provider' | 'unknown'

  constructor(status: number, code: SerpApiImageSearchError['code'], message: string) {
    super(message)
    this.name = 'SerpApiImageSearchError'
    this.status = status
    this.code = code
  }
}

const SERPAPI_URL = 'https://serpapi.com/search.json'

export async function searchGoogleImagesBatch(
  cards: readonly SerpApiImageSearchCard[],
  apiKey: string | undefined,
  topN: number,
  fetcher: FetchLike = fetch,
): Promise<readonly SerpApiCardSearchResult[]> {
  if (apiKey == null || apiKey.trim().length === 0) {
    throw new SerpApiImageSearchError(503, 'missing_key', 'SERPAPI_KEY가 서버에 설정되지 않았어요.')
  }

  const usedOriginalUrls = new Set<string>()
  const limit = Math.max(1, Math.min(Math.floor(topN), 10))
  const results: SerpApiCardSearchResult[] = []

  for (const card of cards) {
    const primaryKeyword = card.searchKeywords.trim()
    const relatedKeyword = normalizeRelatedKeyword(card.relatedSearchKeywords, primaryKeyword)
    if (primaryKeyword.length === 0) {
      results.push({ cardId: card.cardId, searchKeyword: '', status: 'error', message: '이미지 검색어를 만들지 못했어요.', images: [] })
      continue
    }

    try {
      const images = await searchOneCard(card, primaryKeyword, relatedKeyword, limit, apiKey, usedOriginalUrls, fetcher)
      results.push(images.length > 0
        ? { cardId: card.cardId, searchKeyword: primaryKeyword, status: 'ok', images }
        : { cardId: card.cardId, searchKeyword: primaryKeyword, status: 'empty', message: '검색 결과가 없어요. 다른 카드를 선택하거나 직접 이미지를 교체해 주세요.', images: [] })
    } catch (error) {
      if (error instanceof SerpApiImageSearchError) {
        results.push({ cardId: card.cardId, searchKeyword: primaryKeyword, status: 'error', message: error.message, images: [] })
      } else {
        results.push({ cardId: card.cardId, searchKeyword: primaryKeyword, status: 'error', message: 'Google 이미지 검색 중 오류가 발생했어요.', images: [] })
      }
    }
  }

  return results
}

async function searchOneCard(
  card: SerpApiImageSearchCard,
  primaryKeyword: string,
  relatedKeyword: string,
  limit: number,
  apiKey: string,
  usedOriginalUrls: Set<string>,
  fetcher: FetchLike,
): Promise<readonly SerpApiImageResult[]> {
  const first = await requestImages(card.cardId, primaryKeyword, apiKey, fetcher)
  const selected = selectUnique(first, limit, usedOriginalUrls)
  if (selected.length >= limit || relatedKeyword.length === 0 || relatedKeyword === primaryKeyword) {
    return selected
  }

  const retry = await requestImages(card.cardId, relatedKeyword, apiKey, fetcher)
  return [...selected, ...selectUnique(retry, limit - selected.length, usedOriginalUrls)]
}

async function requestImages(cardId: string, keyword: string, apiKey: string, fetcher: FetchLike): Promise<readonly SerpApiImageResult[]> {
  const params = new URLSearchParams({ engine: 'google_images', q: keyword, api_key: apiKey })
  let response: Response
  try {
    response = await fetcher(`${SERPAPI_URL}?${params.toString()}`, { headers: { accept: 'application/json' } })
  } catch {
    logUsage({ cardId, keyword, attempt: 'request', error: 'network' })
    throw new SerpApiImageSearchError(502, 'unknown', '이미지 검색 서버에 연결하지 못했어요.')
  }

  const body = await response.json().catch(() => ({})) as unknown
  if (!response.ok) {
    const providerMessage = readProviderMessage(body)
    const quota = response.status === 401 || response.status === 403 || response.status === 429 || /limit|quota|credit|rate/i.test(providerMessage)
    const message = quota ? 'SerpApi 한도 초과 또는 인증 오류예요. 서버 설정과 사용량을 확인해 주세요.' : 'SerpApi 이미지 검색 요청에 실패했어요.'
    logUsage({ cardId, keyword, attempt: 'request', status: response.status, error: quota ? 'quota_or_auth' : 'provider' })
    throw new SerpApiImageSearchError(response.status, quota ? 'quota' : 'provider', message)
  }

  const images = readImages(body, cardId, keyword)
  logUsage({ cardId, keyword, attempt: 'request', status: response.status, resultCount: images.length })
  return images
}

function selectUnique(images: readonly SerpApiImageResult[], limit: number, usedOriginalUrls: Set<string>) {
  const selected: SerpApiImageResult[] = []
  for (const image of images) {
    if (selected.length >= limit || usedOriginalUrls.has(image.originalUrl)) continue
    usedOriginalUrls.add(image.originalUrl)
    selected.push(image)
  }
  return selected
}

function readImages(input: unknown, cardId: string, searchKeyword: string): readonly SerpApiImageResult[] {
  if (!isRecord(input) || !Array.isArray(input.images_results)) return []
  return input.images_results.flatMap((item) => {
    if (!isRecord(item)) return []
    const originalUrl = readHttpUrl(item.original)
    const thumbnailUrl = readHttpUrl(item.thumbnail)
    if (originalUrl.length === 0 || thumbnailUrl.length === 0) return []
    return [{ originalUrl, thumbnailUrl, sourcePageUrl: readHttpUrl(item.link), title: readText(item.title) || originalUrl, searchKeyword, cardId }]
  })
}

function normalizeRelatedKeyword(related: string, primary: string) {
  const normalized = related.trim().replace(/\s+/g, ' ')
  if (normalized.length > 0) return normalized
  return primary.replace(/\b(editorial|background|illustration|no text|korean sns card)\b/gi, '').replace(/\s+/g, ' ').trim()
}

function readProviderMessage(input: unknown) {
  if (!isRecord(input)) return ''
  return [input.error, input.message].filter((value): value is string => typeof value === 'string').join(' ')
}

function readText(value: unknown) { return typeof value === 'string' ? value.trim() : '' }
function readHttpUrl(value: unknown) {
  const text = readText(value)
  try { const url = new URL(text); return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : '' } catch { return '' }
}
function isRecord(value: unknown): value is Record<string, unknown> { return value != null && typeof value === 'object' && !Array.isArray(value) }

function logUsage(fields: Record<string, string | number | undefined>) {
  // Vercel/host log explorer에서 `serpapi_usage`로 필터링해 요청·한도 사용을 추적한다.
  console.info(JSON.stringify({ event: 'serpapi_usage', at: new Date().toISOString(), ...fields }))
}

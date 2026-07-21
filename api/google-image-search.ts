import {
  SerpApiImageSearchError,
  searchGoogleImagesBatch,
  type SerpApiImageSearchCard,
} from './services/serpApiImageSearch.js'

type ApiRequest = { readonly method?: string; readonly body?: unknown }
type ApiResponse = { status(code: number): ApiResponse; json(body: unknown): void; setHeader(name: string, value: string): void }

export default async function handler(request: ApiRequest, response: ApiResponse) {
  response.setHeader('cache-control', 'no-store')
  if (request.method === 'GET') {
    response.status(200).json({ available: Boolean(process.env.SERPAPI_KEY?.trim()) })
    return
  }
  if (request.method !== 'POST') {
    response.status(405).json({ message: 'GET 또는 POST 요청만 지원합니다.' })
    return
  }

  const parsed = parseRequest(request.body)
  if (parsed == null) {
    response.status(400).json({ message: '카드 ID와 이미지 검색어를 확인해 주세요.' })
    return
  }

  try {
    const items = await searchGoogleImagesBatch(parsed.cards, parsed.apiKey || process.env.SERPAPI_KEY, parsed.topN)
    response.status(200).json({ items })
  } catch (error) {
    if (error instanceof SerpApiImageSearchError) {
      response.status(error.status).json({ message: error.message, code: error.code })
      return
    }
    response.status(500).json({ message: 'Google 이미지 검색 중 오류가 발생했어요.', code: 'unknown' })
  }
}

function parseRequest(input: unknown): { readonly cards: readonly SerpApiImageSearchCard[]; readonly topN: number; readonly apiKey: string } | null {
  if (!isRecord(input) || !Array.isArray(input.cards)) return null
  const cards = input.cards.flatMap((card) => {
    if (!isRecord(card)) return []
    const cardId = readText(card.cardId)
    const searchKeywords = readText(card.searchKeywords)
    if (cardId.length === 0 || cardId.length > 160 || searchKeywords.length === 0 || searchKeywords.length > 300) return []
    return [{
      cardId,
      title: readText(card.title).slice(0, 300),
      description: readText(card.description).slice(0, 1_500),
      content2: readText(card.content2).slice(0, 1_500),
      searchKeywords,
      relatedSearchKeywords: readText(card.relatedSearchKeywords).slice(0, 300),
    }]
  }).slice(0, 20)
  if (cards.length === 0 || cards.length !== input.cards.length) return null
  const requestedTopN = typeof input.topN === 'number' ? input.topN : 6
  return {
    cards,
    topN: Math.max(1, Math.min(Math.floor(requestedTopN), 10)),
    apiKey: readText(input.apiKey).slice(0, 300),
  }
}

function readText(value: unknown) { return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '' }
function isRecord(value: unknown): value is Record<string, unknown> { return value != null && typeof value === 'object' && !Array.isArray(value) }

import assert from 'node:assert/strict'
import test from 'node:test'
import {
  AI_CARD_NEWS_ENDPOINT,
  buildFallbackAiCardNewsResponse,
  normalizeGenerateCardNewsRequest,
  requestAiCardNews,
  type GenerateCardNewsRequest,
} from './aiCardNews.js'

const validRequest: GenerateCardNewsRequest = {
  topic: 'AI 마케팅',
  style: 'news',
  slideCount: 6,
  brandName: 'Ait Studio',
  accentColor: '#1868DB',
  layout: 'sequence',
  generateImages: true,
  aiProvider: 'gpt',
  apiKey: 'sk-client-key',
}

test('normalizeGenerateCardNewsRequest accepts a bounded card count request', () => {
  const result = normalizeGenerateCardNewsRequest(validRequest)

  assert.deepEqual(result, {
    ok: true,
    value: {
      ...validRequest,
      topic: 'AI 마케팅',
      accentColor: '#1868db',
    },
  })
})

test('normalizeGenerateCardNewsRequest rejects malformed card count and empty topic', () => {
  assert.deepEqual(
    normalizeGenerateCardNewsRequest({
      ...validRequest,
      topic: ' ',
      slideCount: 10,
    }),
    {
      ok: false,
      reason: '주제는 1자 이상, 카드 장 수는 4~9장이어야 해요.',
    },
  )
})

test('buildFallbackAiCardNewsResponse preserves the requested card count contract', () => {
  const response = buildFallbackAiCardNewsResponse(validRequest, 'OPENAI_API_KEY is not configured')

  assert.equal(response.source, 'fallback')
  assert.equal(response.projectTitle, 'AI 마케팅 카드뉴스 초안')
  assert.equal(response.brandName, 'Ait Studio')
  assert.equal(response.slides.length, 6)
  assert.equal(response.slides[0]?.imageStatus, 'skipped')
  assert.match(response.slides[0]?.title ?? '', /AI 마케팅/)
  assert.deepEqual(response.warnings, ['OPENAI_API_KEY is not configured'])
})

test('requestAiCardNews posts the normalized request to the API endpoint', async () => {
  const calls: string[] = []
  const response = await requestAiCardNews(validRequest, async (url, init) => {
    calls.push(`${url} ${init.method} ${init.body}`)
    return {
      ok: true,
      status: 200,
      json: async () => ({
        source: 'ai',
        projectTitle: 'AI 마케팅 카드뉴스 초안',
        brandName: 'Ait Studio',
        slides: [
          {
            kicker: 'AI 마케팅',
            title: 'AI 마케팅이 다시 주목받는 이유',
            description: '성과를 빠르게 비교할 수 있기 때문입니다.',
            content2: '반복 업무는 AI가 먼저 정리합니다.',
            badge: '01',
            imagePrompt: 'clean editorial AI marketing background',
            imageDataUrl: 'data:image/png;base64,abc',
            imageStatus: 'generated',
          },
        ],
        warnings: [],
      }),
    }
  })

  assert.equal(calls.length, 1)
  assert.match(calls[0] ?? '', new RegExp(`^${AI_CARD_NEWS_ENDPOINT} POST`))
  assert.equal(response.source, 'ai')
  assert.equal(response.slides.length, 1)
  assert.match(calls[0] ?? '', /"aiProvider":"gpt"/)
  assert.match(calls[0] ?? '', /"apiKey":"sk-client-key"/)
})

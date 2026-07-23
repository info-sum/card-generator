import assert from 'node:assert/strict'
import test from 'node:test'
import {
  AI_CARD_NEWS_ENDPOINT,
  buildFallbackAiCardNewsResponse,
  normalizeGenerateCardNewsResponse,
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
  toneManner: 'professional',
  messageApproach: 'strong',
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
      newsContext: undefined,
      accentColor: '#1868db',
    },
  })
})

test('normalizeGenerateCardNewsRequest accepts topics up to 1,000 characters and rejects invalid inputs', () => {
  const maxLengthTopic = '가'.repeat(1000)
  assert.equal(normalizeGenerateCardNewsRequest({ ...validRequest, topic: maxLengthTopic }).ok, true)

  assert.deepEqual(
    normalizeGenerateCardNewsRequest({
      ...validRequest,
      topic: ' ',
      slideCount: 10,
    }),
    {
      ok: false,
      reason: '주제는 1~1,000자, 카드 장 수는 4~9장이어야 해요.',
    },
  )
})

test('buildFallbackAiCardNewsResponse preserves the requested card count contract', () => {
  const response = buildFallbackAiCardNewsResponse(validRequest)

  assert.equal(response.source, 'fallback')
  assert.equal(response.projectTitle, 'AI 마케팅 카드뉴스 초안')
  assert.equal(response.brandName, 'Ait Studio')
  assert.equal(response.slides.length, 6)
  assert.equal(response.slides[0]?.imageStatus, 'skipped')
  assert.match(response.slides[0]?.title ?? '', /AI 마케팅/)
  assert.deepEqual(response.warnings, [])
  assert.doesNotMatch(JSON.stringify(response.slides), /API key is not configured|자동화했어요|작업 환경/)
})

test('normalizeGenerateCardNewsResponse preserves image URLs and citation sources', () => {
  const result = normalizeGenerateCardNewsResponse({
    source: 'ai',
    projectTitle: 'AI 마케팅 카드뉴스 초안',
    brandName: 'Ait Studio',
    slides: [
      {
        kicker: 'AI 마케팅',
        title: 'AI 마케팅이 다시 주목받는 이유',
        description: '최근 기사 흐름을 바탕으로 한 설명입니다.',
        content2: '실제 사례를 먼저 비교하세요.',
        badge: '01',
        imagePrompt: 'clean editorial AI marketing background',
        imageSourceUrl: 'https://images.example.com/news-card.png',
        imageDataUrl: 'data:image/png;base64,abc',
        imageStatus: 'generated',
        sources: [
          {
            title: 'AI marketing trend report',
            url: 'https://news.example.com/ai-marketing',
          },
        ],
      },
    ],
    sources: [
      {
        title: 'AI marketing trend report',
        url: 'https://news.example.com/ai-marketing',
      },
    ],
    warnings: [],
  })

  assert.equal(result.ok, true)
  if (!result.ok) {
    return
  }

  assert.equal(result.value.slides[0]?.imageSourceUrl, 'https://images.example.com/news-card.png')
  assert.equal(result.value.slides[0]?.sources[0]?.url, 'https://news.example.com/ai-marketing')
  assert.equal(result.value.sources[0]?.title, 'AI marketing trend report')
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
            imageSourceUrl: 'https://images.example.com/card.png',
            imageDataUrl: 'data:image/png;base64,abc',
            imageStatus: 'generated',
            sources: [{ title: 'OpenAI source', url: 'https://news.example.com/source' }],
          },
        ],
        sources: [{ title: 'OpenAI source', url: 'https://news.example.com/source' }],
        warnings: [],
      }),
    }
  })

  assert.equal(calls.length, 1)
  assert.match(calls[0] ?? '', new RegExp(`^${AI_CARD_NEWS_ENDPOINT} POST`))
  assert.equal(response.source, 'ai')
  assert.equal(response.slides.length, 1)
  assert.equal(response.slides[0]?.imageSourceUrl, 'https://images.example.com/card.png')
  assert.equal(response.sources[0]?.url, 'https://news.example.com/source')
  assert.match(calls[0] ?? '', /"aiProvider":"gpt"/)
  assert.match(calls[0] ?? '', /"toneManner":"professional"/)
  assert.match(calls[0] ?? '', /"apiKey":"sk-client-key"/)
})

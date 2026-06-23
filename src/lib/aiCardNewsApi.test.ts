import assert from 'node:assert/strict'
import test from 'node:test'
import handler from '../../api/generate-cardnews.js'

type RecordedRequest = {
  readonly url: string
  readonly authorization: string
  readonly body: string
}

type MockResponse = {
  readonly headers: Record<string, string>
  statusCode: number
  body: unknown
  status(code: number): MockResponse
  json(body: unknown): void
  setHeader(name: string, value: string): void
}

const requestBody = {
  topic: 'AI 마케팅',
  style: 'news',
  slideCount: 6,
  brandName: 'Ait Studio',
  accentColor: '#1868DB',
  layout: 'sequence',
  toneManner: 'professional',
  generateImages: false,
  aiProvider: 'gpt',
  apiKey: 'sk-request-key',
} as const

test('generate-cardnews handler falls back when OpenAI returns fewer slides than requested', async () => {
  const previousApiKey = process.env.OPENAI_API_KEY
  const previousFetch = globalThis.fetch
  process.env.OPENAI_API_KEY = 'test-key'
  globalThis.fetch = createFetchMock([
    {
      ok: true,
      status: 200,
      json: async () => ({
        output_text: JSON.stringify({
          projectTitle: 'AI 마케팅 카드뉴스 초안',
          slides: [createAiSlide(1)],
        }),
      }),
    },
  ])

  try {
    const response = createMockResponse()
    await handler({ method: 'POST', body: requestBody }, response)

    const body = readResponseBody(response.body)
    assert.equal(response.statusCode, 200)
    assert.equal(body.source, 'fallback')
    assert.equal(body.slides.length, 6)
    assert.match(body.warnings[0] ?? '', /exactly 6 slides/)
  } finally {
    restoreEnvironment(previousApiKey, previousFetch)
  }
})

test('generate-cardnews handler preserves an exact requested AI slide count', async () => {
  const previousApiKey = process.env.OPENAI_API_KEY
  const previousFetch = globalThis.fetch
  process.env.OPENAI_API_KEY = 'test-key'
  globalThis.fetch = createFetchMock([
    {
      ok: true,
      status: 200,
      json: async () => ({
        output_text: JSON.stringify({
          projectTitle: 'AI 마케팅 카드뉴스 초안',
          slides: Array.from({ length: 6 }, (_, index) => createAiSlide(index + 1)),
        }),
      }),
    },
  ])

  try {
    const response = createMockResponse()
    await handler({ method: 'POST', body: requestBody }, response)

    const body = readResponseBody(response.body)
    assert.equal(response.statusCode, 200)
    assert.equal(body.source, 'ai')
    assert.equal(body.slides.length, 6)
    assert.equal(body.slides[0]?.imageStatus, 'skipped')
  } finally {
    restoreEnvironment(previousApiKey, previousFetch)
  }
})

test('generate-cardnews handler maps web image URLs into generated card images', async () => {
  const previousApiKey = process.env.OPENAI_API_KEY
  const previousFetch = globalThis.fetch
  process.env.OPENAI_API_KEY = 'test-key'
  const imageBytes = new Uint8Array([137, 80, 78, 71])
  globalThis.fetch = createFetchMock([
    {
      ok: true,
      status: 200,
      json: async () => ({
        output_text: JSON.stringify({
          projectTitle: 'AI 마케팅 카드뉴스 초안',
          slides: Array.from({ length: 6 }, (_, index) => ({
            ...createAiSlide(index + 1),
            imageSourceUrl: `https://images.example.com/card-${index + 1}.png`,
          })),
        }),
      }),
    },
    ...Array.from({ length: 6 }, () => ({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'image/png' }),
      arrayBuffer: async () => imageBytes.buffer,
    })),
  ])

  try {
    const response = createMockResponse()
    await handler({
      method: 'POST',
      body: {
        ...requestBody,
        generateImages: true,
      },
    }, response)

  const body = readResponseBody(response.body)
  assert.equal(body.source, 'ai')
  assert.equal(body.slides[0]?.imageStatus, 'generated')
  assert.match(body.slides[0]?.imageDataUrl ?? '', /^data:image\/png;base64,/)
  assert.equal(body.slides[0]?.imageSourceUrl, 'https://images.example.com/card-1.png')
  } finally {
    restoreEnvironment(previousApiKey, previousFetch)
  }
})

test('generate-cardnews handler maps web image URLs even when AI image generation is off', async () => {
  const previousApiKey = process.env.OPENAI_API_KEY
  const previousFetch = globalThis.fetch
  process.env.OPENAI_API_KEY = 'test-key'
  const imageBytes = new Uint8Array([137, 80, 78, 71])
  globalThis.fetch = createFetchMock([
    {
      ok: true,
      status: 200,
      json: async () => ({
        output_text: JSON.stringify({
          projectTitle: 'AI 마케팅 카드뉴스 초안',
          slides: Array.from({ length: 6 }, (_, index) => ({
            ...createAiSlide(index + 1),
            imageSourceUrl: `https://images.example.com/linked-card-${index + 1}.png`,
          })),
        }),
      }),
    },
    ...Array.from({ length: 6 }, () => ({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'image/png' }),
      arrayBuffer: async () => imageBytes.buffer,
    })),
  ])

  try {
    const response = createMockResponse()
    await handler({ method: 'POST', body: requestBody }, response)

    const body = readResponseBody(response.body)
    assert.equal(body.source, 'ai')
    assert.equal(body.slides[0]?.imageStatus, 'generated')
    assert.match(body.slides[0]?.imageDataUrl ?? '', /^data:image\/png;base64,/)
    assert.equal(body.slides[0]?.imageSourceUrl, 'https://images.example.com/linked-card-1.png')
  } finally {
    restoreEnvironment(previousApiKey, previousFetch)
  }
})

test('generate-cardnews handler extracts preview images from source pages when direct image URLs are missing', async () => {
  const previousApiKey = process.env.OPENAI_API_KEY
  const previousFetch = globalThis.fetch
  process.env.OPENAI_API_KEY = 'test-key'
  const imageBytes = new Uint8Array([137, 80, 78, 71])
  globalThis.fetch = createFetchMock([
    {
      ok: true,
      status: 200,
      json: async () => ({
        output_text: JSON.stringify({
          projectTitle: 'AI 마케팅 카드뉴스 초안',
          slides: Array.from({ length: 6 }, (_, index) => ({
            ...createAiSlide(index + 1),
            imageSourceUrl: '',
            sources: [{
              title: `Article ${index + 1}`,
              url: `https://news.example.com/articles/${index + 1}`,
            }],
          })),
        }),
      }),
    },
    ...Array.from({ length: 6 }, (_, index) => ([
      {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
        text: async () => `<html><head><meta property="og:image" content="/images/article-${index + 1}.png"></head></html>`,
      },
      {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'image/png' }),
        arrayBuffer: async () => imageBytes.buffer,
      },
    ])).flat(),
  ])

  try {
    const response = createMockResponse()
    await handler({ method: 'POST', body: requestBody }, response)

    const body = readResponseBody(response.body)
    assert.equal(body.source, 'ai')
    assert.equal(body.slides[0]?.imageStatus, 'generated')
    assert.equal(body.slides[0]?.imageSourceUrl, 'https://news.example.com/images/article-1.png')
    assert.match(body.slides[0]?.imageDataUrl ?? '', /^data:image\/png;base64,/)
  } finally {
    restoreEnvironment(previousApiKey, previousFetch)
  }
})

test('generate-cardnews handler creates analyzed fallback cards without an API key', async () => {
  const previousApiKey = process.env.OPENAI_API_KEY
  const previousFetch = globalThis.fetch
  const requests: RecordedRequest[] = []
  delete process.env.OPENAI_API_KEY
  globalThis.fetch = createFetchMock([], requests)

  try {
    const response = createMockResponse()
    await handler({
      method: 'POST',
      body: {
        ...requestBody,
        apiKey: '',
        topic: '부동산 투자',
      },
    }, response)

    const body = readResponseBody(response.body)
    const renderedCopy = body.slides.map((slide) => slide.title).join('\n')
    assert.equal(response.statusCode, 200)
    assert.equal(body.source, 'fallback')
    assert.equal(body.slides.length, 6)
    assert.equal(body.warnings.length, 0)
    assert.equal(requests.length, 0)
    assert.match(renderedCopy, /부동산 투자/)
    assert.doesNotMatch(JSON.stringify(body), /API key is not configured|자동화했어요|작업 환경/)
  } finally {
    restoreEnvironment(previousApiKey, previousFetch)
  }
})

test('generate-cardnews handler reports OpenAI image generation errors', async () => {
  const previousApiKey = process.env.OPENAI_API_KEY
  const previousFetch = globalThis.fetch
  process.env.OPENAI_API_KEY = 'test-key'
  globalThis.fetch = createFetchMock([
    {
      ok: true,
      status: 200,
      json: async () => ({
        output_text: JSON.stringify({
          projectTitle: 'AI 마케팅 카드뉴스 초안',
          slides: Array.from({ length: 6 }, (_, index) => createAiSlide(index + 1)),
        }),
      }),
    },
    ...Array.from({ length: 6 }, () => ({
      ok: false,
      status: 403,
      json: async () => ({
        error: {
          message: 'Your organization must be verified to use model gpt-image-2.',
        },
      }),
    })),
  ])

  try {
    const response = createMockResponse()
    await handler({
      method: 'POST',
      body: {
        ...requestBody,
        generateImages: true,
      },
    }, response)

    const body = readResponseBody(response.body)
    assert.equal(body.source, 'ai')
    assert.equal(body.slides[0]?.imageStatus, 'failed')
    assert.match(body.warnings[0] ?? '', /OpenAI image generation failed \(403\)/)
    assert.match(body.warnings[0] ?? '', /organization must be verified/)
  } finally {
    restoreEnvironment(previousApiKey, previousFetch)
  }
})

test('generate-cardnews handler uses the request GPT key before the environment key', async () => {
  const previousApiKey = process.env.OPENAI_API_KEY
  const previousFetch = globalThis.fetch
  process.env.OPENAI_API_KEY = 'env-key'
  const requests: RecordedRequest[] = []
  globalThis.fetch = createFetchMock([
    {
      ok: true,
      status: 200,
      json: async () => ({
        output_text: JSON.stringify({
          projectTitle: 'AI 마케팅 카드뉴스 초안',
          sources: [{ title: 'AI marketing news', url: 'https://news.example.com/ai-marketing' }],
          slides: Array.from({ length: 6 }, (_, index) => createAiSlide(index + 1)),
        }),
        output: [
          {
            type: 'web_search_call',
            action: {
              sources: [
                {
                  title: 'AI marketing news',
                  url: 'https://news.example.com/ai-marketing',
                },
              ],
            },
          },
        ],
      }),
    },
  ], requests)

  try {
    const response = createMockResponse()
    await handler({ method: 'POST', body: requestBody }, response)

    const body = readResponseBody(response.body)
    assert.equal(body.source, 'ai')
    assert.equal(requests[0]?.url, 'https://api.openai.com/v1/responses')
    assert.equal(requests[0]?.authorization, 'Bearer sk-request-key')
    assert.match(requests[0]?.body ?? '', /최근 뉴스 기사/)
    assert.match(requests[0]?.body ?? '', /web_search/)
    assert.match(requests[0]?.body ?? '', /"model":"gpt-5\.4-mini"/)
    assert.match(requests[0]?.body ?? '', /"tool_choice":"required"/)
    assert.match(requests[0]?.body ?? '', /"include":\["web_search_call\.action\.sources"\]/)
    assert.match(requests[0]?.body ?? '', /toneManner\\":\\"professional/)
    assert.equal(body.sources.at(0)?.url, 'https://news.example.com/ai-marketing')
    assert.equal(body.slides.at(0)?.sources?.at(0)?.url, 'https://news.example.com/ai-marketing')
  } finally {
    restoreEnvironment(previousApiKey, previousFetch)
  }
})

test('generate-cardnews handler surfaces OpenAI error details without echoing key material', async () => {
  const previousApiKey = process.env.OPENAI_API_KEY
  const previousFetch = globalThis.fetch
  delete process.env.OPENAI_API_KEY
  globalThis.fetch = createFetchMock([
    {
      ok: false,
      status: 401,
      json: async () => ({
        error: {
          message: 'Incorrect API key provided: sk-secret-key-that-must-not-echo',
        },
      }),
    },
  ])

  try {
    const response = createMockResponse()
    await handler({
      method: 'POST',
      body: {
        ...requestBody,
        apiKey: 'sk-secret-key-that-must-not-echo',
      },
    }, response)

    const body = readResponseBody(response.body)
    assert.equal(response.statusCode, 200)
    assert.equal(body.source, 'fallback')
    assert.match(body.warnings[0] ?? '', /OpenAI text generation failed \(401\): Incorrect API key provided/)
    assert.doesNotMatch(JSON.stringify(body), /sk-secret-key-that-must-not-echo/)
  } finally {
    restoreEnvironment(previousApiKey, previousFetch)
  }
})

test('generate-cardnews handler retries GPT text generation without web search when search is rejected', async () => {
  const previousApiKey = process.env.OPENAI_API_KEY
  const previousFetch = globalThis.fetch
  process.env.OPENAI_API_KEY = 'test-key'
  const requests: RecordedRequest[] = []
  globalThis.fetch = createFetchMock([
    {
      ok: false,
      status: 400,
      json: async () => ({
        error: {
          message: 'The web_search tool is not enabled for this project.',
        },
      }),
    },
    {
      ok: true,
      status: 200,
      json: async () => ({
        output_text: JSON.stringify({
          projectTitle: 'AI 마케팅 카드뉴스 초안',
          slides: Array.from({ length: 6 }, (_, index) => createAiSlide(index + 1)),
        }),
      }),
    },
  ], requests)

  try {
    const response = createMockResponse()
    await handler({ method: 'POST', body: requestBody }, response)

    const body = readResponseBody(response.body)
    assert.equal(body.source, 'ai')
    assert.match(requests[0]?.body ?? '', /web_search/)
    assert.doesNotMatch(requests[1]?.body ?? '', /web_search/)
  } finally {
    restoreEnvironment(previousApiKey, previousFetch)
  }
})

test('generate-cardnews handler uses Gemini when requested', async () => {
  const previousApiKey = process.env.OPENAI_API_KEY
  const previousFetch = globalThis.fetch
  delete process.env.OPENAI_API_KEY
  const requests: RecordedRequest[] = []
  globalThis.fetch = createFetchMock([
    {
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    projectTitle: 'AI 마케팅 카드뉴스 초안',
                    sources: [{ title: 'AI marketing Gemini source', url: 'https://news.example.com/gemini-ai' }],
                    slides: Array.from({ length: 6 }, (_, index) => ({
                      ...createAiSlide(index + 1),
                      sources: [],
                    })),
                  }),
                },
              ],
            },
            groundingMetadata: {
              groundingChunks: [
                {
                  web: {
                    title: 'Gemini grounded source',
                    uri: 'https://news.example.com/gemini-ai',
                  },
                },
              ],
            },
          },
        ],
      }),
    },
  ], requests)

  try {
    const response = createMockResponse()
    await handler({
      method: 'POST',
      body: {
        ...requestBody,
        aiProvider: 'gemini',
        apiKey: 'gemini-request-key',
      },
    }, response)

    const body = readResponseBody(response.body)
    assert.equal(body.source, 'ai')
    assert.equal(body.slides.length, 6)
    assert.equal(body.sources.at(0)?.url, 'https://news.example.com/gemini-ai')
    assert.equal(body.slides.at(0)?.sources?.at(0)?.title, 'AI marketing Gemini source')
    assert.match(requests[0]?.url ?? '', /generativelanguage\.googleapis\.com/)
    assert.equal(requests[0]?.authorization, '')
    assert.match(requests[0]?.body ?? '', /최근 뉴스 기사/)
    assert.match(requests[0]?.body ?? '', /google_search/)
    assert.match(requests[0]?.body ?? '', /toneManner\\":\\"professional/)
  } finally {
    restoreEnvironment(previousApiKey, previousFetch)
  }
})

test('generate-cardnews handler generates Gemini images when web images are unavailable', async () => {
  const previousApiKey = process.env.OPENAI_API_KEY
  const previousGeminiApiKey = process.env.GEMINI_API_KEY
  const previousFetch = globalThis.fetch
  delete process.env.OPENAI_API_KEY
  process.env.GEMINI_API_KEY = 'gemini-env-key'
  const requests: RecordedRequest[] = []
  globalThis.fetch = createFetchMock([
    {
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    projectTitle: 'AI 마케팅 카드뉴스 초안',
                    slides: Array.from({ length: 6 }, (_, index) => ({
                      ...createAiSlide(index + 1),
                      sources: [],
                    })),
                  }),
                },
              ],
            },
          },
        ],
      }),
    },
    ...Array.from({ length: 6 }, () => ({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  inlineData: {
                    mimeType: 'image/png',
                    data: 'R0lGODlhAQABAIAAAAUEBA==',
                  },
                },
              ],
            },
          },
        ],
      }),
    })),
  ], requests)

  try {
    const response = createMockResponse()
    await handler({
      method: 'POST',
      body: {
        ...requestBody,
        aiProvider: 'gemini',
        apiKey: '',
        generateImages: true,
      },
    }, response)

    const body = readResponseBody(response.body)
    assert.equal(body.source, 'ai')
    assert.equal(body.slides[0]?.imageStatus, 'generated')
    assert.equal(body.slides[0]?.imageDataUrl, 'data:image/png;base64,R0lGODlhAQABAIAAAAUEBA==')
    assert.match(requests[1]?.url ?? '', /gemini-3\.1-flash-image/)
    assert.match(requests[1]?.body ?? '', /responseModalities/)
  } finally {
    restoreEnvironment(previousApiKey, previousFetch)
    if (previousGeminiApiKey == null) {
      delete process.env.GEMINI_API_KEY
    } else {
      process.env.GEMINI_API_KEY = previousGeminiApiKey
    }
  }
})

test('generate-cardnews handler rejects malformed providers without echoing key material', async () => {
  const response = createMockResponse()
  await handler({
    method: 'POST',
    body: {
      ...requestBody,
      aiProvider: 'claude',
      apiKey: 'secret-key-that-must-not-echo',
    },
  }, response)

  assert.equal(response.statusCode, 400)
  assert.doesNotMatch(JSON.stringify(response.body), /secret-key-that-must-not-echo/)
})

function createAiSlide(index: number) {
  return {
    kicker: 'AI 마케팅',
    title: `AI 마케팅 핵심 ${index}`,
    description: `테스트 설명 ${index}`,
    content2: `테스트 하단 문구 ${index}`,
    badge: String(index).padStart(2, '0'),
    imagePrompt: `Editorial AI marketing background ${index}`,
    imageSourceUrl: '',
    sources: [{ title: `Source ${index}`, url: `https://news.example.com/source-${index}` }],
  }
}

function createMockResponse(): MockResponse {
  return {
    headers: {},
    statusCode: 0,
    body: null,
    status(code) {
      this.statusCode = code
      return this
    },
    json(body) {
      this.body = body
    },
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value
    },
  }
}

function createFetchMock(
  responses: Array<{
    readonly ok: boolean
    readonly status: number
    readonly headers?: Headers
    json?(): Promise<unknown>
    text?(): Promise<string>
    arrayBuffer?(): Promise<ArrayBuffer>
  }>,
  requests: RecordedRequest[] = [],
) {
  return async (url: string | URL | Request, init?: RequestInit) => {
    const response = responses.shift()
    if (response == null) {
      throw new Error('Unexpected fetch call')
    }

    requests.push({
      url: String(url),
      authorization: readAuthorization(init?.headers),
      body: typeof init?.body === 'string' ? init.body : '',
    })

    return response as Response
  }
}

function readAuthorization(headers: HeadersInit | undefined) {
  if (headers == null) {
    return ''
  }

  if (headers instanceof Headers) {
    return headers.get('authorization') ?? ''
  }

  if (Array.isArray(headers)) {
    return headers.find(([name]) => name.toLowerCase() === 'authorization')?.[1] ?? ''
  }

  return headers.authorization ?? ''
}

function readResponseBody(input: unknown) {
  assert.ok(input != null && typeof input === 'object' && !Array.isArray(input))
  return input as {
    readonly source: 'ai' | 'fallback'
    readonly slides: ReadonlyArray<{
      readonly imageDataUrl?: string | null
      readonly imageStatus: string
      readonly title: string
      readonly imageSourceUrl?: string
      readonly sources?: ReadonlyArray<{
        readonly title: string
        readonly url: string
      }>
    }>
    readonly sources: ReadonlyArray<{
      readonly title: string
      readonly url: string
    }>
    readonly warnings: readonly string[]
  }
}

function restoreEnvironment(previousApiKey: string | undefined, previousFetch: typeof fetch) {
  if (previousApiKey == null) {
    delete process.env.OPENAI_API_KEY
  } else {
    process.env.OPENAI_API_KEY = previousApiKey
  }
  globalThis.fetch = previousFetch
}

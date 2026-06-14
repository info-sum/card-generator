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
    assert.equal(requests[0]?.url, 'https://api.openai.com/v1/responses')
    assert.equal(requests[0]?.authorization, 'Bearer sk-request-key')
    assert.match(requests[0]?.body ?? '', /최근 뉴스 기사/)
    assert.match(requests[0]?.body ?? '', /web_search/)
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
                    slides: Array.from({ length: 6 }, (_, index) => createAiSlide(index + 1)),
                  }),
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
    assert.match(requests[0]?.url ?? '', /generativelanguage\.googleapis\.com/)
    assert.equal(requests[0]?.authorization, '')
    assert.match(requests[0]?.body ?? '', /최근 뉴스 기사/)
    assert.match(requests[0]?.body ?? '', /google_search/)
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
                    slides: Array.from({ length: 6 }, (_, index) => createAiSlide(index + 1)),
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
    readonly slides: ReadonlyArray<{ readonly imageDataUrl?: string | null; readonly imageStatus: string }>
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

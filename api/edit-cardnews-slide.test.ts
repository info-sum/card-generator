import assert from 'node:assert/strict'
import test from 'node:test'

import handler from './edit-cardnews-slide.js'

type MockResponse = {
  readonly headers: Record<string, string>
  statusCode: number
  body: unknown
  status(code: number): MockResponse
  json(body: unknown): void
  setHeader(name: string, value: string): void
}

const requestBody = {
  aiProvider: 'gpt',
  brandName: '카드뉴스 제작하기',
  instruction: '제목을 더 짧게 바꿔줘.',
  slide: {
    badge: '핵심',
    content2: '',
    description: 'AI가 반복 업무를 줄이는 방법을 설명해요.',
    kicker: 'AI WORK',
    title: 'AI가 바꾸는 업무 방식',
  },
  topic: 'AI 업무 자동화',
} as const

test('edit-cardnews-slide handler returns one edited slide from OpenAI', async () => {
  const previousApiKey = process.env.OPENAI_API_KEY
  const previousFetch = globalThis.fetch
  process.env.OPENAI_API_KEY = 'test-key'
  globalThis.fetch = async () => new Response(JSON.stringify({
    output_text: JSON.stringify({
      slide: {
        badge: '핵심',
        content2: '',
        description: '반복 업무는 줄이고 더 중요한 판단에 시간을 쓸 수 있어요.',
        kicker: 'AI WORK',
        title: '반복 업무부터 줄어든다',
      },
    }),
  }), { status: 200 })

  try {
    const response = createMockResponse()
    await handler({ body: requestBody, method: 'POST' }, response)

    assert.equal(response.statusCode, 200)
    assert.equal(readSlide(response.body).title, '반복 업무부터 줄어든다')
  } finally {
    globalThis.fetch = previousFetch
    if (previousApiKey == null) {
      delete process.env.OPENAI_API_KEY
    } else {
      process.env.OPENAI_API_KEY = previousApiKey
    }
  }
})

test('edit-cardnews-slide handler requires an API key', async () => {
  const previousApiKey = process.env.OPENAI_API_KEY
  delete process.env.OPENAI_API_KEY

  try {
    const response = createMockResponse()
    await handler({ body: requestBody, method: 'POST' }, response)

    assert.equal(response.statusCode, 401)
  } finally {
    if (previousApiKey == null) {
      delete process.env.OPENAI_API_KEY
    } else {
      process.env.OPENAI_API_KEY = previousApiKey
    }
  }
})

function createMockResponse(): MockResponse {
  return {
    body: null,
    headers: {},
    json(body) {
      this.body = body
    },
    status(code) {
      this.statusCode = code
      return this
    },
    statusCode: 200,
    setHeader(name, value) {
      this.headers[name] = value
    },
  }
}

function readSlide(input: unknown) {
  if (!isRecord(input) || !isRecord(input.slide)) {
    throw new Error('Expected an edit response')
  }

  if (typeof input.slide.title !== 'string') {
    throw new Error('Expected a slide response')
  }

  return { title: input.slide.title }
}

function isRecord(input: unknown): input is Readonly<Record<string, unknown>> {
  return input != null && typeof input === 'object' && !Array.isArray(input)
}

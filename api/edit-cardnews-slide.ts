import {
  normalizeAiSlideEditRequest,
  normalizeAiSlideEditResponse,
  type AiSlideEditRequest,
  type EditableSlideCopy,
} from '../src/lib/aiSlideEdit.js'

type ApiRequest = {
  readonly method?: string
  readonly body?: unknown
}

type ApiResponse = {
  status(code: number): ApiResponse
  json(body: unknown): void
  setHeader(name: string, value: string): void
}

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses'
const GEMINI_GENERATE_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models'
const DEFAULT_OPENAI_TEXT_MODEL = process.env.OPENAI_TEXT_MODEL ?? 'gpt-5.5'
const DEFAULT_GEMINI_TEXT_MODEL = process.env.GEMINI_TEXT_MODEL ?? 'gemini-3.5-flash'

export default async function handler(request: ApiRequest, response: ApiResponse) {
  response.setHeader('cache-control', 'no-store')
  if (request.method !== 'POST') {
    response.status(405).json({ message: 'POST 요청만 지원합니다.' })
    return
  }

  const parsed = normalizeAiSlideEditRequest(readBody(request.body))
  if (parsed.ok === false) {
    response.status(400).json({ message: parsed.reason })
    return
  }

  const apiKey = readRuntimeApiKey(parsed.value)
  if (apiKey == null) {
    response.status(401).json({ message: 'AI 편집을 위해 API Key를 먼저 설정해 주세요.' })
    return
  }

  try {
    response.status(200).json({ slide: await editSlide(parsed.value, apiKey) })
  } catch (error) {
    if (error instanceof Error) {
      response.status(502).json({ message: 'AI 편집 요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.' })
      return
    }

    response.status(502).json({ message: 'AI 편집 요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.' })
  }
}

async function editSlide(request: AiSlideEditRequest, apiKey: string): Promise<EditableSlideCopy> {
  switch (request.aiProvider) {
    case 'gpt':
      return editWithOpenAi(request, apiKey)
    case 'gemini':
      return editWithGemini(request, apiKey)
  }
}

async function editWithOpenAi(request: AiSlideEditRequest, apiKey: string) {
  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: DEFAULT_OPENAI_TEXT_MODEL,
      input: [
        { role: 'system', content: '너는 한국어 SNS 카드뉴스 편집자다. JSON만 반환한다.' },
        { role: 'user', content: buildEditPrompt(request) },
      ],
      text: { format: { type: 'json_object' } },
    }),
  })
  if (!response.ok) {
    throw new Error('OpenAI edit request failed')
  }

  return parseEditedSlide(readOpenAiOutputText(await response.json()))
}

async function editWithGemini(request: AiSlideEditRequest, apiKey: string) {
  const response = await fetch(`${GEMINI_GENERATE_BASE_URL}/${DEFAULT_GEMINI_TEXT_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: buildEditPrompt(request) }] }],
      generationConfig: { responseMimeType: 'application/json' },
    }),
  })
  if (!response.ok) {
    throw new Error('Gemini edit request failed')
  }

  return parseEditedSlide(readGeminiOutputText(await response.json()))
}

function buildEditPrompt(request: AiSlideEditRequest) {
  return JSON.stringify({
    task: '사용자 요청에 맞게 카드뉴스 한 장의 문구만 편집하라.',
    topic: request.topic,
    brandName: request.brandName,
    instruction: request.instruction,
    currentSlide: request.slide,
    schema: {
      slide: {
        kicker: 'string',
        title: 'string',
        description: 'string',
        content2: 'string',
        badge: 'string',
      },
    },
    rules: [
      '현재 카드의 역할과 사실, 수치, 날짜, 고유명사는 유지한다.',
      '사용자 요청과 관계없는 내용을 새로 만들지 않는다.',
      '제목은 짧고 명확하게, 본문은 자연스러운 한국어 해요체로 쓴다.',
      '이모지와 과장 표현을 쓰지 않는다.',
      '이미지, 출처, 레이아웃에 관한 필드는 반환하지 않는다.',
    ],
  })
}

function parseEditedSlide(jsonText: string) {
  try {
    const parsedJson: unknown = JSON.parse(jsonText)
    const parsed = normalizeAiSlideEditResponse(parsedJson)
    if (parsed.ok === false) {
      throw new Error(parsed.reason)
    }
    return parsed.value
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('AI edit response is not JSON')
    }
    throw error
  }
}

function readRuntimeApiKey(request: AiSlideEditRequest) {
  const suppliedKey = request.apiKey?.trim()
  if (suppliedKey != null && suppliedKey.length > 0) {
    return suppliedKey
  }

  const configuredKey = request.aiProvider === 'gpt'
    ? process.env.OPENAI_API_KEY
    : process.env.GEMINI_API_KEY
  return configuredKey?.trim() || null
}

function readBody(input: unknown) {
  if (typeof input !== 'string') {
    return input
  }

  try {
    return JSON.parse(input) as unknown
  } catch (error) {
    if (error instanceof SyntaxError) {
      return null
    }
    throw error
  }
}

function readOpenAiOutputText(input: unknown) {
  if (!isRecord(input)) {
    return ''
  }

  if (typeof input.output_text === 'string') {
    return input.output_text
  }

  return Array.isArray(input.output)
    ? input.output.flatMap(readOutputContent).join('\n')
    : ''
}

function readOutputContent(input: unknown): readonly string[] {
  if (!isRecord(input) || !Array.isArray(input.content)) {
    return []
  }

  return input.content.flatMap((content) => isRecord(content) && typeof content.text === 'string' ? [content.text] : [])
}

function readGeminiOutputText(input: unknown) {
  if (!isRecord(input) || !Array.isArray(input.candidates)) {
    return ''
  }

  const candidate = input.candidates[0]
  if (!isRecord(candidate) || !isRecord(candidate.content) || !Array.isArray(candidate.content.parts)) {
    return ''
  }

  return candidate.content.parts.flatMap((part) => isRecord(part) && typeof part.text === 'string' ? [part.text] : []).join('\n')
}

function isRecord(input: unknown): input is Readonly<Record<string, unknown>> {
  return input != null && typeof input === 'object' && !Array.isArray(input)
}

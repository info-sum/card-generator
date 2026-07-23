export const AI_SLIDE_EDIT_ENDPOINT = '/api/edit-cardnews-slide'
export const AI_SLIDE_EDIT_PROVIDERS = ['gpt', 'gemini'] as const

export type AiSlideEditProvider = typeof AI_SLIDE_EDIT_PROVIDERS[number]

export type EditableSlideCopy = {
  readonly kicker: string
  readonly title: string
  readonly description: string
  readonly content2: string
  readonly badge: string
}

export type AiSlideEditRequest = {
  readonly topic: string
  readonly brandName: string
  readonly instruction: string
  readonly slide: EditableSlideCopy
  readonly aiProvider: AiSlideEditProvider
  readonly apiKey?: string
}

type AiSlideEditFetch = (url: string, init: {
  readonly method: 'POST'
  readonly headers: Readonly<Record<string, string>>
  readonly body: string
}) => Promise<{
  readonly ok: boolean
  readonly status: number
  json(): Promise<unknown>
}>

type ParseResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly reason: string }

const REQUEST_ERROR_MESSAGE = '편집 요청과 카드 내용을 다시 확인해 주세요.'
const MAX_TEXT_LENGTH = 1_500
const MAX_INSTRUCTION_LENGTH = 1_000

export class AiSlideEditRequestError extends Error {
  readonly name = 'AiSlideEditRequestError'
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function requestAiSlideEdit(
  request: AiSlideEditRequest,
  fetcher: AiSlideEditFetch = defaultFetch,
): Promise<EditableSlideCopy> {
  const normalized = normalizeAiSlideEditRequest(request)
  if (normalized.ok === false) {
    throw new AiSlideEditRequestError(400, normalized.reason)
  }

  let response: Awaited<ReturnType<AiSlideEditFetch>>
  try {
    response = await fetcher(AI_SLIDE_EDIT_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(normalized.value),
    })
  } catch {
    throw new AiSlideEditRequestError(0, 'AI 편집 서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.')
  }

  const body = await readResponseBody(response)
  if (!response.ok) {
    throw new AiSlideEditRequestError(response.status, readMessage(body))
  }

  const parsed = normalizeAiSlideEditResponse(body)
  if (parsed.ok === false) {
    throw new AiSlideEditRequestError(response.status, parsed.reason)
  }

  return parsed.value
}

export function normalizeAiSlideEditRequest(input: unknown): ParseResult<AiSlideEditRequest> {
  if (!isRecord(input)) {
    return { ok: false, reason: REQUEST_ERROR_MESSAGE }
  }

  const topic = readText(input.topic, MAX_TEXT_LENGTH)
  const brandName = readText(input.brandName, 160)
  const instruction = readText(input.instruction, MAX_INSTRUCTION_LENGTH)
  const slide = normalizeEditableSlideCopy(input.slide)
  const aiProvider = input.aiProvider
  const apiKey = readText(input.apiKey, 300)
  if (
    topic.length === 0 ||
    instruction.length === 0 ||
    slide == null ||
    (aiProvider !== 'gpt' && aiProvider !== 'gemini')
  ) {
    return { ok: false, reason: REQUEST_ERROR_MESSAGE }
  }

  return {
    ok: true,
    value: {
      topic,
      brandName: brandName || 'SNS 카드뉴스 생성기',
      instruction,
      slide,
      aiProvider,
      ...(apiKey.length > 0 ? { apiKey } : {}),
    },
  }
}

export function normalizeAiSlideEditResponse(input: unknown): ParseResult<EditableSlideCopy> {
  if (!isRecord(input)) {
    return { ok: false, reason: 'AI 편집 응답 형식이 올바르지 않아요.' }
  }

  const slide = normalizeEditableSlideCopy(input.slide)
  return slide == null
    ? { ok: false, reason: 'AI 편집 응답 형식이 올바르지 않아요.' }
    : { ok: true, value: slide }
}

function normalizeEditableSlideCopy(input: unknown): EditableSlideCopy | null {
  if (!isRecord(input)) {
    return null
  }

  const title = readText(input.title, MAX_TEXT_LENGTH)
  const description = readText(input.description, MAX_TEXT_LENGTH)
  if (title.length === 0 || description.length === 0) {
    return null
  }

  return {
    kicker: readText(input.kicker, 300),
    title,
    description,
    content2: readText(input.content2, MAX_TEXT_LENGTH),
    badge: readText(input.badge, 300),
  }
}

function readMessage(input: unknown) {
  return isRecord(input) && typeof input.message === 'string'
    ? input.message
    : 'AI 편집에 실패했어요.'
}

async function readResponseBody(response: Awaited<ReturnType<AiSlideEditFetch>>) {
  try {
    return await response.json()
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof TypeError) {
      return null
    }

    throw error
  }
}

function readText(input: unknown, maxLength: number) {
  return typeof input === 'string'
    ? input.replace(/\s+/g, ' ').trim().slice(0, maxLength)
    : ''
}

function isRecord(input: unknown): input is Readonly<Record<string, unknown>> {
  return input != null && typeof input === 'object' && !Array.isArray(input)
}

async function defaultFetch(url: string, init: Parameters<AiSlideEditFetch>[1]) {
  return fetch(url, init)
}

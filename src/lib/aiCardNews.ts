import {
  AUTO_SLIDE_COUNT_OPTIONS,
  type TemplateLayoutId,
} from '../creationFlow.js'
import {
  CARD_NEWS_DRAFT_STYLE_IDS,
  generateCardNewsDraft,
  type CardNewsDraftStyle,
} from '../cardNewsDraft.js'

export const AI_CARD_NEWS_ENDPOINT = '/api/generate-cardnews'
export const AI_API_PROVIDERS = ['gpt', 'gemini'] as const
export const AI_TONE_MANNERS = ['clean', 'friendly', 'professional', 'emotional'] as const
export type AiApiProvider = typeof AI_API_PROVIDERS[number]
export type AiToneManner = typeof AI_TONE_MANNERS[number]

export type GenerateCardNewsRequest = {
  readonly topic: string
  readonly style: CardNewsDraftStyle
  readonly slideCount: number
  readonly brandName: string
  readonly accentColor: string
  readonly layout: TemplateLayoutId
  readonly toneManner?: AiToneManner
  readonly generateImages: boolean
  readonly aiProvider: AiApiProvider
  readonly apiKey?: string
}

export type GeneratedAiSource = {
  readonly title: string
  readonly url: string
}

export type GeneratedAiSlide = {
  readonly kicker: string
  readonly title: string
  readonly description: string
  readonly content2: string
  readonly badge: string
  readonly imagePrompt: string
  readonly imageSourceUrl: string
  readonly imageDataUrl: string | null
  readonly imageStatus: 'generated' | 'skipped' | 'failed'
  readonly sources: readonly GeneratedAiSource[]
}

export type GenerateCardNewsResponse = {
  readonly source: 'ai' | 'fallback'
  readonly projectTitle: string
  readonly brandName: string
  readonly slides: readonly GeneratedAiSlide[]
  readonly sources: readonly GeneratedAiSource[]
  readonly warnings: readonly string[]
}

export type ParseResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly reason: string }

export type AiCardNewsFetch = (
  url: string,
  init: {
    readonly method: 'POST'
    readonly headers: Readonly<Record<string, string>>
    readonly body: string
    readonly signal?: AbortSignal
  },
) => Promise<{
  readonly ok: boolean
  readonly status: number
  json(): Promise<unknown>
}>

export class AiCardNewsRequestError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'AiCardNewsRequestError'
    this.status = status
  }
}

const REQUEST_ERROR_MESSAGE = '주제는 1자 이상, 카드 장 수는 4~9장이어야 해요.'
const VALID_LAYOUTS = ['sequence', 'overlay', 'split-light', 'split-dark'] as const
const HEX_COLOR_PATTERN = /^#?([0-9a-fA-F]{6})$/

export function normalizeGenerateCardNewsRequest(input: unknown): ParseResult<GenerateCardNewsRequest> {
  if (!isRecord(input)) {
    return { ok: false, reason: REQUEST_ERROR_MESSAGE }
  }

  const topic = typeof input.topic === 'string' ? input.topic.replace(/\s+/g, ' ').trim() : ''
  const style = typeof input.style === 'string' && isCardNewsDraftStyle(input.style) ? input.style : null
  const slideCount = typeof input.slideCount === 'number' ? input.slideCount : Number.NaN
  const brandName = typeof input.brandName === 'string' ? input.brandName.replace(/\s+/g, ' ').trim() : ''
  const accentColor = typeof input.accentColor === 'string' ? normalizeHexColor(input.accentColor) : null
  const layout = typeof input.layout === 'string' && isTemplateLayout(input.layout) ? input.layout : null
  const toneManner = readToneManner(input.toneManner)
  const generateImages = typeof input.generateImages === 'boolean' ? input.generateImages : false
  const aiProvider = typeof input.aiProvider === 'string' && isAiApiProvider(input.aiProvider) ? input.aiProvider : null
  const apiKey = typeof input.apiKey === 'string' ? input.apiKey.trim() : ''

  if (
    topic.length === 0 ||
    topic.length > 100 ||
    style == null ||
    !Number.isInteger(slideCount) ||
    !AUTO_SLIDE_COUNT_OPTIONS.includes(slideCount as (typeof AUTO_SLIDE_COUNT_OPTIONS)[number]) ||
    accentColor == null ||
    layout == null ||
    toneManner == null ||
    aiProvider == null
  ) {
    return { ok: false, reason: REQUEST_ERROR_MESSAGE }
  }

  return {
    ok: true,
    value: {
      topic,
      style,
      slideCount,
      brandName: brandName.length > 0 ? brandName : 'SNS 카드뉴스 생성기',
      accentColor,
      layout,
      toneManner,
      generateImages,
      aiProvider,
      apiKey: apiKey.length > 0 ? apiKey : undefined,
    },
  }
}

export function buildFallbackAiCardNewsResponse(
  request: GenerateCardNewsRequest,
  warning?: string,
): GenerateCardNewsResponse {
  const draft = generateCardNewsDraft(request.topic, {
    accentColor: request.accentColor,
    brandName: request.brandName,
    slideCount: request.slideCount,
    style: request.style,
  })

  return {
    source: 'fallback',
    projectTitle: draft.projectTitle,
    brandName: draft.brandName,
    slides: draft.slides.map((slide) => ({
      kicker: slide.kicker,
      title: slide.title,
      description: slide.description,
      content2: slide.content2,
      badge: slide.badge,
      imagePrompt: `${request.topic} 카드뉴스 ${slide.badge} 페이지에 어울리는 깨끗한 editorial illustration`,
      imageSourceUrl: '',
      imageDataUrl: null,
      imageStatus: 'skipped',
      sources: [],
    })),
    sources: [],
    warnings: warning == null || warning.trim().length === 0 ? [] : [warning],
  }
}

export async function requestAiCardNews(
  request: GenerateCardNewsRequest,
  fetcher: AiCardNewsFetch = defaultFetch,
): Promise<GenerateCardNewsResponse> {
  const normalized = normalizeGenerateCardNewsRequest(request)
  if (normalized.ok === false) {
    throw new AiCardNewsRequestError(400, normalized.reason)
  }

  const response = await fetcher(AI_CARD_NEWS_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(normalized.value),
  })

  const body = await response.json()
  if (!response.ok) {
    throw new AiCardNewsRequestError(response.status, readErrorMessage(body))
  }

  const parsed = normalizeGenerateCardNewsResponse(body)
  if (parsed.ok === false) {
    throw new AiCardNewsRequestError(response.status, parsed.reason)
  }

  return parsed.value
}

export function normalizeGenerateCardNewsResponse(input: unknown): ParseResult<GenerateCardNewsResponse> {
  if (!isRecord(input)) {
    return { ok: false, reason: 'AI 생성 응답 형식이 올바르지 않아요.' }
  }

  const source = input.source === 'ai' || input.source === 'fallback' ? input.source : null
  const projectTitle = typeof input.projectTitle === 'string' ? input.projectTitle.trim() : ''
  const brandName = typeof input.brandName === 'string' ? input.brandName.trim() : ''
  const sources = normalizeSources(input.sources)
  const warnings = Array.isArray(input.warnings)
    ? input.warnings.filter((warning): warning is string => typeof warning === 'string')
    : []

  if (source == null || projectTitle.length === 0 || brandName.length === 0 || !Array.isArray(input.slides)) {
    return { ok: false, reason: 'AI 생성 응답 형식이 올바르지 않아요.' }
  }

  const parsedSlides = input.slides.map(normalizeGeneratedSlide)
  if (parsedSlides.some((slide) => !slide.ok)) {
    return { ok: false, reason: 'AI 카드 응답 형식이 올바르지 않아요.' }
  }
  const slides = parsedSlides.flatMap((slide) => (slide.ok ? [slide.value] : []))

  return {
    ok: true,
    value: {
      source,
      projectTitle,
      brandName,
      slides,
      sources,
      warnings,
    },
  }
}

function normalizeGeneratedSlide(input: unknown): ParseResult<GeneratedAiSlide> {
  if (!isRecord(input)) {
    return { ok: false, reason: 'AI 카드 응답 형식이 올바르지 않아요.' }
  }

  const imageStatus =
    input.imageStatus === 'generated' || input.imageStatus === 'skipped' || input.imageStatus === 'failed'
      ? input.imageStatus
      : null
  const imageDataUrl = typeof input.imageDataUrl === 'string' && input.imageDataUrl.trim().length > 0
    ? input.imageDataUrl
    : null
  const imageSourceUrl = normalizeHttpsUrl(readText(input.imageSourceUrl))

  if (imageStatus == null) {
    return { ok: false, reason: 'AI 카드 응답 형식이 올바르지 않아요.' }
  }

  return {
    ok: true,
    value: {
      kicker: readText(input.kicker),
      title: readText(input.title),
      description: readText(input.description),
      content2: readText(input.content2),
      badge: readText(input.badge),
      imagePrompt: readText(input.imagePrompt),
      imageSourceUrl,
      imageDataUrl,
      imageStatus,
      sources: normalizeSources(input.sources),
    },
  }
}

async function defaultFetch(
  url: string,
  init: Parameters<AiCardNewsFetch>[1],
): ReturnType<AiCardNewsFetch> {
  return fetch(url, init)
}

function readErrorMessage(input: unknown) {
  if (!isRecord(input)) {
    return 'AI 생성 요청에 실패했어요.'
  }

  return typeof input.message === 'string' ? input.message : 'AI 생성 요청에 실패했어요.'
}

function readText(input: unknown) {
  return typeof input === 'string' ? input.trim() : ''
}

function isRecord(input: unknown): input is Readonly<Record<string, unknown>> {
  return input != null && typeof input === 'object' && !Array.isArray(input)
}

function isCardNewsDraftStyle(input: string): input is CardNewsDraftStyle {
  return CARD_NEWS_DRAFT_STYLE_IDS.includes(input as CardNewsDraftStyle)
}

function isTemplateLayout(input: string): input is TemplateLayoutId {
  return VALID_LAYOUTS.includes(input as TemplateLayoutId)
}

function isAiApiProvider(input: string): input is AiApiProvider {
  return AI_API_PROVIDERS.includes(input as AiApiProvider)
}

function readToneManner(input: unknown): AiToneManner | null {
  if (input == null) {
    return 'clean'
  }

  return typeof input === 'string' && AI_TONE_MANNERS.includes(input as AiToneManner)
    ? input as AiToneManner
    : null
}

function normalizeHexColor(input: string) {
  const matched = input.trim().match(HEX_COLOR_PATTERN)
  return matched == null ? null : `#${matched[1].toLowerCase()}`
}

function normalizeSources(input: unknown): readonly GeneratedAiSource[] {
  if (!Array.isArray(input)) {
    return []
  }

  return input.flatMap((source) => {
    if (!isRecord(source)) {
      return []
    }

    const url = normalizeWebUrl(readText(source.url))
    if (url.length === 0) {
      return []
    }

    const title = readText(source.title)
    return [{
      title: title.length > 0 ? title : url,
      url,
    }]
  })
}

function normalizeHttpsUrl(value: string) {
  const url = normalizeWebUrl(value)
  return url.startsWith('https://') ? url : ''
}

function normalizeWebUrl(value: string) {
  if (value.length === 0) {
    return ''
  }

  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      return ''
    }

    return url.toString()
  } catch (error) {
    if (error instanceof TypeError) {
      return ''
    }

    throw error
  }
}

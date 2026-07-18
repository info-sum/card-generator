import {
  buildFallbackAiCardNewsResponse,
  normalizeGenerateCardNewsRequest,
  type GenerateCardNewsRequest,
  type GenerateCardNewsResponse,
  type GeneratedAiSource,
  type GeneratedAiSlide,
} from '../src/lib/aiCardNews.js'
import { buildCardClaudeContentPrompt } from '../src/lib/cardClaudeGuidance.js'

type ApiRequest = {
  readonly method?: string
  readonly body?: unknown
}

type ApiResponse = {
  status(code: number): ApiResponse
  json(body: unknown): void
  setHeader(name: string, value: string): void
}

type OpenAiTextSlide = {
  readonly kicker: string
  readonly title: string
  readonly description: string
  readonly content2: string
  readonly badge: string
  readonly imagePrompt: string
  readonly imageSourceUrl: string
  readonly sources: readonly GeneratedAiSource[]
}

type OpenAiTextProject = {
  readonly projectTitle: string
  readonly slides: readonly OpenAiTextSlide[]
  readonly sources: readonly GeneratedAiSource[]
}

type TextProjectResult = {
  readonly project: OpenAiTextProject
  readonly debugLog: {
    readonly requestPrompt: string
    readonly rawResponse: string
  }
}

type GeneratedAiSlideWithError = GeneratedAiSlide & {
  readonly imageError?: string
}

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses'
const OPENAI_IMAGES_URL = 'https://api.openai.com/v1/images/generations'
const GEMINI_GENERATE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'
const DEFAULT_OPENAI_TEXT_MODEL = process.env.OPENAI_TEXT_MODEL ?? 'gpt-5.4-mini'
const GEMINI_IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL ?? 'gemini-3.1-flash-image'
const CARDNEWS_SYSTEM_PROMPT =
  '너는 한국어 SNS 카드뉴스 기획자다. 이미지 안에는 문자를 넣지 말고, 카드 문구는 JSON 필드로만 작성한다.'
const RECENT_NEWS_ANALYSIS_PROMPT = [
  '보조 지시: 주제와 관련된 최근 뉴스 기사, 공개 보도자료, 업계 리포트의 흐름을 우선 참고해 분석한다.',
  '최근 뉴스 기사에서 반복적으로 보이는 변화, 논쟁점, 수요 신호, 숫자보다 중요한 맥락을 뽑아 카드 흐름에 반영한다.',
  '확인되지 않은 수치나 단일 기사 내용을 사실처럼 단정하지 말고, 기사들이 공통으로 보여주는 트렌드 중심으로 설명한다.',
  '리서치 과정은 내부 근거로만 쓰고, 카드 문구와 게시글 본문에는 최근 뉴스·연관 보도·관련 기사·다른 뉴스나 기사를 봤다는 표현을 쓰지 않는다. 기사 묶음이 아니라 사건, 변화, 핵심 사실을 바로 설명한다.',
  '카드 문구는 한국어로 짧고 명확하게 쓰고, 이미지 프롬프트는 텍스트 없는 editorial background 중심의 영어로 작성한다.',
  '카드별 이미지가 필요하므로 웹에서 이미 공개된 관련 사진의 직접 HTTPS 이미지 URL을 imageSourceUrl에 우선 넣는다.',
  'imageSourceUrl은 jpg, jpeg, png, webp 같은 이미지 파일 URL만 사용하고, 불확실하면 빈 문자열로 둔다.',
].join('\n')
const MAX_REMOTE_IMAGE_BYTES = 4_000_000
const MIN_REMOTE_IMAGE_BYTES = 24_000
const MAX_SOURCE_HTML_BYTES = 700_000
const BLOCKED_WEB_IMAGE_HOSTS = new Set([
  'googleusercontent.com',
  'lh3.googleusercontent.com',
  'lh4.googleusercontent.com',
  'lh5.googleusercontent.com',
  'lh6.googleusercontent.com',
])

export default async function handler(request: ApiRequest, response: ApiResponse) {
  response.setHeader('cache-control', 'no-store')

  if (request.method !== 'POST') {
    response.status(405).json({ message: 'POST 요청만 지원합니다.' })
    return
  }

  const parsed = normalizeGenerateCardNewsRequest(readBody(request.body))
  if (parsed.ok === false) {
    response.status(400).json({ message: parsed.reason })
    return
  }

  const apiKey = readRuntimeApiKey(parsed.value)
  if (apiKey == null) {
    response.status(200).json(buildFallbackAiCardNewsResponse(parsed.value))
    return
  }

  try {
    const { project, debugLog } = await generateTextProject(parsed.value, apiKey)
    const slides = await generateSlidesWithImages(project.slides, parsed.value, apiKey)
    const body: GenerateCardNewsResponse = {
      source: 'ai',
      projectTitle: project.projectTitle,
      brandName: parsed.value.brandName,
      slides,
      sources: project.sources,
      warnings: buildGenerationWarnings(slides),
      ...(process.env.NODE_ENV !== 'production' ? { debugLog } : {}),
    }

    response.status(200).json(body)
  } catch (error) {
    if (error instanceof Error) {
      response.status(200).json(buildFallbackAiCardNewsResponse(parsed.value, error.message))
      return
    }

    response.status(200).json(buildFallbackAiCardNewsResponse(parsed.value, 'AI 생성 요청에 실패했어요.'))
  }
}

async function generateTextProject(
  request: GenerateCardNewsRequest,
  apiKey: string,
): Promise<TextProjectResult> {
  if (request.aiProvider === 'gemini') {
    return generateGeminiTextProject(request, apiKey)
  }

  const openAiResponse = await requestOpenAiTextProject(request, apiKey, true)

  if (!openAiResponse.ok) {
    const errorMessage = await readProviderErrorMessage(openAiResponse, 'OpenAI text generation failed', apiKey)
    if (shouldRetryOpenAiTextWithoutWebSearch(errorMessage)) {
      const fallbackResponse = await requestOpenAiTextProject(request, apiKey, false)
      if (!fallbackResponse.ok) {
        throw new Error(await readProviderErrorMessage(fallbackResponse, 'OpenAI text generation failed', apiKey))
      }

      const fallbackBody = await fallbackResponse.json()
      const fallbackOutputText = readOpenAiOutputText(fallbackBody)
      const fallbackParsed = normalizeOpenAiTextProject(fallbackOutputText, request)
      if (fallbackParsed.ok === false) {
        throw new Error(fallbackParsed.reason)
      }

      return {
        project: applyProviderSources(fallbackParsed.value, readOpenAiSources(fallbackBody), request.newsContext),
        debugLog: { requestPrompt: buildTextPrompt(request), rawResponse: JSON.stringify(fallbackBody, null, 2) },
      }
    }

    throw new Error(errorMessage)
  }

  const body = await openAiResponse.json()
  const outputText = readOpenAiOutputText(body)
  const parsed = normalizeOpenAiTextProject(outputText, request)
  if (parsed.ok === false) {
    throw new Error(parsed.reason)
  }

  return {
    project: applyProviderSources(parsed.value, readOpenAiSources(body), request.newsContext),
    debugLog: { requestPrompt: buildTextPrompt(request), rawResponse: JSON.stringify(body, null, 2) },
  }
}

function requestOpenAiTextProject(
  request: GenerateCardNewsRequest,
  apiKey: string,
  useWebSearch: boolean,
) {
  return fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: DEFAULT_OPENAI_TEXT_MODEL,
      input: [
        {
          role: 'system',
          content: [CARDNEWS_SYSTEM_PROMPT, RECENT_NEWS_ANALYSIS_PROMPT].join('\n\n'),
        },
        {
          role: 'user',
          content: buildTextPrompt(request),
        },
      ],
      text: {
        format: {
          type: 'json_object',
        },
      },
      ...(useWebSearch
        ? {
          tools: [{ type: 'web_search' }],
          tool_choice: 'required',
          include: ['web_search_call.action.sources'],
        }
        : { tool_choice: 'none' }),
    }),
  })
}

async function generateGeminiTextProject(
  request: GenerateCardNewsRequest,
  apiKey: string,
): Promise<TextProjectResult> {
  const geminiResponse = await fetch(`${GEMINI_GENERATE_URL}?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: [
                CARDNEWS_SYSTEM_PROMPT,
                RECENT_NEWS_ANALYSIS_PROMPT,
                buildTextPrompt(request),
              ].join('\n\n'),
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
      },
      tools: [{ google_search: {} }],
    }),
  })

  if (!geminiResponse.ok) {
    throw new Error(await readProviderErrorMessage(geminiResponse, 'Gemini text generation failed', apiKey))
  }

  const body = await geminiResponse.json()
  const outputText = readGeminiOutputText(body)
  const parsed = normalizeOpenAiTextProject(outputText, request)
  if (parsed.ok === false) {
    throw new Error(parsed.reason)
  }

  return {
    project: applyProviderSources(parsed.value, readGeminiSources(body), request.newsContext),
    debugLog: { requestPrompt: buildTextPrompt(request), rawResponse: JSON.stringify(body, null, 2) },
  }
}

async function generateSlidesWithImages(
  slides: readonly OpenAiTextSlide[],
  request: GenerateCardNewsRequest,
  apiKey: string,
): Promise<readonly GeneratedAiSlideWithError[]> {
  const generatedSlides: GeneratedAiSlideWithError[] = []
  const usedWebImageUrls = new Set<string>()
  for (const slide of slides) {
    generatedSlides.push(await resolveSlideImage(slide, request, apiKey, usedWebImageUrls))
  }

  return generatedSlides
}

async function resolveSlideImage(
  slide: OpenAiTextSlide,
  request: GenerateCardNewsRequest,
  apiKey: string,
  usedWebImageUrls: Set<string>,
): Promise<GeneratedAiSlideWithError> {
  const webImage = await fetchWebImageDataUrl(slide.imageSourceUrl, usedWebImageUrls)
  if (webImage != null) {
    return {
      ...slide,
      imageDataUrl: webImage,
      imageStatus: 'generated',
    }
  }

  const sourcePreviewImage = await fetchSourcePreviewImage(slide.sources, usedWebImageUrls)
  if (sourcePreviewImage != null) {
    return {
      ...slide,
      imageSourceUrl: sourcePreviewImage.imageSourceUrl,
      imageDataUrl: sourcePreviewImage.imageDataUrl,
      imageStatus: 'generated',
    }
  }

  if (!request.generateImages) {
    return {
      ...slide,
      imageDataUrl: null,
      imageStatus: 'skipped',
    }
  }

  if (request.aiProvider === 'gemini') {
    return generateGeminiSlideImage(slide, request, apiKey)
  }

  return generateSlideImage(slide, request, apiKey)
}

async function fetchWebImageDataUrl(imageSourceUrl: string, usedWebImageUrls: Set<string>): Promise<string | null> {
  const normalizedUrl = normalizeHttpsImageUrl(imageSourceUrl)
  const imageIdentity = getWebImageIdentity(normalizedUrl)
  if (!shouldUseWebImageUrl(normalizedUrl) || usedWebImageUrls.has(imageIdentity)) {
    return null
  }

  try {
    const imageResponse = await fetch(normalizedUrl, {
      headers: {
        accept: 'image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8',
        'user-agent': 'CardStudio/1.0 (+https://localhost)',
      },
      signal: AbortSignal.timeout(8_000),
    })

    if (!imageResponse.ok) {
      return null
    }

    const contentType = normalizeImageContentType(imageResponse.headers.get('content-type'))
    if (contentType == null) {
      return null
    }

    const contentLengthHeader = imageResponse.headers.get('content-length')
    const contentLength = contentLengthHeader == null ? Number.NaN : Number(contentLengthHeader)
    if (Number.isFinite(contentLength) && contentLength < MIN_REMOTE_IMAGE_BYTES) {
      return null
    }

    const imageBuffer = await imageResponse.arrayBuffer()
    if (imageBuffer.byteLength < MIN_REMOTE_IMAGE_BYTES || imageBuffer.byteLength > MAX_REMOTE_IMAGE_BYTES) {
      return null
    }

    usedWebImageUrls.add(imageIdentity)
    return `data:${contentType};base64,${Buffer.from(imageBuffer).toString('base64')}`
  } catch (error) {
    if (error instanceof Error) {
      return null
    }

    throw error
  }
}

async function fetchSourcePreviewImage(
  sources: readonly GeneratedAiSource[],
  usedWebImageUrls: Set<string>,
): Promise<{ readonly imageSourceUrl: string; readonly imageDataUrl: string } | null> {
  for (const source of sources) {
    if (isLikelyImageUrl(source.url)) {
      const directImage = await fetchWebImageDataUrl(source.url, usedWebImageUrls)
      if (directImage != null) {
        return {
          imageSourceUrl: normalizeHttpsImageUrl(source.url),
          imageDataUrl: directImage,
        }
      }
    }

    const previewImageUrl = await fetchSourcePreviewImageUrl(source.url)
    if (previewImageUrl.length === 0) {
      continue
    }

    const previewImage = await fetchWebImageDataUrl(previewImageUrl, usedWebImageUrls)
    if (previewImage != null) {
      return {
        imageSourceUrl: previewImageUrl,
        imageDataUrl: previewImage,
      }
    }
  }

  return null
}

async function fetchSourcePreviewImageUrl(sourceUrl: string) {
  const normalizedSourceUrl = normalizeWebUrl(sourceUrl)
  if (normalizedSourceUrl.length === 0) {
    return ''
  }

  try {
    const pageResponse = await fetch(normalizedSourceUrl, {
      headers: {
        accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5',
        'user-agent': 'CardStudio/1.0 (+https://localhost)',
      },
      signal: AbortSignal.timeout(8_000),
    })

    if (!pageResponse.ok || !isHtmlContentType(pageResponse.headers.get('content-type'))) {
      return ''
    }

    const html = await pageResponse.text()
    if (html.length === 0 || html.length > MAX_SOURCE_HTML_BYTES) {
      return ''
    }

    return readPreviewImageUrl(html, normalizedSourceUrl)
  } catch (error) {
    if (error instanceof Error) {
      return ''
    }

    throw error
  }
}

async function generateSlideImage(
  slide: OpenAiTextSlide,
  request: GenerateCardNewsRequest,
  apiKey: string,
): Promise<GeneratedAiSlideWithError> {
  try {
    const openAiResponse = await fetch(OPENAI_IMAGES_URL, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_IMAGE_MODEL ?? 'gpt-image-2',
        prompt: `${slide.imagePrompt}\nLayout: ${request.layout}. No text, no letters, no logos. Editorial Korean SNS card background.`,
        size: '1024x1536',
      }),
    })

    if (!openAiResponse.ok) {
      throw new Error(await readProviderErrorMessage(openAiResponse, 'OpenAI image generation failed', apiKey))
    }

    const body = await openAiResponse.json()
    const b64Json = readFirstImageBase64(body)

    return {
      ...slide,
      imageDataUrl: b64Json == null ? null : `data:image/png;base64,${b64Json}`,
      imageStatus: b64Json == null ? 'failed' : 'generated',
    }
  } catch (error) {
    if (error instanceof Error) {
      return {
        ...slide,
        imageDataUrl: null,
        imageStatus: 'failed',
        imageError: error.message,
      }
    }

    throw error
  }
}

async function generateGeminiSlideImage(
  slide: OpenAiTextSlide,
  request: GenerateCardNewsRequest,
  apiKey: string,
): Promise<GeneratedAiSlideWithError> {
  try {
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1/models/${GEMINI_IMAGE_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `${slide.imagePrompt}\nLayout: ${request.layout}. No text, no letters, no logos. Editorial Korean SNS card background.`,
              },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      }),
    })

    if (!geminiResponse.ok) {
      throw new Error(await readProviderErrorMessage(geminiResponse, 'Gemini image generation failed', apiKey))
    }

    const body = await geminiResponse.json()
    const imageData = readFirstGeminiImageData(body)

    return {
      ...slide,
      imageDataUrl: imageData == null ? null : `data:${imageData.mimeType};base64,${imageData.data}`,
      imageStatus: imageData == null ? 'failed' : 'generated',
    }
  } catch (error) {
    if (error instanceof Error) {
      return {
        ...slide,
        imageDataUrl: null,
        imageStatus: 'failed',
        imageError: error.message,
      }
    }

    throw error
  }
}

function normalizeImageContentType(contentType: string | null) {
  if (contentType == null) {
    return null
  }

  const mediaType = contentType.split(';', 1)[0]?.trim().toLowerCase() ?? ''
  if (
    mediaType === 'image/jpeg' ||
    mediaType === 'image/png' ||
    mediaType === 'image/webp' ||
    mediaType === 'image/avif'
  ) {
    return mediaType
  }

  return null
}

function isHtmlContentType(contentType: string | null) {
  if (contentType == null) {
    return false
  }

  const mediaType = contentType.split(';', 1)[0]?.trim().toLowerCase() ?? ''
  return mediaType === 'text/html' || mediaType === 'application/xhtml+xml'
}

function isLikelyImageUrl(value: string) {
  try {
    const url = new URL(value)
    return /\.(?:avif|jpe?g|png|webp)$/i.test(url.pathname)
  } catch (error) {
    if (error instanceof TypeError) {
      return false
    }

    throw error
  }
}

function readPreviewImageUrl(html: string, sourceUrl: string) {
  const patterns = [
    /<meta\b[^>]*(?:property|name)=["']og:image(?::secure_url)?["'][^>]*content=["']([^"']+)["'][^>]*>/i,
    /<meta\b[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["']og:image(?::secure_url)?["'][^>]*>/i,
    /<meta\b[^>]*(?:property|name)=["']twitter:image(?::src)?["'][^>]*content=["']([^"']+)["'][^>]*>/i,
    /<meta\b[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["']twitter:image(?::src)?["'][^>]*>/i,
    /<link\b[^>]*rel=["']image_src["'][^>]*href=["']([^"']+)["'][^>]*>/i,
    /<link\b[^>]*href=["']([^"']+)["'][^>]*rel=["']image_src["'][^>]*>/i,
  ] as const

  for (const pattern of patterns) {
    const match = pattern.exec(html)
    const candidate = match?.[1]
    if (candidate == null) {
      continue
    }

    const normalizedUrl = normalizePreviewImageUrl(candidate, sourceUrl)
    if (normalizedUrl.length > 0) {
      return normalizedUrl
    }
  }

  return ''
}

function normalizeHttpsImageUrl(value: string) {
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    return ''
  }

  try {
    const url = new URL(trimmed)
    if (url.protocol !== 'https:') {
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

export function shouldUseWebImageUrl(value: string) {
  if (value.length === 0) {
    return false
  }

  try {
    const url = new URL(value)
    const hostname = url.hostname.toLowerCase()
    if (BLOCKED_WEB_IMAGE_HOSTS.has(hostname) || hostname.endsWith('.googleusercontent.com')) {
      return false
    }

    const declaredWidth = url.searchParams.get('width') ?? url.searchParams.get('w')
    if (declaredWidth != null && /^\d+$/.test(declaredWidth) && Number(declaredWidth) < 480) {
      return false
    }

    if (/(?:^|[-_=])w(?:[1-4]?\d{1,2})(?=$|[-_.])/.test(`${url.pathname}${url.search}`)) {
      return false
    }

    return !/(?:^|[/_.-])(favicon|logo|icon|avatar)(?:[/_.-]|$)/i.test(url.pathname)
  } catch (error) {
    if (error instanceof TypeError) {
      return false
    }

    throw error
  }
}

export function getWebImageIdentity(value: string) {
  try {
    const url = new URL(value)
    return `${url.origin}${url.pathname}`
  } catch (error) {
    if (error instanceof TypeError) {
      return value
    }

    throw error
  }
}

function normalizePreviewImageUrl(value: string, sourceUrl: string) {
  try {
    return normalizeHttpsImageUrl(new URL(decodeHtmlAttribute(value), sourceUrl).toString())
  } catch (error) {
    if (error instanceof TypeError || error instanceof URIError) {
      return ''
    }

    throw error
  }
}

function decodeHtmlAttribute(value: string) {
  return value.trim()
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
}

function buildTextPrompt(request: GenerateCardNewsRequest) {
  return JSON.stringify({
    instruction: '아래 입력으로 한국어 카드뉴스 JSON을 만들어라.',
    topic: request.topic,
    selectedTodayNews: request.newsContext == null ? undefined : {
      title: request.newsContext.title,
      publisher: request.newsContext.publisher,
      url: request.newsContext.url,
      summary: request.newsContext.summary,
      articleSummary: request.newsContext.articleSummary,
      relatedArticles: request.newsContext.relatedArticles,
      publishedAt: request.newsContext.publishedAt,
      instruction: '선택 원문 내용을 최우선 근거로 삼고, 함께 수집한 연관 기사 최대 3개는 맥락·교차확인에만 활용한다. 원문과 연관 기사에서 확인되지 않은 세부 사실·수치를 추가하지 마라. 제목과 링크를 출처에 포함하라.',
    },
    style: request.style,
    toneManner: request.toneManner ?? 'clean',
    messageApproach: request.messageApproach ?? 'strong',
    slideCount: request.slideCount,
    brandName: request.brandName,
    accentColor: request.accentColor,
    layout: request.layout,
    cardClaudeGuidance: buildCardClaudeContentPrompt({
      topic: request.topic,
      style: request.style,
      slideCount: request.slideCount,
    }),
    schema: {
      projectTitle: 'string',
      platformIntent: 'string',
      targetAudience: 'string',
      contentAngle: 'string',
      coreTakeaway: 'string',
      recommendedCaption: 'string',
      recommendedHashtags: ['string'],
      slides: [
        {
          slideNumber: 'number',
          role: 'string',
          hookType: 'string',
          targetAudience: 'string',
          kicker: 'string',
          title: 'string',
          description: 'string',
          content2: 'string',
          badge: 'string',
          imagePrompt: 'string',
          imageSourceUrl: 'string',
          sources: [{ title: 'string', url: 'string' }],
        },
      ],
      sources: [{ title: 'string', url: 'string' }],
    },
    rules: [
      `반드시 slides 개수는 요청된 장수(${request.slideCount})와 정확히 일치해야 한다.`,
      '전체 결과물은 인스타그램 및 쓰레드에 바로 게시 가능한 카드뉴스 구조여야 한다.',
      '첫 장은 설명형 도입이 아니라 스크롤을 멈추게 하는 강렬한 훅형 표지여야 한다.',
      '첫 장의 role은 반드시 hook이어야 한다.',
      '첫 장의 title은 기사 헤드라인처럼 이 카드뉴스가 소개할 주제·핵심 이슈·변화를 즉시 파악할 수 있어야 한다. 주제 없이 궁금증만 유발하는 추상적인 훅은 금지한다.',
      '첫 장의 title은 25자 이내의 짧고 강한 문장으로 작성하고, 주제 또는 핵심 이슈를 포함한 뒤 궁금증·불안·이익·반전 중 하나를 즉시 자극해야 한다.',
      '첫 장 제목 형식 예시: "AI 검색 시대, 우리 브랜드는 왜 답변에 안 나올까". 무엇을 다루는지와 왜 넘겨봐야 하는지가 함께 보여야 한다.',
      '첫 장의 description은 배경 설명보다 \'왜 지금 이걸 봐야 하는지\'를 짧고 강하게 전달해야 한다.',
      '각 카드의 title은 한눈에 읽히는 짧은 문장으로 작성해야 하며, 길고 설명적인 제목을 피해야 한다.',
      '각 카드의 description은 3~5문장 분량으로 작성하고, 단순 요약이 아니라 구체적인 설명·맥락·원인·결과·사례·숫자 중 최소 하나를 포함해야 한다. 제목을 반복하지 말고 독자가 얻을 근거와 실무적 의미를 완결된 본문 안에 담는다.',
      'content2는 항상 빈 문자열("")로 반환한다. 카드 하단용 보조 문구, 짧은 CTA, 다음 장 유도 문구를 만들지 않는다.',
      '카드 하단이 비어 보이더라도 별도 문구를 추가하지 말고 description을 더 구체적이고 읽기 쉽게 강화한다.',
      '각 카드별 본문은 서로 중복되면 안 되며, 앞 장보다 반드시 새로운 정보, 관점, 해석, 함의가 추가되어야 한다.',
      '슬라이드 전체는 표지 → 배경/맥락 → 핵심 정보 → 해석/의미 → 실전 팁 또는 행동 제안 → 요약 흐름으로 자연스럽게 이어져야 한다.',
      '인스타그램/쓰레드에 적합하도록 모든 문장은 짧고 명확하게 작성하고, 한 카드 안에 정보가 과도하게 몰리지 않도록 한다.',
      '저장하거나 공유할 만한 포인트가 최소 2장 이상 포함되어야 하며, 실용적인 팁, 핵심 정리, 통찰 문장을 우선 배치해야 한다.',
      '뉴스형은 최신 사실, 수치, 변화 포인트를 강조해야 한다.',
      '스토리형은 사건 흐름, 감정선, 전환점을 자연스럽게 보여줘야 한다.',
      '정보형은 개념 정리, 핵심 포인트, 실전 팁을 구조적으로 정리해야 한다.',
      '쓰레드형은 주장 → 근거 → 확장 → 결론 구조를 따라야 하며, 각 장이 하나의 짧은 논지처럼 읽혀야 한다.',
      `toneManner(${request.toneManner ?? 'clean'})는 모든 슬라이드에서 일관되게 유지해야 한다.`,
      `메시지 전개 방식(${request.messageApproach ?? 'strong'})에 맞게 전체 내용을 구성해야 한다. 강한 선언형(strong)은 단호하게, 반전형(reversal)은 고정관념을 깨고, 문제제기형(problem)은 독자의 통점을 찌르고, 요약형(summary)은 핵심만 간결하게 전개하고, 정보성(informational)은 새로운 기술의 정보들(기능, 이전 세대와 비교해 바뀐 점, 기대효과) 위주로 카드뉴스를 구성한다.`,
      '과장된 낚시 표현, 근거 없는 단정, 불필요한 자극적 문구는 피하고 신뢰감을 우선해야 한다.',
      '사실, 수치, 날짜, 고유명사, 직접 인용, 출처의 의미는 바꾸거나 새로 만들지 않는다.',
      '번역투("~를 통해", "~에 있어서", "~와 관련하여"), AI식 상투어("결론적으로", "시사하는 바가 크다", "주목할 만하다"), 문두 접속사, 과도한 "~할 수 있다" 표현을 습관적으로 반복하지 않는다.',
      '카드 안의 문장 길이와 종결어미에 작은 변주를 준다. 설명 문장은 해요체(-요)와 기사형 평서체(-다)를 맥락에 맞게 섞되, 한 카드 안에서 억지로 번갈아 쓰지 않고 딱딱한 보고서 말투만 이어지지 않게 한다. 연결어미 뒤 쉼표, 기계적인 첫째·둘째·셋째, 제목 없는 궁금증 유발을 피한다. 사실은 구체적인 주어·동사로 짧고 자연스럽게 쓴다.',
      '모든 텍스트는 한국어로 작성해야 한다.',
      'imagePrompt는 반드시 영어로 작성해야 하며, 이미지 안에 텍스트가 들어가지 않도록 명시해야 한다.',
      'imagePrompt는 단순 키워드 나열이 아니라, 장면, 피사체, 구도, 분위기, 색감이 드러나는 구체적 프롬프트여야 한다.',
      'imagePrompt에는 \'no text, no letters, no typography\'와 같은 텍스트 배제 조건을 포함하는 것이 좋다.',
      '실물 뉴스, 기사, 리포트 기반 내용이 있으면 각 카드의 sources와 전체 sources에 실제 참고 링크를 포함해야 한다. 출처는 sources에만 넣고 카드 문구나 recommendedCaption에서 리서치·연관 기사·다른 보도를 언급하지 않는다.',
      '출처가 불명확한 주장이나 수치는 작성하지 않는다.',
      '마지막 카드는 단순한 끝맺음이 아니라 전체 핵심 요약, 시사점, 또는 독자가 바로 취할 행동 제안이 들어가야 한다.',
      '마지막 카드의 role은 action 또는 summary여야 한다.',
      '브랜드명은 정보 전달을 방해하지 않는 수준에서만 자연스럽게 반영하고, 광고처럼 과하게 노출하지 않는다.',
      'recommendedCaption은 게시글 본문으로 바로 사용할 수 있게 3~6문장 정도로 작성한다.',
      'recommendedCaption에는 주제 요약, 독자 관심 포인트, 참여 유도 문장 중 최소 2개 이상이 포함되어야 한다.',
      'recommendedHashtags는 과도하게 많지 않게 5~10개 이내로 추천한다.',
    ],
  })
}

function normalizeOpenAiTextProject(
  jsonText: string,
  request: GenerateCardNewsRequest,
): { readonly ok: true; readonly value: OpenAiTextProject } | { readonly ok: false; readonly reason: string } {
  try {
    const parsed = JSON.parse(jsonText) as unknown
    if (!isRecord(parsed) || typeof parsed.projectTitle !== 'string' || !Array.isArray(parsed.slides)) {
      return { ok: false, reason: 'OpenAI text response shape is invalid' }
    }

    const projectSources = normalizeSources(parsed.sources)
    const slides = parsed.slides.slice(0, request.slideCount).flatMap((slide, index) => {
      if (!isRecord(slide)) {
        return []
      }

      return [{
        kicker: readString(slide.kicker) || request.topic,
        title: readString(slide.title) || `${request.topic} 핵심 ${index + 1}`,
        description: readString(slide.description),
        content2: readString(slide.content2),
        badge: readString(slide.badge) || String(index + 1).padStart(2, '0'),
        imagePrompt: readString(slide.imagePrompt) || `Editorial background for ${request.topic}`,
        imageSourceUrl: normalizeHttpsImageUrl(readString(slide.imageSourceUrl)),
        sources: normalizeSources(slide.sources),
      }]
    })

    if (slides.length !== request.slideCount) {
      return {
        ok: false,
        reason: `OpenAI text response must include exactly ${request.slideCount} slides`,
      }
    }

    return {
      ok: true,
      value: {
        projectTitle: parsed.projectTitle,
        slides,
        sources: projectSources,
      },
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      return { ok: false, reason: 'OpenAI text response is not JSON' }
    }

    throw error
  }
}

function applyProviderSources(
  project: OpenAiTextProject,
  providerSources: readonly GeneratedAiSource[],
  selectedNews?: GenerateCardNewsRequest['newsContext'],
): OpenAiTextProject {
  const selectedNewsSources = selectedNews == null
    ? []
    : [{
      title: selectedNews.publisher.length > 0 ? `${selectedNews.publisher}: ${selectedNews.title}` : selectedNews.title,
      url: selectedNews.url,
    }]
  const projectSources = dedupeSources([...selectedNewsSources, ...project.sources, ...providerSources])

  return {
    ...project,
    sources: projectSources,
    slides: project.slides.map((slide) => ({
      ...slide,
      sources: dedupeSources([...projectSources, ...slide.sources]),
    })),
  }
}

function readOpenAiSources(input: unknown): readonly GeneratedAiSource[] {
  if (!isRecord(input) || !Array.isArray(input.output)) {
    return []
  }

  return dedupeSources(input.output.flatMap((item) => {
    if (!isRecord(item)) {
      return []
    }

    const directSources = normalizeSources(item.sources)
    if (!isRecord(item.action)) {
      return directSources
    }

    return [
      ...directSources,
      ...normalizeSources(item.action.sources),
      ...normalizeSources(item.action.results),
    ]
  }))
}

function readGeminiSources(input: unknown): readonly GeneratedAiSource[] {
  if (!isRecord(input) || !Array.isArray(input.candidates)) {
    return []
  }

  return dedupeSources(input.candidates.flatMap((candidate) => {
    if (!isRecord(candidate) || !isRecord(candidate.groundingMetadata)) {
      return []
    }

    const chunks = candidate.groundingMetadata.groundingChunks
    if (!Array.isArray(chunks)) {
      return []
    }

    return chunks.flatMap((chunk) => {
      if (!isRecord(chunk) || !isRecord(chunk.web)) {
        return []
      }

      return normalizeSources([{
        title: chunk.web.title,
        url: chunk.web.uri,
      }])
    })
  }))
}

function normalizeSources(input: unknown): readonly GeneratedAiSource[] {
  if (!Array.isArray(input)) {
    return []
  }

  return dedupeSources(input.flatMap((source) => {
    if (!isRecord(source)) {
      return []
    }

    const url = normalizeWebUrl(readString(source.url) || readString(source.uri) || readString(source.link))
    if (url.length === 0) {
      return []
    }

    const title = readString(source.title) || readString(source.name) || url
    return [{ title, url }]
  }))
}

function dedupeSources(sources: readonly GeneratedAiSource[]): readonly GeneratedAiSource[] {
  const seen = new Set<string>()
  const result: GeneratedAiSource[] = []

  for (const source of sources) {
    if (seen.has(source.url)) {
      continue
    }

    seen.add(source.url)
    result.push(source)
  }

  return result.slice(0, 8)
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

function readBody(input: unknown) {
  if (typeof input === 'string') {
    try {
      return JSON.parse(input) as unknown
    } catch (error) {
      if (error instanceof SyntaxError) {
        return null
      }

      throw error
    }
  }

  return input
}

function readRuntimeApiKey(request: GenerateCardNewsRequest) {
  const runtimeKey = request.apiKey?.trim()
  if (runtimeKey != null && runtimeKey.length > 0) {
    return runtimeKey
  }

  const value = request.aiProvider === 'gemini'
    ? process.env.GEMINI_API_KEY
    : process.env.OPENAI_API_KEY
  return value == null || value.trim().length === 0 ? null : value
}

function readOpenAiOutputText(input: unknown) {
  if (!isRecord(input)) {
    return ''
  }

  if (typeof input.output_text === 'string') {
    return input.output_text
  }

  if (!Array.isArray(input.output)) {
    return ''
  }

  const chunks = input.output.flatMap((item) => {
    if (!isRecord(item) || !Array.isArray(item.content)) {
      return []
    }

    return item.content.flatMap((content) => {
      if (!isRecord(content)) {
        return []
      }

      return typeof content.text === 'string' ? [content.text] : []
    })
  })

  return chunks.join('\n')
}

function readFirstImageBase64(input: unknown) {
  if (!isRecord(input) || !Array.isArray(input.data)) {
    return null
  }

  const first = input.data[0]
  if (!isRecord(first)) {
    return null
  }

  return typeof first.b64_json === 'string' ? first.b64_json : null
}

function readFirstGeminiImageData(input: unknown) {
  if (!isRecord(input) || !Array.isArray(input.candidates)) {
    return null
  }

  for (const candidate of input.candidates) {
    if (!isRecord(candidate) || !isRecord(candidate.content) || !Array.isArray(candidate.content.parts)) {
      continue
    }

    for (const part of candidate.content.parts) {
      if (!isRecord(part) || !isRecord(part.inlineData)) {
        continue
      }

      const mimeType = readString(part.inlineData.mimeType)
      const data = readString(part.inlineData.data)
      if (normalizeImageContentType(mimeType) != null && data.length > 0) {
        return { mimeType, data }
      }
    }
  }

  return null
}

function readGeminiOutputText(input: unknown) {
  if (!isRecord(input) || !Array.isArray(input.candidates)) {
    return ''
  }

  const firstCandidate = input.candidates[0]
  if (!isRecord(firstCandidate) || !isRecord(firstCandidate.content) || !Array.isArray(firstCandidate.content.parts)) {
    return ''
  }

  return firstCandidate.content.parts.flatMap((part) => {
    if (!isRecord(part) || typeof part.text !== 'string') {
      return []
    }

    return [part.text]
  }).join('\n')
}

function readString(input: unknown) {
  return typeof input === 'string' ? input.trim() : ''
}

async function readProviderErrorMessage(response: Response, prefix: string, apiKey: string) {
  const statusText = typeof response.statusText === 'string' ? response.statusText.trim() : ''
  const statusLabel = statusText.length > 0 ? `${response.status} ${statusText}` : String(response.status)
  const detail = await readProviderErrorDetail(response)
  if (detail.length === 0) {
    return `${prefix} (${statusLabel})`
  }

  return `${prefix} (${statusLabel}): ${redactSecretText(detail, apiKey)}`
}

async function readProviderErrorDetail(response: Response) {
  try {
    return readProviderErrorText(await response.json())
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof TypeError) {
      return ''
    }

    throw error
  }
}

function readProviderErrorText(input: unknown) {
  if (!isRecord(input)) {
    return ''
  }

  if (isRecord(input.error)) {
    const errorMessage = readString(input.error.message)
    if (errorMessage.length > 0) {
      return errorMessage
    }
  }

  return readString(input.message)
}

function redactSecretText(value: string, apiKey: string) {
  const exactRedacted = value.split(apiKey).join('[redacted API key]')
  return exactRedacted.replace(/\b(?:sk-[A-Za-z0-9_-]{8,}|AIza[0-9A-Za-z_-]{8,})\b/g, '[redacted API key]')
}

function shouldRetryOpenAiTextWithoutWebSearch(errorMessage: string) {
  const normalized = errorMessage.toLowerCase()
  return normalized.includes('web_search') ||
    normalized.includes('web search') ||
    normalized.includes('search tool') ||
    normalized.includes('tool is not enabled')
}

function buildGenerationWarnings(slides: readonly GeneratedAiSlideWithError[]) {
  const failedImage = slides.find((slide) => slide.imageStatus === 'failed')
  if (failedImage == null) {
    return []
  }

  const imageError = failedImage.imageError?.trim()
  if (imageError == null || imageError.length === 0) {
    return ['일부 이미지를 만들지 못해 빈 이미지로 대체했어요.']
  }

  return [`일부 이미지를 만들지 못해 빈 이미지로 대체했어요. ${imageError}`]
}

function isRecord(input: unknown): input is Readonly<Record<string, unknown>> {
  return input != null && typeof input === 'object' && !Array.isArray(input)
}

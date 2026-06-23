import {
  buildFallbackAiCardNewsResponse,
  normalizeGenerateCardNewsRequest,
  type GenerateCardNewsRequest,
  type GenerateCardNewsResponse,
  type GeneratedAiSource,
  type GeneratedAiSlide,
} from '../src/lib/aiCardNews.js'

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
  '카드 문구는 한국어로 짧고 명확하게 쓰고, 이미지 프롬프트는 텍스트 없는 editorial background 중심의 영어로 작성한다.',
  '카드별 이미지가 필요하므로 웹에서 이미 공개된 관련 사진의 직접 HTTPS 이미지 URL을 imageSourceUrl에 우선 넣는다.',
  'imageSourceUrl은 jpg, jpeg, png, webp 같은 이미지 파일 URL만 사용하고, 불확실하면 빈 문자열로 둔다.',
].join('\n')
const MAX_REMOTE_IMAGE_BYTES = 4_000_000
const MAX_SOURCE_HTML_BYTES = 700_000

export default async function handler(request: ApiRequest, response: ApiResponse) {
  response.setHeader('cache-control', 'no-store')

  if (request.method !== 'POST') {
    response.status(405).json({ message: 'POST 요청만 지원합니다.' })
    return
  }

  const parsed = normalizeGenerateCardNewsRequest(readBody(request.body))
  if (!parsed.ok) {
    response.status(400).json({ message: parsed.reason })
    return
  }

  const apiKey = readRuntimeApiKey(parsed.value)
  if (apiKey == null) {
    response.status(200).json(buildFallbackAiCardNewsResponse(parsed.value))
    return
  }

  try {
    const project = await generateTextProject(parsed.value, apiKey)
    const slides = await generateSlidesWithImages(project.slides, parsed.value, apiKey)
    const body: GenerateCardNewsResponse = {
      source: 'ai',
      projectTitle: project.projectTitle,
      brandName: parsed.value.brandName,
      slides,
      sources: project.sources,
      warnings: buildGenerationWarnings(slides),
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
): Promise<OpenAiTextProject> {
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
      if (!fallbackParsed.ok) {
        throw new Error(fallbackParsed.reason)
      }

      return applyProviderSources(fallbackParsed.value, readOpenAiSources(fallbackBody))
    }

    throw new Error(errorMessage)
  }

  const body = await openAiResponse.json()
  const outputText = readOpenAiOutputText(body)
  const parsed = normalizeOpenAiTextProject(outputText, request)
  if (!parsed.ok) {
    throw new Error(parsed.reason)
  }

  return applyProviderSources(parsed.value, readOpenAiSources(body))
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
): Promise<OpenAiTextProject> {
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
  if (!parsed.ok) {
    throw new Error(parsed.reason)
  }

  return applyProviderSources(parsed.value, readGeminiSources(body))
}

async function generateSlidesWithImages(
  slides: readonly OpenAiTextSlide[],
  request: GenerateCardNewsRequest,
  apiKey: string,
): Promise<readonly GeneratedAiSlideWithError[]> {
  const generatedSlides: GeneratedAiSlideWithError[] = []
  for (const slide of slides) {
    generatedSlides.push(await resolveSlideImage(slide, request, apiKey))
  }

  return generatedSlides
}

async function resolveSlideImage(
  slide: OpenAiTextSlide,
  request: GenerateCardNewsRequest,
  apiKey: string,
): Promise<GeneratedAiSlideWithError> {
  const webImage = await fetchWebImageDataUrl(slide.imageSourceUrl)
  if (webImage != null) {
    return {
      ...slide,
      imageDataUrl: webImage,
      imageStatus: 'generated',
    }
  }

  const sourcePreviewImage = await fetchSourcePreviewImage(slide.sources)
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

async function fetchWebImageDataUrl(imageSourceUrl: string): Promise<string | null> {
  const normalizedUrl = normalizeHttpsImageUrl(imageSourceUrl)
  if (normalizedUrl.length === 0) {
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

    const imageBuffer = await imageResponse.arrayBuffer()
    if (imageBuffer.byteLength === 0 || imageBuffer.byteLength > MAX_REMOTE_IMAGE_BYTES) {
      return null
    }

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
): Promise<{ readonly imageSourceUrl: string; readonly imageDataUrl: string } | null> {
  for (const source of sources) {
    if (isLikelyImageUrl(source.url)) {
      const directImage = await fetchWebImageDataUrl(source.url)
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

    const previewImage = await fetchWebImageDataUrl(previewImageUrl)
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
    style: request.style,
    toneManner: request.toneManner ?? 'clean',
    slideCount: request.slideCount,
    brandName: request.brandName,
    accentColor: request.accentColor,
    layout: request.layout,
    schema: {
      projectTitle: 'string',
      slides: [
        {
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
      `slides length must be exactly ${request.slideCount}`,
      `toneManner must shape the copy: ${request.toneManner ?? 'clean'}`,
      'title and body must be Korean',
      'imagePrompt must be English and must not ask for text in the image',
      'imageSourceUrl should be a direct HTTPS image URL from a relevant web/news/source page whenever one is available, or an empty string if uncertain',
      'sources must list the public web articles, reports, or pages used for factual claims',
      'keep each card concise for SNS',
      'base the angle on recent news article trends when current information is available',
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
): OpenAiTextProject {
  const projectSources = dedupeSources([...project.sources, ...providerSources])

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

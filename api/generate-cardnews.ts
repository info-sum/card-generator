import {
  buildFallbackAiCardNewsResponse,
  normalizeGenerateCardNewsRequest,
  type GenerateCardNewsRequest,
  type GenerateCardNewsResponse,
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
}

type OpenAiTextProject = {
  readonly projectTitle: string
  readonly slides: readonly OpenAiTextSlide[]
}

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses'
const OPENAI_IMAGES_URL = 'https://api.openai.com/v1/images/generations'
const GEMINI_GENERATE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

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
    response.status(200).json(buildFallbackAiCardNewsResponse(parsed.value, `${parsed.value.aiProvider.toUpperCase()} API key is not configured`))
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
      warnings: slides.some((slide) => slide.imageStatus === 'failed')
        ? ['일부 이미지를 만들지 못해 빈 이미지로 대체했어요.']
        : [],
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

  const openAiResponse = await fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_TEXT_MODEL ?? 'gpt-5.5',
      input: [
        {
          role: 'system',
          content:
            '너는 한국어 SNS 카드뉴스 기획자다. 이미지 안에는 문자를 넣지 말고, 카드 문구는 JSON 필드로만 작성한다.',
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
    }),
  })

  if (!openAiResponse.ok) {
    throw new Error(`OpenAI text generation failed: ${openAiResponse.status}`)
  }

  const body = await openAiResponse.json()
  const outputText = readOpenAiOutputText(body)
  const parsed = normalizeOpenAiTextProject(outputText, request)
  if (!parsed.ok) {
    throw new Error(parsed.reason)
  }

  return parsed.value
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
                '너는 한국어 SNS 카드뉴스 기획자다. 이미지 안에는 문자를 넣지 말고, 카드 문구는 JSON 필드로만 작성한다.',
                buildTextPrompt(request),
              ].join('\n\n'),
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    }),
  })

  if (!geminiResponse.ok) {
    throw new Error(`Gemini text generation failed: ${geminiResponse.status}`)
  }

  const body = await geminiResponse.json()
  const outputText = readGeminiOutputText(body)
  const parsed = normalizeOpenAiTextProject(outputText, request)
  if (!parsed.ok) {
    throw new Error(parsed.reason)
  }

  return parsed.value
}

async function generateSlidesWithImages(
  slides: readonly OpenAiTextSlide[],
  request: GenerateCardNewsRequest,
  apiKey: string,
): Promise<readonly GeneratedAiSlide[]> {
  if (!request.generateImages) {
    return slides.map((slide) => ({
      ...slide,
      imageDataUrl: null,
      imageStatus: 'skipped',
    }))
  }

  if (request.aiProvider === 'gemini') {
    return slides.map((slide) => ({
      ...slide,
      imageDataUrl: null,
      imageStatus: 'skipped',
    }))
  }

  const generatedSlides: GeneratedAiSlide[] = []
  for (const slide of slides) {
    generatedSlides.push(await generateSlideImage(slide, request, apiKey))
  }

  return generatedSlides
}

async function generateSlideImage(
  slide: OpenAiTextSlide,
  request: GenerateCardNewsRequest,
  apiKey: string,
): Promise<GeneratedAiSlide> {
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
      throw new Error(`OpenAI image generation failed: ${openAiResponse.status}`)
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
      }
    }

    throw error
  }
}

function buildTextPrompt(request: GenerateCardNewsRequest) {
  return JSON.stringify({
    instruction: '아래 입력으로 한국어 카드뉴스 JSON을 만들어라.',
    topic: request.topic,
    style: request.style,
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
        },
      ],
    },
    rules: [
      `slides length must be exactly ${request.slideCount}`,
      'title and body must be Korean',
      'imagePrompt must be English and must not ask for text in the image',
      'keep each card concise for SNS',
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
      },
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      return { ok: false, reason: 'OpenAI text response is not JSON' }
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

function isRecord(input: unknown): input is Readonly<Record<string, unknown>> {
  return input != null && typeof input === 'object' && !Array.isArray(input)
}

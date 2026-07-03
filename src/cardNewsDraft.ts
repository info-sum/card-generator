import {
  buildCardClaudeFallbackClosing,
  buildCardClaudeFallbackLead,
} from './lib/cardClaudeGuidance.js'

export type GeneratedCardLayout = 'sequence'
export type GeneratedThemeId = 'sequence-blue' | 'custom'
export const CARD_NEWS_DRAFT_STYLE_IDS = ['informative', 'story', 'news', 'thread'] as const
export type CardNewsDraftStyle = typeof CARD_NEWS_DRAFT_STYLE_IDS[number]
export type GeneratedSlideDraft = {
  readonly id: string
  readonly dataUrl: string
  readonly name: string
  readonly source: 'local'
  readonly kicker: string
  readonly title: string
  readonly description: string
  readonly content2: string
  readonly badge: string
  readonly focusX: number
  readonly focusY: number
  readonly zoom: number
  readonly themeId: GeneratedThemeId | 'global'
  readonly cardLayout: GeneratedCardLayout
}

export type GeneratedCardNewsProject = {
  readonly brandName: string
  readonly projectBadge: string
  readonly projectTitle: string
  readonly mode: 'social'
  readonly presetId: 'social-portrait'
  readonly themeId: GeneratedThemeId
  readonly cardLayout: GeneratedCardLayout
  readonly customColor: string
  readonly slides: readonly GeneratedSlideDraft[]
}

type SlideCopy = {
  readonly kicker: string
  readonly title: string
  readonly description: string
  readonly content2?: string
  readonly badge: string
}

export type CardNewsSections = {
  readonly content1: string
  readonly content2: string
}

export type SequenceHeaderModel = {
  readonly brandName: string
  readonly logoSrc: string | null
}

export type SequenceCardVariant = 'cover' | 'detail'

export type CardNewsDraftOptions = {
  readonly accentColor?: string
  readonly brandName?: string
  readonly slideCount?: number
  readonly style?: CardNewsDraftStyle
}

const DEFAULT_TOPIC = '새로운 주제'
const DEFAULT_BRAND_NAME = 'SNS 카드뉴스 생성기'
const DEFAULT_SLIDE_COUNT = 9
const SEQUENCE_BLUE = '#1247d8'
const SEQUENCE_YELLOW = '#ffd43d'

export function generateCardNewsDraft(
  rawTopic: string,
  options: CardNewsDraftOptions = {},
): GeneratedCardNewsProject {
  const topic = normalizeTopic(rawTopic)
  const brandName = normalizeBrandName(options.brandName)
  const accentColor = normalizeAccentColor(options.accentColor)
  const themeId = accentColor === SEQUENCE_BLUE ? 'sequence-blue' : 'custom'
  const style = normalizeDraftStyle(options.style)
  const slideCount = normalizeSlideCount(options.slideCount)
  const slideCopies = buildSlideCopies(topic, style, brandName).slice(0, slideCount)

  return {
    brandName,
    projectBadge: brandName,
    projectTitle: `${topic} 카드뉴스 초안`,
    mode: 'social',
    presetId: 'social-portrait',
    themeId,
    cardLayout: 'sequence',
    customColor: accentColor,
    slides: slideCopies.map((copy, index) => createGeneratedSlide(copy, index, accentColor)),
  }
}

export function splitCardNewsSections(input: {
  readonly description: string
  readonly content2?: string
}): CardNewsSections {
  return {
    content1: input.description.trim(),
    content2: input.content2?.trim() ?? '',
  }
}

export function getManualCardNewsProjectText() {
  return {
    projectBadge: '',
    projectTitle: '',
  } as const
}

export function createSequenceHeaderModel(input: {
  readonly appIcon?: string | null
  readonly brandName: string
}): SequenceHeaderModel {
  return {
    brandName: normalizeBrandName(input.brandName),
    logoSrc: input.appIcon?.trim() ? input.appIcon : null,
  }
}

export function getSequenceCardVariant(slideIndex: number): SequenceCardVariant {
  return slideIndex === 0 ? 'cover' : 'detail'
}

function normalizeTopic(rawTopic: string) {
  const normalized = rawTopic.replace(/\s+/g, ' ').trim()
  return normalized.length > 0 ? normalized : DEFAULT_TOPIC
}

function normalizeBrandName(rawBrandName: string | undefined) {
  const normalized = rawBrandName?.replace(/\s+/g, ' ').trim() ?? ''
  return normalized.length > 0 ? normalized : DEFAULT_BRAND_NAME
}

function normalizeDraftStyle(style: CardNewsDraftStyle | undefined): CardNewsDraftStyle {
  return style != null && CARD_NEWS_DRAFT_STYLE_IDS.includes(style) ? style : 'informative'
}

function normalizeSlideCount(slideCount: number | undefined) {
  if (slideCount == null || !Number.isFinite(slideCount)) {
    return DEFAULT_SLIDE_COUNT
  }

  return Math.max(1, Math.min(DEFAULT_SLIDE_COUNT, Math.floor(slideCount)))
}

function withSubjectParticle(topic: string) {
  return `${topic}${hasFinalKoreanConsonant(topic) ? '이' : '가'}`
}

function withTopicParticle(topic: string) {
  return `${topic}${hasFinalKoreanConsonant(topic) ? '은' : '는'}`
}

function withObjectParticle(topic: string) {
  return `${topic}${hasFinalKoreanConsonant(topic) ? '을' : '를'}`
}

function hasFinalKoreanConsonant(text: string) {
  for (let index = text.length - 1; index >= 0; index -= 1) {
    const char = text[index]
    if (char == null) {
      continue
    }

    const codePoint = char.charCodeAt(0)
    if (codePoint < 0xac00 || codePoint > 0xd7a3) {
      continue
    }

    return (codePoint - 0xac00) % 28 !== 0
  }

  return false
}

function buildSlideCopies(topic: string, style: CardNewsDraftStyle, brandName: string): readonly SlideCopy[] {
  if (style === 'story') {
    return buildStorySlideCopies(topic, brandName)
  }

  if (style === 'news') {
    return buildNewsSlideCopies(topic, brandName)
  }

  if (style === 'thread') {
    return buildThreadSlideCopies(topic, brandName)
  }

  return buildInformativeSlideCopies(topic, brandName)
}

function buildCoverHookTitle(topic: string) {
  return `${topic},\n왜 지금\n봐야 할까요?`
}

function buildInformativeSlideCopies(topic: string, brandName: string): readonly SlideCopy[] {
  const topicSubject = withSubjectParticle(topic)
  const topicMarker = withTopicParticle(topic)
  const topicObject = withObjectParticle(topic)

  return [
    {
      kicker: brandName,
      title: buildCoverHookTitle(topic),
      description: `${buildCardClaudeFallbackLead(topic)}\n핵심 배경과 변화 포인트를 정리했어요.`,
      badge: '넘겨보기 ->',
    },
    {
      kicker: topic,
      title: `${topicSubject}\n다시 주목받는 이유`,
      description: `- 관심이 커지는 배경\n- 사람들이 궁금해하는 지점\n- 실제 적용 전에 확인할 조건`,
      badge: '01',
    },
    {
      kicker: 'Context',
      title: '먼저 배경을\n짧게 보면',
      description: `${topicMarker} 단순한 유행보다 시장, 생활 방식, 의사결정 기준이 함께 바뀌며 주목받고 있어요.`,
      badge: '02',
    },
    {
      kicker: 'Key Point',
      title: '핵심은\n세 가지입니다',
      description: '- 왜 필요한가\n- 누구에게 의미가 있는가\n- 지금 실행하면 무엇이 달라지는가',
      badge: '03',
    },
    {
      kicker: 'Example',
      title: '실제로는\n이렇게 이어져요',
      description: `${topicObject} 판단할 때는 큰 주장보다 작은 사례, 비교 기준, 실행 순서를 함께 보면 이해가 쉬워져요.`,
      badge: '04',
    },
    {
      kicker: 'Checklist',
      title: '확인해야 할\n질문도 있어요',
      description: '- 지금 필요한 정보인가\n- 비용보다 효과가 큰가\n- 지속적으로 관리할 수 있는가',
      badge: '05',
    },
    {
      kicker: 'Insight',
      title: '놓치기 쉬운 건\n속도보다 기준이에요',
      description: `${topicObject} 빠르게 따라가기보다, 내 상황에 맞는 판단 기준을 먼저 세우는 게 중요합니다.`,
      badge: '06',
    },
    {
      kicker: 'Takeaway',
      title: '정리하면\n이렇게 볼 수 있어요',
      description: `${buildCardClaudeFallbackClosing(topic)}\n배경, 핵심 포인트, 체크 질문을 나눠 보면 훨씬 선명하게 설명할 수 있어요.`,
      badge: 'Save',
    },
    {
      kicker: 'Next',
      title: '이제 내 사례를\n붙이면 됩니다',
      description: `생성된 ${topic} 초안에 실제 사례, 숫자, 이미지를 더하면 바로 게시용 카드뉴스로 다듬을 수 있어요.`,
      badge: 'Edit',
    },
  ] as const
}

function buildStorySlideCopies(topic: string, brandName: string): readonly SlideCopy[] {
  const topicSubject = withSubjectParticle(topic)
  const topicObject = withObjectParticle(topic)

  return [
    {
      kicker: brandName,
      title: buildCoverHookTitle(topic),
      description: `${buildCardClaudeFallbackLead(topic)}\n복잡하게 흩어진 ${topic} 이야기를 처음 보는 사람도 따라오게 정리해봅니다.`,
      badge: '넘겨보기 ->',
    },
    {
      kicker: 'Scene 01',
      title: '처음 문제는\n생각보다 작았어요',
      description: `자료는 있는데 순서가 없어서 ${topicSubject} 계속 미뤄지고 있었어요.`,
      badge: 'Story',
    },
    {
      kicker: 'Scene 02',
      title: '그래서 기준부터\n하나로 묶었어요',
      description: '- 누가 보는지\n- 무엇을 궁금해하는지\n- 끝나고 어떤 행동을 할지',
      badge: '01',
    },
    {
      kicker: 'Scene 03',
      title: '핵심 문장은\n한 줄이면 충분했어요',
      description: `${topic}의 메시지를 먼저 정하고, 나머지 카드는 그 문장을 설득하는 장면으로 나눴어요.`,
      badge: '02',
    },
    {
      kicker: 'Turning Point',
      title: '흐름이 생기자\n디자인도 쉬워졌어요',
      description: '각 카드가 해야 할 역할이 분명해지면 제목, 본문, 이미지 선택이 빨라져요.',
      badge: '03',
    },
    {
      kicker: 'Result',
      title: '읽는 사람은\n다음 장을 궁금해했어요',
      description: `정보를 한 번에 쏟기보다 ${topicObject} 장면별로 보여주면 이해 속도가 올라갑니다.`,
      badge: '04',
    },
    {
      kicker: 'Takeaway',
      title: '좋은 카드뉴스는\n작은 이야기예요',
      description: `${buildCardClaudeFallbackClosing(topic)}\n문제, 변화, 결과가 보이면 짧은 콘텐츠도 기억에 오래 남아요.`,
      badge: 'Tip',
    },
    {
      kicker: 'Next',
      title: '이제 내 사례를\n넣어볼 차례예요',
      description: `${topic} 초안에 실제 수치와 이미지를 붙이면 바로 게시용 흐름이 됩니다.`,
      badge: 'Save',
    },
    {
      kicker: 'End',
      title: '마지막 장은\n행동을 남겨요',
      description: '저장, 문의, 공유처럼 독자가 바로 할 수 있는 다음 행동을 안내해보세요.',
      badge: 'CTA',
    },
  ] as const
}

function buildNewsSlideCopies(topic: string, brandName: string): readonly SlideCopy[] {
  const topicSubject = withSubjectParticle(topic)
  const topicMarker = withTopicParticle(topic)
  const topicObject = withObjectParticle(topic)

  return [
    {
      kicker: brandName,
      title: buildCoverHookTitle(topic),
      description: `${buildCardClaudeFallbackLead(topic)}\n지금 봐야 할 변화와 핵심 포인트를 빠르게 정리했어요.`,
      badge: '넘겨보기 ->',
    },
    {
      kicker: topic,
      title: `${topicSubject}\n다시 주목받는 이유`,
      description: '- 시장의 관심 증가\n- 반복되는 질문의 변화\n- 실무 적용 사례 확대',
      badge: 'News 01',
    },
    {
      kicker: 'Background',
      title: '배경은\n세 가지로 요약돼요',
      description: `기술, 비용, 사용자 기대가 동시에 바뀌면서 ${topicObject} 더 이상 미룰 수 없게 됐어요.`,
      badge: 'News 02',
    },
    {
      kicker: 'Key Fact',
      title: '핵심은\n속도보다 신뢰예요',
      description: '빠른 실행만큼 중요한 건 결과를 설명할 수 있고, 반복해도 같은 품질을 내는 구조입니다.',
      badge: 'Fact',
    },
    {
      kicker: 'Impact',
      title: '실무에서는\n이 부분이 달라져요',
      description: `기획, 제작, 검토 과정에서 ${topic} 관련 의사결정이 더 짧고 명확해집니다.`,
      badge: 'Impact',
    },
    {
      kicker: 'Check',
      title: '도입 전에는\n이 질문을 보세요',
      description: '- 누구의 시간을 줄이는가\n- 어떤 데이터를 쓰는가\n- 실패했을 때 되돌릴 수 있는가',
      badge: 'Check',
    },
    {
      kicker: 'Insight',
      title: '결론은\n작게 시작하는 쪽이에요',
      description: `${topicMarker} 한 번에 완성하기보다 작은 실험을 반복할 때 안정적으로 쌓입니다.`,
      badge: 'Insight',
    },
    {
      kicker: 'Summary',
      title: '오늘의 정리',
      description: `${buildCardClaudeFallbackClosing(topic)}\n지금 ${topicObject} 본다면 문제, 기준, 실행 단계를 나눠 보는 것부터 시작해보세요.`,
      badge: 'Save',
    },
    {
      kicker: 'Next Issue',
      title: '다음 이슈도\n이어가볼게요',
      description: `${buildCardClaudeFallbackClosing(topic)}\n반응이 좋았던 질문을 모아 다음 카드뉴스 주제로 확장할 수 있습니다.`,
      badge: 'Next',
    },
  ] as const
}

function buildThreadSlideCopies(topic: string, brandName: string): readonly SlideCopy[] {
  const topicObject = withObjectParticle(topic)

  return [
    {
      kicker: brandName,
      title: buildCoverHookTitle(topic),
      description: `${buildCardClaudeFallbackLead(topic)}\n짧게 저장해두고 바로 따라 할 수 있는 쓰레드형 카드뉴스 초안입니다.`,
      badge: '1/8',
    },
    {
      kicker: '01',
      title: '먼저 한 문장으로\n정의하세요',
      description: `${topicObject} 왜 다루는지, 누구에게 필요한지 한 줄로 적어보세요.`,
      badge: 'Thread',
    },
    {
      kicker: '02',
      title: '독자가 막히는\n순간을 고르세요',
      description: '설명하고 싶은 것보다 독자가 실제로 궁금해하는 지점부터 시작하면 반응이 좋아져요.',
      badge: 'Thread',
    },
    {
      kicker: '03',
      title: '카드마다 역할을\n하나만 주세요',
      description: '- 문제 제기\n- 핵심 설명\n- 예시\n- 체크리스트\n- 결론',
      badge: 'Thread',
    },
    {
      kicker: '04',
      title: '본문은 짧고\n구체적으로 씁니다',
      description: `${topic} 설명은 길게 풀기보다 행동, 숫자, 비교처럼 바로 이해되는 재료가 좋아요.`,
      badge: 'Thread',
    },
    {
      kicker: '05',
      title: '중간에 저장할\n포인트를 넣으세요',
      description: '체크리스트나 요약 한 장이 있으면 독자가 콘텐츠를 다시 볼 이유가 생깁니다.',
      badge: 'Thread',
    },
    {
      kicker: '06',
      title: '마지막은\n다음 행동입니다',
      description: `${buildCardClaudeFallbackClosing(topic)}\n보고 난 뒤 무엇을 하면 좋을지 명확하게 남겨주세요.`,
      badge: 'Thread',
    },
    {
      kicker: '07',
      title: '완성 전에는\n흐름만 먼저 보세요',
      description: `${buildCardClaudeFallbackClosing(topic)}\n디자인보다 순서가 먼저입니다. 흐름이 맞으면 색과 이미지는 훨씬 쉽게 붙습니다.`,
      badge: 'Save',
    },
    {
      kicker: '08',
      title: '필요한 장만\n바로 편집하세요',
      description: '생성된 초안에서 제목, 본문, 이미지를 바꾸면 내 콘텐츠로 빠르게 전환됩니다.',
      badge: 'Edit',
    },
  ] as const
}

function createGeneratedSlide(
  copy: SlideCopy,
  index: number,
  accentColor: string,
): GeneratedSlideDraft {
  const slideNumber = String(index + 1).padStart(2, '0')

  return {
    id: `topic-draft-${slideNumber}`,
    dataUrl: createPlaceholderDataUrl(slideNumber, accentColor),
    name: `topic-draft-${slideNumber}.svg`,
    source: 'local',
    kicker: copy.kicker,
    title: copy.title,
    description: copy.description,
    content2: copy.content2 ?? copy.badge,
    badge: copy.badge,
    focusX: 50,
    focusY: 50,
    zoom: 1,
    themeId: 'global',
    cardLayout: 'sequence',
  }
}

function normalizeAccentColor(color: string | undefined) {
  if (color == null) {
    return SEQUENCE_BLUE
  }

  const normalized = color.trim().toLowerCase()

  if (/^#[0-9a-f]{6}$/.test(normalized)) {
    return normalized
  }

  return SEQUENCE_BLUE
}

function createPlaceholderDataUrl(slideNumber: string, accentColor: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><rect width="1080" height="1350" fill="${accentColor}"/><circle cx="852" cy="1076" r="118" fill="${SEQUENCE_YELLOW}" opacity="0.92"/><text x="820" y="1110" font-family="Arial, sans-serif" font-size="72" font-weight="700" fill="${accentColor}">${slideNumber}</text></svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

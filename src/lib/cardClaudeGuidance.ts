import type { CardNewsDraftStyle } from '../cardNewsDraft.js'

type CardClaudeStyleFormula = Readonly<Record<CardNewsDraftStyle, string>>

export type CardClaudeContentGuidance = {
  readonly source: 'card-claude'
  readonly structure: readonly string[]
  readonly contentArchetypes: readonly string[]
  readonly styleFormulas: CardClaudeStyleFormula
  readonly readabilityRules: readonly string[]
  readonly editorialRules: readonly string[]
  readonly copyRules: readonly string[]
  readonly naturalnessRules: readonly string[]
}

const DEFAULT_TOPIC = '새로운 주제'

const STYLE_FORMULAS = {
  informative: 'WHAT(핵심) → WHY → HOW → WHAT(요약)',
  story: 'WHY → HOW → WHAT',
  news: 'WHAT(핵심) → WHY → HOW → WHAT(요약)',
  thread: 'STEP 1 → STEP 2 → STEP 3 → CTA',
} as const satisfies CardClaudeStyleFormula

export const CARD_CLAUDE_CONTENT_GUIDANCE = {
  source: 'card-claude',
  structure: [
    '표지 1장 - 짧고 강한 훅으로 시선을 끄는 첫인상',
    '본문 2~10장 - 한 장에 하나의 핵심 메시지',
    '마무리 1장 - 요약과 다음 행동',
  ],
  contentArchetypes: [
    '나열형(리스트형)',
    '스토리텔링형',
    '집중형',
    '문답형(퀴즈형)',
    '웹툰형/오토형',
  ],
  styleFormulas: STYLE_FORMULAS,
  readabilityRules: [
    '메인 문구는 카드당 2~3줄 이내로 압축한다',
    '메인 문구는 짧더라도 배경, 변화, 의미가 보이게 쓴다',
    '본문은 한 카드에 3~5문장 이내로 쓰되 추상어만 나열하지 않고 제목의 근거와 실무적 의미를 완결한다',
    '가능하면 대상, 수치, 사례, 조건 중 하나를 넣어 구체화한다',
    '긴 문장은 왼쪽 정렬, 짧은 문구만 중앙 정렬한다',
    '모바일에서 읽히도록 짧고 명확하게 쓴다',
  ],
  editorialRules: [
    '카드별로 하나의 핵심 메시지만 전달한다',
    '마지막 카드는 요약이나 바로 적용할 시사점을 본문 안에서 완결한다',
    '디자인은 에디토리얼 무드에 맞는 절제된 톤을 유지한다',
  ],
  copyRules: [
    '카드 문구는 한국어로 짧고 명확하게 쓴다',
    '메인 문구도 한국어로 2~3줄 안에 정리한다',
    '표지 문구는 기사 헤드라인처럼 주제·핵심 이슈가 즉시 파악되게 쓰고, 질문형, 단정형, 숫자형 훅을 결합한다',
    '표지 문구는 주제 없이 궁금증만 유발하는 추상적 표현을 피하고, 독자가 무엇을 소개하는 카드뉴스인지 한눈에 알 수 있게 한다',
    '각 줄은 배경 → 변화/핵심 → 활용/영향 순서로 새 정보를 담는다',
    '카드별 흐름은 cover, body, closing으로 나눈다',
    '본문 카드마다 하나의 생각만 담되 구체적인 예시나 조건을 1개 이상 포함한다',
    '하단용 보조 문구, 짧은 CTA, 다음 장 유도 문구는 만들지 않는다',
    '카드 하단이 비어 보이면 별도 문구를 추가하지 말고 제목과 본문을 더 구체적으로 강화한다',
  ],
  naturalnessRules: [
    '사실, 수치, 날짜, 고유명사, 직접 인용, 출처의 의미는 바꾸거나 새로 만들지 않는다',
    '번역투인 "~를 통해", "~에 있어서", "~와 관련하여"를 습관적으로 쓰지 말고 문맥에 맞는 짧은 조사와 능동 표현을 우선한다',
    '"결론적으로", "시사하는 바가 크다", "주목할 만하다", "혁신적인" 같은 AI식 상투어와 과장어는 근거가 꼭 필요할 때만 쓴다',
    '문두 접속사와 "~할 수 있다", "~라고 볼 수 있다" 같은 완곡 표현을 반복하지 않는다. 확실한 사실은 짧게 단언하고, 불확실한 내용만 한 번만 완곡하게 표현한다',
    '연결어미 뒤 쉼표를 남발하지 않고, 문장 길이와 종결어미를 카드 안에서 자연스럽게 섞는다',
    '설명 문장은 해요체(-요)와 기사형 평서체(-다)를 맥락에 맞게 섞는다. 한 카드 안에서 억지로 번갈아 쓰지 말고, 딱딱한 보고서 말투만 이어지지 않게 한다',
    '기계적인 첫째·둘째·셋째, 제목 없는 궁금증 유발, 과한 CTA 대신 구체적인 주어·동사와 실제 독자 관점으로 쓴다',
  ],
} as const satisfies CardClaudeContentGuidance

export function buildCardClaudeContentPrompt(input: {
  readonly topic: string
  readonly style: CardNewsDraftStyle
  readonly slideCount: number
}): string {
  const topic = normalizeTopic(input.topic)

  return [
    'card-claude guidance for Korean card-news copy:',
    `topic: ${topic}`,
    `style formula: ${CARD_CLAUDE_CONTENT_GUIDANCE.styleFormulas[input.style]}`,
    `slide count: exactly ${input.slideCount} slides`,
    `structure: ${CARD_CLAUDE_CONTENT_GUIDANCE.structure.join(' | ')}`,
    `content archetypes: ${CARD_CLAUDE_CONTENT_GUIDANCE.contentArchetypes.join(' | ')}`,
    `copy rules: ${CARD_CLAUDE_CONTENT_GUIDANCE.copyRules.join(' | ')}`,
    `readability rules: ${CARD_CLAUDE_CONTENT_GUIDANCE.readabilityRules.join(' | ')}`,
    `editorial rules: ${CARD_CLAUDE_CONTENT_GUIDANCE.editorialRules.join(' | ')}`,
    `Korean naturalness rules: ${CARD_CLAUDE_CONTENT_GUIDANCE.naturalnessRules.join(' | ')}`,
  ].join('\n')
}

export function buildCardClaudeFallbackLead(topic: string) {
  return `${normalizeTopic(topic)}에서 지금 확인할 변화와 판단 기준을 한눈에 정리했어요.`
}

export function buildCardClaudeFallbackClosing(topic: string) {
  return `${normalizeTopic(topic)}는 핵심 변화와 적용 조건을 함께 보면 판단이 쉬워집니다.`
}

function normalizeTopic(input: string) {
  const normalized = input.replace(/\s+/g, ' ').trim()
  return normalized.length > 0 ? normalized : DEFAULT_TOPIC
}

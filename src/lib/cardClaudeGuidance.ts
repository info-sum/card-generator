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
    '본문은 한 카드에 2~3줄 이내로 압축하되 추상어만 나열하지 않는다',
    '가능하면 대상, 수치, 사례, 조건 중 하나를 넣어 구체화한다',
    '긴 문장은 왼쪽 정렬, 짧은 문구만 중앙 정렬한다',
    '모바일에서 읽히도록 짧고 명확하게 쓴다',
  ],
  editorialRules: [
    '카드별로 하나의 핵심 메시지만 전달한다',
    '마지막 카드에는 요약이나 CTA를 남긴다',
    '디자인은 에디토리얼 무드에 맞는 절제된 톤을 유지한다',
  ],
  copyRules: [
    '카드 문구는 한국어로 짧고 명확하게 쓴다',
    '메인 문구도 한국어로 2~3줄 안에 정리한다',
    '표지 문구는 질문형, 단정형, 숫자형 같은 훅으로 시작하고 설명문처럼 쓰지 않는다',
    '각 줄은 배경 → 변화/핵심 → 활용/영향 순서로 새 정보를 담는다',
    '카드별 흐름은 cover, body, closing으로 나눈다',
    '본문 카드마다 하나의 생각만 담되 구체적인 예시나 조건을 1개 이상 포함한다',
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
  ].join('\n')
}

export function buildCardClaudeFallbackLead(topic: string) {
  return `한 장만 봐도\n${normalizeTopic(topic)}의 핵심이 바로 보이게 정리해요.`
}

export function buildCardClaudeFallbackClosing(topic: string) {
  return `${normalizeTopic(topic)}의 요약과 다음 행동으로 마무리해요.`
}

function normalizeTopic(input: string) {
  const normalized = input.replace(/\s+/g, ' ').trim()
  return normalized.length > 0 ? normalized : DEFAULT_TOPIC
}

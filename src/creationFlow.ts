export type CreationMode = 'auto' | 'manual'
export type AutoWizardStepId = 1 | 2 | 3 | 4 | 5 | 6
export type TemplateLayoutId = 'sequence' | 'overlay' | 'split-light' | 'split-dark'

export type FlowStep<TStep extends number = number> = {
  readonly step: TStep
  readonly label: string
  readonly description: string
}

export type StartModeOption = {
  readonly mode: CreationMode
  readonly badge: string
  readonly title: string
  readonly description: string
}

export type TemplateOption = {
  readonly id: string
  readonly mode: CreationMode
  readonly layout: TemplateLayoutId
  readonly title: string
  readonly description: string
  readonly accent: string
}

export type EditorWorkspaceZone = {
  readonly id: 'card-list' | 'canvas' | 'design'
  readonly label: string
}

export type EditorDesignTool = {
  readonly id: 'layout' | 'color' | 'font' | 'image-size'
  readonly label: string
}

export const START_MODE_OPTIONS: readonly StartModeOption[] = [
  {
    mode: 'auto',
    badge: 'AI',
    title: '자동 생성',
    description: '주제만 입력하면 AI가 카드뉴스 초안을 자동으로 만들어드려요.',
  },
  {
    mode: 'manual',
    badge: '✎',
    title: '직접 생성',
    description: '빈 레이아웃에서 직접 내용을 입력하여 카드뉴스를 만들어보세요.',
  },
] as const

export const AUTO_CREATION_FLOW_STEPS: readonly FlowStep<AutoWizardStepId>[] = [
  { step: 1, label: '주제 입력', description: '만들고 싶은 카드뉴스의 주제를 입력하세요.' },
  { step: 2, label: '스타일 선택', description: '원하는 카드뉴스 스타일을 선택하세요.' },
  { step: 3, label: '브랜드 설정', description: '브랜드 명칭, 로고, 컬러를 적용하세요.' },
  { step: 4, label: 'AI 생성', description: 'AI가 초안을 구성하는 단계입니다.' },
  { step: 5, label: '편집', description: '카드 문구와 디자인을 자유롭게 조정하세요.' },
  { step: 6, label: '다운로드', description: '완성본을 다운로드하거나 공유하세요.' },
] as const

export const DIRECT_CREATION_FLOW_STEPS: readonly FlowStep[] = [
  { step: 1, label: '시작', description: '빈 카드나 레이아웃으로 시작하세요.' },
  { step: 2, label: '카드 추가', description: '카드를 추가하고 내용을 입력하세요.' },
  { step: 3, label: '카드 관리', description: '카드 순서와 구성을 관리하세요.' },
  { step: 4, label: '디자인 편집', description: '색상, 폰트, 레이아웃을 조정하세요.' },
  { step: 5, label: '완료 및 내보내기', description: 'PNG, PDF, 공유 옵션으로 마무리하세요.' },
] as const

export const AUTO_TEMPLATE_OPTIONS: readonly TemplateOption[] = [
  {
    id: 'auto-overlay',
    mode: 'auto',
    layout: 'overlay',
    title: '오버레이',
    description: '이미지 위에 큰 제목과 본문을 얹는 레이아웃',
    accent: '#1868db',
  },
  {
    id: 'auto-split-light',
    mode: 'auto',
    layout: 'split-light',
    title: '하단흰색',
    description: '빈 이미지 아래 흰색 영역에 텍스트를 정리하는 레이아웃',
    accent: '#0f8a8d',
  },
  {
    id: 'auto-split-dark',
    mode: 'auto',
    layout: 'split-dark',
    title: '하단검정',
    description: '빈 이미지 아래 검정 영역에 제목을 강하게 보여주는 레이아웃',
    accent: '#1c2b42',
  },
  {
    id: 'auto-sequence',
    mode: 'auto',
    layout: 'sequence',
    title: '카드뉴스',
    description: '첫 장은 강하게, 나머지는 흐름형 카드로 구성하는 레이아웃',
    accent: '#1247d8',
  },
] as const

export const DIRECT_TEMPLATE_OPTIONS: readonly TemplateOption[] = [
  {
    id: 'manual-overlay',
    mode: 'manual',
    layout: 'overlay',
    title: '오버레이',
    description: '이미지 위에 짧은 메시지를 얹는 레이아웃',
    accent: '#1868db',
  },
  {
    id: 'manual-split-light',
    mode: 'manual',
    layout: 'split-light',
    title: '하단흰색',
    description: '빈 이미지 아래 흰색 영역에 본문을 직접 입력하는 레이아웃',
    accent: '#0f8a8d',
  },
  {
    id: 'manual-split-dark',
    mode: 'manual',
    layout: 'split-dark',
    title: '하단검정',
    description: '빈 이미지 아래 검정 영역에 메시지를 직접 입력하는 레이아웃',
    accent: '#1c2b42',
  },
  {
    id: 'manual-sequence',
    mode: 'manual',
    layout: 'sequence',
    title: '카드뉴스',
    description: '카드뉴스 순서를 직접 쌓아가는 기본 레이아웃',
    accent: '#1247d8',
  },
] as const

export const MODE_SWITCH_RESET_STEP = {
  auto: 1,
  manual: 1,
} as const satisfies Record<CreationMode, number>

export const EDITOR_WORKSPACE_ZONES: readonly EditorWorkspaceZone[] = [
  { id: 'card-list', label: '카드 목록' },
  { id: 'canvas', label: '편집 캔버스' },
  { id: 'design', label: '디자인' },
] as const

export const EDITOR_DESIGN_TOOLS: readonly EditorDesignTool[] = [
  { id: 'layout', label: '레이아웃' },
  { id: 'color', label: '컬러' },
  { id: 'font', label: '폰트' },
  { id: 'image-size', label: '이미지 사이즈' },
] as const

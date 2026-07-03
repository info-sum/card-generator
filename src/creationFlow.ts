export type CreationMode = 'auto' | 'manual'
export type AutoWizardStepId = 1 | 2 | 3 | 4 | 5
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

export const AUTO_SLIDE_COUNT_OPTIONS = [4, 6, 8, 10] as const
export const DEFAULT_AUTO_SLIDE_COUNT = 4

export const START_MODE_OPTIONS: readonly StartModeOption[] = [
  {
    mode: 'auto',
    badge: 'AI',
    title: '자동 생성',
    description: '주제만 입력하면 AI가 내용을 구성하고 여러 장의 카드뉴스를 자동으로 생성해 드려요.',
  },
  {
    mode: 'manual',
    badge: '✎',
    title: '직접 작성',
    description: '직접 내용을 입력하고 디자인을 선택해 나만의 카드뉴스를 만들어 보세요.',
  },
] as const

export const AUTO_CREATION_FLOW_STEPS: readonly FlowStep<AutoWizardStepId>[] = [
  { step: 1, label: '주제 설정', description: '주제, 카드 개수, 톤앤매너를 설정합니다.' },
  { step: 2, label: '브랜드/레이아웃', description: '레이아웃, 브랜드 정보, 로고, 컬러를 설정하고 AI 생성을 시작합니다.' },
  { step: 3, label: '내용 편집', description: '카드별 상세 본문 내용을 편집합니다.' },
  { step: 4, label: '디자인 설정', description: '세부 폰트, 크기, 카드 사이즈, 크롭 비율을 조정합니다.' },
  { step: 5, label: '결과 확인', description: '카드뉴스를 완성하고 다운로드합니다.' },
] as const

export const DIRECT_CREATION_FLOW_STEPS: readonly FlowStep[] = [
  { step: 1, label: '제작 방식 선택', description: '만들고 싶은 제작 방식과 브랜드 정보를 설정합니다.' },
  { step: 2, label: '템플릿 선택', description: '레이아웃 및 대표 테마를 선택합니다.' },
  { step: 3, label: '내용 입력', description: '카드별 상세 본문 내용을 편집합니다.' },
  { step: 4, label: '디자인 설정', description: '세부 폰트, 크기, 카드 사이즈, 크롭 비율을 조정합니다.' },
  { step: 5, label: '결과 확인', description: '카드뉴스를 완성하고 다운로드합니다.' },
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

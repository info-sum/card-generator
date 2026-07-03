import { generateCardNewsDraft, type CardNewsDraftStyle, type GeneratedCardNewsProject } from '../cardNewsDraft.js'

export const AUTO_GENERATION_STAGE_DURATION_IN_FRAMES = 192
export const AUTO_GENERATION_STAGE_COUNT = 4

export type AutoGenerationStoryboardInput = {
  readonly accentColor: string
  readonly brandName: string
  readonly slideCount: number
  readonly style: CardNewsDraftStyle
  readonly topic: string
}

export type AutoGenerationStageId = 'prompt' | 'analysis' | 'draft' | 'complete'

export type AutoGenerationStage = {
  readonly focusSlideIndex: number
  readonly id: AutoGenerationStageId
  readonly label: string
  readonly summary: string
}

export type AutoGenerationStoryboard = {
  readonly durationInFrames: number
  readonly project: GeneratedCardNewsProject
  readonly stages: readonly AutoGenerationStage[]
}

export function buildAutoGenerationStoryboard(
  input: AutoGenerationStoryboardInput,
): AutoGenerationStoryboard {
  const project = generateCardNewsDraft(input.topic, {
    accentColor: input.accentColor,
    brandName: input.brandName,
    slideCount: input.slideCount,
    style: input.style,
  })
  const slideCount = project.slides.length
  const midpointIndex = Math.max(0, Math.floor((slideCount - 1) / 2))
  const finalIndex = Math.max(0, slideCount - 1)
  const lastSlide = project.slides[finalIndex]

  return {
    durationInFrames: AUTO_GENERATION_STAGE_COUNT * AUTO_GENERATION_STAGE_DURATION_IN_FRAMES,
    project,
    stages: [
      {
        focusSlideIndex: 0,
        id: 'prompt',
        label: '시작 화면',
        summary: '로컬 사이트의 자동 생성 시작 화면을 보여줘요.',
      },
      {
        focusSlideIndex: 0,
        id: 'analysis',
        label: 'API 확인',
        summary: 'API 키 설정 모달로 실제 검증 흐름을 보여줘요.',
      },
      {
        focusSlideIndex: midpointIndex,
        id: 'draft',
        label: '주제 입력',
        summary: `${input.topic}을 입력하고 카드 수와 톤을 고르는 화면이에요.`,
      },
      {
        focusSlideIndex: finalIndex,
        id: 'complete',
        label: '레이아웃 선택',
        summary: `${lastSlide?.title ?? project.projectTitle}까지 이어지는 템플릿 선택 화면이에요.`,
      },
    ] as const,
  }
}

export function getAutoGenerationStageForFrame(frame: number) {
  const stageIndex = Math.min(
    AUTO_GENERATION_STAGE_COUNT - 1,
    Math.floor(frame / AUTO_GENERATION_STAGE_DURATION_IN_FRAMES),
  )
  const stageFrame = frame - stageIndex * AUTO_GENERATION_STAGE_DURATION_IN_FRAMES

  return {
    stageFrame,
    stageIndex,
    stageProgress: stageFrame / AUTO_GENERATION_STAGE_DURATION_IN_FRAMES,
  } as const
}

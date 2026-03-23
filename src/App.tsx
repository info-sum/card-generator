import type { ChangeEvent, CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import './App.css'
import {
  isAppsInTossRuntime,
  loadDraftValue,
  optimizeLocalImage,
  saveDraftValue,
  savePngDataUrl,
  type ImportedImage,
} from './lib/appsInToss'

type OutputMode = 'social' | 'appstore'
type CardLayout = 'overlay' | 'split-light' | 'split-dark'
type ThemePresetId = keyof typeof THEME_PRESETS
type ThemeId = ThemePresetId | 'none' | 'custom'
type HelpTopicId = keyof typeof HELP_CONTENT
type PresetId =
  | 'social-square'
  | 'social-portrait'
  | 'social-story'
  | 'iphone-69'
  | 'iphone-65'
  | 'iphone-61'

type SlideDraft = ImportedImage & {
  kicker: string
  title: string
  description: string
  badge: string
  focusX: number
  focusY: number
  zoom: number
  themeId?: ThemeId | 'global'
  customColor?: string
  cardLayout?: CardLayout | 'global'
}

type ProjectDraft = {
  brandName: string
  appIcon?: string
  projectTitle: string
  mode: OutputMode
  presetId: PresetId
  themeId: ThemeId
  cardLayout?: CardLayout
  customColor?: string
  slides: SlideDraft[]
  updatedAt: string
}

type Preset = {
  id: PresetId
  label: string
  width: number
  height: number
  mode: OutputMode
}

type UsageStep = {
  id: string
  number: string
  label: string
  description: string
}

type Theme = {
  pageBackground: string
  panelBackground: string
  panelBorder: string
  text: string
  muted: string
  accent: string
  accentSoft: string
  shadow: string
  socialBackdrop: string
  socialOverlay: string
  appBackdrop: string
  glowA: string
  glowB: string
}

type DemoScenario = 'appshots'

const MAX_SLIDES = 5
const MIN_SLIDES = 3
const DRAFT_KEY = 'image-marketing-studio-draft-v1'

const THEME_PRESETS = {
  ember: {
    pageBackground:
      'linear-gradient(180deg, rgba(255, 248, 241, 0.98) 0%, rgba(255, 240, 229, 0.98) 100%)',
    panelBackground: 'rgba(255, 255, 255, 0.96)',
    panelBorder: 'rgba(184, 129, 96, 0.18)',
    text: '#241914',
    muted: 'rgba(76, 54, 42, 0.72)',
    accent: '#dd5e31',
    accentSoft: '#ffcf9a',
    shadow: '0 24px 48px rgba(130, 85, 57, 0.12)',
    socialBackdrop: 'linear-gradient(180deg, #1e1410 0%, #51301f 48%, #f1a873 100%)',
    socialOverlay: 'linear-gradient(180deg, rgba(14, 10, 8, 0.08) 0%, rgba(14, 10, 8, 0.88) 100%)',
    appBackdrop: 'linear-gradient(180deg, #fff2ea 0%, #f1b082 45%, #1b1210 100%)',
    glowA: 'rgba(255, 186, 122, 0.7)',
    glowB: 'rgba(186, 79, 39, 0.56)',
  },
  tide: {
    pageBackground:
      'linear-gradient(180deg, rgba(245, 255, 252, 0.98) 0%, rgba(232, 247, 243, 0.98) 100%)',
    panelBackground: 'rgba(255, 255, 255, 0.95)',
    panelBorder: 'rgba(84, 153, 146, 0.18)',
    text: '#103039',
    muted: 'rgba(44, 86, 92, 0.72)',
    accent: '#0f8a8d',
    accentSoft: '#9ef1d8',
    shadow: '0 24px 48px rgba(34, 92, 96, 0.12)',
    socialBackdrop: 'linear-gradient(180deg, #08232c 0%, #144753 48%, #98ead8 100%)',
    socialOverlay: 'linear-gradient(180deg, rgba(6, 24, 30, 0.1) 0%, rgba(6, 24, 30, 0.82) 100%)',
    appBackdrop: 'linear-gradient(180deg, #f0fffc 0%, #8edecf 45%, #0a222a 100%)',
    glowA: 'rgba(167, 255, 226, 0.72)',
    glowB: 'rgba(25, 147, 140, 0.5)',
  },
  graphite: {
    pageBackground:
      'linear-gradient(180deg, rgba(255, 252, 247, 0.98) 0%, rgba(243, 238, 231, 0.98) 100%)',
    panelBackground: 'rgba(255, 255, 255, 0.95)',
    panelBorder: 'rgba(134, 122, 107, 0.18)',
    text: '#1f1b19',
    muted: 'rgba(82, 75, 68, 0.72)',
    accent: '#a26d3d',
    accentSoft: '#ead1b0',
    shadow: '0 24px 48px rgba(96, 84, 71, 0.12)',
    socialBackdrop: 'linear-gradient(180deg, #1d1b1a 0%, #3f3a37 44%, #d1b694 100%)',
    socialOverlay: 'linear-gradient(180deg, rgba(18, 16, 16, 0.08) 0%, rgba(18, 16, 16, 0.85) 100%)',
    appBackdrop: 'linear-gradient(180deg, #fcf8f2 0%, #d9ccb8 44%, #151415 100%)',
    glowA: 'rgba(255, 232, 194, 0.68)',
    glowB: 'rgba(162, 109, 61, 0.46)',
  },
  sunset: {
    pageBackground: 'linear-gradient(180deg, rgba(255, 240, 245, 0.98) 0%, rgba(255, 228, 225, 0.98) 100%)',
    panelBackground: 'rgba(255, 255, 255, 0.95)',
    panelBorder: 'rgba(238, 69, 64, 0.18)',
    text: '#2d142c',
    muted: 'rgba(81, 43, 88, 0.72)',
    accent: '#ee4540',
    accentSoft: '#ffb5b5',
    shadow: '0 24px 48px rgba(238, 69, 64, 0.12)',
    socialBackdrop: 'linear-gradient(45deg, #f9ed69 0%, #f08a5d 50%, #b83b5e 100%)',
    socialOverlay: 'linear-gradient(180deg, rgba(45, 20, 44, 0.1) 0%, rgba(45, 20, 44, 0.85) 100%)',
    appBackdrop: 'linear-gradient(180deg, #ffe3e3 0%, #ffc4c4 45%, #2d142c 100%)',
    glowA: 'rgba(240, 138, 93, 0.7)',
    glowB: 'rgba(184, 59, 94, 0.5)',
  },
  midnight: {
    pageBackground: 'linear-gradient(180deg, rgba(9, 10, 15, 0.98) 0%, rgba(20, 22, 33, 0.98) 100%)',
    panelBackground: 'rgba(30, 33, 48, 0.95)',
    panelBorder: 'rgba(100, 110, 150, 0.18)',
    text: '#ffffff',
    muted: 'rgba(200, 210, 230, 0.72)',
    accent: '#5e43f3',
    accentSoft: '#9c8bf9',
    shadow: '0 24px 48px rgba(0, 0, 0, 0.4)',
    socialBackdrop: 'linear-gradient(180deg, #090a0f 0%, #1e2130 48%, #5e43f3 100%)',
    socialOverlay: 'linear-gradient(180deg, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.88) 100%)',
    appBackdrop: 'linear-gradient(180deg, #1e2130 0%, #3a3f5c 45%, #000000 100%)',
    glowA: 'rgba(94, 67, 243, 0.6)',
    glowB: 'rgba(156, 139, 249, 0.4)',
  },
  blossom: {
    pageBackground: 'linear-gradient(180deg, rgba(255, 249, 252, 0.98) 0%, rgba(255, 240, 248, 0.98) 100%)',
    panelBackground: 'rgba(255, 255, 255, 0.95)',
    panelBorder: 'rgba(214, 106, 155, 0.18)',
    text: '#3b222f',
    muted: 'rgba(110, 75, 93, 0.72)',
    accent: '#d66a9b',
    accentSoft: '#f2bdce',
    shadow: '0 24px 48px rgba(184, 91, 134, 0.12)',
    socialBackdrop: 'linear-gradient(180deg, #1f1118 0%, #4a2839 48%, #eebbcc 100%)',
    socialOverlay: 'linear-gradient(180deg, rgba(20, 10, 15, 0.08) 0%, rgba(20, 10, 15, 0.82) 100%)',
    appBackdrop: 'linear-gradient(180deg, #fff0f6 0%, #fbd0df 45%, #180911 100%)',
    glowA: 'rgba(242, 189, 206, 0.75)',
    glowB: 'rgba(214, 106, 155, 0.55)',
  },
} satisfies Record<string, Theme>

const NONE_THEME: Theme = {
  pageBackground:
    'linear-gradient(180deg, rgba(255, 248, 241, 0.98) 0%, rgba(255, 240, 229, 0.98) 100%)',
  panelBackground: 'rgba(255, 255, 255, 0.96)',
  panelBorder: 'rgba(184, 129, 96, 0.18)',
  text: '#241914',
  muted: 'rgba(76, 54, 42, 0.72)',
  accent: '#8c7169',
  accentSoft: '#e8ddd5',
  shadow: '0 24px 48px rgba(130, 85, 57, 0.12)',
  socialBackdrop: 'linear-gradient(180deg, #181311 0%, #3d322d 48%, #d8c9be 100%)',
  socialOverlay: 'linear-gradient(180deg, rgba(14, 10, 8, 0.06) 0%, rgba(14, 10, 8, 0.84) 100%)',
  appBackdrop: 'linear-gradient(180deg, #fffbf8 0%, #e9ddd5 45%, #15110f 100%)',
  glowA: 'rgba(255, 241, 231, 0.36)',
  glowB: 'rgba(107, 90, 80, 0.26)',
}

const EDITOR_THEME = THEME_PRESETS.ember

const PRESETS: Preset[] = [
  {
    id: 'social-square',
    label: 'SNS 1080 x 1080',
    width: 1080,
    height: 1080,
    mode: 'social',
  },
  {
    id: 'social-portrait',
    label: 'SNS 1080 x 1350',
    width: 1080,
    height: 1350,
    mode: 'social',
  },
  {
    id: 'social-story',
    label: 'SNS 1080 x 1920',
    width: 1080,
    height: 1920,
    mode: 'social',
  },
  {
    id: 'iphone-69',
    label: 'App Store 1320 x 2868',
    width: 1320,
    height: 2868,
    mode: 'appstore',
  },
  {
    id: 'iphone-65',
    label: 'App Store 1284 x 2778',
    width: 1284,
    height: 2778,
    mode: 'appstore',
  },
  {
    id: 'iphone-61',
    label: 'App Store 1125 x 2436',
    width: 1125,
    height: 2436,
    mode: 'appstore',
  },
]

const PHONE_MOCKUP = {
  width: 1022,
  height: 2082,
  screenLeft: (52 / 1022) * 100,
  screenTop: (46 / 2082) * 100,
  screenWidth: (918 / 1022) * 100,
  screenHeight: (1990 / 2082) * 100,
  radiusX: (126 / 918) * 100,
  radiusY: (126 / 1990) * 100,
}

const DEMO_PROJECTS: Record<DemoScenario, ProjectDraft> = {
  appshots: {
    brandName: 'SNS 카드 뉴스 생성기',
    projectTitle: '이미지 몇 장으로 SNS 카드 뉴스를 빠르게 완성하세요',
    mode: 'social',
    presetId: 'social-portrait',
    themeId: 'ember',
    customColor: '#dd5e31',
    slides: [
      {
        id: 'demo-slide-1',
        dataUrl: '/demo-slide-1.svg',
        name: 'demo-slide-1.svg',
        source: 'local',
        kicker: '업로드 시작',
        title: '이미지 3장만 넣어도 흐름이 바로 잡힙니다',
        description:
          '사진첩에서 가져오기 버튼으로 소재를 넣으면 카드형 흐름이 자동으로 시작됩니다.',
        badge: 'Upload',
        focusX: 50,
        focusY: 50,
        zoom: 1,
      },
      {
        id: 'demo-slide-2',
        dataUrl: '/demo-slide-2.svg',
        name: 'demo-slide-2.svg',
        source: 'local',
        kicker: '카피 편집',
        title: '장마다 제목과 설명을 빠르게 손볼 수 있습니다',
        description:
          '각 장의 메시지를 짧게 다듬고 순서를 바꾸면서 자연스러운 카드 흐름을 만듭니다.',
        badge: 'Edit',
        focusX: 50,
        focusY: 50,
        zoom: 1,
      },
      {
        id: 'demo-slide-3',
        dataUrl: '/demo-slide-3.svg',
        name: 'demo-slide-3.svg',
        source: 'local',
        kicker: '바로 저장',
        title: '미리보기 확인 후 PNG로 저장하면 끝입니다',
        description:
          'SNS 카드뉴스와 앱스토어 소개 이미지까지 한 번에 확인하고 저장할 수 있습니다.',
        badge: 'Export',
        focusX: 50,
        focusY: 50,
        zoom: 1,
      },
    ],
    updatedAt: '2026-03-13T06:15:00.000Z',
  },
}

const HELP_CONTENT = {
  photo: {
    title: '사진 노출 위치',
    paragraphs: [
      '업로드한 사진은 SNS 카드뉴스에서는 각 장의 전체 배경으로 노출됩니다.',
      '앱스토어 소개 이미지에서는 휴대폰 목업 안쪽 화면에 들어갑니다.',
      '장면 편집에서 해상도 비율 프레임 안으로 사진 위치와 줌을 직접 조정할 수 있습니다.',
    ],
  },
  brandName: {
    title: '서비스 이름 노출 위치',
    paragraphs: [
      '서비스 이름은 SNS 카드뉴스에서는 본문 안 브랜드명으로 들어갑니다.',
      '앱스토어 소개 이미지에서는 상단 배지 영역에 함께 노출됩니다. 추가로 등록한 앱 아이콘이 있으면 함께 표시돼요.',
    ],
  },
  appIcon: {
    title: '앱 아이콘 노출 위치',
    paragraphs: [
      '앱 아이콘은 앱스토어 소개 이미지 상단에 브랜드와 함께 표시되는 필수 식별 요소입니다.',
      '정방형 (1:1) 비율의 PNG/JPG 이미지를 권장합니다.'
    ],
  },
  projectTitle: {
    title: '메인 메시지 노출 위치',
    paragraphs: [
      '메인 메시지는 SNS 카드뉴스 하단 마무리 문장으로 들어갑니다.',
      '앱스토어 소개 이미지에서는 하단 캡션 제목으로 사용됩니다.',
    ],
  },
} as const

function getDemoScenario() {
  if (typeof window === 'undefined') {
    return null
  }

  const value = new URLSearchParams(window.location.search).get('demo')

  if (value === 'appshots') {
    return value as DemoScenario
  }

  return null
}

function App() {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const exportRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const bridgeAvailable = isAppsInTossRuntime()
  const demoScenario = getDemoScenario()

  const [brandName, setBrandName] = useState('SNS 카드 뉴스 생성기')
  const [appIcon, setAppIcon] = useState<string | null>(null)
  const [projectTitle, setProjectTitle] = useState(
    '이미지 몇 장으로 SNS 카드 뉴스를 빠르게 완성하세요',
  )
  const [mode, setMode] = useState<OutputMode>('social')
  const [presetId, setPresetId] = useState<PresetId>('social-portrait')
  const [themeId, setThemeId] = useState<ThemeId>('sunset')
  const [cardLayout, setCardLayout] = useState<CardLayout>('overlay')
  const [customColor, setCustomColor] = useState('#dd5e31')
  const [slides, setSlides] = useState<SlideDraft[]>([])
  const [activeSlideId, setActiveSlideId] = useState<string | null>(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [helpTopic, setHelpTopic] = useState<HelpTopicId | null>(null)
  const [notice, setNotice] = useState(
    '이미지 3~5장을 넣으면 SNS 카드뉴스와 스토어 소개 이미지를 빠르게 구성할 수 있어요.',
  )
  const [busyLabel, setBusyLabel] = useState('')
  const [isDraftReady, setIsDraftReady] = useState(false)

  const activePreset =
    PRESETS.find((preset) => preset.id === presetId) ?? PRESETS[1]
  const presetsForMode = PRESETS.filter((preset) => preset.mode === mode)
  const canExport = slides.length > 0 && busyLabel === ''
  const remainingSlots = Math.max(0, MAX_SLIDES - slides.length)
  const activeSlide =
    slides.find((slide) => slide.id === activeSlideId) ?? slides[0] ?? null
  const activeHelp = helpTopic == null ? null : HELP_CONTENT[helpTopic]
  const activeSlideIndex =
    activeSlide == null
      ? -1
      : slides.findIndex((slide) => slide.id === activeSlide.id)

  const resolveSlideTheme = (slide: SlideDraft): Theme => {
    const computedThemeId = slide.themeId && slide.themeId !== 'global' ? (slide.themeId as Exclude<typeof slide.themeId, 'global'>) : themeId
    const computedCustomColor = slide.customColor && computedThemeId === 'custom' ? slide.customColor : customColor
    return resolveOutputTheme(computedThemeId, computedCustomColor)
  }

  const resolveSlideLayout = (slide: SlideDraft): CardLayout => {
    return slide.cardLayout && slide.cardLayout !== 'global' ? slide.cardLayout : cardLayout
  }

  const usageSteps: UsageStep[] = [
    {
      id: 'upload-section',
      number: '01',
      label: '사진 선택',
      description: '사진첩에서 카드에 사용할 이미지를 먼저 고릅니다.',
    },
    {
      id: 'upload-section',
      number: '02',
      label: '브랜드 및 카드 정보 입력',
      description: '서비스 이름, 메인 메시지, 모드와 해상도를 설정합니다.',
    },
    {
      id: 'workspace-section',
      number: '03',
      label: '장면 편집 및 미리보기',
      description: '사진 위치와 카피를 다듬고 결과를 실시간으로 확인합니다.',
    },
    {
      id: 'save-section',
      number: '04',
      label: '결과 저장',
      description: '완성된 카드를 현재 장 또는 전체 PNG로 저장합니다.',
    },
  ]

  useEffect(() => {
    if (demoScenario != null) {
      const demoProject = DEMO_PROJECTS[demoScenario]
      setBrandName(demoProject.brandName)
      setProjectTitle(demoProject.projectTitle)
      setMode(demoProject.mode)
      setPresetId(demoProject.presetId)
      setThemeId(demoProject.themeId)
      setCardLayout(demoProject.cardLayout ?? 'overlay')
      setSlides(
        demoProject.slides.map((slide, index) =>
          normalizeSlideDraft(slide, demoProject.mode, index),
        ),
      )
      setNotice('콘솔 스크린샷용 데모 상태를 불러왔어요.')
      setIsDraftReady(true)
      return
    }

    void restoreDraft()
  }, [demoScenario])

  useEffect(() => {
    const belongsToMode = PRESETS.some(
      (preset) => preset.mode === mode && preset.id === presetId,
    )
    const nextPresets = PRESETS.filter((preset) => preset.mode === mode)

    if (belongsToMode) {
      return
    }

    setPresetId(nextPresets[0].id)
  }, [mode, presetId])

  useEffect(() => {
    if (slides.length === 0) {
      setActiveSlideId(null)
      setShowPreviewModal(false)
      return
    }

    if (slides.some((slide) => slide.id === activeSlideId)) {
      return
    }

    setActiveSlideId(slides[0].id)
  }, [slides, activeSlideId])

  useEffect(() => {
    if (isDraftReady === false || demoScenario != null) {
      return
    }

    const timer = window.setTimeout(() => {
      const payload: ProjectDraft = {
        brandName,
        appIcon: appIcon ?? undefined,
        projectTitle,
        mode,
        presetId,
        themeId,
        cardLayout,
        customColor,
        slides,
        updatedAt: new Date().toISOString(),
      }

      void saveDraftValue(DRAFT_KEY, JSON.stringify(payload)).catch((error) => {
        setNotice(
          error instanceof Error
            ? error.message
            : '초안을 저장하는 중 문제가 생겼어요.',
        )
      })
    }, 500)

    return () => {
      window.clearTimeout(timer)
    }
  }, [brandName, projectTitle, mode, presetId, themeId, cardLayout, customColor, slides, isDraftReady, demoScenario])

  useEffect(() => {
    if (helpTopic == null) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setHelpTopic(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [helpTopic])

  async function restoreDraft() {
    try {
      const rawDraft = await loadDraftValue(DRAFT_KEY)

      if (rawDraft == null) {
        setIsDraftReady(true)
        return
      }

      const parsedDraft = JSON.parse(rawDraft) as Partial<ProjectDraft>

      if (typeof parsedDraft.brandName === 'string') {
        setBrandName(parsedDraft.brandName)
      }

      if (typeof parsedDraft.appIcon === 'string') {
        setAppIcon(parsedDraft.appIcon)
      }

      if (typeof parsedDraft.projectTitle === 'string') {
        setProjectTitle(parsedDraft.projectTitle)
      }

      if (parsedDraft.mode === 'social' || parsedDraft.mode === 'appstore') {
        setMode(parsedDraft.mode)
      }

      if (
        typeof parsedDraft.presetId === 'string' &&
        PRESETS.some((preset) => preset.id === parsedDraft.presetId)
      ) {
        setPresetId(parsedDraft.presetId)
      }

      if (typeof parsedDraft.themeId === 'string') {
        if (
          parsedDraft.themeId === 'none' ||
          parsedDraft.themeId === 'custom' ||
          isThemePresetId(parsedDraft.themeId)
        ) {
          setThemeId(parsedDraft.themeId)
        }
      }

      if (
        parsedDraft.cardLayout === 'overlay' ||
        parsedDraft.cardLayout === 'split-light' ||
        parsedDraft.cardLayout === 'split-dark'
      ) {
        setCardLayout(parsedDraft.cardLayout)
      }

      if (typeof parsedDraft.customColor === 'string') {
        setCustomColor(normalizeHexColor(parsedDraft.customColor))
      }

      setNotice('이전 설정만 불러왔어요. 업로드 이미지는 빈 상태로 시작합니다.')
    } catch {
      setNotice('저장된 초안을 읽지 못했어요. 새 프로젝트로 시작합니다.')
    } finally {
      setIsDraftReady(true)
    }
  }

  async function handleLocalFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])

    if (files.length === 0) {
      return
    }

    const firstImage = files.find((file) => file.type.startsWith('image/'))
    if (firstImage != null) {
      const isIcon = (event.target as HTMLInputElement).dataset.intent === 'icon'
      if (isIcon) {
        const objUrl = URL.createObjectURL(firstImage)
        setAppIcon(objUrl)
        event.target.value = ''
        return
      }
    }

    if (slides.length >= MAX_SLIDES) {
      setNotice('이미지는 최대 5장까지 넣을 수 있어요.')
      event.target.value = ''
      return
    }

    const imageFiles = files.filter((file) => file.type.startsWith('image/'))

    if (imageFiles.length === 0) {
      setNotice('이번 버전은 이미지 업로드만 지원합니다. 영상은 다음 단계에서 붙일게요.')
      event.target.value = ''
      return
    }

    setBusyLabel('사진첩 이미지를 정리하는 중...')

    try {
      const remaining = MAX_SLIDES - slides.length
      const optimizedImages = await Promise.all(
        imageFiles.slice(0, remaining).map((file) => optimizeLocalImage(file)),
      )

      appendSlides(optimizedImages)

      if (imageFiles.length > remaining) {
        setNotice('최대 5장까지만 유지해서 나머지 이미지는 제외했어요.')
      } else {
        setNotice('사진첩 이미지를 카드 흐름에 추가했어요.')
      }
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : '이미지를 가져오는 중 오류가 발생했어요.',
      )
    } finally {
      setBusyLabel('')
      event.target.value = ''
    }
  }

  async function handleExportAll() {
    setBusyLabel('전체 슬라이드를 차례대로 저장하는 중...')

    try {
      for (const [index, slide] of slides.entries()) {
        const node = exportRefs.current[slide.id]

        if (node == null) {
          continue
        }

        // 모바일 웹킷(Safari) 특이성: 최초 렌더링 시 이미지가 하이드레이션되지 않아 비어보이는 현상을 방지하기 위해 1회 렌더링을 선행(Pre-render)합니다.
        await toPng(node, {
          cacheBust: false,
          pixelRatio: 1,
        })

        const dataUrl = await toPng(node, {
          cacheBust: false,
          pixelRatio: 1,
        })

        await savePngDataUrl(buildFileName(brandName, mode, index), dataUrl)
      }

      setNotice('모든 슬라이드 저장을 마쳤어요.')
    } catch {
      setNotice('전체 슬라이드 저장 중 문제가 생겼어요.')
    } finally {
      setBusyLabel('')
    }
  }

  function appendSlides(importedImages: ImportedImage[]) {
    setSlides((previousSlides) => {
      const remaining = MAX_SLIDES - previousSlides.length
      const nextSlides = importedImages.slice(0, remaining).map((image, index) =>
        createSlideDraft(image, mode, previousSlides.length + index),
      )

      return [...previousSlides, ...nextSlides]
    })
  }

  function openGalleryPicker() {
    if (slides.length >= MAX_SLIDES) {
      setNotice('이미지는 최대 5장까지 넣을 수 있어요.')
      return
    }

    fileInputRef.current?.click()
  }

  function jumpToSection(sectionId: string) {
    if (typeof document === 'undefined') {
      return
    }

    document.getElementById(sectionId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  function openWorkspaceTab() {
    setShowPreviewModal(true)
  }

  function updateSlideField(
    slideId: string,
    field: keyof Pick<SlideDraft, 'kicker' | 'title' | 'description' | 'badge' | 'cardLayout' | 'themeId'>,
    value: string,
  ) {
    setSlides((previousSlides) =>
      previousSlides.map((slide) =>
        slide.id === slideId
          ? {
            ...slide,
            [field]: value,
          }
          : slide,
      ),
    )
  }

  function updateSlideFraming(
    slideId: string,
    nextFraming: Partial<Pick<SlideDraft, 'focusX' | 'focusY' | 'zoom'>>,
  ) {
    setSlides((previousSlides) =>
      previousSlides.map((slide) =>
        slide.id === slideId
          ? {
            ...slide,
            focusX:
              typeof nextFraming.focusX === 'number'
                ? clamp(nextFraming.focusX, 0, 100)
                : slide.focusX,
            focusY:
              typeof nextFraming.focusY === 'number'
                ? clamp(nextFraming.focusY, 0, 100)
                : slide.focusY,
            zoom:
              typeof nextFraming.zoom === 'number'
                ? clamp(nextFraming.zoom, 1, 2.4)
                : slide.zoom,
          }
          : slide,
      ),
    )
  }

  function moveSlide(slideId: string, direction: -1 | 1) {
    setSlides((previousSlides) => {
      const currentIndex = previousSlides.findIndex((slide) => slide.id === slideId)
      const nextIndex = currentIndex + direction

      if (currentIndex < 0 || nextIndex < 0 || nextIndex >= previousSlides.length) {
        return previousSlides
      }

      const reorderedSlides = [...previousSlides]
      const [currentSlide] = reorderedSlides.splice(currentIndex, 1)
      reorderedSlides.splice(nextIndex, 0, currentSlide)
      return reorderedSlides
    })
  }

  function removeSlide(slideId: string) {
    setSlides((previousSlides) =>
      previousSlides.filter((slide) => slide.id !== slideId),
    )
  }

  const appStyle = {
    '--page-background': EDITOR_THEME.pageBackground,
    '--panel-background': EDITOR_THEME.panelBackground,
    '--panel-border': EDITOR_THEME.panelBorder,
    '--text-color': EDITOR_THEME.text,
    '--muted-color': EDITOR_THEME.muted,
    '--accent-color': EDITOR_THEME.accent,
    '--accent-soft': EDITOR_THEME.accentSoft,
    '--panel-shadow': EDITOR_THEME.shadow,
  } as CSSProperties

  return (
    <div className="app-shell" style={appStyle}>
      <input
        ref={fileInputRef}
        className="hidden-input"
        type="file"
        accept="image/*"
        multiple
        onChange={handleLocalFiles}
      />

      <header className="top-bar">
        <div className="top-brand">
          <img className="top-brand-logo" src="/logo.svg" alt="SNS 카드 뉴스 생성기 로고" />
          <div>
            <p className="top-brand-label">SNS Card News Creator</p>
            <strong>SNS 카드 뉴스 생성기</strong>
          </div>
        </div>

        <div className="runtime-pill">
          {bridgeAvailable ? 'AppsInToss 연결됨' : '브라우저 미리보기'}
        </div>
      </header>

      <main className="studio-main">
        <section className="flow-shell top-flow-shell">
          <div className="flow-shell-head">
            <span className="section-kicker">How To Use</span>
            <h2>SNS 카드 뉴스 생성방법</h2>
          </div>

          <div className="flow-step-row">
            {usageSteps.map((step) => (
              <button
                key={step.number}
                className="flow-step guide-flow-step"
                disabled={(step.id === 'workspace-section' || step.id === 'save-section') && slides.length === 0}
                onClick={() => {
                  if (step.id === 'save-section') {
                    openWorkspaceTab()
                    return
                  }

                  jumpToSection(step.id)
                }}
                type="button"
              >
                <span>{step.number}</span>
                <div className="flow-step-copy">
                  <strong>{step.label}</strong>
                  <p>{step.description}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="landing-shell" id="upload-section">
          <div className="landing-copy">
            <p className="landing-badge">스토리 흐름이 먼저 보이는 카드 제작 스튜디오</p>
            <h1>
              이미지 몇 장만으로
              <br />
              시선을 멈추게 하는 카드 뉴스를 만드세요
            </h1>

          </div>

          <div className="landing-grid">
            <section className="upload-stage-card">
              <p className="upload-stage-kicker">Start your creation</p>
              <h2>사진첩에서 장면을 고르면 카드 흐름이 바로 시작됩니다</h2>
              <p className="upload-stage-description">
                휴대폰 사진첩에서 3~5장을 선택하면 장면별 기본 카피를 자동으로
                채워 줍니다. 처음 진입하는 사용자도 어디서 시작해야 하는지 바로
                이해할 수 있게 업로드 행동을 가장 앞에 둡니다.
              </p>

              <button className="primary-stage-button" onClick={openGalleryPicker} type="button">
                사진첩에서 가져오기
              </button>

              <div className="help-row">
                <p className="help-row-title">사진 노출 위치</p>
                <button
                  className="help-icon-button"
                  onClick={() => setHelpTopic('photo')}
                  type="button"
                >
                  ?
                </button>
              </div>

              <div className="stage-metrics">
                <div className="stage-metric">
                  <span>현재 장수</span>
                  <strong>{slides.length}</strong>
                </div>
                <div className="stage-metric">
                  <span>남은 슬롯</span>
                  <strong>{remainingSlots}</strong>
                </div>
                <div className="stage-metric">
                  <span>권장 범위</span>
                  <strong>
                    {MIN_SLIDES}~{MAX_SLIDES}장
                  </strong>
                </div>
              </div>
            </section>

            <aside className="config-stack">
              <section className="config-card">
                <div className="config-card-head">
                  <span>프로젝트 기본 정보</span>
                  <strong>브랜드와 앱 아이콘, 메인 카피</strong>
                </div>

                <div className="field-grid">
                  <label className="field">
                    <div className="field-label-row">
                      <span>서비스 이름</span>
                      <button
                        className="help-icon-button"
                        onClick={() => setHelpTopic('brandName')}
                        type="button"
                      >
                        ?
                      </button>
                    </div>
                    <input
                      value={brandName}
                      onChange={(event) => setBrandName(event.target.value)}
                      placeholder="서비스 이름"
                    />
                  </label>

                  <label className="field">
                    <div className="field-label-row">
                      <span>앱 아이콘 (선택)</span>
                      <button
                        className="help-icon-button"
                        onClick={() => setHelpTopic('appIcon')}
                        type="button"
                      >
                        ?
                      </button>
                    </div>
                    <div className="flex-row">
                      {appIcon != null ? (
                        <div className="app-icon-preview">
                          <img src={appIcon} alt="Icon Preview" style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'cover' }} />
                          <button className="mini-button ghost" onClick={() => setAppIcon(null)} type="button">삭제</button>
                        </div>
                      ) : (
                        <button className="choice-card" onClick={() => {
                          if (fileInputRef.current) {
                            fileInputRef.current.dataset.intent = 'icon'
                            fileInputRef.current.click()
                          }
                        }} type="button">
                          아이콘 업로드 (1:1)
                        </button>
                      )}
                    </div>
                  </label>

                  <label className="field">
                    <div className="field-label-row">
                      <span>메인 메시지</span>
                      <button
                        className="help-icon-button"
                        onClick={() => setHelpTopic('projectTitle')}
                        type="button"
                      >
                        ?
                      </button>
                    </div>
                    <input
                      value={projectTitle}
                      onChange={(event) => setProjectTitle(event.target.value)}
                      placeholder="프로젝트 메시지"
                    />
                  </label>
                </div>
              </section>

              <section className="config-card">
                <div className="config-card-head">
                  <span>Project Mode</span>
                  <strong>출력 형식을 먼저 정하세요</strong>
                </div>

                <div className="mode-switch">
                  <button
                    className={mode === 'social' ? 'mode-chip active' : 'mode-chip'}
                    onClick={() => setMode('social')}
                    type="button"
                  >
                    SNS 카드뉴스
                  </button>
                  <button
                    className={mode === 'appstore' ? 'mode-chip active' : 'mode-chip'}
                    onClick={() => setMode('appstore')}
                    type="button"
                  >
                    앱스토어 소개 이미지
                  </button>
                </div>
              </section>

              {mode === 'social' && (
                <section className="config-card">
                  <div className="config-card-head">
                    <span>Layout</span>
                    <strong>카드 레이아웃</strong>
                  </div>

                  <div className="choice-grid">
                    <button
                      className={cardLayout === 'overlay' ? 'choice-card active' : 'choice-card'}
                      onClick={() => setCardLayout('overlay')}
                      type="button"
                    >
                      전체화면 (오버레이)
                    </button>
                    <button
                      className={cardLayout === 'split-light' ? 'choice-card active' : 'choice-card'}
                      onClick={() => setCardLayout('split-light')}
                      type="button"
                    >
                      상단 사진 + 하단 흰색
                    </button>
                    <button
                      className={cardLayout === 'split-dark' ? 'choice-card active' : 'choice-card'}
                      onClick={() => setCardLayout('split-dark')}
                      type="button"
                    >
                      상단 사진 + 하단 검정
                    </button>
                  </div>
                </section>
              )}

              <section className="config-card">
                <div className="config-card-head">
                  <span>Resolution</span>
                  <strong>출력 사이즈를 선택하세요</strong>
                </div>

                <div className="choice-grid">
                  {presetsForMode.map((preset) => (
                    <button
                      key={preset.id}
                      className={preset.id === presetId ? 'choice-card active' : 'choice-card'}
                      onClick={() => setPresetId(preset.id)}
                      type="button"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </section>

              <section className="config-card">
                <div className="config-card-head">
                  <span>Color Theme</span>
                  <strong>현재 톤과 결과물 스타일</strong>
                </div>

                <div className="choice-grid theme-grid">
                  <button
                    className={themeId === 'none' ? 'choice-card theme-choice active' : 'choice-card theme-choice'}
                    onClick={() => setThemeId('none')}
                    type="button"
                  >
                    <span className="theme-dot none" />
                    선택 안함
                  </button>

                  {Object.keys(THEME_PRESETS).map((themeKey) => (
                    <button
                      key={themeKey}
                      className={themeId === themeKey ? 'choice-card theme-choice active' : 'choice-card theme-choice'}
                      onClick={() => setThemeId(themeKey as ThemeId)}
                      type="button"
                    >
                      <span className={`theme-dot ${themeKey}`} />
                      {themeLabel(themeKey as ThemePresetId)}
                    </button>
                  ))}
                </div>

                <label className={themeId === 'custom' ? 'theme-custom-field active' : 'theme-custom-field'}>
                  <span>직접 색상 선택</span>
                  <div className="theme-custom-row">
                    <input
                      className="theme-color-input"
                      onChange={(event) => {
                        const nextColor = normalizeHexColor(event.target.value)
                        setCustomColor(nextColor)
                        setThemeId('custom')
                      }}
                      type="color"
                      value={customColor}
                    />
                    <strong>{customColor.toUpperCase()}</strong>
                  </div>
                </label>
              </section>
            </aside>
          </div>

        </section>

        {slides.length === 0 ? null : (
          <section className="workspace-shell" id="workspace-section">
            <aside className="surface-card slides-panel">
              <div className="surface-head">
                <div>
                  <span className="section-kicker">Slide Flow</span>
                  <h2>스토리 흐름</h2>
                </div>
                <p>수정할 장면을 먼저 고르고, 순서를 정리하세요.</p>
              </div>

              <div className="slide-rail">
                {slides.map((slide, index) => (
                  <article
                    key={slide.id}
                    className={
                      slide.id === activeSlide?.id
                        ? 'slide-rail-card active'
                        : 'slide-rail-card'
                    }
                  >
                    <button
                      className="slide-rail-main"
                      onClick={() => setActiveSlideId(slide.id)}
                      type="button"
                    >
                      <div className="slide-rail-thumb">
                        <img
                          src={slide.dataUrl}
                          alt={slide.name}
                          draggable={false}
                          style={getMediaPresentationStyle(slide)}
                        />
                        <span>{String(index + 1).padStart(2, '0')}</span>
                      </div>
                      <div className="slide-rail-copy">
                        <strong>{slide.title}</strong>
                        <p>{slide.kicker}</p>
                      </div>
                    </button>

                    <div className="slide-rail-actions">
                      <button
                        className="mini-button"
                        disabled={index === 0}
                        onClick={() => moveSlide(slide.id, -1)}
                        type="button"
                      >
                        위로
                      </button>
                      <button
                        className="mini-button"
                        disabled={index === slides.length - 1}
                        onClick={() => moveSlide(slide.id, 1)}
                        type="button"
                      >
                        아래로
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              {remainingSlots > 0 ? (
                <button className="add-more-card" onClick={openGalleryPicker} type="button">
                  사진을 더 추가하고 흐름을 확장하기
                  <span>남은 슬롯 {remainingSlots}장</span>
                </button>
              ) : null}
            </aside>

            <section className="surface-card workspace-stage-panel">
              <section className="tab-panel active" id="editor-section">
                <div className="surface-head">
                  <div>
                    <span className="section-kicker">Customize</span>
                    <h2>장면 편집</h2>
                  </div>
                  <p>지금 선택한 한 장만 집중해서 수정하는 구조입니다.</p>
                </div>

                {activeSlide == null ? null : (
                  <>
                    <div className="editor-stage">
                      <CropEditor
                        preset={activePreset}
                        slide={activeSlide}
                        slideIndex={activeSlideIndex}
                        totalSlides={slides.length}
                        onFramingChange={(nextFraming) => {
                          updateSlideFraming(activeSlide.id, nextFraming)
                        }}
                      />

                      <div className="editor-stage-copy">
                        <p className="section-kicker">Selected Scene</p>
                        <h3>{activeSlide.title}</h3>
                        <p>
                          현재 장면의 카피를 다듬고, 흐름에 맞게 순서와 메시지를 정리하세요.
                          왼쪽 프레임에서는 노출 영역을 직접 조정할 수 있습니다.
                        </p>
                        <div className="editor-highlight-list">
                          <span>현재 모드: {mode === 'social' ? 'SNS 카드뉴스' : '앱스토어 소개 이미지'}</span>
                          <span>현재 해상도: {activePreset.label}</span>
                          <span>줌: {activeSlide.zoom.toFixed(1)}x</span>
                        </div>
                      </div>
                    </div>

                    <div className="field-grid two-column">
                      <label className="field">
                        <span>슬라이드 개별 레이아웃</span>
                        <div className="choice-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                          <button
                            className={(!activeSlide.cardLayout || activeSlide.cardLayout === 'global') ? 'choice-card active' : 'choice-card'}
                            onClick={() => updateSlideField(activeSlide.id, 'cardLayout', 'global')}
                            type="button"
                          >
                            설정 따름
                          </button>
                          <button
                            className={activeSlide.cardLayout === 'overlay' ? 'choice-card active' : 'choice-card'}
                            onClick={() => updateSlideField(activeSlide.id, 'cardLayout', 'overlay')}
                            type="button"
                          >
                            오버레이
                          </button>
                          <button
                            className={activeSlide.cardLayout === 'split-light' ? 'choice-card active' : 'choice-card'}
                            onClick={() => updateSlideField(activeSlide.id, 'cardLayout', 'split-light')}
                            type="button"
                          >
                            하단 흰색
                          </button>
                          <button
                            className={activeSlide.cardLayout === 'split-dark' ? 'choice-card active' : 'choice-card'}
                            onClick={() => updateSlideField(activeSlide.id, 'cardLayout', 'split-dark')}
                            type="button"
                          >
                            하단 검정
                          </button>
                        </div>
                      </label>

                      <label className="field">
                        <span>상단 라벨</span>
                        <input
                          value={activeSlide.kicker}
                          onChange={(event) =>
                            updateSlideField(activeSlide.id, 'kicker', event.target.value)
                          }
                        />
                      </label>
                    </div>

                    <label className="field">
                      <span>슬라이드 개별 색상 톤</span>
                      <div className="choice-grid theme-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))' }}>
                        <button
                          className={(!activeSlide.themeId || activeSlide.themeId === 'global') ? 'choice-card theme-choice active' : 'choice-card theme-choice'}
                          onClick={() => updateSlideField(activeSlide.id, 'themeId', 'global')}
                          type="button"
                        >
                          기본 설정 따름
                        </button>
                        <button
                          className={activeSlide.themeId === 'none' ? 'choice-card theme-choice active' : 'choice-card theme-choice'}
                          onClick={() => updateSlideField(activeSlide.id, 'themeId', 'none')}
                          type="button"
                        >
                          <span className="theme-dot none" />
                          선택 안함
                        </button>
                        {Object.keys(THEME_PRESETS).map((themeKey) => (
                          <button
                            key={themeKey}
                            className={activeSlide.themeId === themeKey ? 'choice-card theme-choice active' : 'choice-card theme-choice'}
                            onClick={() => updateSlideField(activeSlide.id, 'themeId', themeKey as ThemeId)}
                            type="button"
                          >
                            <span className={`theme-dot ${themeKey}`} />
                            {themeLabel(themeKey as ThemePresetId)}
                          </button>
                        ))}
                      </div>
                    </label>

                    <div className="field-grid two-column">
                      <label className="field">
                        <span>보조 배지</span>
                        <input
                          value={activeSlide.badge}
                          onChange={(event) =>
                            updateSlideField(activeSlide.id, 'badge', event.target.value)
                          }
                        />
                      </label>
                    </div>

                    <label className="field">
                      <span>헤드라인</span>
                      <input
                        value={activeSlide.title}
                        onChange={(event) =>
                          updateSlideField(activeSlide.id, 'title', event.target.value)
                        }
                      />
                    </label>

                    <label className="field">
                      <span>설명</span>
                      <textarea
                        rows={5}
                        value={activeSlide.description}
                        onChange={(event) =>
                          updateSlideField(activeSlide.id, 'description', event.target.value)
                        }
                      />
                    </label>

                    <div className="inline-actions">
                      <button
                        className="mini-button"
                        disabled={activeSlideIndex <= 0}
                        onClick={() => moveSlide(activeSlide.id, -1)}
                        type="button"
                      >
                        위로 이동
                      </button>
                      <button
                        className="mini-button"
                        disabled={activeSlideIndex === slides.length - 1}
                        onClick={() => moveSlide(activeSlide.id, 1)}
                        type="button"
                      >
                        아래로 이동
                      </button>
                      <button
                        className="mini-button ghost"
                        onClick={() => removeSlide(activeSlide.id)}
                        type="button"
                      >
                        이 장 삭제
                      </button>
                    </div>
                  </>
                )}
              </section>
            </section>
          </section>
        )}
      </main>

      {activeSlide != null && (
        <section className="surface-card scene-preview-panel" id="scene-preview-section">
          <div className="surface-head compact">
            <div>
              <span className="section-kicker">Live Preview</span>
              <h2>현재 장면 미리보기</h2>
            </div>
            <p>편집 내용이 실시간으로 반영됩니다. 레이아웃과 컴러를 바꾸면 이곳에서 즉시 확인하세요.</p>
          </div>
          <div className="scene-preview-grid">
            <SlidePreview
              appIcon={appIcon}
              brandName={brandName}
              layout="focus"
              mode={mode}
              preset={activePreset}
              projectTitle={projectTitle}
              slide={activeSlide}
              slideIndex={activeSlideIndex}
              theme={resolveSlideTheme(activeSlide)}
              totalSlides={slides.length}
              cardLayout={resolveSlideLayout(activeSlide)}
            />
          </div>
        </section>
      )}

      {slides.length > 0 && (
        <div className="fixed-bottom-bar">
          <button className="primary-stage-button full-width" onClick={() => setShowPreviewModal(true)} type="button">
            결과보기 및 저장 (총 {slides.length}장)
          </button>
        </div>
      )}

      {showPreviewModal && (
        <div className="preview-modal-layer" onClick={() => setShowPreviewModal(false)}>
          <div className="preview-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="preview-modal-header">
              <h2>결과보기 및 저장</h2>
              <button className="help-modal-close" onClick={() => setShowPreviewModal(false)} type="button">닫기</button>
            </div>
            <div className="preview-modal-body" id="save-section">
              <div className="surface-head">
                <p>완성된 프로젝트의 전체 흐름을 확인하고 결과물을 저장합니다.</p>
              </div>

              <div className="save-card">
                <strong>저장 액션</strong>
                <p>전체 PNG로 한 번에 저장합니다.</p>
                <div className="save-actions">
                  <button
                    className="action-button secondary"
                    disabled={canExport === false}
                    onClick={handleExportAll}
                    type="button"
                  >
                    전체 PNG 저장
                  </button>
                </div>
              </div>

              <div className="gallery-panel" id="screenshot-preview">
                <div className="surface-head compact">
                  <div>
                    <span className="section-kicker">All Slides</span>
                    <h2>전체 결과 미리보기</h2>
                  </div>
                  <p>전체 장면을 한 번에 훑어보고 필요한 장을 다시 선택해 수정할 수 있습니다.</p>
                </div>

                <div className="preview-grid">
                  {slides.map((slide, index) => (
                    <button
                      key={slide.id}
                      className="preview-select"
                      onClick={() => setActiveSlideId(slide.id)}
                      type="button"
                    >
                      <SlidePreview
                        appIcon={appIcon}
                        brandName={brandName}
                        mode={mode}
                        preset={activePreset}
                        projectTitle={projectTitle}
                        slide={slide}
                        slideIndex={index}
                        theme={resolveSlideTheme(slide)}
                        totalSlides={slides.length}
                        cardLayout={resolveSlideLayout(slide)}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeHelp == null ? null : (
        <div
          className="help-modal-backdrop"
          onClick={() => setHelpTopic(null)}
          role="presentation"
        >
          <div
            aria-labelledby="help-modal-title"
            aria-modal="true"
            className="help-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="help-modal-head">
              <strong id="help-modal-title">{activeHelp.title}</strong>
              <button
                className="help-modal-close"
                onClick={() => setHelpTopic(null)}
                type="button"
              >
                닫기
              </button>
            </div>
            <div className="help-modal-body">
              {activeHelp.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {isDraftReady ? null : (
        <div className="draft-loading-veil">
          <p>불러오는 중…</p>
        </div>
      )}

      {slides.length > 0 ? (
        <div className="export-render-root" aria-hidden="true">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              ref={(node) => {
                exportRefs.current[slide.id] = node
              }}
              className="export-offscreen"
            >
              <SlideCanvas
                appIcon={appIcon}
                brandName={brandName}
                mode={mode}
                preset={activePreset}
                projectTitle={projectTitle}
                slide={slide}
                slideIndex={index}
                theme={resolveSlideTheme(slide)}
                totalSlides={slides.length}
                cardLayout={resolveSlideLayout(slide)}
              />
            </div>
          ))}
        </div>
      ) : null}

      <p className="visually-hidden" aria-live="polite">
        {busyLabel || notice}
      </p>
    </div>
  )
}


type SlidePreviewProps = {
  appIcon?: string | null
  brandName: string
  mode: OutputMode
  preset: Preset
  projectTitle: string
  slide: SlideDraft
  slideIndex: number
  theme: Theme
  totalSlides: number
  cardLayout?: CardLayout
  layout?: 'focus' | 'grid'
  onExportRef?: (node: HTMLDivElement | null) => void
}

type CropEditorProps = {
  preset: Preset
  slide: SlideDraft
  slideIndex: number
  totalSlides: number
  onFramingChange: (
    nextFraming: Partial<Pick<SlideDraft, 'focusX' | 'focusY' | 'zoom'>>,
  ) => void
}

function CropEditor({
  preset,
  slide,
  slideIndex,
  totalSlides,
  onFramingChange,
}: CropEditorProps) {
  const dragRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    focusX: number
    focusY: number
  } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const viewportStyle = getEditorViewportStyle(preset)

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      focusX: slide.focusX,
      focusY: slide.focusY,
    }
    setIsDragging(true)
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const dragState = dragRef.current

    if (dragState == null || dragState.pointerId !== event.pointerId) {
      return
    }

    event.preventDefault()

    const rect = event.currentTarget.getBoundingClientRect()
    const nextFocusX =
      dragState.focusX -
      ((event.clientX - dragState.startX) / Math.max(rect.width, 1)) *
      (100 / slide.zoom)
    const nextFocusY =
      dragState.focusY -
      ((event.clientY - dragState.startY) / Math.max(rect.height, 1)) *
      (100 / slide.zoom)

    onFramingChange({
      focusX: nextFocusX,
      focusY: nextFocusY,
    })
  }

  function endDrag() {
    dragRef.current = null
    setIsDragging(false)
  }

  return (
    <div className="crop-editor-shell">
      <div className="crop-stage">
        <div
          className={isDragging ? 'crop-viewport dragging' : 'crop-viewport'}
          style={viewportStyle}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <img
            className="crop-editor-image"
            src={slide.dataUrl}
            alt={slide.name}
            draggable={false}
            style={getMediaPresentationStyle(slide)}
          />
          <div className="crop-grid" aria-hidden="true" />
          <div className="crop-overlay">
            <span>
              {String(slideIndex + 1).padStart(2, '0')} /{' '}
              {String(totalSlides).padStart(2, '0')}
            </span>
            <strong>{preset.label}</strong>
          </div>
        </div>
      </div>

      <div className="crop-toolbar">
        <label className="zoom-field">
          <span>줌</span>
          <input
            max="2.4"
            min="1"
            onChange={(event) => {
              onFramingChange({
                zoom: Number(event.target.value),
              })
            }}
            step="0.05"
            type="range"
            value={slide.zoom}
          />
        </label>

        <button
          className="mini-button"
          onClick={() => {
            onFramingChange({
              focusX: 50,
              focusY: 50,
              zoom: 1,
            })
          }}
          type="button"
        >
          기본 위치
        </button>
      </div>
    </div>
  )
}

function SlidePreview({
  appIcon,
  brandName,
  mode,
  preset,
  projectTitle,
  slide,
  slideIndex,
  theme,
  totalSlides,
  cardLayout = 'overlay',
  layout = 'grid',
  onExportRef,
}: SlidePreviewProps) {
  const stageRef = useRef<HTMLDivElement | null>(null)
  const [stageWidth, setStageWidth] = useState(0)

  useEffect(() => {
    if (stageRef.current == null || typeof ResizeObserver === 'undefined') {
      return
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry == null) return
      setStageWidth(entry.contentRect.width)
    })

    observer.observe(stageRef.current)
    return () => observer.disconnect()
  }, [])

  const maxPreviewWidth = layout === 'focus' ? (mode === 'appstore' ? 360 : 520) : (mode === 'appstore' ? 310 : 360)
  const maxPreviewHeight = layout === 'focus' ? (mode === 'appstore' ? 640 : 560) : (mode === 'appstore' ? 540 : 420)
  const availableWidth = stageWidth > 0 ? Math.min(stageWidth, maxPreviewWidth) : 1
  const scale = Math.min(availableWidth / preset.width, maxPreviewHeight / preset.height)

  return (
    <article className="preview-card" style={{ opacity: stageWidth > 0 ? 1 : 0 }}>
      <div ref={stageRef} className="preview-stage" style={{ height: preset.height * scale, width: '100%' }}>
        <div
          className="preview-frame"
          style={{
            width: preset.width,
            height: preset.height,
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${scale})`,
            transformOrigin: 'center center',
            transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <SlideCanvas
            appIcon={appIcon}
            onCanvasRef={onExportRef}
            brandName={brandName}
            mode={mode}
            preset={preset}
            projectTitle={projectTitle}
            slide={slide}
            slideIndex={slideIndex}
            theme={theme}
            totalSlides={totalSlides}
            cardLayout={cardLayout}
          />
        </div>
      </div>
      <div className="preview-meta">
        <strong>{slide.title}</strong>
        <span>{preset.label}</span>
      </div>
    </article>
  )
}

type SlideCanvasProps = {
  appIcon?: string | null
  brandName: string
  mode: OutputMode
  preset: Preset
  projectTitle: string
  slide: SlideDraft
  slideIndex: number
  theme: Theme
  totalSlides: number
  cardLayout?: CardLayout
}

function SlideCanvas({
  appIcon,
  brandName,
  mode,
  preset,
  projectTitle,
  slide,
  slideIndex,
  theme,
  totalSlides,
  cardLayout = 'overlay',
  onCanvasRef,
}: SlideCanvasProps & {
  onCanvasRef?: (node: HTMLDivElement | null) => void
}) {
  if (mode === 'appstore') {
    return (
      <AppStoreSlide
        appIcon={appIcon}
        onCanvasRef={onCanvasRef}
        brandName={brandName}
        mode={mode}
        preset={preset}
        projectTitle={projectTitle}
        slide={slide}
        slideIndex={slideIndex}
        theme={theme}
        totalSlides={totalSlides}
      />
    )
  }

  return (
    <SocialSlide
      onCanvasRef={onCanvasRef}
      brandName={brandName}
      mode={mode}
      preset={preset}
      projectTitle={projectTitle}
      slide={slide}
      slideIndex={slideIndex}
      theme={theme}
      totalSlides={totalSlides}
      cardLayout={cardLayout}
    />
  )
}

function SocialSlide({
  brandName,
  preset,
  projectTitle,
  slide,
  slideIndex,
  theme,
  totalSlides,
  cardLayout = 'overlay',
  onCanvasRef,
}: SlideCanvasProps & { onCanvasRef?: (node: HTMLDivElement | null) => void }) {
  const labelSize = preset.width * 0.024
  const brandSize = preset.width * 0.028
  const titleSize = preset.width * 0.09
  const bodySize = preset.width * 0.029
  const footerSize = preset.width * 0.022

  return (
    <div
      ref={onCanvasRef}
      className={`slide-canvas social-slide ${cardLayout !== 'overlay' ? 'split-layout' : ''} ${cardLayout === 'split-light' ? 'split-light' : ''} ${cardLayout === 'split-dark' ? 'split-dark' : ''}`}
      style={{
        width: preset.width,
        height: preset.height,
        background: cardLayout === 'split-light' ? '#ffffff' : (cardLayout === 'split-dark' ? '#000000' : theme.socialBackdrop),
      }}
    >
      <div className="social-image-container">
        <div
          className="social-image"
          style={{
            backgroundImage: `url(${slide.dataUrl})`,
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: `${slide.focusX}% ${slide.focusY}%`,
            transform: `scale(${slide.zoom})`,
            transformOrigin: `${slide.focusX}% ${slide.focusY}%`,
          }}
        />
      </div>
      <div
        className="slide-glow glow-top"
        style={{ background: theme.glowA }}
      />
      <div
        className="slide-glow glow-bottom"
        style={{ background: theme.glowB }}
      />
      <div
        className="social-overlay"
        style={{ background: theme.socialOverlay }}
      />

      <div className="social-content">
        <div className="social-topline" style={{ fontSize: labelSize }}>
          <span>{slide.kicker}</span>
          <span>
            {String(slideIndex + 1).padStart(2, '0')} /{' '}
            {String(totalSlides).padStart(2, '0')}
          </span>
        </div>

        <div className="social-copy">
          <p className="social-brand" style={{ fontSize: brandSize }}>
            {brandName}
          </p>
          <h3 style={{ fontSize: titleSize }}>{slide.title}</h3>
          <p className="social-description" style={{ fontSize: bodySize }}>
            {slide.description}
          </p>
        </div>

        <div className="social-footer" style={{ fontSize: footerSize }}>
          <span className="social-badge" style={{ fontSize: footerSize }}>
            {slide.badge}
          </span>
          <span>{projectTitle}</span>
        </div>
      </div>
    </div>
  )
}

function AppStoreSlide({
  appIcon,
  brandName,
  preset,
  projectTitle,
  slide,
  slideIndex,
  theme,
  totalSlides,
  onCanvasRef,
}: SlideCanvasProps & { onCanvasRef?: (node: HTMLDivElement | null) => void }) {
  const labelSize = preset.width * 0.018
  const kickerSize = preset.width * 0.021
  const titleSize = preset.width * 0.086
  const bodySize = preset.width * 0.028
  const pillSize = preset.width * 0.018
  const captionTitleSize = preset.width * 0.03
  const captionBodySize = preset.width * 0.018

  return (
    <div
      ref={onCanvasRef}
      className="slide-canvas appstore-slide"
      style={{
        width: preset.width,
        height: preset.height,
        background: theme.appBackdrop,
      }}
    >
      <div className="appstore-copy">
        <p className="appstore-step" style={{ fontSize: labelSize }}>
          {String(slideIndex + 1).padStart(2, '0')} /{' '}
          {String(totalSlides).padStart(2, '0')}
        </p>
        <p className="appstore-kicker" style={{ fontSize: kickerSize }}>
          {slide.kicker}
        </p>
        <h3 style={{ fontSize: titleSize }}>{slide.title}</h3>
        <p className="appstore-description" style={{ fontSize: bodySize }}>
          {slide.description}
        </p>
        <div className="appstore-pills">
          <span style={{ fontSize: pillSize }}>{slide.badge}</span>
          {appIcon && <img src={appIcon} alt="" style={{ width: pillSize * 1.5, height: pillSize * 1.5, borderRadius: pillSize * 0.3 }} />}
          <span style={{ fontSize: pillSize }}>{brandName}</span>
        </div>
      </div>

      <div
        className="slide-glow glow-top"
        style={{ background: theme.glowA }}
      />
      <div
        className="slide-glow glow-bottom"
        style={{ background: theme.glowB }}
      />

      <div className="device-wrap">
        <PhoneMockup slide={slide} />
      </div>

      <div className="appstore-caption">
        <strong style={{ fontSize: captionTitleSize }}>{projectTitle}</strong>
        <span style={{ fontSize: captionBodySize }}>
          한 장에 한 메시지, 한 눈에 이해되는 흐름
        </span>
      </div>
    </div>
  )
}

function PhoneMockup({ slide }: { slide: SlideDraft }) {
  return (
    <div
      className="phone-mockup"
      style={{
        aspectRatio: `${PHONE_MOCKUP.width} / ${PHONE_MOCKUP.height}`,
      }}
    >
      <img
        className="phone-art"
        src="/mockup.png"
        alt=""
        draggable={false}
      />
      <div
        className="phone-screen"
        style={{
          left: `${PHONE_MOCKUP.screenLeft}%`,
          top: `${PHONE_MOCKUP.screenTop}%`,
          width: `${PHONE_MOCKUP.screenWidth}%`,
          height: `${PHONE_MOCKUP.screenHeight}%`,
          borderRadius: `${PHONE_MOCKUP.radiusX}% / ${PHONE_MOCKUP.radiusY}%`,
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundImage: `url(${slide.dataUrl})`,
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: `${slide.focusX}% ${slide.focusY}%`,
            transform: `scale(${slide.zoom})`,
            transformOrigin: `${slide.focusX}% ${slide.focusY}%`,
          }}
        />
      </div>
    </div>
  )
}

function createSlideDraft(image: ImportedImage, mode: OutputMode, index: number): SlideDraft {
  const fallbackCopy = getTemplateCopy(mode, index)

  return {
    ...image,
    kicker: fallbackCopy.kicker,
    title: fallbackCopy.title,
    description: fallbackCopy.description,
    badge: fallbackCopy.badge,
    focusX: 50,
    focusY: 50,
    zoom: 1,
  }
}

function normalizeSlideDraft(
  slide: SlideDraft,
  mode: OutputMode,
  index: number,
): SlideDraft {
  const fallbackCopy = getTemplateCopy(mode, index)

  return {
    ...slide,
    kicker: slide.kicker || fallbackCopy.kicker,
    title: slide.title || fallbackCopy.title,
    description: slide.description || fallbackCopy.description,
    badge: slide.badge || fallbackCopy.badge,
    focusX: clamp(typeof slide.focusX === 'number' ? slide.focusX : 50, 0, 100),
    focusY: clamp(typeof slide.focusY === 'number' ? slide.focusY : 50, 0, 100),
    zoom: clamp(typeof slide.zoom === 'number' ? slide.zoom : 1, 1, 2.4),
  }
}

function getEditorViewportStyle(preset: Preset): CSSProperties {
  const maxWidth = 420
  const maxHeight = 520
  const scale = Math.min(maxWidth / preset.width, maxHeight / preset.height)
  const scaledWidth = Math.round(preset.width * scale)

  return {
    width: `min(100%, ${scaledWidth}px)`,
    aspectRatio: `${preset.width} / ${preset.height}`,
  }
}

function getMediaPresentationStyle(slide: Pick<SlideDraft, 'focusX' | 'focusY' | 'zoom'>) {
  return {
    objectPosition: `${slide.focusX}% ${slide.focusY}%`,
    transform: `scale(${slide.zoom})`,
    transformOrigin: `${slide.focusX}% ${slide.focusY}%`,
  } satisfies CSSProperties
}

function getTemplateCopy(mode: OutputMode, index: number) {
  if (mode === 'appstore') {
    const copies = [
      {
        kicker: '메인 가치',
        title: '첫 화면에서 효용을 바로 전달하세요',
        description:
          '앱스토어 첫 장은 기능 나열보다 결과를 먼저 보여줘야 전환율이 올라갑니다.',
        badge: 'Hero',
      },
      {
        kicker: '차별 포인트',
        title: '한 장에 한 메시지만 남기세요',
        description:
          '핵심 문장을 짧게 자르고 시각 포인트를 한 번만 강조하면 썸네일에서도 읽힙니다.',
        badge: 'Focus',
      },
      {
        kicker: '핵심 기능',
        title: '사용 장면이 곧 기능 설명이 됩니다',
        description:
          '복잡한 기능 설명보다 실제 사용 맥락을 붙인 이미지가 훨씬 빠르게 이해됩니다.',
        badge: 'Feature',
      },
      {
        kicker: '신뢰 요소',
        title: '디자인 완성도로 서비스 톤을 만드세요',
        description:
          '폰 프레임과 배경 리듬을 맞추면 작은 앱도 정돈된 브랜드 인상을 줄 수 있습니다.',
        badge: 'Trust',
      },
      {
        kicker: '마지막 장',
        title: 'CTA 대신 다음 기대를 남기세요',
        description:
          '끝 장에서는 모든 기능을 넣지 말고 기억해야 할 한 문장만 남기는 편이 좋습니다.',
        badge: 'Closing',
      },
    ]

    return copies[index] ?? copies[copies.length - 1]
  }

  const copies = [
    {
      kicker: '문제 제기',
      title: '처음 한 장에서 맥락을 열어 주세요',
      description:
        'SNS 카드뉴스는 첫 장의 훅이 중요합니다. 문제나 기대 효과를 한 문장으로 먼저 던지세요.',
      badge: 'Hook',
    },
    {
      kicker: '핵심 메시지',
      title: '메시지는 짧을수록 더 오래 남습니다',
      description:
        '이미지와 카피를 동시에 밀어붙일 때는 긴 설명보다 강한 단문이 훨씬 잘 읽힙니다.',
      badge: 'Message',
    },
    {
      kicker: '전개',
      title: '중간 장에서는 사례와 장점을 붙여 주세요',
      description:
        '둘째와 셋째 장은 논리를 설명하는 구간입니다. 이미지 순서와 카피 리듬을 함께 맞추세요.',
      badge: 'Flow',
    },
    {
      kicker: '사용 장면',
      title: '실제 맥락이 보이면 공감 속도가 빨라집니다',
      description:
        '보는 사람이 자기 상황으로 바꿔 읽을 수 있게, 장면 중심 카피를 넣는 편이 좋습니다.',
      badge: 'Scene',
    },
    {
      kicker: '마무리',
      title: '마지막 장은 행동보다 기억을 남겨 주세요',
      description:
        '과한 CTA보다 브랜드 문장 하나가 더 오래 남을 때가 많습니다. 끝 장은 여백이 중요합니다.',
      badge: 'Closing',
    },
  ]

  return copies[index] ?? copies[copies.length - 1]
}

function isThemePresetId(value: string): value is ThemePresetId {
  return value in THEME_PRESETS
}

function normalizeHexColor(value: string) {
  const matched = value.trim().match(/^#?([0-9a-fA-F]{6})$/)

  if (matched == null) {
    return '#dd5e31'
  }

  return `#${matched[1].toLowerCase()}`
}

function resolveOutputTheme(themeId: ThemeId, customColor: string): Theme {
  if (themeId === 'none') {
    return NONE_THEME
  }

  if (themeId === 'custom') {
    return createCustomTheme(customColor)
  }

  return THEME_PRESETS[themeId]
}

function createCustomTheme(color: string): Theme {
  const baseColor = normalizeHexColor(color)
  const lightTone = mixHexColor(baseColor, '#ffffff', 0.74)
  const softTone = mixHexColor(baseColor, '#ffffff', 0.46)
  const deepTone = mixHexColor(baseColor, '#120d0b', 0.78)
  const deeperTone = mixHexColor(baseColor, '#120d0b', 0.58)
  const glowTone = mixHexColor(baseColor, '#000000', 0.24)

  return {
    pageBackground: `linear-gradient(180deg, ${toRgba(lightTone, 0.98)} 0%, ${toRgba(
      softTone,
      0.98,
    )} 100%)`,
    panelBackground: 'rgba(255, 255, 255, 0.96)',
    panelBorder: toRgba(baseColor, 0.18),
    text: '#241914',
    muted: 'rgba(76, 54, 42, 0.72)',
    accent: baseColor,
    accentSoft: lightTone,
    shadow: `0 24px 48px ${toRgba(glowTone, 0.12)}`,
    socialBackdrop: `linear-gradient(180deg, ${deepTone} 0%, ${deeperTone} 48%, ${softTone} 100%)`,
    socialOverlay: 'linear-gradient(180deg, rgba(14, 10, 8, 0.08) 0%, rgba(14, 10, 8, 0.88) 100%)',
    appBackdrop: `linear-gradient(180deg, ${lightTone} 0%, ${softTone} 45%, ${deepTone} 100%)`,
    glowA: toRgba(softTone, 0.68),
    glowB: toRgba(glowTone, 0.5),
  }
}

function mixHexColor(source: string, target: string, weight: number) {
  const base = hexToRgb(source)
  const mix = hexToRgb(target)
  const ratio = clamp(weight, 0, 1)

  return rgbToHex({
    r: Math.round(base.r + (mix.r - base.r) * ratio),
    g: Math.round(base.g + (mix.g - base.g) * ratio),
    b: Math.round(base.b + (mix.b - base.b) * ratio),
  })
}

function toRgba(hex: string, alpha: number) {
  const rgb = hexToRgb(hex)

  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${clamp(alpha, 0, 1)})`
}

function hexToRgb(hex: string) {
  const normalized = normalizeHexColor(hex).slice(1)

  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  }
}

function rgbToHex(rgb: { r: number; g: number; b: number }) {
  return `#${[rgb.r, rgb.g, rgb.b]
    .map((value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, '0'))
    .join('')}`
}

function themeLabel(themeId: ThemePresetId) {
  switch (themeId) {
    case 'ember':
      return 'Ember'
    case 'tide':
      return 'Tide'
    case 'graphite':
      return 'Graphite'
    case 'sunset':
      return 'Sunset'
    case 'midnight':
      return 'Midnight'
    case 'blossom':
      return 'Blossom'
  }
}

function buildFileName(brandName: string, mode: OutputMode, index: number) {
  const slug = brandName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  const safeBrand = slug.length > 0 ? slug : 'sns-card-news-generator'
  const safeMode = mode === 'appstore' ? 'app-store' : 'social'

  return `${safeBrand}-${safeMode}-${String(index + 1).padStart(2, '0')}.png`
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export default App

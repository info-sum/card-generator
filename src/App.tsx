import type { ChangeEvent, CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import './App.css'
import {
  createSequenceHeaderModel,
  generateCardNewsDraft,
  getManualCardNewsProjectText,
  getSequenceCardVariant,
  splitCardNewsSections,
  type CardNewsDraftStyle,
} from './cardNewsDraft'
import {
  AUTO_CREATION_FLOW_STEPS,
  AUTO_TEMPLATE_OPTIONS,
  DIRECT_CREATION_FLOW_STEPS,
  DIRECT_TEMPLATE_OPTIONS,
  EDITOR_DESIGN_TOOLS,
  EDITOR_WORKSPACE_ZONES,
  MODE_SWITCH_RESET_STEP,
  START_MODE_OPTIONS,
  type AutoWizardStepId,
  type CreationMode,
  type TemplateLayoutId,
} from './creationFlow'
import {
  isAppsInTossRuntime,
  loadDraftValue,
  optimizeLocalImage,
  saveDraftValue,
  savePngDataUrl,
  type ImportedImage,
} from './lib/appsInToss'
import { isIntegratedAdSupported, loadFullScreenAdOnce, showFullScreenAdOnce } from './lib/integratedAd'

type OutputMode = 'social' | 'appstore'
type CardLayout = 'overlay' | 'split-light' | 'split-dark' | 'sequence'
type ThemePresetId = keyof typeof THEME_PRESETS
type ThemeId = ThemePresetId | 'none' | 'custom'
type HelpTopicId = keyof typeof HELP_CONTENT
type FontPresetId = 'pretendard' | 'display' | 'serif'
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
  content2?: string
  badge: string
  focusX: number
  focusY: number
  zoom: number
  themeId?: ThemeId | 'global'
  customColor?: string
  cardLayout?: CardLayout | 'global'
  fontPreset?: FontPresetId
  fontScale?: number
}

type ProjectDraft = {
  brandName: string
  appIcon?: string
  projectBadge?: string
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

type AppStoreFrame = 'phone' | 'preview'
type SelectedCreationMode = CreationMode | null
type ManualSectionStep = 1 | 2

const MAX_SLIDES = 20 // 5 -> 20으로 한도 대폭 확장
const DRAFT_KEY = 'image-marketing-studio-draft-v1'

const draftStyleOptions: readonly {
  id: CardNewsDraftStyle
  label: string
  description: string
}[] = [
  { id: 'informative', label: '정보형', description: '핵심을 빠르게 정리하는 실용형 카드뉴스' },
  { id: 'story', label: '스토리형', description: '문제에서 변화까지 장면으로 이어지는 흐름' },
  { id: 'news', label: '뉴스형', description: '이슈, 배경, 인사이트를 뉴스처럼 요약' },
  { id: 'thread', label: '쓰레드형', description: '저장하고 넘겨보기 좋은 짧은 연속 포스트' },
]

const topicExamples = ['AI 마케팅', '자동화', '부동산 투자', '브랜드 전략', '여름 꿀팁']

const fontPresetOptions: readonly {
  readonly id: FontPresetId
  readonly label: string
  readonly family: string
}[] = [
  { id: 'pretendard', label: 'Pretendard', family: "'Pretendard', 'Apple SD Gothic Neo', sans-serif" },
  { id: 'display', label: 'Display', family: "'Plus Jakarta Sans', 'Manrope', 'Apple SD Gothic Neo', sans-serif" },
  { id: 'serif', label: 'Serif', family: "'Georgia', 'Apple SD Gothic Neo', serif" },
] as const

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
  'sequence-blue': {
    pageBackground:
      'linear-gradient(180deg, rgba(239, 245, 255, 0.98) 0%, rgba(221, 232, 255, 0.98) 100%)',
    panelBackground: 'rgba(255, 255, 255, 0.95)',
    panelBorder: 'rgba(18, 71, 216, 0.18)',
    text: '#101828',
    muted: 'rgba(52, 64, 84, 0.72)',
    accent: '#1247d8',
    accentSoft: '#ffd43d',
    shadow: '0 24px 48px rgba(18, 71, 216, 0.12)',
    socialBackdrop: 'linear-gradient(180deg, #0844d8 0%, #1247d8 58%, #2458e8 100%)',
    socialOverlay: 'linear-gradient(180deg, rgba(8, 68, 216, 0) 0%, rgba(8, 68, 216, 0) 100%)',
    appBackdrop: 'linear-gradient(180deg, #eff5ff 0%, #9fbaff 45%, #103ab3 100%)',
    glowA: 'rgba(255, 212, 61, 0.58)',
    glowB: 'rgba(18, 71, 216, 0.42)',
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
        kicker: 'Kicker 입력',
        title: '첫 장의 타이틀을 입력하세요',
        description:
          '이미지를 업로드하고 이곳에 상세한 설명을 작성합니다.',
        badge: 'Start',
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
        title: '핵심 메시지를 이곳에 적으세요',
        description:
          '문구를 짧게 다듬고 순서를 바꾸면서 흐름을 구성합니다.',
        badge: 'Scene',
        focusX: 50,
        focusY: 50,
        zoom: 1,
      },
      {
        id: 'demo-slide-3',
        dataUrl: '/demo-slide-3.svg',
        name: 'demo-slide-3.svg',
        source: 'local',
        kicker: '결과 확인',
        title: '미리보기 후 저장하면 끝입니다',
        description:
          '전체 구성을 확인하고 결과물을 이미지로 저장하세요.',
        badge: 'End',
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
      '업로드한 사진은 SNS 카드 뉴스에서는 각 장의 전체 배경으로 노출됩니다.',
      '앱스토어 소개 이미지에서는 휴대폰 목업 안쪽 화면에 들어갑니다.',
      '장면 편집에서 해상도 비율 프레임 안으로 사진 위치와 줌을 직접 조정할 수 있습니다.',
    ],
  },
  brandName: {
    title: '서비스 이름 노출 위치',
    paragraphs: [
      '서비스 이름은 SNS 카드 뉴스에서는 본문 안 브랜드명으로 들어갑니다.',
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
      '메인 메시지는 SNS 카드 뉴스 하단 마무리 문장으로 들어갑니다.',
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
  const [projectBadge, setProjectBadge] = useState('PRODUCT')
  const [projectTitle, setProjectTitle] = useState(
    'SNS 카드 뉴스 생성기',
  )
  const [creationMode, setCreationMode] = useState<SelectedCreationMode>(null)
  const [autoStep, setAutoStep] = useState<AutoWizardStepId>(1)
  const [manualStep, setManualStep] = useState<ManualSectionStep>(1)
  const [topicSeed, setTopicSeed] = useState('')
  const [topicAccentColor, setTopicAccentColor] = useState('#1247d8')
  const [draftStyle, setDraftStyle] = useState<CardNewsDraftStyle>('informative')
  const [selectedAutoTemplateId, setSelectedAutoTemplateId] = useState(AUTO_TEMPLATE_OPTIONS[0].id)
  const [selectedDirectTemplateId, setSelectedDirectTemplateId] = useState(DIRECT_TEMPLATE_OPTIONS[0].id)
  const [directTemplateAccentColor, setDirectTemplateAccentColor] = useState(DIRECT_TEMPLATE_OPTIONS[0].accent)
  const [mode, setMode] = useState<OutputMode>('social')
  const [presetId, setPresetId] = useState<PresetId>('social-portrait')
  const [themeId, setThemeId] = useState<ThemeId>('sunset')
  const [cardLayout, setCardLayout] = useState<CardLayout>('overlay')
  const [customColor, setCustomColor] = useState('#dd5e31')
  const [slides, setSlides] = useState<SlideDraft[]>([])
  const [manualSlideIds, setManualSlideIds] = useState<string[]>([])
  const [appStoreFrame, setAppStoreFrame] = useState<AppStoreFrame>('preview')
  const [activeSlideId, setActiveSlideId] = useState<string | null>(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [helpTopic, setHelpTopic] = useState<HelpTopicId | null>(null)
  const [notice, setNotice] = useState(
    '이미지 최대 20장을 넣으면 SNS 카드 뉴스와 스토어 소개 이미지를 빠르게 구성할 수 있어요.',
  )
  const [busyLabel, setBusyLabel] = useState('')
  const [isDraftReady, setIsDraftReady] = useState(false)

  const interstitialAdGroupId = import.meta.env.VITE_TOSS_AD_INTERSTITIAL_GROUP_ID as
    | string
    | undefined
  const rewardedAdGroupId = import.meta.env.VITE_TOSS_AD_REWARDED_GROUP_ID as
    | string
    | undefined

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
  const canAdvanceTopic = topicSeed.trim().length > 0
  const selectedDraftStyle =
    draftStyleOptions.find((styleOption) => styleOption.id === draftStyle) ?? draftStyleOptions[0]
  const selectedAutoTemplate =
    AUTO_TEMPLATE_OPTIONS.find((template) => template.id === selectedAutoTemplateId) ?? AUTO_TEMPLATE_OPTIONS[0]
  const selectedDirectTemplate =
    DIRECT_TEMPLATE_OPTIONS.find((template) => template.id === selectedDirectTemplateId) ?? DIRECT_TEMPLATE_OPTIONS[0]
  const generatedCardNumbers = Array.from({ length: Math.min(slides.length, 8) }, (_, index) => index + 1)
  const manualSlides = slides.filter((slide) => manualSlideIds.includes(slide.id))

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
        projectBadge,
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
  }, [brandName, appIcon, projectBadge, projectTitle, mode, presetId, themeId, cardLayout, customColor, slides, isDraftReady, demoScenario])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    if (creationMode == null) {
      window.scrollTo({ left: 0, top: 0, behavior: 'auto' })
    }
  }, [creationMode])

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
        setBrandName(normalizeRestoredBrandText(parsedDraft.brandName))
      }

      if (typeof parsedDraft.appIcon === 'string') {
        setAppIcon(parsedDraft.appIcon)
      }

      if (typeof parsedDraft.projectBadge === 'string') {
        setProjectBadge(normalizeRestoredBrandText(parsedDraft.projectBadge))
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
        parsedDraft.cardLayout === 'split-dark' ||
        parsedDraft.cardLayout === 'sequence'
      ) {
        setCardLayout(parsedDraft.cardLayout)
      }

      if (typeof parsedDraft.customColor === 'string') {
        setCustomColor(normalizeHexColor(parsedDraft.customColor))
      }

      if (Array.isArray(parsedDraft.slides)) {
        const restorableSlides = parsedDraft.slides.filter(isRestorableGeneratedSlide)

        if (restorableSlides.length > 0) {
          const normalizedSlides = restorableSlides
            .slice(0, MAX_SLIDES)
            .map((slide, index) => normalizeSlideDraft(slide, parsedDraft.mode ?? 'social', index))

          setSlides(normalizedSlides)
          setActiveSlideId(normalizedSlides[0]?.id ?? null)
          setNotice('이전 주제 카드뉴스 초안을 다시 불러왔어요.')
          return
        }
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
      const intent = event.target.dataset.intent
      if (intent === 'replace-slide') {
        const slideId = event.target.dataset.slideId
        const optimizedImage = await optimizeLocalImage(firstImage)

        if (slideId != null) {
          replaceSlideImage(slideId, optimizedImage)
        }

        event.target.dataset.intent = ''
        event.target.dataset.slideId = ''
        event.target.value = ''
        return
      }

      if (intent === 'icon') {
        const objUrl = URL.createObjectURL(firstImage)
        setAppIcon(objUrl)
        event.target.dataset.intent = ''
        event.target.value = ''
        return
      }

    }

    if (slides.length >= MAX_SLIDES) {
      setNotice('이미지는 최대 20장까지 넣을 수 있어요.')
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
        setNotice('최대 20장까지만 유지해서 나머지 이미지는 제외했어요.')
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

  async function maybeShowFullScreenAd(adGroupId: string) {
    if (!adGroupId) return { earnedReward: null as null | { unitType: string; unitAmount: number } }
    if (!isAppsInTossRuntime()) return { earnedReward: null as null | { unitType: string; unitAmount: number } }
    if (!isIntegratedAdSupported()) return { earnedReward: null as null | { unitType: string; unitAmount: number } }

    await loadFullScreenAdOnce(adGroupId)
    return await showFullScreenAdOnce(adGroupId)
  }

  async function handleExportWithInterstitial() {
    if (!interstitialAdGroupId) {
      await handleExportAll()
      return
    }

    setBusyLabel('전면형 광고를 준비하는 중...')

    try {
      setBusyLabel('전면형 광고를 표시하는 중...')
      await maybeShowFullScreenAd(interstitialAdGroupId)
    } catch {
      // If ad fails, do not block export.
    } finally {
      setBusyLabel('')
    }

    await handleExportAll()
  }

  async function handleExportWithRewarded() {
    if (!rewardedAdGroupId) {
      await handleExportAll()
      return
    }

    setBusyLabel('보상형 광고를 준비하는 중...')

    try {
      setBusyLabel('보상형 광고를 표시하는 중...')
      const result = await maybeShowFullScreenAd(rewardedAdGroupId)
      if (!result.earnedReward) {
        setNotice('보상형 광고 보상을 받지 못했어요. 저장은 그대로 진행합니다.')
      }
    } catch {
      // If ad fails, do not block export.
    } finally {
      setBusyLabel('')
    }

    await handleExportAll()
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

  function createTopicDraft() {
    const normalizedAccentColor = normalizeHexColor(topicAccentColor)
    const draft = generateCardNewsDraft(topicSeed, {
      accentColor: normalizedAccentColor,
      brandName,
      slideCount: 8,
      style: draftStyle,
    })
    const nextSlides = draft.slides.map((slide) => ({
      ...slide,
      cardLayout: selectedAutoTemplate.layout,
      customColor: normalizedAccentColor,
      themeId: 'custom' as const,
    }))

    setBrandName(draft.brandName)
    setProjectBadge(draft.projectBadge)
    setProjectTitle(draft.projectTitle)
    setMode(draft.mode)
    setPresetId(draft.presetId)
    setThemeId('custom')
    setCardLayout(selectedAutoTemplate.layout)
    setCustomColor(normalizedAccentColor)
    setSlides(nextSlides)
    setActiveSlideId(nextSlides[0]?.id ?? null)
    setAutoStep(5)
    setNotice('AI 생성이 완료됐어요. 카드 8장을 확인한 뒤 편집하거나 다운로드할 수 있습니다.')
    setIsDraftReady(true)
  }

  function moveAutoStep(nextStep: AutoWizardStepId) {
    if (nextStep > 1 && topicSeed.trim().length === 0) {
      setNotice('먼저 만들고 싶은 카드뉴스 주제를 입력해주세요.')
      return
    }

    if (nextStep > 4 && slides.length === 0) {
      setNotice('먼저 AI 초안을 생성해주세요.')
      return
    }

    setAutoStep(nextStep)
  }

  function selectCreationMode(nextMode: CreationMode) {
    setCreationMode(nextMode)
    setAutoStep(MODE_SWITCH_RESET_STEP.auto)
    setManualStep(MODE_SWITCH_RESET_STEP.manual)

    window.setTimeout(() => {
      jumpToSection('upload-section')
    }, 0)
  }

  function createManualCard() {
    if (slides.length >= MAX_SLIDES) {
      setNotice('카드는 최대 20장까지 추가할 수 있어요.')
      return
    }

    const normalizedBrandName = brandName.trim() || 'SNS 카드 뉴스 생성기'
    const nextIndex = slides.length
    const normalizedAccentColor = normalizeHexColor(directTemplateAccentColor)
    const nextSlide = createManualSlideDraft(nextIndex, normalizedAccentColor, selectedDirectTemplate.layout)

    setBrandName(normalizedBrandName)
    setCreationMode('manual')
    setMode('social')
    setPresetId('social-portrait')
    setThemeId('custom')
    setCardLayout(selectedDirectTemplate.layout)
    setCustomColor(normalizedAccentColor)
    setSlides((previousSlides) => [...previousSlides, nextSlide])
    setManualSlideIds((previousIds) => [...previousIds, nextSlide.id])
    setActiveSlideId(nextSlide.id)
    const manualProjectText = getManualCardNewsProjectText()
    setProjectBadge(manualProjectText.projectBadge)
    setProjectTitle(manualProjectText.projectTitle)
    setNotice(`카드 ${nextIndex + 1}을 추가했어요. 제목, 내용1, 내용2를 편집할 수 있습니다.`)
    setIsDraftReady(true)
    setManualStep(2)
  }

  function openGeneratedEditor() {
    if (slides.length === 0) {
      return
    }

    jumpToSection('workspace-section')
  }

  function openDownloadPreview() {
    if (slides.length === 0) {
      setNotice('다운로드할 카드가 아직 없습니다.')
      return
    }

    setAutoStep(6)
    setShowPreviewModal(true)
  }

  function applyCustomColor(rawColor: string) {
    const nextColor = normalizeHexColor(rawColor)
    setTopicAccentColor(nextColor)
    setCustomColor(nextColor)
    setThemeId('custom')
  }

  function openGalleryPicker() {
    if (slides.length >= MAX_SLIDES) {
      setNotice('이미지는 최대 20장까지 넣을 수 있어요.')
      return
    }

    fileInputRef.current?.click()
  }

  function openActiveSlideImagePicker() {
    if (activeSlide == null) {
      setNotice('이미지를 교체할 카드를 먼저 선택해주세요.')
      return
    }

    if (fileInputRef.current == null) {
      return
    }

    fileInputRef.current.dataset.intent = 'replace-slide'
    fileInputRef.current.dataset.slideId = activeSlide.id
    fileInputRef.current.click()
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
    field: keyof Pick<SlideDraft, 'kicker' | 'title' | 'description' | 'content2' | 'badge' | 'cardLayout' | 'themeId' | 'customColor' | 'fontPreset'>,
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

  function updateSlideNumberField(
    slideId: string,
    field: keyof Pick<SlideDraft, 'fontScale'>,
    value: number,
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

  function replaceSlideImage(slideId: string, image: ImportedImage) {
    setSlides((previousSlides) =>
      previousSlides.map((slide) =>
        slide.id === slideId
          ? {
            ...slide,
            dataUrl: image.dataUrl,
            name: image.name,
            source: image.source,
            focusX: 50,
            focusY: 50,
            zoom: 1,
          }
          : slide,
      ),
    )
    setNotice('선택한 카드의 이미지를 교체했어요.')
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
    setManualSlideIds((previousIds) => previousIds.filter((id) => id !== slideId))
  }

  const appStyle = {
    '--page-background': '#f8f8f8',
    '--panel-background': '#ffffff',
    '--panel-border': '#e9f2fe',
    '--text-color': '#1c2b42',
    '--muted-color': '#42526e',
    '--accent-color': '#f15a24',
    '--accent-soft': '#fff1e8',
    '--panel-shadow': '0 20px 48px rgba(241, 90, 36, 0.1)',
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
            <strong>SNS 카드 뉴스 생성기</strong>
          </div>
        </div>

        <div className="runtime-pill">
          {bridgeAvailable ? 'AppsInToss 연결됨' : '브라우저 미리보기'}
        </div>
      </header>

      <main className="studio-main">
        <section className="wizard-shell" id="upload-section">
          <div className="wizard-header">
            <div>
              <span className="section-kicker">SNS 카드뉴스 생성기</span>
              <h1>{creationMode == null ? '어떤 방식으로 시작할까요?' : '카드뉴스 만들기'}</h1>
              <p>{creationMode == null ? '원하는 방법을 선택하고 카드뉴스를 만들어 보세요.' : '선택한 플로우에 필요한 기능만 순서대로 보여드릴게요.'}</p>
            </div>

            {creationMode == null ? (
              <button className="mini-button ghost project-button" type="button">
                내 프로젝트
              </button>
            ) : (
              <div className="creation-tabs" role="tablist" aria-label="카드뉴스 생성 방식">
              <button
                aria-selected={creationMode === 'auto'}
                className={creationMode === 'auto' ? 'creation-tab active' : 'creation-tab'}
                onClick={() => selectCreationMode('auto')}
                role="tab"
                type="button"
              >
                자동 생성
              </button>
              <button
                aria-selected={creationMode === 'manual'}
                className={creationMode === 'manual' ? 'creation-tab active' : 'creation-tab'}
                onClick={() => selectCreationMode('manual')}
                role="tab"
                type="button"
              >
                직접 생성
              </button>
              </div>
            )}
          </div>

          {creationMode == null ? (
            <div className="start-mode-grid">
              {START_MODE_OPTIONS.map((option) => (
                <button
                  key={option.mode}
                  className={option.mode === 'auto' ? 'start-mode-card auto' : 'start-mode-card manual'}
                  onClick={() => selectCreationMode(option.mode)}
                  type="button"
                >
                  <span className={option.mode === 'auto' ? 'start-mode-icon' : 'start-mode-icon pencil'}>
                    {option.badge}
                  </span>
                  <strong>{option.title}</strong>
                  <p>{option.description}</p>
                  <div
                    className={option.mode === 'auto' ? 'start-mode-visual auto-visual' : 'start-mode-visual manual-visual'}
                    aria-hidden="true"
                  >
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                </button>
              ))}
            </div>
          ) : creationMode === 'auto' ? (
            <div className="wizard-panel">
              <div className="wizard-stepper" aria-label="자동 생성 진행 단계">
                {AUTO_CREATION_FLOW_STEPS.map((stepItem) => (
                  <button
                    key={stepItem.step}
                    className={autoStep === stepItem.step ? 'wizard-step active' : 'wizard-step'}
                    disabled={stepItem.step > autoStep && (stepItem.step < 5 || slides.length === 0)}
                    onClick={() => moveAutoStep(stepItem.step)}
                    type="button"
                  >
                    <span>{stepItem.step}</span>
                    <strong>{stepItem.label}</strong>
                  </button>
                ))}
              </div>

              {autoStep === 1 ? (
                <section className="wizard-card">
                  <span className="wizard-eyebrow">STEP 1</span>
                  <h2>무엇을 만들고 싶으신가요?</h2>
                  <label className="field wizard-topic-field">
                    <span>주제 입력</span>
                    <input
                      aria-label="카드뉴스 주제"
                      value={topicSeed}
                      onChange={(event) => setTopicSeed(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          moveAutoStep(2)
                        }
                      }}
                      placeholder="예: AI 마케팅"
                    />
                  </label>

                  <div className="topic-example-row" aria-label="주제 예시">
                    {topicExamples.map((example) => (
                      <button
                        key={example}
                        className="topic-example-chip"
                        onClick={() => setTopicSeed(example)}
                        type="button"
                      >
                        {example}
                      </button>
                    ))}
                  </div>

                  <button
                    className="primary-stage-button wizard-next-button"
                    disabled={!canAdvanceTopic}
                    onClick={() => moveAutoStep(2)}
                    type="button"
                  >
                    다음
                  </button>
                </section>
              ) : null}

              {autoStep === 2 ? (
                <section className="wizard-card">
                  <span className="wizard-eyebrow">STEP 2</span>
                  <h2>어떤 스타일로 만드시겠어요?</h2>
                  <div className="style-option-grid">
                    {draftStyleOptions.map((styleOption) => (
                      <button
                        key={styleOption.id}
                        className={draftStyle === styleOption.id ? 'style-option active' : 'style-option'}
                        onClick={() => setDraftStyle(styleOption.id)}
                        type="button"
                      >
                        <span className="radio-dot" aria-hidden="true" />
                        <strong>{styleOption.label}</strong>
                        <p>{styleOption.description}</p>
                      </button>
                    ))}
                  </div>

                  <div className="wizard-action-row">
                    <button className="mini-button ghost" onClick={() => moveAutoStep(1)} type="button">
                      이전
                    </button>
                    <button className="primary-stage-button wizard-next-button" onClick={() => moveAutoStep(3)} type="button">
                      다음
                    </button>
                  </div>
                </section>
              ) : null}

              {autoStep === 3 ? (
                <section className="wizard-card">
                  <span className="wizard-eyebrow">STEP 3</span>
                  <h2>브랜드를 적용해볼까요?</h2>
                  <div className="brand-setup-grid">
                    <label className="field">
                      <span>브랜드 명칭</span>
                      <input
                        aria-label="브랜드 명칭"
                        onChange={(event) => setBrandName(event.target.value)}
                        placeholder="예: 내 브랜드"
                        value={brandName}
                      />
                    </label>

                    <label className="field">
                      <span>로고</span>
                      {appIcon == null ? (
                        <button
                          className="brand-upload-button"
                          onClick={() => {
                            if (fileInputRef.current) {
                              fileInputRef.current.dataset.intent = 'icon'
                              fileInputRef.current.click()
                            }
                          }}
                          type="button"
                        >
                          <span>로고 또는 이미지 선택</span>
                        </button>
                      ) : (
                        <div className="brand-logo-preview-card">
                          <div className="brand-logo-preview-info">
                            <img src={appIcon} alt="등록된 로고 썸네일" />
                            <span>
                              <strong>등록된 로고</strong>
                              <small>카드 상단 브랜드 영역에 사용됩니다</small>
                            </span>
                          </div>
                          <div className="brand-logo-preview-actions">
                            <button
                              className="mini-button"
                              onClick={() => {
                                if (fileInputRef.current) {
                                  fileInputRef.current.dataset.intent = 'icon'
                                  fileInputRef.current.click()
                                }
                              }}
                              type="button"
                            >
                              교체
                            </button>
                            <button className="mini-button ghost" onClick={() => setAppIcon(null)} type="button">
                              삭제
                            </button>
                          </div>
                        </div>
                      )}
                    </label>

                    <label className="field">
                      <span>컬러</span>
                      <div className="topic-color-row">
                        <input
                          aria-label="브랜드 컬러"
                          className="theme-color-input"
                          onChange={(event) => applyCustomColor(event.target.value)}
                          onInput={(event) => applyCustomColor(event.currentTarget.value)}
                          type="color"
                          value={topicAccentColor}
                        />
                        <strong>{topicAccentColor.toUpperCase()}</strong>
                      </div>
                    </label>

                  </div>

                  <div className="wizard-summary">
                    <span>선택된 스타일</span>
                    <strong>{selectedDraftStyle.label}</strong>
                  </div>

                  <div className="wizard-action-row">
                    <button className="mini-button ghost" onClick={() => moveAutoStep(2)} type="button">
                      이전
                    </button>
                    <button className="primary-stage-button wizard-next-button" onClick={() => moveAutoStep(4)} type="button">
                      다음
                    </button>
                  </div>
                </section>
              ) : null}

              {autoStep === 4 ? (
                <section className="wizard-card generation-progress-card">
                  <span className="wizard-eyebrow">STEP 4</span>
                  <h2>어떤 레이아웃으로 생성할까요?</h2>
                  <p>오버레이, 밝은 분할, 다크 분할, 카드뉴스 중 하나를 선택하세요.</p>
                  <div className="template-option-grid" aria-label="자동 생성 레이아웃 선택">
                    {AUTO_TEMPLATE_OPTIONS.map((template) => (
                      <button
                        key={template.id}
                        className={selectedAutoTemplateId === template.id ? 'template-option active' : 'template-option'}
                        onClick={() => {
                          setSelectedAutoTemplateId(template.id)
                          applyCustomColor(template.accent)
                        }}
                        type="button"
                      >
                        <TemplateLayoutPreview
                          accent={selectedAutoTemplateId === template.id ? topicAccentColor : template.accent}
                          layout={template.layout}
                        />
                        <strong>{template.title}</strong>
                        <p>{template.description}</p>
                      </button>
                    ))}
                  </div>
                  <div className="wizard-summary">
                    <span>선택된 레이아웃</span>
                    <strong>{selectedAutoTemplate.title} · {topicAccentColor.toUpperCase()}</strong>
                  </div>
                  <label className="template-color-picker">
                    <span>레이아웃 컬러</span>
                    <div className="template-color-picker-row">
                      <input
                        aria-label="레이아웃 컬러"
                        className="theme-color-input"
                        onChange={(event) => applyCustomColor(event.target.value)}
                        onInput={(event) => applyCustomColor(event.currentTarget.value)}
                        type="color"
                        value={topicAccentColor}
                      />
                      <strong>{topicAccentColor.toUpperCase()}</strong>
                    </div>
                  </label>
                  <button className="primary-stage-button wizard-next-button" onClick={createTopicDraft} type="button">
                    선택한 레이아웃으로 생성
                  </button>
                </section>
              ) : null}

              {autoStep === 5 ? (
                <section className="wizard-card generation-complete-card">
                  <span className="wizard-eyebrow">STEP 5</span>
                  <h2>편집하기</h2>
                  <p>AI 초안 8장이 생성되었습니다. 필요한 카드를 고르고 편집 화면으로 이동하세요.</p>

                  <div className="generated-card-strip" aria-label="생성된 카드 목록">
                    {generatedCardNumbers.map((number) => (
                      <button
                        key={number}
                        className={activeSlideIndex === number - 1 ? 'generated-card-number active' : 'generated-card-number'}
                        onClick={() => setActiveSlideId(slides[number - 1]?.id ?? null)}
                        type="button"
                      >
                        {number}
                      </button>
                    ))}
                  </div>

                  <div className="edit-tools-preview" aria-label="편집 단계에서 사용할 수 있는 도구">
                    <span>장면 편집</span>
                    <span>레이아웃</span>
                    <span>컬러</span>
                    <span>폰트</span>
                  </div>

                  <button className="primary-stage-button wizard-next-button" onClick={openGeneratedEditor} type="button">
                    편집 시작
                  </button>
                  <button className="mini-button ghost" onClick={() => moveAutoStep(6)} type="button">
                    다운로드 단계로
                  </button>
                </section>
              ) : null}

              {autoStep === 6 ? (
                <section className="wizard-card download-complete-card">
                  <span className="wizard-eyebrow">STEP 6</span>
                  <h2>완성이 되었습니다!</h2>
                  <p>원하는 형식으로 다운로드하거나 공유해보세요.</p>
                  <div className="generated-card-strip" aria-label="완성 카드 목록">
                    {generatedCardNumbers.map((number) => (
                      <button
                        key={number}
                        className={activeSlideIndex === number - 1 ? 'generated-card-number active' : 'generated-card-number'}
                        onClick={() => setActiveSlideId(slides[number - 1]?.id ?? null)}
                        type="button"
                      >
                        {number}
                      </button>
                    ))}
                  </div>
                  <div className="download-action-row">
                    <button className="mini-button ghost" onClick={() => moveAutoStep(5)} type="button">
                      편집으로 돌아가기
                    </button>
                    <button className="primary-stage-button wizard-next-button" onClick={openDownloadPreview} type="button">
                      다운로드 보기
                    </button>
                  </div>
                </section>
              ) : null}
            </div>
          ) : (
            <div className="manual-panel">
              {manualStep === 1 ? (
                <div className="manual-hero">
                  <span className="wizard-eyebrow">직접 생성</span>
                  <h2>레이아웃을 고르고 직접 시작하세요</h2>
                  <p>AI 생성 옵션 없이 원하는 레이아웃으로 카드뉴스를 직접 구성합니다.</p>
                  <label className="manual-brand-field field">
                    <span>브랜드 명칭</span>
                    <input
                      aria-label="직접 생성 브랜드 명칭"
                      onChange={(event) => setBrandName(event.target.value)}
                      placeholder="카드 상단에 들어갈 브랜드명"
                      value={brandName}
                    />
                  </label>
                  <div className="template-option-grid manual-template-grid" aria-label="직접 생성 레이아웃 선택">
                    {DIRECT_TEMPLATE_OPTIONS.map((template) => (
                      <button
                        key={template.id}
                        className={selectedDirectTemplateId === template.id ? 'template-option active' : 'template-option'}
                        onClick={() => {
                          setSelectedDirectTemplateId(template.id)
                          setDirectTemplateAccentColor(template.accent)
                        }}
                        type="button"
                      >
                        <TemplateLayoutPreview
                          accent={selectedDirectTemplateId === template.id ? directTemplateAccentColor : template.accent}
                          layout={template.layout}
                        />
                        <strong>{template.title}</strong>
                        <p>{template.description}</p>
                      </button>
                    ))}
                  </div>
                  <label className="template-color-picker">
                    <span>레이아웃 컬러</span>
                    <div className="template-color-picker-row">
                      <input
                        aria-label="직접 생성 레이아웃 컬러"
                        className="theme-color-input"
                        onChange={(event) => setDirectTemplateAccentColor(normalizeHexColor(event.target.value))}
                        onInput={(event) => setDirectTemplateAccentColor(normalizeHexColor(event.currentTarget.value))}
                        type="color"
                        value={directTemplateAccentColor}
                      />
                      <strong>{directTemplateAccentColor.toUpperCase()}</strong>
                    </div>
                  </label>
                  <button className="manual-start-option active" onClick={createManualCard} type="button">
                    <span>+</span>
                    <strong>선택 레이아웃으로 새 카드</strong>
                    <small>{selectedDirectTemplate.title} 레이아웃으로 시작합니다.</small>
                  </button>
                </div>
              ) : (
                <div className="manual-hero manual-progress-summary">
                  <span className="wizard-eyebrow">직접 생성</span>
                  <h2>편집 화면에서 카드를 관리하세요</h2>
                  <p>새 카드는 아래 편집 화면의 카드 목록에서만 추가됩니다.</p>
                </div>
              )}

              {manualStep === 2 ? (
                <div className="direct-flow-list" aria-label="직접 생성 진행 단계">
                {DIRECT_CREATION_FLOW_STEPS.map((stepItem) => (
                  <div key={stepItem.step} className="direct-flow-item">
                    <span>{stepItem.step}</span>
                    <strong>{stepItem.label}</strong>
                    <p>{stepItem.description}</p>
                  </div>
                ))}
                </div>
              ) : null}

              {manualStep === 2 ? (
                <div className="manual-card-list" aria-label="직접 생성 카드 목록">
                {manualSlides.length === 0 ? (
                  <div className="manual-empty-state">
                    <strong>아직 카드가 없습니다</strong>
                    <span>첫 카드를 추가하면 편집 화면이 열립니다.</span>
                  </div>
                ) : (
                  manualSlides.map((slide, index) => (
                    <button
                      key={slide.id}
                      className={slide.id === activeSlide?.id ? 'manual-card-item active' : 'manual-card-item'}
                      onClick={() => {
                        setActiveSlideId(slide.id)
                        jumpToSection('workspace-section')
                      }}
                      type="button"
                    >
                      <span>카드 {index + 1}</span>
                      <strong>{slide.title || '제목'}</strong>
                      <p>{slide.description || '본문'}</p>
                    </button>
                  ))
                )}
                </div>
              ) : null}
            </div>
          )}
        </section>

        <section className="flow-shell top-flow-shell legacy-composer">
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

        <section className="landing-shell legacy-composer" id="legacy-upload-section">
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
              <h2 style={{ marginBottom: '24px' }}>주제만 넣고 카드뉴스 초안을 먼저 만드세요</h2>

              <label className="field topic-draft-field">
                <span>카드뉴스 주제</span>
                <div className="topic-draft-row">
                  <input
                    aria-label="카드뉴스 주제"
                    value={topicSeed}
                    onChange={(event) => setTopicSeed(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        createTopicDraft()
                      }
                    }}
                    placeholder="예: AI 업무 자동화, 고객 온보딩 개선"
                  />
                  <button className="primary-stage-button compact" onClick={createTopicDraft} type="button">
                    초안 만들기
                  </button>
                </div>
              </label>

              <label className="field topic-draft-field">
                <span>카드 대표 색상</span>
                <div className="topic-color-row">
                  <input
                    aria-label="카드 대표 색상"
                    className="theme-color-input"
                    onChange={(event) => applyCustomColor(event.target.value)}
                    onInput={(event) => applyCustomColor(event.currentTarget.value)}
                    type="color"
                    value={topicAccentColor}
                  />
                  <strong>{topicAccentColor.toUpperCase()}</strong>
                </div>
              </label>

              <button className="mini-button accent" onClick={openGalleryPicker} type="button">
                이미지로 직접 시작하기
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

                  <label className="field">
                    <div className="field-label-row">
                      <span>보조 배지 (기본값)</span>
                    </div>
                    <input
                      value={projectBadge}
                      onChange={(event) => setProjectBadge(event.target.value)}
                      placeholder="배지 텍스트"
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
                    SNS 카드 뉴스
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

              {mode === 'appstore' && (
                <section className="config-card">
                  <div className="config-card-head">
                    <span>Preview Frame</span>
                    <strong>미리보기로 출력하기</strong>
                  </div>
                  <div className="choice-grid">
                    <button
                      className={appStoreFrame === 'preview' ? 'choice-card active' : 'choice-card'}
                      onClick={() => setAppStoreFrame('preview')}
                      type="button"
                    >
                      미리보기
                    </button>
                    <button
                      className={appStoreFrame === 'phone' ? 'choice-card active' : 'choice-card'}
                      onClick={() => setAppStoreFrame('phone')}
                      type="button"
                    >
                      폰 목업
                    </button>
                  </div>
                </section>
              )}

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
                    <button
                      className={cardLayout === 'sequence' ? 'choice-card active' : 'choice-card'}
                      onClick={() => setCardLayout('sequence')}
                      type="button"
                    >
                      카드뉴스형
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

              {(mode !== 'social' || cardLayout === 'overlay' || cardLayout === 'sequence') && (
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

                    <button
                      className={themeId === 'custom' ? 'choice-card theme-choice active' : 'choice-card theme-choice'}
                      onClick={() => setThemeId('custom')}
                      type="button"
                    >
                      <span className="theme-dot custom" style={{ background: customColor }} />
                      직접 선택
                    </button>
                  </div>

                  {themeId === 'custom' && (
                    <label className="theme-custom-field active" style={{ marginTop: '12px' }}>
                      <div className="theme-custom-row">
                        <input
                          className="theme-color-input"
                          onChange={(event) => applyCustomColor(event.target.value)}
                          onInput={(event) => applyCustomColor(event.currentTarget.value)}
                          type="color"
                          value={customColor}
                        />
                        <strong>{customColor.toUpperCase()}</strong>
                      </div>
                    </label>
                  )}
                </section>
              )}
            </aside>
          </div>

        </section>

        {slides.length === 0 ? null : (
          <section className="editor-workspace-shell" id="workspace-section">
            <div className="editor-workspace-header">
              <div>
                <span className="section-kicker">STEP 5</span>
                <h2>편집하기</h2>
              </div>
              <div className="editor-zone-tabs" aria-label="편집 화면 구성">
                {EDITOR_WORKSPACE_ZONES.map((zone) => (
                  <span key={zone.id}>{zone.label}</span>
                ))}
              </div>
              <button className="mini-button ghost" onClick={() => setShowPreviewModal(true)} type="button">
                완료
              </button>
            </div>

            {activeSlide == null ? null : (
              <div className="editor-workspace-grid">
                <aside className="editor-card-rail" aria-label="카드 목록">
                  <div className="editor-card-rail-head">
                    <strong>카드 목록</strong>
                    <div className="editor-mini-actions">
                      <button className="mini-button" onClick={createManualCard} type="button">
                        + 추가
                      </button>
                      <button className="mini-button ghost" onClick={openGalleryPicker} type="button">
                        이미지
                      </button>
                    </div>
                  </div>

                  <div className="editor-card-list">
                    {slides.map((slide, index) => (
                      <button
                        key={slide.id}
                        className={slide.id === activeSlide.id ? 'editor-card-thumb active' : 'editor-card-thumb'}
                        onClick={() => setActiveSlideId(slide.id)}
                        type="button"
                      >
                        <span>{index + 1}</span>
                        <div className="editor-card-thumb-frame" aria-hidden="true">
                          <SlidePreview
                            appIcon={appIcon}
                            brandName={brandName}
                            projectBadge={projectBadge}
                            appStoreFrame={appStoreFrame}
                            layout="grid"
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
                        <strong>{slide.title || '제목 없음'}</strong>
                      </button>
                    ))}

                    {remainingSlots > 0 ? (
                      <button className="editor-card-add-tile" onClick={createManualCard} type="button">
                        <span>+</span>
                        카드 추가
                      </button>
                    ) : null}
                  </div>
                </aside>

                <section className="editor-canvas-panel" aria-label="편집 캔버스">
                  <div className="editor-canvas-toolbar" aria-label="카드 편집 도구">
                    <span>{String(activeSlideIndex + 1).padStart(2, '0')}</span>
                    <div>
                      <button
                        className="icon-tool-button"
                        disabled={activeSlideIndex <= 0}
                        onClick={() => moveSlide(activeSlide.id, -1)}
                        type="button"
                      >
                        ↑
                      </button>
                      <button
                        className="icon-tool-button"
                        disabled={activeSlideIndex === slides.length - 1}
                        onClick={() => moveSlide(activeSlide.id, 1)}
                        type="button"
                      >
                        ↓
                      </button>
                      <button className="icon-tool-button" onClick={openActiveSlideImagePicker} type="button">
                        이미지
                      </button>
                      <button className="icon-tool-button danger" onClick={() => removeSlide(activeSlide.id)} type="button">
                        삭제
                      </button>
                    </div>
                  </div>

                  <div className="editor-live-preview">
                    <SlidePreview
                      appIcon={appIcon}
                      brandName={brandName}
                      projectBadge={projectBadge}
                      appStoreFrame={appStoreFrame}
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

                  <div className="editor-text-fields">
                    <label className="field">
                      <span>상단 라벨</span>
                      <input
                        value={activeSlide.kicker}
                        onChange={(event) => updateSlideField(activeSlide.id, 'kicker', event.target.value)}
                        placeholder="상단 라벨을 입력하세요"
                      />
                    </label>
                    <label className="field">
                      <span>제목</span>
                      <input
                        value={activeSlide.title}
                        onChange={(event) => updateSlideField(activeSlide.id, 'title', event.target.value)}
                        placeholder="제목을 입력하세요"
                      />
                    </label>
                    <label className="field">
                      <span>내용1</span>
                      <textarea
                        rows={4}
                        value={activeSlide.description}
                        onChange={(event) => updateSlideField(activeSlide.id, 'description', event.target.value)}
                        placeholder="가운데 본문에 들어갈 내용을 입력하세요"
                      />
                    </label>
                    <label className="field">
                      <span>내용2</span>
                      <textarea
                        rows={3}
                        value={activeSlide.content2 ?? ''}
                        onChange={(event) => updateSlideField(activeSlide.id, 'content2', event.target.value)}
                        placeholder="하단 강조 박스에 들어갈 내용을 입력하세요"
                      />
                    </label>
                  </div>
                </section>

                <aside className="editor-design-panel" aria-label="디자인">
                  <div className="editor-design-head">
                    <strong>디자인</strong>
                    <div aria-label="디자인 도구">
                      {EDITOR_DESIGN_TOOLS.map((tool) => (
                        <span key={tool.id}>{tool.label}</span>
                      ))}
                    </div>
                  </div>

                  <section className="editor-design-section">
                    <span>컬러</span>
                    <div className="editor-color-row">
                      {['#f15a24', '#1868db', '#0f8a8d', '#1c2b42', '#64748b'].map((color) => (
                        <button
                          key={color}
                          aria-label={`색상 ${color}`}
                          className={(activeSlide.customColor || customColor) === color ? 'color-dot-button active' : 'color-dot-button'}
                          onClick={() => {
                            updateSlideField(activeSlide.id, 'themeId', 'custom')
                            updateSlideField(activeSlide.id, 'customColor', color)
                          }}
                          style={{ background: color }}
                          type="button"
                        />
                      ))}
                    </div>
                    <input
                      aria-label="선택 카드 컬러"
                      className="editor-color-input"
                      onChange={(event) => {
                        updateSlideField(activeSlide.id, 'themeId', 'custom')
                        updateSlideField(activeSlide.id, 'customColor', normalizeHexColor(event.target.value))
                      }}
                      type="color"
                      value={activeSlide.customColor || customColor}
                    />
                  </section>

                  <section className="editor-design-section">
                    <span>폰트</span>
                    <select
                      value={activeSlide.fontPreset ?? 'pretendard'}
                      onChange={(event) => updateSlideField(activeSlide.id, 'fontPreset', event.target.value)}
                    >
                      {fontPresetOptions.map((fontOption) => (
                        <option key={fontOption.id} value={fontOption.id}>
                          {fontOption.label}
                        </option>
                      ))}
                    </select>
                    <label className="editor-range-field">
                      <span>크기</span>
                      <input
                        max="1.25"
                        min="0.82"
                        onChange={(event) => updateSlideNumberField(activeSlide.id, 'fontScale', Number(event.target.value))}
                        step="0.01"
                        type="range"
                        value={activeSlide.fontScale ?? 1}
                      />
                    </label>
                  </section>

                  <section className="editor-design-section">
                    <span>레이아웃</span>
                    <div className="editor-layout-grid">
                      {(['sequence', 'overlay', 'split-light', 'split-dark'] as const).map((layoutOption) => (
                        <button
                          key={layoutOption}
                          className={resolveSlideLayout(activeSlide) === layoutOption ? 'editor-layout-button active' : 'editor-layout-button'}
                          onClick={() => updateSlideField(activeSlide.id, 'cardLayout', layoutOption)}
                          type="button"
                        >
                          {layoutOption === 'sequence' ? '카드뉴스' : layoutOption === 'overlay' ? '오버레이' : layoutOption === 'split-light' ? '밝은 분할' : '다크 분할'}
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="editor-design-section">
                    <span>이미지 사이즈 조정</span>
                    <CropEditor
                      preset={activePreset}
                      slide={activeSlide}
                      slideIndex={activeSlideIndex}
                      totalSlides={slides.length}
                      onFramingChange={(nextFraming) => {
                        updateSlideFraming(activeSlide.id, nextFraming)
                      }}
                    />
                  </section>
                </aside>
              </div>
            )}
          </section>
        )}
      </main>

      {creationMode != null && slides.length > 0 && (
        <div className="fixed-bottom-bar dual-btns">
          <button className="fixed-add-button" onClick={openGalleryPicker} type="button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
              <path d="M12 5v14M5 12h14" />
            </svg>
            사진 추가
          </button>
          <button className="fixed-save-button" onClick={() => setShowPreviewModal(true)} type="button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            결과보기 및 저장 ({slides.length})
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
                    {rewardedAdGroupId ? (
                      <button
                        className="action-button secondary"
                        disabled={canExport === false}
                        onClick={handleExportWithRewarded}
                        type="button"
                      >
                        보상형 광고 보고 저장
                      </button>
                    ) : null}
                    {interstitialAdGroupId ? (
                      <button
                        className="action-button secondary"
                        disabled={canExport === false}
                        onClick={handleExportWithInterstitial}
                        type="button"
                      >
                        전면형 광고 후 저장
                      </button>
                    ) : null}
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
	                        projectBadge={projectBadge}
	                        mode={mode}
	                        appStoreFrame={appStoreFrame}
	                        preset={activePreset}
	                        projectTitle={projectTitle}
	                        slide={slide}
	                        slideIndex={index}
                        theme={resolveSlideTheme(slide)}
                        totalSlides={slides.length}
                        cardLayout={resolveSlideLayout(slide)}
                        layout="grid"
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
	                projectBadge={projectBadge}
	                mode={mode}
	                appStoreFrame={appStoreFrame}
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
  projectBadge?: string
  mode: OutputMode
  appStoreFrame?: AppStoreFrame
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

type TemplateLayoutPreviewProps = {
  readonly accent: string
  readonly layout: TemplateLayoutId
}

function TemplateLayoutPreview({ accent, layout }: TemplateLayoutPreviewProps) {
  const normalizedAccent = normalizeHexColor(accent)
  const previewStyle: CSSProperties & {
    readonly '--layout-preview-accent': string
  } = {
    '--layout-preview-accent': normalizedAccent,
  }

  return (
    <div
      aria-hidden="true"
      className={`template-layout-preview ${layout}`}
      style={previewStyle}
    >
      <div className="layout-preview-card">
        <span className="layout-preview-brand" />
        <span className="layout-preview-count" />
        <span className="layout-preview-title" />
        <span className="layout-preview-title short" />
        <span className="layout-preview-body" />
        <span className="layout-preview-body short" />
        <span className="layout-preview-image" />
      </div>
    </div>
  )
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
  projectBadge,
  mode,
  appStoreFrame = 'preview',
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
	            projectBadge={projectBadge}
	            mode={mode}
	            appStoreFrame={appStoreFrame}
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
  projectBadge?: string
  mode: OutputMode
  appStoreFrame?: AppStoreFrame
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
  projectBadge,
  mode,
  appStoreFrame = 'preview',
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
        brandName={brandName}
        projectBadge={projectBadge}
        mode={mode}
        appStoreFrame={appStoreFrame}
        preset={preset}
        projectTitle={projectTitle}
        slide={slide}
        slideIndex={slideIndex}
        theme={theme}
        totalSlides={totalSlides}
        onCanvasRef={onCanvasRef}
      />
    )
  }

  return (
    <SocialSlide
      appIcon={appIcon}
      brandName={brandName}
      projectBadge={projectBadge}
      mode={mode}
      preset={preset}
      projectTitle={projectTitle}
      slide={slide}
      slideIndex={slideIndex}
      theme={theme}
      totalSlides={totalSlides}
      cardLayout={cardLayout}
      onCanvasRef={onCanvasRef}
    />
  )
}

function SocialSlide({
  appIcon,
  brandName,
  projectBadge,
  preset,
  projectTitle,
  slide,
  slideIndex,
  theme,
  totalSlides,
  cardLayout = 'overlay',
  onCanvasRef,
}: SlideCanvasProps & { projectBadge?: string; onCanvasRef?: (node: HTMLDivElement | null) => void }) {
  const fontScale = slide.fontScale ?? 1
  const labelSize = preset.width * 0.024
  const brandSize = preset.width * 0.028
  const titleSize = preset.width * 0.09 * fontScale
  const bodySize = preset.width * 0.029 * fontScale
  const footerSize = preset.width * 0.022

  const finalBadge = slide.badge || projectBadge || ''
  const isSplit = cardLayout !== 'overlay'
  const fontFamily = getSlideFontFamily(slide.fontPreset)

  if (cardLayout === 'sequence') {
    return (
      <SequenceSlide
        appIcon={appIcon}
        brandName={brandName}
        preset={preset}
        slide={slide}
        slideIndex={slideIndex}
        theme={theme}
        totalSlides={totalSlides}
        onCanvasRef={onCanvasRef}
      />
    )
  }

  return (
    <div
      ref={onCanvasRef}
      className={`slide-canvas social-slide ${isSplit ? 'split-layout' : ''} ${cardLayout === 'split-light' ? 'split-light' : ''} ${cardLayout === 'split-dark' ? 'split-dark' : ''}`}
      style={{
        width: preset.width,
        height: preset.height,
        background: cardLayout === 'split-light' ? '#ffffff' : (cardLayout === 'split-dark' ? '#000000' : theme.socialBackdrop),
        fontFamily,
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

      {isSplit && (
        <div
          className="photo-header-overlay"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            padding: '4% 6%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 10,
            color: '#ffffff',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}
        >
          <span className="social-badge top-badge" style={{ fontSize: footerSize * 0.9, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}>
            {finalBadge}
          </span>
          <span style={{ fontSize: labelSize, fontWeight: 700, letterSpacing: '-0.01em' }}>{projectTitle}</span>
        </div>
      )}

      <div className="social-content">
        <div className="social-topline" style={{ fontSize: labelSize }}>
          {isSplit ? (
            <>
              <span className="split-kicker">{slide.kicker}</span>
              <span>
                {String(slideIndex + 1).padStart(2, '0')} /{' '}
                {String(totalSlides).padStart(2, '0')}
              </span>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span>{slide.kicker}</span>
              </div>
              <span>
                {String(slideIndex + 1).padStart(2, '0')} /{' '}
                {String(totalSlides).padStart(2, '0')}
              </span>
            </>
          )}
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
          {isSplit ? (
            <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
              <span />
            </div>
          ) : (
            <>
              <span className="social-badge" style={{ fontSize: footerSize }}>
                {finalBadge}
              </span>
              <span>{projectTitle}</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function SequenceSlide({
  appIcon,
  brandName,
  preset,
  slide,
  slideIndex,
  theme,
  totalSlides,
  onCanvasRef,
}: Pick<SlideCanvasProps, 'appIcon' | 'brandName' | 'preset' | 'slide' | 'slideIndex' | 'theme' | 'totalSlides'> & {
  onCanvasRef?: (node: HTMLDivElement | null) => void
}) {
  const fontScale = slide.fontScale ?? 1
  const labelSize = preset.width * 0.022
  const brandSize = preset.width * 0.026
  const titleSize = preset.width * 0.07 * fontScale
  const bodySize = preset.width * 0.028 * fontScale
  const calloutSize = preset.width * 0.026 * fontScale
  const sections = splitCardNewsSections(slide)
  const header = createSequenceHeaderModel({ appIcon, brandName })
  const variant = getSequenceCardVariant(slideIndex)
  const sequenceStyle: CSSProperties & {
    readonly '--sequence-accent': string
    readonly '--sequence-accent-soft': string
  } = {
    width: preset.width,
    height: preset.height,
    '--sequence-accent': theme.accent,
    '--sequence-accent-soft': theme.accentSoft,
    fontFamily: getSlideFontFamily(slide.fontPreset),
  }

  return (
    <div
      ref={onCanvasRef}
      className={`slide-canvas sequence-slide ${variant}`}
      style={sequenceStyle}
    >
      {variant === 'cover' ? (
        <>
          <header className="sequence-cover-header" style={{ fontSize: labelSize }}>
            <strong className="sequence-cover-logo" style={{ fontSize: brandSize }}>
              {header.brandName}
            </strong>
            <span>
              {String(slideIndex + 1).padStart(2, '0')} /{' '}
              {String(totalSlides).padStart(2, '0')}
            </span>
          </header>

          <main className="sequence-cover-main">
            <p className="sequence-cover-kicker" style={{ fontSize: labelSize }}>
              {slide.kicker}
            </p>
            <h3 style={{ fontSize: preset.width * 0.085 * fontScale }}>
              {slide.title}
            </h3>
            <p className="sequence-cover-description" style={{ fontSize: bodySize }}>
              {sections.content1}
            </p>
          </main>

          <footer className="sequence-cover-footer" style={{ fontSize: preset.width * 0.023 }}>
            <span>{new Date().toISOString().slice(0, 10).replaceAll('-', ' . ')}</span>
            <span>{slide.badge}</span>
          </footer>
        </>
      ) : (
      <article className="sequence-card">
        <header className="sequence-header" style={{ fontSize: brandSize }}>
          {header.logoSrc != null ? (
            <img className="sequence-logo-image" src={header.logoSrc} alt="" />
          ) : (
            <span className="sequence-logo-fallback" aria-hidden="true">
              {header.brandName.slice(0, 1)}
            </span>
          )}
          <strong className="sequence-logo">
            {header.brandName}
          </strong>
        </header>

        <main className="sequence-main">
          <p className="sequence-kicker" style={{ fontSize: labelSize }}>
            {slide.kicker}
          </p>
          <h3 style={{ fontSize: titleSize }}>
            {slide.title}
          </h3>
          <p className="sequence-description" style={{ fontSize: bodySize }}>
            {sections.content1}
          </p>
        </main>

        {sections.content2.length > 0 ? (
          <p className="sequence-callout" style={{ fontSize: calloutSize }}>
            {sections.content2}
          </p>
        ) : null}

        <span className="sequence-page-count" style={{ fontSize: labelSize }}>
          {String(slideIndex + 1).padStart(2, '0')} /{' '}
          {String(totalSlides).padStart(2, '0')}
        </span>
      </article>
      )}
    </div>
  )
}

function AppStoreSlide({
  appIcon,
  brandName,
  projectBadge,
  appStoreFrame = 'preview',
  preset,
  projectTitle,
  slide,
  slideIndex,
  theme,
  totalSlides,
  onCanvasRef,
}: SlideCanvasProps & { onCanvasRef?: (node: HTMLDivElement | null) => void }) {
  const fontScale = slide.fontScale ?? 1
  const labelSize = preset.width * 0.018
  const kickerSize = preset.width * 0.021
  const titleSize = preset.width * 0.086 * fontScale
  const bodySize = preset.width * 0.028 * fontScale
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
        fontFamily: getSlideFontFamily(slide.fontPreset),
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
          <span style={{ fontSize: pillSize }}>{slide.badge || projectBadge}</span>
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
        {appStoreFrame === 'phone' ? (
          <PhoneMockup slide={slide} />
        ) : (
          <div
            style={{
              width: '86%',
              maxWidth: 980,
              margin: '0 auto',
              borderRadius: 28,
              overflow: 'hidden',
              border: '1px solid rgba(255, 255, 255, 0.22)',
              boxShadow: '0 26px 60px rgba(0, 0, 0, 0.22)',
              background: 'rgba(16, 16, 18, 0.35)',
              backdropFilter: 'blur(14px)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '14px 18px',
                background: 'rgba(16, 16, 18, 0.55)',
              }}
            >
              <span style={{ width: 12, height: 12, borderRadius: 999, background: 'rgba(255, 90, 90, 0.9)' }} />
              <span style={{ width: 12, height: 12, borderRadius: 999, background: 'rgba(255, 210, 90, 0.9)' }} />
              <span style={{ width: 12, height: 12, borderRadius: 999, background: 'rgba(90, 230, 120, 0.9)' }} />
              <span style={{ marginLeft: 8, opacity: 0.9, fontSize: preset.width * 0.017 }}>
                미리보기
              </span>
            </div>
	            <div
	              style={{
	                aspectRatio: '16 / 10',
	                background: 'rgba(8, 8, 10, 0.35)',
	              }}
	            >
	              <img
	                src={slide.dataUrl}
	                alt=""
	                draggable={false}
	                style={{
	                  width: '100%',
	                  height: '100%',
	                  display: 'block',
	                  objectFit: 'contain',
	                  objectPosition: 'center',
	                  filter: 'saturate(1.02) contrast(1.02)',
	                }}
	              />
	            </div>
	          </div>
	        )}
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
    content2: '',
    badge: fallbackCopy.badge,
    focusX: 50,
    focusY: 50,
    zoom: 1,
    fontPreset: 'pretendard',
    fontScale: 1,
  }
}

function createManualSlideDraft(
  index: number,
  accentColor: string,
  cardLayout: TemplateLayoutId,
): SlideDraft {
  const slideNumber = String(index + 1).padStart(2, '0')
  const normalizedAccent = normalizeHexColor(accentColor)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><rect width="1080" height="1350" fill="${normalizedAccent}"/><rect x="90" y="160" width="900" height="1030" rx="42" fill="#ffffff" opacity="0.92"/><text x="140" y="270" font-family="Arial, sans-serif" font-size="44" font-weight="700" fill="${normalizedAccent}">Card ${slideNumber}</text><text x="140" y="440" font-family="Arial, sans-serif" font-size="84" font-weight="800" fill="#1c2b42">제목을 입력하세요</text><text x="140" y="540" font-family="Arial, sans-serif" font-size="36" fill="#42526e">본문과 이미지는 편집 단계에서 바꿀 수 있어요.</text></svg>`

  return {
    id: `manual-card-${Date.now()}-${slideNumber}`,
    dataUrl: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    name: `manual-card-${slideNumber}.svg`,
    source: 'local',
    kicker: '직접 생성',
    title: '제목을 입력하세요',
    description: '내용1을 입력하세요. 가운데 본문 영역에 표시됩니다.',
    content2: '내용2를 입력하세요. 하단 강조 박스에 표시됩니다.',
    badge: '',
    focusX: 50,
    focusY: 50,
    zoom: 1,
    themeId: 'global',
    cardLayout,
    fontPreset: 'pretendard',
    fontScale: 1,
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
    content2: slide.content2 ?? '',
    badge: slide.badge || fallbackCopy.badge,
    focusX: clamp(typeof slide.focusX === 'number' ? slide.focusX : 50, 0, 100),
    focusY: clamp(typeof slide.focusY === 'number' ? slide.focusY : 50, 0, 100),
    zoom: clamp(typeof slide.zoom === 'number' ? slide.zoom : 1, 1, 2.4),
    fontPreset: normalizeFontPreset(slide.fontPreset),
    fontScale: clamp(typeof slide.fontScale === 'number' ? slide.fontScale : 1, 0.82, 1.25),
  }
}

function normalizeFontPreset(value: string | undefined): FontPresetId {
  if (value === 'display' || value === 'serif' || value === 'pretendard') {
    return value
  }

  return 'pretendard'
}

function getSlideFontFamily(value: FontPresetId | undefined) {
  const fontPreset = fontPresetOptions.find((fontOption) => fontOption.id === normalizeFontPreset(value))

  return fontPreset?.family ?? fontPresetOptions[0].family
}

function isRestorableGeneratedSlide(slide: SlideDraft): boolean {
  return (
    slide.id.startsWith('topic-draft-') &&
    slide.source === 'local' &&
    slide.dataUrl.startsWith('data:image/svg+xml') &&
    slide.cardLayout === 'sequence'
  )
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
        kicker: 'Kicker 입력',
        title: '메인 타이틀을 입력하세요',
        description:
          '상세 설명을 이곳에 작성합니다. 한 장에 하나의 핵심 메시지만 담는 것이 좋습니다.',
        badge: 'Hero',
      },
      {
        kicker: '차별 포인트',
        title: '핵심 가치를 강조하세요',
        description:
          '사용자가 얻을 수 있는 구체적인 혜택이나 기능을 짧고 강렬하게 설명합니다.',
        badge: 'Point',
      },
      {
        kicker: '주요 기능',
        title: '기능이나 장면을 보여주세요',
        description:
          '실제 앱 화면과 함께 해당 기능을 사용했을 때의 장점을 언급합니다.',
        badge: 'Feature',
      },
      {
        kicker: '신뢰/인증',
        title: '서비스의 신뢰도를 높이세요',
        description:
          '리뷰, 평점, 또는 서비스의 규모를 나타내는 지표를 활용하면 효과적입니다.',
        badge: 'Trust',
      },
      {
        kicker: '마무리',
        title: '마지막 인사를 남기세요',
        description:
          '서비스의 전체적인 톤을 정리하거나 마지막으로 강조하고 싶은 문장을 넣습니다.',
        badge: 'End',
      },
    ]

    return copies[index] ?? copies[copies.length - 1]
  }

  const copies = [
    {
      kicker: 'Label 입력',
      title: '첫 장의 타이틀을 입력하세요',
      description:
        '전체 흐름을 관통하는 가장 핵심적인 질문이나 주제를 이곳에 작성합니다.',
      badge: 'Start',
    },
    {
      kicker: '메시지 입력',
      title: '다음 내용을 이어서 작성하세요',
      description:
        '본격적인 정보를 전달하는 구간입니다. 이미지와 문구의 조화가 중요합니다.',
      badge: 'Scene',
    },
    {
      kicker: '메시지 입력',
      title: '핵심 증거나 보충 설명입니다',
      description:
        '논리적인 설득이나 사례를 덧붙여 독자의 공감을 이끌어내는 단계입니다.',
      badge: 'Scene',
    },
    {
      kicker: '메시지 입력',
      title: '장면 중심의 카피를 넣어보세요',
      description:
        '실제 사용 맥락이나 구체적인 상황 묘사를 통해 이해를 돕습니다.',
      badge: 'Scene',
    },
    {
      kicker: '마무리',
      title: '마지막 장의 요약 메시지입니다',
      description:
        '모든 내용을 함축하는 한 문장이나 서비스의 슬로건을 남기며 마무리합니다.',
      badge: 'End',
    },
  ]

  return copies[index] ?? copies[copies.length - 1]
}

function isThemePresetId(value: string): value is ThemePresetId {
  return value in THEME_PRESETS
}

function normalizeRestoredBrandText(value: string) {
  const normalized = value.trim()
  return normalized === 'Sequence' ? 'SNS 카드뉴스 생성기' : value
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

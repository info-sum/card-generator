/**
 * @file App.tsx
 * @description SNS 카드 뉴스 생성기의 메인 애플리케이션 컴포넌트입니다.
 * 주제 입력, 스타일 선택, 브랜드 설정, AI 생성 로딩 및 카드 편집/다운로드 기능을 제공합니다.
 */
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
  AUTO_SLIDE_COUNT_OPTIONS,
  AUTO_CREATION_FLOW_STEPS,
  AUTO_TEMPLATE_OPTIONS,
  DEFAULT_AUTO_SLIDE_COUNT,
  DIRECT_TEMPLATE_OPTIONS,
  MODE_SWITCH_RESET_STEP,
  type AutoWizardStepId,
  type CreationMode,
  type TemplateLayoutId,
} from './creationFlow'
import {
  requestAiCardNews,
  type GenerateCardNewsResponse,
} from './lib/aiCardNews'
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
  logoScale?: number
  aiApiProvider?: AiApiProvider
  gptApiKey?: string
  geminiApiKey?: string
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

type AiApiProvider = 'gpt' | 'gemini'

type Preset = {
  id: PresetId
  label: string
  width: number
  height: number
  mode: OutputMode
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
type TossRewardResult = { earnedReward: { unitType: string; unitAmount: number } | null }

const MAX_SLIDES = 20 // 5 -> 20으로 한도 대폭 확장
const DRAFT_KEY = 'image-marketing-studio-draft-v1'
const TOSS_REWARDED_AD_GROUP_ID = 'ait.v2.live.035615363b1a4c7c'

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
  const demoScenario = getDemoScenario()

  const [brandName, setBrandName] = useState('SNS 카드 뉴스 생성기')
  const [appIcon, setAppIcon] = useState<string | null>(null)
  const [logoScale, setLogoScale] = useState(1)
  const [aiApiProvider, setAiApiProvider] = useState<AiApiProvider>('gpt')
  const [gptApiKey, setGptApiKey] = useState('')
  const [geminiApiKey, setGeminiApiKey] = useState('')
  const [projectBadge, setProjectBadge] = useState('PRODUCT')
  const [projectTitle, setProjectTitle] = useState(
    'SNS 카드 뉴스 생성기',
  )
  const [creationMode, setCreationMode] = useState<SelectedCreationMode>(null)
  const [autoStep, setAutoStep] = useState<AutoWizardStepId>(1)
  const [topicSeed, setTopicSeed] = useState('')
  const [topicAccentColor, setTopicAccentColor] = useState('#1247d8')
  const [draftStyle, setDraftStyle] = useState<CardNewsDraftStyle>('informative')
  const [autoSlideCount, setAutoSlideCount] = useState(DEFAULT_AUTO_SLIDE_COUNT)
  const generateAiImages = true
  const [selectedAutoTemplateId, setSelectedAutoTemplateId] = useState(AUTO_TEMPLATE_OPTIONS[0].id)
  const [selectedDirectTemplateId, setSelectedDirectTemplateId] = useState(DIRECT_TEMPLATE_OPTIONS[0].id)
  const [directTemplateAccentColor, setDirectTemplateAccentColor] = useState(DIRECT_TEMPLATE_OPTIONS[0].accent)
  const [mode, setMode] = useState<OutputMode>('social')
  const [presetId, setPresetId] = useState<PresetId>('social-portrait')
  const [themeId, setThemeId] = useState<ThemeId>('sunset')
  const [cardLayout, setCardLayout] = useState<CardLayout>('overlay')
  const [customColor, setCustomColor] = useState('#dd5e31')
  const [slides, setSlides] = useState<SlideDraft[]>([])
  const [appStoreFrame] = useState<AppStoreFrame>('preview')
  const [activeSlideId, setActiveSlideId] = useState<string | null>(null)
  const [toneManner, setToneManner] = useState<'clean' | 'friendly' | 'professional' | 'emotional'>('clean')
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [helpTopic, setHelpTopic] = useState<HelpTopicId | null>(null)
  const [notice, setNotice] = useState(
    '이미지 최대 20장을 넣으면 SNS 카드 뉴스와 스토어 소개 이미지를 빠르게 구성할 수 있어요.',
  )
  const [busyLabel, setBusyLabel] = useState('')
  const [isDraftReady, setIsDraftReady] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const interstitialAdGroupId = import.meta.env.VITE_TOSS_AD_INTERSTITIAL_GROUP_ID as
    | string
    | undefined
  const rewardedAdGroupId =
    import.meta.env.VITE_TOSS_AD_REWARDED_GROUP_ID ?? TOSS_REWARDED_AD_GROUP_ID

  const activePreset =
    PRESETS.find((preset) => preset.id === presetId) ?? PRESETS[1]
  const canExport = slides.length > 0 && busyLabel === ''
  const activeSlide =
    slides.find((slide) => slide.id === activeSlideId) ?? slides[0] ?? null
  const activeHelp = helpTopic == null ? null : HELP_CONTENT[helpTopic]
  const activeSlideIndex =
    activeSlide == null
      ? -1
      : slides.findIndex((slide) => slide.id === activeSlide.id)
  const canAdvanceTopic = topicSeed.trim().length > 0
  const selectedAutoTemplate =
    AUTO_TEMPLATE_OPTIONS.find((template) => template.id === selectedAutoTemplateId) ?? AUTO_TEMPLATE_OPTIONS[0]
  const selectedDirectTemplate =
    DIRECT_TEMPLATE_OPTIONS.find((template) => template.id === selectedDirectTemplateId) ?? DIRECT_TEMPLATE_OPTIONS[0]

  const resolveSlideTheme = (slide: SlideDraft): Theme => {
    const computedThemeId = slide.themeId && slide.themeId !== 'global' ? (slide.themeId as Exclude<typeof slide.themeId, 'global'>) : themeId
    const computedCustomColor = slide.customColor && computedThemeId === 'custom' ? slide.customColor : customColor
    return resolveOutputTheme(computedThemeId, computedCustomColor)
  }

  const resolveSlideLayout = (slide: SlideDraft): CardLayout => {
    return slide.cardLayout && slide.cardLayout !== 'global' ? slide.cardLayout : cardLayout
  }

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
        logoScale,
        aiApiProvider,
        gptApiKey: gptApiKey.trim() || undefined,
        geminiApiKey: geminiApiKey.trim() || undefined,
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
  }, [brandName, appIcon, logoScale, aiApiProvider, gptApiKey, geminiApiKey, projectBadge, projectTitle, mode, presetId, themeId, cardLayout, customColor, slides, isDraftReady, demoScenario])

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

      if (typeof parsedDraft.logoScale === 'number') {
        setLogoScale(clamp(parsedDraft.logoScale, 0.55, 1.8))
      }

      if (parsedDraft.aiApiProvider === 'gpt' || parsedDraft.aiApiProvider === 'gemini') {
        setAiApiProvider(parsedDraft.aiApiProvider)
      }

      if (typeof parsedDraft.gptApiKey === 'string') {
        setGptApiKey(parsedDraft.gptApiKey.trim())
      }

      if (typeof parsedDraft.geminiApiKey === 'string') {
        setGeminiApiKey(parsedDraft.geminiApiKey.trim())
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
        const optimizedIcon = await optimizeLocalImage(firstImage)
        setAppIcon(optimizedIcon.dataUrl)
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

  async function maybeShowFullScreenAd(adGroupId: string): Promise<TossRewardResult> {
    if (!adGroupId) return { earnedReward: null }
    if (!isAppsInTossRuntime()) return { earnedReward: null }
    if (!isIntegratedAdSupported()) return { earnedReward: null }

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

  async function startTopicGeneration() {
    setIsGenerating(true)
    setGenerationProgress(0)

    let progress = 8
    const interval = window.setInterval(() => {
      progress = Math.min(88, progress + Math.floor(Math.random() * 6) + 3)
      setGenerationProgress(progress)
    }, 180)

    try {
      const normalizedAccentColor = normalizeHexColor(topicAccentColor)
      const response = await requestAiCardNews({
        topic: topicSeed,
        style: draftStyle,
        slideCount: autoSlideCount,
        brandName,
        accentColor: normalizedAccentColor,
        layout: selectedAutoTemplate.layout,
        generateImages: generateAiImages,
        aiProvider: aiApiProvider,
        apiKey: aiApiProvider === 'gpt' ? gptApiKey : geminiApiKey,
      })
      window.clearInterval(interval)
      setGenerationProgress(100)
      applyGeneratedCardNews(response, normalizedAccentColor)
    } catch (error) {
      window.clearInterval(interval)
      setGenerationProgress(100)
      if (error instanceof Error) {
        createTopicDraft(`AI 연결이 불안정해 기본 초안으로 생성했어요. ${error.message}`)
      } else {
        throw error
      }
    } finally {
      window.setTimeout(() => setIsGenerating(false), 250)
    }
  }

  function createTopicDraft(noticeMessage?: string) {
    const normalizedAccentColor = normalizeHexColor(topicAccentColor)
    const draft = generateCardNewsDraft(topicSeed, {
      accentColor: normalizedAccentColor,
      brandName,
      slideCount: autoSlideCount,
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
    setNotice(noticeMessage ?? `AI 생성이 완료됐어요. 카드 ${autoSlideCount}장을 확인한 뒤 편집하거나 다운로드할 수 있습니다.`)
    setIsDraftReady(true)
  }

  function applyGeneratedCardNews(response: GenerateCardNewsResponse, normalizedAccentColor: string) {
    if (response.source === 'fallback' || response.slides.length === 0) {
      createTopicDraft(response.warnings[0] ?? 'AI 연결이 없어 기본 초안으로 생성했어요.')
      return
    }

    const fallbackDraft = generateCardNewsDraft(topicSeed, {
      accentColor: normalizedAccentColor,
      brandName: response.brandName,
      slideCount: response.slides.length,
      style: draftStyle,
    })
    const nextSlides = response.slides.flatMap((slide, index) => {
      const fallbackSlide = fallbackDraft.slides[index]
      if (fallbackSlide == null) {
        return []
      }

      return [{
        ...fallbackSlide,
        dataUrl: slide.imageDataUrl ?? fallbackSlide.dataUrl,
        name: `ai-cardnews-${String(index + 1).padStart(2, '0')}.${slide.imageDataUrl == null ? 'svg' : 'png'}`,
        kicker: slide.kicker || fallbackSlide.kicker,
        title: slide.title || fallbackSlide.title,
        description: slide.description || fallbackSlide.description,
        content2: slide.content2,
        badge: slide.badge || fallbackSlide.badge,
        cardLayout: selectedAutoTemplate.layout,
        customColor: normalizedAccentColor,
        themeId: 'custom' as const,
      }]
    })

    setBrandName(response.brandName)
    setProjectBadge(response.brandName)
    setProjectTitle(response.projectTitle)
    setMode('social')
    setPresetId('social-portrait')
    setThemeId('custom')
    setCardLayout(selectedAutoTemplate.layout)
    setCustomColor(normalizedAccentColor)
    setSlides(nextSlides)
    setActiveSlideId(nextSlides[0]?.id ?? null)
    setAutoStep(5)
    setNotice(`AI 생성이 완료됐어요. 카드 ${nextSlides.length}장을 확인한 뒤 편집하거나 다운로드할 수 있습니다.`)
    setIsDraftReady(true)
  }

  function selectCreationMode(nextMode: CreationMode) {
    setCreationMode(nextMode)
    setAutoStep(MODE_SWITCH_RESET_STEP.auto)

    window.setTimeout(() => {
      jumpToSection('upload-section')
    }, 0)
  }

  function handleToneSelect(nextTone: typeof toneManner) {
    setToneManner(nextTone)
    const styleByTone = {
      clean: 'informative',
      friendly: 'story',
      professional: 'news',
      emotional: 'thread',
    } as const satisfies Record<typeof toneManner, CardNewsDraftStyle>
    setDraftStyle(styleByTone[nextTone])
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
    setActiveSlideId(nextSlide.id)
    const manualProjectText = getManualCardNewsProjectText()
    setProjectBadge(manualProjectText.projectBadge)
    setProjectTitle(manualProjectText.projectTitle)
    const editableFields =
      selectedDirectTemplate.layout === 'sequence' ? '제목, 내용1, 내용2' : '제목, 내용1'
    setNotice(`카드 ${nextIndex + 1}을 추가했어요. ${editableFields}을 편집할 수 있습니다.`)
    setIsDraftReady(true)
  }

  function applyCustomColor(rawColor: string) {
    const nextColor = normalizeHexColor(rawColor)
    setTopicAccentColor(nextColor)
    setCustomColor(nextColor)
    setThemeId('custom')
    applySequenceColorToSlides(nextColor)
  }

  function applySequenceColorToSlides(nextColor: string) {
    setSlides((previousSlides) =>
      previousSlides.map((slide) => {
        const slideLayout = slide.cardLayout === 'global' || slide.cardLayout == null ? cardLayout : slide.cardLayout

        if (slideLayout !== 'sequence') {
          return slide
        }

        return {
          ...slide,
          customColor: nextColor,
          themeId: 'custom',
        }
      }),
    )
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

  function requestLogoUpload() {
    const input = fileInputRef.current

    if (input == null) {
      return
    }

    input.dataset.intent = 'icon'
    input.click()
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

  function applyProjectCardLayout(nextLayout: CardLayout) {
    setCardLayout(nextLayout)
    setSlides((previousSlides) =>
      previousSlides.map((slide) => ({
        ...slide,
        cardLayout: nextLayout,
      })),
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

      <header className="top-bar-modern">
        <div className="top-brand-modern">
          <div className="brand-logo-circle-modern-header">
            <img className="site-logo-image-modern" src="/logo.svg" alt="카드뉴스 제작하기 로고" />
          </div>
          <strong>카드뉴스 제작하기</strong>
        </div>

        <div className="wizard-stepper-container-header">
          <div className="wizard-stepper-track-header">
            <div
              className="wizard-stepper-progress-header"
              style={{ width: `${((autoStep - 1) / 4) * 100}%` }}
            />
          </div>
          <div className="wizard-stepper-header" aria-label="카드뉴스 제작 진행 단계">
            {AUTO_CREATION_FLOW_STEPS.map((stepItem) => {
              const isActive = autoStep === stepItem.step
              const isCompleted = stepItem.step < autoStep
              return (
                <button
                  key={stepItem.step}
                  className={`wizard-step-node-header ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                  disabled={stepItem.step > autoStep && slides.length === 0}
                  onClick={() => setAutoStep(stepItem.step)}
                  type="button"
                >
                  <div className="step-node-circle-header">
                    {isCompleted ? (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : (
                      stepItem.step
                    )}
                  </div>
                  <span className="step-node-label-header">{stepItem.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="top-actions-modern">
          <button className="top-action-btn secondary" onClick={() => setShowApiKeyModal(true)} type="button">
            API Key 설정
          </button>
          {creationMode == null ? (
            <>
              <button className="top-action-btn secondary" onClick={() => window.history.back()} type="button">
                나중에 하기
              </button>
              <button className="top-close-btn-modern" onClick={() => window.history.back()} type="button" aria-label="닫기">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </>
          ) : (
            <div className="header-nav-group-modern">
              {autoStep > 1 && (
                <button className="top-action-btn secondary" onClick={() => setAutoStep((s) => Math.max(1, s - 1) as AutoWizardStepId)} type="button">
                  이전 단계
                </button>
              )}
              <button className="top-action-btn secondary" onClick={() => {
                setNotice('초안이 성공적으로 저장되었습니다.')
              }} type="button">
                임시저장
              </button>
              <button
                className="top-action-btn primary"
                disabled={slides.length === 0 && autoStep > 1}
                onClick={() => {
                  if (autoStep === 5) {
                    setShowPreviewModal(true)
                  } else {
                    setAutoStep((s) => Math.min(5, s + 1) as AutoWizardStepId)
                  }
                }}
                type="button"
              >
                {autoStep === 5 ? (
                  '결과 확인'
                ) : (
                  <span className="top-action-btn-content-with-icon">
                    <span>다음 단계</span>
                    <svg className="top-action-btn-arrow-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="studio-main-modern">
        {creationMode == null ? (
          <div className="onboarding-container-modern">
            <div className="onboarding-header-modern">
              <h1>어떤 방식으로 시작할까요?</h1>
              <p>AI가 내용을 제안해 주는 자동 생성과, 직접 내용을 입력하는 방식 중 선택해주세요.</p>
            </div>

            <div className="onboarding-grid-modern">
              <button
                className="onboarding-card-modern auto"
                onClick={() => selectCreationMode('auto')}
                type="button"
              >
                <div className="recommend-badge-modern">
                  <svg className="recommend-badge-star-icon" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                  </svg>
                  <span>추천</span>
                </div>
                <div className="onboarding-card-visual-modern">
                  <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="autoGrad" x1="40" y1="32" x2="80" y2="88" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#FF8A5B" />
                        <stop offset="100%" stopColor="#FF6B35" />
                      </linearGradient>
                      <filter id="shadowFilter" x="20" y="15" width="80" height="96" filterUnits="userSpaceOnUse">
                        <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#FF6B35" floodOpacity="0.16" />
                      </filter>
                    </defs>
                    <circle cx="60" cy="60" r="45" fill="#FFEFE7" />
                    <rect x="40" y="32" width="40" height="56" rx="8" fill="white" stroke="#FF6B35" strokeWidth="3" filter="url(#shadowFilter)" />
                    <rect x="47" y="40" width="14" height="6" rx="2" fill="#FFEFE7" />
                    <line x1="48" y1="54" x2="72" y2="54" stroke="#FF8A5B" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="48" y1="62" x2="68" y2="62" stroke="#FF8A5B" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="48" y1="70" x2="60" y2="70" stroke="#FF8A5B" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="78" y1="38" x2="48" y2="78" stroke="url(#autoGrad)" strokeWidth="4.5" strokeLinecap="round" />
                    <path d="M92 26l2 4 4 2-4 2-2 4-2-4-4-2 4-2 2-4z" fill="#FF6B35" />
                    <path d="M28 72l1.5 3 3 1.5-3 1.5-1.5 3-1.5-3-3-1.5 3-1.5 1.5-3z" fill="#F15A24" />
                    <circle cx="94" cy="68" r="3.5" fill="#FF8A5B" opacity="0.6" />
                    <circle cx="26" cy="38" r="4" fill="#F15A24" opacity="0.5" />
                  </svg>
                </div>
                <strong>자동 생성</strong>
                <p>주제만 입력하면 AI가 내용을 구성하고 여러 장의 카드뉴스를 자동으로 생성해 드려요.</p>
                <div className="onboarding-card-btn-modern auto">자동 생성으로 시작하기</div>
              </button>

              <button
                className="onboarding-card-modern manual"
                onClick={() => selectCreationMode('manual')}
                type="button"
              >
                <div className="onboarding-card-visual-modern">
                  <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <filter id="shadowFilterManual" x="22" y="18" width="76" height="92" filterUnits="userSpaceOnUse">
                        <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#1868DB" floodOpacity="0.12" />
                      </filter>
                    </defs>
                    <circle cx="60" cy="60" r="45" fill="#EBF3FF" />
                    <rect x="42" y="34" width="36" height="52" rx="6" fill="white" stroke="#1868DB" strokeWidth="3" filter="url(#shadowFilterManual)" />
                    <line x1="50" y1="46" x2="70" y2="46" stroke="#7BAEFA" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="50" y1="54" x2="66" y2="54" stroke="#7BAEFA" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="50" y1="62" x2="58" y2="62" stroke="#7BAEFA" strokeWidth="2.5" strokeLinecap="round" />
                    <g transform="translate(10, -5)">
                      <path d="M72 35l13 13-35 35H37V70l35-35z" fill="#FFFFFF" stroke="#1868DB" strokeWidth="2.5" strokeLinejoin="round" />
                      <path d="M68 39l13 13" stroke="#1868DB" strokeWidth="2" />
                      <path d="M37 83l4-1 1-4-5 5z" fill="#1868DB" />
                    </g>
                    <circle cx="94" cy="74" r="3.5" fill="#7BAEFA" opacity="0.7" />
                    <circle cx="28" cy="46" r="3" fill="#1868DB" opacity="0.5" />
                  </svg>
                </div>
                <strong>직접 작성</strong>
                <p>직접 내용을 입력하고 디자인을 선택해 나만의 카드뉴스를 만들어 보세요.</p>
                <div className="onboarding-card-btn-modern manual">직접 작성으로 시작하기</div>
              </button>
            </div>

            <div className="onboarding-tip-banner-modern">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .6 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
                <path d="M9 18h6M10 22h4" />
              </svg>
              <span>어떤 방식을 선택해도 이후 단계에서 자유롭게 수정할 수 있어요.</span>
            </div>
          </div>
        ) : (
          <div className="wizard-body-modern">
            {autoStep === 1 && (
              <div className="wizard-layout-start-modern">

                <aside className="wizard-sidebar-col-modern">
                  <div className="sidebar-section-title-modern">제작 방식 선택</div>
                  <div className="sidebar-selection-group-modern">
                    <button
                      className={`sidebar-mode-card-modern auto ${creationMode === 'auto' ? 'active' : ''}`}
                      onClick={() => selectCreationMode('auto')}
                      type="button"
                    >
                      <div className="sidebar-mode-badge-modern orange">AI</div>
                      <div className="sidebar-mode-meta-modern">
                        <strong>자동 생성</strong>
                        <p>주제 입력 시 AI 자동 생성</p>
                      </div>
                      <div className={`sidebar-mode-check-modern ${creationMode === 'auto' ? 'checked' : ''}`}>
                        {creationMode === 'auto' && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                      </div>
                    </button>

                    <button
                      className={`sidebar-mode-card-modern manual ${creationMode === 'manual' ? 'active' : ''}`}
                      onClick={() => selectCreationMode('manual')}
                      type="button"
                    >
                      <div className="sidebar-mode-badge-modern blue">
                        <svg className="sidebar-mode-badge-pencil-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                        </svg>
                      </div>
                      <div className="sidebar-mode-meta-modern">
                        <strong>직접 작성</strong>
                        <p>빈 카드에 직접 본문 작성</p>
                      </div>
                      <div className={`sidebar-mode-check-modern ${creationMode === 'manual' ? 'checked' : ''}`}>
                        {creationMode === 'manual' && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                      </div>
                    </button>
                  </div>

                  <div className="sidebar-guide-box-modern">
                    <strong>{creationMode === 'auto' ? '자동 생성은 이렇게 진행돼요' : '직접 작성은 이렇게 진행돼요'}</strong>
                    <ol className="sidebar-guide-list-modern">
                      {creationMode === 'auto' ? (
                        <>
                          <li><span>1</span> 주제 입력</li>
                          <li><span>2</span> AI가 내용 구성</li>
                          <li><span>3</span> 템플릿 및 디자인 선택</li>
                          <li><span>4</span> 카드뉴스 완성!</li>
                        </>
                      ) : (
                        <>
                          <li><span>1</span> 기본 정보 설정</li>
                          <li><span>2</span> 내용 입력 및 카드 추가</li>
                          <li><span>3</span> 디자인 스타일 설정</li>
                          <li><span>4</span> 카드뉴스 완성!</li>
                        </>
                      )}
                    </ol>
                  </div>
                </aside>


                <section className="wizard-middle-col-modern">
                  {creationMode === 'auto' && isGenerating ? (
                    <div className="generation-progress-card-modern">
                      <div className="ai-robot-bounce-container">
                        <svg className="ai-robot-svg-animated" width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="20" y="30" width="60" height="42" rx="14" fill="#FFF1E8" stroke="#F15A24" strokeWidth="4" />
                          <rect x="30" y="38" width="40" height="20" rx="6" fill="#1C2B42" />
                          <circle cx="42" cy="48" r="5" fill="#F15A24" className="robot-eye-blink" />
                          <circle cx="58" cy="48" r="5" fill="#F15A24" className="robot-eye-blink" />
                          <rect x="44" y="66" width="12" height="4" rx="2" fill="#F15A24" />
                          <path d="M50 30 V16" stroke="#F15A24" strokeWidth="3" strokeLinecap="round" />
                          <circle cx="50" cy="14" r="4" fill="#F15A24" />
                          <rect x="12" y="42" width="8" height="18" rx="3" fill="#F15A24" />
                          <rect x="80" y="42" width="8" height="18" rx="3" fill="#F15A24" />
                        </svg>
                      </div>
                      <h2>카드뉴스를 생성중입니다...</h2>
                      <p className="generation-subtext">AI가 입력한 내용을 분석하여 최적의 카드뉴스를 만들고 있어요.</p>

                      <div className="generation-progress-box-modern">
                        <div className="generation-progress-bar-container-modern">
                          <div className="generation-progress-bar-modern" style={{ width: `${generationProgress}%` }} />
                        </div>
                        <span className="generation-progress-label-modern">{generationProgress}%</span>
                      </div>
                    </div>
                  ) : creationMode === 'auto' && !isGenerating ? (
                    <div className="editor-form-box-modern">
                      <div className="editor-form-header-modern">
                        <h2>주제 입력</h2>
                        <p>카드뉴스의 주제를 입력해 주세요.</p>
                      </div>

                      <div className="textarea-wrapper-modern">
                        <textarea
                          aria-label="카드뉴스 주제"
                          value={topicSeed}
                          onChange={(event) => {
                            if (event.target.value.length <= 50) {
                              setTopicSeed(event.target.value)
                            }
                          }}
                          placeholder="예) 시간 관리 방법 5가지"
                          maxLength={50}
                          className="wizard-textarea-modern"
                        />
                        <div className="textarea-counter-modern">{topicSeed.length}/50</div>
                      </div>

                      <div className="form-section-modern">
                        <strong>카드 개수 선택</strong>
                        <p>생성할 카드(페이지) 수를 선택하세요.</p>
                        <div className="count-chips-grid-modern">
                          {AUTO_SLIDE_COUNT_OPTIONS.map((count) => (
                            <button
                              key={count}
                              className={`count-chip-modern ${autoSlideCount === count ? 'active' : ''}`}
                              onClick={() => setAutoSlideCount(count)}
                              type="button"
                            >
                              {count}장
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="form-section-modern">
                        <strong>톤앤매너 선택 (선택)</strong>
                        <p>원하는 분위기를 선택하면 더 알맞은 결과를 얻을 수 있어요.</p>
                        <div className="tone-cards-grid-modern">
                          {(['clean', 'friendly', 'professional', 'emotional'] as const).map((tone) => {
                            const isActive = toneManner === tone
                            const label = tone === 'clean' ? '깔끔한' : tone === 'friendly' ? '친근한' : tone === 'professional' ? '전문적인' : '감성적인'
                            return (
                              <button
                                key={tone}
                                className={`tone-card-modern ${tone} ${isActive ? 'active' : ''}`}
                                onClick={() => handleToneSelect(tone)}
                                type="button"
                              >
                                <div className="tone-icon-container-modern">
                                  {tone === 'clean' && (
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c0 2-2 7.07-7 8.35A7 7 0 0 1 11 20z" />
                                      <path d="M9 11.33a3 3 0 0 1-2-2.08" />
                                    </svg>
                                  )}
                                  {tone === 'friendly' && (
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <circle cx="12" cy="12" r="10" />
                                      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                                      <line x1="9" y1="9" x2="9.01" y2="9" />
                                      <line x1="15" y1="9" x2="15.01" y2="9" />
                                    </svg>
                                  )}
                                  {tone === 'professional' && (
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                                    </svg>
                                  )}
                                  {tone === 'emotional' && (
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                    </svg>
                                  )}
                                </div>
                                <strong>{label}</strong>
                                <div className="tone-card-check-modern">
                                  {isActive && (
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="20 6 9 17 4 12"/>
                                    </svg>
                                  )}
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      <button
                        className="ai-generation-submit-btn-modern"
                        disabled={!canAdvanceTopic}
                        onClick={startTopicGeneration}
                        type="button"
                      >
                        <span>AI로 내용 구성하기</span>
                        <svg className="submit-btn-sparkle-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 21c0-5.5-4.5-10-10-10 5.5 0 10-4.5 10-10 0 5.5 4.5 10 10 10-5.5 0-10 4.5-10 10z" />
                        </svg>
                      </button>
                      <span className="submit-caption-modern">* AI 생성 결과는 다음 단계에서 확인하고 수정할 수 있어요.</span>
                    </div>
                  ) : (
                    <div className="editor-form-box-modern">
                      <div className="editor-form-header-modern">
                        <h2>직접 작성 시작</h2>
                        <p>먼저 빈 카드를 만든 뒤 템플릿, 브랜드 정보, 내용을 순서대로 설정합니다.</p>
                      </div>

                      <button
                        className="ai-generation-submit-btn-modern"
                        onClick={() => {
                          createManualCard()
                          setAutoStep(2)
                        }}
                        type="button"
                      >
                        <span>카드 추가하고 시작하기</span>
                        <svg className="submit-btn-pencil-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                        </svg>
                      </button>
                    </div>
                  )}
                </section>


              </div>
            )}

            {/* Step 2: 템플릿 및 레이아웃 선택 */}
            {autoStep === 2 && (
              <div className="wizard-layout-2col-modern template-select-step">
                <section className="wizard-middle-col-modern expanded">
                  <div className="editor-form-header-modern">
                    <h2>템플릿 레이아웃 선택</h2>
                    <p>오버레이, 상단 사진 분할, 흐름식 카드뉴스 중 전체 카드뉴스에 기본 적용할 레이아웃을 골라주세요.</p>
                  </div>

                  <div className="template-option-grid-modern">
                    {(creationMode === 'manual' ? DIRECT_TEMPLATE_OPTIONS : AUTO_TEMPLATE_OPTIONS).map((template) => {
                      const isActive = cardLayout === template.layout
                      return (
                        <button
                          key={template.id}
                          className={`template-option-card-modern ${isActive ? 'active' : ''}`}
                          onClick={() => {
                            if (creationMode === 'manual') {
                              setSelectedDirectTemplateId(template.id)
                              setDirectTemplateAccentColor(template.accent)
                            } else {
                              setSelectedAutoTemplateId(template.id)
                            }

                            applyProjectCardLayout(template.layout)
                          }}
                          type="button"
                        >
                          <TemplateLayoutPreview
                            accent={isActive ? topicAccentColor : template.accent}
                            layout={template.layout}
                          />
                          <strong>{template.title}</strong>
                          <p>{template.description}</p>
                          <div className="template-card-check-modern">
                            {isActive && (
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  <div className="form-section-modern brand-template-section-modern">
                    <strong>브랜드 기본 정보 설정</strong>
                    <p>선택한 템플릿에 들어갈 브랜드명, 로고, 보조 문구를 함께 정합니다.</p>
                    <div className="manual-inputs-stack-modern compact">
                      <label className="field-modern">
                        <span>브랜드 명칭</span>
                        <input
                          aria-label="브랜드 명칭"
                          className="wizard-input-modern"
                          onChange={(event) => setBrandName(event.target.value)}
                          placeholder="카드 상단에 들어갈 브랜드명"
                          value={brandName}
                        />
                      </label>
                      <label className="field-modern">
                        <span>메인 문구</span>
                        <input
                          aria-label="메인 문구"
                          className="wizard-input-modern"
                          onChange={(event) => setProjectTitle(event.target.value)}
                          placeholder="예: SNS 카드뉴스 만들기"
                          value={projectTitle}
                        />
                      </label>
                      <label className="field-modern">
                        <span>보조 문구</span>
                        <input
                          aria-label="보조 문구"
                          className="wizard-input-modern"
                          onChange={(event) => setProjectBadge(event.target.value)}
                          placeholder="하단 또는 배지에 들어갈 문구"
                          value={projectBadge}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="form-section-modern logo-control-modern">
                    <strong>로고 설정</strong>
                    <p>등록한 로고는 카드뉴스 상단 브랜드 영역과 다운로드 이미지에 함께 적용됩니다.</p>
                    {appIcon == null ? (
                      <button
                        aria-label="로고 이미지 업로드"
                        className="brand-upload-zone-modern compact"
                        onClick={requestLogoUpload}
                        type="button"
                      >
                        <span className="brand-upload-icon-box" aria-hidden="true">+</span>
                        <strong>로고 이미지 등록</strong>
                        <span>PNG 또는 JPG 권장</span>
                      </button>
                    ) : (
                      <div className="brand-logo-preview-card-modern">
                        <img src={appIcon} alt="" />
                        <div className="brand-logo-info-modern">
                          <strong>등록된 로고</strong>
                          <span>미리보기와 내보내기에 반영됩니다.</span>
                        </div>
                        <div className="brand-logo-actions-modern">
                          <button className="mini-button-modern" onClick={requestLogoUpload} type="button">
                            교체
                          </button>
                          <button className="mini-button-modern" onClick={() => setAppIcon(null)} type="button">
                            삭제
                          </button>
                        </div>
                      </div>
                    )}

                    <label className="editor-range-field-modern">
                      <span>로고 크기 조절</span>
                      <input
                        aria-label="로고 크기 조절"
                        className="wizard-range-modern"
                        max="1.8"
                        min="0.55"
                        onChange={(event) => setLogoScale(Number(event.target.value))}
                        step="0.05"
                        type="range"
                        value={logoScale}
                      />
                    </label>
                  </div>

                  <div className="form-section-modern color-setup-section-modern">
                    <strong>브랜드 대표 컬러 지정</strong>
                    <p>대표 컬러를 적용하여 카드뉴스 톤을 맞춥니다.</p>
                    <div className="brand-color-palettes-modern">
                      {['#F15A24', '#1868DB', '#0F8A8D', '#1C2B42', '#64748B'].map((color) => {
                        const isSelected = topicAccentColor.toLowerCase() === color.toLowerCase()
                        return (
                          <button
                            key={color}
                            type="button"
                            className={`brand-color-circle-modern ${isSelected ? 'active' : ''}`}
                            style={{ backgroundColor: color }}
                            onClick={() => applyCustomColor(color)}
                            aria-label={`색상 ${color}`}
                          />
                        )
                      })}
                      <div className="brand-color-custom-trigger">
                        <input
                          aria-label="템플릿 컬러 직접 지정"
                          className="theme-color-input-modern"
                          onChange={(event) => applyCustomColor(event.target.value)}
                          onInput={(event) => applyCustomColor(event.currentTarget.value)}
                          type="color"
                          value={topicAccentColor}
                        />
                        <div className="brand-color-plus-icon" aria-hidden="true">+</div>
                      </div>
                      <strong className="color-code-display-modern">{topicAccentColor.toUpperCase()}</strong>
                    </div>
                  </div>

                  <button className="primary-stage-button-modern next highlight align-self-start" onClick={() => setAutoStep(3)} type="button">
                    템플릿 및 컬러 적용 후 다음 단계로 →
                  </button>
                </section>

                <section className="wizard-right-col-modern">
                  <div className="preview-header-row-modern">
                    <strong>실시간 미리보기</strong>
                    <div className="preview-template-pill-modern">레이아웃 스타일 확인</div>
                  </div>
                  <div className="preview-container-mockup-modern">
                    <SlidePreview
                      appIcon={appIcon}
                      logoScale={logoScale}
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
                </section>
              </div>
            )}

            {/* Step 3: 내용 입력 (카드별 텍스트 편집) */}
            {autoStep === 3 && activeSlide != null && (
              <div className="wizard-layout-3col-modern content-edit-step">

                <aside className="wizard-sidebar-col-modern rail-col">
                  <div className="sidebar-section-title-modern">카드 목록</div>
                  <div className="sidebar-card-scroll-rail-modern">
                    {slides.map((slide, index) => (
                      <button
                        key={slide.id}
                        className={`mini-rail-card-item-modern ${slide.id === activeSlide.id ? 'active' : ''}`}
                        onClick={() => setActiveSlideId(slide.id)}
                        type="button"
                      >
                        <div className="mini-rail-card-thumb-modern">
                          <SlidePreview
                            appIcon={appIcon}
                      logoScale={logoScale}
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
                        <div className="mini-rail-card-meta-modern">
                          <strong>{index + 1}번 슬라이드</strong>
                          <p>{slide.title || '제목 없음'}</p>
                        </div>
                      </button>
                    ))}
                    <button className="mini-rail-add-btn-modern-full" onClick={createManualCard} type="button">
                      + 새 카드 추가
                    </button>
                  </div>
                </aside>


                <section className="wizard-middle-col-modern editing-col">
                  <div className="editor-form-header-modern">
                    <h2>내용 입력 및 카피 편집</h2>
                    <p>현재 선택된 {activeSlideIndex + 1}번 카드의 상단 라벨, 제목, 본문 등을 입력해주세요.</p>
                  </div>

                  <div className="manual-inputs-stack-modern">
                    <label className="field-modern">
                      <span>상단 라벨 (Kicker)</span>
                      <input
                        aria-label="카드 상단 라벨"
                        value={activeSlide.kicker}
                        onChange={(event) => updateSlideField(activeSlide.id, 'kicker', event.target.value)}
                        placeholder="상단 라벨을 입력하세요"
                        className="wizard-input-modern"
                      />
                    </label>
                    <label className="field-modern">
                      <span>카드 제목</span>
                      <input
                        aria-label="카드 제목"
                        value={activeSlide.title}
                        onChange={(event) => updateSlideField(activeSlide.id, 'title', event.target.value)}
                        placeholder="카드 제목을 입력하세요"
                        className="wizard-input-modern"
                      />
                    </label>
                    <label className="field-modern">
                      <span>내용1</span>
                      <textarea
                        aria-label="카드 본문 내용1"
                        rows={5}
                        value={activeSlide.description}
                        onChange={(event) => updateSlideField(activeSlide.id, 'description', event.target.value)}
                        placeholder="가운데 본문에 들어갈 상세 내용을 입력하세요"
                        className="wizard-textarea-modern inline"
                      />
                    </label>
                    {resolveSlideLayout(activeSlide) === 'sequence' && (
                      <label className="field-modern">
                        <span>하단 강조 내용</span>
                        <textarea
                          aria-label="카드 하단 내용2"
                          rows={3}
                          value={activeSlide.content2 ?? ''}
                          onChange={(event) => updateSlideField(activeSlide.id, 'content2', event.target.value)}
                          placeholder="하단 강조 영역에 들어갈 추가 문장을 입력하세요"
                          className="wizard-textarea-modern inline"
                        />
                      </label>
                    )}
                    <label className="field-modern">
                      <span>배지/푸터 문구</span>
                      <input
                        aria-label="카드 배지 문구"
                        className="wizard-input-modern"
                        onChange={(event) => updateSlideField(activeSlide.id, 'badge', event.target.value)}
                        placeholder="하단 배지 또는 푸터에 들어갈 문구"
                        value={activeSlide.badge}
                      />
                    </label>
                  </div>

                  <div className="wizard-action-footer-inline-modern">
                    <button className="top-action-btn secondary" disabled={activeSlideIndex <= 0} onClick={() => moveSlide(activeSlide.id, -1)} type="button">
                      위로 이동
                    </button>
                    <button className="top-action-btn secondary" disabled={activeSlideIndex === slides.length - 1} onClick={() => moveSlide(activeSlide.id, 1)} type="button">
                      아래로 이동
                    </button>
                    <button className="top-action-btn secondary danger" onClick={() => removeSlide(activeSlide.id)} type="button">
                      카드 삭제
                    </button>
                    <button className="top-action-btn primary" onClick={() => setAutoStep(4)} type="button">
                      디자인 세부 설정 →
                    </button>
                  </div>
                </section>


                <section className="wizard-right-col-modern preview-col">
                  <div className="preview-header-row-modern">
                    <strong>선택된 카드 미리보기</strong>
                    <div className="preview-template-pill-modern">{activeSlideIndex + 1} / {slides.length}</div>
                  </div>
                  <div className="preview-container-mockup-modern">
                    <SlidePreview
                      appIcon={appIcon}
                      logoScale={logoScale}
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
                </section>
              </div>
            )}

            {/* Step 4: 디자인 설정 */}
            {autoStep === 4 && activeSlide != null && (
              <div className="wizard-layout-3col-modern design-setup-step">

                <aside className="wizard-sidebar-col-modern rail-col">
                  <div className="sidebar-section-title-modern">카드 목록</div>
                  <div className="sidebar-card-scroll-rail-modern">
                    {slides.map((slide, index) => (
                      <button
                        key={slide.id}
                        className={`mini-rail-card-item-modern ${slide.id === activeSlide.id ? 'active' : ''}`}
                        onClick={() => setActiveSlideId(slide.id)}
                        type="button"
                      >
                        <div className="mini-rail-card-thumb-modern">
                          <SlidePreview
                            appIcon={appIcon}
                      logoScale={logoScale}
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
                        <div className="mini-rail-card-meta-modern">
                          <strong>{index + 1}번 슬라이드</strong>
                          <p>{slide.title || '제목 없음'}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </aside>


                <section className="wizard-middle-col-modern design-options-col">
                  <div className="editor-form-header-modern">
                    <h2>디자인 세부 설정</h2>
                    <p>폰트, 텍스트 크기, 이미지 구도 및 위치를 마우스 드래그로 직접 조절해보세요.</p>
                  </div>

                  <div className="form-section-modern font-selection-modern">
                    <strong>글꼴 선택</strong>
                    <select
                      className="wizard-select-modern"
                      value={activeSlide.fontPreset ?? 'pretendard'}
                      onChange={(event) => updateSlideField(activeSlide.id, 'fontPreset', event.target.value)}
                    >
                      {fontPresetOptions.map((fontOption) => (
                        <option key={fontOption.id} value={fontOption.id}>
                          {fontOption.label}
                        </option>
                      ))}
                    </select>

                    <label className="editor-range-field-modern">
                      <span>글꼴 크기 조절</span>
                      <input
                        max="1.25"
                        min="0.82"
                        onChange={(event) => updateSlideNumberField(activeSlide.id, 'fontScale', Number(event.target.value))}
                        step="0.01"
                        type="range"
                        value={activeSlide.fontScale ?? 1}
                        className="wizard-range-modern"
                      />
                    </label>
                  </div>

                  <div className="form-section-modern layout-setup-modern">
                    <strong>개별 카드 레이아웃</strong>
                    <p>이 카드에만 독립적인 레이아웃을 부여할 수 있습니다.</p>
                    <div className="editor-layout-grid-modern">
                      {(['global', 'sequence', 'overlay', 'split-light', 'split-dark'] as const).map((layoutOption) => {
                        const isActive = activeSlide.cardLayout === layoutOption || (layoutOption === 'global' && (!activeSlide.cardLayout || activeSlide.cardLayout === 'global'))
                        const label = layoutOption === 'global' ? '기본값 따름' : layoutOption === 'sequence' ? '카드뉴스형' : layoutOption === 'overlay' ? '오버레이' : layoutOption === 'split-light' ? '하단흰색' : '하단검정'
                        return (
                          <button
                            key={layoutOption}
                            className={`editor-layout-button-modern ${isActive ? 'active' : ''}`}
                            onClick={() => updateSlideField(activeSlide.id, 'cardLayout', layoutOption)}
                            type="button"
                          >
                            {label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="form-section-modern photo-cropping-modern">
                    <strong>사진 구도 조절 (위치 / 확대)</strong>
                    <p>아래 영역의 이미지를 마우스로 클릭 후 드래그하여 배경 사진을 배치하세요.</p>
                    <CropEditor
                      preset={activePreset}
                      slide={activeSlide}
                      slideIndex={activeSlideIndex}
                      totalSlides={slides.length}
                      onFramingChange={(nextFraming) => {
                        updateSlideFraming(activeSlide.id, nextFraming)
                      }}
                    />
                  </div>

                  <button className="primary-stage-button-modern next highlight align-self-start" onClick={() => setAutoStep(5)} type="button">
                    디자인 적용 후 다운로드 단계로 →
                  </button>
                </section>


                <section className="wizard-right-col-modern preview-col">
                  <div className="preview-header-row-modern">
                    <strong>디자인 조율 미리보기</strong>
                    <div className="preview-template-pill-modern">{activeSlideIndex + 1} / {slides.length}</div>
                  </div>
                  <div className="preview-container-mockup-modern">
                    <SlidePreview
                      appIcon={appIcon}
                      logoScale={logoScale}
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
                </section>
              </div>
            )}

            {/* Step 5: 결과 확인 */}
            {autoStep === 5 && (
              <div className="wizard-layout-full-modern results-step">
                <div className="results-header-modern">
                  <h2>모든 카드가 완성이 되었습니다!</h2>
                  <p>아래에서 완성된 카드 목록을 한눈에 보고 로컬 이미지 파일로 저장할 수 있습니다.</p>
                </div>

                <div className="export-options-box-modern">
                  <div className="export-action-card-modern">
                    <strong>전체 카드 한 번에 저장하기</strong>
                    <p>모든 카드 이미지를 고해상도 PNG 파일로 한 번에 추출합니다.</p>
                    <div className="export-action-row-modern">
                      <button
                        className="export-action-btn-modern primary"
                        disabled={canExport === false}
                        onClick={handleExportWithRewarded}
                        type="button"
                      >
                        전체 카드 다운로드
                      </button>
                      {interstitialAdGroupId && (
                        <button
                          className="export-action-btn-modern secondary"
                          disabled={canExport === false}
                          onClick={handleExportWithInterstitial}
                          type="button"
                        >
                          광고 시청 후 저장
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="results-grid-header-modern">
                  <h3>최종 카드 뉴스 그리드 ({slides.length}장)</h3>
                </div>

                <div className="results-preview-grid-modern">
                  {slides.map((slide, index) => (
                    <button
                      key={slide.id}
                      className="grid-card-wrapper-btn-modern"
                      onClick={() => {
                        setActiveSlideId(slide.id)
                        setAutoStep(3)
                      }}
                      type="button"
                    >
                      <div className="grid-card-preview-stage-modern">
                        <SlidePreview
                          appIcon={appIcon}
                      logoScale={logoScale}
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
                      </div>
                      <span className="grid-card-num-modern">{index + 1}번 카드 편집</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {autoStep === 1 && creationMode != null && (
        <footer className="wizard-footer-bar-modern">
          <div className="footer-stats-modern">
            <div className="stat-item-modern">
              <span>선택한 제작 방식</span>
              <strong className="orange-pill-modern">
                {creationMode === 'auto' ? '자동 생성' : '직접 작성'}
              </strong>
            </div>
            <div className="stat-divider-modern" />
            <div className="stat-item-modern">
              <span>예상 카드 수</span>
              <strong>
                {creationMode === 'auto' ? `${autoSlideCount}장` : `${slides.length}장`}
              </strong>
            </div>
            <div className="stat-divider-modern" />
            <div className="stat-item-modern">
              <span>톤앤매너</span>
              <strong className="black-text-modern">
                {creationMode === 'auto'
                  ? (toneManner === 'clean' ? '깔끔한' : toneManner === 'friendly' ? '친근한' : toneManner === 'professional' ? '전문적인' : '감성적인')
                  : '직접 선택'
                }
              </strong>
            </div>
            <div className="stat-divider-modern" />
            <div className="stat-item-modern">
              <span>예상 소요 시간</span>
              <strong className="black-text-modern">
                {creationMode === 'auto' ? '약 30초' : '즉시'}
              </strong>
            </div>
          </div>
          <div className="footer-tip-modern">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span>
              {creationMode === 'auto'
                ? '다음 단계에서 템플릿을 선택하고 AI가 구성한 내용을 확인할 수 있어요.'
                : '다음 단계에서 템플릿을 선택하고 본문을 직접 입력할 수 있어요.'
              }
            </span>
          </div>
        </footer>
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
                    onClick={handleExportWithRewarded}
                    type="button"
                  >
                    전체 PNG 저장
                  </button>
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
                      onClick={() => {
                        setActiveSlideId(slide.id)
                        setShowPreviewModal(false)
                        setAutoStep(3)
                      }}
                      type="button"
                    >
                      <SlidePreview
                        appIcon={appIcon}
                      logoScale={logoScale}
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

      {showApiKeyModal ? (
        <div
          className="help-modal-backdrop"
          onClick={() => setShowApiKeyModal(false)}
          role="presentation"
        >
          <div
            aria-labelledby="api-key-modal-title"
            aria-modal="true"
            className="help-modal api-key-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="help-modal-head">
              <strong id="api-key-modal-title">API Key 설정</strong>
              <button
                className="help-modal-close"
                onClick={() => setShowApiKeyModal(false)}
                type="button"
              >
                닫기
              </button>
            </div>
            <div className="help-modal-body">
              <div className="api-provider-switch" role="radiogroup" aria-label="AI API 제공자 선택">
                <button
                  aria-checked={aiApiProvider === 'gpt'}
                  className={aiApiProvider === 'gpt' ? 'api-provider-option active' : 'api-provider-option'}
                  onClick={() => setAiApiProvider('gpt')}
                  role="radio"
                  type="button"
                >
                  <strong>GPT</strong>
                  <span>OpenAI API key</span>
                </button>
                <button
                  aria-checked={aiApiProvider === 'gemini'}
                  className={aiApiProvider === 'gemini' ? 'api-provider-option active' : 'api-provider-option'}
                  onClick={() => setAiApiProvider('gemini')}
                  role="radio"
                  type="button"
                >
                  <strong>Gemini</strong>
                  <span>Google AI Studio key</span>
                </button>
              </div>
              <label className="field-modern api-key-modal-field">
                <span className="brand-setup-label">
                  {aiApiProvider === 'gpt' ? 'GPT API Key' : 'Gemini API Key'}
                </span>
                <input
                  aria-label={aiApiProvider === 'gpt' ? 'GPT API Key' : 'Gemini API Key'}
                  autoComplete="off"
                  className="wizard-input-modern"
                  onChange={(event) => {
                    if (aiApiProvider === 'gpt') {
                      setGptApiKey(event.target.value)
                      return
                    }

                    setGeminiApiKey(event.target.value)
                  }}
                  placeholder={aiApiProvider === 'gpt' ? 'sk-... 형태의 키를 입력하세요' : 'AIza... 형태의 키를 입력하세요'}
                  type="password"
                  value={aiApiProvider === 'gpt' ? gptApiKey : geminiApiKey}
                />
                <small className="api-key-helper-modern">
                  키는 브라우저 초안에 저장되고, 자동 생성 시 선택한 AI API 호출에만 사용됩니다.
                </small>
              </label>
              <div className="api-key-modal-actions">
                <button
                  className="mini-button-modern"
                  onClick={() => {
                    if (aiApiProvider === 'gpt') {
                      setGptApiKey('')
                      return
                    }

                    setGeminiApiKey('')
                  }}
                  type="button"
                >
                  키 삭제
                </button>
                <button
                  className="primary-stage-button-modern next"
                  onClick={() => setShowApiKeyModal(false)}
                  type="button"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

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
                      logoScale={logoScale}
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
  logoScale?: number
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
  logoScale = 1,
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
                      logoScale={logoScale}
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
  logoScale?: number
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
  logoScale = 1,
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
        logoScale={logoScale}
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
      logoScale={logoScale}
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
  logoScale = 1,
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
        logoScale={logoScale}
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
            justifyContent: 'flex-end',
            alignItems: 'center',
            zIndex: 10,
            color: '#ffffff',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}
        >
          <span style={{ fontSize: labelSize, fontWeight: 700, letterSpacing: '-0.01em' }}>
            {String(slideIndex + 1).padStart(2, '0')} /{' '}
            {String(totalSlides).padStart(2, '0')}
          </span>
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
  logoScale = 1,
  brandName,
  preset,
  slide,
  slideIndex,
  theme,
  totalSlides,
  onCanvasRef,
}: Pick<SlideCanvasProps, 'appIcon' | 'logoScale' | 'brandName' | 'preset' | 'slide' | 'slideIndex' | 'theme' | 'totalSlides'> & {
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
  const normalizedLogoScale = clamp(logoScale, 0.55, 1.8)
  const sequenceLogoSize = preset.width * 0.064 * normalizedLogoScale
  const coverLogoSize = preset.width * 0.048 * normalizedLogoScale
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
              {header.logoSrc != null ? (
                <img
                  className="sequence-cover-logo-image"
                  src={header.logoSrc}
                  alt=""
                  style={{ width: coverLogoSize, height: coverLogoSize }}
                />
              ) : null}
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
            <img
              className="sequence-logo-image"
              src={header.logoSrc}
              alt=""
              style={{ width: sequenceLogoSize, height: sequenceLogoSize }}
            />
          ) : (
            <span
              className="sequence-logo-fallback"
              aria-hidden="true"
              style={{ width: sequenceLogoSize, height: sequenceLogoSize }}
            >
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
  logoScale = 1,
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
  const appIconSize = pillSize * 1.5 * clamp(logoScale, 0.55, 1.8)

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
              {appIcon && <img src={appIcon} alt="" style={{ width: appIconSize, height: appIconSize, borderRadius: appIconSize * 0.2, objectFit: 'cover' }} />}
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
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><rect width="1080" height="1350" fill="#f8f8f8"/><rect x="70" y="70" width="940" height="1210" rx="48" fill="#ffffff"/><rect x="70" y="70" width="940" height="1210" rx="48" fill="none" stroke="${normalizedAccent}" stroke-opacity="0.12" stroke-width="3"/></svg>`

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

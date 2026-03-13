import type { ChangeEvent, CSSProperties } from 'react'
import { useEffect, useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import './App.css'
import {
  captureCameraImage,
  clearDraftValue,
  importAlbumImages,
  isAppsInTossRuntime,
  loadDraftValue,
  optimizeLocalImage,
  saveDraftValue,
  savePngDataUrl,
  type ImportedImage,
} from './lib/appsInToss'

type OutputMode = 'social' | 'appstore'
type ThemeId = keyof typeof THEMES
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
}

type ProjectDraft = {
  brandName: string
  projectTitle: string
  mode: OutputMode
  presetId: PresetId
  themeId: ThemeId
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

const MAX_SLIDES = 5
const MIN_SLIDES = 3
const DRAFT_KEY = 'card-generator-draft-v1'

const THEMES = {
  ember: {
    pageBackground:
      'radial-gradient(circle at top left, #ffe8da 0%, #f7c7a7 22%, #231815 68%, #110f0f 100%)',
    panelBackground: 'rgba(255, 248, 243, 0.78)',
    panelBorder: 'rgba(128, 70, 43, 0.12)',
    text: '#1b130f',
    muted: 'rgba(27, 19, 15, 0.65)',
    accent: '#dd5e31',
    accentSoft: '#ffcf9a',
    shadow: '0 22px 60px rgba(17, 12, 10, 0.22)',
    socialBackdrop: 'linear-gradient(180deg, #1e1410 0%, #51301f 48%, #f1a873 100%)',
    socialOverlay: 'linear-gradient(180deg, rgba(14, 10, 8, 0.08) 0%, rgba(14, 10, 8, 0.88) 100%)',
    appBackdrop: 'linear-gradient(180deg, #fff2ea 0%, #f1b082 45%, #1b1210 100%)',
    glowA: 'rgba(255, 186, 122, 0.7)',
    glowB: 'rgba(186, 79, 39, 0.56)',
  },
  tide: {
    pageBackground:
      'radial-gradient(circle at top right, #d2fff7 0%, #84d7cb 22%, #0f2e38 60%, #07161e 100%)',
    panelBackground: 'rgba(243, 255, 252, 0.8)',
    panelBorder: 'rgba(26, 92, 102, 0.12)',
    text: '#09222a',
    muted: 'rgba(9, 34, 42, 0.66)',
    accent: '#0f8a8d',
    accentSoft: '#9ef1d8',
    shadow: '0 22px 60px rgba(7, 22, 30, 0.25)',
    socialBackdrop: 'linear-gradient(180deg, #08232c 0%, #144753 48%, #98ead8 100%)',
    socialOverlay: 'linear-gradient(180deg, rgba(6, 24, 30, 0.1) 0%, rgba(6, 24, 30, 0.82) 100%)',
    appBackdrop: 'linear-gradient(180deg, #f0fffc 0%, #8edecf 45%, #0a222a 100%)',
    glowA: 'rgba(167, 255, 226, 0.72)',
    glowB: 'rgba(25, 147, 140, 0.5)',
  },
  graphite: {
    pageBackground:
      'radial-gradient(circle at top center, #f8f5ee 0%, #d3ccc0 26%, #353434 62%, #111112 100%)',
    panelBackground: 'rgba(255, 252, 247, 0.82)',
    panelBorder: 'rgba(68, 60, 50, 0.12)',
    text: '#171514',
    muted: 'rgba(23, 21, 20, 0.66)',
    accent: '#a26d3d',
    accentSoft: '#ead1b0',
    shadow: '0 22px 60px rgba(12, 11, 11, 0.24)',
    socialBackdrop: 'linear-gradient(180deg, #1d1b1a 0%, #3f3a37 44%, #d1b694 100%)',
    socialOverlay: 'linear-gradient(180deg, rgba(18, 16, 16, 0.08) 0%, rgba(18, 16, 16, 0.85) 100%)',
    appBackdrop: 'linear-gradient(180deg, #fcf8f2 0%, #d9ccb8 44%, #151415 100%)',
    glowA: 'rgba(255, 232, 194, 0.68)',
    glowB: 'rgba(162, 109, 61, 0.46)',
  },
} satisfies Record<string, Theme>

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

function App() {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const exportRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const bridgeAvailable = isAppsInTossRuntime()

  const [brandName, setBrandName] = useState('카드 제너레이터')
  const [projectTitle, setProjectTitle] = useState(
    '이미지 몇 장만으로 바로 꺼내 쓰는 카드뉴스 메이커',
  )
  const [mode, setMode] = useState<OutputMode>('social')
  const [presetId, setPresetId] = useState<PresetId>('social-portrait')
  const [themeId, setThemeId] = useState<ThemeId>('ember')
  const [slides, setSlides] = useState<SlideDraft[]>([])
  const [notice, setNotice] = useState(
    '이미지 3~5장을 넣으면 카드뉴스 또는 앱스토어 소개 이미지 흐름을 바로 만들 수 있어요.',
  )
  const [busyLabel, setBusyLabel] = useState('')
  const [isDraftReady, setIsDraftReady] = useState(false)

  const activePreset =
    PRESETS.find((preset) => preset.id === presetId) ?? PRESETS[1]
  const activeTheme = THEMES[themeId]
  const presetsForMode = PRESETS.filter((preset) => preset.mode === mode)
  const canExport = slides.length > 0 && busyLabel === ''

  useEffect(() => {
    void restoreDraft()
  }, [])

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
    if (isDraftReady === false) {
      return
    }

    const timer = window.setTimeout(() => {
      const payload: ProjectDraft = {
        brandName,
        projectTitle,
        mode,
        presetId,
        themeId,
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
  }, [brandName, projectTitle, mode, presetId, themeId, slides, isDraftReady])

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

      if (
        typeof parsedDraft.themeId === 'string' &&
        parsedDraft.themeId in THEMES
      ) {
        setThemeId(parsedDraft.themeId as ThemeId)
      }

      if (Array.isArray(parsedDraft.slides)) {
        setSlides(parsedDraft.slides.slice(0, MAX_SLIDES))
      }

      setNotice('이전 초안을 불러왔어요. 바로 이어서 편집할 수 있습니다.')
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

    setBusyLabel('로컬 이미지를 정리하는 중...')

    try {
      const remaining = MAX_SLIDES - slides.length
      const optimizedImages = await Promise.all(
        imageFiles.slice(0, remaining).map((file) => optimizeLocalImage(file)),
      )

      appendSlides(optimizedImages)

      if (imageFiles.length > remaining) {
        setNotice('최대 5장까지만 유지해서 나머지 이미지는 제외했어요.')
      } else {
        setNotice('로컬 이미지를 카드 흐름에 추가했어요.')
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

  async function handleAlbumImport() {
    if (bridgeAvailable === false) {
      setNotice('브라우저 미리보기에서는 로컬 업로드를 사용해 주세요.')
      return
    }

    if (slides.length >= MAX_SLIDES) {
      setNotice('이미지는 최대 5장까지만 담을 수 있어요.')
      return
    }

    setBusyLabel('앱인토스 앨범을 여는 중...')

    try {
      const images = await importAlbumImages(MAX_SLIDES - slides.length)
      appendSlides(images)
      setNotice('앱인토스 앨범 이미지를 가져왔어요.')
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : '앱인토스 앨범을 불러오지 못했어요.',
      )
    } finally {
      setBusyLabel('')
    }
  }

  async function handleCameraCapture() {
    if (bridgeAvailable === false) {
      setNotice('브라우저 미리보기에서는 카메라 대신 로컬 업로드를 사용해 주세요.')
      return
    }

    if (slides.length >= MAX_SLIDES) {
      setNotice('이미지는 최대 5장까지만 담을 수 있어요.')
      return
    }

    setBusyLabel('카메라를 여는 중...')

    try {
      const image = await captureCameraImage()
      appendSlides([image])
      setNotice('카메라 이미지를 카드 흐름에 추가했어요.')
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : '카메라 촬영을 완료하지 못했어요.',
      )
    } finally {
      setBusyLabel('')
    }
  }

  async function handleExportSlide(slideId: string, index: number) {
    const node = exportRefs.current[slideId]

    if (node == null) {
      setNotice('내보낼 슬라이드를 아직 준비하지 못했어요.')
      return
    }

    setBusyLabel(`슬라이드 ${index + 1}번을 저장하는 중...`)

    try {
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 1,
      })

      await savePngDataUrl(buildFileName(brandName, mode, index), dataUrl)
      setNotice(`슬라이드 ${index + 1}번을 PNG로 저장했어요.`)
    } catch {
      setNotice('슬라이드를 PNG로 내보내는 데 실패했어요.')
    } finally {
      setBusyLabel('')
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

        const dataUrl = await toPng(node, {
          cacheBust: true,
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

  async function handleResetProject() {
    setSlides([])
    setMode('social')
    setPresetId('social-portrait')
    setThemeId('ember')
    setProjectTitle('이미지 몇 장만으로 바로 꺼내 쓰는 카드뉴스 메이커')
    setNotice('현재 편집 중인 슬라이드를 비웠어요. 새 프로젝트를 시작합니다.')
    await clearDraftValue(DRAFT_KEY)
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

  function updateSlideField(
    slideId: string,
    field: keyof Pick<SlideDraft, 'kicker' | 'title' | 'description' | 'badge'>,
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
    '--page-background': activeTheme.pageBackground,
    '--panel-background': activeTheme.panelBackground,
    '--panel-border': activeTheme.panelBorder,
    '--text-color': activeTheme.text,
    '--muted-color': activeTheme.muted,
    '--accent-color': activeTheme.accent,
    '--accent-soft': activeTheme.accentSoft,
    '--panel-shadow': activeTheme.shadow,
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

      <header className="hero-shell">
        <div className="hero-copy">
          <p className="eyebrow">
            {bridgeAvailable ? 'AppsInToss 연결됨' : '브라우저 미리보기 모드'}
          </p>
          <h1>카드뉴스 / 앱스토어 이미지 제너레이터</h1>
          <p className="hero-description">
            이미지 3~5장을 넣고, 장별 카피만 다듬으면 SNS 카드뉴스와 앱스토어
            소개 이미지를 바로 저장할 수 있는 MVP입니다.
          </p>
        </div>

        <div className="hero-stat">
          <span>현재 장수</span>
          <strong>{slides.length}</strong>
          <p>
            권장 범위는 {MIN_SLIDES}~{MAX_SLIDES}장입니다.
          </p>
        </div>
      </header>

      <section className="panel-grid">
        <section className="panel">
          <div className="panel-head">
            <h2>프로젝트 설정</h2>
            <p>출력 모드, 브랜드 이름, 기본 메시지를 먼저 정합니다.</p>
          </div>

          <div className="field-grid two-column">
            <label className="field">
              <span>서비스 이름</span>
              <input
                value={brandName}
                onChange={(event) => setBrandName(event.target.value)}
                placeholder="서비스 이름"
              />
            </label>

            <label className="field">
              <span>메인 메시지</span>
              <input
                value={projectTitle}
                onChange={(event) => setProjectTitle(event.target.value)}
                placeholder="프로젝트 메시지"
              />
            </label>
          </div>

          <div className="option-group">
            <span className="option-label">출력 모드</span>
            <div className="chip-row">
              <button
                className={mode === 'social' ? 'chip active' : 'chip'}
                onClick={() => setMode('social')}
                type="button"
              >
                SNS 카드뉴스
              </button>
              <button
                className={mode === 'appstore' ? 'chip active' : 'chip'}
                onClick={() => setMode('appstore')}
                type="button"
              >
                앱스토어 소개 이미지
              </button>
            </div>
          </div>

          <div className="option-group">
            <span className="option-label">해상도</span>
            <div className="chip-row">
              {presetsForMode.map((preset) => (
                <button
                  key={preset.id}
                  className={preset.id === presetId ? 'chip active' : 'chip'}
                  onClick={() => setPresetId(preset.id)}
                  type="button"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="option-group">
            <span className="option-label">테마</span>
            <div className="chip-row">
              {Object.keys(THEMES).map((themeKey) => (
                <button
                  key={themeKey}
                  className={themeId === themeKey ? 'chip active' : 'chip'}
                  onClick={() => setThemeId(themeKey as ThemeId)}
                  type="button"
                >
                  {themeLabel(themeKey as ThemeId)}
                </button>
              ))}
            </div>
          </div>

          <div className="action-row">
            <button
              className="action-button"
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              로컬 이미지 추가
            </button>
            <button
              className="action-button secondary"
              disabled={bridgeAvailable === false || slides.length >= MAX_SLIDES}
              onClick={handleAlbumImport}
              type="button"
            >
              앱인토스 앨범 불러오기
            </button>
            <button
              className="action-button secondary"
              disabled={bridgeAvailable === false || slides.length >= MAX_SLIDES}
              onClick={handleCameraCapture}
              type="button"
            >
              카메라 촬영
            </button>
          </div>
        </section>

        <aside className="panel notice-panel">
          <div className="panel-head">
            <h2>현재 상태</h2>
            <p>작업 중 필요한 제약과 다음 액션을 계속 보여줍니다.</p>
          </div>

          <div className="notice-box">
            <strong>{busyLabel || '준비 완료'}</strong>
            <p>{notice}</p>
          </div>

          <ul className="checklist">
            <li>영상 입력은 아직 제외했고, 이번 버전은 이미지 흐름에 집중합니다.</li>
            <li>저장은 PNG 우선이며, 앱인토스 환경에서는 기기 저장으로 연결됩니다.</li>
            <li>앱스토어 모드는 한 장당 한 메시지 원칙으로 설계했습니다.</li>
          </ul>

          <div className="action-row">
            <button
              className="action-button secondary"
              disabled={canExport === false}
              onClick={handleExportAll}
              type="button"
            >
              전체 PNG 저장
            </button>
            <button
              className="action-button secondary"
              onClick={() => {
                void saveDraftValue(
                  DRAFT_KEY,
                  JSON.stringify({
                    brandName,
                    projectTitle,
                    mode,
                    presetId,
                    themeId,
                    slides,
                    updatedAt: new Date().toISOString(),
                  } satisfies ProjectDraft),
                )
                  .then(() => {
                    setNotice('초안을 바로 저장했어요.')
                  })
                  .catch((error) => {
                    setNotice(
                      error instanceof Error
                        ? error.message
                        : '초안을 저장하지 못했어요.',
                    )
                  })
              }}
              type="button"
            >
              초안 저장
            </button>
            <button
              className="action-button ghost"
              onClick={() => {
                void handleResetProject()
              }}
              type="button"
            >
              새 프로젝트
            </button>
          </div>
        </aside>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>슬라이드 편집</h2>
          <p>
            이미지를 넣으면 장별 기본 카피를 자동으로 채웁니다. 여기서 제목과
            설명만 다듬으면 됩니다.
          </p>
        </div>

        {slides.length === 0 ? (
          <div className="empty-state">
            <strong>아직 슬라이드가 없습니다.</strong>
            <p>로컬 이미지나 앱인토스 앨범에서 3~5장을 넣어 주세요.</p>
          </div>
        ) : (
          <div className="editor-list">
            {slides.map((slide, index) => (
              <article key={slide.id} className="editor-card">
                <div className="editor-media">
                  <img src={slide.dataUrl} alt={slide.name} />
                  <span>
                    {index + 1} / {slides.length}
                  </span>
                </div>

                <div className="editor-fields">
                  <div className="field-grid two-column">
                    <label className="field">
                      <span>상단 라벨</span>
                      <input
                        value={slide.kicker}
                        onChange={(event) =>
                          updateSlideField(slide.id, 'kicker', event.target.value)
                        }
                      />
                    </label>

                    <label className="field">
                      <span>보조 배지</span>
                      <input
                        value={slide.badge}
                        onChange={(event) =>
                          updateSlideField(slide.id, 'badge', event.target.value)
                        }
                      />
                    </label>
                  </div>

                  <label className="field">
                    <span>헤드라인</span>
                    <input
                      value={slide.title}
                      onChange={(event) =>
                        updateSlideField(slide.id, 'title', event.target.value)
                      }
                    />
                  </label>

                  <label className="field">
                    <span>설명</span>
                    <textarea
                      rows={3}
                      value={slide.description}
                      onChange={(event) =>
                        updateSlideField(slide.id, 'description', event.target.value)
                      }
                    />
                  </label>

                  <div className="inline-actions">
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
                    <button
                      className="mini-button ghost"
                      onClick={() => removeSlide(slide.id)}
                      type="button"
                    >
                      삭제
                    </button>
                    <button
                      className="mini-button accent"
                      disabled={busyLabel !== ''}
                      onClick={() => {
                        void handleExportSlide(slide.id, index)
                      }}
                      type="button"
                    >
                      이 장 저장
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>미리보기</h2>
          <p>
            지금 선택한 {activePreset.label} 기준으로 실제 내보내기 크기를 축소해
            보여줍니다.
          </p>
        </div>

        <div className="preview-grid">
          {slides.map((slide, index) => (
            <SlidePreview
              key={slide.id}
              brandName={brandName}
              mode={mode}
              preset={activePreset}
              projectTitle={projectTitle}
              slide={slide}
              slideIndex={index}
              theme={activeTheme}
              totalSlides={slides.length}
              onExportRef={(node) => {
                exportRefs.current[slide.id] = node
              }}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

type SlidePreviewProps = {
  brandName: string
  mode: OutputMode
  preset: Preset
  projectTitle: string
  slide: SlideDraft
  slideIndex: number
  theme: Theme
  totalSlides: number
  onExportRef: (node: HTMLDivElement | null) => void
}

function SlidePreview({
  brandName,
  mode,
  preset,
  projectTitle,
  slide,
  slideIndex,
  theme,
  totalSlides,
  onExportRef,
}: SlidePreviewProps) {
  const previewWidth = mode === 'appstore' ? 310 : 360
  const previewHeight = mode === 'appstore' ? 540 : 420
  const scale = Math.min(previewWidth / preset.width, previewHeight / preset.height)
  const scaledHeight = Math.round(preset.height * scale)

  return (
    <article className="preview-card">
      <div className="preview-stage" style={{ height: scaledHeight }}>
        <div
          className="preview-scale"
          style={{
            width: preset.width,
            height: preset.height,
            transform: `scale(${scale})`,
          }}
        >
          <SlideCanvas
            onCanvasRef={onExportRef}
            brandName={brandName}
            mode={mode}
            preset={preset}
            projectTitle={projectTitle}
            slide={slide}
            slideIndex={slideIndex}
            theme={theme}
            totalSlides={totalSlides}
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
  brandName: string
  mode: OutputMode
  preset: Preset
  projectTitle: string
  slide: SlideDraft
  slideIndex: number
  theme: Theme
  totalSlides: number
}

function SlideCanvas({
  brandName,
  mode,
  preset,
  projectTitle,
  slide,
  slideIndex,
  theme,
  totalSlides,
  onCanvasRef,
}: SlideCanvasProps & {
  onCanvasRef?: (node: HTMLDivElement | null) => void
}) {
  if (mode === 'appstore') {
    return (
      <AppStoreSlide
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
      className="slide-canvas social-slide"
      style={{
        width: preset.width,
        height: preset.height,
        background: theme.socialBackdrop,
      }}
    >
      <img className="social-image" src={slide.dataUrl} alt={slide.name} draggable={false} />
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
        <PhoneMockup src={slide.dataUrl} />
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

function PhoneMockup({ src }: { src: string }) {
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
        <img src={src} alt="" draggable={false} />
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
  }
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

function themeLabel(themeId: ThemeId) {
  switch (themeId) {
    case 'ember':
      return 'Ember'
    case 'tide':
      return 'Tide'
    case 'graphite':
      return 'Graphite'
  }
}

function buildFileName(brandName: string, mode: OutputMode, index: number) {
  const slug = brandName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  const safeBrand = slug.length > 0 ? slug : 'card-generator'
  const safeMode = mode === 'appstore' ? 'app-store' : 'social'

  return `${safeBrand}-${safeMode}-${String(index + 1).padStart(2, '0')}.png`
}

export default App

import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import type { CSSProperties } from 'react'
import { generateCardNewsDraft, getSequenceCardVariant } from '../cardNewsDraft'
import type { CardNewsDraftStyle, GeneratedSlideDraft } from '../cardNewsDraft'
import { SLIDE_DURATION_IN_FRAMES, TRANSITION_IN_FRAMES } from './videoTiming'

export type CardNewsVideoProps = {
  readonly topic?: string
  readonly brandName?: string
  readonly accentColor?: string
  readonly style?: CardNewsDraftStyle
}

export function CardNewsVideo({
  topic = 'AI 마케팅',
  brandName = 'SNS 카드뉴스 생성기',
  accentColor = '#1247d8',
  style = 'informative',
}: CardNewsVideoProps) {
  const { fps } = useVideoConfig()
  const frame = useCurrentFrame()
  const project = generateCardNewsDraft(topic, {
    accentColor,
    brandName,
    slideCount: 8,
    style,
  })
  const activeIndex = Math.min(
    project.slides.length - 1,
    Math.floor(frame / SLIDE_DURATION_IN_FRAMES),
  )
  const slideFrame = frame - activeIndex * SLIDE_DURATION_IN_FRAMES
  const activeSlide = project.slides[activeIndex]
  const nextSlide = project.slides[activeIndex + 1]
  const transitionProgress = interpolate(
    slideFrame,
    [SLIDE_DURATION_IN_FRAMES - TRANSITION_IN_FRAMES, SLIDE_DURATION_IN_FRAMES],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  )

  if (activeSlide == null) {
    return null
  }

  return (
    <AbsoluteFill style={{ backgroundColor: accentColor }}>
      <VideoSlide
        accentColor={accentColor}
        brandName={project.brandName}
        frame={slideFrame}
        fps={fps}
        slide={activeSlide}
        slideIndex={activeIndex}
        totalSlides={project.slides.length}
        xOffset={interpolate(transitionProgress, [0, 1], [0, -1080])}
      />
      {nextSlide == null ? null : (
        <VideoSlide
          accentColor={accentColor}
          brandName={project.brandName}
          frame={slideFrame}
          fps={fps}
          slide={nextSlide}
          slideIndex={activeIndex + 1}
          totalSlides={project.slides.length}
          xOffset={interpolate(transitionProgress, [0, 1], [1080, 0])}
        />
      )}
    </AbsoluteFill>
  )
}

function VideoSlide({
  accentColor,
  brandName,
  frame,
  fps,
  slide,
  slideIndex,
  totalSlides,
  xOffset,
}: {
  readonly accentColor: string
  readonly brandName: string
  readonly frame: number
  readonly fps: number
  readonly slide: GeneratedSlideDraft
  readonly slideIndex: number
  readonly totalSlides: number
  readonly xOffset: number
}) {
  const variant = getSequenceCardVariant(slideIndex)
  const entrance = spring({
    fps,
    frame,
    config: {
      damping: 18,
      mass: 0.7,
      stiffness: 120,
    },
  })
  const opacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const scale = interpolate(entrance, [0, 1], [0.96, 1])

  return (
    <AbsoluteFill
      style={{
        backgroundColor: accentColor,
        color: '#111827',
        fontFamily: 'Arial, Apple SD Gothic Neo, sans-serif',
        opacity,
        transform: `translateX(${xOffset}px) scale(${scale})`,
      }}
    >
      {variant === 'cover' ? (
        <CoverSlide
          accentColor={accentColor}
          brandName={brandName}
          slide={slide}
          slideIndex={slideIndex}
          totalSlides={totalSlides}
        />
      ) : (
        <DetailSlide
          accentColor={accentColor}
          brandName={brandName}
          slide={slide}
          slideIndex={slideIndex}
          totalSlides={totalSlides}
        />
      )}
    </AbsoluteFill>
  )
}

function CoverSlide({
  brandName,
  slide,
  slideIndex,
  totalSlides,
}: {
  readonly accentColor: string
  readonly brandName: string
  readonly slide: GeneratedSlideDraft
  readonly slideIndex: number
  readonly totalSlides: number
}) {
  return (
    <AbsoluteFill style={{ padding: 92, color: '#ffffff' }}>
      <Header brandName={brandName} isCover slideIndex={slideIndex} totalSlides={totalSlides} />
      <div style={{ marginTop: 310 }}>
        <p style={coverKickerStyle}>{slide.kicker}</p>
        <h1 style={coverTitleStyle}>{slide.title}</h1>
        <p style={coverBodyStyle}>{slide.description}</p>
      </div>
      <div style={coverBottomPillStyle}>{slide.badge}</div>
    </AbsoluteFill>
  )
}

function DetailSlide({
  accentColor,
  brandName,
  slide,
  slideIndex,
  totalSlides,
}: {
  readonly accentColor: string
  readonly brandName: string
  readonly slide: GeneratedSlideDraft
  readonly slideIndex: number
  readonly totalSlides: number
}) {
  return (
    <AbsoluteFill style={{ padding: 24 }}>
      <div style={detailCardStyle}>
        <Header
          accentColor={accentColor}
          brandName={brandName}
          slideIndex={slideIndex}
          totalSlides={totalSlides}
        />
        <div style={{ marginTop: 120 }}>
          <p style={{ ...detailKickerStyle, color: accentColor }}>{slide.kicker}</p>
          <h2 style={detailTitleStyle}>{slide.title}</h2>
          <p style={detailBodyStyle}>{slide.description}</p>
        </div>
        {slide.content2.trim().length > 0 ? (
          <div style={{ ...detailCalloutStyle, borderLeftColor: accentColor, color: accentColor }}>
            {slide.content2}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  )
}

function Header({
  accentColor,
  brandName,
  isCover = false,
  slideIndex,
  totalSlides,
}: {
  readonly accentColor?: string
  readonly brandName: string
  readonly isCover?: boolean
  readonly slideIndex: number
  readonly totalSlides: number
}) {
  const color = isCover ? '#ffffff' : '#111827'
  const markBackground = isCover ? 'rgba(255, 255, 255, 0.16)' : `${accentColor ?? '#1247d8'}22`
  const markColor = isCover ? '#ffffff' : accentColor ?? '#1247d8'

  return (
    <div style={{ ...headerStyle, borderBottomColor: isCover ? 'transparent' : '#e9f2fe' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{ ...brandMarkStyle, backgroundColor: markBackground, color: markColor }}>
          {brandName.slice(0, 1)}
        </div>
        <strong style={{ ...brandNameStyle, color }}>{brandName}</strong>
      </div>
      <strong style={{ ...pageNumberStyle, color }}>
        {String(slideIndex + 1).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}
      </strong>
    </div>
  )
}

const headerStyle = {
  alignItems: 'center',
  borderBottom: '1px solid',
  display: 'flex',
  justifyContent: 'space-between',
  paddingBottom: 38,
} satisfies CSSProperties

const brandMarkStyle = {
  alignItems: 'center',
  borderRadius: 999,
  display: 'flex',
  fontSize: 22,
  fontWeight: 900,
  height: 56,
  justifyContent: 'center',
  width: 56,
} satisfies CSSProperties

const brandNameStyle = {
  fontSize: 28,
  fontWeight: 900,
} satisfies CSSProperties

const pageNumberStyle = {
  fontSize: 24,
  fontWeight: 900,
  letterSpacing: 1.6,
} satisfies CSSProperties

const coverKickerStyle = {
  fontSize: 44,
  fontWeight: 900,
  letterSpacing: 5,
  margin: '0 0 44px',
  opacity: 0.86,
  whiteSpace: 'pre-line',
} satisfies CSSProperties

const coverTitleStyle = {
  fontSize: 104,
  fontWeight: 950,
  letterSpacing: -5,
  lineHeight: 1.04,
  margin: '0 0 48px',
  maxWidth: 780,
  whiteSpace: 'pre-line',
} satisfies CSSProperties

const coverBodyStyle = {
  fontSize: 40,
  fontWeight: 700,
  lineHeight: 1.52,
  margin: 0,
  maxWidth: 760,
  opacity: 0.78,
  whiteSpace: 'pre-line',
} satisfies CSSProperties

const coverBottomPillStyle = {
  bottom: 92,
  fontSize: 30,
  fontWeight: 900,
  left: 92,
  position: 'absolute',
} satisfies CSSProperties

const detailCardStyle = {
  backgroundColor: '#ffffff',
  borderRadius: 34,
  boxShadow: '0 28px 72px rgba(15, 23, 42, 0.16)',
  height: '100%',
  overflow: 'hidden',
  padding: 68,
  position: 'relative',
  width: '100%',
} satisfies CSSProperties

const detailKickerStyle = {
  fontSize: 28,
  fontWeight: 900,
  letterSpacing: 4,
  margin: '0 0 34px',
  whiteSpace: 'pre-line',
} satisfies CSSProperties

const detailTitleStyle = {
  color: '#050505',
  fontSize: 76,
  fontWeight: 950,
  letterSpacing: -4,
  lineHeight: 1.04,
  margin: '0 0 44px',
  maxWidth: 800,
  whiteSpace: 'pre-line',
} satisfies CSSProperties

const detailBodyStyle = {
  color: '#262626',
  fontSize: 34,
  fontWeight: 600,
  lineHeight: 1.56,
  margin: 0,
  maxWidth: 760,
  whiteSpace: 'pre-line',
} satisfies CSSProperties

const detailCalloutStyle = {
  backgroundColor: '#eaf4ff',
  borderLeft: '8px solid',
  borderRadius: 24,
  bottom: 250,
  fontSize: 32,
  fontWeight: 900,
  left: 68,
  lineHeight: 1.5,
  padding: '34px 40px',
  position: 'absolute',
  right: 68,
  whiteSpace: 'pre-line',
} satisfies CSSProperties

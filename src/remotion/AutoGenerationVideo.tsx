import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import type { CSSProperties } from 'react'
import { CARD_NEWS_DRAFT_STYLE_IDS, type CardNewsDraftStyle } from '../cardNewsDraft.js'
import { buildAutoGenerationStoryboard, getAutoGenerationStageForFrame } from './autoGenerationStoryboard.js'

export type AutoGenerationVideoProps = {
  readonly accentColor?: string
  readonly brandName?: string
  readonly slideCount?: number
  readonly style?: CardNewsDraftStyle
  readonly topic?: string
}

const CAPTURE_SCENES = [
  { image: staticFile('remotion-captures/site-home.png'), label: '자동 생성 시작' },
  { image: staticFile('remotion-captures/site-api-modal.png'), label: 'API Key 확인' },
  { image: staticFile('remotion-captures/site-auto-step.png'), label: '주제 입력' },
  { image: staticFile('remotion-captures/site-template-step.png'), label: '브랜드/레이아웃' },
] as const

export function AutoGenerationVideo({
  accentColor = '#1247d8',
  brandName = 'SNS 카드뉴스 생성기',
  slideCount = 8,
  style = 'informative',
  topic = '카드뉴스 자동생성',
}: AutoGenerationVideoProps) {
  const frame = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()
  const storyboard = buildAutoGenerationStoryboard({
    accentColor,
    brandName,
    slideCount,
    style: CARD_NEWS_DRAFT_STYLE_IDS.includes(style) ? style : 'informative',
    topic,
  })
  const { stageFrame, stageIndex, stageProgress } = getAutoGenerationStageForFrame(frame)
  const stage = storyboard.stages[stageIndex] ?? storyboard.stages[0]
  const scene = CAPTURE_SCENES[stageIndex] ?? CAPTURE_SCENES[0]
  const resultSlides = storyboard.project.slides.slice(0, 3)
  const zoom = interpolate(stageProgress, [0, 1], [1.02, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const progressPercent = Math.round(((stageIndex + stageProgress) / CAPTURE_SCENES.length) * 100)
  const resultOpacity = interpolate(stageFrame, [0, 24], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={styles.root}>
      <Img alt={scene.label} src={scene.image} style={{ ...styles.capture, transform: `scale(${zoom})` }} />
      <div style={styles.vignette} />
      <div style={styles.topBar}>
        <div style={styles.brandRow}>
          <div style={{ ...styles.brandMark, backgroundColor: accentColor }}>{brandName.slice(0, 1)}</div>
          <div>
            <div style={styles.brandName}>{brandName}</div>
            <div style={styles.brandSub}>로컬 자동 생성 캡처</div>
          </div>
        </div>
        <div style={styles.stepPill}>{String(stageIndex + 1).padStart(2, '0')} / 04</div>
      </div>

      <div style={styles.bottomShell}>
        <section style={styles.captionCard}>
          <div style={{ ...styles.captionKicker, color: accentColor }}>SCREEN CAPTURE</div>
          <h1 style={styles.captionTitle}>{stage?.label ?? scene.label}</h1>
          <p style={styles.captionBody}>{stage?.summary ?? '실제 로컬 화면에서 자동 생성 흐름을 그대로 보여줍니다.'}</p>
          <div style={styles.captionMeta}>
            <span style={styles.metaLabel}>주제</span>
            <strong style={styles.metaValue}>{topic}</strong>
            <span style={styles.metaLabel}>카드 수</span>
            <strong style={styles.metaValue}>{slideCount}장</strong>
            <span style={styles.metaLabel}>진행</span>
            <strong style={styles.metaValue}>{progressPercent}%</strong>
            </div>
          </section>
        <section style={styles.progressShell}>
          <div style={styles.progressTrack}>
            <div style={{ ...styles.progressFill, backgroundColor: accentColor, width: `${progressPercent}%` }} />
          </div>
          <div style={styles.progressRow}>
            <span style={styles.progressLabel}>자동 생성 흐름</span>
            <span style={styles.progressValue}>{progressPercent}%</span>
          </div>
        </section>
      </div>

      {stageIndex === CAPTURE_SCENES.length - 1 ? (
        <section style={{ ...styles.resultStack, opacity: resultOpacity }}>
          <div style={{ ...styles.resultHeader, borderColor: accentColor }}>
            <span style={{ ...styles.resultBadge, color: accentColor }}>AI 카드뉴스 초안</span>
            <strong style={styles.resultBrand}>{brandName}</strong>
          </div>
          {resultSlides.map((slide, index) => (
            <article key={slide.id} style={styles.resultCard}>
              <span style={{ ...styles.resultIndex, color: accentColor }}>{String(index + 1).padStart(2, '0')}</span>
              <strong style={styles.resultTitle}>{slide.title}</strong>
              <p style={styles.resultText}>{slide.description}</p>
            </article>
          ))}
        </section>
      ) : null}

      <div style={styles.footerHint}>
        <span style={styles.footerText}>실제 사이트의 화면 캡처를 바탕으로 Remotion에서 다시 렌더했어요.</span>
        <span style={{ ...styles.footerPill, borderColor: accentColor, color: accentColor }}>
          {String(frame + 1).padStart(3, '0')} / {String(durationInFrames).padStart(3, '0')}
        </span>
      </div>
    </AbsoluteFill>
  )
}

const styles = {
  root: {
    backgroundColor: '#f4f5f8',
    color: '#111827',
    fontFamily: "'Pretendard', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif",
  },
  capture: {
    height: '100%',
    objectFit: 'cover',
    width: '100%',
  },
  vignette: {
    background:
      'linear-gradient(180deg, rgba(244, 245, 248, 0.08) 0%, rgba(244, 245, 248, 0) 34%, rgba(17, 24, 39, 0.06) 100%)',
    inset: 0,
    position: 'absolute',
  },
  topBar: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'space-between',
    left: 28,
    position: 'absolute',
    right: 28,
    top: 18,
  },
  brandRow: { alignItems: 'center', display: 'flex', gap: 12 },
  brandMark: {
    alignItems: 'center',
    borderRadius: 14,
    color: '#ffffff',
    display: 'flex',
    fontSize: 18,
    fontWeight: 900,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  brandName: { fontSize: 18, fontWeight: 900, lineHeight: 1.05 },
  brandSub: { color: '#64748b', fontSize: 12, fontWeight: 700, marginTop: 2 },
  stepPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    border: '1px solid #e2e8f0',
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 800,
    padding: '10px 14px',
  },
  bottomShell: {
    bottom: 28,
    display: 'grid',
    gap: 16,
    left: 28,
    position: 'absolute',
    right: 28,
  },
  captionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    border: '1px solid rgba(226, 232, 240, 0.9)',
    borderRadius: 22,
    boxShadow: '0 24px 60px rgba(15, 23, 42, 0.14)',
    maxWidth: 430,
    padding: '18px 20px',
    backdropFilter: 'blur(12px)',
  },
  captionKicker: { fontSize: 11, fontWeight: 900, letterSpacing: '0.18em', marginBottom: 8 },
  captionTitle: { fontSize: 24, fontWeight: 950, lineHeight: 1.15, margin: 0 },
  captionBody: { color: '#475569', fontSize: 14, fontWeight: 600, lineHeight: 1.6, margin: '10px 0 14px' },
  captionMeta: {
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  metaValue: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 900,
    padding: '7px 10px',
  },
  progressShell: {
    alignSelf: 'start',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    border: '1px solid rgba(226, 232, 240, 0.9)',
    borderRadius: 18,
    boxShadow: '0 18px 42px rgba(15, 23, 42, 0.1)',
    padding: '14px 16px',
    width: 320,
  },
  progressTrack: { backgroundColor: '#e2e8f0', borderRadius: 999, height: 8, overflow: 'hidden' },
  progressFill: { borderRadius: 999, height: '100%' },
  progressRow: { alignItems: 'center', display: 'flex', justifyContent: 'space-between', marginTop: 10 },
  progressLabel: { color: '#475569', fontSize: 12, fontWeight: 800 },
  progressValue: { color: '#111827', fontSize: 13, fontWeight: 900 },
  resultStack: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    border: '1px solid rgba(226, 232, 240, 0.92)',
    borderRadius: 24,
    boxShadow: '0 28px 60px rgba(15, 23, 42, 0.16)',
    display: 'grid',
    gap: 10,
    maxHeight: 430,
    overflow: 'hidden',
    position: 'absolute',
    right: 28,
    top: 150,
    padding: 16,
    zIndex: 3,
    width: 340,
  },
  resultHeader: { borderBottom: '1px solid', display: 'grid', gap: 6, paddingBottom: 10 },
  resultBadge: { fontSize: 11, fontWeight: 900, letterSpacing: '0.16em' },
  resultBrand: { fontSize: 16, fontWeight: 900, lineHeight: 1.2 },
  resultCard: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 18,
    display: 'grid',
    gap: 6,
    padding: '12px 14px',
  },
  resultIndex: { fontSize: 11, fontWeight: 900, letterSpacing: '0.1em' },
  resultTitle: { fontSize: 14, fontWeight: 900, lineHeight: 1.25 },
  resultText: { color: '#475569', fontSize: 12, fontWeight: 600, lineHeight: 1.5, margin: 0 },
  footerHint: {
    alignItems: 'center',
    bottom: 16,
    display: 'flex',
    justifyContent: 'space-between',
    left: 28,
    position: 'absolute',
    right: 28,
  },
  footerText: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 999,
    color: '#475569',
    fontSize: 12,
    fontWeight: 700,
    padding: '8px 12px',
  },
  footerPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    border: '1px solid',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 900,
    padding: '8px 12px',
  },
} satisfies Record<string, CSSProperties>

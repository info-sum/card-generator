import os

PROMO_TSX = """import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Sequence, Img, Easing } from 'remotion'
import './SitePromoVideo.css'

export function SitePromoVideo() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // 30 seconds = 900 frames
  return (
    <AbsoluteFill className="promo-bg">
      <Sequence from={0} durationInFrames={120}>
        <SceneIntro />
      </Sequence>
      <Sequence from={120} durationInFrames={180}>
        <SceneStep1 />
      </Sequence>
      <Sequence from={300} durationInFrames={180}>
        <SceneStep2 />
      </Sequence>
      <Sequence from={480} durationInFrames={180}>
        <SceneStep3 />
      </Sequence>
      <Sequence from={660} durationInFrames={120}>
        <SceneStep4 />
      </Sequence>
      <Sequence from={780} durationInFrames={120}>
        <SceneOutro />
      </Sequence>
    </AbsoluteFill>
  )
}

function SceneIntro() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const yOffset = spring({ frame, fps, config: { damping: 14 } })
  const opacity = interpolate(frame, [0, 15], [0, 1])
  const exitOpacity = interpolate(frame, [105, 120], [1, 0])

  return (
    <AbsoluteFill className="promo-center" style={{ opacity: exitOpacity }}>
      <div
        className="promo-title-container"
        style={{
          opacity,
          transform: `translateY(${(1 - yOffset) * 50}px)`
        }}
      >
        <div className="promo-logo-box">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <path d="M3 9h18"/><path d="M9 21V9"/>
          </svg>
        </div>
        <h1 className="promo-title" style={{ marginTop: 24 }}>
          가장 매끄러운<br/>
          <span className="promo-gradient">카드뉴스 제작 경험</span>
        </h1>
        <p className="promo-desc-sm" style={{ marginTop: 24 }}>리서치부터 완성까지, Card Studio</p>
      </div>
    </AbsoluteFill>
  )
}

function SceneStep1() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const scale = spring({ frame, fps, config: { damping: 14 } })
  const opacity = interpolate(frame, [0, 15], [0, 1])
  const exitOpacity = interpolate(frame, [165, 180], [1, 0])

  // Typing effect
  const text = "2026 IT 트렌드와 미래 전망"
  const charsShown = Math.floor(interpolate(frame, [30, 90], [0, text.length], { extrapolateRight: 'clamp' }))
  const typedText = text.slice(0, charsShown)

  const buttonPress = spring({ frame: frame - 100, fps, config: { damping: 20 } })
  const btnScale = interpolate(buttonPress, [0, 0.5, 1], [1, 0.95, 1], { extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill className="promo-center" style={{ opacity: exitOpacity }}>
      <div
        className="promo-ui-window"
        style={{
          opacity,
          transform: `scale(${0.9 + (scale * 0.1)})`
        }}
      >
        <h2 className="promo-ui-heading">01. 단 한 줄의 주제 입력</h2>
        <div className="promo-input-bar">
          <span className="promo-input-text">{typedText}<span className="cursor">|</span></span>
          <div className="promo-btn" style={{ transform: `scale(${btnScale})` }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
          </div>
        </div>
        <p className="promo-desc-sub">주제와 전개 방식만 정하면, AI가 기획을 시작합니다.</p>
      </div>
    </AbsoluteFill>
  )
}

function SceneStep2() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const yOffset = spring({ frame, fps, config: { damping: 14 } })
  const opacity = interpolate(frame, [0, 15], [0, 1])
  const exitOpacity = interpolate(frame, [165, 180], [1, 0])

  const slide1Y = spring({ frame: frame - 30, fps, config: { damping: 12 } })
  const slide2Y = spring({ frame: frame - 40, fps, config: { damping: 12 } })
  const slide3Y = spring({ frame: frame - 50, fps, config: { damping: 12 } })

  return (
    <AbsoluteFill className="promo-center" style={{ opacity: exitOpacity }}>
      <div
        className="promo-ui-window"
        style={{
          opacity,
          transform: `translateY(${(1 - yOffset) * 40}px)`
        }}
      >
        <h2 className="promo-ui-heading">02. AI 자동 기획 및 디자인</h2>
        <p className="promo-desc-sub">카피 작성부터 어울리는 레이아웃 배치까지 단 10초.</p>

        <div className="promo-slide-grid">
          <div className="promo-slide" style={{ transform: `translateY(${(1 - slide1Y) * 100}px)`, opacity: slide1Y }}>
            <div className="slide-img"></div>
            <div className="slide-text"></div>
            <div className="slide-text short"></div>
          </div>
          <div className="promo-slide" style={{ transform: `translateY(${(1 - slide2Y) * 100}px)`, opacity: slide2Y }}>
            <div className="slide-text"></div>
            <div className="slide-text"></div>
            <div className="slide-img large"></div>
          </div>
          <div className="promo-slide" style={{ transform: `translateY(${(1 - slide3Y) * 100}px)`, opacity: slide3Y }}>
            <div className="slide-img"></div>
            <div className="slide-text"></div>
            <div className="slide-text short"></div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  )
}

function SceneStep3() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const scale = spring({ frame, fps, config: { damping: 14 } })
  const opacity = interpolate(frame, [0, 15], [0, 1])
  const exitOpacity = interpolate(frame, [165, 180], [1, 0])

  // Color theme transition
  const colorProgress = spring({ frame: frame - 60, fps, config: { damping: 10 } })
  const color1 = "#f15a24" // Ember
  const color2 = "#1868db" // Tide
  const color3 = "#0f8a8d" // Graphite

  return (
    <AbsoluteFill className="promo-center" style={{ opacity: exitOpacity }}>
      <div
        className="promo-ui-window"
        style={{
          opacity,
          transform: `scale(${0.95 + (scale * 0.05)})`
        }}
      >
        <h2 className="promo-ui-heading">03. 다채로운 브랜드 테마</h2>
        <p className="promo-desc-sub">Ember, Tide, Graphite 등 클릭 한 번에 바뀌는 분위기.</p>

        <div className="promo-theme-showcase">
          <div className="theme-chip" style={{ background: color1, transform: `scale(${interpolate(frame, [60,75], [1,1.1], {extrapolateRight:'clamp'})})` }}>Ember</div>
          <div className="theme-chip" style={{ background: color2, transform: `scale(${interpolate(frame, [100,115], [1,1.1], {extrapolateRight:'clamp'})})` }}>Tide</div>
          <div className="theme-chip" style={{ background: color3, transform: `scale(${interpolate(frame, [140,155], [1,1.1], {extrapolateRight:'clamp'})})` }}>Graphite</div>
        </div>

        <div className="theme-demo-card">
          <div className="theme-overlay" style={{
            opacity: interpolate(frame, [100,115], [0,1], {extrapolateRight:'clamp'})
          }}></div>
          <div className="theme-overlay2" style={{
            opacity: interpolate(frame, [140,155], [0,1], {extrapolateRight:'clamp'})
          }}></div>
          <h3 className="theme-demo-title">내 브랜드에 꼭 맞는 디자인</h3>
        </div>
      </div>
    </AbsoluteFill>
  )
}

function SceneStep4() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const yOffset = spring({ frame, fps, config: { damping: 14 } })
  const opacity = interpolate(frame, [0, 15], [0, 1])
  const exitOpacity = interpolate(frame, [105, 120], [1, 0])

  const aspectWidth = interpolate(frame, [40, 70], [300, 200], { easing: Easing.bezier(0.23, 1, 0.32, 1), extrapolateRight: 'clamp' })
  const aspectHeight = interpolate(frame, [40, 70], [300, 355], { easing: Easing.bezier(0.23, 1, 0.32, 1), extrapolateRight: 'clamp' })
  const aspectLabel = frame < 55 ? "1:1 Instagram" : "9:16 Shorts & Reels"

  return (
    <AbsoluteFill className="promo-center" style={{ opacity: exitOpacity }}>
      <div
        className="promo-ui-window"
        style={{
          opacity,
          transform: `translateY(${(1 - yOffset) * 40}px)`
        }}
      >
        <h2 className="promo-ui-heading">04. 모든 플랫폼 완벽 대응</h2>
        <p className="promo-desc-sub">SNS 환경에 맞춰 자유자재로 변하는 해상도 포맷.</p>

        <div className="promo-aspect-container">
          <div className="promo-aspect-box" style={{ width: aspectWidth, height: aspectHeight }}>
            <span className="aspect-label">{aspectLabel}</span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  )
}

function SceneOutro() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const yOffset = spring({ frame, fps, config: { damping: 12 } })
  const opacity = interpolate(frame, [0, 15], [0, 1])

  return (
    <AbsoluteFill className="promo-center promo-outro-bg">
      <div
        className="promo-title-container"
        style={{
          opacity,
          transform: `translateY(${(1 - yOffset) * -30}px)`
        }}
      >
        <div className="promo-logo-box lg">
          <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <path d="M3 9h18"/><path d="M9 21V9"/>
          </svg>
        </div>
        <h1 className="promo-title promo-final">Card Studio</h1>
        <p className="promo-desc-final">아이디어가 현실이 되는 공간.<br/>지금 바로 만들어 보세요.</p>
      </div>
    </AbsoluteFill>
  )
}
"""

PROMO_CSS = """
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');

.promo-bg {
  background-color: #f5f5f7;
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: #1d1d1f;
  display: flex;
  justify-content: center;
  align-items: center;
}

.promo-outro-bg {
  background-color: #111;
  color: #fff;
}

.promo-center {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 40px;
}

.promo-title-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.promo-logo-box {
  width: 96px;
  height: 96px;
  background: #0071e3;
  border-radius: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 16px 32px rgba(0,113,227,0.3);
}

.promo-logo-box.lg {
  width: 140px;
  height: 140px;
  border-radius: 36px;
  margin-bottom: 20px;
}

.promo-title {
  font-size: 80px;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
  margin: 0;
}

.promo-final {
  font-size: 110px;
  margin-top: 24px;
}

.promo-gradient {
  background: linear-gradient(135deg, #0071e3, #45b1ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.promo-desc-sm {
  font-size: 32px;
  color: #86868b;
  font-weight: 500;
}

.promo-ui-window {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(40px) saturate(180%);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 48px;
  padding: 80px;
  width: 900px;
  box-shadow: 0 32px 80px rgba(0,0,0,0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.promo-ui-heading {
  font-size: 56px;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0 0 16px;
}

.promo-desc-sub {
  font-size: 28px;
  color: #86868b;
  margin: 0 0 60px;
}

.promo-desc-final {
  font-size: 36px;
  color: #a1a1a6;
  margin-top: 32px;
  line-height: 1.4;
}

/* Step 1 UI */
.promo-input-bar {
  width: 100%;
  height: 80px;
  background: #f5f5f7;
  border-radius: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px 0 40px;
  font-size: 32px;
  font-weight: 500;
  color: #1d1d1f;
  margin-bottom: 20px;
}
.cursor {
  animation: blink 1s step-end infinite;
  color: #0071e3;
  margin-left: 4px;
}
@keyframes blink { 50% { opacity: 0; } }
.promo-btn {
  width: 56px;
  height: 56px;
  background: #0071e3;
  color: #fff;
  border-radius: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Step 2 UI */
.promo-slide-grid {
  display: flex;
  gap: 24px;
  width: 100%;
}
.promo-slide {
  flex: 1;
  height: 360px;
  background: #fff;
  border: 1px solid #eaeaea;
  border-radius: 24px;
  box-shadow: 0 16px 32px rgba(0,0,0,0.04);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.slide-img {
  width: 100%;
  height: 120px;
  background: #f0f0f0;
  border-radius: 12px;
}
.slide-img.large {
  flex: 1;
}
.slide-text {
  width: 100%;
  height: 20px;
  background: #eaeaea;
  border-radius: 10px;
}
.slide-text.short {
  width: 60%;
}

/* Step 3 UI */
.promo-theme-showcase {
  display: flex;
  gap: 20px;
  margin-bottom: 40px;
}
.theme-chip {
  padding: 12px 32px;
  border-radius: 999px;
  color: #fff;
  font-weight: 600;
  font-size: 24px;
  transition: transform 0.2s;
}

.theme-demo-card {
  width: 400px;
  height: 400px;
  background: #f15a24;
  border-radius: 32px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}
.theme-overlay {
  position: absolute;
  inset: 0;
  background: #1868db;
}
.theme-overlay2 {
  position: absolute;
  inset: 0;
  background: #0f8a8d;
}
.theme-demo-title {
  position: relative;
  z-index: 10;
  font-size: 32px;
  text-align: center;
  padding: 32px;
  font-weight: 700;
}

/* Step 4 UI */
.promo-aspect-container {
  width: 100%;
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f7;
  border-radius: 32px;
}
.promo-aspect-box {
  background: #0071e3;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 24px;
  font-weight: 700;
  box-shadow: 0 24px 48px rgba(0,113,227,0.3);
}
"""

with open('/Users/beom/Documents/project/cardstudio/src/remotion/SitePromoVideo.tsx', 'w') as f:
    f.write(PROMO_TSX)

with open('/Users/beom/Documents/project/cardstudio/src/remotion/SitePromoVideo.css', 'w') as f:
    f.write(PROMO_CSS)

print("Created highly detailed SitePromoVideo.")

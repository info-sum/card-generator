import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Sequence, Img, Easing } from 'remotion'
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

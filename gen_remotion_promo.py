import os

PROMO_TSX = """import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Sequence } from 'remotion'
import './SitePromoVideo.css'

export function SitePromoVideo() {
  const frame = useCurrentFrame()
  const { fps, width, height } = useVideoConfig()

  // Transitions for scenes
  const scene1 = frame >= 0 && frame < 90
  const scene2 = frame >= 90 && frame < 180
  const scene3 = frame >= 180 && frame < 270
  const scene4 = frame >= 270 && frame < 360
  const scene5 = frame >= 360 && frame <= 450

  return (
    <AbsoluteFill className="promo-bg">
      <Sequence from={0} durationInFrames={90}>
        <Scene1 />
      </Sequence>
      <Sequence from={90} durationInFrames={90}>
        <Scene2 />
      </Sequence>
      <Sequence from={180} durationInFrames={90}>
        <Scene3 />
      </Sequence>
      <Sequence from={270} durationInFrames={90}>
        <Scene4 />
      </Sequence>
      <Sequence from={360} durationInFrames={90}>
        <Scene5 />
      </Sequence>
    </AbsoluteFill>
  )
}

function Scene1() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const yOffset = spring({ frame, fps, config: { damping: 12 } })
  const opacity = interpolate(frame, [0, 15], [0, 1])
  const exitOpacity = interpolate(frame, [75, 90], [1, 0])

  return (
    <AbsoluteFill className="promo-center" style={{ opacity: exitOpacity }}>
      <div
        className="promo-title-container"
        style={{
          opacity,
          transform: `translateY(${(1 - yOffset) * 50}px)`
        }}
      >
        <h1 className="promo-title">
          생각을 카드뉴스로.<br/>
          <span className="promo-gradient">가장 매끄러운 방식.</span>
        </h1>
      </div>
    </AbsoluteFill>
  )
}

function Scene2() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const scale = spring({ frame, fps, config: { damping: 14 } })
  const opacity = interpolate(frame, [0, 15], [0, 1])
  const exitOpacity = interpolate(frame, [75, 90], [1, 0])

  return (
    <AbsoluteFill className="promo-center" style={{ opacity: exitOpacity }}>
      <div
        className="promo-card"
        style={{
          opacity,
          transform: `scale(${0.9 + (scale * 0.1)})`
        }}
      >
        <div className="promo-icon-wrap">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        </div>
        <h2 className="promo-subtitle">초스피드 AI 자동 생성</h2>
        <p className="promo-desc">주제만 입력하면, 구성부터 카피까지 완벽한 흐름이 탄생합니다.</p>
      </div>
    </AbsoluteFill>
  )
}

function Scene3() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const yOffset = spring({ frame, fps, config: { damping: 12 } })
  const opacity = interpolate(frame, [0, 15], [0, 1])
  const exitOpacity = interpolate(frame, [75, 90], [1, 0])

  return (
    <AbsoluteFill className="promo-center" style={{ opacity: exitOpacity }}>
      <div
        className="promo-card"
        style={{
          opacity,
          transform: `translateY(${(1 - yOffset) * 40}px)`
        }}
      >
        <div className="promo-icon-wrap">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <line x1="3" y1="9" x2="21" y2="9"/>
            <line x1="9" y1="21" x2="9" y2="9"/>
          </svg>
        </div>
        <h2 className="promo-subtitle">디테일한 레이아웃 제어</h2>
        <p className="promo-desc">전체 화면, 분할 뷰 등 각 슬라이드마다 픽셀 단위로 통제하세요.</p>
      </div>
    </AbsoluteFill>
  )
}

function Scene4() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const scale = spring({ frame, fps, config: { damping: 14 } })
  const opacity = interpolate(frame, [0, 15], [0, 1])
  const exitOpacity = interpolate(frame, [75, 90], [1, 0])

  return (
    <AbsoluteFill className="promo-center" style={{ opacity: exitOpacity }}>
      <div
        className="promo-card"
        style={{
          opacity,
          transform: `scale(${0.95 + (scale * 0.05)})`
        }}
      >
        <div className="promo-icon-wrap">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            <path d="M2 12h20"/>
          </svg>
        </div>
        <h2 className="promo-subtitle">모든 기기에 완벽하게</h2>
        <p className="promo-desc">1:1 피드부터 9:16 쇼츠 릴스까지 모든 포맷을 단번에 출력합니다.</p>
      </div>
    </AbsoluteFill>
  )
}

function Scene5() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const yOffset = spring({ frame, fps, config: { damping: 12 } })
  const opacity = interpolate(frame, [0, 15], [0, 1])

  return (
    <AbsoluteFill className="promo-center">
      <div
        className="promo-title-container"
        style={{
          opacity,
          transform: `translateY(${(1 - yOffset) * -30}px)`
        }}
      >
        <div className="promo-logo">
          <img src="https://static.toss.im/icons/png/4x/icon-apple-logo.png" style={{width: 64, height: 64, filter: 'grayscale(1) invert(1) brightness(0.2)'}} alt="logo" />
        </div>
        <h1 className="promo-title promo-final">Card Studio</h1>
        <p className="promo-desc-final">지금 바로 새로운 창작을 시작하세요.</p>
      </div>
    </AbsoluteFill>
  )
}
"""

PROMO_CSS = """
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');

.promo-bg {
  background-color: #fbfbfd;
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: #1d1d1f;
  display: flex;
  justify-content: center;
  align-items: center;
}

.promo-center {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 80px;
}

.promo-title-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.promo-title {
  font-size: 80px;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
  margin: 0;
}

.promo-final {
  font-size: 100px;
  margin-top: 24px;
}

.promo-gradient {
  background: linear-gradient(135deg, #0071e3, #45b1ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.promo-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(40px) saturate(180%);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 48px;
  padding: 80px;
  max-width: 800px;
  box-shadow: 0 32px 64px rgba(0,0,0,0.06);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.promo-icon-wrap {
  width: 120px;
  height: 120px;
  background: #f5f5f7;
  border-radius: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #0071e3;
  margin-bottom: 40px;
}

.promo-subtitle {
  font-size: 56px;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0 0 24px;
}

.promo-desc {
  font-size: 32px;
  color: #86868b;
  line-height: 1.4;
  margin: 0;
}

.promo-desc-final {
  font-size: 36px;
  color: #86868b;
  margin-top: 24px;
}
"""

RENDER_SCRIPT = """import { bundle } from '@remotion/bundler'
import { renderMedia, selectComposition } from '@remotion/renderer'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outputLocation = path.join(repoRoot, 'artifacts', 'remotion', 'site-promo-launch.mp4')

await fs.mkdir(path.dirname(outputLocation), { recursive: true })

console.log('Bundling Remotion composition for SitePromoVideo...')
const serveUrl = await bundle({
  entryPoint: path.join(repoRoot, 'src', 'remotion', 'index.ts'),
  onProgress: (progress) => {
    process.stdout.write(`\\rBundle ${Math.round(progress * 100)}%`)
  },
})
process.stdout.write('\\n')

console.log('Selecting composition...')
const composition = await selectComposition({
  id: 'SitePromoVideo',
  serveUrl,
})

console.log(`Rendering ${outputLocation}...`)
await renderMedia({
  codec: 'h264',
  composition,
  onProgress: ({ progress }) => {
    process.stdout.write(`\\rRender ${Math.round(progress * 100)}%`)
  },
  outputLocation,
  serveUrl,
})
process.stdout.write('\\n')

console.log(`Promo Video ready: ${outputLocation}`)
"""

import sys

with open('/Users/beom/Documents/project/cardstudio/src/remotion/SitePromoVideo.tsx', 'w') as f:
    f.write(PROMO_TSX)

with open('/Users/beom/Documents/project/cardstudio/src/remotion/SitePromoVideo.css', 'w') as f:
    f.write(PROMO_CSS)

with open('/Users/beom/Documents/project/cardstudio/scripts/render-site-promo.mjs', 'w') as f:
    f.write(RENDER_SCRIPT)

print("Created SitePromoVideo and render script.")

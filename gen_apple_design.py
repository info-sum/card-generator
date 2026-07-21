import os

TSX_CONTENT = """/**
 * IntroPage.tsx
 * Apple-style SNS 카드 뉴스 생성기 서비스 소개 페이지
 */

import './IntroPage.css'
import { useEffect } from 'react'

type FeatureItem = {
  readonly id: string
  readonly icon: 'upload' | 'edit' | 'crop' | 'palette' | 'layout' | 'export'
  readonly title: string
  readonly description: string
}

type StepItem = {
  readonly id: string
  readonly number: string
  readonly title: string
  readonly description: string
}

type OutputItem = {
  readonly id: string
  readonly badge: string
  readonly title: string
  readonly specs: readonly string[]
  readonly description: string
}

const FEATURES = [
  {
    id: 'upload',
    icon: 'upload',
    title: '사진 업로드',
    description: '사진첩에서 이미지를 불러와 배경으로 활용하세요.',
  },
  {
    id: 'edit',
    icon: 'edit',
    title: '정밀한 텍스트 편집',
    description: '헤드라인부터 서브 카피까지, 섬세한 텍스트 조율.',
  },
  {
    id: 'crop',
    icon: 'crop',
    title: '완벽한 프레이밍',
    description: '포커스 이동과 줌으로 정확한 구도를 맞춥니다.',
  },
  {
    id: 'theme',
    icon: 'palette',
    title: '브랜드 컬러 매칭',
    description: '당신의 아이덴티티에 맞는 6가지 큐레이션 테마.',
  },
  {
    id: 'layout',
    icon: 'layout',
    title: '다양한 레이아웃',
    description: '콘텐츠 성격에 맞게 3가지 레이아웃을 교차 사용.',
  },
  {
    id: 'export',
    icon: 'export',
    title: '고해상도 출력',
    description: '웹과 모바일 어디서든 선명한 품질의 PNG.',
  },
] as const satisfies readonly FeatureItem[]

function FeatureIcon({ name }: { name: FeatureItem['icon'] }) {
  const common = {
    width: 24,
    height: 24,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }

  switch (name) {
    case 'upload':
      return (
        <svg {...common}>
          <path d="M12 3v12" />
          <path d="M7 8l5-5 5 5" />
          <path d="M4 17v3h16v-3" />
        </svg>
      )
    case 'edit':
      return (
        <svg {...common}>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5z" />
        </svg>
      )
    case 'crop':
      return (
        <svg {...common}>
          <path d="M6 2v14a2 2 0 0 0 2 2h14" />
          <path d="M18 22V8a2 2 0 0 0-2-2H2" />
        </svg>
      )
    case 'palette':
      return (
        <svg {...common}>
          <circle cx="13.5" cy="6.5" r=".5" />
          <circle cx="17.5" cy="10.5" r=".5" />
          <circle cx="8.5" cy="7.5" r=".5" />
          <circle cx="6.5" cy="12.5" r=".5" />
          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
        </svg>
      )
    case 'layout':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="9" y1="21" x2="9" y2="9" />
        </svg>
      )
    case 'export':
      return (
        <svg {...common}>
          <path d="M12 3v10" />
          <path d="M8 9l4 4 4-4" />
          <path d="M5 21h14a2 2 0 0 0 2-2v-4H3v4a2 2 0 0 0 2 2z" />
        </svg>
      )
    default:
      return null
  }
}

function PillIcon({ name }: { name: 'steps' | 'features' | 'outputs' | 'themes' | 'start' }) {
  const common = {
    width: 14,
    height: 14,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }

  switch (name) {
    case 'steps':
      return <svg {...common}><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>
    case 'features':
      return <svg {...common}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
    case 'outputs':
      return <svg {...common}><path d="M12 3v10"/><path d="M8 9l4 4 4-4"/><path d="M5 21h14"/></svg>
    case 'themes':
      return <svg {...common}><circle cx="12" cy="12" r="9"/></svg>
    case 'start':
      return <svg {...common}><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
    default:
      return null
  }
}

const STEPS = [
  {
    id: 'step-1',
    number: '01',
    title: '시작 방식 선택',
    description: '목적에 맞는 출발점을 고릅니다.',
  },
  {
    id: 'step-2',
    number: '02',
    title: '생성 기준 설정',
    description: '카드 수와 톤앤매너를 정합니다.',
  },
  {
    id: 'step-3',
    number: '03',
    title: '내용 편집',
    description: '제목과 본문을 다듬습니다.',
  },
  {
    id: 'step-4',
    number: '04',
    title: '디자인 조율',
    description: '구도를 실시간으로 맞춥니다.',
  },
  {
    id: 'step-5',
    number: '05',
    title: '확인하고 저장',
    description: '원하는 파일로 내보냅니다.',
  },
] as const satisfies readonly StepItem[]

const OUTPUTS = [
  {
    id: 'social',
    badge: 'SNS',
    title: '모바일 최적화',
    specs: ['1080 × 1080', '1080 × 1350', '1080 × 1920'],
    description: '피드와 스토리에 완벽하게 맞는 픽셀 퍼펙트 해상도.',
  },
  {
    id: 'export',
    badge: 'Export',
    title: '손쉬운 저장',
    specs: ['개별 PNG', '전체 ZIP', '토스 앱 사진첩'],
    description: '작업 흐름을 끊지 않는 매끄러운 저장 경험.',
  },
] as const satisfies readonly OutputItem[]

function IntroPage() {
  useEffect(() => {
    const targets = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'))
    if (targets.length === 0) return

    for (const el of targets) {
      const index = Number(el.dataset.revealIndex ?? '0')
      if (Number.isFinite(index) && index > 0) {
        el.style.setProperty('--intro-delay', `${index * 80}ms`)
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          ;(entry.target as HTMLElement).classList.add('is-in')
          observer.unobserve(entry.target)
        }
      },
      { root: null, threshold: 0.1, rootMargin: '0px 0px -5% 0px' },
    )

    for (const el of targets) observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const hostname = window.location.hostname
  const isLocalDevHost =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname.endsWith('.local') ||
    /^192\\.168\\./.test(hostname) ||
    /^10\\./.test(hostname) ||
    /^172\\.(1[6-9]|2\\d|3[0-1])\\./.test(hostname)

  const studioHref = isLocalDevHost ? '/studio' : 'https://minion.toss.im/DXUJ6l16'

  function handleGoToTerms() {
    window.location.href = '/terms'
  }

  return (
    <div className="intro-shell">
      {/* ─── 상단 네비게이션 ─────────────────────────────── */}
      <nav className="apple-nav">
        <div className="apple-nav-inner">
          <a className="apple-nav-brand" href="/intro">
            <img src="/logo.svg" alt="Card Studio 로고" width="28" height="28" />
            <span>Card Studio</span>
          </a>
          <div className="apple-nav-actions">
            <button className="apple-nav-link" onClick={handleGoToTerms} type="button">이용약관</button>
            <a className="apple-cta-btn" href={studioHref}>바로 만들기</a>
          </div>
        </div>
      </nav>

      <main className="intro-main">
        {/* ─── 히어로 섹션 ─────────────────────────────────── */}
        <section className="apple-hero" id="hero-section">
          <div className="apple-hero-inner intro-reveal" data-reveal>
            <p className="apple-hero-kicker">놀랍도록 직관적인 경험.</p>
            <h1 className="apple-hero-heading">
              생각을 카드뉴스로.<br />
              <span className="apple-text-gradient">가장 매끄러운 방식.</span>
            </h1>
            <p className="apple-hero-sub">
              리서치부터 브랜드 설정, 디테일한 편집과 고해상도 내보내기까지.<br />
              당신의 아이디어가 세상에 나오는 과정을 다시 디자인했습니다.
            </p>

            <div className="apple-hero-actions">
              <a className="apple-btn-primary" href={studioHref}>시작하기</a>
              <a className="apple-btn-secondary" href="#how-to-use">자세히 알아보기</a>
            </div>

            <div className="apple-jump-links">
              <a href="#how-to-use"><PillIcon name="steps" />사용 흐름</a>
              <a href="#features"><PillIcon name="features" />핵심 기능</a>
              <a href="#outputs"><PillIcon name="outputs" />출력 규격</a>
              <a href="#themes"><PillIcon name="themes" />브랜드 컬러</a>
            </div>
          </div>

          <div className="apple-hero-visual intro-reveal" data-reveal data-reveal-index={1}>
            {/* Apple style floating window preview */}
            <div className="apple-window">
              <div className="apple-window-header">
                <div className="apple-window-controls">
                  <i /> <i /> <i />
                </div>
                <span>Card Studio</span>
              </div>
              <div className="apple-window-body">
                <div className="apple-window-sidebar">
                  <div className="apple-window-thumb is-active"><img src="/demo-slide-1.svg" alt="" /></div>
                  <div className="apple-window-thumb"><img src="/demo-slide-2.svg" alt="" /></div>
                  <div className="apple-window-thumb"><img src="/demo-slide-3.svg" alt="" /></div>
                </div>
                <div className="apple-window-content">
                  <img src="/demo-slide-1.svg" alt="" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 하이라이트 섹션 (Bento Box 스타일) ──────────────────────────────── */}
        <section className="apple-section apple-bento-section" id="features">
          <div className="apple-section-inner">
            <div className="apple-section-header intro-reveal" data-reveal>
              <h2 className="apple-section-heading">결과물을 완성하는<br />핵심 기능들.</h2>
            </div>

            <div className="apple-bento-grid">
              {FEATURES.map((feature, index) => (
                <article
                  key={feature.id}
                  className={`apple-bento-item intro-reveal apple-bento-${feature.id}`}
                  data-reveal
                  data-reveal-index={index % 3 + 1}
                >
                  <div className="apple-bento-icon">
                    <FeatureIcon name={feature.icon} />
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ─── 사용 흐름 ──────────────────────────────── */}
        <section className="apple-section apple-steps-section" id="how-to-use">
          <div className="apple-section-inner">
            <div className="apple-section-header intro-reveal" data-reveal>
              <h2 className="apple-section-heading">물 흐르듯 자연스러운<br />5단계 워크플로.</h2>
            </div>

            <div className="apple-steps-list">
              {STEPS.map((step, index) => (
                <article
                  key={step.id}
                  className="apple-step-row intro-reveal"
                  data-reveal
                  data-reveal-index={index + 1}
                >
                  <div className="apple-step-num">{step.number}</div>
                  <div className="apple-step-text">
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ─── 아웃풋 & 브랜드 ──────────────────────────────── */}
        <section className="apple-section apple-mixed-section" id="outputs">
          <div className="apple-section-inner">

            <div className="apple-mixed-grid">
              {/* Outputs */}
              <div className="apple-mixed-column intro-reveal" data-reveal>
                <h2 className="apple-column-heading">어디서든 완벽한<br />품질의 결과물.</h2>
                <div className="apple-outputs">
                  {OUTPUTS.map(output => (
                    <div key={output.id} className="apple-output-card">
                      <span className="apple-badge">{output.badge}</span>
                      <h3>{output.title}</h3>
                      <p>{output.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Brand Themes */}
              <div className="apple-mixed-column intro-reveal" data-reveal data-reveal-index={1} id="themes">
                <h2 className="apple-column-heading">브랜드에 맞는<br />다양한 팔레트.</h2>
                <div className="apple-themes-grid">
                  {[
                    { name: 'Ember', color: '#f15a24' },
                    { name: 'Tide', color: '#1868db' },
                    { name: 'Graphite', color: '#0f8a8d' },
                    { name: 'Sunset', color: '#1c2b42' },
                    { name: 'Midnight', color: '#64748b' },
                    { name: 'Blossom', color: '#ffb3c6' },
                  ].map(theme => (
                    <div key={theme.name} className="apple-theme-chip">
                      <i style={{ background: theme.color }} />
                      <span>{theme.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── CTA ─────────────────────────────────────── */}
        <section className="apple-cta-section" id="cta">
          <div className="apple-cta-inner intro-reveal" data-reveal>
            <h2>이제 직접<br />경험해볼 시간입니다.</h2>
            <div className="apple-hero-actions">
              <a className="apple-btn-primary" href={studioHref}>지금 시작하기</a>
            </div>
          </div>
        </section>
      </main>

      {/* ─── 푸터 ─────────────────────────────────────────── */}
      <footer className="apple-footer">
        <div className="apple-footer-inner">
          <div className="apple-footer-left">
            <img src="/logo.svg" alt="로고" width="20" height="20" />
            <span>Card Studio</span>
          </div>
          <div className="apple-footer-right">
            <button onClick={handleGoToTerms} type="button">이용약관</button>
            <span>© 2026 Card Studio. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default IntroPage
"""

CSS_CONTENT = """/**
 * IntroPage.css
 * Apple-style SNS 카드 뉴스 생성기 서비스 소개 페이지
 */

:root {
  --apple-bg: #f5f5f7;
  --apple-surface: #ffffff;
  --apple-surface-translucent: rgba(255, 255, 255, 0.72);
  --apple-text: #1d1d1f;
  --apple-text-secondary: #86868b;
  --apple-blue: #0071e3;
  --apple-blue-hover: #0077ed;
  --apple-border: rgba(0, 0, 0, 0.08);
  --ease-apple: cubic-bezier(0.23, 1, 0.32, 1);
  --font-apple: 'Pretendard Variable', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

html {
  scroll-behavior: smooth;
  font-family: var(--font-apple);
}

.intro-shell {
  background-color: var(--apple-bg);
  color: var(--apple-text);
  -webkit-font-smoothing: antialiased;
  min-height: 100dvh;
}

button, a {
  -webkit-tap-highlight-color: transparent;
}

button:active, a:active {
  transform: scale(0.97);
  transition: transform 100ms var(--ease-apple);
}

/* ─── Scroll Reveal ──────────────────────────────────────── */
.intro-reveal {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.8s var(--ease-apple), transform 0.8s var(--ease-apple);
  transition-delay: var(--intro-delay, 0ms);
}
.intro-reveal.is-in {
  opacity: 1;
  transform: translateY(0);
}

/* ─── 네비게이션 ─────────────────────────────────────────── */
.apple-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--apple-surface-translucent);
  backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 1px solid var(--apple-border);
}

.apple-nav-inner {
  max-width: 1024px;
  margin: 0 auto;
  padding: 0 20px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.apple-nav-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: var(--apple-text);
  text-decoration: none;
}
.apple-nav-brand img {
  border-radius: 6px;
}

.apple-nav-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.apple-nav-link {
  border: none;
  background: transparent;
  font-size: 12px;
  color: var(--apple-text-secondary);
  cursor: pointer;
}

.apple-cta-btn {
  background: var(--apple-text);
  color: #fff;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
}

/* ─── 공통 섹션 ────────────────────────────────────────── */
.apple-section {
  padding: 100px 20px;
}
.apple-section-inner {
  max-width: 1024px;
  margin: 0 auto;
}
.apple-section-header {
  text-align: center;
  margin-bottom: 60px;
}
.apple-section-heading {
  font-size: clamp(32px, 5vw, 48px);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
  margin: 0;
}
.apple-column-heading {
  font-size: 32px;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
  margin: 0 0 32px;
}

/* ─── 히어로 섹션 ────────────────────────────────────────── */
.apple-hero {
  padding: 120px 20px 80px;
  text-align: center;
  overflow: hidden;
}
.apple-hero-inner {
  max-width: 800px;
  margin: 0 auto;
}
.apple-hero-kicker {
  font-size: 14px;
  font-weight: 600;
  color: var(--apple-blue);
  margin-bottom: 16px;
}
.apple-hero-heading {
  font-size: clamp(40px, 8vw, 72px);
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: -0.02em;
  margin: 0 0 24px;
}
.apple-text-gradient {
  background: linear-gradient(135deg, #0071e3, #00c6ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.apple-hero-sub {
  font-size: 20px;
  color: var(--apple-text-secondary);
  line-height: 1.5;
  margin: 0 auto 40px;
  max-width: 500px;
}

.apple-hero-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-bottom: 48px;
}
.apple-btn-primary {
  background: var(--apple-blue);
  color: #fff;
  padding: 14px 28px;
  border-radius: 999px;
  font-size: 16px;
  font-weight: 600;
  text-decoration: none;
}
.apple-btn-primary:hover {
  background: var(--apple-blue-hover);
}
.apple-btn-secondary {
  background: transparent;
  color: var(--apple-blue);
  border: 1px solid var(--apple-blue);
  padding: 14px 28px;
  border-radius: 999px;
  font-size: 16px;
  font-weight: 600;
  text-decoration: none;
}

.apple-jump-links {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  margin-bottom: 80px;
}
.apple-jump-links a {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
  color: var(--apple-text-secondary);
  background: #fff;
  padding: 8px 16px;
  border-radius: 999px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.apple-jump-links a:hover {
  color: var(--apple-text);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

/* Hero Window Preview */
.apple-window {
  max-width: 800px;
  margin: 0 auto;
  background: var(--apple-surface-translucent);
  backdrop-filter: blur(40px);
  border-radius: 20px;
  border: 1px solid var(--apple-border);
  box-shadow: 0 24px 64px rgba(0,0,0,0.12);
  overflow: hidden;
}
.apple-window-header {
  height: 48px;
  background: rgba(255,255,255,0.4);
  border-bottom: 1px solid var(--apple-border);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.apple-window-controls {
  position: absolute;
  left: 16px;
  display: flex;
  gap: 8px;
}
.apple-window-controls i {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #e5e5e5;
}
.apple-window-controls i:nth-child(1) { background: #ff5f56; }
.apple-window-controls i:nth-child(2) { background: #ffbd2e; }
.apple-window-controls i:nth-child(3) { background: #27c93f; }
.apple-window-header span {
  font-size: 13px;
  font-weight: 600;
  color: var(--apple-text-secondary);
}
.apple-window-body {
  display: flex;
  height: 400px;
}
.apple-window-sidebar {
  width: 80px;
  border-right: 1px solid var(--apple-border);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: rgba(250,250,250,0.6);
}
.apple-window-thumb {
  width: 100%;
  aspect-ratio: 4/5;
  border-radius: 8px;
  overflow: hidden;
  opacity: 0.6;
}
.apple-window-thumb.is-active {
  opacity: 1;
  box-shadow: 0 0 0 2px var(--apple-blue);
}
.apple-window-thumb img, .apple-window-content img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.apple-window-content {
  flex: 1;
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fbfbfc;
}
.apple-window-content img {
  max-height: 100%;
  max-width: 100%;
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(0,0,0,0.1);
}

/* ─── 하이라이트 (Bento) ──────────────────────────────── */
.apple-bento-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
.apple-bento-item {
  background: #fff;
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.03);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.apple-bento-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: var(--apple-bg);
  color: var(--apple-blue);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
}
.apple-bento-item h3 {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 8px;
}
.apple-bento-item p {
  font-size: 15px;
  color: var(--apple-text-secondary);
  line-height: 1.5;
  margin: 0;
}
.apple-bento-upload { grid-column: span 2; }
.apple-bento-edit { grid-column: span 1; }
.apple-bento-crop { grid-column: span 1; }
.apple-bento-theme { grid-column: span 2; }
.apple-bento-layout { grid-column: span 1; }
.apple-bento-export { grid-column: span 2; }

/* ─── 사용 흐름 ────────────────────────────────────────── */
.apple-steps-section {
  background: #fff;
}
.apple-steps-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 600px;
  margin: 0 auto;
}
.apple-step-row {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 24px;
  background: var(--apple-bg);
  border-radius: 20px;
}
.apple-step-num {
  font-size: 32px;
  font-weight: 700;
  color: var(--apple-text-secondary);
  opacity: 0.5;
  font-variant-numeric: tabular-nums;
}
.apple-step-text h3 {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 4px;
}
.apple-step-text p {
  font-size: 15px;
  color: var(--apple-text-secondary);
  margin: 0;
}

/* ─── 아웃풋 & 브랜드 ──────────────────────────────────── */
.apple-mixed-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
}
.apple-outputs {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.apple-output-card {
  background: #fff;
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.03);
}
.apple-badge {
  display: inline-block;
  background: rgba(0, 113, 227, 0.1);
  color: var(--apple-blue);
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 16px;
}
.apple-output-card h3 {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 8px;
}
.apple-output-card p {
  font-size: 15px;
  color: var(--apple-text-secondary);
  margin: 0;
}

.apple-themes-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
.apple-theme-chip {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.03);
}
.apple-theme-chip i {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  flex-shrink: 0;
}
.apple-theme-chip span {
  font-size: 15px;
  font-weight: 600;
}

/* ─── CTA ─────────────────────────────────────────────── */
.apple-cta-section {
  padding: 120px 20px;
  text-align: center;
  background: #fff;
}
.apple-cta-inner h2 {
  font-size: clamp(32px, 6vw, 56px);
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0 0 40px;
}

/* ─── 푸터 ─────────────────────────────────────────────── */
.apple-footer {
  background: #fff;
  border-top: 1px solid var(--apple-border);
  padding: 24px 20px;
}
.apple-footer-inner {
  max-width: 1024px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--apple-text-secondary);
}
.apple-footer-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.apple-footer-right {
  display: flex;
  align-items: center;
  gap: 16px;
}
.apple-footer-right button {
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
}
.apple-footer-right button:hover {
  color: var(--apple-text);
}

/* ─── 반응형 ─────────────────────────────────────────────── */
@media (max-width: 768px) {
  .apple-bento-grid {
    grid-template-columns: 1fr;
  }
  .apple-bento-upload,
  .apple-bento-edit,
  .apple-bento-crop,
  .apple-bento-theme,
  .apple-bento-layout,
  .apple-bento-export {
    grid-column: span 1;
  }
  .apple-mixed-grid {
    grid-template-columns: 1fr;
    gap: 40px;
  }
  .apple-window-sidebar {
    display: none;
  }
  .apple-footer-inner {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
}
"""

with open('/Users/beom/Documents/project/cardstudio/src/pages/IntroPage.tsx', 'w') as f:
    f.write(TSX_CONTENT)

with open('/Users/beom/Documents/project/cardstudio/src/pages/IntroPage.css', 'w') as f:
    f.write(CSS_CONTENT)

print("Apple-style IntroPage files generated successfully.")

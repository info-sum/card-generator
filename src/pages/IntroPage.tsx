/**
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
    title: '뉴스·주제로 초안 만들기',
    description: '오늘의 뉴스에서 이슈를 고르거나 주제를 직접 입력하면 AI가 카드 흐름을 먼저 잡아줍니다.',
  },
  {
    id: 'edit',
    icon: 'edit',
    title: '이미지와 영상을 한 번에',
    description: '사진첩에서 최대 20장의 이미지와 영상을 불러와 카드 흐름에 바로 담을 수 있습니다.',
  },
  {
    id: 'crop',
    icon: 'crop',
    title: '카드별 내용과 순서 편집',
    description: '제목과 본문을 다듬고, 카드 순서를 바꾸거나 필요한 카드만 남길 수 있습니다.',
  },
  {
    id: 'theme',
    icon: 'palette',
    title: '브랜드 요소 적용',
    description: '브랜드명, 로고 크기, 대표 컬러를 정해 카드와 저장 파일에 함께 반영합니다.',
  },
  {
    id: 'layout',
    icon: 'layout',
    title: '레이아웃과 구도 조절',
    description: '4가지 레이아웃과 글꼴, 카드 크기, 이미지 위치와 확대 비율을 세밀하게 조절합니다.',
  },
  {
    id: 'export',
    icon: 'export',
    title: '확인하고 저장',
    description: '완성본을 미리 본 뒤 PNG로 저장하거나 전체 카드를 ZIP 파일로 한 번에 내보냅니다.',
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
    title: '뉴스·주제·미디어로 시작',
    description: '오늘의 이슈를 고르거나 주제를 입력하고, 필요한 이미지와 영상을 불러옵니다.',
  },
  {
    id: 'step-2',
    number: '02',
    title: 'AI와 브랜드 기준 설정',
    description: '카드 수와 톤앤매너를 정하고 브랜드명, 로고, 컬러, 레이아웃을 고릅니다.',
  },
  {
    id: 'step-3',
    number: '03',
    title: '카드별 내용 편집',
    description: 'AI 초안을 바탕으로 제목과 본문을 다듬고, 출처를 확인하며 순서를 정리합니다.',
  },
  {
    id: 'step-4',
    number: '04',
    title: '디자인 세부 조절',
    description: '글꼴, 카드 크기, 이미지 위치와 확대 비율을 미리보며 맞춥니다.',
  },
  {
    id: 'step-5',
    number: '05',
    title: '전체 확인 후 저장',
    description: '완성된 흐름을 확인한 뒤 PNG 또는 ZIP 파일로 저장합니다.',
  },
] as const satisfies readonly StepItem[]

const OUTPUTS = [
  {
    id: 'social',
    badge: 'SNS',
    title: 'SNS용 카드 규격',
    specs: ['1080 × 1080', '1080 × 1350', '1080 × 1920'],
    description: '정방형·세로형·스토리 비율을 골라 채널에 맞게 만들 수 있습니다.',
  },
  {
    id: 'export',
    badge: 'Export',
    title: 'PNG·ZIP으로 저장',
    specs: ['개별 PNG', '전체 ZIP', '토스 앱 사진첩'],
    description: '카드를 한 장씩 PNG로 저장하거나, 전체 카드를 ZIP 파일로 한 번에 내보냅니다.',
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
    /^192\.168\./.test(hostname) ||
    /^10\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)

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
            <p className="apple-hero-kicker">AI 카드뉴스 제작을 더 간단하게.</p>
            <h1 className="apple-hero-heading">
              떠오른 생각을<br />
              <span className="apple-text-gradient">카드뉴스로 완성하세요.</span>
            </h1>
            <p className="apple-hero-sub">
              오늘의 뉴스와 AI 초안으로 시작해 브랜드, 카피, 이미지를 직접 다듬고 저장하세요.<br />
              카드뉴스를 만드는 데 필요한 흐름을 한곳에 담았습니다.
            </p>
            
            <div className="apple-hero-actions">
              <a className="apple-btn-primary" href={studioHref}>카드뉴스 만들기</a>
              <a className="apple-btn-secondary" href="#how-to-use">제작 흐름 보기</a>
            </div>

            <div className="apple-jump-links">
              <a href="#how-to-use"><PillIcon name="steps" />사용 흐름</a>
              <a href="#features"><PillIcon name="features" />핵심 기능</a>
              <a href="#outputs"><PillIcon name="outputs" />출력 규격</a>
              <a href="#themes"><PillIcon name="themes" />브랜드 컬러</a>
            </div>
          </div>
          
          <div className="apple-hero-visual intro-reveal" data-reveal data-reveal-index={1}>
            <div className="apple-window apple-window--studio">
              <picture>
                <source media="(max-width: 480px)" srcSet="/studio-preview-mobile.png" />
                <img
                  className="apple-studio-preview"
                  src="/studio-preview.png"
                  alt="자동 생성과 직접 작성 방식을 고르는 Card Studio 시작 화면"
                />
              </picture>
            </div>
          </div>
        </section>

        {/* ─── 하이라이트 섹션 (Bento Box 스타일) ──────────────────────────────── */}
        <section className="apple-section apple-bento-section" id="features">
          <div className="apple-section-inner">
            <div className="apple-section-header intro-reveal" data-reveal>
              <h2 className="apple-section-heading">필요한 기능을<br />한 화면에서.</h2>
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
              <h2 className="apple-section-heading">자료를 찾고, 다듬고, 저장하는<br />5단계 흐름.</h2>
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
                <h2 className="apple-column-heading">만든 뒤 바로<br />활용할 수 있도록.</h2>
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
                <h2 className="apple-column-heading">브랜드 컬러도<br />내 방식대로.</h2>
                <div className="apple-themes-grid">
                  {[
                    { name: 'Orange', color: '#f15a24' },
                    { name: 'Blue', color: '#1868db' },
                    { name: 'Teal', color: '#0f8a8d' },
                    { name: 'Navy', color: '#1c2b42' },
                    { name: 'Slate', color: '#64748b' },
                    { name: '직접 설정', color: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)' },
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
            <h2>첫 카드뉴스를<br />지금 만들어보세요.</h2>
            <div className="apple-hero-actions">
              <a className="apple-btn-primary" href={studioHref}>카드뉴스 만들기</a>
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

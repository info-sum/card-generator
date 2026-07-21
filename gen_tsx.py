import os

TSX_CONTENT = """/**
 * IntroPage.tsx
 * SNS 카드 뉴스 생성기 서비스 소개 페이지
 */

import './IntroPage.css'
import { useEffect } from 'react'

type FeatureItem = {
  readonly id: string
  readonly icon: 'edit' | 'spark' | 'brand' | 'layout' | 'image' | 'font' | 'globe'
  readonly title: string
  readonly description: string
  readonly details: readonly string[]
  readonly isSmall?: boolean
}

type StepItem = {
  readonly id: string
  readonly number: string
  readonly icon: 'edit' | 'list' | 'spark' | 'layout' | 'export'
  readonly title: string
  readonly description: string
}

type OutputItem = {
  readonly id: string
  readonly title: string
  readonly items: readonly string[]
}

const FEATURES = [
  {
    id: 'research',
    icon: 'edit',
    title: '뉴스에서 초안까지',
    description: '뉴스·리서치·링크만 입력하면\\n핵심 내용과 흐름을 자동으로 정리해요.',
    details: ['자동 요약', '핵심 키워드 추출', '흐름 설계'],
  },
  {
    id: 'generate',
    icon: 'spark',
    title: '내 기준으로 AI 생성',
    description: '톤앤매너, 분량, 타깃에 맞게\\nAI가 최적의 카드 초안을 만들어요.',
    details: ['톤앤매너 설정', '분량 조절', '타깃 설정'],
  },
  {
    id: 'brand',
    icon: 'brand',
    title: '브랜드 템플릿',
    description: '로고, 폰트, 색상을 등록해\\n우리 브랜드에 맞는 결과물을 만들어요.',
    details: ['브랜드 키트', '일관된 디자인', '템플릿 저장'],
  },
  {
    id: 'easy-edit',
    icon: 'layout',
    title: '간편 편집',
    description: '텍스트, 이미지, 레이아웃을\\n드래그로 쉽게 편집해요.',
    details: [],
    isSmall: true,
  },
  {
    id: 'ai-image',
    icon: 'image',
    title: 'AI 이미지 생성',
    description: '주제에 맞는 이미지를\\nAI가 자동 생성해요.',
    details: [],
    isSmall: true,
  },
  {
    id: 'font-recommend',
    icon: 'font',
    title: '폰트 추천',
    description: '콘텐츠 분위기에 맞는\\n폰트를 추천해드려요.',
    details: [],
    isSmall: true,
  },
  {
    id: 'multi-lang',
    icon: 'globe',
    title: '다국어 지원',
    description: '다양한 언어로\\n카드 뉴스 제작이 가능해요.',
    details: [],
    isSmall: true,
  },
] as const satisfies readonly FeatureItem[]

function FeatureIcon({ name }: { name: string }) {
  const common = {
    width: 24,
    height: 24,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2.2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }

  switch (name) {
    case 'edit':
      return (
        <svg {...common}>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5z" />
        </svg>
      )
    case 'spark':
      return (
        <svg {...common}>
          <path d="m12 3 1.3 4.2L17 9l-3.7 1.8L12 15l-1.3-4.2L7 9l3.7-1.8L12 3z" />
          <path d="m18.5 14 .7 2.1 1.8.9-1.8.9-.7 2.1-.7-2.1L16 17l1.8-.9.7-2.1z" />
          <path d="M5 3v4M3 5h4" />
        </svg>
      )
    case 'brand':
      return (
        <svg {...common}>
          <path d="M4 6h16v13H4z" />
          <path d="M8 10h3v3H8z" />
          <path d="M14 10h3" />
          <path d="M14 14h3" />
        </svg>
      )
    case 'layout':
      return (
        <svg {...common}>
          <path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5z" />
          <path d="M4 12h16" />
          <path d="M9 3v9" />
        </svg>
      )
    case 'image':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      )
    case 'font':
      return (
        <svg {...common}>
          <polyline points="4 7 4 4 20 4 20 7" />
          <line x1="9" y1="20" x2="15" y2="20" />
          <line x1="12" y1="4" x2="12" y2="20" />
        </svg>
      )
    case 'globe':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      )
    case 'list':
      return (
        <svg {...common}>
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
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

function PillIcon({ name }: { name: string }) {
  const common = {
    width: 14,
    height: 14,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2.2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }

  switch (name) {
    case 'keyboard':
      return (
        <svg {...common}>
          <rect x="2" y="4" width="20" height="16" rx="2" ry="2"/>
          <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M7 16h10"/>
        </svg>
      )
    case 'flow':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="6" height="6" rx="1"/>
          <path d="M9 6h6"/>
          <rect x="15" y="3" width="6" height="6" rx="1"/>
          <path d="M18 9v6"/>
          <rect x="15" y="15" width="6" height="6" rx="1"/>
        </svg>
      )
    case 'ai':
      return (
        <svg {...common}>
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      )
    case 'edit':
      return (
        <svg {...common}>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5z" />
        </svg>
      )
    case 'export':
      return (
        <svg {...common}>
          <path d="M12 3v10" />
          <path d="M8 9l4 4 4-4" />
          <path d="M5 21h14" />
        </svg>
      )
    default:
      return null
  }
}

const STEPS = [
  {
    id: 'step-1',
    number: '01',
    icon: 'edit',
    title: '시작할 주제 선택',
    description: '키워드, 뉴스, 링크로\\n주제를 입력해요.',
  },
  {
    id: 'step-2',
    number: '02',
    icon: 'list',
    title: '생성 기준 설정',
    description: '톤, 길이, 분량,\\n타깃을 설정해요.',
  },
  {
    id: 'step-3',
    number: '03',
    icon: 'spark',
    title: '내용 생성',
    description: 'AI가 흐름에 맞는\\n카드 초안을 만들어요.',
  },
  {
    id: 'step-4',
    number: '04',
    icon: 'layout',
    title: '디자인 편집',
    description: '템플릿과 요소를\\n자유롭게 편집해요.',
  },
  {
    id: 'step-5',
    number: '05',
    icon: 'export',
    title: '확인 & 저장',
    description: '완성본을 확인하고\\n원하는 형식으로 저장해요.',
  },
] as const satisfies readonly StepItem[]

const OUTPUTS = [
  {
    id: 'export',
    title: '다양한 형식으로 내보내기',
    items: [
      'PNG / JPG (단일/전체)',
      'PDF (전체)',
      'PPTX (프레젠테이션)',
      'MP4 (카드 슬라이드 영상)',
    ],
  },
  {
    id: 'social',
    title: 'SNS / 채널에 바로 활용',
    items: [
      '인스타그램 피드 & 스토리',
      '페이스북 / 링크드인',
      '블로그 / 뉴스레터',
      '카카오톡 / 네이버 블로그',
    ],
  },
] as const satisfies readonly OutputItem[]

function IntroPage() {
  useEffect(() => {
    const targets = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'))
    if (targets.length === 0) return

    for (const el of targets) {
      const index = Number(el.dataset.revealIndex ?? '0')
      if (Number.isFinite(index) && index > 0) {
        el.style.setProperty('--intro-delay', `${index * 70}ms`)
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
      { root: null, threshold: 0.18, rootMargin: '0px 0px -8% 0px' },
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
      <nav className="intro-nav">
        <div className="intro-nav-inner">
          <a className="intro-nav-brand" href="/intro">
            <img src="/logo.svg" alt="Card Studio Logo" width="32" height="32" />
            <span>Card Studio</span>
          </a>
          <div className="intro-nav-links">
            <a className="intro-nav-link" href="#features">기능 소개</a>
            <a className="intro-nav-link" href="#how-to-use">이용 방법</a>
            <a className="intro-cta-btn" href={studioHref}>바로 시작하기</a>
          </div>
        </div>
      </nav>

      <main className="intro-main">
        {/* ─── 히어로 섹션 ─────────────────────────────────── */}
        <section className="intro-hero" id="hero-section">
          <div className="intro-hero-inner">
            <p className="intro-hero-kicker">AI CARD NEWS WORKSPACE</p>
            <h1 className="intro-hero-heading">
              이슈를 고르면,<br />
              <span className="intro-hero-highlight">카드 뉴스가 흐름으로</span><br />
              완성됩니다
            </h1>
            <p className="intro-hero-sub">
              뉴스·리서치·보고서·브랜드 소식을<br/>
              카드 뉴스로 자동 변환하고,<br/>
              한 번의 클릭으로 완성해보세요.
            </p>
            <div className="intro-hero-actions">
              <a className="intro-hero-primary-btn" href={studioHref}>
                카드 뉴스 만들기
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
              <a className="intro-hero-secondary-btn" href="#features">기능 살펴보기</a>
            </div>

            <div className="intro-jump-pills" aria-label="프로세스">
              <div className="intro-jump-pill"><PillIcon name="keyboard" />주제 입력</div>
              <div className="intro-jump-pill"><PillIcon name="flow" />흐름 설계</div>
              <div className="intro-jump-pill"><PillIcon name="ai" />AI 제작</div>
              <div className="intro-jump-pill"><PillIcon name="edit" />편집 & 디자인</div>
              <div className="intro-jump-pill"><PillIcon name="export" />내보내기</div>
            </div>

            <div className="intro-metrics">
              <div className="intro-metric">
                <strong>2만+</strong>
                <span>사용자</span>
              </div>
              <div className="intro-metric">
                <strong>4가지</strong>
                <span>콘텐츠 유형</span>
              </div>
              <div className="intro-metric">
                <strong>3가지</strong>
                <span>브랜드 템플릿</span>
              </div>
              <div className="intro-metric">
                <strong>20장</strong>
                <span>최대 카드 생성</span>
              </div>
            </div>
          </div>

          <div className="intro-hero-visual" aria-hidden="true">
            <div className="intro-studio-preview">
              <div className="intro-preview-bar">
                <span className="intro-preview-dot" />
                <strong>Card Studio</strong>
                <span className="intro-preview-status">내보내기</span>
              </div>
              <div className="intro-preview-body">
                <div className="intro-preview-rail">
                  {[1, 2, 3].map((slideNumber) => (
                    <div className={`intro-preview-thumb ${slideNumber === 1 ? 'is-active' : ''}`} key={slideNumber}>
                      <img src={`/demo-slide-${slideNumber}.svg`} alt="" loading="lazy" />
                      <span>0{slideNumber}</span>
                    </div>
                  ))}
                </div>
                <div className="intro-preview-canvas">
                  <img src="/demo-slide-1.svg" alt="" loading="lazy" />
                </div>
                <div className="intro-preview-controls">
                  <div className="intro-preview-control">
                    <span>템플릿</span>
                    <strong>모던 베이직 ▼</strong>
                  </div>
                  <div className="intro-preview-control">
                    <span>폰트</span>
                    <strong>Pretendard ▼</strong>
                  </div>
                  <div className="intro-preview-control">
                    <span>컬러</span>
                    <div className="intro-preview-swatches">
                      <i /><i /><i /><i /><i />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 사용 흐름 섹션 ──────────────────────────────── */}
        <section className="intro-section intro-steps-section" id="how-to-use">
          <div className="intro-section-inner">
            <div className="intro-section-header intro-reveal" data-reveal>
              <p className="intro-section-kicker">HOW TO USE</p>
              <h2 className="intro-section-heading">실제 작업 흐름 그대로,<br/>5단계로 완성</h2>
              <p className="intro-section-sub">
                복잡한 작업은 AI가 하고,<br/>
                당신은 핵심에만 집중하세요.
              </p>
            </div>

            <div className="intro-steps-row">
              {STEPS.map((step, index) => (
                <article
                  key={step.id}
                  className="intro-step-item intro-reveal"
                  data-reveal
                  data-reveal-index={index + 1}
                >
                  <div className="intro-step-number">{step.number}</div>
                  <div className="intro-step-icon">
                    <FeatureIcon name={step.icon} />
                  </div>
                  <h3 className="intro-step-title">{step.title}</h3>
                  <p className="intro-step-desc">
                    {step.description.split('\\n').map((line, i) => (
                      <span key={i}>{line}<br/></span>
                    ))}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ─── 기능 소개 섹션 ──────────────────────────────── */}
        <section className="intro-section intro-features-section" id="features">
          <div className="intro-section-inner">
            <div className="intro-section-header intro-reveal" data-reveal>
              <p className="intro-section-kicker">FEATURES</p>
              <h2 className="intro-section-heading">아이디어를<br/>결과물로 바꾸는 도구</h2>
              <p className="intro-section-sub">
                카드 스튜디오는 콘텐츠 제작의<br/>
                전 과정을 더 쉽고 빠르게 만듭니다.
              </p>
              <div className="intro-features-link">
                <a href="#features">모든 기능 보기 →</a>
              </div>
            </div>

            <div className="intro-features-grid">
              {FEATURES.map((feature, index) => (
                <article
                  key={feature.id}
                  className={[
                    'intro-feature-card',
                    'intro-reveal',
                    feature.id === 'research' ? 'intro-feature-card--xl' : '',
                    feature.isSmall ? 'intro-feature-card--sm' : ''
                  ].join(' ')}
                  data-reveal
                  data-reveal-index={index + 1}
                >
                  <div className="intro-feature-icon">
                    <FeatureIcon name={feature.icon} />
                  </div>
                  <h3 className="intro-feature-title">{feature.title}</h3>
                  <p className="intro-feature-desc">
                    {feature.description.split('\\n').map((line, i) => (
                      <span key={i}>{line}<br/></span>
                    ))}
                  </p>
                  {feature.details.length > 0 && (
                    <ul className="intro-feature-details">
                      {feature.details.map((detail) => <li key={detail}>{detail}</li>)}
                    </ul>
                  )}
                  {feature.isSmall && (
                    <div className="intro-feature-arrow">→</div>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ─── 출력 형식 섹션 ──────────────────────────────── */}
        <section className="intro-section intro-outputs-section" id="outputs">
          <div className="intro-section-inner">
            <div className="intro-outputs-layout intro-reveal" data-reveal>
              <div className="intro-outputs-header">
                <p className="intro-section-kicker">OUTPUT & EXPORT</p>
                <h2 className="intro-section-heading">SNS 포스팅부터<br/>일괄 저장까지</h2>
                <p className="intro-section-sub">
                  다양한 형식으로 내보내고,<br/>
                  여러 채널에 바로 활용하세요.
                </p>
                <div className="intro-features-link">
                  <a href="#outputs">자세히 보기 →</a>
                </div>
              </div>

              <div className="intro-outputs-grid">
                {OUTPUTS.map((output, index) => (
                  <article key={output.id} className="intro-output-card" data-reveal-index={index + 1}>
                    <h3 className="intro-output-title">{output.title}</h3>
                    <ul className="intro-output-specs">
                      {output.items.map((spec) => (
                        <li key={spec}>{spec}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── 브랜드 컬러 섹션 ────────────────────────────── */}
        <section className="intro-section intro-themes-section" id="themes">
          <div className="intro-section-inner">
            <div className="intro-themes-layout intro-reveal" data-reveal>
              <div className="intro-themes-header">
                <p className="intro-section-kicker">BRAND COLOR</p>
                <h2 className="intro-section-heading">브랜드 컬러를<br/>직접 고르세요</h2>
                <p className="intro-section-sub">
                  브랜드 아이덴티티에 맞는 색상으로<br/>
                  일관된 결과물을 만들어보세요.
                </p>
              </div>

              <div className="intro-themes-grid">
                <div className="intro-theme-card">
                  <div className="intro-theme-color" style={{ background: '#FF6B35' }}></div>
                  <div className="intro-theme-info">
                    <strong>Orange</strong>
                    <span>#FF6B35</span>
                  </div>
                </div>
                <div className="intro-theme-card">
                  <div className="intro-theme-color" style={{ background: '#2563EB' }}></div>
                  <div className="intro-theme-info">
                    <strong>Blue</strong>
                    <span>#2563EB</span>
                  </div>
                </div>
                <div className="intro-theme-card">
                  <div className="intro-theme-color" style={{ background: '#14B8A6' }}></div>
                  <div className="intro-theme-info">
                    <strong>Teal</strong>
                    <span>#14B8A6</span>
                  </div>
                </div>
                <div className="intro-theme-card">
                  <div className="intro-theme-color" style={{ background: '#0F172A' }}></div>
                  <div className="intro-theme-info">
                    <strong>Navy</strong>
                    <span>#0F172A</span>
                  </div>
                </div>
                <div className="intro-theme-card">
                  <div className="intro-theme-color" style={{ background: '#64748B' }}></div>
                  <div className="intro-theme-info">
                    <strong>Slate</strong>
                    <span>#64748B</span>
                  </div>
                </div>
                <div className="intro-theme-card intro-theme-card--custom">
                  <div className="intro-theme-color">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  </div>
                  <div className="intro-theme-info">
                    <strong>직접 설정</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── CTA 섹션 ─────────────────────────────────────── */}
        <section className="intro-cta-section" id="cta">
          <div className="intro-cta-inner">
            <div className="intro-cta-content">
              <h2 className="intro-cta-heading">첫 카드 뉴스, 지금 시작하세요</h2>
              <p className="intro-cta-sub">
                주제만 입력하면 AI가 흐름을 설계하고, 카드 뉴스로 완성해드립니다.
              </p>
              <div className="intro-cta-actions">
                <a className="intro-cta-main-btn" href={studioHref}>
                  카드 뉴스 만들기 →
                </a>
                <a className="intro-cta-link" href="#templates">
                  샘플 템플릿 보기
                </a>
              </div>
            </div>
            <div className="intro-cta-graphics">
              <div className="intro-cta-graphic-card intro-cta-graphic-card-1">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
              </div>
              <div className="intro-cta-graphic-card intro-cta-graphic-card-2">
                <span>Aa</span>
              </div>
              <svg className="intro-cta-stars" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              <svg className="intro-cta-lines" width="100" height="100" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10,80 Q30,90 50,70 T90,50" /><path d="M20,90 Q40,100 60,80 T100,60" /></svg>
            </div>
          </div>
        </section>
      </main>

      {/* ─── 푸터 ─────────────────────────────────────────── */}
      <footer className="intro-footer">
        <div className="intro-footer-inner">
          <div className="intro-footer-brand">
            <img src="/logo.svg" alt="Card Studio 로고" width="24" height="24" />
            <span>Card Studio</span>
          </div>
          <nav className="intro-footer-links" aria-label="푸터 네비게이션">
            <a href="#features">기능 소개</a>
            <a href="#how-to-use">이용 방법</a>
          </nav>
          <p className="intro-footer-copy">© 2024 Card Studio. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default IntroPage
"""

with open('/Users/beom/Documents/project/cardstudio/src/pages/IntroPage.tsx', 'w') as f:
    f.write(TSX_CONTENT)

print("IntroPage.tsx generated successfully.")

/**
 * IntroPage.tsx
 * SNS 카드 뉴스 생성기 서비스 소개 페이지
 * - 핵심 기능 소개, 사용 흐름 안내, CTA 섹션으로 구성
 */

import './IntroPage.css'

// ─── 기능 카드 데이터 타입 ───────────────────────────────────
type FeatureItem = {
  id: string
  icon: string
  title: string
  description: string
}

// ─── 사용 흐름 스텝 타입 ────────────────────────────────────
type StepItem = {
  id: string
  number: string
  title: string
  description: string
}

// ─── 출력 형식 타입 ─────────────────────────────────────────
type OutputItem = {
  id: string
  badge: string
  title: string
  specs: string[]
  description: string
}

// ─── 서비스 기능 목록 ────────────────────────────────────────
const FEATURES: FeatureItem[] = [
  {
    id: 'upload',
    icon: '/icons.svg#icon-upload',
    title: '사진 업로드',
    description:
      '사진첩에서 최대 20장의 이미지를 불러와 카드 뉴스의 배경으로 활용하세요. JPG, PNG 등 일반 이미지 포맷을 모두 지원합니다.',
  },
  {
    id: 'edit',
    icon: '/icons.svg#icon-edit',
    title: '장면별 카피 편집',
    description:
      '각 슬라이드마다 헤드라인, 서브 카피, 상단 라벨, 배지 문구를 개별 편집할 수 있습니다. 흐름에 맞는 스토리를 직접 구성하세요.',
  },
  {
    id: 'crop',
    icon: '/icons.svg#icon-crop',
    title: '구도 조정 및 줌',
    description:
      '이미지의 포커스 위치를 드래그로 조정하고, 줌 슬라이더로 확대 비율을 정밀하게 설정할 수 있습니다. 원하는 장면을 정확히 프레이밍하세요.',
  },
  {
    id: 'theme',
    icon: '/icons.svg#icon-palette',
    title: '컬러 테마 선택',
    description:
      'Ember, Tide, Graphite, Sunset, Midnight, Blossom 6가지 큐레이션 테마 중에서 브랜드 분위기에 맞는 색조를 선택하거나, 직접 컬러를 지정할 수 있습니다.',
  },
  {
    id: 'layout',
    icon: '/icons.svg#icon-layout',
    title: '레이아웃 선택',
    description:
      '전체화면 이미지 (오버레이), 상단 사진 + 하단 흰색, 상단 사진 + 하단 검정의 3가지 레이아웃을 전체 또는 장면별로 독립 설정할 수 있습니다.',
  },
  {
    id: 'export',
    icon: '/icons.svg#icon-download',
    title: 'PNG 내보내기',
    description:
      '완성된 카드 뉴스를 고해상도 PNG 이미지로 저장합니다. 슬라이드 전체를 한 번에 저장하는 일괄 내보내기를 지원합니다.',
  },
]

// ─── 사용 흐름 스텝 목록 ─────────────────────────────────────
const STEPS: StepItem[] = [
  {
    id: 'step-1',
    number: '01',
    title: '사진 선택',
    description:
      '사진첩에서 카드에 넣을 이미지를 고릅니다. 여러 장을 한 번에 선택할 수 있습니다.',
  },
  {
    id: 'step-2',
    number: '02',
    title: '정보 설정',
    description:
      '서비스 이름, 메인 메시지, 출력 모드(SNS/스토어), 해상도, 컬러 테마를 입력합니다.',
  },
  {
    id: 'step-3',
    number: '03',
    title: '장면 편집',
    description:
      '각 슬라이드의 구도를 조정하고 헤드라인, 설명, 배지 문구를 다듬습니다.',
  },
  {
    id: 'step-4',
    number: '04',
    title: '저장',
    description:
      '전체 미리보기를 확인한 뒤 PNG 이미지로 저장합니다. SNS에 바로 올릴 수 있습니다.',
  },
]

// ─── 출력 포맷 목록 ──────────────────────────────────────────
const OUTPUTS: OutputItem[] = [
  {
    id: 'social',
    badge: 'SNS',
    title: 'SNS 카드 뉴스',
    specs: ['1080 × 1080 (정방형)', '1080 × 1350 (세로형)', '1080 × 1920 (스토리)'],
    description:
      '인스타그램, 페이스북, 블로그 등 다양한 SNS 피드에 최적화된 카드 뉴스를 제작합니다.',
  },
  {
    id: 'appstore',
    badge: 'App Store',
    title: '앱스토어 소개 이미지',
    specs: ['1320 × 2868 (iPhone 6.9")', '1284 × 2778 (iPhone 6.5")', '1125 × 2436 (iPhone 6.1")'],
    description:
      '앱스토어 심사에 맞는 규격의 스크린샷 이미지를 내부 Phone Mockup과 함께 자동으로 생성합니다.',
  },
]

// ─── 컴포넌트 ────────────────────────────────────────────────
function IntroPage() {
  // 이용약관 페이지로 이동하는 함수
  function handleGoToTerms() {
    window.location.href = '/terms'
  }

  return (
    <div className="intro-shell">
      {/* ─── 상단 네비게이션 ─────────────────────────────── */}
      <nav className="intro-nav">
        <div className="intro-nav-inner">
          <a className="intro-nav-brand" href="/">
            <img src="/logo.svg" alt="SNS 카드 뉴스 생성기 로고" width="40" height="40" />
            <span>Card Studio</span>
          </a>
          <div className="intro-nav-actions">
            <button className="intro-nav-link" onClick={handleGoToTerms} type="button">이용약관</button>
          </div>
        </div>
      </nav>

      <main className="intro-main">
        {/* ─── 히어로 섹션 ─────────────────────────────────── */}
        <section className="intro-hero" id="hero-section">
          <div className="intro-hero-inner">
            <p className="intro-hero-kicker">SNS Card News Generator</p>
            <h1 className="intro-hero-heading">
              이미지 몇 장만으로<br />
              <span className="intro-hero-highlight">시선을 멈추게 하는</span><br />
              카드 뉴스를 만드세요
            </h1>
            <p className="intro-hero-sub">
              사진 업로드부터 카피 편집, 구도 조정, 컬러 테마 설정까지
              SNS 피드와 앱스토어 소개 이미지를 한 곳에서 완성할 수 있습니다.
            </p>
            <div className="intro-hero-actions">
              <button className="intro-hero-secondary-btn" onClick={handleGoToTerms} type="button">
                서비스 이용약관 보기
              </button>
            </div>

            {/* 지표 */}
            <div className="intro-metrics">
              <div className="intro-metric">
                <strong>20장</strong>
                <span>최대 슬라이드</span>
              </div>
              <div className="intro-metric">
                <strong>6가지</strong>
                <span>컬러 테마</span>
              </div>
              <div className="intro-metric">
                <strong>6가지</strong>
                <span>출력 해상도</span>
              </div>
              <div className="intro-metric">
                <strong>무료</strong>
                <span>완전 무료 제공</span>
              </div>
            </div>
          </div>

          {/* 데모 슬라이드 미리보기 */}
          <div className="intro-hero-visual" aria-hidden="true">
            <div className="intro-demo-stack">
              <div className="intro-demo-card intro-demo-card--back">
                <img src="/demo-slide-3.svg" alt="" />
              </div>
              <div className="intro-demo-card intro-demo-card--mid">
                <img src="/demo-slide-2.svg" alt="" />
              </div>
              <div className="intro-demo-card intro-demo-card--front">
                <img src="/demo-slide-1.svg" alt="" />
              </div>
            </div>
          </div>
        </section>

        {/* ─── 사용 흐름 섹션 ──────────────────────────────── */}
        <section className="intro-section intro-steps-section" id="how-to-use">
          <div className="intro-section-inner">
            <div className="intro-section-header">
              <p className="intro-section-kicker">How To Use</p>
              <h2 className="intro-section-heading">4단계로 완성하는 카드 뉴스</h2>
              <p className="intro-section-sub">복잡한 디자인 툴 없이, 사진과 텍스트만 있으면 충분합니다.</p>
            </div>

            <div className="intro-steps-grid">
              {STEPS.map((step) => (
                <article key={step.id} className="intro-step-card">
                  <div className="intro-step-number">{step.number}</div>
                  <div className="intro-step-copy">
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ─── 기능 소개 섹션 ──────────────────────────────── */}
        <section className="intro-section intro-features-section" id="features">
          <div className="intro-section-inner">
            <div className="intro-section-header">
              <p className="intro-section-kicker">Features</p>
              <h2 className="intro-section-heading">필요한 기능은 모두 갖췄습니다</h2>
              <p className="intro-section-sub">
                SNS 카드 뉴스 제작에 꼭 필요한 기능들을 하나의 흐름으로 통합했습니다.
              </p>
            </div>

            <div className="intro-features-grid">
              {FEATURES.map((feature) => (
                <article key={feature.id} className="intro-feature-card">
                  <div className="intro-feature-icon">
                    <svg width="24" height="24" aria-hidden="true">
                      <use href={feature.icon} />
                    </svg>
                  </div>
                  <h3 className="intro-feature-title">{feature.title}</h3>
                  <p className="intro-feature-desc">{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ─── 출력 형식 섹션 ──────────────────────────────── */}
        <section className="intro-section intro-outputs-section" id="outputs">
          <div className="intro-section-inner">
            <div className="intro-section-header">
              <p className="intro-section-kicker">Output Formats</p>
              <h2 className="intro-section-heading">두 가지 출력 모드</h2>
              <p className="intro-section-sub">
                SNS 피드용 카드 뉴스와 앱스토어 심사용 소개 이미지를 동시에 지원합니다.
              </p>
            </div>

            <div className="intro-outputs-grid">
              {OUTPUTS.map((output) => (
                <article key={output.id} className="intro-output-card">
                  <div className="intro-output-badge">{output.badge}</div>
                  <h3 className="intro-output-title">{output.title}</h3>
                  <p className="intro-output-desc">{output.description}</p>
                  <ul className="intro-output-specs">
                    {output.specs.map((spec) => (
                      <li key={spec}>{spec}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ─── 테마 소개 섹션 ──────────────────────────────── */}
        <section className="intro-section intro-themes-section" id="themes">
          <div className="intro-section-inner">
            <div className="intro-section-header">
              <p className="intro-section-kicker">Color Themes</p>
              <h2 className="intro-section-heading">브랜드에 맞는 6가지 테마</h2>
              <p className="intro-section-sub">
                정교하게 큐레이션된 컬러 팔레트로 즉시 브랜드감 있는 결과물을 만들 수 있습니다.
              </p>
            </div>

            <div className="intro-themes-grid">
              {/* Ember */}
              <div className="intro-theme-chip intro-theme-chip--ember">
                <span className="intro-theme-dot" />
                <span>Ember</span>
              </div>
              {/* Tide */}
              <div className="intro-theme-chip intro-theme-chip--tide">
                <span className="intro-theme-dot" />
                <span>Tide</span>
              </div>
              {/* Graphite */}
              <div className="intro-theme-chip intro-theme-chip--graphite">
                <span className="intro-theme-dot" />
                <span>Graphite</span>
              </div>
              {/* Sunset */}
              <div className="intro-theme-chip intro-theme-chip--sunset">
                <span className="intro-theme-dot" />
                <span>Sunset</span>
              </div>
              {/* Midnight */}
              <div className="intro-theme-chip intro-theme-chip--midnight">
                <span className="intro-theme-dot" />
                <span>Midnight</span>
              </div>
              {/* Blossom */}
              <div className="intro-theme-chip intro-theme-chip--blossom">
                <span className="intro-theme-dot" />
                <span>Blossom</span>
              </div>
              {/* Custom */}
              <div className="intro-theme-chip intro-theme-chip--custom">
                <span className="intro-theme-dot intro-theme-dot--custom" />
                <span>직접 설정</span>
              </div>
            </div>
          </div>
        </section>

        {/* ─── CTA 섹션 ─────────────────────────────────────── */}
        <section className="intro-cta-section" id="cta">
          <div className="intro-cta-inner">
            <p className="intro-section-kicker">Legal</p>
            <h2 className="intro-cta-heading">서비스 이용약관을 확인하세요</h2>
            <p className="intro-cta-sub">
              Card Studio 이용 조건, 저작권, 개인정보 처리 방침 등<br />
              서비스 이용 전 꼭 확인해 주세요.
            </p>
            <button className="intro-cta-main-btn" onClick={handleGoToTerms} type="button">
              이용약관 보기
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </section>
      </main>

      {/* ─── 푸터 ─────────────────────────────────────────── */}
      <footer className="intro-footer">
        <div className="intro-footer-inner">
          <div className="intro-footer-brand">
            <img src="/logo.svg" alt="Card Studio 로고" width="32" height="32" />
            <span>Card Studio</span>
          </div>
          <nav className="intro-footer-links" aria-label="푸터 네비게이션">
            <button type="button" onClick={handleGoToTerms}>이용약관</button>
          </nav>
          <p className="intro-footer-copy">© 2026 Card Studio. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default IntroPage

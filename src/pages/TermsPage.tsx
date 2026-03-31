/**
 * TermsPage.tsx
 * SNS 카드 뉴스 생성기 서비스 이용약관 페이지
 * - 서비스 이용 조건, 개인정보 처리 방침, 저작권, 면책조항 등 포함
 */

import './TermsPage.css'

// ─── 약관 섹션 타입 ──────────────────────────────────────────
type TermsSection = {
  id: string
  article: string
  title: string
  content: (TermsParagraph | TermsList)[]
}

type TermsParagraph = {
  type: 'paragraph'
  text: string
}

type TermsList = {
  type: 'list'
  items: string[]
}

// ─── 약관 데이터 ─────────────────────────────────────────────
const TERMS_SECTIONS: TermsSection[] = [
  {
    id: 'article-1',
    article: '제 1 조',
    title: '목적',
    content: [
      {
        type: 'paragraph',
        text: '이 약관은 Card Studio (이하 "서비스")가 제공하는 SNS 카드 뉴스 생성 서비스의 이용 조건 및 절차, 이용자와 서비스 사이의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.',
      },
    ],
  },
  {
    id: 'article-2',
    article: '제 2 조',
    title: '정의',
    content: [
      {
        type: 'paragraph',
        text: '이 약관에서 사용하는 용어의 정의는 다음과 같습니다.',
      },
      {
        type: 'list',
        items: [
          '"서비스"란 Card Studio가 제공하는 SNS 카드 뉴스 및 앱스토어 소개 이미지 생성 도구 일체를 말합니다.',
          '"이용자"란 이 약관에 따라 서비스를 이용하는 개인 또는 단체를 말합니다.',
          '"콘텐츠"란 이용자가 서비스를 통해 업로드하거나 생성한 이미지, 텍스트 등 모든 정보를 말합니다.',
          '"결과물"이란 서비스를 통해 제작·저장된 카드 뉴스 이미지 파일(PNG 등)을 말합니다.',
        ],
      },
    ],
  },
  {
    id: 'article-3',
    article: '제 3 조',
    title: '약관의 게시 및 변경',
    content: [
      {
        type: 'paragraph',
        text: '서비스는 이 약관의 내용을 이용자가 쉽게 확인할 수 있도록 서비스 내 소개 페이지 또는 이용약관 페이지에 게시합니다.',
      },
      {
        type: 'paragraph',
        text: '서비스는 관련 법령을 위반하지 않는 범위에서 이 약관을 변경할 수 있으며, 변경 시 변경 사유 및 적용 일자를 명시하여 서비스 내에 공지합니다. 변경된 약관의 적용일 이후에 서비스를 계속 이용하면 변경 약관에 동의한 것으로 간주합니다.',
      },
    ],
  },
  {
    id: 'article-4',
    article: '제 4 조',
    title: '서비스 이용',
    content: [
      {
        type: 'paragraph',
        text: '서비스는 별도의 회원가입 없이 웹 브라우저를 통해 무료로 이용할 수 있습니다. 단, 서비스 이용에는 인터넷 연결 환경이 필요합니다.',
      },
      {
        type: 'paragraph',
        text: '서비스는 다음의 주요 기능을 제공합니다.',
      },
      {
        type: 'list',
        items: [
          '이미지 업로드 및 최적화 처리 (최대 20장)',
          '슬라이드별 텍스트 카피 편집 (헤드라인, 설명, 레이블, 배지)',
          '이미지 구도 조정 (포커스 이동 및 줌 설정)',
          '컬러 테마 선택 (6가지 프리셋 및 사용자 정의)',
          '카드 레이아웃 선택 (오버레이, 분할 라이트, 분할 다크)',
          'SNS 카드 뉴스 및 앱스토어 소개 이미지 PNG 내보내기',
          '작업 초안 자동 저장 및 복원 (로컬 스토리지 기반)',
        ],
      },
      {
        type: 'paragraph',
        text: '서비스는 운영상·기술상의 이유로 일시적으로 서비스 제공을 중단하거나 기능 일부를 변경할 수 있습니다.',
      },
    ],
  },
  {
    id: 'article-5',
    article: '제 5 조',
    title: '이용자의 의무',
    content: [
      {
        type: 'paragraph',
        text: '이용자는 서비스를 이용함에 있어 다음 행위를 해서는 안 됩니다.',
      },
      {
        type: 'list',
        items: [
          '타인의 저작권, 초상권, 상표권 등 지식재산권을 침해하는 이미지 또는 콘텐츠를 업로드하거나 유포하는 행위',
          '음란·폭력·혐오적 콘텐츠를 제작하거나 유포하는 행위',
          '허위 정보 또는 타인을 기망할 목적으로 서비스를 이용하는 행위',
          '서비스의 정상적인 운영을 방해할 목적으로 서비스를 이용하는 행위',
          '서비스를 통해 생성된 결과물로 타인의 명예를 훼손하거나 프라이버시를 침해하는 행위',
          '관련 법령에서 금지하거나 공서양속에 반하는 행위',
        ],
      },
      {
        type: 'paragraph',
        text: '이용자가 위 조항을 위반하여 발생한 모든 법적 책임은 이용자 본인에게 있으며, 서비스는 이에 대해 어떠한 책임도 지지 않습니다.',
      },
    ],
  },
  {
    id: 'article-6',
    article: '제 6 조',
    title: '콘텐츠 및 저작권',
    content: [
      {
        type: 'paragraph',
        text: '이용자가 서비스에 업로드한 이미지와 입력한 텍스트를 포함한 모든 콘텐츠의 저작권은 이용자 본인 또는 해당 저작권자에게 있습니다.',
      },
      {
        type: 'paragraph',
        text: '서비스를 통해 제작된 결과물(PNG 이미지)의 이용 권리는 이용자에게 있습니다. 이용자는 결과물을 SNS 게시, 앱스토어 등록, 마케팅 자료 등 합법적인 목적으로 자유롭게 사용할 수 있습니다.',
      },
      {
        type: 'paragraph',
        text: '서비스 자체의 로고, UI 디자인, 소스코드 등은 서비스 운영자의 지식재산권 보호 대상이며, 무단 복제·수정·배포를 금지합니다.',
      },
      {
        type: 'paragraph',
        text: '업로드된 이미지는 서비스의 처리 과정에서 기기 내 브라우저 메모리에만 임시로 사용되며, 서비스 서버에 전송되거나 저장되지 않습니다.',
      },
    ],
  },
  {
    id: 'article-7',
    article: '제 7 조',
    title: '개인정보 처리',
    content: [
      {
        type: 'paragraph',
        text: '서비스는 이용자로부터 별도의 개인정보를 수집하지 않습니다. 회원가입, 로그인 등 인증 과정이 없어 이름, 이메일, 연락처 등 개인 식별 정보를 수집하거나 저장하지 않습니다.',
      },
      {
        type: 'paragraph',
        text: '서비스는 이용자가 업로드한 이미지나 입력한 텍스트를 서버로 전송하거나 저장하지 않습니다. 모든 편집 작업은 이용자의 기기에서 이루어집니다.',
      },
      {
        type: 'paragraph',
        text: '작업 초안은 이용자의 기기에 있는 로컬 스토리지(localStorage)에만 저장됩니다. 브라우저 설정에서 언제든지 삭제할 수 있으며, 서비스는 이 데이터에 접근하지 않습니다.',
      },
      {
        type: 'paragraph',
        text: '서비스는 서비스 품질 개선을 위해 익명화된 접속 통계(페이지 뷰 등)를 수집할 수 있으며, 이는 개인을 식별할 수 없는 정보입니다.',
      },
    ],
  },
  {
    id: 'article-8',
    article: '제 8 조',
    title: '서비스의 면책',
    content: [
      {
        type: 'paragraph',
        text: '서비스는 이용자가 서비스를 통해 제작한 결과물의 내용, 정확성, 완전성에 대해 책임을 지지 않습니다.',
      },
      {
        type: 'paragraph',
        text: '서비스는 다음의 경우에 발생한 손해에 대해 책임을 지지 않습니다.',
      },
      {
        type: 'list',
        items: [
          '천재지변, 전쟁, 테러, 해킹, 바이러스 등 불가항력적인 사유로 인한 서비스 중단',
          '이용자의 귀책 사유로 인한 서비스 이용의 장애 또는 손해',
          '서비스 이용 중 발생한 이용자 기기의 데이터 손실',
          '이용자가 서비스를 통해 게시·공유한 콘텐츠로 인해 발생한 제3자와의 분쟁',
          '서비스를 통해 생성된 결과물이 제3자의 권리를 침해하여 발생한 법적 분쟁',
          '무료 서비스의 특성상 서비스 미제공 또는 변경으로 인한 손해',
        ],
      },
    ],
  },
  {
    id: 'article-9',
    article: '제 9 조',
    title: '서비스 중단 및 종료',
    content: [
      {
        type: 'paragraph',
        text: '서비스는 다음의 경우 사전 공지 없이 서비스 제공을 일시 중단하거나 종료할 수 있습니다.',
      },
      {
        type: 'list',
        items: [
          '서버 또는 시스템의 점검·보수·교체 등 기술적 필요가 있는 경우',
          '전기통신사업자가 전기통신 서비스를 중단한 경우',
          '서비스 운영상 중단이 필요하다고 판단되는 경우',
          '법령 또는 규정의 변경으로 인해 서비스 제공이 어려운 경우',
        ],
      },
      {
        type: 'paragraph',
        text: '서비스를 영구적으로 종료할 경우, 종료 30일 전에 서비스 내에 공지합니다.',
      },
    ],
  },
  {
    id: 'article-10',
    article: '제 10 조',
    title: '준거법 및 관할',
    content: [
      {
        type: 'paragraph',
        text: '이 약관의 해석 및 적용에 관하여는 대한민국 법률을 적용합니다.',
      },
      {
        type: 'paragraph',
        text: '서비스 이용과 관련하여 분쟁이 발생한 경우, 서비스 운영자의 주소지를 관할하는 법원을 전속 관할법원으로 합니다.',
      },
    ],
  },
]

// ─── 컴포넌트 ────────────────────────────────────────────────
function TermsPage() {
  // 소개 페이지로 이동
  function handleGoToIntro() {
    window.location.href = '/intro'
  }

  // 특정 조항으로 스크롤
  function scrollToArticle(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="terms-shell">
      {/* ─── 상단 네비게이션 ─────────────────────────────── */}
      <nav className="terms-nav">
        <div className="terms-nav-inner">
          <a className="terms-nav-brand" href="/">
            <img src="/logo.svg" alt="Card Studio 로고" width="36" height="36" />
            <span>Card Studio</span>
          </a>
          <div className="terms-nav-actions">
            <button className="terms-nav-link" onClick={handleGoToIntro} type="button">서비스 소개</button>
          </div>
        </div>
      </nav>

      <div className="terms-layout">
        {/* ─── 사이드바 목차 ──────────────────────────────── */}
        <aside className="terms-sidebar">
          <div className="terms-sidebar-inner">
            <p className="terms-sidebar-label">목차</p>
            <nav aria-label="약관 목차">
              {TERMS_SECTIONS.map((section) => (
                <button
                  key={section.id}
                  className="terms-toc-item"
                  onClick={() => scrollToArticle(section.id)}
                  type="button"
                >
                  <span className="terms-toc-article">{section.article}</span>
                  <span className="terms-toc-title">{section.title}</span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* ─── 본문 ────────────────────────────────────────── */}
        <main className="terms-main">
          {/* 헤더 */}
          <header className="terms-header">
            <p className="terms-header-kicker">Legal</p>
            <h1 className="terms-header-heading">서비스 이용약관</h1>
            <div className="terms-header-meta">
              <span>시행일: 2026년 4월 1일</span>
              <span>버전: v1.0</span>
            </div>
            <div className="terms-notice">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
              <p>
                Card Studio 서비스를 이용하시기 전에 본 이용약관을 주의 깊게 읽어보시기 바랍니다.
                서비스를 이용하시면 본 약관에 동의하신 것으로 간주합니다.
              </p>
            </div>
          </header>

          {/* 약관 조항 */}
          {TERMS_SECTIONS.map((section) => (
            <article key={section.id} id={section.id} className="terms-article">
              <div className="terms-article-header">
                <span className="terms-article-badge">{section.article}</span>
                <h2 className="terms-article-title">{section.title}</h2>
              </div>
              <div className="terms-article-body">
                {section.content.map((block, idx) => {
                  if (block.type === 'paragraph') {
                    return (
                      <p key={idx} className="terms-paragraph">
                        {block.text}
                      </p>
                    )
                  }
                  return (
                    <ul key={idx} className="terms-list">
                      {block.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )
                })}
              </div>
            </article>
          ))}

          {/* 하단 정보 */}
          <div className="terms-footer-note">
            <p>본 이용약관에 관한 문의사항이 있으시면 서비스 소개 페이지를 통해 연락해 주세요.</p>
            <div className="terms-footer-actions">
              <button type="button" onClick={handleGoToIntro} className="terms-action-btn terms-action-btn--primary">
                서비스 소개 보기
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default TermsPage

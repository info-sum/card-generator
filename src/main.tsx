/**
 * main.tsx
 * 앱 진입점 — URL 경로에 따라 적절한 페이지 컴포넌트를 렌더링하는 경량 라우터
 * /intro  → 서비스 소개 페이지
 * /terms  → 이용약관 페이지
 * /       → 메인 카드 스튜디오 앱
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import IntroPage from './pages/IntroPage.tsx'
import TermsPage from './pages/TermsPage.tsx'

// ─── 현재 경로를 기준으로 렌더링할 컴포넌트 결정 ──────────────
function Router() {
  const pathname = window.location.pathname

  // 소개 페이지
  if (pathname === '/intro' || pathname === '/intro/') {
    return <IntroPage />
  }

  // 이용약관 페이지
  if (pathname === '/terms' || pathname === '/terms/') {
    return <TermsPage />
  }

  // 기본: 루트는 소개 페이지로 리다이렉트
  window.location.replace('/intro')
  return null
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router />
  </StrictMode>,
)


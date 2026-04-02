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
import App from './App.tsx'
import IntroPage from './pages/IntroPage.tsx'
import TermsPage from './pages/TermsPage.tsx'

// ─── 현재 경로를 기준으로 렌더링할 화면 결정 (엔트리 파일에서 컴포넌트 export 불필요) ──────────────
const pathname = window.location.pathname
const hostname = window.location.hostname

const isLocalDevHost =
  hostname === 'localhost' ||
  hostname === '127.0.0.1' ||
  hostname === '0.0.0.0' ||
  hostname.endsWith('.local') ||
  /^192\\.168\\./.test(hostname) ||
  /^10\\./.test(hostname) ||
  /^172\\.(1[6-9]|2\\d|3[0-1])\\./.test(hostname)

// Production default: root path shows the landing (/intro), not the editor.
if (!isLocalDevHost && (pathname === '/' || pathname === '/index.html')) {
  window.location.replace('/intro')
}

let rootElement: JSX.Element

if (pathname === '/intro' || pathname === '/intro/') {
  rootElement = <IntroPage />
} else if (pathname === '/terms' || pathname === '/terms/') {
  rootElement = <TermsPage />
} else if (pathname === '/studio' || pathname === '/studio/' || pathname === '/app' || pathname === '/app/') {
  rootElement = <App />
} else {
  // 기본: 편집기(App). Vercel rewrites로 deep link도 index.html로 들어오므로 여기서 App로 처리합니다.
  rootElement = <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {rootElement}
  </StrictMode>,
)

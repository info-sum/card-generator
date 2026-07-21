import os

CSS_CONTENT = """/**
 * IntroPage.css
 * SNS 카드 뉴스 생성기 서비스 소개 페이지 스타일
 */

:root {
  --intro-bg: #fafafa;
  --intro-surface: #ffffff;
  --intro-border: #eaeaea;
  --intro-border-strong: #d0d0d0;
  --intro-text: #1a1a1a;
  --intro-text-light: #fff;
  --intro-muted: #737373;
  --intro-accent: #ff471a;
  --intro-action: #000000;
  --intro-action-hover: #333333;
  --intro-radius-sm: 8px;
  --intro-radius-md: 16px;
  --intro-radius-lg: 24px;
  --intro-font: 'Pretendard Variable', -apple-system, sans-serif;
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
}

html {
  scroll-behavior: smooth;
}

.intro-shell {
  min-height: 100dvh;
  background: var(--intro-bg);
  color: var(--intro-text);
  font-family: var(--intro-font);
  line-height: 1.6;
  word-break: keep-all;
}

.intro-shell a {
  text-decoration: none;
  color: inherit;
}

.intro-shell button, .intro-shell a {
  -webkit-tap-highlight-color: transparent;
  transition: all 0.2s;
}

/* ─── 네비게이션 ─────────────────────────────────────────── */
.intro-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--intro-border);
}

.intro-nav-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.intro-nav-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 800;
  font-size: 18px;
}

.intro-nav-brand img {
  border-radius: 6px;
}

.intro-nav-links {
  display: flex;
  align-items: center;
  gap: 24px;
}

.intro-nav-link {
  font-size: 14px;
  font-weight: 600;
  color: var(--intro-text);
}

.intro-nav-link:hover {
  color: var(--intro-accent);
}

.intro-cta-btn {
  background: var(--intro-action);
  color: var(--intro-text-light);
  padding: 10px 18px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 700;
}
.intro-cta-btn:hover {
  background: var(--intro-action-hover);
}

/* ─── 공통 ─────────────────────────────────────────────── */
.intro-main {
  display: flex;
  flex-direction: column;
}
.intro-section {
  padding: 100px 24px;
}
.intro-section-inner {
  max-width: 1200px;
  margin: 0 auto;
}
.intro-section-kicker {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.1em;
  color: var(--intro-accent);
  margin-bottom: 12px;
  text-transform: uppercase;
}
.intro-section-heading {
  font-size: 36px;
  font-weight: 800;
  line-height: 1.3;
  margin: 0 0 16px;
  letter-spacing: -0.02em;
}
.intro-section-sub {
  font-size: 16px;
  color: var(--intro-muted);
  line-height: 1.6;
  margin: 0;
}
.intro-features-link {
  margin-top: 24px;
}
.intro-features-link a {
  font-size: 14px;
  font-weight: 700;
  color: var(--intro-text);
  border-bottom: 1px solid var(--intro-text);
  padding-bottom: 2px;
}

/* ─── Scroll Reveal ──────────────────────────────────────── */
.intro-reveal {
  opacity: 0;
  transform: translateY(20px);
  animation: revealUp 0.6s var(--ease-out) forwards;
  animation-delay: var(--intro-delay, 0ms);
}
.intro-reveal.is-in {
  opacity: 1;
  transform: translateY(0);
}
@keyframes revealUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ─── 히어로 섹션 ────────────────────────────────────────── */
.intro-hero {
  padding: 80px 24px 100px;
  background: #fff;
  border-bottom: 1px solid var(--intro-border);
}

.intro-hero-inner {
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 2;
}

.intro-hero-kicker {
  font-size: 12px;
  font-weight: 800;
  color: var(--intro-accent);
  letter-spacing: 0.1em;
  margin-bottom: 24px;
}

.intro-hero-heading {
  font-size: 56px;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.03em;
  margin: 0 0 24px;
}

.intro-hero-highlight {
  color: var(--intro-accent);
}

.intro-hero-sub {
  font-size: 18px;
  color: var(--intro-muted);
  line-height: 1.6;
  margin: 0 0 40px;
}

.intro-hero-actions {
  display: flex;
  gap: 16px;
  margin-bottom: 60px;
}

.intro-hero-primary-btn {
  background: var(--intro-action);
  color: var(--intro-text-light);
  padding: 16px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.intro-hero-secondary-btn {
  background: #fff;
  color: var(--intro-text);
  border: 1px solid var(--intro-border-strong);
  padding: 16px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 700;
}

.intro-jump-pills {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 40px;
}

.intro-jump-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--intro-muted);
}
.intro-jump-pills > .intro-jump-pill:not(:last-child)::after {
  content: '>';
  margin-left: 12px;
  color: var(--intro-border-strong);
}

.intro-metrics {
  display: flex;
  gap: 40px;
  border-top: 1px solid var(--intro-border);
  padding-top: 40px;
  max-width: 600px;
}

.intro-metric {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.intro-metric strong {
  font-size: 24px;
  font-weight: 800;
}

.intro-metric span {
  font-size: 13px;
  color: var(--intro-muted);
  font-weight: 600;
}

.intro-hero-visual {
  position: absolute;
  top: 80px;
  right: 24px;
  width: 500px;
  z-index: 1;
}

.intro-studio-preview {
  background: #fff;
  border-radius: var(--intro-radius-lg);
  box-shadow: 0 20px 60px rgba(0,0,0,0.08);
  border: 1px solid var(--intro-border);
  overflow: hidden;
}

.intro-preview-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--intro-border);
}

.intro-preview-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--intro-text);
}

.intro-preview-status {
  margin-left: auto;
  font-size: 11px;
  background: #f1f1f1;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
}

.intro-preview-body {
  display: flex;
  padding: 16px;
  gap: 16px;
  height: 380px;
}

.intro-preview-rail {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 60px;
}

.intro-preview-thumb {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 8px;
  background: #f5f5f5;
  border: 2px solid transparent;
  position: relative;
  overflow: hidden;
}
.intro-preview-thumb.is-active {
  border-color: var(--intro-text);
}
.intro-preview-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.intro-preview-thumb span {
  position: absolute;
  top: 4px;
  left: 4px;
  font-size: 9px;
  font-weight: 700;
  color: #fff;
  background: rgba(0,0,0,0.4);
  padding: 2px 4px;
  border-radius: 4px;
}

.intro-preview-canvas {
  flex: 1;
  background: #f5f5f5;
  border-radius: 12px;
  overflow: hidden;
}
.intro-preview-canvas img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.intro-preview-controls {
  width: 160px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.intro-preview-control {
  font-size: 12px;
  background: #fafafa;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--intro-border);
}
.intro-preview-control span {
  display: block;
  color: var(--intro-muted);
  font-size: 11px;
  margin-bottom: 4px;
}
.intro-preview-control strong {
  display: block;
}
.intro-preview-swatches {
  display: flex;
  gap: 4px;
  margin-top: 8px;
}
.intro-preview-swatches i {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--intro-text);
}
.intro-preview-swatches i:nth-child(2) { background: #FF6B35; }
.intro-preview-swatches i:nth-child(3) { background: #2563EB; }
.intro-preview-swatches i:nth-child(4) { background: #14B8A6; }
.intro-preview-swatches i:nth-child(5) { background: #FDE68A; }


/* ─── 사용 흐름 ──────────────────────────────────────────── */
.intro-steps-section {
  background: #fafafa;
  text-align: center;
}
.intro-steps-section .intro-section-header {
  margin-bottom: 60px;
}
.intro-steps-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  position: relative;
  max-width: 1000px;
  margin: 0 auto;
}
.intro-steps-row::before {
  content: '';
  position: absolute;
  top: 30px;
  left: 60px;
  right: 60px;
  height: 1px;
  border-top: 2px dashed var(--intro-border-strong);
  z-index: 0;
}
.intro-step-item {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 160px;
}
.intro-step-number {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #fff;
  border: 1px solid var(--intro-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 800;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}
.intro-step-icon {
  margin-bottom: 16px;
  color: var(--intro-text);
}
.intro-step-title {
  font-size: 16px;
  font-weight: 800;
  margin: 0 0 8px;
}
.intro-step-desc {
  font-size: 13px;
  color: var(--intro-muted);
  line-height: 1.5;
  margin: 0;
}


/* ─── 기능 소개 ──────────────────────────────────────────── */
.intro-features-section {
  background: #fff;
}
.intro-features-section .intro-section-header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: 40px;
}
.intro-features-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}
.intro-feature-card {
  background: #fafafa;
  border: 1px solid var(--intro-border);
  border-radius: var(--intro-radius-md);
  padding: 32px;
  display: flex;
  flex-direction: column;
}
.intro-feature-card--xl {
  grid-column: span 2;
  grid-row: span 2;
  background: #f4f6f8;
}
.intro-feature-card--sm {
  padding: 24px;
  flex-direction: row;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}
.intro-feature-card:not(.intro-feature-card--sm):not(.intro-feature-card--xl) {
  grid-column: span 2;
}

.intro-feature-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  color: var(--intro-accent);
}
.intro-feature-card--sm .intro-feature-icon {
  margin-bottom: 0;
  color: var(--intro-text);
}

.intro-feature-title {
  font-size: 20px;
  font-weight: 800;
  margin: 0 0 12px;
}
.intro-feature-card--sm .intro-feature-title {
  font-size: 16px;
  margin: 0;
  width: 100%;
}

.intro-feature-desc {
  font-size: 15px;
  color: var(--intro-muted);
  line-height: 1.6;
  margin: 0;
}
.intro-feature-card--sm .intro-feature-desc {
  font-size: 13px;
  display: none; /* hidden in small cards to match UI if needed, actually image shows them! */
}
.intro-feature-card--sm .intro-feature-desc {
  display: block;
  width: 100%;
}

.intro-feature-details {
  margin: auto 0 0;
  padding: 24px 0 0;
  list-style: none;
  display: flex;
  gap: 8px;
}
.intro-feature-details li {
  font-size: 12px;
  font-weight: 600;
  color: var(--intro-muted);
  background: #fff;
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid var(--intro-border);
}

.intro-feature-arrow {
  margin-left: auto;
  font-weight: 800;
  color: var(--intro-muted);
}


/* ─── 출력 형식 & 브랜드 컬러 공통 레이아웃 ───────────────── */
.intro-outputs-layout,
.intro-themes-layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 60px;
  align-items: flex-start;
}
.intro-outputs-header,
.intro-themes-header {
  position: sticky;
  top: 100px;
}


/* ─── 출력 형식 ──────────────────────────────────────────── */
.intro-outputs-section {
  background: #fafafa;
}
.intro-outputs-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.intro-output-card {
  background: #fff;
  border: 1px solid var(--intro-border);
  border-radius: var(--intro-radius-md);
  padding: 40px;
}
.intro-output-title {
  font-size: 18px;
  font-weight: 800;
  margin: 0 0 24px;
}
.intro-output-specs {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.intro-output-specs li {
  font-size: 15px;
  color: var(--intro-muted);
  display: flex;
  align-items: center;
  gap: 12px;
}
.intro-output-specs li::before {
  content: '';
  display: block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--intro-accent);
}


/* ─── 브랜드 컬러 ────────────────────────────────────────── */
.intro-themes-section {
  background: #fff;
}
.intro-themes-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}
.intro-theme-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: calc(33.333% - 14px);
}
.intro-theme-color {
  width: 100%;
  aspect-ratio: 1.5;
  border-radius: 12px;
  border: 1px solid var(--intro-border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--intro-muted);
}
.intro-theme-card--custom .intro-theme-color {
  background: #fafafa;
  border-style: dashed;
}
.intro-theme-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.intro-theme-info strong {
  font-size: 14px;
  font-weight: 800;
}
.intro-theme-info span {
  font-size: 12px;
  color: var(--intro-muted);
  text-transform: uppercase;
}


/* ─── CTA ────────────────────────────────────────────────── */
.intro-cta-section {
  padding: 80px 24px;
  background: #fff;
}
.intro-cta-inner {
  max-width: 1200px;
  margin: 0 auto;
  background: #1a1a1a;
  border-radius: var(--intro-radius-lg);
  padding: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
}
.intro-cta-content {
  position: relative;
  z-index: 2;
  color: #fff;
  max-width: 500px;
}
.intro-cta-heading {
  font-size: 40px;
  font-weight: 800;
  margin: 0 0 16px;
  letter-spacing: -0.02em;
}
.intro-cta-sub {
  font-size: 16px;
  color: #a0a0a0;
  margin: 0 0 40px;
  line-height: 1.6;
}
.intro-cta-actions {
  display: flex;
  align-items: center;
  gap: 24px;
}
.intro-cta-main-btn {
  background: var(--intro-accent);
  color: #fff;
  padding: 16px 28px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 800;
}
.intro-cta-link {
  font-size: 14px;
  color: #a0a0a0;
  text-decoration: underline;
}

.intro-cta-graphics {
  position: absolute;
  right: 60px;
  bottom: -40px;
  width: 400px;
  height: 300px;
  z-index: 1;
}
.intro-cta-graphic-card {
  position: absolute;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
}
.intro-cta-graphic-card-1 {
  width: 200px;
  height: 240px;
  right: 0;
  bottom: 40px;
  transform: rotate(5deg);
}
.intro-cta-graphic-card-2 {
  width: 160px;
  height: 200px;
  right: 140px;
  bottom: 80px;
  transform: rotate(-10deg);
  background: #f5f5f5;
}
.intro-cta-graphic-card-2 span {
  font-size: 48px;
  font-weight: 800;
  color: #ccc;
}
.intro-cta-stars {
  position: absolute;
  top: 20px;
  right: 220px;
  color: #fff;
  opacity: 0.5;
}
.intro-cta-lines {
  position: absolute;
  bottom: 20px;
  right: 260px;
  color: #fff;
  opacity: 0.2;
}

/* ─── 푸터 ───────────────────────────────────────────────── */
.intro-footer {
  padding: 40px 24px;
  background: #fff;
  border-top: 1px solid var(--intro-border);
}
.intro-footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.intro-footer-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 800;
  font-size: 14px;
}
.intro-footer-brand img {
  border-radius: 4px;
}
.intro-footer-links {
  display: flex;
  gap: 24px;
}
.intro-footer-links a {
  font-size: 13px;
  color: var(--intro-muted);
  font-weight: 600;
}
.intro-footer-copy {
  font-size: 12px;
  color: #a0a0a0;
  margin: 0;
}


/* ─── 반응형 ─────────────────────────────────────────────── */
@media (max-width: 1024px) {
  .intro-hero {
    display: flex;
    flex-direction: column;
    text-align: center;
  }
  .intro-hero-visual {
    position: relative;
    top: auto;
    right: auto;
    width: 100%;
    max-width: 500px;
    margin: 60px auto 0;
  }
  .intro-hero-actions {
    justify-content: center;
  }
  .intro-jump-pills {
    justify-content: center;
  }
  .intro-metrics {
    margin: 0 auto;
    justify-content: center;
  }
  .intro-outputs-layout,
  .intro-themes-layout {
    grid-template-columns: 1fr;
    gap: 40px;
  }
  .intro-outputs-header,
  .intro-themes-header {
    position: static;
  }
}

@media (max-width: 768px) {
  .intro-nav-links {
    display: none;
  }
  .intro-steps-row {
    flex-direction: column;
    align-items: center;
    gap: 40px;
  }
  .intro-steps-row::before {
    display: none;
  }
  .intro-step-item {
    width: 100%;
    text-align: center;
  }
  .intro-features-grid {
    grid-template-columns: 1fr;
  }
  .intro-feature-card,
  .intro-feature-card--xl,
  .intro-feature-card:not(.intro-feature-card--sm):not(.intro-feature-card--xl) {
    grid-column: 1 / -1;
  }
  .intro-outputs-grid {
    grid-template-columns: 1fr;
  }
  .intro-themes-grid {
    flex-direction: column;
  }
  .intro-theme-card {
    width: 100%;
  }
  .intro-cta-inner {
    flex-direction: column;
    padding: 40px 24px;
    text-align: center;
  }
  .intro-cta-actions {
    flex-direction: column;
    align-items: center;
  }
  .intro-cta-graphics {
    position: relative;
    right: auto;
    bottom: auto;
    margin-top: 60px;
  }
  .intro-footer-inner {
    flex-direction: column;
    gap: 16px;
  }
}
"""

with open('/Users/beom/Documents/project/cardstudio/src/pages/IntroPage.css', 'w') as f:
    f.write(CSS_CONTENT)

print("IntroPage.css generated successfully.")

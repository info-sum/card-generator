# 작업 일지 (GEMINI.md)

## 프로젝트 초기 파악 완료 (2026-03-21)
- **리포지토리**: `/Users/beom/Documents/project/card-generator`
- **프로젝트명**: SNS 카드 뉴스 생성기 (SNS Card News Generator)
- **주요 기술 스택**: React, TypeScript, Vite, `@apps-in-toss/web-framework`, `html-to-image`
- **프로젝트 목표**: 
  - 3~5장의 이미지를 입력받아 SNS 형식 및 앱스토어 소개 이미지 포맷의 카드뉴스 제작
  - 레이아웃 및 카피 편집 (kicker, title, description, badge 등)
  - 웹 미리보기 및 AppsInToss 기기 저장 지원 (PNG 추출)
- **현재 구현 범위 (MVP)**:
  - 사진첩 이미지 로드
  - 소셜 모드 / 스토어 다운로드 모드 등 테마 및 크기 설정 지원 (`App.tsx` 기반)
  - 커스텀 색상(테마) 설정, 드래프트 저장 및 복구
- **주의사항(사용자 규칙 적용)**:
  - 인라인 스크립트/스타일 지양 및 이모지 SVG/PNG 사용
  - 널(null) 처리, 최적화 구현 준수
- 코드 상단 주석 및 한글 주석 적용

## UI 수정 완료: 01 아이콘 제거 (2026-03-21)
- `App.tsx`: `<section className="upload-stage-card">` 내의 "01" 아이콘 (`<div className="upload-stage-icon">01</div>`) 요소를 제거했습니다.
- `App.css`: 더 이상 사용되지 않는 `.upload-stage-icon` 스타일 클래스를 삭제하여 정리했습니다.
## 메인 문구 삭제 (2026-03-21)
- `App.tsx`: `.landing-description` 영역의 안내 문구("제공한 시안의 업로드 중심 흐름을 유지하되...")를 삭제했습니다. 
- `App.css`: 해당 요소에 적용되어 있던 `.landing-description` 스타일을 정리했습니다.

## 미리보기 버튼 수정 및 레이어 적용 (2026-03-21)
- `App.tsx`: 편집/미리보기 탭 (`workspaceTab`) 구조를 제거하고, 에디터는 항상 활성화 상태로 유지하게 변경했습니다.
- `App.tsx`: 하단에 `미리보기 및 결과 저장` 플로팅 버튼을 추가하여 클릭 시 모달(Layer) 형태로 미리보기를 띄울 수 있도록 개편했습니다(`showPreviewModal` state 도입).
- `App.css`: 하단 고정 버튼(`fixed-bottom-bar`) 및 미리보기 모달 레이어 (`preview-modal-layer` 등) 스타일을 추가했습니다.

## 미리보기 모달 레이아웃 및 스케일링 수정 (2026-03-21)
- `App.tsx`: `SlidePreview`의 렌더링 방식을 개별 폰트/패딩 계산 방식에서 CSS `transform: scale()`을 이용한 전체 루트 스케일링 방식으로 변경했습니다. 이를 통해 화면 크기에 상관없이 항상 일정한 비율의 디자인이 유지되도록 수정했습니다. 
- **수정사항(최종)**: 초기 로드 시 레이아웃이 터지는 현상을 막기 위해 `availableWidth` 초기값을 1로 조정하고 측정 전까지 `opacity: 0`을 적용했습니다. 또한 `translate(-50%, -50%)`를 이용한 절대 중심 스케일링 방식으로 변경하여 정렬 안정성을 극대화했습니다.
- `App.css`: 미리보기 모달이 모바일 등 작은 화면에서 깨지는 현상을 방지하기 위해 헤더 및 본문의 패딩/너비 설정을 모바일 대응(`@media`)과 함께 최적화했습니다.
- `App.css`: 모달 내 레이아웃 안정성을 위해 `preview-modal-header`의 `z-index` 및 `sticky` 설정을 강화하고 배경 흐림 효과(`backdrop-filter`)를 세밀하게 조정했습니다.

## 앱 아이콘 설정 기능 추가 (2026-03-21)
- `App.tsx`: 미니앱 설정 등에 필요한 '앱 아이콘'이 필수라는 피드백을 반영하여, 독립된 설정 탭을 신설하는 대신 가장 접근성이 좋은 '프로젝트 메시지(기본 정보)' 사이드바 안에 앱 아이콘(1:1) 업로드 입력칸을 추가했습니다.
- `App.tsx`: `ProjectDraft`, `SlidePreview`, `SlideCanvas`, `AppStoreSlide` 등에 `appIcon` 상태 및 프롭을 추가하여, 스토어 모드 미리보기 상단 배지 위치에 업로드된 아이콘이 함께 랜더링되도록 구현했습니다.

## 업로드 리스트 및 지표 반응형 개선 (2026-03-21)
- `App.css`: 모바일 화면에서 업로드된 사진 리스트(`slide-rail`)가 세로로 길게 늘어지는 대신 가로 스크롤(Horizontal Rail) 형태로 보이도록 개선했습니다. 이를 통해 편집기(Editor)로의 접근성을 높였습니다.
- `App.css`: 랜딩 페이지의 지표(`stage-metrics`) 레이아웃이 모바일에서 불필요하게 세로로 쌓이지 않도록 3열 그리드를 유지하거나 최적화했습니다.

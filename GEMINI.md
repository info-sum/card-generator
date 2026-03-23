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

## AIT 클린 빌드 완료 (2026-03-23)
- `rm -rf dist cardstudio.ait` 명령어로 기존 빌드 결과물을 삭제했습니다.
- `npm run build` 명령어를 통해 `ait build`를 다시 실행했습니다.
- RN 0.84.0 및 RN 0.72.6 대응 빌드가 성공적으로 완료되었습니다.
- 새 `cardstudio.ait` 아티팩트가 생성되었습니다.
- deploymentId: `019d1848-9065-7058-91f7-c6dfd2419ce0`
## 모바일 기기 렌더링 이슈 수정 (2026-03-23)
- **이슈**: 모바일 브라우저(Safari 등)에서 결과 카드를 다운로드하면 배경 이미지가 렌더링되지 않고 문구만 빈 카드에 나오는 현상이 있었습니다.
- **원인**: `html-to-image`를 통해 이미지를 캡처할 때 설정된 `cacheBust: true` 옵션이, 기기 내에 업로드된 Base64 포맷이나 Data URL 뒤에 쿼리 스트링(`?cacheBust=...`)을 붙이게 되어 모바일 브라우저 해석 오류를 발생시켰습니다.
- **해결**: `App.tsx` 내의 개별 및 전체 다운로드 핸들러에서 `toPng` 옵션의 `cacheBust` 값을 `false`로 수정하여 원본 Data URL을 그대로 렌더링하도록 개선했습니다.


## 모바일 렌더링 추가 대응 - 배경 이미지 누락 (2026-03-23)
- **이슈**: 다운로드 시 텍스트만 다운로드되고 배경 이미지(업로드한 사진) 영역이 까맣게 빈 공간으로 렌더링되는 현상이 발견되었습니다. (iOS / Safari 특정 `html-to-image` `<img>` 버그).
- **원인**: 모바일 웹킷 환경(Safari)에서 `<foreignObject>` 기반으로 DOM을 캡처할 때, `<img>` 태그를 `object-fit: cover` 및 `transform` 줌과 함께 사용하면 가끔 내부 캔버스 렌더링이 실패하여 투명/빈 공간으로 저장되는 고질적인 이슈가 있습니다.
- **해결**: `SocialSlide`와 `AppStoreSlide`의 휴대폰 목업 `PhoneMockup` 내부에서 메인 썸네일을 출력하던 `<img src="...">` 요소를 모두 `<div style={{ backgroundImage: "url(...)" }}>` 형태로 교체했습니다. 이를 통해 WebKit 렌더링 엔진 안정성을 우회적으로 확보했습니다.
## iOS 첫 캡처 시 배경 이미지 빈 화면 버그 개선 (2026-03-23)
- **이슈**: 모바일 환경에서 '저장' 버튼을 처음 누르면 배경 이미지가 로딩되지 않은 빈 화면이 저장되고, 두 번째 눌렀을 때만 정상적으로 저장되는 이슈.
- **원인**: `html-to-image`와 Safari 엔진 조합에서 흔히 발생하는 문제로, DOM을 SVG로 생성할 때 렌더 시점이 어긋나 첫 호출에서 이미지가 완전히 하이드레이션(Hydration)되기 전에 캡처되어버립니다.
- **해결**: 개별/전체 저장 시 `toPng()` 호출을 두 번(한 번은 버리는 Pre-render 용도) 수행하도록 강제하여, 첫 번째 호출에서 브라우저가 DOM 캐싱을 마치도록 워크어라운드(Workaround)를 적용했습니다.

## 인스타그램 스타일 템플릿(테마) 추가 (2026-03-23)
- **요청 내역**: 인스타그램에 올릴 만한 디자인의 카드 뉴스 템플릿을 몇 가지 더 만들어서 선택할 수 있게 하고, 선택된 것을 적용해 달라는 내용.
- **해결**:
  - `App.tsx` 코드 내의 `THEME_PRESETS` 객체에 디자인적으로 인스타그램 느낌이 나는 새로운 테마 3종(`sunset`: 화려한 그라디언트, `midnight`: 고급스러운 배경의 다크모드, `blossom`: 부드럽고 따뜻한 핑크톤)을 추가했습니다.
  - `themeLabel` 함수를 갱신하여 UI 상에 새 템플릿 이름이 표기되도록 했습니다.
  - `App.tsx`의 렌더링 초기 상태에서 사용자가 새롭게 고른 결과를 바로 확인할 수 있게 기본값을 `'sunset'`(추가된 템플릿 중 하나)으로 업데이트하여 설정사항을 적용했습니다.
  - `App.css` 파일에 `.theme-dot.sunset` 등 스타일을 추가하여 팔레트 UI에도 올바른 색상이 매핑되도록 처리했습니다.

## 분할 화면 레이아웃 (Split Layout) 추가 (2026-03-23)
- **요청 내역**: 사진이 위에 노출되고 아래에는 하얀색/검은색 문구 영역이 노출되는 템플릿(레이아웃)을 선택할 수 있도록 추가해 달라는 내용.
- **해결**:
  - `CardLayout` 타입을 신설하여 `overlay` (기본 전체화면), `split-light` (하단 흰색), `split-dark` (하단 검정) 상태를 관리하도록 수정했습니다.
  - 사용자가 편집 영역 좌측에서 '레이아웃'을 선택할 수 있도록 토글 UI(`Config Card`)를 `App.tsx`에 추가했습니다.
  - `App.css`에 `.split-layout`, `.split-light`, `.split-dark` 클래스를 추가해, 레이아웃 선택 시 사진 비율이 위쪽 50% 정도만 차지하고 아래쪽 여백에 글과 배경색이 렌더링되게끔 스타일 규칙을 작성했습니다.
  - 상태 복원(`restoreDraft`) 시에도 새로 추가한 `cardLayout` 속성을 불러오고 저장하도록 연동했습니다.

## 개별 슬라이드별 테마 및 레이아웃 오버라이드 기능 추가 (2026-03-23)
- **요청 내역**: 프로젝트 전역 설정뿐만 아니라, 장면 편집기 내에서도 해당 사진에만 독자적인 레이아웃 및 톤 템플릿 컬러를 적용할 수 있게 해달라는 내용.
- **해결**:
  - `SlideDraft` 타입 내에 `cardLayout`, `themeId`, `customColor` 옵션을 개별적으로 가질 수 있게 추가했습니다. 이때 `'global'`이라는 값을 기본값으로 두어 기본적으론 프로젝트 전체 설정을 따르도록 구성했습니다.
  - `App.tsx` 하단의 `SlidePreview`와 `SlideCanvas`의 렌더링 호출부에서, 만약 현재 슬라이드의 고유 설정이 있다면 이를 전역 설정보다 우선 병합하여 렌더링하게끔 `resolveSlideTheme` 및 `resolveSlideLayout` 헬퍼 함수를 추가했습니다.
  - 장면 편집기(`editor-stage`) 패널에 개별 슬라이드의 레이아웃과 톤을 선택할 수 있는 메뉴 아이템(`choice-grid`, `theme-grid` 재사용)을 추가해, 사용자가 특정 슬라이드만 다른 톤이나 다른 레이아웃으로 변경할 수 있도록 유연성을 극대화했습니다. 
  - 상태를 업데이트하는 함수인 `updateSlideField` 내부의 타입 제약을 풀어서(`Pick<SlideDraft, ... | 'cardLayout' | 'themeId'>` 추가) 개별 설정값 저장이 문제없이 동작하게 수정 완료했습니다.

## 장면 편집 미리보기 분리 및 저장 팝업 단순화 (2026-03-23)
- **요청 내역**:
  1. 장면편집 안의 실시간 미리보기를 에디터 아래 별도 섹션으로 분리해달라는 내용.
  2. 저장 팝업에서 '현재 장 저장' 버튼 제거, 하단 섹션에 전체 결과 미리보기 배치.
  3. 하단 버튼 및 팝업 제목 문구를 '미리보기 및 결과 저장' → '결과보기 및 저장'으로 변경.
- **해결**:
  - `App.tsx`: 에디터 내 `editor-focus-preview`(중간 열 미리보기)를 제거하고, 장면 편집 섹션 아래 독립적인 `scene-preview-panel`(`id="scene-preview-section"`) 섹션을 새로 추가했습니다.
  - `App.tsx`: 저장 팝업에서 '현재 장 저장' 버튼을 제거, '전체 PNG 저장' 버튼만 남기도록 단순화했습니다.
  - `App.tsx`: `{slides.length === 0 ? null : (...)}` 블록에 Fragment(`<>...</>`)를 추가하여 workspace-shell과 scene-preview-panel이 올바른 형제 관계로 렌더링되도록 JSX 구조를 수정했습니다.
  - `App.css`: `editor-stage`를 2열 레이아웃으로 복원하고, `.scene-preview-panel` / `.scene-preview-grid` 스타일을 추가했습니다.
  - `TypeScript` 컴파일 에러 전체 해소 확인(`npx tsc --noEmit` 통과).


## 분할 레이아웃(Split Layout) 줌(Zoom) 버그 수정 (2026-03-23)
- **이슈**: `social-slide`에서 `split-light` 또는 `split-dark` 레이아웃 적용 시, 사진을 확대(줌)하면 이미지가 하단 텍스트 영역을 침범하여 디자인이 깨지는 현상이 발생했습니다.
- **원인**: `transform: scale()`이 적용된 `.social-image` 요소가 부모 영역을 벗어날 때 이를 클리핑(clipping)하는 구조가 없었습니다.
- **해결**:
  - `App.tsx`: `.social-image`를 감싸는 `.social-image-container` 컨테이너를 추가했습니다.
  - `App.css`: `.social-image-container`에 `overflow: hidden`을 적용하고, 분할 레이아웃일 때 이 컨테이너의 높이를 `52%`로 제한하여 줌 상태의 이미지가 텍스트 영역으로 삐져나오지 않도록 물리적으로 격리했습니다.
- **최종 빌드 및 푸시**: 수정된 코드를 바탕으로 `npm run build`를 수행하여 `cardstudio.ait`를 재생성하고 원격 저장소에 푸시를 완료했습니다.
- **deploymentId**: `019d1978-80cf-7ef3-bac3-9dcdfcbfaae0`

## 분할 레이아웃 정보 재배치 및 사진 오버레이 (2026-03-23)
- **요청 내역**: 분할 레이아웃(하단 흰색/검정)에서 보조배지는 사진의 좌상단에, 메인 메시지는 사진의 우상단에 위치하도록 변경.
- **해결**:
  - `SocialSlide`: `isSplit` 상태일 때 사진 영역(`.social-image-container`) 위에 절대 좌표(`absolute`)로 `photo-header-overlay`를 추가.
  - 좌상단에 `finalBadge`(보조 배지), 우상단에 `projectTitle`(메인 메시지)을 렌더링.
  - 시인성을 위해 배지에 배경색(`rgba(0,0,0,0.3)`)과 블러(`backdrop-filter`)를 적용하고, 텍스트에 그림자(`text-shadow`) 추가.
  - 하단 텍스트 영역의 `social-topline`은 `kicker`와 슬라이드 번호만 표시하도록 정돈.
- **최종 빌드 및 푸시**: `npm run build`를 통해 `cardstudio.ait` 재생성 및 원격 푸시 완료.
- **deploymentId**: `019d198c-4610-7311-90f3-756e365a7857`

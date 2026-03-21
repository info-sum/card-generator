# 진행 기록 및 기획 초안

작성 시각: 2026-03-13 14:18:34 KST

## 진행 기록

### 1. 환경 확인

- 현재 저장소는 `.git`만 있는 초기 상태입니다.
- 로컬에 `ax`가 설치되어 있고, 버전은 `0.5.1`입니다.
- `brew info ax` 기준으로 2026-03-13에 설치된 상태를 확인했습니다.

### 2. 사용 스킬 확인

- `app-store-screenshots` 스킬을 읽고, 해당 스킬이 기본적으로 `광고형 슬라이드`, `캔버스 기반 렌더링`, `내보내기 가능한 이미지 생성기`를 전제로 한다는 점을 확인했습니다.
- 이 스킬은 원래 `Next.js + html-to-image` 흐름을 권장하지만, 이번 프로젝트의 목표인 `카드뉴스 / 앱스토어 소개 이미지 생성기`와 개념적으로 잘 맞습니다.

### 3. AppsInToss 문서 확인

- `WebView` 개발 문서를 통해 AppsInToss에서 웹 프로젝트를 연결할 수 있음을 확인했습니다.
- `fetchAlbumPhotos` 문서를 통해 여러 장의 앨범 사진을 가져올 수 있음을 확인했습니다.
- `saveBase64Data` 문서를 통해 생성된 이미지를 디바이스에 저장할 수 있음을 확인했습니다.
- `share` 문서를 통해 텍스트 메시지 공유는 지원함을 확인했습니다.

## 핵심 판단

### 권장 개발 방식

이번 프로젝트는 **AppsInToss WebView 기반**으로 가는 것이 가장 적합합니다.

이유는 아래와 같습니다.

- `app-store-screenshots` 스킬의 핵심은 HTML 기반 레이아웃 렌더링과 이미지 export입니다.
- 카드뉴스 / 앱스토어 소개 이미지는 결국 `정해진 캔버스 크기에 텍스트 + 이미지 + 배경 + 장식 요소를 조합`하는 문제입니다.
- 이 문제는 React Native보다 **웹 렌더링 + html-to-image**가 훨씬 단순하고 빠릅니다.
- `ax`는 AppsInToss 개발 환경과 문서 탐색, 실행 흐름을 도와주는 도구이고, 실제 화면 구현은 WebView 앱으로 구성하는 편이 맞습니다.

즉, 추천 조합은 아래입니다.

- `ax`로 AppsInToss 개발 흐름 사용
- `Vite + React + TypeScript`
- `@apps-in-toss/web-framework`
- `@toss/tds-mobile`
- `html-to-image`

## 제품 기획 초안

### 제품 한 줄 정의

사용자가 **이미지 3~5장**을 업로드하면, 이를 바탕으로 **SNS 카드뉴스** 또는 **앱스토어 소개 이미지**를 자동 조합해서 저장할 수 있는 AppsInToss 미니앱입니다.

### 목표 사용자

- 앱/서비스 운영자
- 마케팅 담당자
- 1인 창업자
- 빠르게 홍보 소재를 만들어야 하는 팀

### 해결하려는 문제

- 카드뉴스 제작 툴은 많지만 모바일 안에서 빠르게 만들기 어렵습니다.
- 앱스토어 소개 이미지는 규격과 메시지 구성이 까다롭습니다.
- 사용자는 이미지를 몇 장만 넣고도 바로 쓸 수 있는 결과물을 원합니다.

## MVP 범위

### 포함

- 이미지 3~5장 업로드
- 업로드 순서 변경
- 템플릿 선택
- 제목/서브카피 입력
- 출력 타입 선택
  - SNS 카드뉴스
  - 앱스토어 소개 이미지
- 미리보기
- PNG 저장
- 초안 저장

### 제외

- 긴 영상 편집
- 자동 자막 생성
- 영상에서 장면 자동 추출
- 팀 협업 기능
- 템플릿 마켓플레이스

## 권장 사용자 플로우

### 1. 시작 화면

- 어떤 결과물을 만들지 먼저 선택합니다.
  - `SNS 카드뉴스`
  - `앱스토어 소개 이미지`

### 2. 소재 업로드

- 앨범에서 이미지 3~5장을 선택합니다.
- 필요하면 카메라 촬영으로 추가합니다.
- 업로드 후 순서를 바꿉니다.

### 3. 스토리 구성

- 템플릿을 고릅니다.
- 각 장의 메시지를 간단히 입력합니다.
- 앱스토어용이면 기능 우선순위를 정합니다.

### 4. 자동 배치

- 시스템이 이미지 배치, 헤드라인, 강조 카드, CTA 장면을 자동 조합합니다.

### 5. 미리보기 / 수정

- 장별로 레이아웃을 확인합니다.
- 배경 테마, 텍스트, 정렬을 수정합니다.

### 6. 저장

- 결과물을 PNG로 저장합니다.
- 필요하면 초안도 같이 저장합니다.

## 출력 모드 설계

### A. SNS 카드뉴스 모드

권장 서사 구조:

1. 문제 제기
2. 핵심 메시지
3. 사례 또는 장점
4. 사용 장면
5. CTA

권장 비율:

- `1080 x 1080`
- `1080 x 1350`
- `1080 x 1920`

### B. 앱스토어 소개 이미지 모드

`app-store-screenshots` 스킬의 구조를 그대로 응용합니다.

권장 서사 구조:

1. Hero / 메인 가치
2. 차별점
3. 핵심 기능 1
4. 핵심 기능 2
5. 신뢰 요소 또는 보조 기능

권장 원본 작업 캔버스:

- iPhone 마스터 캔버스 `1320 x 2868`

필요 시 다운스케일:

- `1284 x 2778`
- `1206 x 2622`
- `1125 x 2436`

## 기술 구조 제안

### 1. 입력 레이어

- `fetchAlbumPhotos`로 이미지 여러 장 선택
- `openCamera`로 즉시 촬영 추가

### 2. 상태 저장 레이어

- `Storage`로 초안 저장
- 최근 작업 템플릿, 입력 문구, 업로드 이미지 메타데이터 보존

### 3. 렌더링 레이어

- WebView 안에서 React 컴포넌트로 슬라이드 구성
- 템플릿별 캔버스 컴포넌트 분리
- 텍스트/배경/이미지 배치를 props 기반으로 제어

### 4. 내보내기 레이어

- `html-to-image`로 각 슬라이드를 Base64 PNG로 변환
- `saveBase64Data`로 디바이스 저장

## 기능 모듈 제안

### `asset-import`

- 이미지 선택
- 이미지 정렬
- 이미지 삭제

### `story-planner`

- 슬라이드 수 결정
- 템플릿 매핑
- 장별 카피 구조 생성

### `template-engine`

- 카드뉴스 템플릿
- 앱스토어 템플릿
- 테마 프리셋

### `exporter`

- 해상도별 렌더
- PNG 저장
- 다중 슬라이드 일괄 내보내기

### `drafts`

- 작업 중 초안 복구
- 최근 작업 이어서 편집

## 가장 중요한 제품 결정

### 1. RN이 아니라 WebView를 우선 추천하는 이유

- 이미지 생성은 DOM 렌더링과 캡처가 핵심입니다.
- `html-to-image`와 같은 웹 생태계를 바로 활용할 수 있습니다.
- 앱스토어 소개 이미지처럼 정밀한 타이포/배경/배치를 만들기 쉽습니다.

### 2. 영상 업로드는 2단계로 미루는 것이 안전한 이유

- 현재 확인한 AppsInToss 공식 문서에서는 `여러 장의 사진 선택` API는 명확합니다.
- 반면 `짧은 영상 선택 후 프레임 추출`을 바로 지원하는 공식 흐름은 이번 확인 범위에서 명확하지 않았습니다.
- 따라서 **MVP는 이미지 중심**으로 가고, 영상은 2차 범위로 두는 것이 리스크가 낮습니다.

### 3. 공유 기능의 우선순위

- 현재 확인한 공식 문서는 `텍스트 공유`는 명확합니다.
- 하지만 `생성된 이미지 파일을 곧바로 SNS 공유 시트로 넘기는 흐름`은 이번 확인 범위에서 명확하지 않았습니다.
- 따라서 1차 목표는 **이미지 파일 저장**으로 두고, 이후 SNS 직접 공유는 별도 검증 후 붙이는 것이 적절합니다.

## 추천 MVP 화면 구성

### 홈

- 서비스 소개
- 새 프로젝트 시작
- 최근 작업 이어서 하기

### 에셋 선택

- 앨범 불러오기
- 카메라 촬영
- 선택된 이미지 목록

### 템플릿 선택

- SNS 카드뉴스
- 앱스토어 소개 이미지

### 편집기

- 슬라이드 리스트
- 장별 텍스트 입력
- 테마 선택
- 정렬/강조 옵션

### 미리보기 / 저장

- 전체 슬라이드 미리보기
- 저장 버튼

## 우선 개발 순서

### 1단계

- AppsInToss WebView 프로젝트 스캐폴딩
- 기본 라우트 구성
- 이미지 여러 장 선택

### 2단계

- 템플릿 엔진 2종 구현
  - SNS 카드뉴스
  - 앱스토어 소개 이미지

### 3단계

- 미리보기 캔버스 구현
- PNG export
- 저장 기능 연결

### 4단계

- 초안 저장
- 카피 편집 UX
- 테마 프리셋

## 구현 전에 필요한 입력값

`app-store-screenshots` 스킬 기준으로도, 실제 제작 품질을 높이려면 아래 정보가 먼저 필요합니다.

- 앱 이름 또는 서비스 이름
- 앱 아이콘
- 브랜드 컬러
- 사용할 폰트 방향
- 핵심 기능 우선순위
- 기본 슬라이드 수
- 원하는 스타일 레퍼런스

이번 제품 자체를 설계하는 관점에서는 아래도 함께 정해야 합니다.

- 기본 출력 모드를 `SNS 우선`으로 할지 `앱스토어 우선`으로 할지
- 템플릿을 완전 자동으로 만들지, 사용자가 장별 제목을 직접 입력하게 할지
- 첫 버전에서 영상 업로드를 받을지 말지

## 현재 결론

이 프로젝트는 충분히 만들 수 있습니다.

다만 가장 현실적인 첫 출발은 아래와 같습니다.

1. AppsInToss `WebView` 기반으로 시작
2. 입력은 우선 `이미지 3~5장`만 지원
3. 결과물은 `SNS 카드뉴스`와 `앱스토어 소개 이미지` 2개 모드로 분리
4. 내보내기는 `PNG 저장`부터 완성
5. 영상 처리와 SNS 직접 공유는 2차 범위로 미룸

이 방향이 현재 스킬 구조, AppsInToss 문서, `ax` 개발 흐름과 가장 잘 맞습니다.

---

## 구현 진행 기록

작성 시각: 2026-03-13 14:33:40 KST

### 4. 실제 스캐폴딩 및 구현

- `Vite + React + TypeScript` 프로젝트를 비대화형으로 스캐폴딩했습니다.
- `@apps-in-toss/web-framework`, `@toss/tds-mobile`, `html-to-image`를 설치했습니다.
- `@toss/tds-mobile`의 peer dependency 제약 때문에 React 버전을 18 계열로 맞췄습니다.
- `granite.config.ts`를 추가해 AppsInToss WebView 프로젝트로 설정했습니다.
- 스킬 폴더의 `mockup.png`를 `public/mockup.png`로 복사해 앱스토어 프리뷰용 폰 프레임에 재사용했습니다.

### 5. 구현한 MVP 기능

- 로컬 이미지 업로드
- AppsInToss 앨범 불러오기
- AppsInToss 카메라 촬영 추가
- `SNS 카드뉴스` / `앱스토어 소개 이미지` 모드 전환
- 해상도 프리셋 전환
- 테마 프리셋 전환
- 장별 카피 자동 초기값 생성
- 장별 카피 편집
- 장 순서 변경 / 삭제
- 슬라이드 개별 PNG 저장
- 전체 PNG 저장
- 초안 자동 저장 / 복구

### 6. 구현 파일

- `granite.config.ts`
- `src/App.tsx`
- `src/App.css`
- `src/index.css`
- `src/lib/appsInToss.ts`
- `public/mockup.png`

### 7. 검증 결과

- `npm run lint` 통과
- `npm run build:web` 통과
- `npm run build` 통과
- `ait build` 결과로 루트에 `card-generator.ait` 생성 확인

### 8. 반영한 추가 정리

- `README.md`를 프로젝트 설명으로 교체했습니다.
- `.gitignore`에 `.granite`, `*.ait`를 추가했습니다.

### 9. 저장소 연동 및 배포 기록

작성 시각: 2026-03-13 14:38:07 KST

- 원격 저장소 `https://github.com/info-sum/card-generator.git` 연결을 진행했습니다.
- 현재 로컬 저장소는 `main` 브랜치 기준 초기 커밋이 없는 상태임을 확인했습니다.
- 원격 저장소는 비어 있는 상태로 확인되어 첫 커밋을 바로 푸시할 수 있는 조건입니다.
- 다음 순서로 반영합니다.
  - `origin` 원격 연결
  - 초기 커밋 생성
  - `main` 브랜치 푸시

### 10. 로컬 테스트 확인

작성 시각: 2026-03-13 14:40:08 KST

- 브라우저 미리보기용 `npm run dev:web` 실행을 확인했습니다.
- Vite 개발 서버가 아래 주소로 정상 기동되는 것을 확인했습니다.
  - `http://localhost:5173/`
  - 네트워크 주소 `http://192.168.10.210:5173/`
- AppsInToss용 `npm run dev` 실행도 확인했습니다.
- `granite dev`가 `http://0.0.0.0:8081` 에서 정상 대기하는 것을 확인했습니다.
- 같은 시점에 브라우저 서버가 이미 5173을 사용 중이어서, AppsInToss 실행 중에는 Vite 서버가 `5174`로 자동 전환되는 것도 확인했습니다.

#### 테스트 결론

- **브라우저 로컬 테스트 가능**
- **AppsInToss 샌드박스 연결 테스트 가능**
- 단, `granite.config.ts`의 `web.port`는 `5173`으로 고정되어 있으므로 AppsInToss 샌드박스 테스트 시에는 브라우저용 `dev:web`를 따로 띄우지 말고 `npm run dev` 하나만 실행하는 편이 안전합니다.

### 11. 스킬 사용 여부 정리

작성 시각: 2026-03-13 14:40:29 KST

- `app-store-screenshots` 스킬은 **실제로 사용했습니다.**
- 다만 스킬의 원본 권장안인 `Next.js 단일 페이지 생성기`를 그대로 복사한 것은 아닙니다.
- 이번 프로젝트 목적이 AppsInToss 미니앱이었기 때문에, 스킬의 핵심 원칙만 가져와서 **AppsInToss WebView + Vite** 구조로 재해석해 적용했습니다.

#### 실제로 가져다 쓴 요소

- 앱스토어 소개 이미지용 서사 구조
- 한 장에 한 메시지만 담는 슬라이드 설계 원칙
- 고해상도 캔버스를 먼저 만들고 export하는 방식
- `mockup.png` 기반 아이폰 프레임 사용
- `html-to-image` 기반 PNG export 흐름

#### 그대로 쓰지 않은 요소

- Next.js 앱 라우팅 구조
- `src/app/page.tsx` 단일 파일 구성
- 순수 웹 전용 툴바/페이지 구조

즉, **스킬은 사용했지만 플랫폼 제약 때문에 구현체는 AppsInToss에 맞게 변형해서 적용했다**고 보면 됩니다.

### 12. AppsInToss 샌드박스 테스트 순서

작성 시각: 2026-03-13 14:43:13 KST

#### 실행 순서

1. 프로젝트 루트에서 `npm run dev` 실행
2. 터미널에 Granite 서버가 `http://0.0.0.0:8081` 로 열렸는지 확인
3. 같은 터미널 출력에서 Vite 서버 주소가 함께 뜨는지 확인
4. 아이폰에서 AppsInToss 샌드박스 앱 실행
5. 샌드박스 앱에서 로컬 서버 주소 입력
6. 스킴 입력 칸에 `intoss://image-marketing-studio` 입력
7. 열기 실행 후 화면 확인

#### 서버 주소 입력 팁

- 같은 와이파이에 연결된 상태여야 합니다.
- 현재 확인된 네트워크 주소는 `http://192.168.10.210:5173` 였습니다.
- 실제 테스트 시에는 터미널에 찍히는 최신 IP 주소를 기준으로 넣는 편이 안전합니다.

#### 무엇을 어디서 테스트해야 하는지

- 브라우저:
  - 레이아웃
  - 텍스트 편집
  - 로컬 이미지 업로드
  - PNG 다운로드
- 샌드박스 앱:
  - 앨범 불러오기
  - 카메라 촬영
  - 기기 저장

#### 주의

- `npm run dev:web`와 `npm run dev`를 동시에 띄우면 Vite 포트가 바뀔 수 있습니다.
- 샌드박스 테스트할 때는 `npm run dev`만 실행하는 편이 안전합니다.

### 13. 정책 적합성 1차 점검

작성 시각: 2026-03-13 14:46:25 KST

#### 직접적으로 걸릴 가능성이 낮은 항목

- 디지털 자산 / 가상자산
- 자금세탁 가능 구조
- 불법 / 부정행위 조장
- 사행성 / 베팅 / 복권
- 금융상품 중개 / 판매 / 광고
- 투자 자문 / 리딩방
- 자격 필요 카테고리(의료/쇼핑몰/교육) 직접 해당 없음

#### 현재 기획에서 주의해야 할 항목

1. 기존 회사 및 서비스를 단순 홍보하기 위한 미니앱 금지
   - 이 서비스가 `누구나 쓰는 카드뉴스 제작 도구`로 보이면 상대적으로 안전합니다.
   - 반대로 `우리 서비스 홍보물만 만드는 내부 마케팅 툴`처럼 보이면 검수 리스크가 있습니다.

2. 자사 앱 설치 유도 / 외부 링크 제한
   - 미니앱 안에서 앱스토어 링크, 다운로드 유도 문구, 외부 가입/결제 흐름을 넣으면 안 됩니다.
   - 특히 앱스토어 소개 이미지 템플릿의 기본 예시 문구가 `설치하세요`, `다운로드하세요` 같은 직접 유도형이면 검수 포인트가 될 수 있습니다.

3. 생성형 AI 정책
   - 현재 MVP는 규칙 기반 템플릿 중심이라면 생성형 AI 정책에 직접 걸리지 않을 수 있습니다.
   - 하지만 이후 LLM으로 카피 생성, AI 이미지 생성, AI 추천을 넣으면 반드시 사전 고지와 AI 결과물 표시가 필요합니다.

#### 현재 판단

- **지금 구현한 MVP 자체는 직접 금지 카테고리에 걸릴 가능성은 낮습니다.**
- 다만 **가장 큰 검수 리스크는 `단순 홍보성 앱으로 보이는지 여부`와 `외부 앱 설치 유도성 문구`** 입니다.
- 따라서 출시 설명과 앱 소개 문구는 `홍보물 제작 툴`, `콘텐츠 제작 도구`, `이미지 편집 생산성 도구`처럼 잡는 편이 안전합니다.

### 14. 브랜딩 방향 전환 및 로고 적용

작성 시각: 2026-03-13 14:50:19 KST

- 서비스 포지셔닝을 `이미지 기반 마케팅 콘텐츠 생성 툴`로 명확히 조정했습니다.
- 앱 내부 기본 브랜드명을 `이미지 마케팅 스튜디오`로 변경했습니다.
- 히어로 영역 문구와 프로젝트 기본 메시지를 마케팅 제작 도구 관점으로 수정했습니다.
- 새 로고를 SVG로 제작해 아래 파일에 반영했습니다.
  - `public/logo.svg`
  - `public/favicon.svg`
- 브라우저 탭 아이콘도 새 로고를 사용하도록 `index.html`을 수정했습니다.

#### 로고 의도

- 겹쳐진 카드 형태로 `여러 장의 콘텐츠 조합`을 표현
- 전면 카드로 `편집/제작 캔버스`를 표현
- 스파크 포인트로 `마케팅 강조 요소`와 `빠른 완성감`을 표현

#### 검증 결과

- `npm run lint` 통과
- `npm run build:web` 통과

### 15. 콘솔 등록용 이름 / 로고 자산 정리

작성 시각: 2026-03-13 14:50:19 KST

- 한국어 앱 이름: `이미지 마케팅 스튜디오`
- 영어 앱 이름: `Image Marketing Studio`
- appName: `image-marketing-studio`
- 앱 로고 600x600 PNG와 다크모드 앱 로고 600x600 PNG를 별도 파일로 준비합니다.

### 16. 콘솔 업로드용 PNG 로고 생성

작성 시각: 2026-03-13 14:55:30 KST

- SVG 원본 로고를 기준으로 콘솔 업로드용 600x600 PNG를 생성했습니다.
- 기본 앱 로고 파일: `/Users/beom/Documents/project/card-generator/branding/app-logo-600.png`
- 다크모드 앱 로고 파일: `/Users/beom/Documents/project/card-generator/branding/app-logo-dark-600.png`
- 로고 원본 SVG 파일: `/Users/beom/Documents/project/card-generator/public/logo.svg`
- 다크모드 원본 SVG 파일: `/Users/beom/Documents/project/card-generator/public/logo-dark.svg`
- 프로젝트 기본 이름 잔재를 정리하기 위해 다운로드 파일명 기본값을 `image-marketing-studio`로 맞췄습니다.
- `npm run lint`와 `npm run build:web`를 다시 실행해 통과를 확인했습니다.

### 17. 콘솔 등록용 이름 최종 추천

작성 시각: 2026-03-13 14:58:20 KST

- 현재 포지셔닝과 검수 리스크를 함께 고려했을 때 가장 무난한 추천값은 아래 조합입니다.
- 한국어 앱 이름: `이미지 마케팅 스튜디오`
- 영어 앱 이름: `Image Marketing Studio`
- appName: `image-marketing-studio`
- 이유:
  - 카드뉴스에만 한정되지 않아 앱스토어 소개 이미지, SNS 카드형 콘텐츠까지 함께 설명할 수 있습니다.
  - 특정 자사 서비스 홍보 도구처럼 보이기보다 범용 제작 도구로 인식되기 쉽습니다.
  - 현재 프로젝트 설정값과도 일치해 추가 수정 범위를 줄일 수 있습니다.

### 18. 이름 후보 재검토

작성 시각: 2026-03-13 15:01:10 KST

- `카드 콘텐츠 생성기`는 기능이 더 직관적으로 보이는 장점이 있습니다.
- 다만 `이미지 마케팅 스튜디오`보다 범위가 조금 좁아 보이고, 브랜드 톤은 다소 일반적인 편입니다.
- 현재 제품의 실제 사용 흐름이 `여러 장의 이미지를 카드형 콘텐츠로 조합해 만드는 것`에 가깝기 때문에, 사용성 중심 이름을 원하면 충분히 좋은 후보입니다.
- 결론:
  - 기능 직관성을 우선하면 `카드 콘텐츠 생성기`
  - 확장성과 브랜드 톤을 우선하면 `이미지 마케팅 스튜디오`
- 사용자 이해도만 놓고 보면 `카드 콘텐츠 생성기`가 더 빠르게 전달됩니다.

### 19. 영어 앱 이름 15자 제한 반영

작성 시각: 2026-03-13 15:04:00 KST

- 영어 앱 이름이 15자를 넘기면 안 되는 제약을 반영해 더 짧은 이름으로 재조정합니다.
- `Card Content Generator`는 길이 제한을 초과하므로 제외합니다.
- 추천 조합:
  - 한국어 앱 이름: `카드 콘텐츠 생성기`
  - 영어 앱 이름: `Card Studio`
  - appName: `card-studio`
- `Card Studio`는 공백 포함 11자로 제한 안에 들어오고, 카드형 마케팅 콘텐츠 제작 도구라는 의미도 무난하게 전달합니다.

### 20. 콘솔 소개 문구 초안

작성 시각: 2026-03-13 15:07:40 KST

- 부제 추천: `이미지로 카드뉴스 완성`
- 부제는 20자 이내로 맞추고, 사용자가 얻는 결과를 바로 이해할 수 있게 작성했습니다.
- 상세 설명 추천:

  `이미지 3장부터 5장까지 올리고 카드형 템플릿을 선택하면 카드뉴스와 소개 이미지를 만들 수 있어요. 각 장마다 제목과 설명을 수정하고 순서를 바꾸면서 원하는 흐름으로 구성할 수 있어요. 완성된 결과는 미리보기로 확인한 뒤 PNG 이미지로 저장할 수 있어요.`

- 앱 검색 키워드 추천:

  `카드뉴스,카드뉴스제작,마케팅이미지,SNS콘텐츠,소개이미지,이미지편집,콘텐츠제작,썸네일`

### 21. 가로형 썸네일 1932x828 생성

작성 시각: 2026-03-13 15:08:30 KST

- 앱인토스 콘솔 업로드용 가로형 썸네일 PNG를 생성했습니다.
- 최종 PNG 파일: `/Users/beom/Documents/project/card-generator/branding/landscape-thumbnail-1932x828.png`
- 원본 SVG 파일: `/Users/beom/Documents/project/card-generator/branding/landscape-thumbnail-1932x828.svg`
- 해상도 확인 결과: `1932 x 828`
- 로고, 서비스명, 핵심 가치, 주요 기능 칩을 포함한 광고형 썸네일 구성으로 제작했습니다.

### 22. 실제 동작 스크린샷 가능 범위 정리

작성 시각: 2026-03-13 15:11:40 KST

- 현재 프로젝트는 WebView 기반이므로 실제 앱 화면 대부분은 브라우저에서 실행한 뒤 스크린샷 캡처가 가능합니다.
- 캡처 가능한 화면 예시:
  - 시작 화면
  - 이미지 업로드 후 편집 화면
  - 카드뉴스 / 앱스토어 소개 이미지 미리보기 화면
  - 텍스트 수정, 순서 변경, 테마 선택이 반영된 결과 화면
- 별도 기기에서 캡처가 더 적합한 화면 예시:
  - 앨범 권한 요청 팝업
  - 카메라 실행 화면
  - 기기 저장 완료 토스트나 네이티브 저장 흐름
- 앱인토스 콘솔용 `미리보기 및 스크린샷` 자산은 브라우저에서 실제 동작 흐름을 구성한 뒤 세로형 또는 가로형으로 충분히 제작 가능합니다.

### 23. 콘솔 스크린샷용 데모 상태 추가

작성 시각: 2026-03-13 15:18:40 KST

- 브라우저에서 실제 앱 화면을 안정적으로 캡처할 수 있도록 `?demo=appshots` 쿼리 파라미터를 추가했습니다.
- 이 모드에서는 초안 저장을 건드리지 않고, 예시 이미지 3장과 데모 카피를 자동으로 채워서 콘솔 스크린샷용 상태를 바로 보여줍니다.
- 관련 파일:
  - `/Users/beom/Documents/project/card-generator/src/App.tsx`
  - `/Users/beom/Documents/project/card-generator/public/demo-slide-1.svg`
  - `/Users/beom/Documents/project/card-generator/public/demo-slide-2.svg`
  - `/Users/beom/Documents/project/card-generator/public/demo-slide-3.svg`

### 24. 스토어 스크린샷 자동 캡처 스크립트 추가

작성 시각: 2026-03-13 15:19:20 KST

- 세로형 스크린샷을 반복해서 다시 만들 수 있도록 Playwright 기반 캡처 스크립트를 추가했습니다.
- 명령:
  - 개발 서버 실행: `npm run dev:web -- --host 127.0.0.1 --port 4173`
  - 스크린샷 생성: `npm run capture:appshots`
- 관련 파일:
  - `/Users/beom/Documents/project/card-generator/scripts/capture-store-screenshots.mjs`
  - `/Users/beom/Documents/project/card-generator/package.json`
- `playwright-core`를 개발 의존성으로 추가했습니다.

### 25. 세로형 스토어 스크린샷 3장 생성

작성 시각: 2026-03-13 15:20:30 KST

- 앱인토스 콘솔 업로드용 세로형 스크린샷 3장을 생성했습니다.
- 해상도는 모두 `636 x 1048`입니다.
- 생성 파일:
  - `/Users/beom/Documents/project/card-generator/branding/store-screenshots/portrait-01-overview.png`
  - `/Users/beom/Documents/project/card-generator/branding/store-screenshots/portrait-02-editor.png`
  - `/Users/beom/Documents/project/card-generator/branding/store-screenshots/portrait-03-preview.png`
- 구성:
  - 1장: 프로젝트 설정과 시작 화면
  - 2장: 이미지 업로드 후 슬라이드 편집 화면
  - 3장: 미리보기 화면
- 미리보기 영역은 앱스토어 카드가 가운데에 오도록 정렬 방식을 보정했습니다.

### 26. 표시 이름을 `SNS 카드 뉴스 생성기`로 변경

작성 시각: 2026-03-13 15:25:20 KST

- 사용자에게 보이는 기본 표시 이름을 `SNS 카드 뉴스 생성기`로 변경했습니다.
- 반영 파일:
  - `/Users/beom/Documents/project/card-generator/granite.config.ts`
  - `/Users/beom/Documents/project/card-generator/index.html`
  - `/Users/beom/Documents/project/card-generator/README.md`
  - `/Users/beom/Documents/project/card-generator/src/App.tsx`
- 데모 상태와 기본 프로젝트 문구도 함께 갱신했습니다.
- 기존 `appName`인 `image-marketing-studio`는 스킴 및 기존 설정 영향이 있어 이번 변경에서는 유지했습니다.

### 27. 이름 변경에 맞춰 소개 자산 재생성

작성 시각: 2026-03-13 15:26:10 KST

- 가로형 썸네일 텍스트를 `SNS 카드 뉴스 생성기` 기준으로 갱신했습니다.
- 세로형 스토어 스크린샷도 같은 이름으로 다시 생성했습니다.
- 갱신 파일:
  - `/Users/beom/Documents/project/card-generator/branding/landscape-thumbnail-1932x828.png`
  - `/Users/beom/Documents/project/card-generator/branding/store-screenshots/portrait-01-overview.png`
  - `/Users/beom/Documents/project/card-generator/branding/store-screenshots/portrait-02-editor.png`
  - `/Users/beom/Documents/project/card-generator/branding/store-screenshots/portrait-03-preview.png`
- 검증:
  - `npm run lint` 통과
  - `npm run build:web` 통과

### 28. 반려 사유 대응: 사각형 배경 아이콘 및 썸네일 재생성

작성 시각: 2026-03-14 10:05:40 KST

- 반려 사유: 앱 아이콘 및 썸네일이 크롭되지 않고, 배경색이 포함된 꽉 찬 사각형 형태여야 함
- 원인 확인:
  - 기존 앱 아이콘 PNG는 투명 알파 채널이 있었고, 원본 SVG의 바깥 배경이 라운드 처리되어 있었습니다.
  - 가로형 썸네일 PNG도 알파 채널이 포함된 상태였습니다.
- 수정 내용:
  - `/Users/beom/Documents/project/card-generator/public/logo.svg`
  - `/Users/beom/Documents/project/card-generator/public/logo-dark.svg`
  - `/Users/beom/Documents/project/card-generator/public/favicon.svg`
  - 위 파일들의 바깥 배경을 둥근 사각형이 아닌 꽉 찬 정사각형으로 수정했습니다.
  - 제출용 PNG는 렌더 후 한 번 더 평탄화해서 알파 채널이 없는 파일로 다시 생성했습니다.
- 최종 제출용 파일:
  - `/Users/beom/Documents/project/card-generator/branding/app-logo-600.png`
  - `/Users/beom/Documents/project/card-generator/branding/app-logo-dark-600.png`
  - `/Users/beom/Documents/project/card-generator/branding/landscape-thumbnail-1932x828.png`
- 검증 결과:
  - `app-logo-600.png`: `600 x 600`, `hasAlpha: no`
  - `app-logo-dark-600.png`: `600 x 600`, `hasAlpha: no`
  - `landscape-thumbnail-1932x828.png`: `1932 x 828`, `hasAlpha: no`

### 29. 비게임 출시 가이드 기준 사전 점검

작성 시각: 2026-03-16 10:12:30 KST

- 참고 문서:
  - `https://developers-apps-in-toss.toss.im/checklist/app-nongame.html`
- 현재 앱 기준으로 직접 관련 있는 항목만 추려서 점검했습니다.

#### 현재 비교적 맞는 항목

- 미니앱의 핵심 기능은 앱 내부에서 완결적으로 동작하는 구조입니다.
- 자사 앱 설치 유도, 외부 결제, 외부 가입 흐름은 현재 구현에 없습니다.
- 초안 저장을 통해 재진입 시 필요한 데이터 유지가 가능합니다.
- 자동으로 열리는 바텀시트나 강제 유도성 UX는 현재 구현에 없습니다.

#### 현재 보수적으로 수정하거나 확인이 필요한 항목

- `미니앱 테마는 라이트 모드로 구현`
  - 현재 편집 화면의 전체 톤은 다크 그라데이션이 섞여 있어 보수적으로 보면 검수 리스크가 있습니다.
- `앱인토스 비게임 내비게이션 바 사용`
  - 코드상으로는 `granite.config.ts`에 브랜드명은 있지만, 실제 샌드박스에서 토스 내비게이션 바가 의도대로 노출되는지 확인이 필요합니다.
- `앱 스킴 진입 후 뒤로가기 동작`
  - 스킴 연결과 최초 화면 뒤로가기 종료 흐름은 샌드박스 실기기 점검이 필요합니다.
- `권한 요청 전 사용자 동의`
  - 문서에는 React Native 앱 기준으로 명시돼 있지만, 현재도 앨범/카메라 실행 직전에 안내 모달을 한 번 넣는 편이 안전합니다.
- `공유 스킴`
  - 현재 공유 기능은 미구현이라 직접 이슈는 없지만, 이후 구현 시 `intoss-private://`가 아닌 `intoss://`를 써야 합니다.

#### 현재 직접 해당 없는 항목

- 토스 로그인
- 인앱 결제
- 토스페이
- 인앱 광고

#### 현재 판단

- 지금 상태에서 가장 먼저 손봐야 할 가능성이 큰 것은 `라이트 모드 톤 정리`입니다.
- 그 다음은 `샌드박스에서 내비게이션 바 / 뒤로가기 / 스킴 동작 확인`입니다.

### 30. 라이트 모드 기준으로 편집 UI 정리

작성 시각: 2026-03-16 10:19:40 KST

- 비게임 출시 가이드에 맞춰 미니앱 편집 화면을 라이트 모드 기준으로 정리했습니다.
- 수정 방향:
  - 앱 바깥 배경을 밝은 크림 톤으로 변경
  - 편집 패널, 입력창, 버튼, 카드 배경을 흰색 계열로 통일
  - 테마 프리셋은 생성 결과물용으로 유지하되, 앱 UI 자체는 어두워지지 않도록 분리
- 반영 파일:
  - `/Users/beom/Documents/project/card-generator/src/index.css`
  - `/Users/beom/Documents/project/card-generator/src/App.css`
  - `/Users/beom/Documents/project/card-generator/src/App.tsx`
- 검증:
  - `npm run lint` 통과
  - `npm run build:web` 통과

### 31. 라이트 모드 반영 후 스토어 스크린샷 재생성

작성 시각: 2026-03-16 10:21:10 KST

- 라이트 모드 편집 UI가 반영된 상태로 세로형 스토어 스크린샷을 다시 생성했습니다.
- 갱신 파일:
  - `/Users/beom/Documents/project/card-generator/branding/store-screenshots/portrait-01-overview.png`
  - `/Users/beom/Documents/project/card-generator/branding/store-screenshots/portrait-02-editor.png`
  - `/Users/beom/Documents/project/card-generator/branding/store-screenshots/portrait-03-preview.png`
- 결과:
  - 시작 화면과 편집 패널이 밝은 배경 위에서 보이도록 정리됐습니다.

### 32. 출시 가이드 대응: 내비게이션 바 설정 및 권한 사전 안내 추가

작성 시각: 2026-03-16 10:28:40 KST

- 공식 가이드 기준으로 바로 보완 가능한 두 항목을 코드에 반영했습니다.

#### 반영 내용

- `granite.config.ts`
  - `navigationBar.withBackButton: true` 추가
  - `brand.icon`을 `/logo.svg`로 지정
- `src/App.tsx`
  - 앨범/카메라 실행 전 `ConfirmDialog`로 한 번 더 안내하는 흐름 추가
  - 사용자가 동의한 뒤에만 실제 권한 요청 흐름으로 진입하도록 분리
- `package.json`, `package-lock.json`
  - TDS 다이얼로그 사용을 위해 `@emotion/react` 의존성 반영

#### 현재 남은 확인 항목

- 토스 샌드박스에서 실제 내비게이션 바 아이콘이 `/logo.svg`로 정상 노출되는지 확인 필요
- 스킴 진입 후 뒤로가기 시 종료 동작은 여전히 실기기 확인 필요

#### 검증 결과

- `npm run lint` 통과
- `npm run build:web` 통과
- 번들 크기 경고는 있었지만 빌드 실패는 아니었고, 현재 단계에서는 기능 검수 우선으로 유지

### 33. 로컬 브라우저 개발 서버 실행

작성 시각: 2026-03-18 13:19:20 KST

- 로컬 브라우저 확인용 개발 서버를 실행했습니다.
- 실행 명령:
  - `npm run dev:web -- --host 127.0.0.1 --port 4173`
- 접속 주소:
  - `http://127.0.0.1:4173/`

### 34. `.ait` 아티팩트 빌드

작성 시각: 2026-03-20 11:04:10 KST

- `npm run build`로 `.ait` 아티팩트를 다시 생성했습니다.
- 생성 결과:
  - `/Users/beom/Documents/project/card-generator/image-marketing-studio.ait`
- 빌드 로그 기준 배포 ID:
  - `019d08fb-d4aa-742d-bc3b-cbb9a9e291e8`
- 참고:
  - 기존 산출물 `/Users/beom/Documents/project/card-generator/card-generator.ait`도 남아 있습니다.
  - 최신 제출용 파일은 `image-marketing-studio.ait`입니다.

### 35. `appName`을 `cardstudio`로 변경 후 `.ait` 재빌드

작성 시각: 2026-03-20 11:39:10 KST

- `granite.config.ts`의 `appName`을 `cardstudio`로 변경했습니다.
- `npm run build`를 다시 실행해 최신 아티팩트를 생성했습니다.
- 생성 결과:
  - `/Users/beom/Documents/project/card-generator/cardstudio.ait`
- 빌드 로그 기준 배포 ID:
  - `019d091c-15b9-77ba-a468-5a95c36375b6`
- 참고:
  - 이전 산출물 `/Users/beom/Documents/project/card-generator/image-marketing-studio.ait`와 `/Users/beom/Documents/project/card-generator/card-generator.ait`도 그대로 남아 있습니다.
  - 현재 최신 제출용 파일은 `cardstudio.ait`입니다.

### 36. 현재 기준 고도화 아이디어 정리

작성 시각: 2026-03-20 11:43:40 KST

- 현재 앱의 성격과 출시 흐름을 기준으로 고도화 항목을 정리했습니다.

#### 1. 제작 기능 고도화

- 영상 업로드 후 대표 프레임 추출
- 여러 장 이미지 자동 정렬 추천
- 템플릿별 문장 길이 자동 최적화
- 장별 배경색 자동 추출
- 브랜드 컬러 자동 적용
- CTA 장면 자동 생성
- 표지 장면 자동 생성
- 장별 강조 요소 스티커 추가

#### 2. 카드뉴스 품질 고도화

- 장수별 스토리 구조 추천
- 첫 장 훅 문구 추천
- 마지막 장 마무리 문구 추천
- 텍스트 길이 초과 경고
- 이미지 안전 영역 가이드
- 카드별 시선 흐름 가이드
- 썸네일 가독성 점수 표시

#### 3. 앱스토어 소개 이미지 고도화

- 6.9 / 6.5 / 6.1 사이즈별 자동 카피 리플로우
- 첫 장 전환율 중심 레이아웃 템플릿 추가
- 기능 소개 / 차별점 / 신뢰 요소 템플릿 분리
- 다국어 소개 이미지 생성
- 앱스토어 제출용 파일명 규칙 자동화

#### 4. 내보내기 고도화

- 여러 장 ZIP 일괄 저장
- JPG / PNG 선택 저장
- 해상도별 일괄 내보내기
- 워터마크 유무 선택
- 저장 전 최종 검수 미리보기
- 비율별 일괄 복제 export

#### 5. 편집 UX 고도화

- 드래그앤드롭 순서 변경
- 장 복제 기능
- 텍스트 스타일 프리셋
- 폰트 선택 기능
- 실행 취소 / 다시 실행
- 최근 작업 복구
- 프로젝트 목록 관리

#### 6. 앱인토스 출시 대응 고도화

- 권한 요청 전 안내를 앨범 / 카메라별로 더 상세화
- 저장 완료 토스트와 실패 재시도 UX 보강
- 샌드박스 기준 뒤로가기 흐름 정교화
- 내비게이션 바 액세서리 버튼 활용
- 권한 거부 상태 분기 처리

#### 7. 운영 지표 고도화

- 템플릿 선택률 측정
- 저장 완료율 측정
- 첫 장 이탈률 측정
- 권한 요청 이탈률 측정
- 모드별 사용량 비교
- 해상도별 사용량 비교

#### 8. 기술 고도화

- 번들 크기 축소를 위한 코드 스플리팅
- 이미지 최적화 워커 분리
- export 렌더 성능 개선
- 대용량 이미지 메모리 사용량 제어
- 공용 UI 컴포넌트 분리
- 스크린샷 생성 자동화 스크립트 고도화

#### 추천 우선순위

- 1순위:
  - ZIP 일괄 저장
  - 텍스트 길이 초과 경고
  - 드래그앤드롭 정렬
  - 권한 거부 상태 분기 처리
- 2순위:
  - 브랜드 컬러 자동 적용
  - 장수별 스토리 구조 추천
  - 앱스토어 사이즈별 자동 카피 리플로우
- 3순위:
  - 영상 대표 프레임 추출
  - 다국어 소개 이미지 생성
  - 운영 지표 수집

### 37. 광고 기반 재이용 기능 아이디어 정리

작성 시각: 2026-03-20 11:52:20 KST

- 앱인토스 공식 문서 기준으로 인앱 광고는 전면형, 보상형, 배너형을 지원합니다.
- 보상형 광고는 사용자가 원할 때 선택해서 시청하고 보상을 받는 구조로 설명되어 있습니다.
- 과도한 광고 노출은 피해야 하므로, 현재 앱에는 `강제 광고`보다 `선택형 보상 광고`가 더 적합합니다.

#### 이 앱에 맞는 보상형 광고 보상 후보

- 추가 고해상도 저장 1회
- 프리미엄 템플릿 1회 열기
- 카드 장수 확장권
  - 예: 기본 5장 → 광고 시청 후 8장까지
- 브랜드 스티커 / 강조 배지 팩 1회 열기
- 워터마크 제거 1회
- 자동 표지 장면 생성 1회
- 마지막 CTA 장면 자동 생성 1회
- 앱스토어용 레이아웃 변환 1회
- 여러 비율 동시 저장 1회
- 프로젝트 복제 슬롯 추가

#### 광고 없이도 유지해야 하는 기본 가치

- 첫 카드뉴스 1세트 제작
- 기본 PNG 저장
- 기본 템플릿 2~3종
- 로컬 이미지 업로드와 편집

#### 가장 효과가 높을 가능성이 큰 구조

- `기본 제작은 무료`
- `추가 편의 기능만 보상형 광고로 해제`
- `결과물 품질을 높이는 옵션을 광고 보상으로 제공`

#### 추천 기능 패키지

- 저장 확장 패키지
  - 광고 시청 후 `고해상도 저장 + 여러 비율 저장`
- 템플릿 확장 패키지
  - 광고 시청 후 `프리미엄 템플릿 1회 사용`
- 완성도 확장 패키지
  - 광고 시청 후 `표지 장면 자동 생성 + CTA 장면 자동 생성`
- 반복 사용 패키지
  - 광고 시청 후 `프로젝트 복제 + 추가 장수`

#### 광고 외에 더 자주 쓰게 만드는 기능

- 오늘의 템플릿
- 이번 주 인기 카피
- 업종별 카드뉴스 예시
- 최근 작업 빠른 이어하기
- 마지막 저장본에서 바로 수정
- 브랜드 키트 저장
- 자주 쓰는 문구 저장

#### 현재 판단

- 이 앱에서 광고를 붙인다면 `보상형 광고`가 가장 자연스럽습니다.
- 특히 `고해상도 저장`, `프리미엄 템플릿`, `추가 장수`, `여러 비율 동시 저장`이 실제 사용자가 광고를 보고서라도 열 가능성이 높은 기능입니다.
- 반대로 `첫 저장 자체를 광고로 막는 구조`는 이탈이 커질 가능성이 높습니다.

## 다음 단계 제안

### 기능 확장

- 영상 업로드 및 대표 프레임 추출
- 앱스토어 카피 템플릿 다양화
- SNS 비율별 템플릿 차별화

### 제품 고도화

- 브랜드 컬러 자동 적용
- 텍스트 길이 초과 가이드
- 여러 장 일괄 ZIP 내보내기

### 38. 사진첩 가져오기 단일 입력 경로로 정리

작성 시각: 2026-03-20 12:19:00 KST

- 사용자 요청에 따라 AppsInToss 앨범 불러오기 버튼과 카메라 촬영 버튼을 제거했습니다.
- 기존 `로컬 이미지 추가` 버튼 이름을 `사진첩에서 가져오기`로 변경했습니다.
- 이미지 입력 흐름은 HTML 파일 선택 기반으로 유지해서 휴대폰 사진첩에서 바로 이미지를 고를 수 있게 맞췄습니다.
- `src/App.tsx`에서 권한 확인 다이얼로그와 AppsInToss 앨범·카메라 진입 로직을 제거했습니다.
- `src/lib/appsInToss.ts`에서 더 이상 사용하지 않는 앨범·카메라 브리지 함수를 삭제했습니다.
- `granite.config.ts`에서 카메라 권한 선언을 제거했습니다.
- 사용하지 않게 된 `@toss/tds-mobile`, `@emotion/react` 의존성을 삭제했습니다.
- `README.md`의 MVP 설명도 현재 기능 기준으로 갱신했습니다.

#### 검증

- `npm run lint` 통과
- `npm run build:web` 통과

### 48. 상단 안내 배너와 3단계 설명 카드 제거

작성 시각: 2026-03-20 13:48:20 KST

- 사용자 요청에 따라 아래 시각 요소를 모두 제거했습니다.
  - 상단 `안내` 배너
  - `이미지 선택 / 장면 편집 / 즉시 저장` 3단계 설명 카드
- 내부 상태 메시지는 완전히 버리지 않고, 화면에는 보이지 않는 `aria-live` 영역으로만 유지했습니다.
- 함께 정리한 내용:
  - 사용하지 않는 `notice-banner`, `empty-shell`, `empty-card` 스타일 제거
  - 모바일 미디어쿼리의 남은 `empty-shell` 참조 제거

#### 수정 파일

- `/Users/beom/Documents/project/card-generator/src/App.tsx`
- `/Users/beom/Documents/project/card-generator/src/App.css`

#### 검증

- `npm run lint` 통과
- `npm run build:web` 통과

### 47. 초안 저장 / 새 프로젝트 버튼 제거

작성 시각: 2026-03-20 13:41:10 KST

- 사용자 요청에 따라 미리보기 탭의 `초안 저장`, `새 프로젝트` 버튼을 제거했습니다.
- 자동 저장 기능은 그대로 유지하므로 수동 저장 버튼만 빠진 상태입니다.
- 함께 정리한 내용:
  - 사용하지 않게 된 `handleSaveDraftNow`, `handleResetProject` 제거
  - 더 이상 쓰지 않는 `clearDraftValue` import 제거
  - 저장 카드 설명 문구를 현재 액션에 맞게 수정

#### 수정 파일

- `/Users/beom/Documents/project/card-generator/src/App.tsx`

#### 검증

- `npm run lint` 통과
- `npm run build:web` 통과

### 46. Current Status 카드 제거

작성 시각: 2026-03-20 13:36:10 KST

- 사용자 요청에 따라 `Current Status` 카드를 제거했습니다.
- 완전히 비워두지는 않고, 현재 안내 문구와 작업 상태를 가볍게 보여주는 `notice-banner` 형태로 축소했습니다.
- 단계 카드와 탭 구조가 이미 흐름을 설명하므로, 화면 밀도를 낮추는 쪽으로 정리했습니다.

#### 수정 파일

- `/Users/beom/Documents/project/card-generator/src/App.tsx`
- `/Users/beom/Documents/project/card-generator/src/App.css`

#### 검증

- `npm run lint` 통과
- `npm run build:web` 통과

### 45. 미리보기 탭 분리 및 3단계 카드 상단 고정

작성 시각: 2026-03-20 13:31:30 KST

- 사용자 요청에 따라 `미리보기`를 별도 탭으로 분리했습니다.
- 업로드 이후 작업 영역은 아래 구조로 변경했습니다.
  - 좌측: 슬라이드 흐름 목록
  - 우측 상단: `장면 편집 / 미리보기` 탭
  - 우측 본문: 선택한 탭의 내용만 표시
- `장면 편집` 탭에서는 선택한 장면의 텍스트 수정과 순서 조정만 담당합니다.
- `미리보기` 탭에서는 아래 기능만 모아 보여줍니다.
  - 현재 장면 미리보기
  - 저장 액션
  - 전체 결과 미리보기
- 기존에 빈 상태에서만 보이던 3단계 카드
  - `이미지 선택`
  - `장면 편집`
  - `즉시 저장`
  를 최상단 안내 영역 아래에 항상 보이도록 고정했습니다.
- 탭이 바뀌어도 저장이 안정적으로 동작하도록 숨은 export 렌더 영역을 추가했습니다.

#### 수정 파일

- `/Users/beom/Documents/project/card-generator/src/App.tsx`
- `/Users/beom/Documents/project/card-generator/src/App.css`

#### 검증

- `npm run lint` 통과
- `npm run build:web` 통과

### 44. Color Theme를 결과물 전용으로 분리

작성 시각: 2026-03-20 13:24:10 KST

- 사용자 요청에 따라 `Color Theme` 선택이 편집기 UI 전체를 바꾸지 않도록 조정했습니다.
- 앱 쉘과 편집 패널은 고정된 Ember 톤을 유지하고, 선택한 테마는 아래 영역에만 반영되도록 분리했습니다.
  - 실시간 미리보기
  - 전체 결과 미리보기
  - 실제 PNG 저장 결과물
- 구현 방식:
  - 앱 UI용 CSS 변수는 `EDITOR_THEME` 상수로 고정
  - 결과물 렌더링에는 기존 `activeTheme`를 계속 사용

#### 수정 파일

- `/Users/beom/Documents/project/card-generator/src/App.tsx`

#### 검증

- `npm run lint` 통과
- `npm run build:web` 통과

### 43. 헤더 수정 후 CSS 문법 오류 복구

작성 시각: 2026-03-20 13:19:20 KST

- 상단 헤더 네비게이션 제거 과정에서 `src/App.css` 초반부에 닫는 중괄호가 빠져 이후 스타일이 연쇄적으로 깨지는 문제를 확인했습니다.
- `.bottom-dock button, .preview-select, .slide-rail-main, .flow-step` 규칙 블록을 정상적으로 닫도록 수정했습니다.

#### 수정 파일

- `/Users/beom/Documents/project/card-generator/src/App.css`

#### 검증

- `npm run lint` 통과
- `npm run build:web` 통과

### 39. 로컬 브라우저 개발 서버 재실행

작성 시각: 2026-03-20 12:46:41 KST

- 브라우저 로컬 확인용 개발 서버를 다시 실행했습니다.
- 실행 명령:
  - `npm run dev:web -- --host 127.0.0.1 --port 4173`
- 접속 주소:
  - `http://127.0.0.1:4173/`

### 40. UI/UX 개편용 서비스 요약 문서 작성

작성 시각: 2026-03-20 12:55:30 KST

- 현재 프로젝트를 기준으로 UI/UX 개편에 바로 활용할 수 있는 요약 문서를 작성했습니다.
- 문서에는 아래 내용을 포함했습니다.
  - 현재 서비스 정의
  - 핵심 기능 범위
  - 사용자 흐름
  - 현재 화면 구조
  - 자동화 규칙
  - 유지해야 할 색상과 디자인 톤
  - 현재 UX 장점과 한계
  - 개편 방향과 추천 IA
  - 개편 우선순위
- 작성 파일:
  - `/Users/beom/Documents/project/card-generator/docs/ui-ux-redesign-summary.md`

### 41. 업로드 중심 스튜디오 UX로 화면 전면 개편

작성 시각: 2026-03-20 13:08:40 KST

- 사용자가 제공한 시안의 핵심 흐름을 실제 앱 기능에 맞게 재구성했습니다.
- 유지한 방향:
  - 업로드 중심 첫 화면
  - 우측 설정 카드 스택
  - 단계형 진행 흐름 표시
  - 모바일 하단 도크 액션
- 실제 앱에 맞게 바꾼 방향:
  - 랜딩용 계정 버튼과 의미 없는 메뉴는 제거
  - 업로드 이후에는 `슬라이드 흐름 / 장면 편집 / 실시간 미리보기·저장` 3열 스튜디오 구조로 전환
  - 전체 슬라이드 편집 폼 나열 대신 선택한 한 장을 집중 수정하는 방식으로 변경
  - 저장 액션을 별도 카드로 분리해 `현재 장 저장 / 전체 저장 / 초안 저장 / 새 프로젝트`를 한 영역에 모음
- 추가 구현:
  - 현재 선택된 슬라이드를 기준으로 편집하는 `activeSlideId` 상태 추가
  - 상단 내비게이션과 모바일 하단 도크에서 섹션 이동 가능하도록 스크롤 이동 처리 추가
  - 제공한 시안의 톤에 맞춰 타이포그래피를 `Plus Jakarta Sans + Manrope` 조합으로 정리
- 수정 파일:
  - `/Users/beom/Documents/project/card-generator/src/App.tsx`
  - `/Users/beom/Documents/project/card-generator/src/App.css`
  - `/Users/beom/Documents/project/card-generator/src/index.css`

#### 검증

- `npm run lint` 통과
- `npm run build:web` 통과

#### 참고

- Playwright 기반 시각 검증은 현재 로컬 크롬 기존 세션 충돌로 자동 캡처가 막혀 직접 브라우저 확인이 필요합니다.

### 42. 상단 헤더 네비게이션 제거

작성 시각: 2026-03-20 13:15:40 KST

- 사용자 요청에 따라 상단 헤더의 `Studio`, `Edit`, `Export` 네비게이션을 제거했습니다.
- 헤더에는 브랜드 영역과 런타임 상태 배지만 남기고 정리했습니다.
- 관련 정리로 사용하지 않는 `top-nav` 스타일도 함께 삭제했습니다.

#### 수정 파일

- `/Users/beom/Documents/project/card-generator/src/App.tsx`
- `/Users/beom/Documents/project/card-generator/src/App.css`

#### 검증

- `npm run lint` 통과
- `npm run build:web` 통과

### 49. 장면 편집에 해상도 비율 크롭 프레임 추가

작성 시각: 2026-03-20 13:31:29 KST

- 사용자 요청에 따라 장면 편집 영역에서 업로드한 이미지의 노출 범위를 직접 고를 수 있는 크롭 프레임을 추가했습니다.
- 크롭 프레임은 현재 선택한 해상도 비율을 그대로 따라가도록 구성했습니다.
  - `SNS 1080 x 1080`
  - `SNS 1080 x 1350`
  - `SNS 1080 x 1920`
  - 앱스토어 해상도 3종
- 편집 방식은 아래처럼 바꿨습니다.
  - 중앙에 실제 저장 영역 비율의 박스를 노출
  - 박스 바깥은 검정색 딤 처리
  - 박스 안에서 이미지를 드래그해 위치 조정
  - 줌 슬라이더로 확대 비율 조정
  - `기본 위치` 버튼으로 중심값 복구
- 선택한 프레이밍은 아래 모든 결과에 동일하게 반영됩니다.
  - 좌측 장면 썸네일
  - 현재 장 미리보기
  - 전체 결과 미리보기
  - 실제 PNG 저장 결과물
- 반응형 대응도 함께 보정했습니다.
  - 작은 화면에서는 크롭 프레임이 가로 폭 안으로 자동 축소
  - 해상도 비율은 유지

#### 수정 파일

- `/Users/beom/Documents/project/card-generator/src/App.tsx`
- `/Users/beom/Documents/project/card-generator/src/App.css`

#### 검증

- `npm run lint` 통과
- `npm run build:web` 통과

### 50. Color Theme를 자유 색상 선택 구조로 확장

작성 시각: 2026-03-20 13:34:16 KST

- 사용자 요청에 따라 `Color Theme`를 고정 프리셋만 고르는 구조에서 아래 3가지 선택 구조로 바꿨습니다.
  - `선택 안함`
  - 기본 프리셋 3종
  - 직접 색상 선택
- `선택 안함`을 고르면 결과물에는 중립 톤의 배경과 글로우만 적용되고, 별도 색상 포인트는 최소화됩니다.
- 직접 색상을 고르면 컬러 피커에서 선택한 색을 기준으로 결과물용 배경, 보조 톤, 글로우 색을 자동 생성합니다.
- 기존 원칙은 그대로 유지했습니다.
  - 편집기 UI 색상은 변경하지 않음
  - 미리보기와 실제 PNG 저장 결과물에만 적용
- 초안 저장 구조도 함께 확장했습니다.
  - `themeId`
  - `customColor`
  - 재접속 시 선택한 사용자 색상 복구

#### 수정 파일

- `/Users/beom/Documents/project/card-generator/src/App.tsx`
- `/Users/beom/Documents/project/card-generator/src/App.css`

#### 검증

- `npm run lint` 통과
- `npm run build:web` 통과

### 51. 입력값 노출 위치 안내 문구 추가

작성 시각: 2026-03-20 13:36:32 KST

- 사용자 요청에 따라 입력값이 결과물 어디에 노출되는지 화면 안에서 바로 이해할 수 있도록 안내 문구를 추가했습니다.
- 추가한 안내 항목:
  - `서비스 이름`: SNS 카드뉴스 본문 브랜드명, 앱스토어 소개 이미지 배지
  - `메인 메시지`: SNS 카드뉴스 하단 문장, 앱스토어 소개 이미지 하단 캡션 제목
  - `사진`: SNS 카드뉴스 장면 배경, 앱스토어 소개 이미지 휴대폰 화면
- 사진 안내는 업로드 카드 바로 아래에 별도 안내 박스로 넣어, 업로드 직후 사용자가 결과 노출 위치를 바로 이해할 수 있게 했습니다.
- 서비스 이름과 메인 메시지는 각 입력 필드 아래에 짧은 보조 설명으로 붙였습니다.

#### 수정 파일

- `/Users/beom/Documents/project/card-generator/src/App.tsx`
- `/Users/beom/Documents/project/card-generator/src/App.css`

#### 검증

- `npm run lint` 통과
- `npm run build:web` 통과

### 52. 도움말 버튼과 모달 안내 구조로 전환

작성 시각: 2026-03-20 13:37:52 KST

- 사용자 요청에 따라 필드 아래 인라인 설명 문구를 제거하고, 라벨 옆 `도움말` 버튼으로 전환했습니다.
- 적용한 도움말 항목:
  - `사진 노출 위치`
  - `서비스 이름 노출 위치`
  - `메인 메시지 노출 위치`
- 버튼을 누르면 공통 모달이 열리고, 항목별 노출 위치 설명을 보여주도록 구성했습니다.
- 모달은 아래 동작을 지원합니다.
  - 바깥 영역 클릭 시 닫기
  - `닫기` 버튼으로 닫기
  - `Esc` 키로 닫기
- 이를 통해 기본 화면은 더 간결하게 유지하고, 필요한 정보만 선택적으로 열어볼 수 있게 정리했습니다.

#### 수정 파일

- `/Users/beom/Documents/project/card-generator/src/App.tsx`
- `/Users/beom/Documents/project/card-generator/src/App.css`

#### 검증

- `npm run lint` 통과
- `npm run build:web` 통과

### 53. 최상단에 사이트 사용 방법 4단계 흐름 추가

작성 시각: 2026-03-20 13:39:11 KST

- 사용자 요청에 따라 페이지 최상단에 `사이트 사용 방법` 흐름 섹션을 추가했습니다.
- 안내 흐름은 아래 4단계로 구성했습니다.
  - `1. 사진 선택`
  - `2. 브랜드 및 카드 정보 입력`
  - `3. 장면 편집 및 미리보기`
  - `4. 결과 저장`
- 각 단계 카드에는 짧은 설명을 함께 넣어 처음 들어온 사용자도 전체 사용 흐름을 한 번에 이해할 수 있게 했습니다.
- 기존에 업로드 영역 아래에 있던 3단계 흐름 섹션은 제거하고, 안내 성격이 더 강한 최상단 4단계 구조로 정리했습니다.
- 단계 카드를 누르면 관련 영역으로 이동하도록 유지했습니다.
  - 1, 2단계: 업로드 및 정보 입력 영역
  - 3단계: 장면 편집 탭
  - 4단계: 미리보기 및 저장 탭

#### 수정 파일

- `/Users/beom/Documents/project/card-generator/src/App.tsx`
- `/Users/beom/Documents/project/card-generator/src/App.css`

#### 검증

- `npm run lint` 통과
- `npm run build:web` 통과

### 54. 최상단 사용 방법 카드 크기 축소

작성 시각: 2026-03-20 13:40:44 KST

- 사용자 피드백에 따라 최상단 `사이트 사용 방법` 카드가 내용에 비해 너무 크게 보이던 부분을 축소했습니다.
- 조정한 항목:
  - 카드 높이 감소
  - 카드 내부 패딩 축소
  - 단계 번호 원 크기 축소
  - 제목/설명 글자 크기와 줄 간격 압축
- 목적은 같은 정보량을 더 단단하게 보이게 하고, 상단 공간 점유를 줄이는 것입니다.

#### 수정 파일

- `/Users/beom/Documents/project/card-generator/src/App.css`

#### 검증

- `npm run lint` 통과
- `npm run build:web` 통과

### 55. 최상단 사용 방법 카드 최소 높이 제거 및 글자 크기 재조정

작성 시각: 2026-03-20 13:41:30 KST

- 사용자 피드백에 따라 상단 사용 방법 카드가 여전히 크게 느껴지는 문제를 추가로 조정했습니다.
- 이번 수정에서는 카드의 최소 높이를 제거해 내용 길이에 맞게 자연스럽게 줄어들도록 바꿨습니다.
- 함께 조정한 항목:
  - 카드 패딩 추가 축소
  - 카드 모서리 반경 소폭 축소
  - 제목 글자 크기 소폭 확대
  - 설명 글자 크기와 줄 간격 재조정
- 의도는 `박스는 더 작게`, `글은 더 읽기 쉽게` 맞추는 것입니다.

#### 수정 파일

- `/Users/beom/Documents/project/card-generator/src/App.css`

#### 검증

- `npm run lint` 통과
- `npm run build:web` 통과

### 56. 모바일 하단 바 완전 제거

작성 시각: 2026-03-20 13:42:17 KST

- 사용자 요청에 따라 모바일에서 보이던 하단 고정 바를 완전히 제거했습니다.
- 제거 범위:
  - 하단 바 마크업 삭제
  - 관련 버튼 스타일 삭제
  - 모바일 전용 하단 바 레이아웃 스타일 삭제
- 하단 바 제거 후 모바일 하단 여백이 과하게 남지 않도록 앱 쉘의 모바일 하단 마진도 함께 축소했습니다.
- 결과적으로 모바일에서는 별도 하단 액션 바 없이 본문 흐름만 보이도록 정리했습니다.

#### 수정 파일

- `/Users/beom/Documents/project/card-generator/src/App.tsx`
- `/Users/beom/Documents/project/card-generator/src/App.css`

#### 검증

- `npm run lint` 통과
- `npm run build:web` 통과

### 57. 상단 안내 문구 변경 및 `.ait` 재빌드

작성 시각: 2026-03-20 13:42:58 KST

- 사용자 요청에 따라 최상단 안내 제목을 `사이트 사용 방법`에서 `SNS 카드 뉴스 생성방법`으로 변경했습니다.
- 변경 후 전체 빌드 체인을 다시 확인했습니다.
  - `npm run lint`
  - `npm run build:web`
  - `npm run build`
- `.ait` 산출물도 재생성했습니다.
  - 파일명: `cardstudio.ait`
  - deploymentId: `019d098d-8e0f-79f7-9dbf-bfbb2a745e4d`

#### 수정 파일

- `/Users/beom/Documents/project/card-generator/src/App.tsx`

#### 검증

- `npm run lint` 통과
- `npm run build:web` 통과
- `npm run build` 통과

### 58. 기존 빌드 산출물 삭제 후 재빌드

작성 시각: 2026-03-20 13:44:32 KST

- 사용자 요청에 따라 기존 빌드 산출물을 먼저 삭제한 뒤 다시 빌드했습니다.
- 삭제한 산출물 범위:
  - `/Users/beom/Documents/project/card-generator/dist`
  - 기존 `.ait` 파일 전체
- 삭제 후 `npm run build`를 다시 실행해 새 산출물을 생성했습니다.
- 재빌드 결과 현재 남아 있는 산출물:
  - `/Users/beom/Documents/project/card-generator/dist`
  - `/Users/beom/Documents/project/card-generator/cardstudio.ait`
- 새 배포 ID:
  - `019d098f-0aa0-75e0-aa72-cc2f288fb36f`

#### 검증

- `npm run build` 통과

### 59. 시작 시 이전 업로드 이미지 자동 복구 제거

작성 시각: 2026-03-20 17:46:53 KST

- 사용자 요청에 따라 이전에 업로드했던 사진이 기본 이미지처럼 다시 나타나는 동작을 제거했습니다.
- 원인은 초안 복구 시 저장된 슬라이드 이미지까지 함께 불러오던 로직이었습니다.
- 변경 후에는 앱 시작 시 아래처럼 동작합니다.
  - 서비스 이름, 메인 메시지, 모드, 해상도, 색상 설정은 복구
  - 업로드했던 사진 슬라이드는 복구하지 않음
  - 사진은 빈 상태로 시작
- 즉, 이전에 올렸던 사진이 기본 이미지처럼 자동으로 노출되지 않습니다.

#### 수정 파일

- `/Users/beom/Documents/project/card-generator/src/App.tsx`

#### 검증

- `npm run lint` 통과
- `npm run build:web` 통과

### 60. 모바일 미리보기 렌더링 선명도 개선

작성 시각: 2026-03-20 17:49:00 KST

- 사용자 요청에 따라 모바일에서 미리보기 사진이 깨져 보이던 문제를 수정했습니다.
- 원인은 전체 슬라이드를 CSS 변환으로 축소하던 미리보기 방식이었습니다.
- 변경 후에는 미리보기 영역 폭을 기준으로 슬라이드를 실제 표시 크기로 다시 렌더링합니다.
  - 집중 미리보기는 더 큰 최대 폭 사용
  - 전체 결과 미리보기는 카드 폭에 맞춰 렌더링
  - CSS `transform scale` 기반 축소 제거
- 이 변경으로 모바일에서 이미지와 텍스트가 더 선명하게 보이도록 정리했습니다.

#### 수정 파일

- `/Users/beom/Documents/project/card-generator/src/App.tsx`
- `/Users/beom/Documents/project/card-generator/src/App.css`

#### 검증

- `npm run lint` 통과
- `npm run build:web` 통과

### 61. 기존 산출물 삭제 후 `.ait` 재빌드

작성 시각: 2026-03-20 17:49:40 KST

- 사용자 요청에 따라 현재 빌드 산출물을 먼저 삭제한 뒤 다시 빌드했습니다.
- 삭제 대상:
  - `/Users/beom/Documents/project/card-generator/dist`
  - `/Users/beom/Documents/project/card-generator/*.ait`
- 삭제 후 `npm run build`를 다시 실행했습니다.
- 재빌드 후 현재 남아 있는 산출물:
  - `/Users/beom/Documents/project/card-generator/dist`
  - `/Users/beom/Documents/project/card-generator/cardstudio.ait`
- 새 배포 ID:
  - `019d0a6f-6ca7-725d-942e-837faecaad9a`

#### 검증

- `npm run build` 통과

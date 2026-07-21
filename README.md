# SNS 카드 뉴스 생성기

AppsInToss WebView 기반으로 만든 SNS 카드뉴스 제작 도구입니다.

## 목표

- 이미지 3~5장으로 SNS 카드뉴스 제작
- 같은 입력으로 스토어 소개 이미지 제작
- 마케팅 메시지 중심의 광고형 비주얼 제작
- 브라우저 미리보기와 AppsInToss 기기 저장을 함께 지원

## 기술 스택

- Vite
- React
- TypeScript
- `@apps-in-toss/web-framework`
- `html-to-image`

## 실행

### 웹 미리보기

```bash
npm install
npm run dev:web
```

### AppsInToss 개발 서버

```bash
npm install
npm run dev
```

### 웹 빌드

```bash
npm run build:web
```

### AppsInToss 아티팩트 빌드

```bash
npm run build
```

빌드가 완료되면 루트에 `.ait` 파일이 생성됩니다.

## Google 이미지 가져오기 (SerpApi)

자동 생성 화면에서 **Google 이미지 가져오기**를 체크하면 주제의 핵심 한국어 문구를 한 번만 SerpApi Google Images에 검색합니다. 검색 결과의 original 이미지 URL을 카드 순서대로 카드 배경과 **카드 이미지/영상 URL**에 적용하며, 후보 목록에서 다른 이미지를 눌러 교체할 수 있습니다.

1. 상단 **API Key 설정**에서 `SerpApi API Key`를 입력하고 저장합니다. OpenAI/Gemini 키와 같은 브라우저 초안 저장 방식으로 보관되며 Google 이미지 검색 요청에만 전송됩니다
2. SerpApi API Key 값이 비어 있으면 **Google 이미지 가져오기** 체크박스는 비활성화됩니다
3. 여러 사용자가 공통으로 쓸 기본 키는 서버 환경변수 `SERPAPI_KEY`로도 설정할 수 있습니다. 화면에서 입력한 키가 있으면 해당 키를 우선 사용합니다
4. 키는 검색 서버로만 전송하고, 검색 결과·API 응답·사용량 로그에는 포함하지 않습니다
5. 주제의 핵심 한국어 키워드만 SerpApi에 한 번 요청하고, 카드 수만큼의 중복 없는 original URL을 검색 결과 순서대로 각 카드에 배정합니다. 예: `오픈AI 초고성능 모델 ‘GPT-5.6’ 정식 출시` → `오픈AI 초고성능 모델 GPT-5.6 정식 출시` 단일 검색어

검색 요청·결과·오류는 서버 로그에 JSON 형태로 남습니다. Vercel에서는 Logs에서 `serpapi_usage`를 검색해 API 사용량과 한도 오류를 추적할 수 있습니다. 이 로그에는 API 키를 기록하지 않습니다.

## 현재 MVP 범위

- 사진첩에서 이미지 가져오기
- SNS 카드뉴스 / 스토어 소개 이미지 모드 전환
- 장별 카피 편집
- PNG 저장
- 초안 저장 / 복구

## 주의

- 현재 버전은 이미지 입력만 지원합니다.
- 짧은 영상 업로드와 프레임 추출은 다음 단계 범위입니다.
- `granite.config.ts`의 `appName`은 실제 AppsInToss 콘솔 앱 이름과 맞춰야 합니다.

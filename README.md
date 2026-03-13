# 카드뉴스 제너레이터

AppsInToss WebView 기반으로 만든 카드뉴스 / 앱스토어 소개 이미지 생성기입니다.

## 목표

- 이미지 3~5장으로 SNS 카드뉴스 제작
- 같은 입력으로 앱스토어 소개 이미지 제작
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

## 현재 MVP 범위

- 로컬 이미지 업로드
- AppsInToss 앨범 불러오기
- AppsInToss 카메라 촬영 추가
- SNS 카드뉴스 / 앱스토어 소개 이미지 모드 전환
- 장별 카피 편집
- PNG 저장
- 초안 저장 / 복구

## 주의

- 현재 버전은 이미지 입력만 지원합니다.
- 짧은 영상 업로드와 프레임 추출은 다음 단계 범위입니다.
- `granite.config.ts`의 `appName`은 실제 AppsInToss 콘솔 앱 이름과 맞춰야 합니다.

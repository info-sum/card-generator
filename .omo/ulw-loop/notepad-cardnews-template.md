# Goal

직접 생성/카드뉴스형 템플릿 개선:
- 직접 생성 문구 `직접 만든 카드뉴스`, `Manual Card News`가 카드 상하단에 노출되지 않는다.
- 등록 로고가 카드뉴스형 템플릿 헤더에 표시된다.
- 카드뉴스형 템플릿은 첨부 예시처럼 파란 외곽, 둥근 흰 카드, 상단 로고+브랜드, 구분선, 제목/내용1/내용2 구조로 렌더링된다.
- 편집 섹션은 제목, 내용1, 내용2로 나뉘고 내용1은 중앙, 내용2는 하단 강조 박스에 표시된다.

# Skills

- omo:ulw-loop: evidence-bound RED/GREEN + browser QA loop.
- omo:programming: TypeScript/TSX changes.
- omo:frontend-ui-ux: template visual redesign and editor UX.
- browser:control-in-app-browser: real local browser verification.

# Scope

- Surfaces: direct generation wizard, editor text fields, card preview renderer, export renderer.
- Files likely touched: `src/App.tsx`, `src/App.css`, `src/cardNewsDraft.ts`, tests.
- Non-trivial: multi-step, multi-file, UI/data/rendering. Plan agent spawned: `cardnews_template_plan`.

# Success Criteria

1. `sequence_sections`
   - Test: `src/cardNewsDraft.test.ts` / `splitCardNewsSections separates content1 and content2 for sequence cards`.
   - Manual QA: Browser use at `http://127.0.0.1:4184/`; create direct cardnews card with title/content1/content2 and assert DOM contains content1 in `.sequence-description` and content2 in `.sequence-callout`.
   - Evidence: `.omo/ulw-loop/evidence/sequence-sections-red.txt`, `.omo/ulw-loop/evidence/sequence-sections-green.txt`, `.omo/ulw-loop/evidence/sequence-sections-browser.json`, `.omo/ulw-loop/screenshots/sequence-sections.png`.

2. `manual_branding_cleanup`
   - Test: `src/cardNewsDraft.test.ts` / `getManualCardNewsProjectText removes generated manual filler labels`.
   - Manual QA: Browser use; direct card creation must not expose `직접 만든 카드뉴스` or `Manual Card News` in `.slide-canvas`.
   - Evidence: `.omo/ulw-loop/evidence/manual-branding-red.txt`, `.omo/ulw-loop/evidence/manual-branding-green.txt`, `.omo/ulw-loop/evidence/manual-branding-browser.json`.

3. `sequence_logo`
   - Test: `src/cardNewsDraft.test.ts` / `createSequenceHeaderModel exposes uploaded logo only when registered`.
   - Manual QA: Browser use; set registered logo data URL, create direct cardnews card, assert `.sequence-logo-image` exists.
   - Evidence: `.omo/ulw-loop/evidence/sequence-logo-red.txt`, `.omo/ulw-loop/evidence/sequence-logo-green.txt`, `.omo/ulw-loop/evidence/sequence-logo-browser.json`, `.omo/ulw-loop/screenshots/sequence-logo.png`.

# Plan

1. Add failing tests for pure helpers.
2. Implement helpers and wire types.
3. Update editor fields and SequenceSlide renderer/CSS.
4. Run full verification and browser scenarios.
5. Run reviewer gate because ULW requested strict mode and work touches multiple files.

# Evidence

- RED: `.omo/ulw-loop/evidence/sequence-sections-red.txt`
  - Failure: missing exports for `createSequenceHeaderModel`, `getManualCardNewsProjectText`, `splitCardNewsSections`.
- GREEN: `.omo/ulw-loop/evidence/sequence-sections-green.txt`
  - `node --test` pass: 17 tests.
- Browser QA:
  - `.omo/ulw-loop/evidence/sequence-sections-browser.json`
  - `.omo/ulw-loop/evidence/manual-branding-browser.json`
  - `.omo/ulw-loop/evidence/sequence-logo-browser.json`
  - `.omo/ulw-loop/screenshots/sequence-sections.png`
  - `.omo/ulw-loop/screenshots/sequence-logo.png`
  - PASS values: first card cover visible, detail card visible, logo visible, brand visible, title/content1/content2 fields visible, content1/content2 render visible, forbidden phrases false, blue shell `rgb(18, 71, 216)`, white card `rgb(255, 255, 255)`.
  - cleanup: closed Playwright Chrome browser context.
- Added request RED/GREEN:
  - RED: `.omo/ulw-loop/evidence/first-card-cover-red.txt`
  - GREEN: `.omo/ulw-loop/evidence/first-card-cover-green.txt`
  - Behavior: `getSequenceCardVariant(0) === 'cover'`, subsequent cards are `detail`.
- Added request RED/GREEN:
  - RED: `.omo/ulw-loop/evidence/direct-size-control-red.txt`
  - GREEN: `.omo/ulw-loop/evidence/direct-size-control-green.txt`
  - Behavior: direct/manual editor design tools include `image-size`; browser QA confirms `이미지 사이즈`, `이미지 사이즈 조정`, and `줌` controls are visible.
- Full verification:
  - `npx tsc -p tsconfig.cardnews-test.json`
  - `node --test .tmp-cardnews-test/cardNewsDraft.test.js .tmp-cardnews-test/creationFlow.test.js`
  - `npm run lint`
  - `npm run build`
- LSP diagnostics:
  - unavailable because `typescript-language-server` and `biome` are not installed locally; replaced by `tsc`, `eslint`, and build.

# Cleanup

- Plan agent `cardnews_template_plan`: closed.
- Browser QA Chrome context: closed by `run-cardnews-qa.mjs` finally block.
- No tmux sessions, containers, bound QA ports, or temporary external dirs created by QA.

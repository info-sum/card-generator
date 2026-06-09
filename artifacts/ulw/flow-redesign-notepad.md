# ULW Notepad: Flow Redesign

## Goal
Deliverable: 첨부된 자동 생성/직접 생성 플로우와 UI/UX를 기준으로 카드뉴스 생성 화면을 고도화하고 브랜드명 표기를 유지한다.

## Skills
- `omo:frontend-ui-ux`: 첨부 플로우의 생성 중심 UX/시각 구조를 앱에 반영.
- `omo:programming`: TS/TSX 변경, 테스트 우선, 타입 엄격성 적용.
- `browser:control-in-app-browser`: 실제 로컬 페이지에서 자동/직접 플로우 QA.

## Scope
- Surfaces: React UI, draft generator contract, CSS responsive layout, local browser.
- Files likely touched: `src/App.tsx`, `src/App.css`, `src/cardNewsDraft.ts`, `src/cardNewsDraft.test.ts`.
- DB: 현 앱은 localStorage 기반 초안 저장이며 DB 스키마/서버 저장소가 없어 변경 불필요로 판단.

## Success Criteria
1. Auto flow exposes 6 steps: 주제 입력, 스타일 선택, 브랜드 설정, AI 생성, 편집, 다운로드.
   - Test first: `src/cardNewsDraft.test.ts` test id `generateCardNewsDraft returns exactly 8 wizard cards for every style`.
   - Manual QA: Browser use `http://127.0.0.1:4179/`, click 자동 생성 -> 예시 주제 -> 다음 -> 스타일 -> 다음; PASS if stepper includes `1 주제 입력` through `6 다운로드`.
2. Brand name is not Sequence and is carried into generated auto cards.
   - Test first: existing + expanded `generateCardNewsDraft uses the provided brand name in generated templates`.
   - Manual QA: Browser use same URL, Step 3 brand input; PASS if default is not `Sequence`, and after generate the saved draft includes the entered brand.
3. Direct flow is separate and AI controls stay hidden.
   - Test first: add component-level feasible contract through DOM-visible strings if a test harness exists; otherwise generator/unit cannot cover UI, capture RED via browser QA before implementation and add unit coverage for direct card helper if exported is introduced.
   - Manual QA: Browser use same URL, click 직접 생성; PASS if `새 카드 추가`, `빈 카드로 시작`, `템플릿으로 시작` are visible and `스타일 선택`, `AI 생성`, `브랜드 설정` are absent in direct panel.
4. Adjacent regression: existing export-compatible slide draft fields remain valid.
   - Test first: existing `generateCardNewsDraft keeps generated slides compatible with export rendering`.
   - Manual QA: Browser use generated completion; PASS if 8 generated card buttons exist and `편집 시작` opens editing workspace.

## Evidence
- RED auto wizard test: `npx tsc -p tsconfig.cardnews-test.json` failed with `Cannot find module './creationFlow.js'` after adding `src/creationFlow.test.ts`.
- GREEN auto wizard test: `npx tsc -p tsconfig.cardnews-test.json && node --test .tmp-cardnews-test/cardNewsDraft.test.js .tmp-cardnews-test/creationFlow.test.js` passed 9/9.
- Full app static checks: `npm run lint` passed; `npm run build` passed.
- Browser QA auto flow: Chrome/Playwright command against `http://127.0.0.1:4180/`; PASS output `{"start":{"hasStart":true,"hasAuto":true,"hasManual":true,"hasBottomBar":false},"allSix":true,"brandValue":"SNS 카드 뉴스 생성기","step4":true,"step5":true,"generatedCount":8,"step6":true}`.
- Browser QA direct flow: Chrome/Playwright command against `http://127.0.0.1:4180/`; PASS output `{"hasManualStart":true,"hasDirectSteps":true,"hidesAiControls":true,"hasNoGeneratedNumbers":true}`.
- Screenshot artifacts: `artifacts/ulw/qa-start.png`, `artifacts/ulw/qa-auto-step5.png`, `artifacts/ulw/qa-auto-step6.png`, `artifacts/ulw/qa-direct-flow.png`.
- Cleanup receipts: Chrome Playwright browsers closed in both QA scripts via `await browser.close()`. QA server on `4180` ended; final user-facing Vite preview relaunched at `http://127.0.0.1:4181/`.
- Reviewer gate: `codex-ultrawork-reviewer` attempted twice (`flow_redesign_reviewer`, `flow_redesign_reviewer_2`) but both completed with `completed:null` and returned no verdict. Fallback default reviewer was attempted but did not return a usable handle/status. Proceeding with captured RED→GREEN + real Chrome QA evidence.

## Findings
- `src/App.tsx` and `src/App.css` are oversized inherited files; this task will make smallest correct changes, not broad refactor.
- DB 변경 불필요: 현재 앱은 localStorage 초안 저장 및 클라이언트 생성 흐름만 사용한다.

# ULW Notepad: Template Flow Recovery

## Goal
Deliverable: 자동 생성/직접 생성 이후 기존 템플릿 경험을 복원하고, 자동 생성은 여러 템플릿 중 선택 후 생성하며, 탭 전환 시 작업 상태를 임시 저장하고 진행 섹션을 다시 숨긴다.

## Skills
- `omo:frontend-ui-ux`: 템플릿 선택과 progressive disclosure UX 개선.
- `omo:programming`: TS/TSX strict typed model and tests.
- `browser:control-in-app-browser`: 로컬 브라우저 실제 플로우 QA.

## Success Criteria
1. Auto flow shows multiple template choices before generation.
   - Test first: `src/creationFlow.test.ts` adds template contract test.
   - Browser QA: Chrome on local URL; click 자동 생성 -> topic -> style -> brand; PASS if 4+ template cards visible and selecting one changes generation layout label/active state.
2. Direct flow restores old template choices and hides AI controls.
   - Test first: direct template contract in `src/creationFlow.test.ts`.
   - Browser QA: click 직접 생성; PASS if direct template choices include old layouts and no AI/brand/style generation sections are visible.
3. Switching auto/manual preserves draft inputs but collapses sections.
   - Test first: flow model includes reset target steps for mode switch.
   - Browser QA: enter/select auto topic, switch manual, switch auto; PASS if topic remains but visible step is Step 1 only, later sections hidden.
4. Regression: generator brand/layout remains export-compatible.
   - Test: existing `cardNewsDraft` tests remain green.
   - Browser QA: generate after selecting a template; PASS if 8 cards generated and selected template applies to global layout.

## Evidence
- RED: `npx tsc -p tsconfig.cardnews-test.json` failed after test additions with missing exports `AUTO_TEMPLATE_OPTIONS`, `DIRECT_TEMPLATE_OPTIONS`, `MODE_SWITCH_RESET_STEP`.
- GREEN: `npx tsc -p tsconfig.cardnews-test.json && node --test .tmp-cardnews-test/cardNewsDraft.test.js .tmp-cardnews-test/creationFlow.test.js` passed 12/12.
- Full static checks: `npm run lint` passed; `npm run build` passed.
- Browser QA auto templates: Chrome/Playwright on `http://127.0.0.1:4182/`; PASS output `{"step4HasTemplateQuestion":true,"autoTemplateCount":4,"activePremium":true,"generatedCount":8,"generatedHasEdit":true}`.
- Browser QA direct templates: Chrome/Playwright on `http://127.0.0.1:4182/`; first locator attempt failed due accessible-name mismatch, rerun PASS output `{"directTemplateCount":4,"manualListInitiallyHidden":true,"hidesAi":true,"activeDirect":true,"afterAddHasCards":true,"manualListAfterAdd":true}`.
- Browser QA tab switch temp-save/collapse: Chrome/Playwright on `http://127.0.0.1:4182/`; first attempt failed due hidden legacy duplicate input, rerun scoped to `.wizard-topic-field input` PASS output `{"autoReachedStep2":true,"manualCollapsed":true,"autoCollapsedToStep1":true,"topicPreserved":true}`.
- Screenshot artifacts: `artifacts/ulw/qa-auto-template-step.png`, `artifacts/ulw/qa-auto-template-generated.png`, `artifacts/ulw/qa-direct-template.png`, `artifacts/ulw/qa-tab-switch-collapsed.png`.
- Cleanup receipts: Chrome Playwright browsers closed via `await browser.close()` in passing QA scripts. QA server on `4182` ended; final user-facing Vite preview relaunched at `http://127.0.0.1:4183/`.
- LSP: `typescript-language-server` not installed, so LSP diagnostics unavailable; `tsc` was used as type diagnostic gate.
- Reviewer gate: `codex-ultrawork-reviewer` attempted as `template_flow_reviewer`, but it completed with `completed:null` and no verdict. Proceeding with RED→GREEN, lint/build, and real Chrome QA evidence.

## Findings
- DB 변경 불필요 예상: 현재 앱은 localStorage 초안/클라이언트 상태 기반. 탭별 임시저장은 local state + existing draft save로 충분.
- `src/App.tsx`/`src/App.css` are oversized inherited files; change is scoped.

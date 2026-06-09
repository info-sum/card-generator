# Cardnews Flow Redesign Implementation

## TL;DR
> Summary:      Finish the current partial Korean cardnews flow redesign with a six-step automatic path, a separate direct start/edit/preview path, orange-accent UI, local draft persistence, and real Chrome QA on `http://127.0.0.1:4179`.
> Deliverables:
> - Flow contract/tests for `자동 생성` and `직접 생성`
> - Automatic flow: `주제 입력`, `스타일 선택`, `브랜드 설정`, `AI 생성`, `편집`, `다운로드`
> - Direct flow: `시작`, `편집`, `미리보기`, with no visible AI controls or AI copy
> - Browser verification script and evidence under `evidence/`
> - LocalStorage/AppsInToss-compatible restore for automatic and direct drafts
> - Orange-accent creation UI polish without a broad component refactor
> Effort:       Medium
> Risk:         Medium - `src/App.tsx` and `src/App.css` are large dirty surfaces, but the flow constants and first UI pass already exist.

## Scope
### Must have
- Preserve existing dirty work; current `git status --short` shows modified app/style/config files plus untracked `src/cardNewsDraft.ts`, `src/creationFlow.ts`, tests, plans, and artifacts.
- Use the existing pure flow module at `src/creationFlow.ts:1` as the source of truth for start options and step labels.
- Keep automatic flow labels exactly `['주제 입력', '스타일 선택', '브랜드 설정', 'AI 생성', '편집', '다운로드']`.
- Change direct flow to a separate `시작` -> `편집` -> `미리보기` path unless the executor finds a stronger attached-flow artifact in the repo.
- Hide all visible `AI` text and controls while `creationMode === 'manual'`, including the current direct-copy text at `src/App.tsx:1443`.
- Keep generation deterministic and local through `generateCardNewsDraft`; no backend, DB, LLM API, or network generation.
- Keep draft storage in the existing AppsInToss/native-storage wrapper with browser `localStorage` fallback at `src/lib/appsInToss.ts:44`.
- Use the user-requested QA URL `http://127.0.0.1:4179`.
- Keep file changes minimal: expected files are `package.json`, `.gitignore`, `README.md`, `src/creationFlow.ts`, `src/creationFlow.test.ts`, `src/cardNewsDraft.test.ts`, `src/App.tsx`, `src/App.css`, `src/index.css`, and one browser verifier under `scripts/`.

### Must NOT have (guardrails, anti-slop, scope boundaries)
- Do not add a database, server route, external AI service, Prisma/Supabase/Firebase/Postgres dependency, or network generation call.
- Do not do a broad `App.tsx` component extraction as part of this request.
- Do not revert uncommitted user work; work with the dirty baseline and record it in evidence.
- Do not make a landing page. The first screen remains the usable creation experience.
- Do not leave generated screenshots, downloaded PNGs, `.tmp-cardnews-test/`, or `evidence/` tracked.
- Do not rely on hidden `.legacy-composer` DOM text for browser assertions; QA must check visible UI.
- Do not change AppsInToss bridge APIs unless a verifier failure proves it is required.

## Verification strategy
> Zero human intervention - all verification is agent-executed.
- Test decision: TDD + Node `node:test`/`node:assert`, TypeScript, ESLint, Vite build, and Playwright Core driving real Chrome.
- QA policy: every task has agent-executed scenarios
- Evidence: `evidence/task-<N>-<slug>.<ext>`
- Browser policy: start local web server on `127.0.0.1:4179`; drive it with Chrome at `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`. If Chrome is unavailable, use agent-browser with the same URL and selectors.
- External references:
- External: `https://nodejs.org/api/test.html` - Node test runner and `--test-name-pattern` behavior.
- External: `https://vite.dev/guide/cli` - `vite --host --port --strictPort`, `vite build`, and `vite preview`.
- External: `https://playwright.dev/docs/api/class-page#page-screenshot` - screenshot evidence capture.
- External: `https://react.dev/learn/conditional-rendering` - state-driven branch rendering for auto/direct panels.
- External: `https://react.dev/reference/react-dom/components/input` - controlled input `value` + synchronous `onChange`.

## Execution strategy
### Parallel execution waves
> Target 5-8 tasks per wave. <3 per wave (except final) = under-splitting.
> Extract shared dependencies as Wave-1 tasks to maximize parallelism.

Wave 1 (no dependencies):
- Task 1: Add/lock test scripts, flow contracts, and evidence ignores
- Task 2: Add browser verification CLI for port 4179
- Task 3: Apply orange token foundation to the creation UI

Wave 2 (after Wave 1):
- Task 4: depends [1, 2, 3] - Finish automatic six-step flow rendering and gating
- Task 5: depends [1, 2, 3, 4] - Finish automatic generation, edit handoff, and download step
- Task 6: depends [1, 2, 3] - Build direct start/edit/preview path with AI hidden

Wave 3 (after Wave 2):
- Task 7: depends [4, 5, 6] - Persist/restore mode metadata and verify export preview
- Task 8: depends [1, 2, 3, 4, 5, 6, 7] - Update docs and run final integration checks

Critical path: Task 1 -> Task 4 -> Task 5 -> Task 7 -> Task 8

### Dependency matrix
| Task | Depends on | Blocks | Can parallelize with |
|------|------------|--------|----------------------|
| 1    | none       | 4, 5, 6, 8 | 2, 3              |
| 2    | none       | 4, 5, 6, 7, 8 | 1, 3           |
| 3    | none       | 4, 5, 6, 8 | 1, 2              |
| 4    | 1, 2, 3    | 5, 7, 8 | 6                    |
| 5    | 1, 2, 3, 4 | 7, 8   | 6                    |
| 6    | 1, 2, 3    | 7, 8   | 4, 5                 |
| 7    | 4, 5, 6    | 8      | none                 |
| 8    | 1, 2, 3, 4, 5, 6, 7 | none | none       |

## Todos
> Implementation + Test = ONE task. Never separate.
> Every task MUST have: References + Acceptance Criteria + QA Scenarios + Commit.

- [ ] 1. Add/lock test scripts, flow contracts, and evidence ignores

  What to do: Record the dirty baseline before edits. Add `evidence/` to `.gitignore`. Add `test:cardnews:compile` and `test:cardnews` scripts to `package.json`. Update tests first so `AUTO_CREATION_FLOW_STEPS` keeps the exact six labels and `DIRECT_CREATION_FLOW_STEPS` becomes exactly `['시작', '편집', '미리보기']`. Then update `src/creationFlow.ts` to satisfy the failing tests.
  Must NOT do: Do not install Vitest/Jest/RTL. Do not touch `src/App.tsx` behavior in this task.

  Parallelization: Can parallel: YES | Wave 1 | Blocks: [4, 5, 6, 8] | Blocked by: []

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `package.json:6` - scripts exist but no test script exists yet.
  - Pattern:  `.gitignore:13` - `.tmp-cardnews-test` is already ignored.
  - Pattern:  `.gitignore:31` - generated artifact ignore style to extend with `evidence/`.
  - API/Type: `src/creationFlow.ts:1` - current flow types and step exports.
  - API/Type: `src/creationFlow.ts:32` - automatic six-step labels already exist.
  - API/Type: `src/creationFlow.ts:41` - direct flow currently needs narrowing to start/edit/preview.
  - Test:     `src/creationFlow.test.ts:9` - auto label assertion.
  - Test:     `src/creationFlow.test.ts:16` - direct label/no-AI assertion.
  - Test:     `src/cardNewsDraft.test.ts:1` - local `node:test` style to follow.
  - External: `https://nodejs.org/api/test.html` - `node --test` and `--test-name-pattern`.

  Acceptance criteria (agent-executable only):
  - [ ] `mkdir -p evidence && git status --short > evidence/task-1-dirty-baseline.txt` captures the dirty baseline.
  - [ ] `npm run test:cardnews:compile > evidence/task-1-compile.txt 2>&1` exits 0.
  - [ ] `npm run test:cardnews > evidence/task-1-tests.txt 2>&1` exits 0.
  - [ ] `node --test .tmp-cardnews-test/creationFlow.test.js --test-name-pattern "AUTO_CREATION_FLOW_STEPS" > evidence/task-1-auto-flow.txt 2>&1` exits 0.
  - [ ] `node --test .tmp-cardnews-test/creationFlow.test.js --test-name-pattern "DIRECT_CREATION_FLOW_STEPS" > evidence/task-1-direct-flow.txt 2>&1` exits 0.
  - [ ] `git status --short > evidence/task-1-status.txt` does not list `.tmp-cardnews-test/` or `evidence/`.

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: flow contract tests pass
    Tool:     bash
    Steps:    mkdir -p evidence && npm run test:cardnews > evidence/task-1-tests.txt 2>&1
    Expected: Command exits 0 and includes passing `creationFlow` and `cardNewsDraft` tests.
    Evidence: evidence/task-1-tests.txt

  Scenario: generated evidence stays ignored
    Tool:     bash
    Steps:    git status --short > evidence/task-1-status.txt
    Expected: Output does not contain `.tmp-cardnews-test/` or `evidence/`.
    Evidence: evidence/task-1-status.txt
  ```

  Commit: YES | Message: `test(cardnews): lock creation flow contracts` | Files: [`package.json`, `.gitignore`, `src/creationFlow.ts`, `src/creationFlow.test.ts`]

- [ ] 2. Add browser verification CLI for port 4179

  What to do: Add `scripts/verify-cardnews-flow.mjs` using `playwright-core` and add `verify:cardnews-flow` to `package.json`. Support `--url`, `--scenario`, `--topic`, `--direct`, `--evidence-dir`, `--screenshot`, and `--downloads-dir`. Required scenarios: `auto-stepper`, `auto-empty-topic`, `auto-happy`, `auto-download`, `direct-isolated`, `direct-edit-preview`, `persistence-reload`, and `mobile`. Default URL must be `http://127.0.0.1:4179`.
  Must NOT do: Do not hard-code the production Vercel URL. Do not use a persistent browser profile. Do not assert hidden `.legacy-composer` text.

  Parallelization: Can parallel: YES | Wave 1 | Blocks: [4, 5, 6, 7, 8] | Blocked by: []

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `scripts/capture-store-screenshots.mjs:4` - Playwright Core import pattern.
  - Pattern:  `scripts/capture-store-screenshots.mjs:9` - URL/env default pattern.
  - Pattern:  `scripts/capture-store-screenshots.mjs:11` - local Chrome executable path pattern.
  - Pattern:  `scripts/capture-store-screenshots.mjs:22` - viewport setup pattern.
  - Pattern:  `scripts/record-iran-cardnews.mjs:18` - type helper for human-like input.
  - Pattern:  `scripts/record-iran-cardnews.mjs:35` - acceptDownloads browser context option.
  - Pattern:  `scripts/record-iran-cardnews.mjs:147` - slide-card locator pattern.
  - External: `https://playwright.dev/docs/api/class-page#page-screenshot` - screenshot API and path option.

  Acceptance criteria (agent-executable only):
  - [ ] `node scripts/verify-cardnews-flow.mjs --help > evidence/task-2-help.txt 2>&1` exits 0 and lists all required scenarios plus `--direct`.
  - [ ] `npm run verify:cardnews-flow -- --url http://127.0.0.1:9 --scenario auto-stepper > evidence/task-2-invalid-url.txt 2>&1` exits nonzero and prints `Unable to open Cardstudio URL`.
  - [ ] The script creates the evidence directory passed by `--evidence-dir` before writing screenshots or text logs.
  - [ ] The script uses `CHROME_PATH` when provided and otherwise falls back to `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`.

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: verifier help documents scenarios
    Tool:     bash
    Steps:    mkdir -p evidence && node scripts/verify-cardnews-flow.mjs --help > evidence/task-2-help.txt 2>&1
    Expected: Command exits 0 and output contains `auto-stepper`, `direct-isolated`, `persistence-reload`, `mobile`, and `--direct`.
    Evidence: evidence/task-2-help.txt

  Scenario: verifier fails clearly when app is unavailable
    Tool:     bash
    Steps:    npm run verify:cardnews-flow -- --url http://127.0.0.1:9 --scenario auto-stepper > evidence/task-2-invalid-url.txt 2>&1
    Expected: Command exits nonzero and output contains `Unable to open Cardstudio URL`.
    Evidence: evidence/task-2-invalid-url.txt
  ```

  Commit: YES | Message: `test(cardnews): add flow browser verifier` | Files: [`scripts/verify-cardnews-flow.mjs`, `package.json`]

- [ ] 3. Apply orange token foundation to the creation UI

  What to do: Replace blue primary creation UI tokens with orange accent tokens while preserving the existing result-rendering themes unless a direct visual conflict appears. Use `#dd5e31` as primary, `#f46f30` as hover/strong accent, `#ffcf9a` as soft accent, `#241914` as main text, and warm borders already used in `docs/ui-ux-redesign-summary.md:148`. Set `topicAccentColor` initial state to orange. Make the six-step stepper fit desktop and mobile without text overlap.
  Must NOT do: Do not create a one-color orange-only page; keep white/neutral surfaces and existing output cards readable. Do not modify generated PNG export dimensions.

  Parallelization: Can parallel: YES | Wave 1 | Blocks: [4, 5, 6, 8] | Blocked by: []

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `docs/ui-ux-redesign-summary.md:148` - existing Ember palette values to preserve.
  - Pattern:  `src/App.css:1` - current blue token definitions.
  - Pattern:  `src/App.css:43` - app shell uses blue radial/shadow values.
  - Pattern:  `src/App.css:325` - active creation tab currently uses blue.
  - Pattern:  `src/App.css:337` - stepper currently fixed to four columns.
  - Pattern:  `src/App.css:475` - active style option currently uses blue.
  - Pattern:  `src/App.css:506` - brand upload button currently uses blue.
  - Pattern:  `src/App.css:2423` - fixed bottom bar polish area.
  - Pattern:  `src/index.css:30` - body background already contains orange and blue radials.

  Acceptance criteria (agent-executable only):
  - [ ] `npx tsc --noEmit -p tsconfig.app.json > evidence/task-3-typecheck.txt 2>&1` exits 0.
  - [ ] `npm run lint > evidence/task-3-lint.txt 2>&1` exits 0.
  - [ ] `node -e "const fs=require('fs'); const css=fs.readFileSync('src/App.css','utf8'); if(!css.includes('#dd5e31')) throw new Error('missing orange primary'); if(/--color-primary-blue:\\s*#1868db/.test(css)) throw new Error('blue primary token still active');" > evidence/task-3-token-check.txt 2>&1` exits 0.
  - [ ] `CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm run verify:cardnews-flow -- --url http://127.0.0.1:4179 --scenario mobile --evidence-dir evidence --screenshot task-3-mobile.png > evidence/task-3-mobile.txt 2>&1` exits 0 after starting the dev server.

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: orange tokens replace blue creation controls
    Tool:     bash
    Steps:    mkdir -p evidence && node -e "const fs=require('fs'); const css=fs.readFileSync('src/App.css','utf8'); if(!css.includes('#dd5e31')) throw new Error('missing orange primary'); if(/--color-primary-blue:\s*#1868db/.test(css)) throw new Error('blue primary token still active');" > evidence/task-3-token-check.txt 2>&1
    Expected: Command exits 0.
    Evidence: evidence/task-3-token-check.txt

  Scenario: mobile creation UI has no horizontal overflow
    Tool:     playwright(real Chrome)
    Steps:    mkdir -p evidence
              npm run dev:web -- --host 127.0.0.1 --port 4179 --strictPort > evidence/task-3-vite.log 2>&1 &
              DEV_PID=$!
              for i in {1..30}; do curl -fsS http://127.0.0.1:4179 >/dev/null && break; sleep 1; done
              CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm run verify:cardnews-flow -- --url http://127.0.0.1:4179 --scenario mobile --evidence-dir evidence --screenshot task-3-mobile.png > evidence/task-3-mobile.txt 2>&1
              kill $DEV_PID
    Expected: Verifier exits 0 and screenshot shows the creation UI within a 390x844 viewport without horizontal overflow.
    Evidence: evidence/task-3-mobile.txt
  ```

  Commit: YES | Message: `style(cardnews): apply orange creation tokens` | Files: [`src/App.css`, `src/index.css`, `src/App.tsx`]

- [ ] 4. Finish automatic six-step flow rendering and gating

  What to do: Wire `AUTO_CREATION_FLOW_STEPS` through the rendered stepper and make all six steps first-class. Step 1 accepts topic; Step 2 selects style; Step 3 configures brand/logo/color/character; Step 4 is an explicit `AI 생성` screen with a clear generate action; Step 5 is `편집`; Step 6 is `다운로드`. Fix disabled-state logic so Step 5/6 are unavailable until slides exist, while Step 1-4 navigation still follows topic gating.
  Must NOT do: Do not collapse Step 4/5/6 into a single completion screen. Do not show direct-mode controls in the automatic panel.

  Parallelization: Can parallel: YES | Wave 2 | Blocks: [5, 7, 8] | Blocked by: [1, 2, 3]

  References (executor has NO interview context - be exhaustive):
  - API/Type: `src/creationFlow.ts:32` - exact auto flow labels.
  - Pattern:  `src/App.tsx:417` - `creationMode` state.
  - Pattern:  `src/App.tsx:418` - `autoStep` uses `AutoWizardStepId`.
  - Pattern:  `src/App.tsx:460` - topic gating uses trimmed topic.
  - Pattern:  `src/App.tsx:911` - current step guard logic.
  - Pattern:  `src/App.tsx:1178` - stepper renders from `AUTO_CREATION_FLOW_STEPS`.
  - Pattern:  `src/App.tsx:1193` - Step 1 topic screen.
  - Pattern:  `src/App.tsx:1361` - Step 4 AI generation screen.
  - Pattern:  `src/App.tsx:1375` - Step 5 edit screen.
  - Pattern:  `src/App.tsx:1410` - Step 6 download screen.
  - External: `https://react.dev/learn/conditional-rendering` - conditional panel rendering.

  Acceptance criteria (agent-executable only):
  - [ ] `npm run test:cardnews > evidence/task-4-tests.txt 2>&1` exits 0.
  - [ ] `npx tsc --noEmit -p tsconfig.app.json > evidence/task-4-typecheck.txt 2>&1` exits 0.
  - [ ] Browser QA `auto-stepper` sees exactly the six Korean labels in order.
  - [ ] Browser QA `auto-empty-topic` stays on Step 1, shows `먼저 만들고 싶은 카드뉴스 주제를 입력해주세요.`, and has zero slide rail cards.
  - [ ] Browser QA confirms Step 5 and Step 6 controls are disabled or inaccessible before generation.

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: automatic stepper shows six exact labels
    Tool:     playwright(real Chrome)
    Steps:    mkdir -p evidence
              npm run dev:web -- --host 127.0.0.1 --port 4179 --strictPort > evidence/task-4-vite.log 2>&1 &
              DEV_PID=$!
              for i in {1..30}; do curl -fsS http://127.0.0.1:4179 >/dev/null && break; sleep 1; done
              CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm run verify:cardnews-flow -- --url http://127.0.0.1:4179 --scenario auto-stepper --evidence-dir evidence --screenshot task-4-auto-stepper.png > evidence/task-4-auto-stepper.txt 2>&1
              kill $DEV_PID
    Expected: Verifier exits 0 and finds `주제 입력`, `스타일 선택`, `브랜드 설정`, `AI 생성`, `편집`, `다운로드` in visible order.
    Evidence: evidence/task-4-auto-stepper.txt

  Scenario: empty topic blocks progression
    Tool:     playwright(real Chrome)
    Steps:    mkdir -p evidence
              npm run dev:web -- --host 127.0.0.1 --port 4179 --strictPort > evidence/task-4-empty-vite.log 2>&1 &
              DEV_PID=$!
              for i in {1..30}; do curl -fsS http://127.0.0.1:4179 >/dev/null && break; sleep 1; done
              CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm run verify:cardnews-flow -- --url http://127.0.0.1:4179 --scenario auto-empty-topic --evidence-dir evidence --screenshot task-4-empty-topic.png > evidence/task-4-empty-topic.txt 2>&1
              kill $DEV_PID
    Expected: Verifier exits 0, remains on Step 1, shows the Korean validation message, and does not create slides.
    Evidence: evidence/task-4-empty-topic.txt
  ```

  Commit: YES | Message: `feat(cardnews): render six step automatic flow` | Files: [`src/App.tsx`, `src/App.css`, `scripts/verify-cardnews-flow.mjs`]

- [ ] 5. Finish automatic generation, edit handoff, and download step

  What to do: Keep `createTopicDraft` local and deterministic. It must pass `{ accentColor: topicAccentColor, brandName, slideCount: 8, style: draftStyle }`, create exactly 8 slides, set active slide, move to Step 5, and show edit/download controls. `편집 시작` must scroll to the editor, and `다운로드 보기` must move to Step 6 and open the existing preview/export modal. Keep generated slide export compatibility.
  Must NOT do: Do not generate 9 cards in the UI. Do not call any external AI service. Do not change `html-to-image` export dimensions.

  Parallelization: Can parallel: YES | Wave 2 | Blocks: [7, 8] | Blocked by: [1, 2, 3, 4]

  References (executor has NO interview context - be exhaustive):
  - API/Type: `src/cardNewsDraft.ts:40` - generator options include accent, brand, slideCount, style.
  - API/Type: `src/cardNewsDraft.ts:53` - generator entry point.
  - Pattern:  `src/App.tsx:887` - current `createTopicDraft` call site and options.
  - Pattern:  `src/App.tsx:906` - post-generation `setAutoStep(5)`.
  - Pattern:  `src/App.tsx:962` - `openGeneratedEditor`.
  - Pattern:  `src/App.tsx:970` - `openDownloadPreview`.
  - Pattern:  `src/App.tsx:1375` - Step 5 edit UI.
  - Pattern:  `src/App.tsx:1410` - Step 6 download UI.
  - Pattern:  `src/App.tsx:2193` - fixed bottom preview/save bar.
  - Pattern:  `src/App.tsx:2211` - preview/export modal.
  - Test:     `src/cardNewsDraft.test.ts:54` - 8-card style test.

  Acceptance criteria (agent-executable only):
  - [ ] `npm run test:cardnews > evidence/task-5-tests.txt 2>&1` exits 0.
  - [ ] `npx tsc --noEmit -p tsconfig.app.json > evidence/task-5-typecheck.txt 2>&1` exits 0.
  - [ ] Browser QA `auto-happy --topic "AI 마케팅"` generates exactly 8 visible generated-card buttons and generated text contains `AI 마케팅`.
  - [ ] Browser QA `auto-download` opens `결과보기 및 저장`, sees `전체 PNG 저장` enabled, and captures nonblank preview screenshot.
  - [ ] `node -e "const fs=require('fs'); const s=fs.readFileSync('src/App.tsx','utf8'); if(!/slideCount:\\s*8/.test(s)) throw new Error('UI generation must request 8 slides'); if(/fetch\\(|XMLHttpRequest|openai|gemini/i.test(s)) throw new Error('unexpected network generation');" > evidence/task-5-local-generation.txt 2>&1` exits 0.

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: automatic generation creates 8 editable cards
    Tool:     playwright(real Chrome)
    Steps:    mkdir -p evidence
              npm run dev:web -- --host 127.0.0.1 --port 4179 --strictPort > evidence/task-5-vite.log 2>&1 &
              DEV_PID=$!
              for i in {1..30}; do curl -fsS http://127.0.0.1:4179 >/dev/null && break; sleep 1; done
              CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm run verify:cardnews-flow -- --url http://127.0.0.1:4179 --scenario auto-happy --topic "AI 마케팅" --evidence-dir evidence --screenshot task-5-auto-happy.png > evidence/task-5-auto-happy.txt 2>&1
              kill $DEV_PID
    Expected: Verifier exits 0, finds exactly 8 generated cards, topic text, selected style output, and edit controls.
    Evidence: evidence/task-5-auto-happy.txt

  Scenario: automatic download step opens export preview
    Tool:     playwright(real Chrome)
    Steps:    mkdir -p evidence
              npm run dev:web -- --host 127.0.0.1 --port 4179 --strictPort > evidence/task-5-download-vite.log 2>&1 &
              DEV_PID=$!
              for i in {1..30}; do curl -fsS http://127.0.0.1:4179 >/dev/null && break; sleep 1; done
              CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm run verify:cardnews-flow -- --url http://127.0.0.1:4179 --scenario auto-download --topic "AI 마케팅" --evidence-dir evidence --screenshot task-5-auto-download.png > evidence/task-5-auto-download.txt 2>&1
              kill $DEV_PID
    Expected: Verifier exits 0, reaches Step 6, opens `결과보기 및 저장`, and sees enabled `전체 PNG 저장`.
    Evidence: evidence/task-5-auto-download.txt
  ```

  Commit: YES | Message: `feat(cardnews): complete automatic generate edit download flow` | Files: [`src/App.tsx`, `src/cardNewsDraft.ts`, `src/cardNewsDraft.test.ts`, `scripts/verify-cardnews-flow.mjs`]

- [ ] 6. Build direct start/edit/preview path with AI hidden

  What to do: Update direct mode so it is visibly separate from automatic mode. It must render direct stages `시작`, `편집`, `미리보기`, expose no visible `AI` copy, and let users add a card, edit title/body/image, preview it, and export through the existing modal. For manual editing, hide advanced automatic/editor controls that are not title/body/image while `creationMode === 'manual'` unless they are required for export correctness. If image replacement is added, use existing `optimizeLocalImage` and file-input intent handling.
  Must NOT do: Do not call `generateCardNewsDraft` from direct mode. Do not show topic/style/brand/logo/color/generator controls in direct mode. Do not use hidden text assertions for pass/fail.

  Parallelization: Can parallel: YES | Wave 2 | Blocks: [7, 8] | Blocked by: [1, 2, 3]

  References (executor has NO interview context - be exhaustive):
  - API/Type: `src/creationFlow.ts:41` - direct flow labels source of truth.
  - Pattern:  `src/App.tsx:430` - `manualSlideIds` filters direct cards.
  - Pattern:  `src/App.tsx:933` - `createManualCard` creates direct cards.
  - Pattern:  `src/App.tsx:1439` - current direct panel root.
  - Pattern:  `src/App.tsx:1443` - currently visible `AI` copy to remove or replace.
  - Pattern:  `src/App.tsx:1458` - direct stage list render.
  - Pattern:  `src/App.tsx:1468` - direct card list.
  - Pattern:  `src/App.tsx:1969` - active slide editor.
  - Pattern:  `src/App.tsx:2108` - title/body fields already exist.
  - Pattern:  `src/App.tsx:2193` - fixed preview/save bar.
  - External: `https://react.dev/reference/react-dom/components/input` - controlled direct title/body/image controls.

  Acceptance criteria (agent-executable only):
  - [ ] `npx tsc --noEmit -p tsconfig.app.json > evidence/task-6-typecheck.txt 2>&1` exits 0.
  - [ ] Browser QA `direct-isolated` confirms direct mode shows `시작`, `편집`, `미리보기` and no visible `AI`, `주제 입력`, `스타일 선택`, `브랜드 설정`, `AI 생성`, or `AI 초안 생성 시작`.
  - [ ] Browser QA `direct-edit-preview` adds two cards, edits one title to `직접 만든 카드 제목`, edits body to `직접 작성한 본문`, opens preview, and sees the edited text in preview.
  - [ ] `node -e "const fs=require('fs'); const s=fs.readFileSync('src/App.tsx','utf8'); const manual=s.slice(s.indexOf('creationMode === \\'auto\\'')); if(/generateCardNewsDraft\\(/.test(manual.split('createManualCard')[0])) throw new Error('manual render calls generator');" > evidence/task-6-no-generator.txt 2>&1` exits 0.

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: direct mode has no AI controls
    Tool:     playwright(real Chrome)
    Steps:    mkdir -p evidence
              npm run dev:web -- --host 127.0.0.1 --port 4179 --strictPort > evidence/task-6-vite.log 2>&1 &
              DEV_PID=$!
              for i in {1..30}; do curl -fsS http://127.0.0.1:4179 >/dev/null && break; sleep 1; done
              CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm run verify:cardnews-flow -- --url http://127.0.0.1:4179 --scenario direct-isolated --evidence-dir evidence --screenshot task-6-direct-isolated.png > evidence/task-6-direct-isolated.txt 2>&1
              kill $DEV_PID
    Expected: Verifier exits 0, direct mode shows only direct stages and no visible AI/auto controls.
    Evidence: evidence/task-6-direct-isolated.txt

  Scenario: direct card edit appears in preview
    Tool:     playwright(real Chrome)
    Steps:    mkdir -p evidence
              npm run dev:web -- --host 127.0.0.1 --port 4179 --strictPort > evidence/task-6-preview-vite.log 2>&1 &
              DEV_PID=$!
              for i in {1..30}; do curl -fsS http://127.0.0.1:4179 >/dev/null && break; sleep 1; done
              CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm run verify:cardnews-flow -- --url http://127.0.0.1:4179 --scenario direct-edit-preview --evidence-dir evidence --screenshot task-6-direct-preview.png > evidence/task-6-direct-preview.txt 2>&1
              kill $DEV_PID
    Expected: Verifier exits 0, adds two direct cards, edits title/body, opens preview, and sees edited text.
    Evidence: evidence/task-6-direct-preview.txt
  ```

  Commit: YES | Message: `feat(cardnews): add direct edit preview flow` | Files: [`src/creationFlow.ts`, `src/creationFlow.test.ts`, `src/App.tsx`, `src/App.css`, `scripts/verify-cardnews-flow.mjs`]

- [ ] 7. Persist/restore mode metadata and verify export preview

  What to do: Extend `ProjectDraft` minimally with `creationMode`, `autoStep`, and `manualSlideIds` or an equivalent slide metadata strategy. Persist enough metadata to restore auto drafts into the automatic flow and direct drafts into the direct flow. Fix icon persistence by using durable data URLs for the icon upload path instead of `URL.createObjectURL`. Keep `loadDraftValue`/`saveDraftValue` as the only persistence API.
  Must NOT do: Do not add DB/storage SDKs or write to any server. Do not remove existing generated slide restore behavior without replacing it.

  Parallelization: Can parallel: NO | Wave 3 | Blocks: [8] | Blocked by: [4, 5, 6]

  References (executor has NO interview context - be exhaustive):
  - API/Type: `src/App.tsx:50` - current `ProjectDraft` shape lacks creation metadata.
  - Pattern:  `src/App.tsx:552` - autosave effect.
  - Pattern:  `src/App.tsx:558` - current persisted payload.
  - Pattern:  `src/App.tsx:616` - restore function.
  - Pattern:  `src/App.tsx:699` - current restore filters only generated slides.
  - Pattern:  `src/App.tsx:731` - icon upload currently stores an object URL.
  - API/Type: `src/lib/appsInToss.ts:32` - `optimizeLocalImage` returns durable image data.
  - API/Type: `src/lib/appsInToss.ts:44` - draft load via AppsInToss/native with localStorage fallback.
  - API/Type: `src/lib/appsInToss.ts:60` - draft save via existing wrapper.
  - API/Type: `src/lib/appsInToss.ts:97` - localStorage fallback.

  Acceptance criteria (agent-executable only):
  - [ ] `npx tsc --noEmit -p tsconfig.app.json > evidence/task-7-typecheck.txt 2>&1` exits 0.
  - [ ] Browser QA `persistence-reload` proves an auto 8-card draft reloads into automatic mode with Step 5 or Step 6 reachable.
  - [ ] Browser QA `persistence-reload --direct` proves direct cards reload into direct mode with direct card list intact.
  - [ ] Browser QA opens `결과보기 및 저장` after reload and sees `전체 PNG 저장` enabled.
  - [ ] `node -e "const fs=require('fs'); const s=fs.readFileSync('src/App.tsx','utf8'); if(/URL\\.createObjectURL\\(firstImage\\)/.test(s)) throw new Error('icon upload still uses object URL'); if(/indexedDB|firebase|supabase|postgres|prisma/i.test(s)) throw new Error('unexpected DB/storage addition');" > evidence/task-7-local-storage-only.txt 2>&1` exits 0.

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: automatic draft restores after reload
    Tool:     playwright(real Chrome)
    Steps:    mkdir -p evidence
              npm run dev:web -- --host 127.0.0.1 --port 4179 --strictPort > evidence/task-7-vite.log 2>&1 &
              DEV_PID=$!
              for i in {1..30}; do curl -fsS http://127.0.0.1:4179 >/dev/null && break; sleep 1; done
              CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm run verify:cardnews-flow -- --url http://127.0.0.1:4179 --scenario persistence-reload --topic "AI 업무 자동화" --evidence-dir evidence --screenshot task-7-auto-reload.png > evidence/task-7-auto-reload.txt 2>&1
              kill $DEV_PID
    Expected: Verifier exits 0, reloads the page, sees automatic mode restored with 8 cards, and export preview enabled.
    Evidence: evidence/task-7-auto-reload.txt

  Scenario: direct draft restores after reload
    Tool:     playwright(real Chrome)
    Steps:    mkdir -p evidence
              npm run dev:web -- --host 127.0.0.1 --port 4179 --strictPort > evidence/task-7-direct-vite.log 2>&1 &
              DEV_PID=$!
              for i in {1..30}; do curl -fsS http://127.0.0.1:4179 >/dev/null && break; sleep 1; done
              CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm run verify:cardnews-flow -- --url http://127.0.0.1:4179 --scenario persistence-reload --direct --evidence-dir evidence --screenshot task-7-direct-reload.png > evidence/task-7-direct-reload.txt 2>&1
              kill $DEV_PID
    Expected: Verifier exits 0, reloads the page, sees direct mode restored, and direct card list remains visible.
    Evidence: evidence/task-7-direct-reload.txt
  ```

  Commit: YES | Message: `feat(cardnews): persist creation flow state` | Files: [`src/App.tsx`, `scripts/verify-cardnews-flow.mjs`]

- [ ] 8. Update docs and run final integration checks

  What to do: Update `README.md` with the two creation flows, local-only generation/storage note, test commands, and the required `127.0.0.1:4179` QA command. Run the full verification set from clean evidence. Confirm no generated outputs are tracked.
  Must NOT do: Do not commit `evidence/`, `.tmp-cardnews-test/`, screenshots, videos, downloaded PNGs, or `dist/`.

  Parallelization: Can parallel: NO | Wave 3 | Blocks: [] | Blocked by: [1, 2, 3, 4, 5, 6, 7]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `README.md:20` - current run docs.
  - Pattern:  `README.md:50` - current MVP scope docs.
  - Pattern:  `package.json:10` - build script.
  - Pattern:  `package.json:13` - preview script.
  - Pattern:  `vite.config.ts:11` - Vite config reference.
  - External: `https://vite.dev/guide/cli` - preview requires a current build and supports host/port/strictPort.

  Acceptance criteria (agent-executable only):
  - [ ] `npm run test:cardnews > evidence/task-8-cardnews-tests.txt 2>&1` exits 0.
  - [ ] `npx tsc --noEmit -p tsconfig.app.json > evidence/task-8-typecheck.txt 2>&1` exits 0.
  - [ ] `npm run lint > evidence/task-8-lint.txt 2>&1` exits 0.
  - [ ] `npm run build:web > evidence/task-8-build-web.txt 2>&1` exits 0.
  - [ ] `npm run preview -- --host 127.0.0.1 --port 4179 --strictPort` serves the built app and all verifier scenarios pass against `http://127.0.0.1:4179`.
  - [ ] `git status --short > evidence/task-8-status.txt` shows no tracked `evidence/`, `.tmp-cardnews-test/`, `dist/`, screenshots, recordings, or downloaded PNGs.

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: production preview passes core flows
    Tool:     playwright(real Chrome)
    Steps:    mkdir -p evidence
              npm run build:web > evidence/task-8-build-web.txt 2>&1
              npm run preview -- --host 127.0.0.1 --port 4179 --strictPort > evidence/task-8-preview.log 2>&1 &
              PREVIEW_PID=$!
              for i in {1..30}; do curl -fsS http://127.0.0.1:4179 >/dev/null && break; sleep 1; done
              CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm run verify:cardnews-flow -- --url http://127.0.0.1:4179 --scenario auto-happy --topic "AI 마케팅" --evidence-dir evidence --screenshot task-8-auto.png > evidence/task-8-auto.txt 2>&1
              CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm run verify:cardnews-flow -- --url http://127.0.0.1:4179 --scenario direct-edit-preview --evidence-dir evidence --screenshot task-8-direct.png > evidence/task-8-direct.txt 2>&1
              kill $PREVIEW_PID
    Expected: Build exits 0; preview serves on 4179; both verifier scenarios exit 0.
    Evidence: evidence/task-8-auto.txt

  Scenario: repository is clean of generated outputs
    Tool:     bash
    Steps:    git status --short > evidence/task-8-status.txt
    Expected: Output contains intended source/docs changes only and no `evidence/`, `.tmp-cardnews-test/`, `dist/`, screenshots, recordings, or downloaded PNGs.
    Evidence: evidence/task-8-status.txt
  ```

  Commit: YES | Message: `docs(cardnews): document two flow verification` | Files: [`README.md`]

## Final verification wave (MANDATORY - after all implementation tasks)
> Runs in PARALLEL. ALL must APPROVE. Surface results to the caller and wait for an explicit "okay" before declaring complete.
- [ ] F1. Plan compliance audit - every task done, every acceptance criterion met
- [ ] F2. Code quality review - diagnostics clean, idioms match, no dead code
- [ ] F3. Real manual QA - every QA scenario executed with evidence captured
- [ ] F4. Scope fidelity - nothing extra shipped beyond Must-Have, nothing Must-NOT-Have introduced

## Commit strategy
- One logical change per commit. Conventional Commits (`<type>(<scope>): <subject>` body + footer).
- Atomic: every commit builds and passes tests on its own.
- No "WIP" / "fix typo squash later" commits on the final branch - clean up before merge.
- Reference the plan file path in the final commit footer: `Plan: plans/flow-redesign-implementation.md`.

## Success criteria
- All Must-Have shipped; all QA scenarios pass with captured evidence; F1-F4 approved; commit history clean.

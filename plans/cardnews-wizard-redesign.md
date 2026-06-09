# Cardnews Wizard Redesign

## TL;DR
> Summary:      Redesign the studio into a Korean two-tab creation flow with a top `카드뉴스 만들기` card, a progressive automatic wizard, and a separate direct builder that exposes only card title/body/image controls.
> Deliverables:
> - `자동 생성` / `직접 생성` tabs in the first creation card
> - Automatic flow: topic -> style -> brand/logo/color -> generated 8-card result with editing controls
> - Direct flow: `+ 카드 추가` plus per-card title/body/image fields, with all AI/auto options hidden
> - Shared card model, extracted components, deterministic tests, and Chrome-driven QA evidence
> - Visual system using the requested tokens: `#1868db`, `#1c2b42`, `#ffffff`, `#f8f8f8`, `#e9f2fe`
> Effort:       Large
> Risk:         High - the main UI is an oversized dirty `src/App.tsx`/`src/App.css` surface with partial wizard scaffolding already present.

## Scope
### Must have
- Preserve current dirty work. `git status --short` currently shows modified `.gitignore`, `src/App.css`, `src/App.tsx`, `tsconfig.app.json`, and untracked `plans/`, `artifacts/ulw/`, `src/cardNewsDraft.ts`, `src/cardNewsDraft.test.ts`, `tsconfig.cardnews-test.json`.
- Replace the first-viewport creation area at `src/App.tsx:1031` with a compact top card titled `카드뉴스 만들기`.
- Add two visible tabs labeled exactly `자동 생성` and `직접 생성`; tab state should use or finish the existing `CreationMode = 'auto' | 'manual'` at `src/App.tsx:93`.
- Automatic flow must be progressive: topic, then style, then brand/logo/color, then generate exactly 8 cards and reveal editing options only after generation.
- Automatic generation must use the existing generator options in `src/cardNewsDraft.ts:40` and call with `slideCount: 8` plus the selected `style`.
- Direct flow must be separate from auto flow and show only `+ 카드 추가`, card title, card body, and card image controls.
- Direct flow must hide topic, style, brand/logo/color, generator, AI, template, mode, layout, and advanced editing options.
- Existing preview/export behavior must continue through `SlideCanvas` and the hidden export root at `src/App.tsx:1874`.
- Existing AppsInToss/localStorage persistence helpers in `src/lib/appsInToss.ts:44` and PNG saving in `src/lib/appsInToss.ts:78` must keep working.
- UI copy must be Korean for the creation flow.

### Must NOT have (guardrails, anti-slop, scope boundaries)
- Do not add an LLM, backend API, network generation call, or new paid service.
- Do not revert uncommitted user work unless a later executor proves a file is generated debris and records the reason.
- Do not keep adding major TSX to the current 2,870-line `src/App.tsx`; split touched TS/TSX into cohesive modules first.
- Do not expose AI/auto controls in the `직접 생성` tab, including hidden-but-visible disabled cards.
- Do not remove existing image upload, preview, draft restore, App Store rendering, ad-gated export fallback, or PNG export flows unless explicitly replaced with equivalent behavior.
- Do not make a marketing landing page; the first screen is the usable creation experience.
- Do not leave generated evidence, `.tmp-cardnews-test/`, downloaded PNGs, screenshots, or recordings tracked.

## Verification strategy
> Zero human intervention - all verification is agent-executed.
- Test decision: TDD + Node `node:test` for generator/state helpers, TypeScript `tsc --noEmit`, ESLint, Vite build, and Playwright Core with real Chrome for UI flows.
- QA policy: every task has agent-executed scenarios
- Evidence: `evidence/task-<N>-<slug>.<ext>`
- Browser policy: use Chrome at `CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"` via Playwright Core. If Chrome is unavailable, use `agent-browser` with the same URL and selectors.
- External references:
  - `https://react.dev/reference/react-dom/components/input` - controlled inputs require `value` plus synchronous `onChange`; labels are important for accessibility.
  - `https://react.dev/learn/conditional-rendering` - render tab/wizard panels conditionally from React state.
  - `https://vite.dev/guide/cli` - `vite`, `vite build`, and `vite preview` command behavior.
  - `https://playwright.dev/docs/api/class-page#page-screenshot` - screenshot capture API.
  - `https://playwright.dev/docs/test-assertions` - retrying locator assertions and screenshot assertions.

## Execution strategy
### Parallel execution waves
> Target 5-8 tasks per wave. <3 per wave (except final) = under-splitting.
> Extract shared dependencies as Wave-1 tasks to maximize parallelism.

Wave 1 (no dependencies):
- Task 1: Add test/evidence harness and dirty-work guard
- Task 2: Lock the 8-card generator contract
- Task 3: Add browser verification CLI
- Task 4: Split the App monolith into focused modules
- Task 5: Install the requested visual token foundation

Wave 2 (after Wave 1):
- Task 6: depends [4, 5] - Build the top creation card and mode tabs
- Task 7: depends [2, 3, 4, 5, 6] - Complete the automatic progressive wizard
- Task 8: depends [3, 4, 5, 6] - Complete the direct manual builder

Wave 3 (after Wave 2):
- Task 9: depends [1, 2, 3, 4, 5, 6, 7, 8] - Integrate persistence, export, responsive polish, and docs cleanup

Critical path: Task 4 -> Task 6 -> Task 7 -> Task 9

### Dependency matrix
| Task | Depends on | Blocks | Can parallelize with |
|------|------------|--------|----------------------|
| 1    | none       | 9      | 2, 3, 4, 5           |
| 2    | none       | 7, 9   | 1, 3, 4, 5           |
| 3    | none       | 7, 8, 9 | 1, 2, 4, 5          |
| 4    | none       | 6, 7, 8, 9 | 1, 2, 3, 5       |
| 5    | none       | 6, 7, 8, 9 | 1, 2, 3, 4       |
| 6    | 4, 5       | 7, 8, 9 | none                |
| 7    | 2, 3, 4, 5, 6 | 9   | 8                    |
| 8    | 3, 4, 5, 6 | 9      | 7                    |
| 9    | 1, 2, 3, 4, 5, 6, 7, 8 | none | none     |

## Todos
> Implementation + Test = ONE task. Never separate.
> Every task MUST have: References + Acceptance Criteria + QA Scenarios + Commit.

- [ ] 1. Add test/evidence harness and dirty-work guard

  What to do: Record the pre-edit dirty baseline, add `evidence/` to `.gitignore`, and add package scripts for the existing generator test config: `test:cardnews:compile` as `tsc -p tsconfig.cardnews-test.json` and `test:cardnews` as compile plus `node --test .tmp-cardnews-test/cardNewsDraft.test.js`. Keep `.tmp-cardnews-test` ignored. Do not remove existing untracked plans or artifacts.
  Must NOT do: Do not install Vitest, Jest, React Testing Library, or any new dependency in this task. Do not modify product UI.

  Parallelization: Can parallel: YES | Wave 1 | Blocks: [9] | Blocked by: []

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `package.json:6` - scripts object currently has dev/build/lint but no test script.
  - Pattern:  `.gitignore:13` - `.tmp-cardnews-test` is already ignored.
  - Pattern:  `.gitignore:31` - existing generated artifact ignore style.
  - Test:     `tsconfig.cardnews-test.json:1` - existing NodeNext test compile config.
  - Test:     `src/cardNewsDraft.test.ts:1` - existing `node:test` style.
  - External: `https://nodejs.org/api/test.html` - Node test runner reference.

  Acceptance criteria (agent-executable only):
  - [ ] `mkdir -p evidence && git status --short > evidence/task-1-dirty-baseline.txt` captures the dirty baseline.
  - [ ] `npm run test:cardnews:compile > evidence/task-1-compile.txt 2>&1` exits 0.
  - [ ] `npm run test:cardnews > evidence/task-1-test.txt 2>&1` exits 0.
  - [ ] `git status --short > evidence/task-1-status-after.txt` output does not include `.tmp-cardnews-test/` or `evidence/`.

  QA scenarios (MANDATORY - task incomplete without these):
  > Name the exact tool AND its exact invocation - not "verify it works". Browser use: use Chrome to drive the page; if Chrome is not available, download and use agent-browser (https://github.com/vercel-labs/agent-browser). Computer use: OS-level GUI automation for a non-browser desktop app.
  ```
  Scenario: test harness compiles
    Tool:     bash
    Steps:    mkdir -p evidence && npm run test:cardnews:compile > evidence/task-1-compile.txt 2>&1
    Expected: Command exits 0 and `.tmp-cardnews-test/cardNewsDraft.test.js` exists.
    Evidence: evidence/task-1-compile.txt

  Scenario: evidence and compiled tests remain untracked
    Tool:     bash
    Steps:    git status --short > evidence/task-1-status-after.txt
    Expected: Output does not contain `.tmp-cardnews-test/` or `evidence/`.
    Evidence: evidence/task-1-status-after.txt
  ```

  Commit: YES | Message: `test(cardnews): add wizard verification harness` | Files: [`package.json`, `.gitignore`, `tsconfig.cardnews-test.json`]

- [ ] 2. Lock the 8-card generator contract

  What to do: Update tests first so `generateCardNewsDraft('AI 마케팅', { style: 'news', slideCount: 8 })` is the automatic wizard contract. Keep the generator pure and deterministic, preserve the existing default behavior unless a failing test proves the default must change, and ensure generated slides remain `SlideDraft`/export compatible. Wire style IDs from `CARD_NEWS_DRAFT_STYLE_IDS`; do not accept arbitrary strings without narrowing.
  Must NOT do: Do not call browser APIs, React, localStorage, `window`, or external APIs from `src/cardNewsDraft.ts`.

  Parallelization: Can parallel: YES | Wave 1 | Blocks: [7, 9] | Blocked by: []

  References (executor has NO interview context - be exhaustive):
  - API/Type: `src/cardNewsDraft.ts:3` - `CARD_NEWS_DRAFT_STYLE_IDS` defines allowed styles.
  - API/Type: `src/cardNewsDraft.ts:40` - `CardNewsDraftOptions` already supports `accentColor`, `slideCount`, and `style`.
  - API/Type: `src/cardNewsDraft.ts:51` - generator entry point.
  - Pattern:  `src/cardNewsDraft.ts:84` - slide count is clamped to the default max.
  - Pattern:  `src/cardNewsDraft.ts:92` - style-specific slide copy dispatch.
  - Pattern:  `src/cardNewsDraft.ts:344` - generated slide shape and stable IDs.
  - Test:     `src/cardNewsDraft.test.ts:54` - current 8-card news-style test candidate.
  - External: `https://react.dev/reference/react-dom/components/input` - generated values become controlled form values in the UI.

  Acceptance criteria (agent-executable only):
  - [ ] `npm run test:cardnews > evidence/task-2-cardnews-tests.txt 2>&1` exits 0.
  - [ ] Test output proves `generateCardNewsDraft('AI 마케팅', { style: 'news', slideCount: 8 })` returns exactly 8 slides.
  - [ ] Test output proves every generated slide has stable `topic-draft-XX` ID, SVG data URL, name, source, title, description, focus, zoom, `themeId`, and `cardLayout`.
  - [ ] Test output proves invalid color falls back to `#1247d8` and custom color is preserved.

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: wizard generator returns 8 cards
    Tool:     bash
    Steps:    mkdir -p evidence && npm run test:cardnews -- --test-name-pattern "8-card" > evidence/task-2-eight-card.txt 2>&1
    Expected: Command exits 0 and output includes the 8-card wizard draft test.
    Evidence: evidence/task-2-eight-card.txt

  Scenario: generated slides are export-compatible
    Tool:     bash
    Steps:    npm run test:cardnews -- --test-name-pattern "export rendering" > evidence/task-2-export-compatible.txt 2>&1
    Expected: Command exits 0 and output includes the export compatibility test.
    Evidence: evidence/task-2-export-compatible.txt
  ```

  Commit: YES | Message: `test(cardnews): lock eight card wizard drafts` | Files: [`src/cardNewsDraft.ts`, `src/cardNewsDraft.test.ts`]

- [ ] 3. Add browser verification CLI

  What to do: Add `scripts/verify-cardnews-wizard.mjs` and `npm run verify:cardnews-wizard`. Use `playwright-core` like `scripts/capture-store-screenshots.mjs`, support `--url`, `--scenario`, `--topic`, `--evidence-dir`, `--screenshot`, and `--downloads-dir`. Implement help and clear failure messages now; add scenario bodies incrementally as later tasks land. Scenarios required by the end: `auto-happy`, `auto-empty-topic`, `auto-style-brand-color`, `direct-add-card`, `direct-no-ai-options`, `reload-export`, and `mobile`.
  Must NOT do: Do not bake in the Vercel production URL. Do not require a persistent browser profile. Do not use pixel-only assertions as the only pass condition.

  Parallelization: Can parallel: YES | Wave 1 | Blocks: [7, 8, 9] | Blocked by: []

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `scripts/capture-store-screenshots.mjs:9` - URL/env default pattern.
  - Pattern:  `scripts/capture-store-screenshots.mjs:11` - Chrome executable path pattern.
  - Pattern:  `scripts/capture-store-screenshots.mjs:22` - viewport setup pattern.
  - Pattern:  `scripts/record-iran-cardnews.mjs:18` - typed input helper pattern.
  - Pattern:  `scripts/record-iran-cardnews.mjs:147` - slide-card locator pattern.
  - External: `https://playwright.dev/docs/api/class-page#page-screenshot` - screenshot capture.
  - External: `https://playwright.dev/docs/test-assertions` - prefer retrying locator checks when using the test runner; in this script emulate with explicit waits and assertions.

  Acceptance criteria (agent-executable only):
  - [ ] `node scripts/verify-cardnews-wizard.mjs --help > evidence/task-3-help.txt 2>&1` exits 0 and lists every supported scenario.
  - [ ] `CARDSTUDIO_URL=http://127.0.0.1:9 npm run verify:cardnews-wizard -- --scenario auto-happy > evidence/task-3-invalid-url.txt 2>&1` exits nonzero and prints `Unable to open Cardstudio URL`.
  - [ ] `package.json` contains `verify:cardnews-wizard`.

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: verifier help is explicit
    Tool:     bash
    Steps:    mkdir -p evidence && node scripts/verify-cardnews-wizard.mjs --help > evidence/task-3-help.txt 2>&1
    Expected: Command exits 0 and output includes `auto-happy`, `direct-add-card`, `direct-no-ai-options`, `reload-export`, and `mobile`.
    Evidence: evidence/task-3-help.txt

  Scenario: verifier fails clearly on unavailable app
    Tool:     bash
    Steps:    CARDSTUDIO_URL=http://127.0.0.1:9 npm run verify:cardnews-wizard -- --scenario auto-happy > evidence/task-3-invalid-url.txt 2>&1
    Expected: Command exits nonzero and output contains `Unable to open Cardstudio URL`.
    Evidence: evidence/task-3-invalid-url.txt
  ```

  Commit: YES | Message: `test(cardnews): add wizard browser verifier` | Files: [`scripts/verify-cardnews-wizard.mjs`, `package.json`]

- [ ] 4. Split the App monolith into focused modules

  What to do: Before adding the wizard UI, extract shared TS/TSX units from `src/App.tsx`. Minimum split: `src/cardStudioTypes.ts` for public types, `src/cardStudioConfig.ts` for presets/theme/help/static options, `src/cardStudioSlides.ts` for slide creation/normalization/restore guards, slide components under `src/components/slides/`, and creation/editor modal components under `src/components/`. Keep named exports and `import type`. Preserve behavior first; feature changes belong to later tasks.
  Must NOT do: Do not combine unrelated logic into `utils.ts` or `helpers.ts`. Do not change user-visible flow in this task except as needed to keep imports working. Do not leave new TS/TSX files over 250 pure LOC.

  Parallelization: Can parallel: YES | Wave 1 | Blocks: [6, 7, 8, 9] | Blocked by: []

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `src/App.tsx:16` - shared type definitions currently embedded in App.
  - Pattern:  `src/App.tsx:122` - theme presets and output sizes currently embedded in App.
  - Pattern:  `src/App.tsx:411` - main App state surface to keep as coordinator.
  - Pattern:  `src/App.tsx:929` - slide field update primitive.
  - Pattern:  `src/App.tsx:1913` - preview component props.
  - Pattern:  `src/App.tsx:1942` - crop editor component.
  - Pattern:  `src/App.tsx:2167` - slide canvas dispatcher.
  - Pattern:  `src/App.tsx:2640` - slide draft factory.
  - Test:     `tsconfig.app.json:20` - strict TypeScript settings.
  - External: `https://react.dev/learn/conditional-rendering` - component extraction must preserve state-driven rendering.

  Acceptance criteria (agent-executable only):
  - [ ] `npx tsc --noEmit -p tsconfig.app.json > evidence/task-4-typecheck.txt 2>&1` exits 0.
  - [ ] `npm run lint > evidence/task-4-lint.txt 2>&1` exits 0.
  - [ ] `node -e "const fs=require('fs'); const files=['src/App.tsx','src/cardStudioTypes.ts','src/cardStudioConfig.ts','src/cardStudioSlides.ts']; for (const f of files) if(!fs.existsSync(f)) throw new Error(f);"` exits 0.
  - [ ] `bash -lc 'for f in src/App.tsx src/cardStudioTypes.ts src/cardStudioConfig.ts src/cardStudioSlides.ts src/components/**/*.tsx; do [ -f "$f" ] || continue; n=$(awk '\''!/^[[:space:]]*$/ && !/^[[:space:]]*(\/\/|\/\*|\*)/'\'' "$f" | wc -l | tr -d " "); if [ "$n" -gt 250 ]; then echo "$f $n"; exit 1; fi; done'` exits 0.

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: extracted TSX still typechecks
    Tool:     bash
    Steps:    mkdir -p evidence && npx tsc --noEmit -p tsconfig.app.json > evidence/task-4-typecheck.txt 2>&1
    Expected: Command exits 0 with no TypeScript errors.
    Evidence: evidence/task-4-typecheck.txt

  Scenario: extracted files stay below size ceiling
    Tool:     bash
    Steps:    bash -lc 'for f in src/App.tsx src/cardStudioTypes.ts src/cardStudioConfig.ts src/cardStudioSlides.ts src/components/**/*.tsx; do [ -f "$f" ] || continue; n=$(awk '\''!/^[[:space:]]*$/ && !/^[[:space:]]*(\/\/|\/\*|\*)/'\'' "$f" | wc -l | tr -d " "); echo "$f $n"; if [ "$n" -gt 250 ]; then exit 1; fi; done' > evidence/task-4-loc.txt
    Expected: Command exits 0 and every listed TS/TSX file is `<=250` pure LOC.
    Evidence: evidence/task-4-loc.txt
  ```

  Commit: YES | Message: `refactor(cardnews): split studio components` | Files: [`src/App.tsx`, `src/cardStudioTypes.ts`, `src/cardStudioConfig.ts`, `src/cardStudioSlides.ts`, `src/components/**`]

- [ ] 5. Install the requested visual token foundation

  What to do: Replace the warm editor shell with the requested restrained card-studio palette. Define tokens for primary, text, background, muted background, and border using `#1868db`, `#1c2b42`, `#ffffff`, `#f8f8f8`, and `#e9f2fe`. Apply them to the app shell, top creation card, tabs, inputs, buttons, cards, modal, and responsive states. Remove decorative warm radial backgrounds and black fixed-bottom styling that conflicts with the requested palette.
  Must NOT do: Do not change generated card output themes unless required by the wizard; this task is the app UI shell. Do not introduce decorative gradient orbs.

  Parallelization: Can parallel: YES | Wave 1 | Blocks: [6, 7, 8, 9] | Blocked by: []

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `src/App.css:1` - current warm app shell.
  - Pattern:  `src/App.css:173` - existing primary/action button styles.
  - Pattern:  `src/App.css:381` - field input/textarea styling.
  - Pattern:  `src/App.css:648` - surface card styling.
  - Pattern:  `src/App.css:1683` - responsive modal/mobile styles.
  - Pattern:  `src/App.css:1834` - fixed bottom bar black styling to remove or restyle.
  - Pattern:  `src/index.css:1` - global font/background currently warm and network-font dependent.
  - External: `https://react.dev/reference/react-dom/components/input` - focused inputs need clear controlled states and accessible labels.

  Acceptance criteria (agent-executable only):
  - [ ] `node -e "const fs=require('fs'); const css=fs.readFileSync('src/App.css','utf8')+fs.readFileSync('src/index.css','utf8'); for (const token of ['#1868db','#1c2b42','#ffffff','#f8f8f8','#e9f2fe']) if(!css.toLowerCase().includes(token)) throw new Error(token);"` exits 0.
  - [ ] `node -e "const fs=require('fs'); const css=fs.readFileSync('src/App.css','utf8'); if(/radial-gradient\\(circle at top left, rgba\\(255, 223, 198/.test(css)) throw new Error('old warm radial remains');"` exits 0.
  - [ ] `npm run build:web > evidence/task-5-build.txt 2>&1` exits 0.

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: required design tokens are present
    Tool:     bash
    Steps:    mkdir -p evidence && node -e "const fs=require('fs'); const css=fs.readFileSync('src/App.css','utf8')+fs.readFileSync('src/index.css','utf8'); for (const token of ['#1868db','#1c2b42','#ffffff','#f8f8f8','#e9f2fe']) if(!css.toLowerCase().includes(token)) throw new Error(token); console.log('tokens ok');" > evidence/task-5-tokens.txt
    Expected: Command exits 0 and evidence says `tokens ok`.
    Evidence: evidence/task-5-tokens.txt

  Scenario: CSS still builds
    Tool:     bash
    Steps:    npm run build:web > evidence/task-5-build.txt 2>&1
    Expected: Command exits 0 with Vite build output.
    Evidence: evidence/task-5-build.txt
  ```

  Commit: YES | Message: `style(cardnews): apply studio design tokens` | Files: [`src/App.css`, `src/index.css`, `src/styles/**`]

- [ ] 6. Build the top creation card and mode tabs

  What to do: Replace the current How To Use/landing/config-first presentation with a top card titled exactly `카드뉴스 만들기`. Add tab buttons `자동 생성` and `직접 생성`, driven by `creationMode`. Preserve the top brand/runtime header. The `자동 생성` panel should mount only auto wizard controls; the `직접 생성` panel should mount only direct builder controls. The old broad configuration cards at `src/App.tsx:1179` must move behind the generated editor or be removed from first-viewport creation.
  Must NOT do: Do not show topic/style/generator controls when `creationMode === 'manual'`. Do not show direct `+ 카드 추가` controls when `creationMode === 'auto'` except after generated results through the editor if explicitly needed.

  Parallelization: Can parallel: NO | Wave 2 | Blocks: [7, 8, 9] | Blocked by: [4, 5]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `src/App.tsx:93` - existing `CreationMode` type.
  - Pattern:  `src/App.tsx:423` - existing `creationMode` state.
  - Pattern:  `src/App.tsx:1017` - top brand/runtime header to preserve.
  - Pattern:  `src/App.tsx:1031` - current first creation section to replace.
  - Pattern:  `src/App.tsx:1179` - current config cards that must not remain as direct-flow visible options.
  - Pattern:  `src/App.css:211` - topic row style location to replace with tab/card styles.
  - External: `https://react.dev/learn/conditional-rendering` - state-driven tab panel rendering.

  Acceptance criteria (agent-executable only):
  - [ ] `npx tsc --noEmit -p tsconfig.app.json > evidence/task-6-typecheck.txt 2>&1` exits 0.
  - [ ] Browser QA sees a heading or card title `카드뉴스 만들기`.
  - [ ] Browser QA sees exactly two creation tabs with accessible names `자동 생성` and `직접 생성`.
  - [ ] Clicking `직접 생성` hides `카드뉴스 주제`, `스타일`, `대표 색상`, `브랜드`, `로고`, `초안 만들기`, and any `AI` copy.

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: top creation card and tabs render
    Tool:     playwright(real Chrome)
    Steps:    mkdir -p evidence
              npm run dev:web -- --host 127.0.0.1 --port 4173 --strictPort > evidence/task-6-vite.log 2>&1 &
              DEV_PID=$!
              for i in {1..30}; do curl -fsS http://127.0.0.1:4173 >/dev/null && break; sleep 1; done
              CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" CARDSTUDIO_URL=http://127.0.0.1:4173 npm run verify:cardnews-wizard -- --scenario tabs --evidence-dir evidence --screenshot task-6-tabs.png > evidence/task-6-tabs.txt 2>&1
              kill $DEV_PID
    Expected: Verifier exits 0, finds `카드뉴스 만들기`, `자동 생성`, and `직접 생성`, and writes `evidence/task-6-tabs.png`.
    Evidence: evidence/task-6-tabs.txt

  Scenario: direct tab hides automatic options
    Tool:     playwright(real Chrome)
    Steps:    mkdir -p evidence
              npm run dev:web -- --host 127.0.0.1 --port 4173 --strictPort > evidence/task-6-hidden-vite.log 2>&1 &
              DEV_PID=$!
              for i in {1..30}; do curl -fsS http://127.0.0.1:4173 >/dev/null && break; sleep 1; done
              CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" CARDSTUDIO_URL=http://127.0.0.1:4173 npm run verify:cardnews-wizard -- --scenario direct-no-ai-options --evidence-dir evidence --screenshot task-6-direct-hidden.png > evidence/task-6-direct-hidden.txt 2>&1
              kill $DEV_PID
    Expected: Verifier exits 0 and confirms direct mode does not expose topic/style/brand/logo/color/generate/AI controls.
    Evidence: evidence/task-6-direct-hidden.txt
  ```

  Commit: YES | Message: `feat(cardnews): add creation mode tabs` | Files: [`src/App.tsx`, `src/components/creation/**`, `src/App.css`, `src/styles/**`, `scripts/verify-cardnews-wizard.mjs`]

- [ ] 7. Complete the automatic progressive wizard

  What to do: Implement the automatic panel as a step-by-step wizard using `autoStep`, `wizardSteps`, `draftStyleOptions`, and `topicExamples`. Step 1 accepts topic; Step 2 accepts style; Step 3 accepts brand name, durable logo upload, and color; Step 4 triggers generation and shows generated 8 cards plus editing options. Update `createTopicDraft` to pass `{ style: draftStyle, slideCount: 8, accentColor: topicAccentColor }`. Empty topic in the UI must keep the user on Step 1 with Korean validation copy; keep the pure generator's blank-topic fallback as a unit-tested internal contract.
  Must NOT do: Do not show all wizard steps at once. Do not generate 9 cards in the automatic flow. Do not expose direct builder fields before generation in the automatic flow.

  Parallelization: Can parallel: YES | Wave 2 | Blocks: [9] | Blocked by: [2, 3, 4, 5, 6]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `src/App.tsx:99` - `draftStyleOptions` already defined.
  - Pattern:  `src/App.tsx:110` - `wizardSteps` already defined.
  - Pattern:  `src/App.tsx:120` - topic example chips candidate.
  - Pattern:  `src/App.tsx:424` - `autoStep` state.
  - Pattern:  `src/App.tsx:427` - `draftStyle` state.
  - Pattern:  `src/App.tsx:874` - `createTopicDraft` currently omits `style` and `slideCount`.
  - API/Type: `src/cardNewsDraft.ts:40` - generator options.
  - Test:     `src/cardNewsDraft.test.ts:54` - 8-card style contract.
  - External: `https://react.dev/reference/react-dom/components/input` - controlled topic/color/brand/logo form inputs.

  Acceptance criteria (agent-executable only):
  - [ ] `npm run test:cardnews > evidence/task-7-cardnews-tests.txt 2>&1` exits 0.
  - [ ] `npx tsc --noEmit -p tsconfig.app.json > evidence/task-7-typecheck.txt 2>&1` exits 0.
  - [ ] Browser QA `auto-happy` with topic `AI 마케팅`, style `뉴스형`, brand `테스트 브랜드`, durable logo upload, and color `#1868db` generates exactly 8 slide rail cards.
  - [ ] Browser QA sees generated card text containing `AI 마케팅` and visible card count/pagination ending in `08`.
  - [ ] Browser QA confirms editing controls appear only after the 8-card result exists.
  - [ ] `node -e "const fs=require('fs'); const s=fs.readFileSync('src/App.tsx','utf8'); if(/intent === 'icon'[\\s\\S]{0,350}URL\\.createObjectURL/.test(s)) throw new Error('logo branch stores object URL');"` exits 0.

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: automatic wizard generates 8 editable cards
    Tool:     playwright(real Chrome)
    Steps:    mkdir -p evidence
              npm run dev:web -- --host 127.0.0.1 --port 4173 --strictPort > evidence/task-7-vite.log 2>&1 &
              DEV_PID=$!
              for i in {1..30}; do curl -fsS http://127.0.0.1:4173 >/dev/null && break; sleep 1; done
              CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" CARDSTUDIO_URL=http://127.0.0.1:4173 npm run verify:cardnews-wizard -- --scenario auto-happy --topic "AI 마케팅" --evidence-dir evidence --screenshot task-7-auto-happy.png > evidence/task-7-auto-happy.txt 2>&1
              kill $DEV_PID
    Expected: Verifier exits 0, finds 8 generated cards, topic text, brand text, and post-generation editing controls.
    Evidence: evidence/task-7-auto-happy.txt

  Scenario: automatic wizard handles empty topic gracefully
    Tool:     playwright(real Chrome)
    Steps:    mkdir -p evidence
              npm run dev:web -- --host 127.0.0.1 --port 4173 --strictPort > evidence/task-7-empty-vite.log 2>&1 &
              DEV_PID=$!
              for i in {1..30}; do curl -fsS http://127.0.0.1:4173 >/dev/null && break; sleep 1; done
              CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" CARDSTUDIO_URL=http://127.0.0.1:4173 npm run verify:cardnews-wizard -- --scenario auto-empty-topic --evidence-dir evidence --screenshot task-7-empty-topic.png > evidence/task-7-empty-topic.txt 2>&1
              kill $DEV_PID
    Expected: Verifier exits 0, remains on Step 1, shows Korean validation copy, and does not create slide rail cards.
    Evidence: evidence/task-7-empty-topic.txt
  ```

  Commit: YES | Message: `feat(cardnews): complete automatic wizard` | Files: [`src/App.tsx`, `src/components/creation/AutoCreationWizard.tsx`, `src/cardStudioSlides.ts`, `src/cardNewsDraft.ts`, `src/cardNewsDraft.test.ts`, `scripts/verify-cardnews-wizard.mjs`]

- [ ] 8. Complete the direct manual builder

  What to do: Implement the direct panel as a minimal card builder. It starts empty or with one blank card, has `+ 카드 추가`, and each manual card exposes only title, body, and image controls. Use `SlideDraft` internally with blank/default `kicker`, `badge`, `focusX`, `focusY`, and `zoom`; if an image is missing, use a neutral placeholder safe for preview/export. Reuse `optimizeLocalImage` for uploaded images. Direct cards should be selectable, reorderable only if already available without exposing advanced AI/layout controls, and editable through the minimal fields.
  Must NOT do: Do not call `generateCardNewsDraft`. Do not show topic, style, brand/logo/color, project mode, layout, sequence, app store, AI, or generator controls inside direct mode.

  Parallelization: Can parallel: YES | Wave 2 | Blocks: [9] | Blocked by: [3, 4, 5, 6]

  References (executor has NO interview context - be exhaustive):
  - API/Type: `src/App.tsx:30` - `SlideDraft` fields to populate internally.
  - Pattern:  `src/App.tsx:709` - shared image file handling and `optimizeLocalImage`.
  - Pattern:  `src/App.tsx:863` - `appendSlides` behavior to adapt for manual cards.
  - Pattern:  `src/App.tsx:929` - slide field update primitive.
  - Pattern:  `src/App.tsx:989` - remove/delete behavior; direct flow should not crash on empty.
  - API/Type: `src/lib/appsInToss.ts:32` - durable image optimization.
  - External: `https://react.dev/reference/react-dom/components/input` - controlled title/body inputs.

  Acceptance criteria (agent-executable only):
  - [ ] `npx tsc --noEmit -p tsconfig.app.json > evidence/task-8-typecheck.txt 2>&1` exits 0.
  - [ ] Browser QA `direct-add-card` can add two cards, fill title/body for both, upload or set one image fixture, and see two preview/rail cards.
  - [ ] Browser QA `direct-no-ai-options` confirms direct mode contains none of these visible strings: `카드뉴스 주제`, `스타일`, `브랜드`, `로고`, `대표 색상`, `초안 만들기`, `AI`, `자동 생성하기`.
  - [ ] Generated/auto mode still remains selectable after returning to `자동 생성`.

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: direct mode adds and edits cards
    Tool:     playwright(real Chrome)
    Steps:    mkdir -p evidence
              npm run dev:web -- --host 127.0.0.1 --port 4173 --strictPort > evidence/task-8-vite.log 2>&1 &
              DEV_PID=$!
              for i in {1..30}; do curl -fsS http://127.0.0.1:4173 >/dev/null && break; sleep 1; done
              CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" CARDSTUDIO_URL=http://127.0.0.1:4173 npm run verify:cardnews-wizard -- --scenario direct-add-card --evidence-dir evidence --screenshot task-8-direct-add.png > evidence/task-8-direct-add.txt 2>&1
              kill $DEV_PID
    Expected: Verifier exits 0, adds at least two direct cards, fills title/body fields, and sees the same text in preview/rail output.
    Evidence: evidence/task-8-direct-add.txt

  Scenario: direct mode has no AI options
    Tool:     playwright(real Chrome)
    Steps:    mkdir -p evidence
              npm run dev:web -- --host 127.0.0.1 --port 4173 --strictPort > evidence/task-8-no-ai-vite.log 2>&1 &
              DEV_PID=$!
              for i in {1..30}; do curl -fsS http://127.0.0.1:4173 >/dev/null && break; sleep 1; done
              CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" CARDSTUDIO_URL=http://127.0.0.1:4173 npm run verify:cardnews-wizard -- --scenario direct-no-ai-options --evidence-dir evidence --screenshot task-8-direct-no-ai.png > evidence/task-8-direct-no-ai.txt 2>&1
              kill $DEV_PID
    Expected: Verifier exits 0 and confirms all auto/AI/brand/style controls are absent from the direct panel.
    Evidence: evidence/task-8-direct-no-ai.txt
  ```

  Commit: YES | Message: `feat(cardnews): add direct card builder` | Files: [`src/App.tsx`, `src/components/creation/ManualCreationPanel.tsx`, `src/cardStudioSlides.ts`, `src/App.css`, `src/styles/**`, `scripts/verify-cardnews-wizard.mjs`]

- [ ] 9. Integrate persistence, export, responsive polish, and docs cleanup

  What to do: Persist enough mode metadata to restore the selected creation mode and card set without exposing the wrong panel. Ensure automatic 8-card drafts and direct manual cards both reload correctly, preview correctly, and export through the hidden render root. Update browser verifier scenarios for reload/export/mobile. Update README or docs with the new two-flow behavior and verification commands. Clean generated debris, run all checks, and leave the working tree ready for review.
  Must NOT do: Do not commit evidence/screenshots/downloaded PNGs. Do not change `granite.config.ts` or AppsInToss bridge APIs unless a failing export test proves it is required.

  Parallelization: Can parallel: NO | Wave 3 | Blocks: [] | Blocked by: [1, 2, 3, 4, 5, 6, 7, 8]

  References (executor has NO interview context - be exhaustive):
  - API/Type: `src/App.tsx:43` - `ProjectDraft` persistence shape.
  - Pattern:  `src/App.tsx:549` - autosave effect and dependency list.
  - Pattern:  `src/App.tsx:603` - restore flow.
  - Pattern:  `src/App.tsx:778` - export all loop.
  - Pattern:  `src/App.tsx:1728` - save modal entry.
  - Pattern:  `src/App.tsx:1874` - hidden export render root.
  - API/Type: `src/lib/appsInToss.ts:44` - draft load/save bridge.
  - API/Type: `src/lib/appsInToss.ts:78` - PNG saving bridge.
  - Pattern:  `README.md:24` - current execution/build docs.
  - Pattern:  `scripts/capture-store-screenshots.mjs:30` - Chrome screenshot capture pattern.
  - External: `https://vite.dev/guide/cli` - use `vite build` and `vite preview` commands correctly.
  - External: `https://playwright.dev/docs/api/class-page#page-screenshot` - capture final evidence screenshots.

  Acceptance criteria (agent-executable only):
  - [ ] `npm run test:cardnews > evidence/task-9-cardnews-tests.txt 2>&1` exits 0.
  - [ ] `npx tsc --noEmit -p tsconfig.app.json > evidence/task-9-typecheck.txt 2>&1` exits 0.
  - [ ] `npm run lint > evidence/task-9-lint.txt 2>&1` exits 0.
  - [ ] `npm run build:web > evidence/task-9-build-web.txt 2>&1` exits 0.
  - [ ] Browser QA `reload-export` proves an auto-generated 8-card draft survives reload and opens export preview.
  - [ ] Browser QA `mobile` proves top card tabs and direct fields fit at 390x844 without text overlap.
  - [ ] `git status --short > evidence/task-9-status.txt` shows no tracked generated evidence or temporary output.

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: restored automatic draft exports
    Tool:     playwright(real Chrome)
    Steps:    mkdir -p evidence
              npm run dev:web -- --host 127.0.0.1 --port 4173 --strictPort > evidence/task-9-vite.log 2>&1 &
              DEV_PID=$!
              for i in {1..30}; do curl -fsS http://127.0.0.1:4173 >/dev/null && break; sleep 1; done
              CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" CARDSTUDIO_URL=http://127.0.0.1:4173 npm run verify:cardnews-wizard -- --scenario reload-export --topic "AI 업무 자동화" --evidence-dir evidence --screenshot task-9-reload-export.png > evidence/task-9-reload-export.txt 2>&1
              kill $DEV_PID
    Expected: Verifier exits 0, reloads the page, still sees 8 cards, opens `결과보기 및 저장`, and confirms export controls are enabled.
    Evidence: evidence/task-9-reload-export.txt

  Scenario: mobile layout fits
    Tool:     playwright(real Chrome)
    Steps:    mkdir -p evidence
              npm run dev:web -- --host 127.0.0.1 --port 4173 --strictPort > evidence/task-9-mobile-vite.log 2>&1 &
              DEV_PID=$!
              for i in {1..30}; do curl -fsS http://127.0.0.1:4173 >/dev/null && break; sleep 1; done
              CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" CARDSTUDIO_URL=http://127.0.0.1:4173 npm run verify:cardnews-wizard -- --scenario mobile --evidence-dir evidence --screenshot task-9-mobile.png > evidence/task-9-mobile.txt 2>&1
              kill $DEV_PID
    Expected: Verifier exits 0 at 390x844, confirms `카드뉴스 만들기`, both tabs, and direct title/body/image controls are visible without horizontal overflow.
    Evidence: evidence/task-9-mobile.txt
  ```

  Commit: YES | Message: `feat(cardnews): finish two mode wizard flow` | Files: [`src/App.tsx`, `src/components/**`, `src/cardStudioTypes.ts`, `src/cardStudioConfig.ts`, `src/cardStudioSlides.ts`, `src/App.css`, `src/index.css`, `src/styles/**`, `scripts/verify-cardnews-wizard.mjs`, `README.md`]

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
- Reference the plan file path in the final commit footer: `Plan: plans/cardnews-wizard-redesign.md`.

## Success criteria
- All Must-Have shipped; all QA scenarios pass with captured evidence; F1-F4 approved; commit history clean.

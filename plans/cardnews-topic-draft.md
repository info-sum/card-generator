# Cardnews Topic Draft Generator

## TL;DR
> Summary:      Finish the topic-only Korean cardnews generator so a user can enter any topic and get an editable 9-card Sequence-style blue/white draft, while preserving the existing image-upload and PNG export flows.
> Deliverables:
> - Deterministic topic draft generator with blank-topic fallback
> - Topic input and generate action in the studio start surface
> - Sequence-like 9-card social layout with blue/white/yellow visual system
> - Unit/test harness plus Chrome-driven browser QA and export evidence
> - README/update notes and clean commit history
> Effort:       Medium
> Risk:         Medium - the worktree already has partial uncommitted generator wiring, and `src/App.tsx` / `src/App.css` are oversized shared surfaces.

## Scope
### Must have
- Preserve existing dirty work before changing anything: `src/App.tsx` already imports `generateCardNewsDraft`, adds `sequence` layout, a `sequence-blue` theme, `topicSeed`, and a topic input at `src/App.tsx:5`, `src/App.tsx:17`, `src/App.tsx:158`, `src/App.tsx:395`, `src/App.tsx:793`, and `src/App.tsx:989`.
- Use or replace the existing untracked generator and tests after auditing them: `src/cardNewsDraft.ts:42` defines `generateCardNewsDraft`, and `src/cardNewsDraft.test.ts:5` starts the expected 9-slide contract.
- A topic like `AI 업무 자동화` generates exactly 9 editable social cards, with generated titles/descriptions in Korean and visible pagination `01 / 09`.
- Blank or whitespace-only input generates a useful default draft instead of crashing; existing note calls this out at `artifacts/ulw/cardnews-topic-draft.md:10`.
- Generated slides must remain compatible with the existing `ImportedImage` shape in `src/lib/appsInToss.ts:3` and the export loop in `src/App.tsx:697`.
- Generated slides must be editable through the current slide editor controls at `src/App.tsx:1270`.
- The Sequence visual direction must be blue/white with a yellow accent, closer to a cardnews editorial template than the current image-overlay marketing card.
- Existing image upload, App Store mode, theme controls, local draft save/restore, and PNG export must still work.

### Must NOT have (guardrails, anti-slop, scope boundaries)
- Do not add an LLM/API/backend; generation is deterministic client-side copy templating.
- Do not rewrite `src/App.tsx` or `src/App.css` wholesale; both are already large (`src/App.tsx` is 2684 lines, `src/App.css` is 1887 lines).
- Do not commit generated outputs such as `.tmp-cardnews-test/`, downloads, screenshots, or evidence artifacts.
- Do not delete or revert existing uncommitted user work unless the executor proves it is generated debris and records the reason.
- Do not change AppsInToss permissions or native bridge behavior in `granite.config.ts:1`.
- Do not introduce Vitest/React Testing Library unless the executor chooses component tests that truly need them; the current repo has no test script in `package.json:6` and already has `playwright-core` at `package.json:32`.

## Verification strategy
> Zero human intervention - all verification is agent-executed.
- Test decision: TDD + Node `node:test` for pure generator tests, TypeScript compile via `tsconfig.cardnews-test.json`, and Playwright Core driving real Google Chrome for browser/export QA.
- QA policy: every task has agent-executed scenarios.
- Evidence: `evidence/task-<N>-<slug>.<ext>`
- Browser fallback: primary QA uses Google Chrome via Playwright with `CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"`. If Chrome is unavailable, use `agent-browser` against the same URL and capture the same evidence screenshots.
- External references:
  - Vitest Vite-native runner docs: `https://vitest.dev/guide/`
  - Testing Library React setup: `https://testing-library.com/docs/react-testing-library/setup/`
  - Playwright Chrome channel docs: `https://playwright.dev/docs/browsers`
  - html-to-image `toPng` options: `https://github.com/bubkoo/html-to-image`

## Execution strategy
### Parallel execution waves
> Target 5-8 tasks per wave. <3 per wave (except final) = under-splitting.
> Extract shared dependencies as Wave-1 tasks to maximize parallelism.

Wave 1 (no dependencies):
- Task 1: Establish test/evidence harness and dirty-work guard
- Task 2: Finish deterministic topic draft generator
- Task 3: Add executable browser QA script

Wave 2 (after Wave 1):
- Task 4: depends [1, 2] - Wire topic generation into app state, UI, and restore
- Task 5: depends [2, 4] - Render Sequence layout as a first-class social card variant
- Task 6: depends [4, 5] - Add focused Sequence CSS and responsive polish

Wave 3 (after Wave 2):
- Task 7: depends [3, 4, 5, 6] - Harden generated-card export/download flow
- Task 8: depends [1, 2, 3, 4, 5, 6, 7] - Update docs, clean generated debris, and prepare commits

Critical path: Task 1 -> Task 2 -> Task 4 -> Task 5 -> Task 6 -> Task 7 -> Task 8

### Dependency matrix
| Task | Depends on | Blocks | Can parallelize with |
|------|------------|--------|----------------------|
| 1    | none       | 4, 8   | 2, 3                 |
| 2    | none       | 4, 5, 8 | 1, 3                |
| 3    | none       | 7, 8   | 1, 2                 |
| 4    | 1, 2       | 5, 6, 7, 8 | none             |
| 5    | 2, 4       | 6, 7, 8 | none                |
| 6    | 4, 5       | 7, 8   | none                 |
| 7    | 3, 4, 5, 6 | 8      | none                 |
| 8    | 1, 2, 3, 4, 5, 6, 7 | none | none       |

## Todos
> Implementation + Test = ONE task. Never separate.
> Every task MUST have: References + Acceptance Criteria + QA Scenarios + Commit.

- [ ] 1. Establish test/evidence harness and dirty-work guard

  What to do: Audit `git status --short` first and record the existing dirty files. Keep the current `src/cardNewsDraft.ts`, `src/cardNewsDraft.test.ts`, and `tsconfig.cardnews-test.json` as candidate user work unless replacing them is clearly simpler. Add or finalize `npm run test:cardnews:compile` so it compiles `src/cardNewsDraft.ts` and `src/cardNewsDraft.test.ts` into `.tmp-cardnews-test/`, and add `npm run test:cardnews` so it runs the compile step followed by `node --test`. Add `.tmp-cardnews-test/` and `evidence/` to `.gitignore` so generated proof does not pollute commits.
  Must NOT do: Do not install Vitest or any new test dependency for this task. Do not delete untracked files without preserving their content or explaining why they are generated output.

  Parallelization: Can parallel: YES | Wave 1 | Blocks: [4, 8] | Blocked by: []

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `package.json:6` - scripts currently include build/lint/dev but no test script.
  - Pattern:  `.gitignore:1` - existing ignore style for generated outputs and logs.
  - Pattern:  `tsconfig.cardnews-test.json:1` - existing untracked NodeNext compile config candidate.
  - Test:     `src/cardNewsDraft.test.ts:1` - existing untracked Node `node:test` test candidate.
  - External: `https://nodejs.org/api/test.html` - Node test runner reference if the executor needs syntax confirmation.

  Acceptance criteria (agent-executable only):
  - [ ] `npm run test:cardnews:compile > evidence/task-1-compile.txt 2>&1` exits 0.
  - [ ] `npm run test:cardnews` exists in `package.json`; Task 2 owns making all behavioral tests pass.
  - [ ] `.tmp-cardnews-test/` and `evidence/` do not appear in `git status --short` after generated tests run.
  - [ ] `git status --short > evidence/task-1-dirty-baseline.txt` captures pre-edit dirty context.

  QA scenarios (MANDATORY - task incomplete without these):
  > Name the exact tool AND its exact invocation - not "verify it works". Browser use: use Chrome to drive the page; if Chrome is not available, download and use agent-browser (https://github.com/vercel-labs/agent-browser). Computer use: OS-level GUI automation for a non-browser desktop app.
  ```
  Scenario: test compile harness is callable
    Tool:     bash
    Steps:    mkdir -p evidence && npm run test:cardnews:compile > evidence/task-1-compile.txt 2>&1
    Expected: Command exits 0 and `.tmp-cardnews-test/cardNewsDraft.test.js` exists.
    Evidence: evidence/task-1-compile.txt

  Scenario: generated test output stays untracked
    Tool:     bash
    Steps:    git status --short > evidence/task-1-status-after-test.txt
    Expected: Output does not include `.tmp-cardnews-test/` or `evidence/`.
    Evidence: evidence/task-1-status-after-test.txt
  ```

  Commit: YES | Message: `test(cardnews): add deterministic draft test harness` | Files: [`package.json`, `.gitignore`, `tsconfig.cardnews-test.json`, `src/cardNewsDraft.test.ts`]

- [ ] 2. Finish deterministic topic draft generator

  What to do: Complete `generateCardNewsDraft(rawTopic)` as a pure deterministic function that normalizes whitespace, falls back to `새로운 주제`, returns social portrait settings, and produces 9 slides with stable IDs, SVG data URLs, Korean copy, editable fields, `themeId: 'sequence-blue'`, and `cardLayout: 'sequence'`. Keep the module small and free of React/browser side effects. Expand tests first to cover happy path, blank fallback, whitespace normalization, unique IDs, 9-slide order, and export-compatible image fields.
  Must NOT do: Do not call external APIs. Do not import `App.tsx`. Do not return random IDs for generated slides, because test and restore behavior must be deterministic.

  Parallelization: Can parallel: YES | Wave 1 | Blocks: [4, 5, 8] | Blocked by: []

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `src/cardNewsDraft.ts:42` - existing untracked generator candidate.
  - Pattern:  `src/lib/appsInToss.ts:3` - `ImportedImage` fields required by existing slide rendering/export.
  - Pattern:  `artifacts/ulw/cardnews-topic-draft.md:10` - binding success criteria for 9-slide topic draft.
  - API/Type: `src/App.tsx:17` - `CardLayout` already includes `sequence` in current dirty tree.
  - Test:     `src/cardNewsDraft.test.ts:5` - existing happy-path test candidate.
  - External: `https://github.com/bubkoo/html-to-image` - generated `dataUrl` must remain safe for DOM-to-PNG rendering.

  Acceptance criteria (agent-executable only):
  - [ ] `npm run test:cardnews > evidence/task-2-cardnews-tests.txt 2>&1` exits 0.
  - [ ] Test output proves `generateCardNewsDraft('AI 업무 자동화')` returns exactly 9 slides and project title `AI 업무 자동화 카드뉴스 초안`.
  - [ ] Test output proves `generateCardNewsDraft('   ')` returns a 9-slide default draft using `새로운 주제`.
  - [ ] Test output proves every slide has `id`, `dataUrl`, `name`, `source`, `kicker`, `title`, `description`, `badge`, `focusX`, `focusY`, and `zoom`.

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: topic generates 9 Korean slides
    Tool:     bash
    Steps:    mkdir -p evidence && npm run test:cardnews -- --test-name-pattern "9-slide" > evidence/task-2-happy.txt 2>&1
    Expected: Command exits 0 and output includes the 9-slide happy-path test.
    Evidence: evidence/task-2-happy.txt

  Scenario: blank input uses fallback topic
    Tool:     bash
    Steps:    mkdir -p evidence && npm run test:cardnews -- --test-name-pattern "blank" > evidence/task-2-empty-topic.txt 2>&1
    Expected: Command exits 0 and output includes the blank-topic fallback test.
    Evidence: evidence/task-2-empty-topic.txt
  ```

  Commit: YES | Message: `feat(cardnews): generate topic-based sequence drafts` | Files: [`src/cardNewsDraft.ts`, `src/cardNewsDraft.test.ts`]

- [ ] 3. Add executable browser QA script

  What to do: Add `scripts/verify-cardnews-topic.mjs` and `npm run verify:cardnews-topic`. Reuse the Playwright Core pattern from existing scripts: launch Chrome from `CHROME_PATH`, open `CARDSTUDIO_URL`, drive the topic field, click `초안 만들기`, assert generated slide count/pagination/text, optionally click the second slide, optionally trigger all-slide export, and write screenshots/logs into `EVIDENCE_DIR`. Provide `--help`, `--topic`, `--expected-slides`, `--screenshot`, `--assert-downloads`, and `--downloads-dir` flags. Keep the script deterministic and make failures print a specific reason.
  Must NOT do: Do not bake a dev server start into the script unless it shuts down cleanly. Do not depend on private browser profile cookies. Do not use brittle pixel-only assertions as the sole pass condition.

  Parallelization: Can parallel: YES | Wave 1 | Blocks: [7, 8] | Blocked by: []

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `scripts/capture-store-screenshots.mjs:1` - existing Playwright Core import, Chrome path, and screenshot pattern.
  - Pattern:  `scripts/record-iran-cardnews.mjs:84` - existing browser automation that waits for `사진첩에서 가져오기`, fills fields, clicks rail cards, and triggers export.
  - Pattern:  `src/App.tsx:989` - topic input label/class added in dirty tree.
  - Pattern:  `src/App.tsx:697` - export loop triggered by browser QA.
  - External: `https://playwright.dev/docs/browsers` - Chrome channel/executable behavior.

  Acceptance criteria (agent-executable only):
  - [ ] `node scripts/verify-cardnews-topic.mjs --help > evidence/task-3-help.txt 2>&1` exits 0 and documents all flags.
  - [ ] With an invalid `CARDSTUDIO_URL`, the script exits nonzero and prints `Unable to open Cardstudio URL`.
  - [ ] `package.json` contains `verify:cardnews-topic`.

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: help output documents exact QA flags
    Tool:     bash
    Steps:    mkdir -p evidence && node scripts/verify-cardnews-topic.mjs --help > evidence/task-3-help.txt 2>&1
    Expected: Command exits 0 and output contains `--topic`, `--expected-slides`, `--screenshot`, and `--assert-downloads`.
    Evidence: evidence/task-3-help.txt

  Scenario: invalid URL fails clearly
    Tool:     bash
    Steps:    mkdir -p evidence && CARDSTUDIO_URL=http://127.0.0.1:9 node scripts/verify-cardnews-topic.mjs --topic "AI 업무 자동화" > evidence/task-3-invalid-url.txt 2>&1
    Expected: Command exits nonzero and output contains `Unable to open Cardstudio URL`.
    Evidence: evidence/task-3-invalid-url.txt
  ```

  Commit: YES | Message: `test(cardnews): add browser verification script` | Files: [`scripts/verify-cardnews-topic.mjs`, `package.json`]

- [ ] 4. Wire topic generation into app state, UI, and restore

  What to do: Finish the dirty app wiring. Use `topicSeed` and `createTopicDraft` to generate a full project, set `brandName`, `projectBadge`, `projectTitle`, `mode`, `presetId`, `themeId`, `cardLayout`, `customColor`, `slides`, `activeSlideId`, notice, and draft-ready state. Ensure Enter key and `초안 만들기` button both work. Update restore validation at `src/App.tsx:619` so saved `sequence` layouts restore instead of silently falling back. Preserve image-upload start via `openGalleryPicker` at `src/App.tsx:638`.
  Must NOT do: Do not remove the image upload path. Do not break App Store mode. Do not persist generated drafts differently from existing drafts.

  Parallelization: Can parallel: NO | Wave 2 | Blocks: [5, 6, 7, 8] | Blocked by: [1, 2]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `src/App.tsx:383` - main `App` state surface.
  - Pattern:  `src/App.tsx:395` - current dirty `topicSeed` state.
  - Pattern:  `src/App.tsx:570` - draft restore function.
  - Pattern:  `src/App.tsx:619` - current restore guard excludes `sequence`.
  - Pattern:  `src/App.tsx:793` - current dirty `createTopicDraft` candidate.
  - Pattern:  `src/App.tsx:989` - topic input UI candidate.
  - API/Type: `src/cardNewsDraft.ts:42` - generated project contract.
  - Test:     `scripts/verify-cardnews-topic.mjs` - browser QA script from Task 3.

  Acceptance criteria (agent-executable only):
  - [ ] `npm run test:cardnews > evidence/task-4-cardnews-tests.txt 2>&1` exits 0.
  - [ ] Browser QA with topic `AI 업무 자동화` sees `01 / 09`, 9 rail cards, and a title containing `AI 업무 자동화`.
  - [ ] Browser QA with blank topic sees fallback copy containing `새로운 주제` and no console errors.
  - [ ] Reload after generating preserves `sequence` cards via existing draft restore.

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: topic input creates a 9-card draft
    Tool:     playwright(real Chrome)
    Steps:    Start dev server with `npm run dev:web -- --host 127.0.0.1 --port 5173`; then run `mkdir -p evidence && CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" CARDSTUDIO_URL=http://127.0.0.1:5173/studio EVIDENCE_DIR=evidence npm run verify:cardnews-topic -- --topic "AI 업무 자동화" --expected-slides 9 --screenshot evidence/task-4-topic-flow.png`
    Expected: Command exits 0; screenshot shows generated cardnews; script log confirms `01 / 09` and 9 slide rail cards.
    Evidence: evidence/task-4-topic-flow.png

  Scenario: empty input falls back without crash
    Tool:     playwright(real Chrome)
    Steps:    With the same dev server running, run `mkdir -p evidence && CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" CARDSTUDIO_URL=http://127.0.0.1:5173/studio EVIDENCE_DIR=evidence npm run verify:cardnews-topic -- --topic "" --expected-slides 9 --screenshot evidence/task-4-empty-topic.png`
    Expected: Command exits 0; log contains `새로운 주제`; browser console has no uncaught errors.
    Evidence: evidence/task-4-empty-topic.png
  ```

  Commit: YES | Message: `feat(app): create topic drafts from the studio start screen` | Files: [`src/App.tsx`]

- [ ] 5. Render Sequence layout as a first-class social card variant

  What to do: Update `SocialSlide` so `sequence` is not treated as generic split layout. Introduce explicit `isSplit = cardLayout === 'split-light' || cardLayout === 'split-dark'` and `isSequence = cardLayout === 'sequence'`. Render a Sequence-specific card structure with visible page numbering, title, list-style/body copy, brand/badge details, and generated SVG/photo element as a controlled design element. Keep `overlay`, `split-light`, and `split-dark` rendering behavior unchanged.
  Must NOT do: Do not make sequence cards depend on uploaded photos. Do not hide the generated copy behind an image overlay. Do not remove existing split layout classes.

  Parallelization: Can parallel: NO | Wave 2 | Blocks: [6, 7, 8] | Blocked by: [2, 4]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `src/App.tsx:2058` - `SocialSlide` component.
  - Pattern:  `src/App.tsx:2082` - current className/background branch treats non-overlay layouts generically.
  - Pattern:  `src/App.tsx:2139` - current `social-content` block includes pagination and copy.
  - Pattern:  `src/App.css:1116` - current social image container styles.
  - Pattern:  `src/App.css:1132` - current social content styles.
  - Test:     `scripts/verify-cardnews-topic.mjs` - should assert visible Sequence content.

  Acceptance criteria (agent-executable only):
  - [ ] Browser QA sees a `sequence` card with `01 / 09` and topic-derived headline visible without needing uploaded images.
  - [ ] Browser QA can click slide 02 and sees list-style description content.
  - [ ] `npm run lint > evidence/task-5-lint.txt 2>&1` exits 0.
  - [ ] Existing split layout buttons still render and remain selectable.

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: generated first card uses Sequence layout
    Tool:     playwright(real Chrome)
    Steps:    Start dev server with `npm run dev:web -- --host 127.0.0.1 --port 5173`; then run `mkdir -p evidence && CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" CARDSTUDIO_URL=http://127.0.0.1:5173/studio EVIDENCE_DIR=evidence npm run verify:cardnews-topic -- --topic "AI 업무 자동화" --expected-slides 9 --screenshot evidence/task-5-sequence-layout.png`
    Expected: Command exits 0; screenshot shows a blue/white Sequence-style first card and visible `01 / 09`.
    Evidence: evidence/task-5-sequence-layout.png

  Scenario: slide 02 body content remains visible
    Tool:     playwright(real Chrome)
    Steps:    Run `mkdir -p evidence && CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" CARDSTUDIO_URL=http://127.0.0.1:5173/studio EVIDENCE_DIR=evidence npm run verify:cardnews-topic -- --topic "AI 업무 자동화" --expected-slides 9 --select-slide 2 --screenshot evidence/task-5-slide-02.png`
    Expected: Command exits 0; screenshot/log shows slide 02 selected and description includes list-style Korean content.
    Evidence: evidence/task-5-slide-02.png
  ```

  Commit: YES | Message: `feat(cardnews): render sequence social cards` | Files: [`src/App.tsx`]

- [ ] 6. Add focused Sequence CSS and responsive polish

  What to do: Add a narrowly scoped CSS block for `.social-slide.sequence-layout` and descendants near the existing social-slide styles. Use a crisp blue/white/yellow system, stable spacing, overflow-safe Korean text, and no nested UI cards. Add only the necessary responsive rule so `.topic-draft-row` and generated card previews fit mobile widths. Keep new CSS small and grouped.
  Must NOT do: Do not scatter Sequence styles across unrelated CSS sections. Do not add decorative gradient orbs. Do not use viewport-scaled font sizes outside the existing canvas-proportional inline sizing. Do not introduce text overlap.

  Parallelization: Can parallel: NO | Wave 2 | Blocks: [7, 8] | Blocked by: [4, 5]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `src/App.css:211` - current topic draft field styles.
  - Pattern:  `src/App.css:1116` - social card visual styles start.
  - Pattern:  `src/App.css:1184` - split layout overrides.
  - Pattern:  `src/App.css:1208` - social copy typography styles.
  - Pattern:  `src/App.css:1694` - mobile responsive block for app shell/editor.
  - Test:     `scripts/verify-cardnews-topic.mjs` - screenshot assertions for desktop/mobile.

  Acceptance criteria (agent-executable only):
  - [ ] Desktop browser QA screenshot shows no overlapping text or cropped button text at 1365x900 viewport.
  - [ ] Mobile browser QA screenshot shows topic input and generated first card fit at 390x844 viewport.
  - [ ] `npm run lint > evidence/task-6-lint.txt 2>&1` exits 0.
  - [ ] CSS diff is limited to topic draft row polish, Sequence layout styles, and responsive coverage.

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: desktop Sequence card is visually stable
    Tool:     playwright(real Chrome)
    Steps:    Start dev server with `npm run dev:web -- --host 127.0.0.1 --port 5173`; then run `mkdir -p evidence && CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" CARDSTUDIO_URL=http://127.0.0.1:5173/studio EVIDENCE_DIR=evidence npm run verify:cardnews-topic -- --topic "AI 업무 자동화" --expected-slides 9 --viewport 1365x900 --screenshot evidence/task-6-desktop.png`
    Expected: Command exits 0; screenshot has no overlapping text and visible first-card content.
    Evidence: evidence/task-6-desktop.png

  Scenario: mobile topic flow remains usable
    Tool:     playwright(real Chrome)
    Steps:    Run `mkdir -p evidence && CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" CARDSTUDIO_URL=http://127.0.0.1:5173/studio EVIDENCE_DIR=evidence npm run verify:cardnews-topic -- --topic "고객 온보딩 개선" --expected-slides 9 --viewport 390x844 --screenshot evidence/task-6-mobile.png`
    Expected: Command exits 0; topic input, generate button, and generated card preview fit without horizontal scrolling.
    Evidence: evidence/task-6-mobile.png
  ```

  Commit: YES | Message: `style(cardnews): polish sequence card layout` | Files: [`src/App.css`]

- [ ] 7. Harden generated-card export/download flow

  What to do: Verify generated SVG data URLs render through the existing offscreen export collection and `html-to-image` path. If needed, adjust generated placeholder SVGs, canvas refs, or Sequence DOM so `toPng` captures nonblank cards. Add browser script support to assert 9 downloads from `전체 PNG 저장` and save downloaded files into an evidence directory. Keep the double-render Safari guard at `src/App.tsx:708`.
  Must NOT do: Do not replace `html-to-image`. Do not change AppsInToss native save behavior in `src/lib/appsInToss.ts:54`. Do not make export depend on the preview modal being open.

  Parallelization: Can parallel: NO | Wave 3 | Blocks: [8] | Blocked by: [3, 4, 5, 6]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `src/App.tsx:697` - existing `handleExportAll` loop.
  - Pattern:  `src/App.tsx:709` - first `toPng` pre-render with `cacheBust: false`, `pixelRatio: 1`.
  - Pattern:  `src/App.tsx:714` - final `toPng` call.
  - Pattern:  `src/App.tsx:719` - browser/native save adapter call.
  - Pattern:  `src/lib/appsInToss.ts:54` - `savePngDataUrl` browser/native branch.
  - External: `https://github.com/bubkoo/html-to-image` - `toPng`, `cacheBust`, and `pixelRatio` option behavior.

  Acceptance criteria (agent-executable only):
  - [ ] Browser export QA downloads exactly 9 PNG files for generated topic draft.
  - [ ] Each downloaded PNG has nonzero byte size.
  - [ ] Browser export QA log contains `모든 슬라이드 저장을 마쳤어요.`.
  - [ ] `npm run build:web > evidence/task-7-build-web.txt 2>&1` exits 0.

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: generated draft exports all 9 PNGs
    Tool:     playwright(real Chrome)
    Steps:    Start dev server with `npm run dev:web -- --host 127.0.0.1 --port 5173`; then run `mkdir -p evidence/task-7-downloads && CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" CARDSTUDIO_URL=http://127.0.0.1:5173/studio EVIDENCE_DIR=evidence npm run verify:cardnews-topic -- --topic "AI 업무 자동화" --expected-slides 9 --assert-downloads 9 --downloads-dir evidence/task-7-downloads --screenshot evidence/task-7-export.png`
    Expected: Command exits 0; exactly 9 PNG files exist under `evidence/task-7-downloads` and each file size is greater than 0.
    Evidence: evidence/task-7-export.png

  Scenario: blank-topic generated draft also exports
    Tool:     playwright(real Chrome)
    Steps:    Run `mkdir -p evidence/task-7-empty-downloads && CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" CARDSTUDIO_URL=http://127.0.0.1:5173/studio EVIDENCE_DIR=evidence npm run verify:cardnews-topic -- --topic "" --expected-slides 9 --assert-downloads 9 --downloads-dir evidence/task-7-empty-downloads --screenshot evidence/task-7-empty-export.png`
    Expected: Command exits 0; exactly 9 PNG files exist and log contains fallback topic `새로운 주제`.
    Evidence: evidence/task-7-empty-export.png
  ```

  Commit: YES | Message: `test(cardnews): verify generated PNG export` | Files: [`scripts/verify-cardnews-topic.mjs`, `src/App.tsx`, `src/cardNewsDraft.ts`]

- [ ] 8. Update docs, clean generated debris, and prepare commits

  What to do: Update README MVP notes so it no longer claims the current version is image-input only. Add concise usage docs for topic-only generation, blank fallback, image-start fallback, and export. Remove generated `.tmp-cardnews-test/` outputs from the worktree if present after adding ignore rules. Confirm every planned commit has only logical files and no evidence artifacts.
  Must NOT do: Do not add marketing copy unrelated to the feature. Do not commit evidence artifacts, downloads, screenshots, or node_modules.

  Parallelization: Can parallel: NO | Wave 3 | Blocks: [] | Blocked by: [1, 2, 3, 4, 5, 6, 7]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `README.md:1` - current project overview.
  - Pattern:  `README.md:50` - current MVP section says only image input is supported.
  - Pattern:  `.gitignore:1` - generated output ignore conventions.
  - Pattern:  `docs/progress.md:1` - optional progress note location if already maintained.
  - Test:     `package.json:6` - final scripts should expose test/verify commands.

  Acceptance criteria (agent-executable only):
  - [ ] `README.md` describes topic-only generation and no longer states image input is the only supported input.
  - [ ] `git status --short > evidence/task-8-final-status.txt` contains no `.tmp-cardnews-test/`, `evidence/`, or downloaded PNG artifacts.
  - [ ] `npm run lint > evidence/task-8-lint.txt 2>&1` exits 0.
  - [ ] `npm run build:web > evidence/task-8-build-web.txt 2>&1` exits 0.

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: docs reflect feature scope
    Tool:     bash
    Steps:    mkdir -p evidence && rg -n "주제|초안|이미지 입력만" README.md > evidence/task-8-readme-scope.txt
    Expected: Output includes topic/draft usage text and does not include a stale claim that the current version only supports image input.
    Evidence: evidence/task-8-readme-scope.txt

  Scenario: final local gates pass before final verification
    Tool:     bash
    Steps:    mkdir -p evidence && npm run test:cardnews > evidence/task-8-test-cardnews.txt 2>&1 && npm run lint > evidence/task-8-lint.txt 2>&1 && npm run build:web > evidence/task-8-build-web.txt 2>&1
    Expected: All commands exit 0.
    Evidence: evidence/task-8-build-web.txt
  ```

  Commit: YES | Message: `docs(cardnews): document topic draft generation` | Files: [`README.md`, `.gitignore`, `package.json`]

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
- Reference the plan file path in the final commit footer: `Plan: plans/cardnews-topic-draft.md`.

## Success criteria
- All Must-Have shipped; all QA scenarios pass with captured evidence; F1-F4 approved; commit history clean.

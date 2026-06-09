# Cardnews Sequence Template Refresh

## TL;DR
> Summary:      Refresh the direct/manual `카드뉴스` sequence template with test-first data-model changes, visible uploaded-logo rendering, split title/content fields, and a blue outer / white inner card composition matching the provided reference brief.
> Deliverables:
> - Repaired repeatable cardnews test harness from the current dirty baseline
> - `content1` / `content2` slide data model with legacy `description` fallback
> - Direct/manual card creation that no longer seeds or renders `Manual Card News` / `직접 만든 카드뉴스`
> - Sequence renderer with uploaded logo/avatar, brand name, divider, kicker, title, middle content, and lower emphasis box
> - Editor labels and inputs for `제목`, `내용1`, `내용2`
> - Real Chrome browser QA script and captured evidence for manual sequence creation, logo upload, text editing, and export
> Effort:       Medium
> Risk:         High - the worktree is already dirty, `src/App.tsx` is a large shared surface, and the current untracked `src/cardNewsDraft.test.ts` is syntactically broken.

## Scope
### Must have
- Preserve and document the current dirty worktree before implementation. Based on exploration, `git status --short` currently shows modified `.gitignore`, `src/App.css`, `src/App.tsx`, `src/index.css`, `tsconfig.app.json`, plus untracked `.omo/`, `artifacts/ulw/`, `plans/`, `src/cardNewsDraft.ts`, `src/cardNewsDraft.test.ts`, `src/creationFlow.ts`, `src/creationFlow.test.ts`, and `tsconfig.cardnews-test.json`.
- Repair the current cardnews test harness before feature code. `src/cardNewsDraft.test.ts:3` currently starts an import from `./cardNewsDraft.js`, but `src/cardNewsDraft.test.ts:9` has a duplicate `} from './cardNewsDraft'` line.
- Add tests first for the new split body behavior, then implement. `SlideDraft` currently has only `description` at `src/App.tsx:43`, and `GeneratedSlideDraft` currently has only `description` at `src/cardNewsDraft.ts:5`.
- Introduce `content1` and `content2` for sequence/manual cards while keeping `description` as a backward-compatible legacy field or fallback so existing social/appstore rendering does not break.
- Change direct/manual card creation so it does not set `projectBadge` to `Manual Card News` or `projectTitle` to `직접 만든 카드뉴스`; those values are currently seeded at `src/App.tsx:967` and `src/App.tsx:968`.
- Make uploaded logo visible in the `카드뉴스` sequence card. `appIcon` is available in `SlideCanvasProps` at `src/App.tsx:2675`, but `SocialSlide` does not destructure it at `src/App.tsx:2744`, does not pass it to `SequenceSlide` at `src/App.tsx:2769`, and `SequenceSlide` currently renders only brand text at `src/App.tsx:2931`.
- Redesign the sequence card layout to the described structure: blue outer background, rounded white inner card, top logo/avatar + brand name, divider, small kicker, large title, `content1` centered in the middle, and `content2` in a lower light-blue emphasis box.
- Update the editor at `src/App.tsx:2103` so the visible text sections are `제목`, `내용1`, and `내용2`, with `content1` rendered in the middle body and `content2` rendered in the lower emphasis box.
- Update manual card list summaries so they show the new content model; they currently read `slide.description || '본문'` at `src/App.tsx:1638`.
- Update the sequence template preview and default accents so the `카드뉴스` option reads blue, not orange. `DIRECT_TEMPLATE_OPTIONS` currently gives manual sequence `#f15a24` at `src/creationFlow.ts:129`, and preview CSS for sequence cards starts at `src/App.css:672`.

### Must NOT have (guardrails, anti-slop, scope boundaries)
- Do not revert or delete existing dirty/untracked user work unless the executor has proven it is generated debris and records evidence.
- Do not add a backend, LLM/API call, or network dependency.
- Do not add Vitest, Jest, React Testing Library, or another test framework unless the executor first proves plain `node:test` plus browser QA cannot cover the behavior.
- Do not remove existing auto-generation, image upload, non-sequence layouts, App Store mode, local draft restore, or PNG export behavior.
- Do not render `직접 만든 카드뉴스`, `Manual Card News`, or close variants in any sequence card header/footer/body after the feature is complete.
- Do not rely on human visual inspection as pass/fail; browser QA must assert DOM/text/style conditions and save screenshots as evidence.
- Do not make a landing-page redesign, intro page edit, terms page edit, or unrelated theme overhaul.
- Do not introduce decorative blobs/orbs or a one-hue-only palette; the sequence template may be primarily blue but needs white and light-blue structure with clear text contrast.

## Verification strategy
> Zero human intervention - all verification is agent-executed.
- Test decision: TDD + existing TypeScript compile to `node:test`; browser QA with Playwright Core driving real Chrome.
- QA policy: every task has agent-executed scenarios
- Evidence: `evidence/task-<N>-<slug>.<ext>`

## Execution strategy
### Parallel execution waves
> Target 5-8 tasks per wave. <3 per wave (except final) = under-splitting.
> Extract shared dependencies as Wave-1 tasks to maximize parallelism.

Wave 1 (no dependencies):
- Task 1: Repair and lock the cardnews test harness
- Task 2: Add split-content model helpers with red tests
- Task 3: Add browser QA scaffold for the manual sequence flow

Wave 2 (after Wave 1):
- Task 4: depends [1, 2] - Thread split content through app draft creation and restore
- Task 5: depends [2, 4] - Replace editor body field with title/content1/content2 controls
- Task 6: depends [2, 4] - Render uploaded logo and clean sequence header/footer copy
- Task 7: depends [3, 4, 5, 6] - Redesign sequence markup, CSS, preview accents, and responsive layout

Wave 3 (after Wave 2):
- Task 8: depends [1, 2, 3, 4, 5, 6, 7] - Execute full browser QA, export check, and cleanup

Critical path: Task 1 -> Task 2 -> Task 4 -> Task 5 -> Task 7 -> Task 8

### Dependency matrix
| Task | Depends on | Blocks | Can parallelize with |
|------|------------|--------|----------------------|
| 1    | none       | 2, 4, 8 | 3 |
| 2    | 1          | 4, 5, 6, 7, 8 | 3 after Task 1 red evidence |
| 3    | none       | 7, 8 | 1, 2 |
| 4    | 1, 2       | 5, 6, 7, 8 | 6 with `src/App.tsx` section coordination |
| 5    | 2, 4       | 7, 8 | 6 with `src/App.tsx` section coordination |
| 6    | 2, 4       | 7, 8 | 5 with `src/App.tsx` section coordination |
| 7    | 3, 4, 5, 6 | 8 | none |
| 8    | 1, 2, 3, 4, 5, 6, 7 | none | none |

## Todos
> Implementation + Test = ONE task. Never separate.
> Every task MUST have: References + Acceptance Criteria + QA Scenarios + Commit.

- [ ] 1. Repair And Lock The Cardnews Test Harness

  What to do: Capture the dirty baseline first. Repair `src/cardNewsDraft.test.ts` and `src/creationFlow.test.ts` so they compile under `tsconfig.cardnews-test.json`; because the compiled tests run in Node, sibling imports should remain `./cardNewsDraft.js` and `./creationFlow.js`. Add `test:cardnews:compile` and `test:cardnews` scripts that compile to `.tmp-cardnews-test` and run `node --test .tmp-cardnews-test/*.test.js`. Add `evidence/` to `.gitignore` if absent; `.tmp-cardnews-test` is already ignored at `.gitignore:13`. Before implementing new feature logic, add the first failing tests for `content1` / `content2`, phrase removal, and logo/header model, then capture red evidence.
  Must NOT do: Do not modify `src/App.tsx` or `src/App.css` in this task. Do not hide the current broken test import by deleting the affected tests.

  Parallelization: Can parallel: YES | Wave 1 | Blocks: [2, 4, 8] | Blocked by: []

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `src/cardNewsDraft.test.ts:1` - existing `node:assert/strict` and `node:test` style.
  - Pattern:  `src/creationFlow.test.ts:1` - same `node:test` style for flow constants.
  - Bug:      `src/cardNewsDraft.test.ts:3` - current import starts with `./cardNewsDraft.js`.
  - Bug:      `src/cardNewsDraft.test.ts:9` - duplicate extensionless import line currently makes the file invalid.
  - Test:     `tsconfig.cardnews-test.json:1` - dedicated NodeNext test compile config.
  - Test:     `.gitignore:13` - `.tmp-cardnews-test` is already ignored.
  - API/Type: `package.json:6` - scripts currently include dev/build/lint but no test script.
  - External: `https://nodejs.org/api/test.html` - Node test runner command and `node --test` behavior.

  Acceptance criteria (agent-executable only):
  - [ ] `mkdir -p evidence && git status --short > evidence/task-1-dirty-baseline.txt` captures the initial dirty state before edits.
  - [ ] `npm run test:cardnews:compile > evidence/task-1-compile.txt 2>&1` exits 0.
  - [ ] `npm run test:cardnews > evidence/task-1-current-tests.txt 2>&1` exits 0 after repairing imports.
  - [ ] `npm run test:cardnews > evidence/task-1-red-split-content.txt 2>&1` exits nonzero before feature implementation, and the evidence names the missing split-content/header behavior rather than a syntax/import failure.
  - [ ] `git status --short` does not list `.tmp-cardnews-test/` or `evidence/` after running tests.

  QA scenarios (MANDATORY - task incomplete without these):
  > Name the exact tool AND its exact invocation - not "verify it works". Browser use: use Chrome to drive the page; if Chrome is not available, download and use agent-browser (https://github.com/vercel-labs/agent-browser). Computer use: OS-level GUI automation for a non-browser desktop app.
  ```text
  Scenario: repaired harness compiles and runs current tests
    Tool:     bash
    Steps:    mkdir -p evidence
              npm run test:cardnews:compile > evidence/task-1-compile.txt 2>&1
              npm run test:cardnews > evidence/task-1-current-tests.txt 2>&1
    Expected: Both commands exit 0; evidence includes node:test pass output.
    Evidence: evidence/task-1-current-tests.txt

  Scenario: new split-content tests fail for the right reason before implementation
    Tool:     bash
    Steps:    npm run test:cardnews > evidence/task-1-red-split-content.txt 2>&1
    Expected: Command exits nonzero; evidence mentions missing `content1` / `content2` or header model behavior, not syntax/import errors.
    Evidence: evidence/task-1-red-split-content.txt
  ```

  Commit: YES | Message: `test(cardnews): repair sequence test harness` | Files: [`package.json`, `.gitignore`, `src/cardNewsDraft.test.ts`, `src/creationFlow.test.ts`, `tsconfig.cardnews-test.json`]

- [ ] 2. Add Split-Content Model Helpers With Red Tests

  What to do: In `src/cardNewsDraft.ts`, add pure helpers for the new content contract, then make the tests from Task 1 green. Recommended helpers: `splitCardNewsSections(legacyDescription: string)`, `createSequenceHeaderModel({ appIcon, brandName, slideIndex, totalSlides })`, and `getManualCardNewsProjectText(brandName)`. `splitCardNewsSections` should produce deterministic `content1` and `content2` from legacy text so restored/generated slides remain compatible. `getManualCardNewsProjectText` should return brand-safe defaults that do not contain `직접 만든 카드뉴스` or `Manual Card News`. `createSequenceHeaderModel` should return a logo image slot when `appIcon` exists and a text/avatar fallback when it does not.
  Must NOT do: Do not import React or browser APIs into `src/cardNewsDraft.ts`. Do not make the helpers depend on current date/time except for existing generated IDs where already stable.

  Parallelization: Can parallel: YES | Wave 1 | Blocks: [4, 5, 6, 7, 8] | Blocked by: [1]

  References (executor has NO interview context - be exhaustive):
  - API/Type: `src/cardNewsDraft.ts:5` - `GeneratedSlideDraft` currently has `description`, but no `content1` / `content2`.
  - API/Type: `src/cardNewsDraft.ts:33` - internal `SlideCopy` currently has `description`, but no split fields.
  - Pattern:  `src/cardNewsDraft.ts:53` - pure deterministic `generateCardNewsDraft` entry point.
  - Pattern:  `src/cardNewsDraft.ts:78` - whitespace normalization helper style.
  - Pattern:  `src/cardNewsDraft.test.ts:1` - test style to extend.
  - External: `https://nodejs.org/api/test.html` - keep using `node:test` assertions.

  Acceptance criteria (agent-executable only):
  - [ ] `npm run test:cardnews > evidence/task-2-split-model-tests.txt 2>&1` exits 0.
  - [ ] `node --input-type=module -e "import('./.tmp-cardnews-test/cardNewsDraft.js').then((m) => { const s = m.splitCardNewsSections('첫 내용\\n\\n둘째 내용'); if (s.content1 !== '첫 내용' || s.content2 !== '둘째 내용') throw new Error(JSON.stringify(s)); })"` exits 0 after `npm run test:cardnews`.
  - [ ] `node --input-type=module -e "import('./.tmp-cardnews-test/cardNewsDraft.js').then((m) => { const t = JSON.stringify(m.getManualCardNewsProjectText('내 브랜드')); if (/직접 만든 카드뉴스|Manual Card News/.test(t)) throw new Error(t); })"` exits 0 after `npm run test:cardnews`.
  - [ ] `node --input-type=module -e "import('./.tmp-cardnews-test/cardNewsDraft.js').then((m) => { const h = m.createSequenceHeaderModel({ appIcon: 'data:image/png;base64,AA==', brandName: '내 브랜드', slideIndex: 0, totalSlides: 3 }); if (h.logo.kind !== 'image' || h.brandName !== '내 브랜드' || h.pagination !== '01 / 03') throw new Error(JSON.stringify(h)); })"` exits 0 after `npm run test:cardnews`.

  QA scenarios (MANDATORY - task incomplete without these):
  ```text
  Scenario: split-content helper separates middle and emphasis text
    Tool:     bash
    Steps:    mkdir -p evidence
              npm run test:cardnews > evidence/task-2-split-model-tests.txt 2>&1
    Expected: Command exits 0 and evidence includes passing tests for `splitCardNewsSections`.
    Evidence: evidence/task-2-split-model-tests.txt

  Scenario: manual project helper rejects direct-cardnews placeholder phrases
    Tool:     bash
    Steps:    node --input-type=module -e "import('./.tmp-cardnews-test/cardNewsDraft.js').then((m) => { const t = JSON.stringify(m.getManualCardNewsProjectText('내 브랜드')); if (/직접 만든 카드뉴스|Manual Card News/.test(t)) throw new Error(t); console.log(t); })" > evidence/task-2-manual-copy.txt
    Expected: Command exits 0 and evidence JSON contains `내 브랜드` without forbidden phrases.
    Evidence: evidence/task-2-manual-copy.txt
  ```

  Commit: YES | Message: `feat(cardnews): model split sequence content` | Files: [`src/cardNewsDraft.ts`, `src/cardNewsDraft.test.ts`]

- [ ] 3. Add Browser QA Scaffold For The Manual Sequence Flow

  What to do: Add `scripts/verify-cardnews-template.mjs` and a `verify:cardnews-template` script. The script should use `playwright-core` like `scripts/record-iran-cardnews.mjs:1`, launch real Chrome from `CHROME_PATH` or `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`, open `CARDSTUDIO_URL` defaulting to `http://127.0.0.1:4184/`, and support at least `--scenario smoke`, `--scenario manual-sequence`, and `--scenario logo-upload`. In smoke mode, it should only prove the page loads and that the direct/manual start controls exist. In failure mode, an invalid URL should exit nonzero with `Unable to open Cardstudio URL`.
  Must NOT do: Do not start the dev server inside this script. Do not use private browser profile state. Do not make screenshots the only assertion.

  Parallelization: Can parallel: YES | Wave 1 | Blocks: [7, 8] | Blocked by: []

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `scripts/record-iran-cardnews.mjs:1` - Playwright Core import and Chrome launch style.
  - Pattern:  `scripts/record-iran-cardnews.mjs:23` - locator helper style.
  - UI:       `src/App.tsx:1198` - creation mode tablist uses buttons named `자동 생성` and `직접 생성`.
  - UI:       `src/App.tsx:1221` - start mode cards are visible before selecting a mode.
  - UI:       `src/creationFlow.ts:37` - start mode option titles are `자동 생성` and `직접 생성`.
  - API/Type: `package.json:32` - `playwright-core` is already installed.
  - External: `https://playwright.dev/docs/browsers` - browser executable/channel behavior.

  Acceptance criteria (agent-executable only):
  - [ ] `node scripts/verify-cardnews-template.mjs --help > evidence/task-3-help.txt 2>&1` exits 0 and lists all scenarios.
  - [ ] `CARDSTUDIO_URL=http://127.0.0.1:1 node scripts/verify-cardnews-template.mjs --scenario smoke > evidence/task-3-invalid-url.txt 2>&1` exits nonzero and evidence includes `Unable to open Cardstudio URL`.
  - [ ] `node -e "const fs=require('fs'); const s=fs.readFileSync('package.json','utf8'); if(!s.includes('verify:cardnews-template')) throw new Error('missing script');"` exits 0.

  QA scenarios (MANDATORY - task incomplete without these):
  ```text
  Scenario: browser QA script documents scenarios
    Tool:     bash
    Steps:    mkdir -p evidence
              node scripts/verify-cardnews-template.mjs --help > evidence/task-3-help.txt 2>&1
    Expected: Command exits 0 and evidence includes `manual-sequence`, `logo-upload`, and `smoke`.
    Evidence: evidence/task-3-help.txt

  Scenario: browser QA script reports invalid app URL clearly
    Tool:     bash
    Steps:    CARDSTUDIO_URL=http://127.0.0.1:1 node scripts/verify-cardnews-template.mjs --scenario smoke > evidence/task-3-invalid-url.txt 2>&1
    Expected: Command exits nonzero and evidence includes `Unable to open Cardstudio URL`.
    Evidence: evidence/task-3-invalid-url.txt
  ```

  Commit: YES | Message: `test(cardnews): add sequence browser verification script` | Files: [`package.json`, `scripts/verify-cardnews-template.mjs`]

- [ ] 4. Thread Split Content Through App Draft Creation And Restore

  What to do: Update `SlideDraft` in `src/App.tsx:43` to include `content1` and `content2`. Update `createSlideDraft()` at `src/App.tsx:3130`, `createManualSlideDraft()` at `src/App.tsx:3147`, and `normalizeSlideDraft()` at `src/App.tsx:3175` so every slide has both new fields. For legacy restored slides, use `splitCardNewsSections(slide.description || fallbackCopy.description)`. Keep `description` available as a compatibility mirror for non-sequence layouts and export paths until a broader refactor removes it. Change `createManualCard()` at `src/App.tsx:946` to use `getManualCardNewsProjectText(normalizedBrandName)` instead of hard-coded `Manual Card News` and `직접 만든 카드뉴스`.
  Must NOT do: Do not remove `description` outright. Do not break existing generated slides, saved drafts, or non-sequence rendering paths that still read `slide.description`.

  Parallelization: Can parallel: YES | Wave 2 | Blocks: [5, 6, 7, 8] | Blocked by: [1, 2]

  References (executor has NO interview context - be exhaustive):
  - API/Type: `src/App.tsx:43` - `SlideDraft` shape to extend.
  - API/Type: `src/App.tsx:58` - `ProjectDraft` restore payload contains `slides`.
  - Pattern:  `src/App.tsx:583` - autosave writes `slides`.
  - Pattern:  `src/App.tsx:652` - restore flow for project-level fields.
  - Bug:      `src/App.tsx:967` - current manual badge is `Manual Card News`.
  - Bug:      `src/App.tsx:968` - current manual project title is `직접 만든 카드뉴스`.
  - Pattern:  `src/App.tsx:3130` - uploaded-image slide draft factory.
  - Pattern:  `src/App.tsx:3147` - manual slide draft factory.
  - Pattern:  `src/App.tsx:3175` - normalization point for restored slides.
  - API/Type: `src/cardNewsDraft.ts:53` - generated project is imported into App.
  - External: `https://react.dev/reference/react-dom/components/textarea` - controlled text values must stay strings with synchronous `onChange` updates.

  Acceptance criteria (agent-executable only):
  - [ ] Write/extend tests first so `npm run test:cardnews > evidence/task-4-red-app-model.txt 2>&1` fails before implementation for missing split content, not syntax/import errors.
  - [ ] `npm run test:cardnews > evidence/task-4-cardnews-tests.txt 2>&1` exits 0 after implementation.
  - [ ] `npx tsc --noEmit -p tsconfig.app.json > evidence/task-4-app-typecheck.txt 2>&1` exits 0.
  - [ ] `node -e "const fs=require('fs'); const s=fs.readFileSync('src/App.tsx','utf8'); if(/setProjectBadge\\('Manual Card News'\\)|setProjectTitle\\('직접 만든 카드뉴스'\\)/.test(s)) throw new Error('forbidden manual placeholders remain');"` exits 0.

  QA scenarios (MANDATORY - task incomplete without these):
  ```text
  Scenario: app model type-checks with split fields
    Tool:     bash
    Steps:    mkdir -p evidence
              npx tsc --noEmit -p tsconfig.app.json > evidence/task-4-app-typecheck.txt 2>&1
    Expected: Command exits 0 with no missing `content1` / `content2` field errors.
    Evidence: evidence/task-4-app-typecheck.txt

  Scenario: forbidden direct-cardnews seed phrases are removed
    Tool:     bash
    Steps:    node -e "const fs=require('fs'); const s=fs.readFileSync('src/App.tsx','utf8'); if(/setProjectBadge\\('Manual Card News'\\)|setProjectTitle\\('직접 만든 카드뉴스'\\)/.test(s)) throw new Error('forbidden manual placeholders remain'); console.log('manual placeholders removed');" > evidence/task-4-placeholder-removal.txt
    Expected: Command exits 0 and evidence says `manual placeholders removed`.
    Evidence: evidence/task-4-placeholder-removal.txt
  ```

  Commit: YES | Message: `feat(cardnews): thread split content through drafts` | Files: [`src/App.tsx`, `src/cardNewsDraft.ts`, `src/cardNewsDraft.test.ts`]

- [ ] 5. Replace Editor Body Field With Title Content1 Content2 Controls

  What to do: Update `updateSlideField()` at `src/App.tsx:1038` to allow `content1` and `content2`. Replace the current editor text fields at `src/App.tsx:2103` so users see `제목`, `내용1`, and `내용2`; keep `상단 라벨` only if it still maps to the small kicker in the reference layout. Bind the new textareas to `activeSlide.content1` and `activeSlide.content2`, with controlled string values and immediate preview updates. Update manual card list summary at `src/App.tsx:1626` so it shows `content1` or a clear Korean placeholder instead of `description || '본문'`.
  Must NOT do: Do not leave a visible single `본문` field for the sequence/manual editing surface. Do not create uncontrolled textareas.

  Parallelization: Can parallel: YES | Wave 2 | Blocks: [7, 8] | Blocked by: [2, 4]

  References (executor has NO interview context - be exhaustive):
  - API/Type: `src/App.tsx:1038` - slide text field updater whitelist.
  - UI:       `src/App.tsx:2103` - current editor text field block.
  - UI:       `src/App.tsx:2121` - current single `본문` label to replace.
  - UI:       `src/App.tsx:1626` - manual slide list summary.
  - Pattern:  `src/App.tsx:2106` - controlled input pattern.
  - Pattern:  `src/App.tsx:2122` - controlled textarea pattern.
  - External: `https://react.dev/reference/react-dom/components/input` - controlled input contract.
  - External: `https://react.dev/reference/react-dom/components/textarea` - controlled textarea contract and label guidance.

  Acceptance criteria (agent-executable only):
  - [ ] `npx tsc --noEmit -p tsconfig.app.json > evidence/task-5-app-typecheck.txt 2>&1` exits 0.
  - [ ] `node -e "const fs=require('fs'); const s=fs.readFileSync('src/App.tsx','utf8'); for (const token of ['내용1','내용2','activeSlide.content1','activeSlide.content2',\"updateSlideField(activeSlide.id, 'content1'\", \"updateSlideField(activeSlide.id, 'content2'\"]) if(!s.includes(token)) throw new Error(token); if(/<span>본문<\\/span>/.test(s)) throw new Error('visible single body field remains');"` exits 0.
  - [ ] `CARDSTUDIO_URL=http://127.0.0.1:4184/ node scripts/verify-cardnews-template.mjs --scenario manual-sequence --assert-editor-fields > evidence/task-5-browser-fields.txt 2>&1` exits 0 with a running dev server.

  QA scenarios (MANDATORY - task incomplete without these):
  ```text
  Scenario: editor exposes title, content1, and content2 fields
    Tool:     bash
    Steps:    CARDSTUDIO_URL=http://127.0.0.1:4184/ node scripts/verify-cardnews-template.mjs --scenario manual-sequence --assert-editor-fields > evidence/task-5-browser-fields.txt 2>&1
    Expected: Command exits 0; evidence states `제목`, `내용1`, and `내용2` fields were filled and reflected in the live preview.
    Evidence: evidence/task-5-browser-fields.txt

  Scenario: old single body label is absent from editor source
    Tool:     bash
    Steps:    node -e "const fs=require('fs'); const s=fs.readFileSync('src/App.tsx','utf8'); if(/<span>본문<\\/span>/.test(s)) throw new Error('visible single body field remains'); console.log('single body label absent');" > evidence/task-5-no-body-label.txt
    Expected: Command exits 0 and evidence says `single body label absent`.
    Evidence: evidence/task-5-no-body-label.txt
  ```

  Commit: YES | Message: `feat(cardnews): split manual editor copy fields` | Files: [`src/App.tsx`, `scripts/verify-cardnews-template.mjs`]

- [ ] 6. Render Uploaded Logo And Clean Sequence Header Footer Copy

  What to do: Pass `appIcon` from `SocialSlide` into `SequenceSlide`. Update `SequenceSlide` props at `src/App.tsx:2895` to include `appIcon`, call `createSequenceHeaderModel`, and render an image logo when uploaded. Add a small fallback avatar/initial mark when no logo exists. Make the sequence header show logo/avatar + brand name and pagination. Make the footer avoid `projectTitle` if it is a direct/manual placeholder or if the sequence design no longer needs a footer. If keeping a footer, use brand-safe slide metadata only.
  Must NOT do: Do not render an empty broken `<img>`. Do not use `projectTitle` as a backdoor for `직접 만든 카드뉴스`. Do not hide the uploaded logo behind CSS with zero size, opacity, or overflow clipping.

  Parallelization: Can parallel: YES | Wave 2 | Blocks: [7, 8] | Blocked by: [2, 4]

  References (executor has NO interview context - be exhaustive):
  - API/Type: `src/App.tsx:2675` - `SlideCanvasProps` already includes `appIcon?: string | null`.
  - Flow:     `src/App.tsx:2728` - `SlideCanvas` passes `appIcon` into `SocialSlide`.
  - Bug:      `src/App.tsx:2744` - `SocialSlide` currently does not destructure `appIcon`.
  - Bug:      `src/App.tsx:2769` - `SequenceSlide` call currently omits `appIcon`.
  - Bug:      `src/App.tsx:2931` - sequence header currently renders brand text only.
  - Bug:      `src/App.tsx:2953` - footer currently renders date/brand and `slide.badge`/`projectTitle`.
  - Pattern:  `src/App.tsx:3008` - App Store slide already renders `appIcon` with an `<img>`.
  - Style:    `src/App.css:2659` - `.sequence-logo` currently styles text only.
  - External: `https://developer.mozilla.org/en-US/docs/Web/CSS/object-fit` - use `object-fit: contain` or `cover` for logo sizing.

  Acceptance criteria (agent-executable only):
  - [ ] `npm run test:cardnews > evidence/task-6-header-model-tests.txt 2>&1` exits 0 and includes uploaded-logo header model coverage.
  - [ ] `npx tsc --noEmit -p tsconfig.app.json > evidence/task-6-app-typecheck.txt 2>&1` exits 0.
  - [ ] `CARDSTUDIO_URL=http://127.0.0.1:4184/ node scripts/verify-cardnews-template.mjs --scenario logo-upload --logo branding/app-logo-600.png > evidence/task-6-logo-browser.txt 2>&1` exits 0 with a running dev server.
  - [ ] The browser evidence asserts an `.sequence-brand-logo img` or equivalent visible image has nonzero width and height.

  QA scenarios (MANDATORY - task incomplete without these):
  ```text
  Scenario: uploaded logo appears in sequence header
    Tool:     playwright(real Chrome)
    Steps:    CARDSTUDIO_URL=http://127.0.0.1:4184/ node scripts/verify-cardnews-template.mjs --scenario logo-upload --logo branding/app-logo-600.png > evidence/task-6-logo-browser.txt 2>&1
    Expected: Command exits 0; evidence includes nonzero logo bounding box and screenshot path.
    Evidence: evidence/task-6-logo-browser.txt

  Scenario: sequence card does not render forbidden manual placeholders
    Tool:     bash
    Steps:    node -e "const fs=require('fs'); const s=fs.readFileSync('src/App.tsx','utf8'); if(/SequenceSlide[\\s\\S]*직접 만든 카드뉴스|SequenceSlide[\\s\\S]*Manual Card News/.test(s)) throw new Error('forbidden placeholder in SequenceSlide'); console.log('sequence placeholders absent');" > evidence/task-6-no-sequence-placeholders.txt
    Expected: Command exits 0 and evidence says `sequence placeholders absent`.
    Evidence: evidence/task-6-no-sequence-placeholders.txt
  ```

  Commit: YES | Message: `feat(cardnews): show uploaded logo in sequence cards` | Files: [`src/App.tsx`, `src/App.css`, `src/cardNewsDraft.ts`, `src/cardNewsDraft.test.ts`, `scripts/verify-cardnews-template.mjs`]

- [ ] 7. Redesign Sequence Markup CSS Preview Accents And Responsive Layout

  What to do: Update `SequenceSlide` markup and `.sequence-*` CSS so the card matches the reference brief: blue outer background; rounded white inner card; header logo/avatar + brand; divider; small kicker; big title; centered `content1`; lower light-blue `content2` emphasis box. Update `.template-layout-preview.sequence` at `src/App.css:672` so the layout picker reflects the new blue/white design. Update `DIRECT_TEMPLATE_OPTIONS` and, if shared sequence rendering makes it necessary, `AUTO_TEMPLATE_OPTIONS` so `카드뉴스` defaults to blue (`#1247d8` or the app’s existing blue) instead of orange. Ensure text is contained on desktop and mobile previews.
  Must NOT do: Do not place the card inside a decorative outer card in the app shell; only the generated sequence canvas should have the rounded inner card. Do not use negative letter spacing or viewport-scaled font sizes. Do not obscure the logo or text with the emphasis box.

  Parallelization: Can parallel: NO | Wave 2 | Blocks: [8] | Blocked by: [3, 4, 5, 6]

  References (executor has NO interview context - be exhaustive):
  - UI:       `src/App.tsx:2895` - `SequenceSlide` component to restructure.
  - UI:       `src/App.tsx:2941` - current sequence main content block.
  - Style:    `src/App.css:2622` - sequence slide root styles.
  - Style:    `src/App.css:2627` - cover currently uses solid accent background.
  - Style:    `src/App.css:2632` - detail currently uses white background.
  - Style:    `src/App.css:2671` - sequence main positioning.
  - Style:    `src/App.css:2710` - current single `.sequence-description` emphasis style.
  - Preview:  `src/App.css:672` - sequence template preview styles.
  - Options:  `src/creationFlow.ts:95` - auto sequence template option.
  - Options:  `src/creationFlow.ts:129` - manual sequence template option.
  - External: `https://developer.mozilla.org/en-US/docs/Web/CSS/object-fit` - logo image fit.

  Acceptance criteria (agent-executable only):
  - [ ] `npm run lint > evidence/task-7-lint.txt 2>&1` exits 0.
  - [ ] `npm run build > evidence/task-7-build.txt 2>&1` exits 0.
  - [ ] `node -e "const fs=require('fs'); const css=fs.readFileSync('src/App.css','utf8'); for (const token of ['sequence-inner-card','sequence-divider','sequence-content-primary','sequence-content-emphasis','sequence-brand-logo']) if(!css.includes(token)) throw new Error(token); if(/letter-spacing:\\s*-/.test(css.match(/\\.sequence[\\s\\S]*/)?.[0]||'')) throw new Error('negative sequence letter spacing');"` exits 0.
  - [ ] `CARDSTUDIO_URL=http://127.0.0.1:4184/ node scripts/verify-cardnews-template.mjs --scenario manual-sequence --assert-layout --screenshot evidence/task-7-manual-sequence.png > evidence/task-7-browser-layout.txt 2>&1` exits 0 with a running dev server.

  QA scenarios (MANDATORY - task incomplete without these):
  ```text
  Scenario: sequence layout matches required structure
    Tool:     playwright(real Chrome)
    Steps:    CARDSTUDIO_URL=http://127.0.0.1:4184/ node scripts/verify-cardnews-template.mjs --scenario manual-sequence --assert-layout --screenshot evidence/task-7-manual-sequence.png > evidence/task-7-browser-layout.txt 2>&1
    Expected: Command exits 0; evidence asserts blue outer background, white rounded inner card, visible divider, visible primary content, and visible light-blue emphasis box.
    Evidence: evidence/task-7-browser-layout.txt

  Scenario: sequence template preview uses blue cardnews design
    Tool:     playwright(real Chrome)
    Steps:    CARDSTUDIO_URL=http://127.0.0.1:4184/ node scripts/verify-cardnews-template.mjs --scenario smoke --assert-sequence-preview-blue --screenshot evidence/task-7-preview-blue.png > evidence/task-7-preview-blue.txt 2>&1
    Expected: Command exits 0; evidence asserts the `카드뉴스` template preview is present and uses a blue accent.
    Evidence: evidence/task-7-preview-blue.txt
  ```

  Commit: YES | Message: `style(cardnews): redesign sequence template canvas` | Files: [`src/App.tsx`, `src/App.css`, `src/creationFlow.ts`, `src/creationFlow.test.ts`, `scripts/verify-cardnews-template.mjs`]

- [ ] 8. Execute Full Browser QA Export Check And Cleanup

  What to do: Run the complete verification story on `http://127.0.0.1:4184/`: start the Vite dev server if it is not already running, drive direct/manual `카드뉴스` creation, upload `branding/app-logo-600.png`, set brand `내 브랜드`, fill `제목`, `내용1`, and `내용2`, assert forbidden phrases are absent from rendered sequence cards, capture desktop and mobile screenshots, trigger export, and verify a PNG download is produced. Clean generated build/test artifacts from the worktree without deleting evidence files needed for review.
  Must NOT do: Do not mark complete without actual browser evidence. Do not leave a dev server running after QA. Do not commit `evidence/`, screenshots, videos, downloads, `.tmp-cardnews-test/`, or `dist/`.

  Parallelization: Can parallel: NO | Wave 3 | Blocks: [] | Blocked by: [1, 2, 3, 4, 5, 6, 7]

  References (executor has NO interview context - be exhaustive):
  - Entry:    `src/main.tsx:20` - local hosts render the app at root.
  - UI:       `src/App.tsx:1543` - manual panel root.
  - UI:       `src/App.tsx:1558` - manual template option grid.
  - UI:       `src/App.tsx:1592` - `선택 레이아웃으로 새 카드` button.
  - UI:       `src/App.tsx:1994` - editor workspace section.
  - UI:       `src/App.tsx:2261` - save/download navigation button.
  - UI:       `src/App.tsx:2288` - `전체 PNG 저장` button.
  - Script:   `scripts/verify-cardnews-template.mjs` - browser verification scaffold from Task 3.
  - External: `https://playwright.dev/docs/browsers` - real Chrome execution guidance.

  Acceptance criteria (agent-executable only):
  - [ ] `npm run test:cardnews > evidence/task-8-cardnews-tests.txt 2>&1` exits 0.
  - [ ] `npx tsc --noEmit -p tsconfig.app.json > evidence/task-8-app-typecheck.txt 2>&1` exits 0.
  - [ ] `npm run lint > evidence/task-8-lint.txt 2>&1` exits 0.
  - [ ] `npm run build > evidence/task-8-build.txt 2>&1` exits 0.
  - [ ] `CARDSTUDIO_URL=http://127.0.0.1:4184/ node scripts/verify-cardnews-template.mjs --scenario manual-sequence --logo branding/app-logo-600.png --title "테스트 제목" --content1 "중앙 내용입니다" --content2 "하단 강조 내용입니다" --assert-layout --assert-no-forbidden-copy --assert-download --screenshot evidence/task-8-final-desktop.png > evidence/task-8-browser-final.txt 2>&1` exits 0 with a running dev server.
  - [ ] `CARDSTUDIO_URL=http://127.0.0.1:4184/ node scripts/verify-cardnews-template.mjs --scenario manual-sequence --viewport 390x844 --logo branding/app-logo-600.png --title "모바일 제목" --content1 "모바일 중앙 내용" --content2 "모바일 강조 내용" --assert-layout --assert-no-overlap --screenshot evidence/task-8-final-mobile.png > evidence/task-8-browser-mobile.txt 2>&1` exits 0 with a running dev server.
  - [ ] `git status --short > evidence/task-8-final-status.txt` contains only intended source changes and the untracked ignored evidence is absent from status.

  QA scenarios (MANDATORY - task incomplete without these):
  ```text
  Scenario: full direct manual sequence card creation with logo and split content
    Tool:     playwright(real Chrome)
    Steps:    mkdir -p evidence
              npm run dev:web -- --host 127.0.0.1 --port 4184 > evidence/task-8-dev-server.log 2>&1 &
              echo $! > evidence/task-8-dev-server.pid
              for i in {1..40}; do curl -fsS http://127.0.0.1:4184/ >/dev/null && break; sleep 1; done
              CARDSTUDIO_URL=http://127.0.0.1:4184/ node scripts/verify-cardnews-template.mjs --scenario manual-sequence --logo branding/app-logo-600.png --title "테스트 제목" --content1 "중앙 내용입니다" --content2 "하단 강조 내용입니다" --assert-layout --assert-no-forbidden-copy --assert-download --screenshot evidence/task-8-final-desktop.png > evidence/task-8-browser-final.txt 2>&1
              kill "$(cat evidence/task-8-dev-server.pid)"
    Expected: Commands exit 0; evidence confirms logo visible, title/content1/content2 rendered in the required areas, forbidden phrases absent, and PNG download produced.
    Evidence: evidence/task-8-browser-final.txt

  Scenario: mobile sequence layout has no overlap
    Tool:     playwright(real Chrome)
    Steps:    npm run dev:web -- --host 127.0.0.1 --port 4184 > evidence/task-8-dev-server-mobile.log 2>&1 &
              echo $! > evidence/task-8-dev-server-mobile.pid
              for i in {1..40}; do curl -fsS http://127.0.0.1:4184/ >/dev/null && break; sleep 1; done
              CARDSTUDIO_URL=http://127.0.0.1:4184/ node scripts/verify-cardnews-template.mjs --scenario manual-sequence --viewport 390x844 --logo branding/app-logo-600.png --title "모바일 제목" --content1 "모바일 중앙 내용" --content2 "모바일 강조 내용" --assert-layout --assert-no-overlap --screenshot evidence/task-8-final-mobile.png > evidence/task-8-browser-mobile.txt 2>&1
              kill "$(cat evidence/task-8-dev-server-mobile.pid)"
    Expected: Commands exit 0; evidence confirms text/logo boxes have nonzero bounds and no detected overlap.
    Evidence: evidence/task-8-browser-mobile.txt
  ```

  Commit: YES | Message: `test(cardnews): verify sequence template end to end` | Files: [`scripts/verify-cardnews-template.mjs`, `plans/cardnews-sequence-template-refresh.md`]

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
- Reference the plan file path in the final commit footer: `Plan: plans/cardnews-sequence-template-refresh.md`.

## Success criteria
- All Must-Have shipped; all QA scenarios pass with captured evidence; F1-F4 approved; commit history clean.

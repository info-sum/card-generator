# Card News Custom Options Plan

## TL;DR
> Summary:      Complete the in-progress color and character customization work for the topic cardnews flow, while loosening hard-coded Sequence-specific branding so the output is configurable rather than a clone.
> Deliverables:
> - User-selectable topic accent color that feeds generation, preview, restore, and export.
> - Character controls with default, hidden, and uploaded custom image modes.
> - Durable character image handling that survives saved-draft restore.
> - Sequence-style renderer updated to use custom accents and character choices.
> - Generator and browser verification scripts with captured evidence.
> Effort:       Medium
> Risk:         Medium - most work is in `src/App.tsx`, which is already dirty and contains partial customization state.

## Scope
### Must have
- Expose the existing `topicAccentColor` state from `src/App.tsx:399` as a visible color input near the topic draft controls at `src/App.tsx:1037`.
- Keep `generateCardNewsDraft()` color options working through `src/cardNewsDraft.ts:38` and `src/cardNewsDraft.ts:46`, and add regression coverage in `src/cardNewsDraft.test.ts:47`.
- Add visible character controls for `default`, `custom`, and `hidden` modes based on the existing `CharacterMode` type at `src/App.tsx:18`.
- Replace the partial custom character upload branch at `src/App.tsx:692` so persisted character images are data URLs, not `blob:` object URLs.
- Persist and restore `characterImage` and `characterMode` through the draft payload already started at `src/App.tsx:530` and `src/App.tsx:597`.
- Pass custom accent and character settings through `SlidePreview`, `SlideCanvas`, `SocialSlide`, and `SequenceSlide` around `src/App.tsx:1955`, `src/App.tsx:2035`, `src/App.tsx:2125`, and `src/App.tsx:2251`.
- Remove or generalize fixed reference-specific output strings such as the default `brandName: 'Sequence'` in `src/cardNewsDraft.ts:56` and `@sequence_ai` in `src/App.tsx:2316`.
- Add agent-executed browser QA for controls, character upload, hidden character mode, reload persistence, and export.

### Must NOT have (guardrails, anti-slop, scope boundaries)
- Must not make a pixel-for-pixel Sequence clone or keep Sequence-specific identity as the default generated output.
- Must not persist `URL.createObjectURL()` / `blob:` URLs in `ProjectDraft`; they are not durable across reload.
- Must not introduce a new React test framework or network-dependent dependency install.
- Must not change unrelated pages such as `src/pages/IntroPage.tsx` or `src/pages/TermsPage.tsx`.
- Must not revert existing dirty working-tree changes. Current dirty files include `.gitignore`, `src/App.css`, `src/App.tsx`, `tsconfig.app.json`, `src/cardNewsDraft.ts`, `src/cardNewsDraft.test.ts`, and `tsconfig.cardnews-test.json`.
- Must not require human visual inspection as pass/fail; every QA scenario must capture evidence under `evidence/`.

## Verification strategy
> Zero human intervention - all verification is agent-executed.
- Test decision: tests-after + Node `node:test`, TypeScript compile checks, and Playwright with real Chrome.
- QA policy: every task has agent-executed scenarios.
- Evidence: `evidence/task-<N>-<slug>.<ext>`

## Execution strategy
### Parallel execution waves
> Target 5-8 tasks per wave. <3 per wave (except final) = under-splitting.
> Extract shared dependencies as Wave-1 tasks to maximize parallelism.

Wave 1 (no dependencies):
- Task 1: Lock generator options and test script.
- Task 2: Stabilize durable customization state and upload handling.
- Task 3: Add CSS foundations for option controls and sequence variables.

Wave 2 (after Wave 1):
- Task 4: depends [1, 2, 3] - expose topic color and character controls.
- Task 5: depends [2, 3] - render custom accents and character modes.
- Task 6: depends [1] - generalize Sequence-specific copy and defaults.

Wave 3 (after Wave 2):
- Task 7: depends [4, 5, 6] - add final browser verification harness and evidence.

Critical path: Task 2 -> Task 4 -> Task 7

### Dependency matrix
| Task | Depends on | Blocks | Can parallelize with |
|------|------------|--------|----------------------|
| 1    | none       | 4, 6   | 2, 3                 |
| 2    | none       | 4, 5, 7| 1, 3                 |
| 3    | none       | 4, 5   | 1, 2                 |
| 4    | 1, 2, 3    | 7      | 5, 6 with file-section coordination |
| 5    | 2, 3       | 7      | 4, 6 with file-section coordination |
| 6    | 1          | 7      | 4, 5 with file-section coordination |
| 7    | 4, 5, 6    | final  | none                 |

## Todos
> Implementation + Test = ONE task. Never separate.
> Every task MUST have: References + Acceptance Criteria + QA Scenarios + Commit.

- [ ] 1. Lock Generator Options And Test Script

  What to do: Add `test:cardnews` to `package.json` using the existing `tsconfig.cardnews-test.json` output directory. Extend `src/cardNewsDraft.test.ts` so generated drafts cover custom accent color, invalid accent fallback, default accent fallback, and generated slide compatibility. Keep `CardNewsDraftOptions` in `src/cardNewsDraft.ts` narrow and explicit.
  Must NOT do: Do not add Vitest/Jest/RTL. Do not change UI files in this task.

  Parallelization: Can parallel: YES | Wave 1 | Blocks: [4, 6] | Blocked by: []

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `src/cardNewsDraft.test.ts:1` - existing `node:assert/strict` and `node:test` style to follow.
  - Pattern:  `src/cardNewsDraft.test.ts:47` - existing custom accent color regression.
  - API/Type: `src/cardNewsDraft.ts:38` - `CardNewsDraftOptions` currently accepts `accentColor`.
  - API/Type: `src/cardNewsDraft.ts:46` - `generateCardNewsDraft(rawTopic, options)` entry point.
  - API/Type: `src/cardNewsDraft.ts:156` - existing hex color normalization fallback.
  - Test:     `tsconfig.cardnews-test.json:16` - compiles tests to `.tmp-cardnews-test`.
  - Test:     `package.json:6` - scripts object currently lacks `test:cardnews`.
  - External: `https://nodejs.org/api/test.html` - Node test runner behavior for `node --test`.

  Acceptance criteria (agent-executable only):
  - [ ] `npm run test:cardnews` exits 0.
  - [ ] `node --input-type=module -e "import('./.tmp-cardnews-test/cardNewsDraft.js').then(({ generateCardNewsDraft }) => { const draft = generateCardNewsDraft('컬러 테스트', { accentColor: '#0f8a8d' }); if (draft.customColor !== '#0f8a8d' || draft.themeId !== 'custom') throw new Error(JSON.stringify(draft)); })"` exits 0 after `npm run test:cardnews`.
  - [ ] `node --input-type=module -e "import('./.tmp-cardnews-test/cardNewsDraft.js').then(({ generateCardNewsDraft }) => { const draft = generateCardNewsDraft('잘못된 색상', { accentColor: 'not-a-color' }); if (draft.customColor !== '#1247d8' || draft.themeId !== 'sequence-blue') throw new Error(JSON.stringify(draft)); })"` exits 0 after `npm run test:cardnews`.

  QA scenarios (MANDATORY - task incomplete without these):
  > Name the exact tool AND its exact invocation - not "verify it works". Browser use: use Chrome to drive the page; if Chrome is not available, download and use agent-browser (https://github.com/vercel-labs/agent-browser). Computer use: OS-level GUI automation for a non-browser desktop app.
  ```text
  Scenario: Generator keeps custom accent color
    Tool:     bash
    Steps:    mkdir -p evidence
              npm run test:cardnews > evidence/task-1-generator-contract.txt
    Expected: Command exits 0 and evidence contains passing node:test output for custom accent color.
    Evidence: evidence/task-1-generator-contract.txt

  Scenario: Generator rejects invalid accent color
    Tool:     bash
    Steps:    node --input-type=module -e "import('./.tmp-cardnews-test/cardNewsDraft.js').then(({ generateCardNewsDraft }) => { const draft = generateCardNewsDraft('잘못된 색상', { accentColor: 'nope' }); if (draft.customColor !== '#1247d8' || draft.themeId !== 'sequence-blue') throw new Error(JSON.stringify(draft)); console.log(JSON.stringify({ customColor: draft.customColor, themeId: draft.themeId })); })" > evidence/task-1-generator-invalid-color.txt
    Expected: Command exits 0 and evidence JSON is {"customColor":"#1247d8","themeId":"sequence-blue"}.
    Evidence: evidence/task-1-generator-invalid-color.txt
  ```

  Commit: YES | Message: `test(cardnews): lock custom draft options` | Files: [`package.json`, `package-lock.json`, `src/cardNewsDraft.ts`, `src/cardNewsDraft.test.ts`]

- [ ] 2. Stabilize Durable Customization State And Upload Handling

  What to do: Complete the current partial character state in `src/App.tsx`. Keep `CharacterMode`, `characterImage`, and `characterMode` in `ProjectDraft`, autosave, and restore. Replace the character upload branch with durable data URL handling, preferably by reusing `optimizeLocalImage(firstImage).dataUrl`. Ensure the shared file input clears `dataset.intent` after icon, character, and gallery paths. Keep icon behavior out of scope unless required to avoid regressions.
  Must NOT do: Do not store a `blob:` character URL in saved drafts. Do not add a second hidden file input unless the shared input becomes unmaintainable.

  Parallelization: Can parallel: YES | Wave 1 | Blocks: [4, 5, 7] | Blocked by: []

  References (executor has NO interview context - be exhaustive):
  - API/Type: `src/App.tsx:18` - existing `CharacterMode = 'default' | 'custom' | 'hidden'`.
  - API/Type: `src/App.tsx:43` - `ProjectDraft` already has `characterImage` and `characterMode`.
  - Pattern:  `src/App.tsx:392` - top-level React state pattern.
  - Pattern:  `src/App.tsx:524` - autosave payload and dependency list.
  - Pattern:  `src/App.tsx:578` - saved draft restore flow.
  - Pattern:  `src/App.tsx:674` - shared local file input handler.
  - API/Type: `src/lib/appsInToss.ts:32` - `optimizeLocalImage(file)` returns a durable optimized data URL.
  - API/Type: `src/lib/appsInToss.ts:133` - existing `FileReader.readAsDataURL()` helper pattern.
  - External: `https://developer.mozilla.org/en-US/docs/Web/API/FileReader/readAsDataURL` - durable data URL conversion.
  - External: `https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL_static` - object URL is temporary.
  - External: `https://developer.mozilla.org/en-US/docs/Web/API/URL/revokeObjectURL_static` - cleanup requirement if object URLs remain anywhere.

  Acceptance criteria (agent-executable only):
  - [ ] `npx tsc --noEmit -p tsconfig.app.json` exits 0.
  - [ ] `node -e "const fs=require('fs'); const s=fs.readFileSync('src/App.tsx','utf8'); if(/intent === 'character'[\\s\\S]{0,350}URL\\.createObjectURL/.test(s)) throw new Error('character branch stores object URL');"` exits 0.
  - [ ] `node -e "const fs=require('fs'); const s=fs.readFileSync('src/App.tsx','utf8'); for (const token of ['characterImage: characterImage ?? undefined','characterMode,','setCharacterImage(parsedDraft.characterImage)','setCharacterMode(parsedDraft.characterMode)']) if(!s.includes(token)) throw new Error(token);"` exits 0.

  QA scenarios (MANDATORY - task incomplete without these):
  ```text
  Scenario: Character state is type-safe and durable
    Tool:     bash
    Steps:    mkdir -p evidence
              npx tsc --noEmit -p tsconfig.app.json > evidence/task-2-character-state-typecheck.txt
    Expected: Command exits 0 with no unused-state or type errors.
    Evidence: evidence/task-2-character-state-typecheck.txt

  Scenario: Character upload path does not persist blob URLs
    Tool:     bash
    Steps:    node -e "const fs=require('fs'); const s=fs.readFileSync('src/App.tsx','utf8'); if(/intent === 'character'[\\s\\S]{0,350}URL\\.createObjectURL/.test(s)) throw new Error('character branch stores object URL'); console.log('character upload uses durable data URL path');" > evidence/task-2-character-no-blob.txt
    Expected: Command exits 0 and evidence says the character upload uses a durable data URL path.
    Evidence: evidence/task-2-character-no-blob.txt
  ```

  Commit: YES | Message: `feat(cardnews): persist character customization state` | Files: [`src/App.tsx`]

- [ ] 3. Add CSS Foundations For Option Controls And Sequence Variables

  What to do: Add reusable styles in `src/App.css` for topic color controls, character mode controls, custom character preview, hidden/custom states, and sequence renderer variable hooks. Keep the existing `.field`, `.choice-grid`, `.theme-custom-row`, and `.sequence-mascot` style language, but add classes that prevent layout shift on mobile.
  Must NOT do: Do not move major layout sections or restyle unrelated intro/save/editor panels.

  Parallelization: Can parallel: YES | Wave 1 | Blocks: [4, 5] | Blocked by: []

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `src/App.css:211` - existing topic draft input row styles.
  - Pattern:  `src/App.css:274` - config card spacing.
  - Pattern:  `src/App.css:401` - choice grid and choice card styles.
  - Pattern:  `src/App.css:463` - custom color input field styles.
  - Pattern:  `src/App.css:1250` - sequence slide styles.
  - Pattern:  `src/App.css:1357` - current hard-coded mascot style to extend or replace.
  - Pattern:  `src/App.css:1640` - existing mobile modal breakpoint.
  - External: `https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/color` - native color input dimensions and value behavior.

  Acceptance criteria (agent-executable only):
  - [ ] `node -e "const fs=require('fs'); const s=fs.readFileSync('src/App.css','utf8'); for (const token of ['topic-color','character-option','character-preview','sequence-character']) if(!s.includes(token)) throw new Error(token);"` exits 0.
  - [ ] `npm run build` exits 0 after the CSS changes and any related class references are present.

  QA scenarios (MANDATORY - task incomplete without these):
  ```text
  Scenario: Custom option CSS tokens exist
    Tool:     bash
    Steps:    mkdir -p evidence
              node -e "const fs=require('fs'); const s=fs.readFileSync('src/App.css','utf8'); for (const token of ['topic-color','character-option','character-preview','sequence-character']) if(!s.includes(token)) throw new Error(token); console.log('css tokens ok');" > evidence/task-3-css-tokens.txt
    Expected: Command exits 0 and evidence says `css tokens ok`.
    Evidence: evidence/task-3-css-tokens.txt

  Scenario: CSS changes do not break production build
    Tool:     bash
    Steps:    npm run build > evidence/task-3-css-build.txt
    Expected: Command exits 0 with Vite build output.
    Evidence: evidence/task-3-css-build.txt
  ```

  Commit: YES | Message: `style(cardnews): add custom option controls` | Files: [`src/App.css`]

- [ ] 4. Expose Topic Color And Character Controls

  What to do: Add visible controls in the start/config UI for topic accent color and character mode. Place the topic color picker near `src/App.tsx:1037` so it affects `createTopicDraft()` at `src/App.tsx:839`. Add character mode buttons and upload/remove UI near the project settings block at `src/App.tsx:1075` or a nearby sequence-specific config card. Wire controls to `setTopicAccentColor`, `setCharacterMode`, `setCharacterImage`, and the shared file input at `src/App.tsx:966`. Add or extend a browser verification script with a `controls` scenario.
  Must NOT do: Do not hide color selection only behind the existing Color Theme card, because `src/App.tsx:1269` currently excludes sequence cards. Do not make the character control available only after a draft is already generated.

  Parallelization: Can parallel: YES | Wave 2 | Blocks: [7] | Blocked by: [1, 2, 3]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `src/App.tsx:966` - shared hidden file input.
  - Pattern:  `src/App.tsx:1037` - topic draft field and submit button.
  - Pattern:  `src/App.tsx:1080` - config-card field layout.
  - Pattern:  `src/App.tsx:1110` - app icon upload/preview pattern to adapt carefully.
  - Pattern:  `src/App.tsx:1269` - existing global color theme control, currently not shown for sequence layout.
  - API/Type: `src/App.tsx:399` - `topicAccentColor` state currently lacks UI.
  - API/Type: `src/App.tsx:400` - `characterImage` state currently lacks UI.
  - API/Type: `src/App.tsx:401` - `characterMode` state currently lacks UI.
  - Test:     `scripts/record-iran-cardnews.mjs:1` - Playwright script style and Chrome executable pattern.
  - External: `https://react.dev/reference/react-dom/components/input` - controlled input behavior.
  - External: `https://react.dev/reference/react-dom/components/select` - controlled option picker behavior if using a select.
  - External: `https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/file` - file input and `accept="image/*"`.

  Acceptance criteria (agent-executable only):
  - [ ] `npx tsc --noEmit -p tsconfig.app.json` exits 0.
  - [ ] `node -e "const fs=require('fs'); const s=fs.readFileSync('src/App.tsx','utf8'); for (const token of ['setTopicAccentColor','characterMode === \\'default\\'','characterMode === \\'custom\\'','characterMode === \\'hidden\\'','dataset.intent = \\'character\\'']) if(!s.includes(token)) throw new Error(token);"` exits 0.
  - [ ] `CARDSTUDIO_CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm run verify:cardnews-custom -- --base-url http://127.0.0.1:5176 --scenario controls` exits 0 after a dev server is running.

  QA scenarios (MANDATORY - task incomplete without these):
  ```text
  Scenario: Controls are visible before generating a draft
    Tool:     playwright(real Chrome)
    Steps:    Start server: npm run dev:web -- --host 127.0.0.1 --port 5176
              Run: CARDSTUDIO_CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm run verify:cardnews-custom -- --base-url http://127.0.0.1:5176 --scenario controls
    Expected: Script finds the topic input, topic color input, Default/Custom/Hide character buttons, and custom character upload button before any slides exist.
    Evidence: evidence/task-4-controls.txt

  Scenario: Invalid non-image character upload is rejected gracefully
    Tool:     playwright(real Chrome)
    Steps:    Create evidence/task-4-not-image.txt as a text file, open http://127.0.0.1:5176, click custom character upload, set the file input to evidence/task-4-not-image.txt through Playwright, and capture the notice text.
    Expected: No character preview is shown and the notice says image upload is required.
    Evidence: evidence/task-4-controls-error.txt
  ```

  Commit: YES | Message: `feat(cardnews): expose color and character controls` | Files: [`src/App.tsx`, `src/App.css`, `scripts/verify-cardnews-custom-options.mjs`, `package.json`, `package-lock.json`]

- [ ] 5. Render Custom Accents And Character Modes In Sequence Cards

  What to do: Thread character and theme props through `SlidePreview`, `SlideCanvas`, `SocialSlide`, and `SequenceSlide`. Make sequence cover/detail colors derive from the resolved theme/accent instead of fixed CSS where possible. Render the default mascot for `default`, render the uploaded image for `custom`, and omit the character block for `hidden`. Ensure preview and export share the same `SlideCanvas` path.
  Must NOT do: Do not add a second render-only component for export. Do not use remote character URLs in generated output. Do not leave `@sequence_ai` in the renderer.

  Parallelization: Can parallel: YES | Wave 2 | Blocks: [7] | Blocked by: [2, 3]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `src/App.tsx:1955` - `SlidePreview` prop forwarding.
  - API/Type: `src/App.tsx:2035` - `SlideCanvasProps` to extend.
  - Pattern:  `src/App.tsx:2050` - `SlideCanvas` appstore/social branching.
  - Pattern:  `src/App.tsx:2125` - sequence layout branch inside `SocialSlide`.
  - Pattern:  `src/App.tsx:2251` - `SequenceSlide` component.
  - Pattern:  `src/App.tsx:2302` - hard-coded cover mascot.
  - Pattern:  `src/App.css:1255` - fixed cover background.
  - Pattern:  `src/App.css:1294` - fixed detail accent.
  - Pattern:  `src/App.css:1357` - fixed mascot style.
  - Test:     `scripts/record-iran-cardnews.mjs:99` - file upload via Playwright `setInputFiles`.
  - External: `https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toDataURL` - origin-clean/data URL export context.

  Acceptance criteria (agent-executable only):
  - [ ] `npm run build` exits 0.
  - [ ] `node -e "const fs=require('fs'); const s=fs.readFileSync('src/App.tsx','utf8'); for (const token of ['characterMode','characterImage','SequenceSlide','sequence-character']) if(!s.includes(token)) throw new Error(token); if(s.includes('@sequence_ai')) throw new Error('reference footer remains');"` exits 0.
  - [ ] `CARDSTUDIO_CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm run verify:cardnews-custom -- --base-url http://127.0.0.1:5176 --scenario render-character-color` exits 0 after a dev server is running.

  QA scenarios (MANDATORY - task incomplete without these):
  ```text
  Scenario: Custom color and uploaded character render in preview
    Tool:     playwright(real Chrome)
    Steps:    Start server: npm run dev:web -- --host 127.0.0.1 --port 5176
              Run: CARDSTUDIO_CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm run verify:cardnews-custom -- --base-url http://127.0.0.1:5176 --scenario render-character-color
    Expected: Script sets topic color #0f8a8d, uploads branding/app-logo-600.png as the character, generates a draft, and verifies `.sequence-character img` is visible on the cover and the cover background is not the fixed Sequence blue.
    Evidence: evidence/task-5-render-character-color.png

  Scenario: Hidden character mode removes the character from cover output
    Tool:     playwright(real Chrome)
    Steps:    Run: CARDSTUDIO_CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm run verify:cardnews-custom -- --base-url http://127.0.0.1:5176 --scenario hidden-character
    Expected: Script selects hidden character mode, generates a draft, and verifies no `.sequence-character` element is present on slide 1.
    Evidence: evidence/task-5-hidden-character.png
  ```

  Commit: YES | Message: `feat(cardnews): render custom sequence accents and characters` | Files: [`src/App.tsx`, `src/App.css`, `scripts/verify-cardnews-custom-options.mjs`]

- [ ] 6. Generalize Reference-Specific Branding And Defaults

  What to do: Change generated draft defaults so the card is Sequence-inspired internally but not branded as Sequence by default. Replace `brandName: 'Sequence'`, `projectBadge: 'Daily Automation Log'`, fixed footer account text, and UI labels that imply exact Sequence copying. Update generator tests to assert generic defaults and preserve user-editability.
  Must NOT do: Do not rename the internal `sequence` layout type unless every reference is updated and tested. Do not rewrite the Korean slide copy wholesale; keep scope to reference-specific identity and color rigidity.

  Parallelization: Can parallel: YES | Wave 2 | Blocks: [7] | Blocked by: [1]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `src/cardNewsDraft.ts:56` - default generated brand currently says `Sequence`.
  - Pattern:  `src/cardNewsDraft.ts:57` - default project badge currently says `Daily Automation Log`.
  - Pattern:  `src/cardNewsDraft.ts:73` - generated slide copy array.
  - Pattern:  `src/cardNewsDraft.test.ts:8` - test currently asserts Sequence-specific brand.
  - Pattern:  `src/App.tsx:1238` - UI label currently says `Sequence 카드뉴스`.
  - Pattern:  `src/App.tsx:2316` - footer currently falls back to `@sequence_ai` on detail slides.
  - External: `https://react.dev/reference/react-dom/components/input` - user-editable output text remains controlled state.

  Acceptance criteria (agent-executable only):
  - [ ] `npm run test:cardnews` exits 0 with updated non-Sequence default assertions.
  - [ ] `node -e "const fs=require('fs'); const files=['src/cardNewsDraft.ts','src/cardNewsDraft.test.ts','src/App.tsx']; const hit=files.flatMap(f => { const s=fs.readFileSync(f,'utf8'); return ['brandName: \\'Sequence\\'','@sequence_ai','Daily Automation Log'].filter(t => s.includes(t)).map(t => f+':'+t); }); if(hit.length) throw new Error(hit.join('\\n'));"` exits 0.
  - [ ] `npm run build` exits 0.

  QA scenarios (MANDATORY - task incomplete without these):
  ```text
  Scenario: Generator defaults are generic
    Tool:     bash
    Steps:    mkdir -p evidence
              npm run test:cardnews > evidence/task-6-generic-generator.txt
    Expected: Command exits 0 and tests assert generic default brand/badge instead of Sequence identity.
    Evidence: evidence/task-6-generic-generator.txt

  Scenario: Reference-specific strings are absent from source output paths
    Tool:     bash
    Steps:    node -e "const fs=require('fs'); const files=['src/cardNewsDraft.ts','src/cardNewsDraft.test.ts','src/App.tsx']; const needles=['brandName: \\'Sequence\\'','@sequence_ai','Daily Automation Log']; const hits=[]; for (const f of files) { const s=fs.readFileSync(f,'utf8'); for (const n of needles) if(s.includes(n)) hits.push(f+':'+n); } if(hits.length) throw new Error(hits.join('\\n')); console.log('reference strings absent');" > evidence/task-6-reference-strings.txt
    Expected: Command exits 0 and evidence says `reference strings absent`.
    Evidence: evidence/task-6-reference-strings.txt
  ```

  Commit: YES | Message: `feat(cardnews): remove reference-specific sequence branding` | Files: [`src/cardNewsDraft.ts`, `src/cardNewsDraft.test.ts`, `src/App.tsx`]

- [ ] 7. Add Final Browser Verification Harness And Evidence

  What to do: Finish `scripts/verify-cardnews-custom-options.mjs` and add a package script, for example `verify:cardnews-custom`. The script must run against a provided `--base-url`, launch real Chrome via `CARDSTUDIO_CHROME`, capture screenshots/text evidence, and support at least these scenarios: `controls`, `render-character-color`, `hidden-character`, `reload-persistence`, `export-customized`. The script should create evidence files itself.
  Must NOT do: Do not point QA at production. Do not require a human to choose files or inspect screenshots. Do not depend on network access.

  Parallelization: Can parallel: NO | Wave 3 | Blocks: [final] | Blocked by: [4, 5, 6]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `scripts/record-iran-cardnews.mjs:1` - existing Playwright import and script style.
  - Pattern:  `scripts/record-iran-cardnews.mjs:5` - Chrome executable path pattern.
  - Pattern:  `scripts/record-iran-cardnews.mjs:35` - browser context options and `acceptDownloads`.
  - Pattern:  `scripts/record-iran-cardnews.mjs:99` - `setInputFiles()` pattern.
  - Pattern:  `scripts/record-iran-cardnews.mjs:151` - editing slide fields via locators.
  - API/Type: `package.json:6` - scripts object for adding `verify:cardnews-custom`.
  - Pattern:  `src/lib/appsInToss.ts:78` - download/save path used by export.
  - External: `https://playwright.dev/docs/api/class-page` - Playwright page API.
  - External: `https://playwright.dev/docs/downloads` - download handling for export verification.

  Acceptance criteria (agent-executable only):
  - [ ] `npm run test:cardnews` exits 0.
  - [ ] `npm run build` exits 0.
  - [ ] With `npm run dev:web -- --host 127.0.0.1 --port 5176` running, `CARDSTUDIO_CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm run verify:cardnews-custom -- --base-url http://127.0.0.1:5176 --scenario all` exits 0.
  - [ ] Evidence files exist: `evidence/task-7-controls.txt`, `evidence/task-7-render-character-color.png`, `evidence/task-7-hidden-character.png`, `evidence/task-7-reload-persistence.txt`, `evidence/task-7-export-customized.txt`.

  QA scenarios (MANDATORY - task incomplete without these):
  ```text
  Scenario: Full customized flow survives reload
    Tool:     playwright(real Chrome)
    Steps:    Start server: npm run dev:web -- --host 127.0.0.1 --port 5176
              Run: CARDSTUDIO_CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm run verify:cardnews-custom -- --base-url http://127.0.0.1:5176 --scenario reload-persistence
    Expected: Script sets #0f8a8d, uploads branding/app-logo-600.png as character, generates a draft, reloads the page, and verifies color, character mode, and custom character preview are restored from saved draft.
    Evidence: evidence/task-7-reload-persistence.txt

  Scenario: Customized card exports without losing character or color
    Tool:     playwright(real Chrome)
    Steps:    Run: CARDSTUDIO_CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm run verify:cardnews-custom -- --base-url http://127.0.0.1:5176 --scenario export-customized
    Expected: Script generates a customized draft, clicks preview/export, captures at least one PNG download, and verifies the downloaded file size is greater than 10 KB.
    Evidence: evidence/task-7-export-customized.txt
  ```

  Commit: YES | Message: `test(cardnews): verify custom option flows` | Files: [`scripts/verify-cardnews-custom-options.mjs`, `package.json`, `package-lock.json`, `evidence/.gitkeep`]

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
- Reference the plan file path in the final commit footer: `Plan: plans/cardnews-custom-options.md`.

## Success criteria
- All Must-Have shipped; all QA scenarios pass with captured evidence; F1-F4 approved; commit history clean.

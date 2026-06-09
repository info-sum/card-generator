# ULW Notepad: cardnews topic draft

## Skills
- omo:ulw-loop: user explicitly requested ulw mode; use evidence-bound workflow.
- omo:programming: TSX/TypeScript production and test changes.
- omo:frontend-ui-ux: cardnews generator is frontend-facing and needs example-inspired visual polish.
- vercel:agent-browser-verify / Browser: browser-facing manual QA after dev server starts.

## Binding success criteria
- Deliverable: topic-only input generates a 9-slide Korean cardnews draft in the Sequence-like blue/white cardnews style.
- Scenario 1 happy path: automated test src/cardNewsDraft.test.ts / generateCardNewsDraft returns 9 slides for topic “AI 업무 자동화”. Manual QA browser: open http://127.0.0.1:<port>, type topic, click generate, PASS if page shows “01 / 09” and generated title contains topic-derived text.
- Scenario 2 empty input boundary: automated test src/cardNewsDraft.test.ts / normalizeTopic fallback creates default draft. Manual QA browser: clear topic, click generate, PASS if no crash and default draft appears.
- Scenario 3 adjacent regression: automated test src/cardNewsDraft.test.ts / existing slide image fields remain export-compatible. Manual QA browser: generated draft can select page 02 and preview shows list-style content.

## Evidence

## RED -> GREEN
- RED: npx tsc -p tsconfig.cardnews-test.json failed with TS2307 for missing ./cardNewsDraft.js before implementation.
- GREEN: npx tsc -p tsconfig.cardnews-test.json && node --test .tmp-cardnews-test/cardNewsDraft.test.js passed 3/3 after implementation.

## Verification
- npx tsc -p tsconfig.app.json --noEmit: PASS after excluding test files from app tsconfig.
- npm run build: PASS.
- npm run lint: PASS.
- LSP diagnostics: unavailable because typescript-language-server is not installed in this workspace.

## Browser QA
- Happy path evidence: artifacts/ulw/browser-happy-path.txt.
- Empty input evidence: artifacts/ulw/browser-empty-topic.txt.
- Slide 02 regression evidence: artifacts/ulw/browser-slide-02.txt.
- Cleanup: closed in-app browser tab; killed Vite PID 70495; no LISTEN on 127.0.0.1:4177.

## Reviewer fixes
- Added sequence to draft restore guard.
- Added .tmp-cardnews-test to .gitignore.
- Captured durable generated-card screenshots: artifacts/ulw/browser-sequence-cover.png and artifacts/ulw/browser-sequence-cover-after-reload.png.
- Reload persistence evidence: artifacts/ulw/browser-sequence-screenshot-and-reload.txt shows pass=true before/after reload.
- Cleanup precision: killed Vite PID 82665; lsof has no LISTEN on 127.0.0.1:4177, only transient CLOSED Codex sockets if listed.

## Follow-up: color and character customization
- RED: custom accent color test failed with TS2554 because generateCardNewsDraft accepted only one argument.
- GREEN: cardnews test suite now passes 4/4 including custom accent color.
- Browser QA: artifacts/ulw/browser-custom-color-character.txt pass=true for custom color #0f8a8d, hide character, custom character upload.
- Screenshots: artifacts/ulw/browser-custom-color-default-character.png, browser-custom-color-hidden-character.png, browser-custom-color-custom-character.png.
- Cleanup: browser.close completed; killed Vite PID 37091; no LISTEN on 127.0.0.1:4177.
- Reviewer fix: custom character now stores data:image URLs, no blob persistence; reload custom character QA passed and evidence cleanup updated.

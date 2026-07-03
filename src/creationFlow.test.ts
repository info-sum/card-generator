import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  AUTO_CREATION_FLOW_STEPS,
  AUTO_SLIDE_COUNT_OPTIONS,
  AUTO_TEMPLATE_OPTIONS,
  DEFAULT_AUTO_SLIDE_COUNT,
  DIRECT_CREATION_FLOW_STEPS,
  DIRECT_TEMPLATE_OPTIONS,
  EDITOR_DESIGN_TOOLS,
  EDITOR_WORKSPACE_ZONES,
  MODE_SWITCH_RESET_STEP,
  START_MODE_OPTIONS,
} from './creationFlow.js'

test('AUTO_CREATION_FLOW_STEPS start with topic setup before brand and layout generation', () => {
  assert.deepEqual(
    AUTO_CREATION_FLOW_STEPS.map((step) => step.label),
    ['주제 설정', '브랜드/레이아웃', '내용 편집', '디자인 설정', '결과 확인'],
  )
})

test('DIRECT_CREATION_FLOW_STEPS keep AI generation controls out of manual mode', () => {
  assert.deepEqual(
    DIRECT_CREATION_FLOW_STEPS.map((step) => step.label),
    ['제작 방식 선택', '템플릿 선택', '내용 입력', '디자인 설정', '결과 확인'],
  )
  assert.equal(
    DIRECT_CREATION_FLOW_STEPS.some((step) => step.label.includes('AI')),
    false,
  )
})

test('START_MODE_OPTIONS describe automatic and direct creation separately', () => {
  assert.equal(START_MODE_OPTIONS.length, 2)
  assert.equal(START_MODE_OPTIONS[0]?.mode, 'auto')
  assert.equal(START_MODE_OPTIONS[1]?.mode, 'manual')
})

test('AUTO_TEMPLATE_OPTIONS restore multiple generation templates before AI generation', () => {
  assert.deepEqual(
    AUTO_TEMPLATE_OPTIONS.map((template) => template.layout),
    ['overlay', 'split-light', 'split-dark', 'sequence'],
  )
  assert.deepEqual(
    AUTO_TEMPLATE_OPTIONS.map((template) => template.title),
    ['오버레이', '하단흰색', '하단검정', '카드뉴스'],
  )
  assert.equal(
    AUTO_TEMPLATE_OPTIONS.every((template) => template.mode === 'auto'),
    true,
  )
  assert.equal(
    AUTO_TEMPLATE_OPTIONS.every((template) => /^#[0-9a-fA-F]{6}$/.test(template.accent)),
    true,
  )
})

test('DIRECT_TEMPLATE_OPTIONS restore old manual templates without AI generation', () => {
  assert.deepEqual(
    DIRECT_TEMPLATE_OPTIONS.map((template) => template.layout),
    ['overlay', 'split-light', 'split-dark', 'sequence'],
  )
  assert.deepEqual(
    DIRECT_TEMPLATE_OPTIONS.map((template) => template.title),
    ['오버레이', '하단흰색', '하단검정', '카드뉴스'],
  )
  assert.equal(
    DIRECT_TEMPLATE_OPTIONS.every((template) => template.mode === 'manual'),
    true,
  )
  assert.equal(
    DIRECT_TEMPLATE_OPTIONS.every((template) => /^#[0-9a-fA-F]{6}$/.test(template.accent)),
    true,
  )
})

test('MODE_SWITCH_RESET_STEP collapses each mode to its first visible section', () => {
  assert.deepEqual(MODE_SWITCH_RESET_STEP, {
    auto: 1,
    manual: 1,
  })
})

test('EDITOR_WORKSPACE_ZONES match the editing workspace shown after generation', () => {
  assert.deepEqual(
    EDITOR_WORKSPACE_ZONES.map((zone) => zone.label),
    ['카드 목록', '편집 캔버스', '디자인'],
  )
})

test('EDITOR_DESIGN_TOOLS expose layout, color, and font controls', () => {
  assert.deepEqual(
    EDITOR_DESIGN_TOOLS.map((tool) => tool.id),
    ['layout', 'color', 'font', 'image-size'],
  )
})

test('design settings expose card size selection alongside font and layout controls', () => {
  const app = readFileSync('src/App.tsx', 'utf8')
  const css = readFileSync('src/App.css', 'utf8')
  const creationFlow = readFileSync('src/creationFlow.ts', 'utf8')
  const designBlock = app.slice(
    app.indexOf('{/* Step 4: 디자인 설정 */}'),
    app.indexOf('{/* Step 5: 결과 확인 */}'),
  )

  assert.match(creationFlow, /카드 사이즈/)
  assert.match(designBlock, /카드뉴스 사이즈/)
  assert.match(designBlock, /preset-size-grid-modern/)
  assert.match(designBlock, /setPresetId\(presetOption\.id\)/)
  assert.match(css, /\.preset-size-grid-modern\s*\{/)
})

test('topic input allows up to 100 characters for more specific prompts', () => {
  const app = readFileSync('src/App.tsx', 'utf8')
  const topicBlock = app.slice(
    app.indexOf('<textarea'),
    app.indexOf('<div className="form-section-modern">'),
  )

  assert.match(topicBlock, /maxLength=\{100\}/)
  assert.match(topicBlock, /length <= 100/)
  assert.match(app, /textarea-counter-modern\">\{topicSeed\.length\}\/100/)
  assert.match(app, /최대 100자까지 입력할 수 있어요/)
})

test('template selection grid uses the full selection width for both modes', () => {
  const css = readFileSync('src/App.css', 'utf8')
  const app = readFileSync('src/App.tsx', 'utf8')
  const templateGridRule = css.match(/\.template-option-grid-modern\s*\{(?<body>[^}]*)\}/)

  assert.match(app, /creationMode === 'manual' \? DIRECT_TEMPLATE_OPTIONS : AUTO_TEMPLATE_OPTIONS/)
  assert.match(templateGridRule?.groups?.body ?? '', /grid-template-columns:\s*repeat\(4,\s*1fr\)/)
  assert.match(app, /setSelectedDirectTemplateId\(template\.id\)/)
  assert.match(app, /setSelectedAutoTemplateId\(template\.id\)/)
})

test('download action uses the Toss reward ad flow by default', () => {
  const app = readFileSync('src/App.tsx', 'utf8')

  assert.match(app, /ait\.v2\.live\.035615363b1a4c7c/)
  assert.match(app, /onClick=\{handleExportWithRewarded\}/)
  assert.doesNotMatch(app, /onClick=\{handleExportAll\}/)
})

test('Toss deployment opens the card studio instead of the intro page', () => {
  const main = readFileSync('src/main.tsx', 'utf8')

  assert.match(main, /isAppsInTossRuntime/)
  assert.match(main, /!isAppsInTossRuntime\(\) && !isLocalDevHost/)
})

test('top header uses the site logo asset in the upper-left brand area', () => {
  const app = readFileSync('src/App.tsx', 'utf8')
  const css = readFileSync('src/App.css', 'utf8')
  const headerBlock = app.slice(
    app.indexOf('<header className="top-bar-modern">'),
    app.indexOf('<div className="wizard-stepper-container-header">'),
  )
  const logoRule = css.match(/\.site-logo-image-modern\s*\{(?<body>[^}]*)\}/)

  assert.match(headerBlock, /src="\/logo\.svg"/)
  assert.match(headerBlock, /alt="카드뉴스 제작하기 로고"/)
  assert.doesNotMatch(headerBlock, /<svg width="24"/)
  assert.match(logoRule?.groups?.body ?? '', /object-fit:\s*cover/)
})

test('local Vite dev server wires the AI cardnews API route', () => {
  const viteConfig = readFileSync('vite.config.ts', 'utf8')

  assert.match(viteConfig, /configureServer/)
  assert.match(viteConfig, /\/api\/generate-cardnews/)
  assert.match(viteConfig, /generateCardNewsHandler/)
})

test('brand and logo information are edited during template selection', () => {
  const app = readFileSync('src/App.tsx', 'utf8')
  const stepOneBlock = app.slice(
    app.indexOf('{autoStep === 1 && ('),
    app.indexOf('{/* Step 2: 템플릿 및 레이아웃 선택 */}'),
  )
  const stepTwoBlock = app.slice(
    app.indexOf('{/* Step 2: 템플릿 및 레이아웃 선택 */}'),
    app.indexOf('{/* Step 3: 내용 입력'),
  )

  assert.doesNotMatch(stepOneBlock, /브랜드 기본 정보 설정/)
  assert.doesNotMatch(stepOneBlock, /aria-label="브랜드 명칭"/)
  assert.doesNotMatch(stepOneBlock, /startTopicGeneration/)
  assert.match(stepTwoBlock, /브랜드 기본 정보 설정/)
  assert.match(stepTwoBlock, /aria-label="브랜드 명칭"/)
  assert.match(stepTwoBlock, /aria-label="메인 문구"/)
  assert.match(stepTwoBlock, /aria-label="보조 문구"/)
  assert.match(stepTwoBlock, /aria-label="로고 이미지 업로드"/)
  assert.match(stepTwoBlock, /aria-label="로고 크기 조절"/)
  assert.match(stepTwoBlock, /AI 카드 생성하기/)
  assert.match(stepTwoBlock, /startTopicGeneration/)
  assert.match(app, /createTemplatePreviewSlide\(topicAccentColor, cardLayout, projectTitle, projectBadge\)/)
  assert.match(app, /applyConfiguredIntroCopy\(nextSlide, configuredCopy\)/)
  assert.doesNotMatch(stepTwoBlock, /aria-label="직접 생성 Gemini API Key"/)
})

test('content editing exposes every text field rendered inside cards', () => {
  const app = readFileSync('src/App.tsx', 'utf8')
  const stepThreeBlock = app.slice(
    app.indexOf('{/* Step 3: 내용 입력'),
    app.indexOf('{/* Step 4: 디자인 설정 */}'),
  )

  assert.match(stepThreeBlock, /aria-label="카드 상단 라벨"/)
  assert.match(stepThreeBlock, /updateSlideField\(activeSlide\.id, 'kicker'/)
  assert.match(stepThreeBlock, /aria-label="카드 제목"/)
  assert.match(stepThreeBlock, /updateSlideField\(activeSlide\.id, 'title'/)
  assert.match(stepThreeBlock, /aria-label="카드 본문 내용1"/)
  assert.match(stepThreeBlock, /updateSlideField\(activeSlide\.id, 'description'/)
  assert.match(stepThreeBlock, /aria-label="카드 하단 내용2"/)
  assert.match(stepThreeBlock, /updateSlideField\(activeSlide\.id, 'content2'/)
  assert.match(stepThreeBlock, /aria-label="카드 배지 문구"/)
  assert.match(stepThreeBlock, /updateSlideField\(activeSlide\.id, 'badge'/)
})

test('content editing exposes image URL and source controls for generated cards', () => {
  const app = readFileSync('src/App.tsx', 'utf8')
  const stepThreeBlock = app.slice(
    app.indexOf('{/* Step 3: 내용 입력'),
    app.indexOf('{/* Step 4: 디자인 설정 */}'),
  )

  assert.match(app, /imageSourceUrl\?: string/)
  assert.match(app, /sources\?: readonly GeneratedAiSource\[\]/)
  assert.match(app, /toneManner,/)
  assert.match(app, /imageSourceUrl: slide\.imageSourceUrl/)
  assert.match(app, /sources: slide\.sources/)
  assert.match(stepThreeBlock, /aria-label="카드 이미지 URL"/)
  assert.match(stepThreeBlock, /이미지 URL 적용/)
  assert.match(stepThreeBlock, /activeSlide\.sources/)
  assert.match(stepThreeBlock, /출처/)
})

test('GPT or Gemini API key is configured in a popup and restored from draft', () => {
  const app = readFileSync('src/App.tsx', 'utf8')

  assert.match(app, /type AiApiProvider = 'gpt' \| 'gemini'/)
  assert.match(app, /aiApiProvider\?: AiApiProvider/)
  assert.match(app, /gptApiKey\?: string/)
  assert.match(app, /geminiApiKey\?: string/)
  assert.match(app, /const \[aiApiProvider, setAiApiProvider\] = useState<AiApiProvider>\('gpt'\)/)
  assert.match(app, /const \[gptApiKey, setGptApiKey\] = useState\(''\)/)
  assert.match(app, /const \[geminiApiKey, setGeminiApiKey\] = useState\(''\)/)
  assert.match(app, /const \[showApiKeyModal, setShowApiKeyModal\] = useState\(false\)/)
  assert.match(app, /aiApiProvider,/)
  assert.match(app, /gptApiKey: gptApiKey\.trim\(\) \|\| undefined/)
  assert.match(app, /geminiApiKey: geminiApiKey\.trim\(\) \|\| undefined/)
  assert.match(app, /parsedDraft\.aiApiProvider/)
  assert.match(app, /parsedDraft\.gptApiKey/)
  assert.match(app, /parsedDraft\.geminiApiKey/)
  assert.match(app, /API Key 설정/)
  assert.match(app, /setShowApiKeyModal\(true\)/)
  assert.match(app, /api-key-modal-title/)
  assert.match(app, /aria-label="AI API 제공자 선택"/)
  assert.match(app, />GPT</)
  assert.match(app, />Gemini</)
  assert.match(app, /aria-label=\{aiApiProvider === 'gpt' \? 'GPT API Key' : 'Gemini API Key'\}/)
  assert.match(app, /'GPT API Key' : 'Gemini API Key'/)
  assert.match(app, /type="password"[\s\S]*value=\{aiApiProvider === 'gpt' \? gptApiKey : geminiApiKey\}/)
  assert.match(app, /setGeminiApiKey\(''\)/)
  assert.match(app, /setGptApiKey\(''\)/)
  assert.match(app, /const \[isApiKeySaving, setIsApiKeySaving\] = useState\(false\)/)
  assert.match(app, /const \[apiKeyValidationState, setApiKeyValidationState\] = useState<'idle' \| 'checking' \| 'success' \| 'error'>\('idle'\)/)
  assert.match(app, /const \[apiKeyValidationMessage, setApiKeyValidationMessage\] = useState\(''\)/)
  assert.match(app, /async function handleSaveApiKey\(\)/)
  assert.match(app, /API Key가 정상적으로 작동해요\./)
  assert.match(app, /API Key를 확인하고 있어요\./)
  assert.match(app, /apiKeyValidationBannerMessage/)
  assert.match(app, /api-key-validation-banner/)
  assert.match(app, /저장하고 확인/)
  assert.match(app, /확인 중\.\.\./)
})

test('automatic generation exposes bounded card count options', () => {
  assert.deepEqual(AUTO_SLIDE_COUNT_OPTIONS, [4, 6, 8, 10])
  assert.equal(DEFAULT_AUTO_SLIDE_COUNT, 4)
})

test('automatic generation connects selected card count and AI image options without changing manual mode', () => {
  const app = readFileSync('src/App.tsx', 'utf8')
  const manualBlock = app.slice(
    app.indexOf('<div className={manualStep === 1'),
    app.indexOf('<div className="direct-flow-list-modern"'),
  )

  assert.match(app, /autoSlideCount/)
  assert.match(app, /generateAiImages/)
  assert.match(app, /slideCount:\s*autoSlideCount/)
  assert.match(app, /카드 \$\{autoSlideCount\}장/)
  assert.match(app, /requestAiCardNews/)
  assert.match(app, /브랜드\/레이아웃 설정하기/)
  assert.match(app, /AI 카드 생성하기/)
  assert.doesNotMatch(manualBlock, /generateAiImages/)
  assert.doesNotMatch(manualBlock, /카드별 이미지도 AI로 생성/)
})

test('automatic generation clears the saved draft before creating new cards', () => {
  const app = readFileSync('src/App.tsx', 'utf8')

  assert.match(app, /setNotice\('기존 임시 저장 카드를 지우고 새로 생성하고 있어요\.'\)/)
  assert.match(app, /setSlides\(\[\]\)/)
  assert.match(app, /setActiveSlideId\(null\)/)
  assert.match(app, /setShowPreviewModal\(false\)/)
  assert.match(app, /clearDraftValue\(DRAFT_KEY\)/)
})

test('automatic generation keeps the AI response title on the first card', () => {
  const app = readFileSync('src/App.tsx', 'utf8')
  const introCopyBlock = app.slice(
    app.indexOf('function applyConfiguredIntroCopy'),
    app.indexOf('function normalizeSlideDraft'),
  )

  assert.match(introCopyBlock, /description:\s*copy\.sub \|\| slide\.description/)
  assert.match(introCopyBlock, /content2:\s*copy\.sub \|\| slide\.content2/)
  assert.doesNotMatch(introCopyBlock, /title:\s*copy\.main \|\| slide\.title/)
})

test('automatic generation applies fallback slide content instead of showing API-key warnings', () => {
  const app = readFileSync('src/App.tsx', 'utf8')

  assert.doesNotMatch(app, /response\.source === 'fallback' \|\| response\.slides\.length === 0/)
  assert.match(app, /response\.slides\.length === 0/)
  assert.match(app, /주제 기반 카드뉴스 초안을 만들었어요/)
})

test('automatic wizard hides topic examples and generated edit hint chips', () => {
  const app = readFileSync('src/App.tsx', 'utf8')

  assert.doesNotMatch(app, /const topicExamples/)
  assert.doesNotMatch(app, /aria-label="주제 예시"/)
  assert.doesNotMatch(app, /AI 마케팅', '자동화', '부동산 투자', '브랜드 전략', '여름 꿀팁/)
  assert.doesNotMatch(app, /aria-label="생성된 카드 목록"/)
  assert.doesNotMatch(app, /aria-label="완성 카드 목록"/)
  assert.doesNotMatch(app, /edit-tools-preview-modern/)
  assert.doesNotMatch(app, /edit-tool-badge">장면 편집/)
})

test('manual image-based templates start from blank image previews', () => {
  const css = readFileSync('src/App.css', 'utf8')
  const flow = readFileSync('src/creationFlow.ts', 'utf8')
  const previewImageRule = css.match(/\.layout-preview-image\s*\{(?<body>[^}]*)\}/)

  assert.match(flow, /title: '하단흰색'/)
  assert.match(flow, /title: '하단검정'/)
  assert.doesNotMatch(previewImageRule?.groups?.body ?? '', /gradient/)
  assert.match(previewImageRule?.groups?.body ?? '', /#f8f8f8/)
})

test('template changes apply the selected layout to existing cards', () => {
  const app = readFileSync('src/App.tsx', 'utf8')

  assert.match(app, /function applyProjectCardLayout\(nextLayout: CardLayout\)/)
  assert.match(app, /setSlides\(\(previousSlides\) =>\s*previousSlides\.map\(\(slide\) => \(\{\s*\.\.\.slide,\s*cardLayout: nextLayout,/)
  assert.match(app, /applyProjectCardLayout\(template\.layout\)/)
  assert.match(app, /setSelectedDirectTemplateId\(template\.id\)/)
  assert.match(app, /setSelectedAutoTemplateId\(template\.id\)/)
})

test('logo uploads are durable and logo size is configurable across previews and exports', () => {
  const app = readFileSync('src/App.tsx', 'utf8')

  assert.match(app, /logoScale\?: number/)
  assert.match(app, /const \[logoScale, setLogoScale\] = useState\(1\)/)
  assert.match(app, /logoScale,/)
  assert.match(app, /setLogoScale\(clamp\(parsedDraft\.logoScale, 0\.55, 1\.8\)\)/)
  assert.match(app, /const optimizedIcon = await optimizeLocalImage\(firstImage\)/)
  assert.match(app, /setAppIcon\(optimizedIcon\.dataUrl\)/)
  assert.doesNotMatch(app, /URL\.createObjectURL\(firstImage\)/)
  assert.match(app, /aria-label="로고 이미지 업로드"/)
  assert.match(app, /aria-label="로고 크기 조절"/)
  assert.match(app, /value=\{logoScale\}/)
  assert.match(app, /setLogoScale\(Number\(event\.target\.value\)\)/)
  assert.match(app, /<SlidePreview[\s\S]*logoScale=\{logoScale\}/)
  assert.match(app, /<SlideCanvas[\s\S]*logoScale=\{logoScale\}/)
  assert.match(app, /<SequenceSlide[\s\S]*logoScale=\{logoScale\}/)
  assert.match(app, /<AppStoreSlide[\s\S]*logoScale=\{logoScale\}/)
  assert.match(app, /className="sequence-cover-logo-image"/)
})

test('creation method step keeps real-time preview hidden until template selection', () => {
  const app = readFileSync('src/App.tsx', 'utf8')
  const stepOneBlock = app.slice(
    app.indexOf('{autoStep === 1 && ('),
    app.indexOf('{/* Step 2: 템플릿 및 레이아웃 선택 */}'),
  )
  const stepTwoBlock = app.slice(
    app.indexOf('{/* Step 2: 템플릿 및 레이아웃 선택 */}'),
    app.indexOf('{/* Step 3: 내용 입력'),
  )

  assert.match(stepOneBlock, /wizard-layout-start-modern/)
  assert.doesNotMatch(stepOneBlock, /실시간 미리보기/)
  assert.doesNotMatch(stepOneBlock, /preview-container-mockup-modern/)
  assert.match(stepTwoBlock, /실시간 미리보기/)
  assert.match(app, /const templatePreviewSlide = activeSlide \?\? createTemplatePreviewSlide/)
  assert.match(stepTwoBlock, /slide=\{templatePreviewSlide\}/)
})

test('sequence cardnews template uses the selected color across visible card surfaces', () => {
  const app = readFileSync('src/App.tsx', 'utf8')
  const css = readFileSync('src/App.css', 'utf8')
  const sequenceCardRule = css.match(/\.sequence-card\s*\{(?<body>[^}]*)\}/)
  const sequenceHeaderRule = css.match(/\.sequence-header\s*\{(?<body>[^}]*)\}/)
  const sequenceCalloutRule = css.match(/\.sequence-callout\s*\{(?<body>[^}]*)\}/)

  assert.match(app, /applySequenceColorToSlides\(nextColor\)/)
  assert.match(app, /setSlides\(\(previousSlides\) =>\s*previousSlides\.map\(\(slide\) =>/)
  assert.match(sequenceCardRule?.groups?.body ?? '', /color-mix\(in srgb, var\(--sequence-accent/)
  assert.match(sequenceHeaderRule?.groups?.body ?? '', /var\(--sequence-accent/)
  assert.match(sequenceCalloutRule?.groups?.body ?? '', /var\(--sequence-accent-soft/)
})

test('sequence cardnews template does not render generated slide images', () => {
  const app = readFileSync('src/App.tsx', 'utf8')
  const css = readFileSync('src/App.css', 'utf8')

  assert.doesNotMatch(app, /className="sequence-generated-image"/)
  assert.doesNotMatch(app, /src=\{slide\.dataUrl\}[\s\S]*className="sequence-generated-image"/)
  assert.doesNotMatch(css, /\.sequence-generated-image-wrap\s*\{/)
  assert.doesNotMatch(css, /\.sequence-generated-image\s*\{/)
})

test('sequence template preview does not reserve a separate image area', () => {
  const app = readFileSync('src/App.tsx', 'utf8')
  const css = readFileSync('src/App.css', 'utf8')
  const previewBlock = app.slice(
    app.indexOf('function TemplateLayoutPreview'),
    app.indexOf('function CropEditor'),
  )
  const sequencePreviewRule = css.match(/\.template-layout-preview\.sequence \.layout-preview-image\s*\{(?<body>[^}]*)\}/)

  assert.match(previewBlock, /layout === 'sequence' \? null : <span className="layout-preview-image" \/>/)
  assert.doesNotMatch(sequencePreviewRule?.groups?.body ?? '', /background:/)
})

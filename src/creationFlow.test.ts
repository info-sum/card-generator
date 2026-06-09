import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  AUTO_CREATION_FLOW_STEPS,
  AUTO_TEMPLATE_OPTIONS,
  DIRECT_CREATION_FLOW_STEPS,
  DIRECT_TEMPLATE_OPTIONS,
  EDITOR_DESIGN_TOOLS,
  EDITOR_WORKSPACE_ZONES,
  MODE_SWITCH_RESET_STEP,
  START_MODE_OPTIONS,
} from './creationFlow.js'

test('AUTO_CREATION_FLOW_STEPS match the attached 6-step generation flow', () => {
  assert.deepEqual(
    AUTO_CREATION_FLOW_STEPS.map((step) => step.label),
    ['주제 입력', '스타일 선택', '브랜드 설정', 'AI 생성', '편집', '다운로드'],
  )
})

test('DIRECT_CREATION_FLOW_STEPS keep AI generation controls out of manual mode', () => {
  assert.deepEqual(
    DIRECT_CREATION_FLOW_STEPS.map((step) => step.label),
    ['시작', '카드 추가', '카드 관리', '디자인 편집', '완료 및 내보내기'],
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

test('manual template grid uses the full selection width', () => {
  const css = readFileSync('src/App.css', 'utf8')
  const app = readFileSync('src/App.tsx', 'utf8')
  const manualGridRule = css.match(/\.manual-template-grid\s*\{(?<body>[^}]*)\}/)
  const manualPanelStartRule = css.match(/\.manual-panel-start\s*\{(?<body>[^}]*)\}/)

  assert.match(app, /manualStep === 1 \? 'manual-panel manual-panel-start' : 'manual-panel'/)
  assert.match(manualGridRule?.groups?.body ?? '', /repeat\(4,\s*minmax\(0,\s*1fr\)\)/)
  assert.match(manualPanelStartRule?.groups?.body ?? '', /grid-template-columns:\s*minmax\(0,\s*1fr\)/)
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

test('direct creation exposes editable brand information before card creation', () => {
  const app = readFileSync('src/App.tsx', 'utf8')

  assert.match(app, /직접 생성 브랜드 정보/)
  assert.match(app, /aria-label="직접 생성 메인 문구"/)
  assert.match(app, /aria-label="직접 생성 보조 문구"/)
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
  assert.match(app, /onClick=\{\(\) => applyProjectCardLayout\('overlay'\)\}/)
})

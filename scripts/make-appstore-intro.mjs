import { chromium } from 'playwright-core'
import fs from 'node:fs/promises'
import path from 'node:path'

const CHROME_EXECUTABLE =
  process.env.CHROME_PATH ??
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

// The app that generates App Store intro images (this repo deployment).
const STUDIO_URL = process.env.STUDIO_URL ?? 'https://cardstudio-coral.vercel.app'

// The project to capture (defaults to a demo view so the capture looks good).
const TARGET_URL = process.env.TARGET_URL ?? `${STUDIO_URL}/?demo=appshots`

// Project branding/copy (override via env if you want).
const APP_NAME = process.env.APP_NAME ?? 'Card Studio'
const APP_BADGE = process.env.APP_BADGE ?? 'CARD NEWS'
const APP_TAGLINE =
  process.env.APP_TAGLINE ?? '이미지 몇 장으로 SNS 카드뉴스와 스토어 소개 이미지를 완성'

const repoRoot = process.cwd()
const artifactsDir = path.join(repoRoot, 'artifacts', 'appstore-intro')
const capturesDir = path.join(artifactsDir, 'captures')
const downloadsDir = path.join(artifactsDir, 'exports')
const screenExportsDir = path.join(artifactsDir, 'screen-exports')
const copyOutPath = path.join(artifactsDir, 'copy-ko.json')

const DEFAULT_ICON_PATH = path.join(repoRoot, 'branding', 'app-logo-600.png')
const ICON_PATH = process.env.APP_ICON_PATH ?? DEFAULT_ICON_PATH

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function typeLikeHuman(locator, text) {
  await locator.click({ clickCount: 3 })
  await locator.type(text, { delay: 30 })
}

function inputInField(page, fieldLabelText) {
  return page.locator(`label.field:has-text("${fieldLabelText}") input`).first()
}

function textareaInField(page, fieldLabelText) {
  return page.locator(`label.field:has-text("${fieldLabelText}") textarea`).first()
}

async function captureProjectScreenshots() {
  await fs.mkdir(capturesDir, { recursive: true })

  const browser = await chromium.launch({
    executablePath: CHROME_EXECUTABLE,
    headless: true,
  })

  const context = await browser.newContext({
    // Desktop-first capture to avoid "responsive broken" screenshots.
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  })

  const page = await context.newPage()
  await page.goto(TARGET_URL, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)

  const paths = []
  for (let i = 0; i < 5; i += 1) {
    const filePath = path.join(capturesDir, `capture-${String(i + 1).padStart(2, '0')}.png`)
    await page.screenshot({ path: filePath })
    paths.push(filePath)
    await page.mouse.wheel(0, 700)
    await page.waitForTimeout(650)
  }

  await context.close()
  await browser.close()
  return paths
}

async function captureStudioPreviewScreenshots(inputImagePaths) {
  await fs.mkdir(capturesDir, { recursive: true })

  const browser = await chromium.launch({
    executablePath: CHROME_EXECUTABLE,
    headless: true,
  })

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  })

  const page = await context.newPage()
  await page.goto(STUDIO_URL, { waitUntil: 'domcontentloaded' })
  if (page.url().includes('/intro')) {
    await page.goto(`${STUDIO_URL}/`, { waitUntil: 'domcontentloaded' })
  }

  await page.getByRole('button', { name: '사진첩에서 가져오기' }).waitFor({ timeout: 60_000 })
  await page.locator('input[type="file"]').first().setInputFiles(inputImagePaths)
  await page.locator('#workspace-section').waitFor({ timeout: 60_000 })
  await sleep(800)

  // Capture the in-page "Live Preview" area (cleaner than modal / translucent backdrops).
  const outputs = []
  const slideCards = page.locator('.slide-rail-card')
  const slideCount = await slideCards.count()
  const targetCount = Math.min(5, slideCount)

  for (let i = 0; i < targetCount; i += 1) {
    await slideCards.nth(i).locator('button.slide-rail-main').click()
    await sleep(550)
    await page.locator('#scene-preview-section').scrollIntoViewIfNeeded()
    await sleep(450)
    const filePath = path.join(capturesDir, `preview-${String(i + 1).padStart(2, '0')}.png`)
    await page.locator('#scene-preview-section .scene-preview-grid').screenshot({ path: filePath })
    outputs.push(filePath)
  }

  await context.close()
  await browser.close()

  return outputs
}

async function generateAppStoreIntroImages(imagePaths) {
  await fs.mkdir(downloadsDir, { recursive: true })
  await fs.mkdir(screenExportsDir, { recursive: true })

  const browser = await chromium.launch({
    executablePath: CHROME_EXECUTABLE,
    headless: true,
  })

  const context = await browser.newContext({
    // Tall viewport so element screenshots never clip.
    viewport: { width: 1440, height: 3000 },
    recordVideo: undefined,
    acceptDownloads: true,
  })

  const page = await context.newPage()
  await page.goto(STUDIO_URL, { waitUntil: 'domcontentloaded' })

  // If the intro page is shown for any reason, go to the app root.
  if (page.url().includes('/intro')) {
    await page.goto(`${STUDIO_URL}/`, { waitUntil: 'domcontentloaded' })
  }

  await page.getByRole('button', { name: '사진첩에서 가져오기' }).waitFor({ timeout: 60_000 })
  await sleep(600)

  // Upload screenshots as slide images.
  await page.locator('input[type="file"]').first().setInputFiles(imagePaths)

  await page.locator('#workspace-section').waitFor({ timeout: 60_000 })
  await sleep(700)

  // Switch to App Store mode + pick a common resolution preset.
  await page.getByRole('button', { name: '앱스토어 소개 이미지' }).click()
  await sleep(400)
  // Ensure the App Store frame is set to "preview" (no phone mockup).
  const previewFrameButton = page.getByRole('button', { name: '미리보기' }).first()
  if (await previewFrameButton.count()) {
    await previewFrameButton.click()
    await sleep(350)
  }
  const presetButton = page.getByRole('button', { name: /App Store 1125 x 2436/ })
  if (await presetButton.count()) {
    await presetButton.click()
    await sleep(400)
  }

  // Upload app icon (optional).
  try {
    await fs.stat(ICON_PATH)
    // Reuse the same file input, but mark it as "icon" intent for the handler.
    await page.evaluate(() => {
      const input = document.querySelector('input[type="file"]')
      if (input instanceof HTMLInputElement) {
        input.dataset.intent = 'icon'
      }
    })
    await page.locator('input[type="file"]').first().setInputFiles([ICON_PATH])
    await page.evaluate(() => {
      const input = document.querySelector('input[type="file"]')
      if (input instanceof HTMLInputElement) {
        delete input.dataset.intent
      }
    })
    await sleep(500)
  } catch {
    // Icon path missing: skip.
  }

  // Fill project-level fields.
  await typeLikeHuman(inputInField(page, '서비스 이름'), APP_NAME)
  await typeLikeHuman(inputInField(page, '보조 배지 (기본값)'), APP_BADGE)
  await typeLikeHuman(inputInField(page, '메인 메시지'), APP_TAGLINE)

  const copy = [
    {
      kicker: 'PROJECT',
      title: `${APP_NAME}로 한 번에`,
      description: '스크린샷 몇 장과 짧은 문구만으로 앱스토어 소개 이미지를 빠르게 구성합니다.',
    },
    {
      kicker: 'FAST SETUP',
      title: '최대 20장 업로드',
      description: '이미지를 최대 20장까지 넣고, 카드 흐름을 늘리면서 장면별 카피를 빠르게 정리할 수 있어요.',
    },
    {
      kicker: 'EDIT',
      title: '카피와 레이아웃 정리',
      description: '헤드라인, 설명, 배지 문구를 장면마다 다듬고, 필요한 경우 순서를 바꿔 흐름을 구성합니다.',
    },
    {
      kicker: 'PREVIEW',
      title: '미리보기로 전체 흐름 확인',
      description: '카드뉴스 미리보기 화면에서 전체 흐름을 한 번에 확인하고, 필요한 장만 다시 골라 수정합니다.',
    },
    {
      kicker: 'EXPORT',
      title: '전체 PNG로 저장',
      description: '완성된 소개 이미지를 고해상도 PNG로 한 번에 내보내고, 제출용으로 바로 사용할 수 있어요.',
    },
  ]

  // Update slide-level copy for each slide.
  const slideCards = page.locator('.slide-rail-card')
  const slideCount = await slideCards.count()
  const targetCount = Math.min(slideCount, copy.length)

  for (let i = 0; i < targetCount; i += 1) {
    await slideCards.nth(i).locator('button.slide-rail-main').click()
    await sleep(450)

    await typeLikeHuman(inputInField(page, '상단 라벨'), copy[i].kicker)
    await typeLikeHuman(inputInField(page, '헤드라인'), copy[i].title)
    const desc = textareaInField(page, '설명')
    await desc.click()
    await desc.fill('')
    await desc.type(copy[i].description, { delay: 18 })
    await sleep(450)
  }

  // Export all slides as PNG downloads.
  await page.getByRole('button', { name: /결과보기 및 저장/ }).click()
  await sleep(700)

  // 1) "Screen capture" exports: render the hidden export DOM on-screen, then screenshot each slide.
  await page.addStyleTag({
    content: `
      .export-render-root {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        opacity: 1 !important;
      }
      .export-offscreen { margin-bottom: 24px !important; }
    `,
  })
  await sleep(300)

  const slideCanvases = page.locator('.export-render-root .slide-canvas')
  const exportCount = Math.min(await slideCanvases.count(), targetCount)
  const screenSaved = []
  for (let index = 0; index < exportCount; index += 1) {
    const outPath = path.join(
      screenExportsDir,
      `${String(index + 1).padStart(2, '0')}-appstore-screen.png`,
    )
    await slideCanvases.nth(index).screenshot({ path: outPath })
    screenSaved.push(outPath)
  }

  // 2) Optional downloads (kept for parity with the UI). Some environments rename/clip downloads.
  const saved = []
  try {
    await page.getByRole('button', { name: '전체 PNG 저장' }).click()
    for (let index = 0; index < exportCount; index += 1) {
      const download = await page.waitForEvent('download', { timeout: 120_000 })
      const suggested = download.suggestedFilename()
      const outPath = path.join(
        downloadsDir,
        `${String(index + 1).padStart(2, '0')}-${suggested}`,
      )
      await download.saveAs(outPath)
      saved.push(outPath)
    }
  } catch {
    // Ignore download failures; screenSaved is the primary output per request.
  }

  await fs.writeFile(
    copyOutPath,
    JSON.stringify(
      {
        studioUrl: STUDIO_URL,
        targetUrl: TARGET_URL,
        appName: APP_NAME,
        badge: APP_BADGE,
        tagline: APP_TAGLINE,
        slides: copy,
        exports: saved.map((p) => path.relative(repoRoot, p)),
        screenExports: screenSaved.map((p) => path.relative(repoRoot, p)),
      },
      null,
      2,
    ),
    'utf8',
  )

  await context.close()
  await browser.close()

  return { saved, screenSaved, copy }
}

async function main() {
  await fs.mkdir(artifactsDir, { recursive: true })
  const targetCaptures = await captureProjectScreenshots()
  const studioPreviewCaptures = await captureStudioPreviewScreenshots(targetCaptures)
  const result = await generateAppStoreIntroImages(studioPreviewCaptures)

  console.log(JSON.stringify({
    capturesDir,
    downloadsDir,
    screenExportsDir,
    copyOutPath,
    exports: result.saved,
    screenExports: result.screenSaved,
  }))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

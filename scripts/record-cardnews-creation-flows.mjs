import { chromium } from 'playwright-core'
import fs from 'node:fs/promises'
import path from 'node:path'

const CHROME_EXECUTABLE =
  process.env.CHROME_EXECUTABLE ??
  path.join(
    process.cwd(),
    'node_modules',
    '.remotion',
    'chrome-headless-shell',
    'mac-arm64',
    'chrome-headless-shell-mac-arm64',
    'chrome-headless-shell',
  )
const CARDSTUDIO_URL = process.env.CARDSTUDIO_URL ?? 'http://127.0.0.1:3000/'
const VIEWPORT = { width: 1440, height: 1000 }

const repoRoot = process.cwd()
const videoDir = path.join(repoRoot, 'artifacts', 'videos')

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function typeLikeHuman(locator, text) {
  await locator.click({ clickCount: 3 })
  await locator.type(text, { delay: 24 })
}

async function clickButton(page, name) {
  await page.getByRole('button', { name }).click()
}

async function clickFirstMatchingButton(page, name) {
  await page.getByRole('button', { name }).first().click()
}

async function clickScopedTemplate(page, sectionLabel, templateName) {
  const section = page.locator(`[aria-label="${sectionLabel}"]`)
  await section.getByRole('button', { name: new RegExp(templateName) }).click()
}

async function copyLatestVideo(rawDir, outputName) {
  const videoFiles = (await fs.readdir(rawDir))
    .filter((fileName) => fileName.endsWith('.webm'))
    .map((fileName) => path.join(rawDir, fileName))

  if (videoFiles.length === 0) {
    throw new Error(`No video file was produced in ${rawDir}.`)
  }

  const videoWithStats = await Promise.all(
    videoFiles.map(async (file) => ({ file, stat: await fs.stat(file) })),
  )
  videoWithStats.sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs)

  const outVideo = path.join(videoDir, outputName)
  await fs.copyFile(videoWithStats[0].file, outVideo)
  await fs.rm(rawDir, { recursive: true, force: true })

  return outVideo
}

async function recordFlow(outputName, runFlow) {
  const rawDir = path.join(videoDir, `${outputName.replace(/\.webm$/, '')}-raw`)
  await fs.mkdir(rawDir, { recursive: true })

  const browser = await chromium.launch({
    executablePath: CHROME_EXECUTABLE,
    headless: true,
  })

  const context = await browser.newContext({
    viewport: VIEWPORT,
    recordVideo: { dir: rawDir, size: VIEWPORT },
    acceptDownloads: false,
  })

  const page = await context.newPage()
  try {
    await page.goto(CARDSTUDIO_URL, { waitUntil: 'domcontentloaded' })
    await page.getByRole('heading', { name: /어떤 방식으로 시작할까요|카드뉴스 만들기/ }).waitFor()
    await sleep(800)

    await runFlow(page)
    await sleep(1200)
  } finally {
    await context.close()
    await browser.close()
  }

  return copyLatestVideo(rawDir, outputName)
}

async function recordAutoGeneration() {
  return recordFlow('auto-cardnews-creation.webm', async (page) => {
    await clickFirstMatchingButton(page, /자동 생성/)
    const topicInput = page.getByPlaceholder('카드뉴스 주제를 입력해주세요')
    await topicInput.waitFor()
    await sleep(500)

    await typeLikeHuman(topicInput, '토스 리워드 광고로 다운로드 전환율 높이기')
    await sleep(500)
    await clickButton(page, '다음 →')
    await sleep(700)

    await page.getByRole('button', { name: /뉴스형/ }).click()
    await sleep(600)
    await clickButton(page, '다음 →')
    await sleep(700)

    await typeLikeHuman(page.getByLabel('브랜드 명칭'), 'Ait Studio')
    await page.getByRole('button', { name: /브랜드 색상 #1868DB/ }).click()
    await sleep(600)
    await clickButton(page, '다음 →')
    await sleep(700)

    await clickScopedTemplate(page, '자동 생성 레이아웃 선택', '카드뉴스')
    await sleep(800)
    await page.getByRole('button', { name: /선택한 레이아웃으로 생성/ }).click()

    await page.getByRole('button', { name: '편집 시작' }).waitFor({ timeout: 20_000 })
    await sleep(1200)
    await clickButton(page, '편집 시작')

    await page.getByLabel('내용 입력').waitFor()
    await sleep(700)
    await typeLikeHuman(page.getByLabel('제목'), '광고 보상으로 만드는 다운로드 흐름')
    await typeLikeHuman(
      page.getByLabel('내용1'),
      '사용자가 다운로드를 누르는 순간 보상형 광고가 자연스럽게 연결됩니다.',
    )

    const secondaryContent = page.getByLabel('내용2')
    if ((await secondaryContent.count()) > 0) {
      await typeLikeHuman(secondaryContent, '보상 경험은 유지하고, 카드뉴스 제작 흐름은 끊기지 않게 설계합니다.')
    }

    await sleep(800)
    await page.getByRole('button', { name: /결과보기 및 저장/ }).click()
    await page.getByText('전체 결과 미리보기').waitFor()
  })
}

async function recordManualGeneration() {
  return recordFlow('manual-cardnews-creation.webm', async (page) => {
    await clickFirstMatchingButton(page, /직접 생성/)
    await page.getByText('새 카드 추가').waitFor()
    await sleep(600)

    await typeLikeHuman(page.getByLabel('직접 생성 브랜드 명칭'), 'Manual Studio')
    await clickScopedTemplate(page, '직접 생성 레이아웃 선택', '하단흰색')
    await sleep(800)
    await clickButton(page, '+ 카드 추가')

    await page.getByLabel('내용 입력').waitFor()
    await sleep(700)
    await typeLikeHuman(page.getByLabel('상단 라벨'), '직접 구성')
    await typeLikeHuman(page.getByLabel('제목'), '내가 직접 쌓는 카드뉴스')
    await typeLikeHuman(
      page.getByLabel('내용1'),
      '템플릿을 고르고 제목과 본문을 바로 입력해서 장면을 완성합니다.',
    )

    await sleep(800)

    await page.getByRole('button', { name: /결과보기 및 저장/ }).click()
    await page.getByText('전체 결과 미리보기').waitFor()
  })
}

async function main() {
  await fs.mkdir(videoDir, { recursive: true })

  const autoVideo = await recordAutoGeneration()
  const manualVideo = await recordManualGeneration()

  console.log(autoVideo)
  console.log(manualVideo)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

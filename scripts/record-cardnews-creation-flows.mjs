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
const CARDSTUDIO_URL = process.env.CARDSTUDIO_URL ?? 'http://127.0.0.1:4190/'
const VIEWPORT = { width: 1440, height: 1000 }

const repoRoot = process.cwd()
const videoDir = path.join(repoRoot, 'artifacts', 'videos')

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function typeLikeHuman(locator, text) {
  await locator.fill('')
  await locator.type(text, { delay: 24 })
}

async function clickButton(page, name) {
  await page.getByRole('button', { name }).click()
}

async function clickFirstMatchingButton(page, name) {
  await page.getByRole('button', { name }).first().click()
}

async function clickTemplate(page, templateName) {
  const templates = page.locator('.template-option-grid-modern')
  await templates.getByRole('button', { name: new RegExp(templateName) }).click()
}

async function maybeFill(page, label, text) {
  const field = page.getByLabel(label)
  if ((await field.count()) > 0) {
    await typeLikeHuman(field, text)
  }
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
  await page.addInitScript(() => {
    window.localStorage.clear()
  })
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.text().toLowerCase().includes('error')) {
      console.error(`[BROWSER ERROR] ${msg.text()}`);
    }
  });
  page.on('pageerror', exception => {
    console.error(`[PAGE EXCEPTION] ${exception.toString()}`);
  });
  try {
    await page.goto(CARDSTUDIO_URL, { waitUntil: 'domcontentloaded' })
    await page.getByRole('button', { name: /자동 생성으로 시작하기|직접 작성으로 시작하기/ }).first().waitFor()
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
    await clickFirstMatchingButton(page, /자동 생성으로 시작하기/)
    const topicInput = page.getByLabel('카드뉴스 주제')
    await topicInput.waitFor()
    await sleep(500)

    await typeLikeHuman(topicInput, '토스 리워드 광고로 다운로드 전환율 높이기')
    await sleep(500)
    await clickButton(page, '8장')
    await page.getByRole('button', { name: /전문적인/ }).click()
    await sleep(600)
    await page.getByRole('button', { name: /브랜드\/레이아웃 설정하기/ }).click()
    await sleep(700)
    await clickTemplate(page, '카드뉴스')
    await typeLikeHuman(page.getByLabel('브랜드 명칭'), 'Ait Studio')
    await page.getByRole('button', { name: /색상 #1868DB/ }).click()
    await sleep(600)
    await page.getByRole('button', { name: /AI 카드 생성하기/ }).click()

    await page.getByText('모든 카드가 완성이 되었습니다!').waitFor({ timeout: 25_000 })
    await sleep(1200)
    await page.getByRole('button', { name: /1번 카드 편집/ }).click()

    await page.getByLabel('카드 제목').waitFor()
    await sleep(700)
    await typeLikeHuman(page.getByLabel('카드 제목'), '보상형 광고로 완성하는 다운로드 흐름')
    await typeLikeHuman(
      page.getByLabel('카드 본문 내용1'),
      '사용자가 다운로드를 누르는 순간 보상형 광고가 자연스럽게 연결됩니다.',
    )

    await maybeFill(page, '카드 하단 내용2', '보상 경험은 유지하고 제작 흐름은 끊기지 않게 설계합니다.')
    await maybeFill(page, '카드 배지 문구', 'AUTO')

    await sleep(800)
    await page.getByRole('button', { name: /디자인 세부 설정/ }).click()
    await sleep(700)
    await page.getByRole('button', { name: /디자인 적용 후 다운로드 단계로/ }).click()
    await page.getByText('최종 카드 뉴스 그리드').waitFor()
  })
}

async function recordManualGeneration() {
  return recordFlow('manual-cardnews-creation.webm', async (page) => {
    await clickFirstMatchingButton(page, /직접 작성으로 시작하기/)
    await page.getByRole('button', { name: /카드 추가하고 시작하기/ }).waitFor()
    await sleep(600)

    await page.getByRole('button', { name: /카드 추가하고 시작하기/ }).click()
    await page.getByText('템플릿 선택').waitFor()
    await sleep(800)

    await clickTemplate(page, '카드뉴스')
    await typeLikeHuman(page.getByLabel('브랜드 명칭'), 'Manual Studio')
    await page.getByRole('button', { name: '색상 #0F8A8D' }).click()
    await sleep(800)
    await page.getByRole('button', { name: /템플릿 및 컬러 적용 후 다음 단계로/ }).click()

    await page.getByLabel('카드 제목').waitFor()
    await sleep(700)
    await typeLikeHuman(page.getByLabel('카드 상단 라벨'), '직접 구성')
    await typeLikeHuman(page.getByLabel('카드 제목'), '내가 직접 쌓는 카드뉴스')
    await typeLikeHuman(
      page.getByLabel('카드 본문 내용1'),
      '템플릿을 고르고 제목과 본문을 바로 입력해서 장면을 완성합니다.',
    )
    await maybeFill(page, '카드 하단 내용2', '브랜드 문구와 로고, 색상까지 같은 편집 흐름에서 확인합니다.')
    await maybeFill(page, '카드 배지 문구', 'MANUAL')

    await sleep(800)
    await page.getByRole('button', { name: /디자인 세부 설정/ }).click()
    await sleep(700)
    await page.getByRole('button', { name: /디자인 적용 후 다운로드 단계로/ }).click()
    await page.getByText('최종 카드 뉴스 그리드').waitFor()
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

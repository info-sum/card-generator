import { chromium } from 'playwright-core'
import fs from 'node:fs/promises'
import path from 'node:path'

const CHROME_EXECUTABLE = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const CARDSTUDIO_URL = 'https://cardstudio-coral.vercel.app'
const NPR_SEARCH_URL = 'https://www.npr.org/search?query=iran'

const repoRoot = process.cwd()
const artifactsDir = path.join(repoRoot, 'artifacts')
const videoDir = path.join(artifactsDir, 'videos')
const outVideo = path.join(artifactsDir, 'iran-cardnews-demo.webm')

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function typeLikeHuman(locator, text) {
  await locator.click({ clickCount: 3 })
  await locator.type(text, { delay: 35 })
}

function inputInField(page, fieldLabelText) {
  return page.locator(`label.field:has-text("${fieldLabelText}") input`).first()
}

async function main() {
  await fs.mkdir(videoDir, { recursive: true })

  const browser = await chromium.launch({
    executablePath: CHROME_EXECUTABLE,
    headless: true,
  })

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: videoDir, size: { width: 1440, height: 900 } },
    acceptDownloads: true,
  })

  const page = await context.newPage()

  // 1) Find a US-based article about Iran (NPR) via site search.
  await page.goto(NPR_SEARCH_URL, { waitUntil: 'domcontentloaded' })
  await sleep(1200)

  const firstVisibleResult = page
    .locator('a[href*="npr.org/202"]:visible')
    .filter({ hasNotText: 'Donate' })
    .first()

  const anyResult = page
    .locator('a[href*="npr.org/202"]')
    .filter({ hasNotText: 'Donate' })
    .first()

  if ((await firstVisibleResult.count()) > 0) {
    await firstVisibleResult.scrollIntoViewIfNeeded()
    await sleep(400)
    await firstVisibleResult.click()
    await page.waitForLoadState('domcontentloaded')
  } else if ((await anyResult.count()) > 0) {
    const href = await anyResult.getAttribute('href')
    if (!href) {
      throw new Error('Found an NPR result link but it has no href.')
    }
    // Some pages render hidden navigation links before actual search results.
    // Navigation via goto keeps the flow reliable for recording.
    await page.goto(href, { waitUntil: 'domcontentloaded' })
  } else {
    throw new Error('Could not find an NPR search result link to open.')
  }
  await sleep(800)

  const articleTitle = (await page.locator('h1').first().textContent())?.trim() || 'Iran (NPR)'
  const articleUrl = page.url()

  const paragraphs = await page.locator('article p').allTextContents()
  const intro = paragraphs.map((p) => p.trim()).filter(Boolean).slice(0, 3)

  await page.mouse.wheel(0, 900)
  await sleep(700)

  // 2) Open Card Studio and create a card-news flow based on the article.
  await page.goto(CARDSTUDIO_URL, { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: '사진첩에서 가져오기' }).waitFor()
  await sleep(700)

  await page.getByRole('button', { name: '사진첩에서 가져오기' }).click()

  const images = [
    path.join(repoRoot, 'branding', 'landscape-thumbnail-1932x828.png'),
    path.join(repoRoot, 'branding', 'landscape-thumbnail-1932x828-sips.png'),
    path.join(repoRoot, 'branding', 'app-logo-600.png'),
    path.join(repoRoot, 'branding', 'app-logo-dark-600.png'),
    path.join(repoRoot, 'branding', 'logo.svg.png'),
  ]

  await page.locator('input[type="file"]').first().setInputFiles(images)

  await page.locator('#workspace-section').waitFor({ timeout: 60_000 })
  await sleep(800)

  // Close help modal if it is opened by stored draft state.
  const helpModal = page.locator('.help-modal')
  if (await helpModal.isVisible().catch(() => false)) {
    const closeButton = page.getByRole('button', { name: '닫기' }).first()
    if (await closeButton.count()) {
      await closeButton.click()
      await sleep(400)
    }
  }

  // Project-level copy: use the article title/URL so the recording clearly ties to the source.
  await typeLikeHuman(inputInField(page, '메인 메시지'), `이란 카드뉴스: ${articleTitle}`)
  await typeLikeHuman(inputInField(page, '보조 배지 (기본값)'), `Source: ${new URL(articleUrl).hostname}`)
  await sleep(400)

  const slideCopy = [
    {
      kicker: 'Iran / US News',
      title: articleTitle.slice(0, 60),
      description: intro[0] || '기사 핵심 내용을 카드뉴스로 요약합니다.',
    },
    {
      kicker: 'What happened',
      title: '핵심 내용 요약',
      description: intro[1] || '기사 본문에서 주요 사실을 정리합니다.',
    },
    {
      kicker: 'Why it matters',
      title: '왜 중요한가',
      description: '미국/중동 정세, 제재, 핵 협상 등 맥락에서 의미를 한 장으로 정리합니다.',
    },
    {
      kicker: 'Key points',
      title: '포인트 3가지',
      description: '1) 주요 당사자 2) 일정/수치 3) 다음 관전 포인트',
    },
    {
      kicker: 'Takeaway',
      title: '한 줄 정리',
      description: `원문 링크: ${articleUrl}`,
    },
  ]

  const slideCards = page.locator('.slide-rail-card')
  const slideCount = await slideCards.count()
  const targetCount = Math.min(slideCount, slideCopy.length)

  for (let i = 0; i < targetCount; i += 1) {
    await slideCards.nth(i).locator('button.slide-rail-main').click()
    await sleep(450)

    await typeLikeHuman(page.getByLabel('상단 라벨'), slideCopy[i].kicker)
    await typeLikeHuman(page.getByLabel('헤드라인'), slideCopy[i].title)
    await page.getByLabel('설명').click()
    await page.getByLabel('설명').fill('')
    await page.getByLabel('설명').type(slideCopy[i].description, { delay: 18 })
    await sleep(500)
  }

  // Show export flow in the recording.
  await page.getByRole('button', { name: /결과보기 및 저장/ }).click()
  await sleep(800)
  await page.getByRole('button', { name: '전체 PNG 저장' }).click()
  await sleep(1500)

  await context.close()
  await browser.close()

  // Find the latest recorded webm and move it to a stable output path.
  const videoFiles = (await fs.readdir(videoDir))
    .filter((name) => name.endsWith('.webm'))
    .map((name) => path.join(videoDir, name))

  if (videoFiles.length === 0) {
    throw new Error('No video file was produced by Playwright.')
  }

  const videoWithStats = await Promise.all(
    videoFiles.map(async (file) => ({ file, stat: await fs.stat(file) })),
  )
  videoWithStats.sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs)

  await fs.copyFile(videoWithStats[0].file, outVideo)
  console.log(outVideo)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

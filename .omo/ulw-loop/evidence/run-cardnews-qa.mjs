import { writeFile } from 'node:fs/promises'
import { chromium } from 'playwright-core'

const appUrl = 'http://127.0.0.1:4184/'
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const logoDataUrl = 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2280%22%20height%3D%2280%22%20viewBox%3D%220%200%2080%2080%22%3E%3Crect%20width%3D%2280%22%20height%3D%2280%22%20rx%3D%2240%22%20fill%3D%22%231247d8%22%2F%3E%3Ctext%20x%3D%2240%22%20y%3D%2250%22%20text-anchor%3D%22middle%22%20font-size%3D%2228%22%20font-family%3D%22Arial%22%20font-weight%3D%22700%22%20fill%3D%22white%22%3EB%3C%2Ftext%3E%3C%2Fsvg%3E'

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
})

const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } })

try {
  await page.goto(appUrl, { waitUntil: 'domcontentloaded' })
  await page.evaluate((appIcon) => {
    const storageKey = 'image-marketing-studio-draft-v1'
    window.localStorage.setItem(storageKey, JSON.stringify({
      brandName: '내 브랜드 테스트',
      appIcon,
      projectBadge: '',
      projectTitle: '',
      mode: 'social',
      presetId: 'social-portrait',
      themeId: 'custom',
      cardLayout: 'sequence',
      customColor: '#1247d8',
      slides: [],
      updatedAt: new Date().toISOString(),
    }))
  }, logoDataUrl)
  await page.reload({ waitUntil: 'domcontentloaded' })

  const directTab = page.getByRole('tab', { name: '직접 생성' })
  if (await directTab.count() > 0) {
    await directTab.first().click()
  } else {
    await page.getByText('직접 생성', { exact: true }).first().click()
  }
  await page.locator('button.template-option').filter({ hasText: '카드뉴스' }).last().click()
  await page.getByRole('button', { name: /선택 레이아웃으로 새 카드/ }).click()
  await page.waitForSelector('.slide-canvas.sequence-slide')
  await page.locator('.editor-mini-actions button').filter({ hasText: '+ 추가' }).click()
  await page.waitForFunction(() => document.querySelectorAll('.editor-card-thumb').length >= 2)

  const state = await page.evaluate(() => {
    const canvas = document.querySelector('.slide-canvas.sequence-slide')
    const coverCanvas = document.querySelector('.sequence-slide.cover')
    const detailCanvas = document.querySelector('.sequence-slide.detail')
    const slideNode = document.querySelector('.sequence-slide')
    const cardNode = document.querySelector('.sequence-card')
    const slideStyle = slideNode == null ? null : getComputedStyle(slideNode)
    const cardStyle = cardNode == null ? null : getComputedStyle(cardNode)

    return {
      sequenceCanvasVisible: Boolean(canvas),
      firstCardCoverVisible: Boolean(coverCanvas),
      detailCardVisible: Boolean(detailCanvas),
      logoVisible: Boolean(document.querySelector('.sequence-slide.detail .sequence-logo-image')),
      brandVisible: detailCanvas?.textContent?.includes('내 브랜드 테스트') ?? false,
      titleFieldVisible: Array.from(document.querySelectorAll('label')).some((label) => label.textContent?.includes('제목')),
      content1FieldVisible: Array.from(document.querySelectorAll('label')).some((label) => label.textContent?.includes('내용1')),
      content2FieldVisible: Array.from(document.querySelectorAll('label')).some((label) => label.textContent?.includes('내용2')),
      imageSizeToolVisible: document.body.textContent?.includes('이미지 사이즈'),
      imageSizeSectionVisible: document.body.textContent?.includes('이미지 사이즈 조정'),
      zoomControlVisible: Array.from(document.querySelectorAll('label')).some((label) => label.textContent?.includes('줌')),
      content1Visible: Boolean(document.querySelector('.sequence-description')),
      content2Visible: Boolean(document.querySelector('.sequence-callout')),
      bannedManualProjectTitleVisible: Array.from(document.querySelectorAll('.slide-canvas')).some((node) => node.textContent?.includes('직접 만든 카드뉴스')),
      bannedManualBadgeVisible: Array.from(document.querySelectorAll('.slide-canvas')).some((node) => node.textContent?.includes('Manual Card News')),
      blueShell: slideStyle?.backgroundColor ?? '',
      whiteCard: cardStyle?.backgroundColor ?? '',
      calloutText: document.querySelector('.sequence-callout')?.textContent?.trim() ?? '',
      descriptionText: document.querySelector('.sequence-description')?.textContent?.trim() ?? '',
    }
  })

  if (!state.sequenceCanvasVisible) throw new Error('sequence canvas missing')
  if (!state.firstCardCoverVisible) throw new Error('first sequence card is not the original cover')
  if (!state.detailCardVisible) throw new Error('detail sequence card missing')
  if (!state.logoVisible) throw new Error('registered logo missing')
  if (!state.brandVisible) throw new Error('brand name missing')
  if (!state.titleFieldVisible || !state.content1FieldVisible || !state.content2FieldVisible) {
    throw new Error('editor title/content fields missing')
  }
  if (!state.imageSizeToolVisible || !state.imageSizeSectionVisible || !state.zoomControlVisible) {
    throw new Error('direct image size controls missing')
  }
  if (!state.content1Visible || !state.content2Visible) throw new Error('sequence content sections missing')
  if (state.bannedManualProjectTitleVisible || state.bannedManualBadgeVisible) {
    throw new Error('manual filler phrase rendered')
  }

  await page.screenshot({ path: '.omo/ulw-loop/screenshots/sequence-sections.png', fullPage: false })
  await page.screenshot({ path: '.omo/ulw-loop/screenshots/sequence-logo.png', fullPage: false })

  const evidence = {
    state,
    cleanup: 'closed Playwright Chrome browser context',
  }
  await writeFile('.omo/ulw-loop/evidence/sequence-sections-browser.json', JSON.stringify(evidence, null, 2))
  await writeFile('.omo/ulw-loop/evidence/manual-branding-browser.json', JSON.stringify(evidence, null, 2))
  await writeFile('.omo/ulw-loop/evidence/sequence-logo-browser.json', JSON.stringify(evidence, null, 2))
  console.log(JSON.stringify(evidence, null, 2))
} finally {
  await page.close()
  await browser.close()
}

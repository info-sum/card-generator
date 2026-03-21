import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const outputDir = path.join(rootDir, 'branding', 'store-screenshots')
const baseUrl =
  process.env.APPSHOT_URL ?? 'http://127.0.0.1:4173/?demo=appshots'
const executablePath =
  process.env.CHROME_PATH ??
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

await mkdir(outputDir, { recursive: true })

const browser = await chromium.launch({
  executablePath,
  headless: true,
})

const page = await browser.newPage({
  viewport: {
    width: 636,
    height: 1048,
  },
  deviceScaleFactor: 1,
})

await page.goto(baseUrl, { waitUntil: 'networkidle' })
await page.addStyleTag({
  content: `
    html, body {
      scroll-behavior: auto !important;
      scrollbar-width: none;
    }

    body::-webkit-scrollbar {
      display: none;
    }
  `,
})

await page.evaluate(async () => {
  if ('fonts' in document) {
    await document.fonts.ready
  }
})
await page.waitForTimeout(700)

async function alignSection(selector) {
  await page.evaluate((nextSelector) => {
    const node = document.querySelector(nextSelector)

    if (node instanceof HTMLElement === false) {
      return
    }

    const top = window.scrollY + node.getBoundingClientRect().top - 16
    window.scrollTo({
      top,
      behavior: 'auto',
    })
  }, selector)
  await page.waitForTimeout(450)
}

const captures = [
  {
    path: path.join(outputDir, 'portrait-01-overview.png'),
    prepare: async () => {
      await page.evaluate(() => {
        window.scrollTo({
          top: 0,
          behavior: 'auto',
        })
      })
      await page.waitForTimeout(450)
    },
  },
  {
    path: path.join(outputDir, 'portrait-02-editor.png'),
    prepare: async () => {
      await alignSection('#screenshot-editor')
    },
  },
  {
    path: path.join(outputDir, 'portrait-03-preview.png'),
    prepare: async () => {
      await page.getByRole('button', { name: '앱스토어 소개 이미지' }).click()
      await page.waitForTimeout(500)
      await alignSection('#screenshot-preview')
    },
  },
]

for (const capture of captures) {
  await capture.prepare()
  await page.screenshot({
    path: capture.path,
  })
}

await browser.close()

import { bundle } from '@remotion/bundler'
import { renderMedia, selectComposition } from '@remotion/renderer'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outputLocation = path.join(repoRoot, 'artifacts', 'remotion', 'site-promo-launch.mp4')

await fs.mkdir(path.dirname(outputLocation), { recursive: true })

console.log('Bundling Remotion composition for SitePromoVideo...')
const serveUrl = await bundle({
  entryPoint: path.join(repoRoot, 'src', 'remotion', 'index.ts'),
  onProgress: (progress) => {
    process.stdout.write(`\rBundle ${Math.round(progress * 100)}%`)
  },
})
process.stdout.write('\n')

console.log('Selecting composition...')
const composition = await selectComposition({
  id: 'SitePromoVideo',
  serveUrl,
})

console.log(`Rendering ${outputLocation}...`)
await renderMedia({
  codec: 'h264',
  composition,
  onProgress: ({ progress }) => {
    process.stdout.write(`\rRender ${Math.round(progress * 100)}%`)
  },
  outputLocation,
  serveUrl,
})
process.stdout.write('\n')

console.log(`Promo Video ready: ${outputLocation}`)

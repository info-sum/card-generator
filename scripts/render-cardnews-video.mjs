import { bundle } from '@remotion/bundler'
import { renderMedia, selectComposition } from '@remotion/renderer'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const defaultOutput = path.join(repoRoot, 'artifacts', 'remotion', 'cardnews-auto-generation.mp4')

function readOption(name, fallback) {
  const prefix = `--${name}=`
  const inline = process.argv.find((arg) => arg.startsWith(prefix))
  if (inline != null) {
    return inline.slice(prefix.length)
  }

  const index = process.argv.indexOf(`--${name}`)
  if (index >= 0) {
    return process.argv[index + 1] ?? fallback
  }

  return fallback
}

const outputLocation = path.resolve(readOption('output', defaultOutput))
const inputProps = {
  accentColor: readOption('color', '#1247d8'),
  brandName: readOption('brand', 'SNS 카드뉴스 생성기'),
  style: readOption('style', 'informative'),
  topic: readOption('topic', 'AI 마케팅'),
}

await fs.mkdir(path.dirname(outputLocation), { recursive: true })

console.log('Bundling Remotion composition...')
const serveUrl = await bundle({
  entryPoint: path.join(repoRoot, 'src', 'remotion', 'index.ts'),
  onProgress: (progress) => {
    process.stdout.write(`\rBundle ${Math.round(progress * 100)}%`)
  },
})
process.stdout.write('\n')

console.log('Selecting composition...')
const composition = await selectComposition({
  id: 'AutoGenerationVideo',
  inputProps,
  serveUrl,
})

console.log(`Rendering ${outputLocation}...`)
await renderMedia({
  codec: 'h264',
  composition,
  inputProps,
  onProgress: ({ progress }) => {
    process.stdout.write(`\rRender ${Math.round(progress * 100)}%`)
  },
  outputLocation,
  serveUrl,
})
process.stdout.write('\n')

console.log(`Video ready: ${outputLocation}`)

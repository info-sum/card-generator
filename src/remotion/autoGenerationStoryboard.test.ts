import assert from 'node:assert/strict'
import test from 'node:test'
import { buildAutoGenerationStoryboard } from './autoGenerationStoryboard.js'

test('buildAutoGenerationStoryboard prepares an 8-slide auto generation deck with four stages', () => {
  const storyboard = buildAutoGenerationStoryboard({
    topic: '카드뉴스 자동생성',
    brandName: 'INFOSUM',
    accentColor: '#1247d8',
    slideCount: 8,
    style: 'informative',
  })

  assert.equal(storyboard.project.slides.length, 8)
  assert.deepEqual(storyboard.stages.map((stage) => stage.label), ['주제 입력', 'AI 분석', '초안 생성', '완성'])
  assert.equal(storyboard.durationInFrames, 768)
  assert.match(storyboard.stages[0]?.summary ?? '', /카드뉴스 자동생성/)
  assert.equal(storyboard.project.brandName, 'INFOSUM')
})

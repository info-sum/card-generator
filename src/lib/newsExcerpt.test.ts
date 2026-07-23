import assert from 'node:assert/strict'
import test from 'node:test'

import { toArticlePreview } from './newsExcerpt.js'

test('toArticlePreview keeps the first two complete sentences of article content', () => {
  const preview = toArticlePreview(
    '첫 번째 문장입니다. 두 번째 문장입니다. 세 번째 문장입니다.',
  )

  assert.equal(preview, '첫 번째 문장입니다. 두 번째 문장입니다.')
})

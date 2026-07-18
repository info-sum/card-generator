import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getWebImageIdentity,
  shouldUseWebImageUrl,
} from './generate-cardnews.js'

test('web image quality gate rejects Google CDN thumbnails and icon-like assets', () => {
  assert.equal(
    shouldUseWebImageUrl('https://lh3.googleusercontent.com/J6_coFbogxhRI9iM864NL_liGXvsQp2AupsKei7z0cNNfDvGUmWUy20nuUhkREQyrpY4bEeIBuc=s0-w300'),
    false,
  )
  assert.equal(shouldUseWebImageUrl('https://cdn.example.com/images/logo.png'), false)
  assert.equal(shouldUseWebImageUrl('https://cdn.example.com/news/feature-w300.webp'), false)
  assert.equal(shouldUseWebImageUrl('https://cdn.example.com/news/feature.webp?width=300'), false)
})

test('web image quality gate retains a full-size article image and dedupes URL variants', () => {
  const first = 'https://images.example.com/news/launch.webp?width=1600&utm_source=feed'
  const resizedVariant = 'https://images.example.com/news/launch.webp?width=1200'

  assert.equal(shouldUseWebImageUrl(first), true)
  assert.equal(getWebImageIdentity(first), getWebImageIdentity(resizedVariant))
})

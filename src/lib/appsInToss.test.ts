import assert from 'node:assert/strict'
import test from 'node:test'
import {
  inferImportedMediaKindFromMimeType,
  inferImportedMediaKindFromUrl,
  normalizeImportedMediaUrl,
} from './appsInToss.js'

test('inferImportedMediaKindFromMimeType classifies image and video files', () => {
  assert.equal(inferImportedMediaKindFromMimeType('image/png'), 'image')
  assert.equal(inferImportedMediaKindFromMimeType('video/mp4'), 'video')
  assert.equal(inferImportedMediaKindFromMimeType('application/pdf'), null)
})

test('inferImportedMediaKindFromUrl classifies direct image and video urls', () => {
  assert.equal(inferImportedMediaKindFromUrl('https://example.com/poster.jpg'), 'image')
  assert.equal(inferImportedMediaKindFromUrl('https://example.com/clip.webm'), 'video')
  assert.equal(inferImportedMediaKindFromUrl('https://example.com/asset'), null)
})

test('normalizeImportedMediaUrl keeps only http and https urls', () => {
  assert.equal(normalizeImportedMediaUrl(' https://example.com/clip.mp4 '), 'https://example.com/clip.mp4')
  assert.equal(normalizeImportedMediaUrl('ftp://example.com/clip.mp4'), '')
  assert.equal(normalizeImportedMediaUrl('not a url'), '')
})

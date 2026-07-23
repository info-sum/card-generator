import assert from 'node:assert/strict'
import test from 'node:test'
import imageProxyHandler from './image-proxy.js'

test('image proxy rejects private network URLs', async () => {
  let statusCode = 0
  let body: unknown

  await imageProxyHandler(
    { method: 'GET', query: { url: 'http://127.0.0.1/private-image.png' } },
    {
      status(code) {
        statusCode = code
        return this
      },
      json(value) {
        body = value
      },
      setHeader() {},
      end() {},
    },
  )

  assert.equal(statusCode, 400)
  assert.deepEqual(body, { message: '이미지 URL을 확인해 주세요.' })
})

test('image proxy rejects IPv4-mapped IPv6 loopback URLs', async () => {
  let statusCode = 0

  await imageProxyHandler(
    { method: 'GET', query: { url: 'http://[::ffff:127.0.0.1]/private-image.png' } },
    {
      status(code) {
        statusCode = code
        return this
      },
      json() {},
      setHeader() {},
      end() {},
    },
  )

  assert.equal(statusCode, 400)
})

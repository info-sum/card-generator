import assert from 'node:assert/strict'
import test from 'node:test'

import {
  AiSlideEditRequestError,
  requestAiSlideEdit,
} from './aiSlideEdit.js'

const request = {
  aiProvider: 'gpt' as const,
  brandName: '카드뉴스 제작하기',
  instruction: '제목을 더 짧고 단호하게 바꿔줘.',
  slide: {
    badge: '핵심',
    content2: '',
    description: 'AI 도구가 반복 업무를 줄여주는 흐름을 설명해요.',
    kicker: 'AI WORK',
    title: 'AI가 바꾸는 업무 방식',
  },
  topic: 'AI 업무 자동화',
}

test('requestAiSlideEdit sends one slide and returns only editable copy fields', async () => {
  let sentBody = ''

  const result = await requestAiSlideEdit(request, async (_url, init) => {
    sentBody = init.body
    return {
      json: async () => ({
        slide: {
          badge: '핵심',
          content2: '',
          description: '반복 업무는 줄이고 판단에 더 많은 시간을 쓸 수 있어요.',
          kicker: 'AI WORK',
          title: '반복 업무부터 줄어든다',
        },
      }),
      ok: true,
      status: 200,
    }
  })

  assert.equal(JSON.parse(sentBody).instruction, request.instruction)
  assert.equal(result.title, '반복 업무부터 줄어든다')
  assert.equal(result.description, '반복 업무는 줄이고 판단에 더 많은 시간을 쓸 수 있어요.')
})

test('requestAiSlideEdit rejects an empty instruction before sending a request', async () => {
  await assert.rejects(
    requestAiSlideEdit({ ...request, instruction: '   ' }),
    AiSlideEditRequestError,
  )
})

test('requestAiSlideEdit turns an invalid error response into Korean copy', async () => {
  await assert.rejects(
    requestAiSlideEdit(request, async () => ({
      json: async () => {
        throw new SyntaxError('invalid json')
      },
      ok: false,
      status: 502,
    })),
    (error: unknown) => error instanceof AiSlideEditRequestError && error.message === 'AI 편집에 실패했어요.',
  )
})

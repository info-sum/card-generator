import assert from 'node:assert/strict'
import test from 'node:test'
import {
  CARD_CLAUDE_CONTENT_GUIDANCE,
  buildCardClaudeContentPrompt,
  buildCardClaudeFallbackClosing,
  buildCardClaudeFallbackLead,
} from './cardClaudeGuidance.js'

test('buildCardClaudeContentPrompt summarizes the card-news structure rules', () => {
  const prompt = buildCardClaudeContentPrompt({
    topic: 'AI 업무 자동화',
    slideCount: 6,
    style: 'news',
  })

  assert.match(prompt, /card-claude/i)
  assert.match(prompt, /표지 1장|cover/i)
  assert.match(prompt, /본문 2~10장|body/i)
  assert.match(prompt, /마무리 1장|closing/i)
  assert.match(prompt, /짧고 강한 훅/)
  assert.match(prompt, /한 장에 하나의 핵심 메시지/)
  assert.match(prompt, /메인 문구/)
  assert.match(prompt, /2~3줄/)
  assert.match(prompt, /배경, 변화, 의미/)
  assert.match(prompt, /대상, 수치, 사례, 조건/)
  assert.match(prompt, /질문형, 단정형, 숫자형/)
})

test('card-claude guidance exposes story formulas for the AI copy writer', () => {
  assert.match(buildCardClaudeContentPrompt({
    topic: '브랜드 리뉴얼',
    slideCount: 8,
    style: 'story',
  }), /WHY → HOW → WHAT/)
  assert.match(buildCardClaudeContentPrompt({
    topic: '브랜드 리뉴얼',
    slideCount: 8,
    style: 'informative',
  }), /WHAT\(핵심\) → WHY → HOW → WHAT\(요약\)/)
})

test('fallback guidance helpers keep the offline copy concise and action-oriented', () => {
  assert.match(buildCardClaudeFallbackLead('AI 업무 자동화'), /한 장만 봐도/)
  assert.match(buildCardClaudeFallbackLead('AI 업무 자동화'), /핵심이 바로 보이게/)
  assert.match(buildCardClaudeFallbackClosing('AI 업무 자동화'), /다음 행동/)
  assert.ok(CARD_CLAUDE_CONTENT_GUIDANCE.structure.length > 0)
  assert.ok(CARD_CLAUDE_CONTENT_GUIDANCE.readabilityRules.length > 0)
})

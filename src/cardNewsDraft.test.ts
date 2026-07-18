import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createSequenceHeaderModel,
  generateCardNewsDraft,
  getManualCardNewsProjectText,
  getSequenceCardVariant,
  splitCardNewsSections,
} from './cardNewsDraft.js'

test('generateCardNewsDraft returns a 9-slide Korean cardnews sequence for a topic', () => {
  const draft = generateCardNewsDraft('AI 업무 자동화')

  assert.equal(draft.brandName, 'SNS 카드뉴스 생성기')
  assert.equal(draft.projectBadge, 'SNS 카드뉴스 생성기')
  assert.equal(draft.projectTitle, 'AI 업무 자동화 카드뉴스 초안')
  assert.equal(draft.mode, 'social')
  assert.equal(draft.presetId, 'social-portrait')
  assert.equal(draft.themeId, 'sequence-blue')
  assert.equal(draft.cardLayout, 'sequence')
  assert.equal(draft.slides.length, 9)
  assert.equal(draft.slides[0]?.kicker, 'SNS 카드뉴스 생성기')
  assert.match(draft.slides[0]?.title ?? '', /AI 업무 자동화/)
  assert.match(draft.slides[0]?.title ?? '', /지금 주목받는/)
  assert.match(draft.slides[0]?.title ?? '', /이유는\?/)
  assert.equal(draft.slides[0]?.badge, '넘겨보기 ->')
  assert.equal(draft.slides[1]?.kicker, 'AI 업무 자동화')
  assert.match(draft.slides[1]?.title ?? '', /AI 업무 자동화/)
  assert.ok(draft.slides.every((slide) => slide.content2 === ''))
  assert.match(draft.slides[1]?.description ?? '', /관심이 커지는 배경/)
})

test('generateCardNewsDraft falls back to a useful draft for blank topics', () => {
  const draft = generateCardNewsDraft('   ')

  assert.equal(draft.slides.length, 9)
  assert.equal(draft.projectTitle, '새로운 주제 카드뉴스 초안')
  assert.match(draft.slides[0]?.title ?? '', /새로운 주제/)
})

test('generateCardNewsDraft keeps generated slides compatible with export rendering', () => {
  const draft = generateCardNewsDraft('고객 온보딩 개선')

  for (const slide of draft.slides) {
    assert.match(slide.id, /^topic-draft-\d{2}$/)
    assert.match(slide.dataUrl, /^data:image\/svg\+xml;charset=UTF-8,/)
    assert.match(slide.name, /^topic-draft-\d{2}\.svg$/)
    assert.equal(slide.source, 'local')
    assert.equal(slide.focusX, 50)
    assert.equal(slide.focusY, 50)
    assert.equal(slide.zoom, 1)
    assert.ok(slide.title.length > 0)
    assert.ok(slide.description.length > 0)
  }
})

test('generateCardNewsDraft accepts a custom accent color for less rigid templates', () => {
  const draft = generateCardNewsDraft('신제품 런칭', { accentColor: '#0f8a8d' })

  assert.equal(draft.customColor, '#0f8a8d')
  assert.match(draft.slides[0]?.dataUrl ?? '', /%230f8a8d/)
})

test('generateCardNewsDraft can generate an 8-card news style wizard draft', () => {
  const draft = generateCardNewsDraft('AI 마케팅', {
    style: 'news',
    slideCount: 8,
  })

  assert.equal(draft.slides.length, 8)
  assert.equal(draft.slides[0]?.kicker, 'SNS 카드뉴스 생성기')
  assert.match(draft.slides[0]?.title ?? '', /AI 마케팅/)
  assert.match(draft.slides[1]?.badge ?? '', /News/)
})

test('generateCardNewsDraft keeps a natural closing card at every requested slide count', () => {
  const draft = generateCardNewsDraft('AI 업무 자동화', {
    slideCount: 6,
    style: 'news',
  })
  const closing = draft.slides.at(-1)

  assert.equal(closing?.kicker, 'Summary')
  assert.match(closing?.description ?? '', /핵심 변화와 적용 조건/)
  assert.doesNotMatch(closing?.description ?? '', /다음 행동|다음 이슈|시작해보세요/)
})

test('generateCardNewsDraft uses the provided brand name in generated templates', () => {
  const draft = generateCardNewsDraft('창업 이야기', {
    brandName: '내 브랜드',
    slideCount: 8,
  })

  assert.equal(draft.brandName, '내 브랜드')
  assert.equal(draft.slides[0]?.kicker, '내 브랜드')
})

test('generateCardNewsDraft writes topic analysis instead of automation-log filler', () => {
  const draft = generateCardNewsDraft('부동산 투자', {
    slideCount: 6,
    style: 'informative',
  })
  const renderedCopy = draft.slides.map((slide) => `${slide.title}\n${slide.description}`).join('\n')

  assert.match(draft.slides[1]?.title ?? '', /주목|변화|이유/)
  assert.match(renderedCopy, /부동산 투자/)
  assert.doesNotMatch(renderedCopy, /자동화했어요|작업 환경|반복 구간|알림이 중복/)
})

test('generateCardNewsDraft resolves Korean particles in analyzed fallback copy', () => {
  const draft = generateCardNewsDraft('부동산 투자', {
    slideCount: 6,
    style: 'informative',
  })
  const renderedCopy = draft.slides.map((slide) => `${slide.title}\n${slide.description}`).join('\n')

  assert.match(renderedCopy, /부동산 투자가\n지금 주목받는\n이유는\?/)
  assert.match(renderedCopy, /지금 확인할 변화와 판단 기준/)
  assert.match(renderedCopy, /부동산 투자는 단순한 유행보다/)
  assert.doesNotMatch(renderedCopy, /을\(를\)|은\(는\)|이\(가\)|부동산 투자이/)
})

test('generateCardNewsDraft uses card-claude guidance on the cover and closing cards', () => {
  const draft = generateCardNewsDraft('AI 업무 자동화', {
    style: 'news',
  })

  assert.match(draft.slides[0]?.title ?? '', /AI 업무 자동화/)
  assert.match(draft.slides[0]?.title ?? '', /지금 주목받는/)
  assert.match(draft.slides[0]?.description ?? '', /지금 확인할 변화와 판단 기준/)
  assert.match(draft.slides.at(-1)?.description ?? '', /핵심 변화와 적용 조건/)
})

test('splitCardNewsSections separates content1 and content2 for sequence cards', () => {
  const sections = splitCardNewsSections({
    description: '예전엔 만들어도 나만 볼 수 있었어요.',
    content2: '이젠 만들기부터 배포까지 한 번에 끝나요.',
  })

  assert.equal(sections.content1, '예전엔 만들어도 나만 볼 수 있었어요.')
  assert.equal(sections.content2, '이젠 만들기부터 배포까지 한 번에 끝나요.')
})

test('getManualCardNewsProjectText removes generated manual filler labels', () => {
  const projectText = getManualCardNewsProjectText()

  assert.equal(projectText.projectBadge, '')
  assert.equal(projectText.projectTitle, '')
})

test('createSequenceHeaderModel exposes uploaded logo only when registered', () => {
  const withLogo = createSequenceHeaderModel({
    brandName: '내 브랜드',
    appIcon: 'data:image/png;base64,logo',
  })
  const withoutLogo = createSequenceHeaderModel({
    brandName: '내 브랜드',
    appIcon: null,
  })

  assert.deepEqual(withLogo, {
    brandName: '내 브랜드',
    logoSrc: 'data:image/png;base64,logo',
  })
  assert.deepEqual(withoutLogo, {
    brandName: '내 브랜드',
    logoSrc: null,
  })
})

test('getSequenceCardVariant keeps only the first card as the original cover', () => {
  assert.equal(getSequenceCardVariant(0), 'cover')
  assert.equal(getSequenceCardVariant(1), 'detail')
  assert.equal(getSequenceCardVariant(7), 'detail')
})

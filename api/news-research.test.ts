import assert from 'node:assert/strict'
import test from 'node:test'

import { resolvePublisherArticleUrl } from './news-research.js'

test('resolvePublisherArticleUrl decodes Google News RSS links before fetching article content', async () => {
  const calls: string[] = []
  const resolvedUrl = await resolvePublisherArticleUrl(
    'https://news.google.com/rss/articles/example-id?oc=5',
    async (url: string) => {
      calls.push(url)
      return url.includes('/articles/')
        ? { ok: true, text: async () => '<div data-n-a-sg="signature" data-n-a-ts="123"></div>' }
        : { ok: true, text: async () => `)]}'\n\n[["wrb.fr","Fbv4je","[\\"garturlres\\",\\"https://publisher.example/article?idxno\\u003d1\\",1]"]]` }
    },
  )

  assert.equal(resolvedUrl, 'https://publisher.example/article?idxno=1')
  assert.deepEqual(calls, [
    'https://news.google.com/articles/example-id',
    'https://news.google.com/_/DotsSplashUi/data/batchexecute',
  ])
})

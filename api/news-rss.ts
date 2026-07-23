export type RssFeedItem = {
  readonly title: string
  readonly summary: string
  readonly publisher: string
  readonly sourcePlatform: '뉴스'
  readonly url: string
  readonly publishedAt: string
}

export function parseRssItems(xml: string): readonly RssFeedItem[] {
  return matchAll(xml, /<item>([\s\S]*?)<\/item>/gi).flatMap((itemXml) => {
    const title = cleanFeedText(readTag(itemXml, 'title'))
    const url = cleanFeedText(readTag(itemXml, 'link'))
    if (title.length === 0 || normalizeHttpUrl(url).length === 0) return []

    const source = cleanFeedText(readTag(itemXml, 'source'))
    const [, titlePublisher = ''] = title.match(/\s+-\s+([^-]+)$/) ?? []
    return [{
      title: title.replace(/\s+-\s+[^-]+$/, '').trim(),
      summary: toNewsSummary(readTag(itemXml, 'description')),
      publisher: source || titlePublisher.trim(),
      sourcePlatform: '뉴스',
      url: normalizeHttpUrl(url),
      publishedAt: cleanFeedText(readTag(itemXml, 'pubDate')),
    }]
  })
}

export function toNewsSummary(value: string): string {
  const withoutCodeBlocks = decodeHtml(value).replace(/<(?:code|pre|script|style)(?:\s[^>]*)?>[\s\S]*?<\/(?:code|pre|script|style)>/gi, ' ')
  return toPlainText(withoutCodeBlocks)
    .split(/(?<=[.!?。])\s+/u)
    .filter((sentence) => sentence.length > 0 && !isCodeLike(sentence))
    .join(' ')
}

function readTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i'))
  return match?.[1] ?? ''
}

function matchAll(text: string, pattern: RegExp): readonly string[] {
  return Array.from(text.matchAll(pattern), (match) => match[1] ?? '')
}

function cleanFeedText(value: string): string {
  return decodeHtml(value).replace(/\s+/g, ' ').trim()
}

function toPlainText(value: string): string {
  return cleanFeedText(value.replace(/<[^>]*>/g, ' '))
}

function decodeHtml(value: string): string {
  return value
    .replace(/^\s*<!\[CDATA\[/i, '')
    .replace(/\]\]>\s*$/, '')
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
}

function isCodeLike(value: string): boolean {
  return /(?:\b(?:const|let|var)\s+\w+\s*=|\bfunction\s+\w+\s*\(|\bimport\s+.+\s+from\b|\bclass\s+\w+\s*\{|=>|[{};])/iu.test(value)
}

function normalizeHttpUrl(value: string): string {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : ''
  } catch {
    return ''
  }
}

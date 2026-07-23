const MAX_PREVIEW_SENTENCES = 2

export function toArticlePreview(value: string): string {
  const compact = value.replace(/\s+/g, ' ').trim()
  if (compact.length === 0) return ''

  const sentences = compact.split(/(?<=[.!?。])\s+/u)
  const preview = sentences.slice(0, MAX_PREVIEW_SENTENCES).join(' ')
  return preview.length > 0 ? preview : compact
}

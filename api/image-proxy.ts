import { lookup } from 'node:dns/promises'
import type { IncomingHttpHeaders } from 'node:http'
import { request as httpRequest } from 'node:http'
import { request as httpsRequest } from 'node:https'
import { isIP } from 'node:net'

type ApiRequest = { readonly method?: string; readonly query?: { readonly url?: unknown } }
type ApiResponse = {
  status(code: number): ApiResponse
  json(body: unknown): void
  setHeader(name: string, value: string): void
  end(body: Uint8Array): void
}
type ResolvedImageUrl = {
  readonly url: URL
  readonly address: string
  readonly family: 4 | 6
}
type ImageResponse = {
  readonly status: number
  readonly headers: IncomingHttpHeaders
  readonly data: Uint8Array
}

const MAX_IMAGE_BYTES = 4_000_000
const MAX_REDIRECTS = 3
const IMAGE_ACCEPT_HEADER = 'image/avif,image/webp,image/png,image/jpeg,image/gif,image/*;q=0.8'

export default async function handler(request: ApiRequest, response: ApiResponse) {
  if (request.method !== 'GET') {
    response.status(405).json({ message: 'GET 요청만 지원합니다.' })
    return
  }

  const imageUrl = await readImageUrl(request.query?.url)
  if (imageUrl == null) {
    response.status(400).json({ message: '이미지 URL을 확인해 주세요.' })
    return
  }

  try {
    const imageResponse = await fetchImage(imageUrl)
    const contentType = readContentType(imageResponse.headers['content-type'])
    if (imageResponse.status < 200 || imageResponse.status > 299 || contentType == null) {
      response.status(422).json({ message: '이미지를 불러오지 못했습니다.' })
      return
    }

    response.setHeader('cache-control', 'public, max-age=3600, s-maxage=86400')
    response.setHeader('content-type', contentType)
    response.end(imageResponse.data)
  } catch {
    response.status(422).json({ message: '이미지를 불러오지 못했습니다.' })
  }
}

async function fetchImage(initialUrl: ResolvedImageUrl): Promise<ImageResponse> {
  let nextUrl = initialUrl

  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
    const imageResponse = await requestImage(nextUrl)
    if (imageResponse.status < 300 || imageResponse.status > 399) {
      return imageResponse
    }

    const location = readHeader(imageResponse.headers.location)
    const redirectedUrl = location == null ? null : await readImageUrl(new URL(location, nextUrl.url).toString())
    if (redirectedUrl == null) {
      throw new Error('Invalid image redirect')
    }
    nextUrl = redirectedUrl
  }

  throw new Error('Too many image redirects')
}

function requestImage(target: ResolvedImageUrl): Promise<ImageResponse> {
  return new Promise((resolve, reject) => {
    const request = (target.url.protocol === 'https:' ? httpsRequest : httpRequest)(
      {
        hostname: target.url.hostname,
        port: target.url.port || undefined,
        path: `${target.url.pathname}${target.url.search}`,
        method: 'GET',
        headers: { accept: IMAGE_ACCEPT_HEADER, host: target.url.host },
        lookup: (_hostname, options, callback) => {
          if (options.all) {
            callback(null, [{ address: target.address, family: target.family }])
            return
          }

          callback(null, target.address, target.family)
        },
      },
      (response) => {
        if (response.statusCode != null && response.statusCode >= 300 && response.statusCode <= 399) {
          response.resume()
          resolve({ status: response.statusCode, headers: response.headers, data: new Uint8Array() })
          return
        }

        const chunks: Buffer[] = []
        let size = 0
        response.on('data', (chunk: Buffer) => {
          size += chunk.length
          if (size > MAX_IMAGE_BYTES) {
            response.destroy()
            reject(new Error('Image too large'))
            return
          }
          chunks.push(chunk)
        })
        response.on('end', () => {
          resolve({
            status: response.statusCode ?? 500,
            headers: response.headers,
            data: new Uint8Array(Buffer.concat(chunks)),
          })
        })
        response.on('error', reject)
      },
    )
    request.setTimeout(8_000, () => request.destroy(new Error('Image request timed out')))
    request.on('error', reject)
    request.end()
  })
}

async function readImageUrl(value: unknown): Promise<ResolvedImageUrl | null> {
  if (typeof value !== 'string' || value.length === 0 || value.length > 2_000) {
    return null
  }

  try {
    const url = new URL(value)
    if ((url.protocol !== 'https:' && url.protocol !== 'http:') || isPrivateHost(url.hostname)) {
      return null
    }

    const addresses = await lookup(url.hostname, { all: true })
    const [address] = addresses
    if (
      address == null ||
      (address.family !== 4 && address.family !== 6) ||
      addresses.some((candidate) => isPrivateAddress(candidate.address))
    ) {
      return null
    }

    return { url, address: address.address, family: address.family }
  } catch {
    return null
  }
}

function readContentType(value: string | readonly string[] | undefined): string | null {
  const contentType = readHeader(value)?.split(';')[0]?.trim()
  return contentType != null && contentType.startsWith('image/') ? contentType : null
}

function readHeader(value: string | readonly string[] | undefined): string | null {
  return typeof value === 'string' ? value : value?.[0] ?? null
}

function isPrivateHost(hostname: string): boolean {
  const host = hostname.toLowerCase()
  return host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')
}

function isPrivateAddress(address: string): boolean {
  if (isIP(address) === 4) {
    const [first = 0, second = 0] = address.split('.').map(Number)
    return (
      first === 0 ||
      first === 10 ||
      first === 127 ||
      (first === 100 && second >= 64 && second <= 127) ||
      (first === 169 && second === 254) ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && (second === 0 || second === 168)) ||
      (first === 198 && (second === 18 || second === 19)) ||
      first >= 224
    )
  }

  const normalized = address.toLowerCase()
  return (
    normalized === '::' ||
    normalized === '::1' ||
    normalized.startsWith('::ffff:') ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    /^fe[89abc][0-9a-f]:/.test(normalized) ||
    normalized.startsWith('ff')
  )
}

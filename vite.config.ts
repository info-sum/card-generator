/**
 * vite.config.ts
 * Vite 빌드 및 개발 서버 설정
 * - SPA 라우팅은 Vercel 배포 시 vercel.json의 rewrites로 처리
 * - 로컬 개발 시 /intro, /terms 경로는 브라우저 URL을 직접 변경하여 처리
 */

import type { IncomingMessage, ServerResponse } from 'node:http'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import generateCardNewsHandler from './api/generate-cardnews.js'
import googleImageSearchHandler from './api/google-image-search.js'
import todayNewsHandler from './api/today-news.js'
import newsResearchHandler from './api/news-research.js'

type DevApiResponse = {
  status(code: number): DevApiResponse
  json(body: unknown): void
  setHeader(name: string, value: string): void
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'local-ai-cardnews-api',
      configureServer(server) {
        server.middlewares.use('/api/generate-cardnews', async (request, response) => {
          try {
            const body = await readDevRequestBody(request)
            await generateCardNewsHandler(
              {
                method: request.method,
                body,
              },
              createDevApiResponse(response),
            )
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Local AI API failed'
            response.statusCode = 500
            response.setHeader('content-type', 'application/json; charset=utf-8')
            response.end(JSON.stringify({ message }))
          }
        })
        server.middlewares.use('/api/google-image-search', async (request, response) => {
          try {
            const body = await readDevRequestBody(request)
            await googleImageSearchHandler(
              {
                method: request.method,
                body,
              },
              createDevApiResponse(response),
            )
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Local Google image API failed'
            response.statusCode = 500
            response.setHeader('content-type', 'application/json; charset=utf-8')
            response.end(JSON.stringify({ message }))
          }
        })
        server.middlewares.use('/api/today-news', async (request, response) => {
          try {
            await todayNewsHandler({ method: request.method }, createDevApiResponse(response))
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Local today news API failed'
            response.statusCode = 500
            response.setHeader('content-type', 'application/json; charset=utf-8')
            response.end(JSON.stringify({ message }))
          }
        })
        server.middlewares.use('/api/news-research', async (request, response) => {
          try {
            const body = await readDevRequestBody(request)
            await newsResearchHandler(
              {
                method: request.method,
                body,
              },
              createDevApiResponse(response),
            )
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Local news research API failed'
            response.statusCode = 500
            response.setHeader('content-type', 'application/json; charset=utf-8')
            response.end(JSON.stringify({ message }))
          }
        })
      },
    },
  ],
})

function createDevApiResponse(response: ServerResponse): DevApiResponse {
  const apiResponse: DevApiResponse = {
    status(code) {
      response.statusCode = code
      return apiResponse
    },
    json(body) {
      if (!response.headersSent) {
        response.setHeader('content-type', 'application/json; charset=utf-8')
      }

      response.end(JSON.stringify(body))
    },
    setHeader(name, value) {
      response.setHeader(name, value)
    },
  }

  return apiResponse
}

async function readDevRequestBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []

  for await (const chunk of request) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }

  const text = Buffer.concat(chunks).toString('utf8').trim()
  if (text.length === 0) {
    return undefined
  }

  try {
    return JSON.parse(text) as unknown
  } catch (error) {
    if (error instanceof SyntaxError) {
      return text
    }

    throw error
  }
}

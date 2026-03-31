/**
 * vite.config.ts
 * Vite 빌드 및 개발 서버 설정
 * - SPA 라우팅은 Vercel 배포 시 vercel.json의 rewrites로 처리
 * - 로컬 개발 시 /intro, /terms 경로는 브라우저 URL을 직접 변경하여 처리
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})


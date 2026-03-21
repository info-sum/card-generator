import { defineConfig } from '@apps-in-toss/web-framework/config'

export default defineConfig({
  appName: 'cardstudio',
  brand: {
    displayName: 'SNS 카드 뉴스 생성기',
    primaryColor: '#dd5e31',
    icon: '/logo.svg',
  },
  navigationBar: {
    withBackButton: true,
  },
  permissions: [
    {
      name: 'photos',
      access: 'read',
    },
  ],
  web: {
    host: 'localhost',
    port: 5173,
    commands: {
      dev: 'npm run dev:web',
      build: 'npm run build:web',
    },
  },
  webViewProps: {
    type: 'partner',
    allowsInlineMediaPlayback: false,
  },
})

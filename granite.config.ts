import { defineConfig } from '@apps-in-toss/web-framework/config'

export default defineConfig({
  appName: 'card-generator',
  brand: {
    displayName: '카드 제너레이터',
    primaryColor: '#dd5e31',
    icon: '',
  },
  permissions: [
    {
      name: 'photos',
      access: 'read',
    },
    {
      name: 'camera',
      access: 'access',
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

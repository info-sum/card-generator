import { defineConfig } from '@apps-in-toss/web-framework/config'

export default defineConfig({
  appName: 'cardstudio',
  brand: {
    displayName: '카드스튜디오',
    primaryColor: '#dd5e31',
    icon: 'https://aeo-ten.vercel.app/images/snslogo.png',
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

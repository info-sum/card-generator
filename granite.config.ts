import { defineConfig } from '@apps-in-toss/web-framework/config'

export default defineConfig({
  appName: 'cardstudio',
  brand: {
    displayName: 'cardstudio',
    primaryColor: '#dd5e31',
    icon: 'https://github.com/user-attachments/assets/40bb02ba-d890-4621-9bed-54d8b091ab2f',
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

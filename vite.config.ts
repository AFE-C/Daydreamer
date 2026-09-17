import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/Daydreamer/' : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Daydreamer · 记录当下的微光',
        short_name: 'Daydreamer',
        description: '记录灵感、日记和那些还没想明白的事。',
        lang: 'zh-CN',
        theme_color: '#f7fbff',
        background_color: '#f7fbff',
        display: 'standalone',
        start_url: '/Daydreamer/',
        scope: '/Daydreamer/',
        categories: ['productivity', 'lifestyle'],
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        navigateFallback: '/Daydreamer/index.html',
        globPatterns: ['**/*.{js,css,html,svg,ico,png,webmanifest}'],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
}))

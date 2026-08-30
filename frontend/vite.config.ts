import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  // Suppress web vitals errors in development
  define: {
    __VITE_WEB_VITALS__: false,
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        // Only precache app shell files — NOT large poster images
        globPatterns: ['**/*.{html,css,js,ico,svg,json}'],
        // Raise limit to 10 MB in case other assets are large
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
      },
      manifest: {
        name: 'KrishiMitra',
        short_name: 'KrishiMitra',
        description: 'AI-powered agricultural advisory for Indian farmers',
        theme_color: '#0b5e2c',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  // @ts-ignore - test config is added by vitest
  test: {
    globals: true,
    environment: 'jsdom',
  },
})

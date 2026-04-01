import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    typecheck: {
      tsconfig: './tsconfig.test.json',
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'GFE Chord',
        short_name: 'GFE Chord',
        description: 'Cancionero digital de la iglesia GFE',
        theme_color: '#754456',
        background_color: '#1F211F',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        lang: 'es',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            // GET de canciones y setlists: NetworkFirst para que ediciones se reflejen de inmediato.
            // Fallback a cache solo cuando no hay red (modo offline real).
            urlPattern: /\/api\/(songs|setlists)/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache-v2',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
        ],
      },
      devOptions: {
        enabled: false, // deshabilitar SW en desarrollo — evita caching de respuestas de API
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'SARAS ERP v3',
        short_name: 'SARAS v3',
        description: 'RPK Industries — manufacturing ERP',
        theme_color: '#4f46e5',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /\/rest\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'supabase-rest', networkTimeoutSeconds: 5 },
          },
          {
            urlPattern: /\/auth\/v1\/.*/i,
            handler: 'NetworkOnly', // never cache auth
          },
          {
            urlPattern: /\/storage\/v1\/object\/public\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-storage',
              expiration: { maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    chunkSizeWarningLimit: 350,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (/react|react-dom|react-router/.test(id)) return 'vendor-react'
            if (id.includes('@supabase')) return 'vendor-supabase'
            if (id.includes('lucide-react')) return 'vendor-icons'
          }
          return undefined
        },
      },
    },
  },
  server: {
    port: 5174,
    strictPort: false,
  },
})

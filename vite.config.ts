/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'どれみ',
        short_name: 'どれみ',
        description: '耳で覚えたドレミを五線譜に置いて学ぶ幼児向けアプリ',
        lang: 'ja',
        orientation: 'landscape',
        display: 'fullscreen',
        background_color: '#fdf6e3',
        theme_color: '#fdf6e3',
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})

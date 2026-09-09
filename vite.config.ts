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
    coverage: {
      provider: 'v8',
      // UI層（src/components・src/App.tsx）と src/audio は別issueで段階導入する。
      // いまは純ロジックだけ回帰を数値で止める。
      include: ['src/lib/**'],
      thresholds: {
        statements: 90,
        branches: 85,
        functions: 90,
        lines: 90,
      },
    },
  },
})

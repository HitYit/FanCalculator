import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [react(), VitePWA({
    registerType: 'prompt',
    includeAssets: ['icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png'],
    manifest: {
      name: '牌间 · 麻将算番', short_name: '牌间', description: '随手选牌，轻松算番',
      lang: 'zh-CN', theme_color: '#f2f2f7', background_color: '#f2f2f7',
      display: 'standalone', start_url: './', scope: './',
      icons: [
        { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
      ]
    },
    workbox: { globPatterns: ['**/*.{js,css,html,png,jpg,svg,woff2}'], navigateFallback: 'index.html' }
  })]
});

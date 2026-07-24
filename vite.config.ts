import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/AvalonAnimeManager/' : '/',
  plugins: [react(), tailwindcss(), VitePWA({
    registerType: 'autoUpdate',
    injectRegister: 'auto',
    base: process.env.GITHUB_ACTIONS ? '/AvalonAnimeManager/' : '/',
    scope: process.env.GITHUB_ACTIONS ? '/AvalonAnimeManager/' : '/',
    manifest: {
      name: 'Avalon',
      short_name: 'Avalon',
      description: 'Onde as Lendas Ganham Vida',
      theme_color: '#000000',
      start_url: '/AvalonAnimeManager/',
      icons: [
        {
          src: 'https://cdn-icons-png.flaticon.com/512/3069/3069171.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: 'https://cdn-icons-png.flaticon.com/512/3069/3069171.png',
          sizes: '512x512',
          type: 'image/png',
        }
      ]
    }
  })],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
});
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5178,
    // 本機開發：前端打 /api/... 由 vite 代理去後端。
    // 咁前端同 API 就係「同源」，唔會有 CORS / localhost-IPv6 嗰類 "Failed to fetch"。
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})

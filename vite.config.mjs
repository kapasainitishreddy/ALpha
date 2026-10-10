import { fileURLToPath, URL } from 'node:url'
import { marketMiddleware } from './server/market-api.mjs'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [{ name: 'paper-market-api', configureServer(server) { server.middlewares.use(marketMiddleware) }, configurePreviewServer(server) { server.middlewares.use(marketMiddleware) } }],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})

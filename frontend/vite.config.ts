import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/rest': {
        target: 'http://localhost:4533',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:4533',
        changeOrigin: true,
      },
      '/app': {
        target: 'http://localhost:4533',
        changeOrigin: true,
      },
      '/share': {
        target: 'http://localhost:4533',
        changeOrigin: true,
      }
    }
  }
})

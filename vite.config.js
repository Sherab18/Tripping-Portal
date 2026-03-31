import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // This redirects all frontend '/api' calls to your Node server
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  }
})
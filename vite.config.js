import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    // Required by vue3-persian-datetime-picker / moment-jalaali under Vite.
    mainFields: ['browser', 'module', 'main', 'jsnext:main', 'jsnext'],
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
})

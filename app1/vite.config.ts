import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'transformers': ['@xenova/transformers'],
          'vendor': ['react', 'react-dom'],
          'mistral': ['@mistralai/mistralai']
        }
      }
    }
  },
  optimizeDeps: {
    exclude: ['@xenova/transformers']
  }
})
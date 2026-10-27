import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      buffer: 'buffer/',
      process: 'process/browser',
    },
  },
  define: {
    'global': 'globalThis',
  },
})

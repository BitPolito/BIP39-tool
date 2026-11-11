import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  plugins: [
    react(),
    viteSingleFile(),
	tailwindcss()
  ],
  build: {
    sourcemap: false,
    cssCodeSplit: false,
    assetsInlineLimit: 100000000,
  }
})
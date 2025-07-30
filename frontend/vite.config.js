import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../backend/public',  // build frontend directly into backend/public
    emptyOutDir: true
  }
})

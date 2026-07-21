import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Static SPA — relative base so the built `dist/` can be opened directly or hosted anywhere.
export default defineConfig({
  base: './',
  plugins: [react()],
})

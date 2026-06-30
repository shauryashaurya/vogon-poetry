import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/vogon-poetry/vogon-poetry-concept-viewer/',
  plugins: [react()]
})
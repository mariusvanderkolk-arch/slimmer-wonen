import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages serveert de app onder /slimmer-wonen/. Lokaal kan VITE_BASE=/ worden gezet.
const base = process.env.VITE_BASE ?? '/slimmer-wonen/'

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  test: { environment: 'node' },
} as never)

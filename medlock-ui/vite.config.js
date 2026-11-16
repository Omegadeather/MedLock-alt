import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `--mode station` talks to the live station (python -m station).
// In dev, /api is proxied to it so the browser stays same-origin.
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  define: mode === 'station' ? { 'import.meta.env.VITE_STATION': JSON.stringify('true') } : {},
  server: {
    host: true,
    port: 5173,
    proxy: { '/api': 'http://127.0.0.1:8770' },
  },
}))

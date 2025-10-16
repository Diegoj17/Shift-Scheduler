import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',   // o 'localhost'
    port: 4000,          // fija siempre 4000
    strictPort: false,    // si 4000 está ocupado, falla (no cambia a 5173)
  },
  resolve: {
    alias: {
      '@': '/src',
      '@services': '/src/services',
      '@contexts': '/src/contexts'
    }
  }
})

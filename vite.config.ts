import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// The frontend never talks to the Python API directly by absolute URL.
// All calls go to a relative `/api/*` path which the dev server proxies to
// the Flask adapter (api/server.py). In production the adapter serves dist/.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Only the real app entry — ignore the archived Bolt export in /bolt
  optimizeDeps: {
    entries: ['index.html'],
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    watch: { ignored: ['**/bolt/**', '**/quiz.app/**'] },
    proxy: {
      '/api': {
        target: process.env.API_URL || 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: process.env.API_URL || 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three', '@react-three/fiber', '@react-three/drei'],
          motion: ['framer-motion'],
        },
      },
    },
  },
})

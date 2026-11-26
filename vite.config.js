import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    dedupe: ['react', 'react-dom'],
  },
  build: {
    // three.js (~555 KB) es el único chunk grande y se carga solo en Lab/Materia.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Librerías pesadas y estables en su propio archivo: se cachean entre deploys
        // y no inflan el bundle inicial.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (/node_modules\/(three)\//.test(id)) return 'vendor-three'
          if (/node_modules\/(katex)\//.test(id)) return 'vendor-katex'
          if (/node_modules\/(recharts|d3-[a-z-]+|victory-vendor)\//.test(id)) return 'vendor-charts'
          if (/node_modules\/(react-quill-new|quill|parchment)\//.test(id)) return 'vendor-editor'
          if (/node_modules\/(react-leaflet|leaflet|@react-leaflet)\//.test(id)) return 'vendor-maps'
          if (/node_modules\/(framer-motion|motion-dom|motion-utils)\//.test(id)) return 'vendor-motion'
          if (/node_modules\/(@radix-ui)\//.test(id)) return 'vendor-radix'
          return undefined
        },
      },
    },
  },
})

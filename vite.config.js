import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' lets the built site work from any sub-path (GitHub Pages, Netlify, Vercel)
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      input: { main: 'index.html', storm: 'storm.html' },
      output: {
        manualChunks: {
          three: ['three'],
          r3f: ['@react-three/fiber', '@react-three/drei'],
        },
      },
    },
  },
})

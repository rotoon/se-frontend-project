import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  // Root directory
  root: '.',
  
  // Public directory
  publicDir: false,
  
  // Build configuration
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        places: resolve(__dirname, 'places.html'),
        'travel-style': resolve(__dirname, 'travel-style.html'),
        'place-detail': resolve(__dirname, 'place-detail.html'),
      },
    },
  },

  // Development server
  server: {
    port: 3001,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  // Preview server (for production builds)
  preview: {
    port: 3001,
  },

  // CSS configuration
  css: {
    devSourcemap: true,
  },

  // Assets handling
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg', '**/*.webp'],
})
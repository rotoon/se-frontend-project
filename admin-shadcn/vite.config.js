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
        dashboard: resolve(__dirname, 'dashboard.html'),
        categories: resolve(__dirname, 'categories.html'),
        places: resolve(__dirname, 'places.html'),
      },
    },
  },

  // Development server
  server: {
    port: 3002,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/auth': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/admin': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  // Preview server (for production builds)
  preview: {
    port: 3002,
  },

  // CSS configuration
  css: {
    devSourcemap: true,
  },

  // Resolve configuration
  resolve: {
    alias: {
      '@': resolve(__dirname, 'assets'),
      '@css': resolve(__dirname, 'assets/css'),
      '@js': resolve(__dirname, 'assets/js'),
      '@components': resolve(__dirname, 'assets/components'),
      '@utils': resolve(__dirname, 'assets/utils'),
    },
    extensions: ['.js', '.css', '.html'],
  },

  // Assets handling
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg', '**/*.ico', '**/*.woff', '**/*.woff2', '**/*.ttf', '**/*.eot'],
})
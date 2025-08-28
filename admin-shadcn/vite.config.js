import { defineConfig, loadEnv } from 'vite'
import { resolve } from 'path'

export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  // Determine API target based on environment
  const getAPITarget = () => {
    if (mode === 'production') {
      // In production, use same origin (no proxy needed)
      return null
    }
    // In development, use local backend or override with env var
    return env.VITE_API_BASE_URL || 'http://localhost:3000'
  }
  
  const apiTarget = getAPITarget()
  
  return {
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
    port: parseInt(env.VITE_DEV_SERVER_PORT) || 3002,
    open: true,
    proxy: apiTarget ? {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
        secure: apiTarget.startsWith('https'),
        rewrite: (path) => path
      },
      '/auth': {
        target: apiTarget,
        changeOrigin: true,
        secure: apiTarget.startsWith('https'),
        rewrite: (path) => path
      },
      '/admin': {
        target: apiTarget,
        changeOrigin: true,
        secure: apiTarget.startsWith('https'),
        rewrite: (path) => path
      },
      '/uploads': {
        target: apiTarget,
        changeOrigin: true,
        secure: apiTarget.startsWith('https'),
        rewrite: (path) => path
      }
    } : undefined,
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
  
  // Define global constants
  define: {
    __API_BASE_URL__: JSON.stringify(env.VITE_API_BASE_URL || ''),
  },
}})
}
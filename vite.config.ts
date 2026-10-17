import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  server: {
    proxy: {
      '/api/github': {
        target: 'https://github.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/github/, '/users') + '/contributions'
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            if (id.includes('framer-motion')) {
              return 'vendor-framer';
            }
            if (id.includes('firebase')) {
              if (id.includes('firestore')) {
                return 'vendor-firestore';
              }
              if (id.includes('auth')) {
                return 'vendor-firebase-auth';
              }
              return 'vendor-firebase-core';
            }
            if (id.includes('pdf-lib')) {
              return 'vendor-pdflib';
            }
            if (id.includes('jszip')) {
              return 'vendor-jszip';
            }
            if (id.includes('exifr')) {
              return 'vendor-exifr';
            }
          }
        }
      }
    }
  }
})

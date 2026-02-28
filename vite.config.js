import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Split heavy pages into their own chunks so the initial bundle stays small.
        // Each page component becomes an async chunk loaded on first navigation.
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Keep all vendor code in a single vendor chunk
            return 'vendor';
          }
          // Split admin + intel pages (largest) into their own async chunks
          if (id.includes('AdminDashboard')) return 'page-admin';
          if (id.includes('IntelPage'))      return 'page-intel';
          if (id.includes('MessagesPage'))   return 'page-messages';
        },
      },
    },
  },
})

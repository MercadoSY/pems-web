import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Check if the module is from node_modules
          if (id.includes('node_modules')) {
            // Group all firebase-related modules
            if (id.includes('firebase')) {
              return 'firebase';
            }
            // Group charting libraries
            if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
              return 'charting';
            }
            // Group PDF generation libraries
            if (id.includes('jspdf') || id.includes('jspdf-autotable')) {
              return 'pdf-utils';
            }
            // Group all core React dependencies, including react-bootstrap, together
            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('react-router-dom') ||
              id.includes('react-bootstrap')
            ) {
              return 'react-vendor';
            }
          }
        }
      }
    }
  }
})
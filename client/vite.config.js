import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev, /api/* is proxied to the Express backend so the browser never has
// to know the API's real origin (also avoids CORS issues entirely).
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY || 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});

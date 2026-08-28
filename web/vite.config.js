import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // The Express API is the only backend the browser ever talks to.
    // MongoDB, the Python ML service and any future LLM sit behind it.
    proxy: {
      '/api': {
        target: process.env.VITE_DEV_API_PROXY || 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});

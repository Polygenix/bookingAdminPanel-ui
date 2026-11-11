import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev mein CORS se bachne ke liye /api ko proxy kar rahe hain.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://api.devankit.co.in',
        changeOrigin: true,
        secure: true,
      },
    },
  },
});

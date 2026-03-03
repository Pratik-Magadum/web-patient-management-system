import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  publicDir: 'public',
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    allowedHosts: [
      'localhost',
      'apollo-eye-localhost',
      'eye-hospital-localhost',
      'city-hospital-localhost',
      'general-hospital-localhost',
      'community-hospital-localhost',
      '*.localhost'
    ],
    hmr: {
      host: 'localhost',
      port: 5173,
    },
  },
  test: {
    environment: 'jsdom',
  },
});
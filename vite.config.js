import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  publicDir: 'public',
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    allowedHosts: [
      'localhost',
      'eye-hospital-localhost',
      'city-hospital-localhost',
      'general-hospital-localhost',
      'community-hospital-localhost',
      '*.localhost'
    ],
  },
  test: {
    environment: 'jsdom',
  },
});
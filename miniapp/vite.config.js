import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const backend = 'http://localhost:3000';

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    port: 5173,
    proxy: { '/api': backend, '/static': backend, '/uploads': backend },
  },
});

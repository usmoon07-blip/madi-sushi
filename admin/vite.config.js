import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const backend = 'http://localhost:3000';

export default defineConfig({
  plugins: [react()],
  base: '/admin/',
  server: {
    port: 5174,
    proxy: { '/api': backend, '/static': backend, '/uploads': backend },
  },
});

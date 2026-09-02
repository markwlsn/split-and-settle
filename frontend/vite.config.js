import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth': 'http://localhost:5000',
      '/groups': 'http://localhost:5000',
      '/receipts': 'http://localhost:5000',
      '/health': 'http://localhost:5000',
    },
  },
});

import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'login.html'),
        studio: resolve(__dirname, 'studio.html'),
        billing: resolve(__dirname, 'billing.html'),
        admin: resolve(__dirname, 'admin.html'),
        akun: resolve(__dirname, 'akun.html'),
      },
    },
  },
});

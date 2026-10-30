import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// Meta Pixel dipasang di landing, studio, dan billing (bukan login, admin, akun).
const metaPixel = () => ({
  name: 'meta-pixel',
  transformIndexHtml: {
    order: 'post',
    handler(html, ctx) {
      const p = (ctx && (ctx.path || ctx.filename)) || '';
      if (!/(^|[\\/])(index|studio|billing)\.html$/.test(p)) return html;
      return html.replace('</head>', '<script src="/px.js" defer></script>\n</head>');
    },
  },
});

export default defineConfig({
  plugins: [metaPixel()],
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

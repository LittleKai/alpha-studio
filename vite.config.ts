import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Long-lived vendor chunks: app deploys change page chunks, not these, so
// returning visitors keep them in the browser cache.
const VENDOR_CHUNKS: Record<string, RegExp> = {
  'vendor-react': /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
  'vendor-router': /[\\/]node_modules[\\/](react-router|react-router-dom|@remix-run)[\\/]/,
  'vendor-helmet': /[\\/]node_modules[\\/](react-helmet-async|react-fast-compare|invariant|shallowequal)[\\/]/,
};

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          for (const [name, pattern] of Object.entries(VENDOR_CHUNKS)) {
            if (pattern.test(id)) return name;
          }
          return undefined;
        },
      },
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_PROXY || 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});

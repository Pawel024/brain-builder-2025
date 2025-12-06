import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    svgr(),
  ],
  build: {
    outDir: 'build', // Maintain compatibility with Django serving 'build'
    assetsDir: 'static', // Put assets in static folder
    manifest: true, // Generate manifest for Django integration
    rollupOptions: {
      output: {
        // Ensure assets have predictable names if needed, but hash is better for caching
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://127.0.0.1:8000',
        ws: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

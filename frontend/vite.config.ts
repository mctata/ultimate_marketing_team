import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { viteCommonjs } from '@originjs/vite-plugin-commonjs';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    viteCommonjs({
      // Explicitly include prop-types for special handling
      include: ['prop-types', 'node_modules/prop-types/**'],
    }),
    react({
      babel: {
        plugins: [
          // Enable React automatic runtime
          ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }],
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  server: {
    port: 3000,
    host: true, // This allows access from network, not just localhost
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
      },
    },
  },
  build: {
    target: 'es2015',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: [
            'react',
            'react-dom',
            'react-router-dom',
            '@reduxjs/toolkit',
            'react-redux',
            '@tanstack/react-query',
            'axios',
          ],
          mui: [
            '@mui/material',
            '@mui/icons-material',
            '@mui/x-data-grid',
          ],
          charts: [
            'chart.js',
            'recharts',
          ],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
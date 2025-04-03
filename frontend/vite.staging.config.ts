import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Simple production config with minimal plugins
export default defineConfig({
  plugins: [
    // React configuration with minimal options
    react(),
  ],
  
  // Path aliases
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@services': path.resolve(__dirname, './src/services'),
      '@store': path.resolve(__dirname, './src/store'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
      '@assets': path.resolve(__dirname, './src/assets'),
    },
  },
  
  // Build optimization with reduced features
  build: {
    target: 'es2020',
    outDir: 'dist',
    // Disable source maps to reduce memory usage
    sourcemap: false,
    // Use minimal minification to save memory
    minify: 'esbuild',
    // Increase chunk size limit
    chunkSizeWarningLimit: 2000,
    // Simple chunking strategy
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@mui/material', '@emotion/react', '@emotion/styled'],
        },
      },
    },
  },
});
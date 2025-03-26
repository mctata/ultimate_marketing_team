import { defineConfig, splitVendorChunkPlugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { viteCommonjs } from '@originjs/vite-plugin-commonjs';
import { visualizer } from 'rollup-plugin-visualizer';
import { createHtmlPlugin } from 'vite-plugin-html';
// Import compression plugin with a different approach to avoid undefined errors
import compression from 'vite-plugin-compression2';

// Environment variables
const isProd = process.env.NODE_ENV === 'production';
const isAnalyze = process.env.ANALYZE === 'true';

// Load environment-specific configuration
const modeConfig = isProd 
  ? { minify: 'terser', sourcemap: false } 
  : { minify: false, sourcemap: true };

// Cached import bundling strategy
const cachedImports = [
  'react', 
  'react-dom', 
  'react-router-dom', 
  '@tanstack/react-query',
  '@reduxjs/toolkit',
  'react-redux',
  'redux-persist',
];

// UI frameworks bundling
const uiFrameworks = [
  '@mui/material',
  '@mui/icons-material',
  '@mui/x-charts',
  '@mui/x-data-grid',
  '@mui/x-date-pickers-pro',
  '@emotion/react',
  '@emotion/styled',
];

// Chart libraries bundling
const chartLibraries = [
  'chart.js',
  'recharts',
  '@nivo/core',
  '@nivo/line',
  '@nivo/pie',
  'd3',
];

// Form libraries bundling
const formLibraries = [
  'formik',
  'yup',
];

// Utility libraries bundling
const utilLibraries = [
  'date-fns',
  'lodash',
  'uuid',
  'axios',
  'file-saver',
];

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // Split vendor chunk plugin for better caching
    splitVendorChunkPlugin(),
    
    // CommonJS compatibility
    viteCommonjs({
      include: ['prop-types', 'node_modules/prop-types/**'],
    }),
    
    // React configuration
    react({
      babel: {
        plugins: [
          // Enable React automatic runtime
          ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }],
        ],
        // Babel caching is handled by Vite's own cache mechanism
      },
      // Enable Fast Refresh in development
      fastRefresh: true,
    }),
    
    // HTML template optimization
    createHtmlPlugin({
      minify: isProd,
      inject: {
        data: {
          title: 'Ultimate Marketing Team',
          description: 'AI-powered marketing platform',
        },
      },
    }),
    
    // Production brotli compression
    isProd && compression({
      algorithm: 'brotliCompress',
      exclude: [/\.(br)$/, /\.(gz)$/, /\.(png|jpe?g|gif|svg|webp)$/i],
      threshold: 10240, // Only compress files larger than 10KB
    }),
    
    // Production gzip compression
    isProd && compression({
      algorithm: 'gzip',
      exclude: [/\.(br)$/, /\.(gz)$/, /\.(png|jpe?g|gif|svg|webp)$/i],
      threshold: 10240, // Only compress files larger than 10KB
    }),
    
    // Bundle analysis in analyze mode
    isAnalyze && visualizer({
      open: true,
      filename: 'bundle-stats.html',
      gzipSize: true,
      brotliSize: true,
    }),
  ].filter(Boolean),
  
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
    // Deduplicate packages
    dedupe: ['react', 'react-dom', 'react-router-dom', '@mui/material'],
  },
  
  // Development server
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
    // Watch performance optimizations
    watch: {
      usePolling: false,
      // Ignore node_modules to improve watch performance
      ignored: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
    },
  },
  
  // CSS optimization
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      // Add any CSS preprocessor options here
    },
  },
  
  // Build optimization
  build: {
    target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],
    outDir: 'dist',
    assetsDir: 'assets',
    // Inline assets smaller than 10KB into the JS bundle to reduce HTTP requests
    assetsInlineLimit: 10240,
    // Enable/disable source maps based on mode
    sourcemap: modeConfig.sourcemap,
    // Explicitly set minify to use terser
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: isProd,
        drop_debugger: isProd,
      },
    },
    // Write manifest for server-side rendering
    manifest: true,
    // CSS code splitting
    cssCodeSplit: true,
    // Module preload strategy
    modulePreload: {
      polyfill: true,
    },
    // Rollup specific options
    rollupOptions: {
      output: {
        // Use chunk hashing for better caching
        chunkFileNames: isProd 
          ? 'assets/[name].[hash].js'
          : 'assets/[name].js',
        entryFileNames: isProd 
          ? 'assets/[name].[hash].js'
          : 'assets/[name].js',
        assetFileNames: isProd 
          ? 'assets/[name].[hash].[ext]'
          : 'assets/[name].[ext]',
        // Advanced chunks strategy
        manualChunks: (id) => {
          // React and core libraries
          if (cachedImports.some(pkg => id.includes(`/node_modules/${pkg}`) || id.includes(`node_modules/${pkg}/`))) {
            return 'vendor-react';
          }
          
          // Material UI and UI frameworks
          if (uiFrameworks.some(pkg => id.includes(`/node_modules/${pkg}`) || id.includes(`node_modules/${pkg}/`))) {
            return 'vendor-mui';
          }
          
          // Chart libraries
          if (chartLibraries.some(pkg => id.includes(`/node_modules/${pkg}`) || id.includes(`node_modules/${pkg}/`))) {
            return 'vendor-charts';
          }
          
          // Form libraries
          if (formLibraries.some(pkg => id.includes(`/node_modules/${pkg}`) || id.includes(`node_modules/${pkg}/`))) {
            return 'vendor-forms';
          }
          
          // Utility libraries
          if (utilLibraries.some(pkg => id.includes(`/node_modules/${pkg}`) || id.includes(`node_modules/${pkg}/`))) {
            return 'vendor-utils';
          }
          
          // Route-based code splitting
          if (id.includes('/src/pages/dashboard/')) {
            return 'page-dashboard';
          }
          if (id.includes('/src/pages/content/')) {
            return 'page-content';
          }
          if (id.includes('/src/pages/campaigns/')) {
            return 'page-campaigns';
          }
          if (id.includes('/src/pages/brands/')) {
            return 'page-brands';
          }
          if (id.includes('/src/pages/analytics/')) {
            return 'page-analytics';
          }
          if (id.includes('/src/pages/templates/')) {
            return 'page-templates';
          }
          if (id.includes('/src/pages/auth/')) {
            return 'page-auth';
          }
        },
      },
      // Preserve pure functions for better tree-shaking
      treeshake: {
        preset: 'recommended',
        moduleSideEffects: 'no-external',
      },
    },
    // Increase warning limit for larger chunks (Material UI can be large)
    chunkSizeWarningLimit: 1200,
    // Enable inlining of dynamic imports below the limit
    dynamicImportVarsOptions: {
      // Filter for dynamic imports to transform
      warnOnError: true,
    },
  },
  
  // Dependency optimization
  optimizeDeps: {
    // Force including these dependencies in the optimization
    include: [
      // Core React packages
      ...cachedImports,
      
      // UI frameworks
      ...uiFrameworks,
      
      // Chart libraries
      ...chartLibraries,
      
      // Form libraries
      ...formLibraries,
      
      // Utility libraries
      ...utilLibraries,
    ],
    // Exclude dependencies with native ESM that shouldn't be bundled
    exclude: [],
    // Enable dependency discovery in node_modules
    esbuildOptions: {
      target: 'es2020',
      // Support JSX in TS files
      jsx: 'automatic',
      // Additional loader definitions
      loader: {
        '.svg': 'text',
      },
    },
    // Pre-bundling options
    entries: [
      './src/main.tsx',
      './src/pages/**/*.tsx',
    ],
    // Force re-optimization of packages if something was modified
    force: process.env.FORCE_DEPS === 'true',
  },
  
  // Performance optimization
  performance: {
    // Don't warn about large entry points
    hints: false,
  },
});
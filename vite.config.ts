// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Set up path alias to match your CRA setup
      'src': resolve(__dirname, 'src')
    },
  },
  // Polyfill needed features that might be used by ethers.js
  define: {
    'process.env': {},
    'global': {},
  },
  // Handle assets like CRA does
  build: {
    outDir: 'build', // Match CRA output dir name
  },
  // Setup server to support .well-known and other routes
  server: {
    port: 3000, // Same as CRA
  }
});
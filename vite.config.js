import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// Remove this import until you install it
// import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    react(),
    // Remove this until installed
    // tsconfigPaths()
  ],
  build: {
    emptyOutDir: true,
    outDir: 'dist',
    minify: false,
    sourcemap: true,
    rollupOptions: {
      input: {
        content: 'src/content/content.js',
        'content-init': 'src/core/init.ts',
        background: 'src/background/background.js',
        popup: 'src/popup/popup.js',
        welcome: 'src/welcome/welcome.jsx'
      },
      output: {
        format: "iife", // Change to IIFE for better compatibility
        entryFileNames: "[name].js",
        chunkFileNames: "assets/[name].[hash].js",
        assetFileNames: "assets/[name].[ext]"
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
}); 
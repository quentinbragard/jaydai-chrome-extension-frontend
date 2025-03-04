import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import cssInjectedByJs from 'vite-plugin-css-injected-by-js';
import tsconfigPaths from 'vite-tsconfig-paths';

// Create __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig(function (_a) {
    const mode = _a.mode;
    const isProduction = mode === 'production';
    return {
        plugins: [
            react(),
            tsconfigPaths(), // Add this to resolve path aliases correctly
            cssInjectedByJs(),
            viteStaticCopy({
                targets: [
                    {
                        src: 'public/*',
                        dest: ''
                    },
                    // Copy HTML files from their source locations to the dist folder
                    {
                        src: 'src/popup/popup.html',
                        dest: '',
                        rename: 'popup.html'
                    },
                    {
                        src: 'src/welcome/welcome.html',
                        dest: '',
                        rename: 'welcome.html'
                    },
                    {
                        src: 'src/styles/globals.css',
                        dest: 'assets/'
                    }
                ]
            })
        ],
        css: {
            postcss: {
                plugins: [
                    tailwindcss,
                    autoprefixer,
                ],
            },
        },
        // Prevent code splitting for extension entry points
        build: {
            emptyOutDir: true,
            outDir: 'dist',
            minify: isProduction,
            sourcemap: !isProduction,
            rollupOptions: {
                input: {
                    content: resolve(__dirname, 'src/content/content.js'),
                    'content-init': resolve(__dirname, 'src/content/initializer.ts'), // We'll create this file
                    background: resolve(__dirname, 'src/background/background.js'),
                    popup: resolve(__dirname, 'src/popup/popup.js'),
                    welcome: resolve(__dirname, 'src/welcome/welcome.jsx')
                },
                output: {
                    entryFileNames: '[name].js',
                    chunkFileNames: 'assets/[name].[hash].js',
                    assetFileNames: 'assets/[name].[ext]',
                    manualChunks: undefined // Disable chunk optimization for extension entry points
                },
                preserveEntrySignatures: 'strict' // Helps prevent tree-shaking of exports
            }
        },
        resolve: {
            alias: {
                '@': resolve(__dirname, './src'),
                '@components': resolve(__dirname, './src/components')
            }
        },
        // Improve handling of external dependencies
        optimizeDeps: {
            include: ['react', 'react-dom']
        },
        define: {
            // This makes process.env.NODE_ENV available in your code
            'process.env.NODE_ENV': JSON.stringify(mode)
          },
          server: {
            hmr: {
              // This helps with HMR when developing
              port: 3000
            }
          }
    };
});
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
    const envPrefix = 'VITE_';
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
                        src: 'src/extension/popup/popup.html',
                        dest: '',
                        rename: 'popup.html'
                    },
                    {
                        src: 'src/extension/welcome/welcome.html',
                        dest: '',
                        rename: 'welcome.html'
                    },
                    {
                        src: 'src/extension/content/content.css',
                        dest: 'assets/'
                    },
                    {
                        src: '_locales',
                        dest: ''
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
                    content: resolve(__dirname, 'src/extension/content/content.js'),
                    'content-init': resolve(__dirname, 'src/extension/content/initializer.ts'), // We'll create this file
                    background: resolve(__dirname, 'src/extension/background/background.js'),
                    popup: resolve(__dirname, 'src/extension/popup/popup.tsx'),
                    welcome: resolve(__dirname, 'src/extension/welcome/welcome.tsx'),
                    'injectedInterceptor': resolve(__dirname, 'src/extension/content/injectedInterceptor.js'),
                    'applicationInitializer': resolve(__dirname, 'src/extension/content/applicationInitializer.ts'),
                    'popup-styles': resolve(__dirname, 'src/extension/popup/popup.css'),
                    'welcome-styles': resolve(__dirname, 'src/extension/welcome/welcome.css'),
                    'content-styles': resolve(__dirname, 'src/extension/content/content.css')
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
            'process.env.NODE_ENV': JSON.stringify(mode),
            'process.env.VITE_API_URL': mode === 'production' 
                ? JSON.stringify('https://api.yourproductiondomain.com')
                : JSON.stringify('http://localhost:8000'),
            'process.env.VITE_DEBUG': mode === 'production'
                ? JSON.stringify('false')
                : JSON.stringify('true'),
            'process.env.VITE_APP_VERSION': JSON.stringify('1.0.0')
          },
          server: {
            hmr: {
              // This helps with HMR when developing
              port: 3000
            }
          }
    };
});
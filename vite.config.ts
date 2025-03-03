import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import cssInjectedByJs from 'vite-plugin-css-injected-by-js';

// Create __dirname equivalent for ES modules
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);

export default defineConfig(function (_a) {
    var mode = _a.mode;
    var isProduction = mode === 'production';
    return {
        plugins: [
            react(),
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
        build: {
            emptyOutDir: true,
            outDir: 'dist',
            minify: isProduction,
            sourcemap: !isProduction,
            rollupOptions: {
                input: {
                    content: resolve(__dirname, 'src/content/content.js'),
                    'content-init': resolve(__dirname, 'src/core/init.ts'),
                    background: resolve(__dirname, 'src/background/background.js'),
                    popup: resolve(__dirname, 'src/popup/popup.js'),
                    welcome: resolve(__dirname, 'src/welcome/welcome.jsx')
                },
                output: {
                    entryFileNames: '[name].js',
                    chunkFileNames: 'assets/[name].[hash].js',
                    assetFileNames: 'assets/[name].[ext]'
                }
            }
        },
        resolve: {
            alias: {
                '@': resolve(__dirname, './src'),
                '@components': resolve(__dirname, './src/components')
            }
        }
    };
}); 
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import cssInjectedByJs from 'vite-plugin-css-injected-by-js';
import tsconfigPaths from 'vite-tsconfig-paths';

// Create __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig(({ mode }) => {
    // Load ALL environment variables that start with VITE_
    const env = loadEnv(mode, process.cwd(), 'VITE_');
    
    const isProduction = mode === 'production';
    
    // Explicitly define all required environment variables
    const apiUrl = env.VITE_API_URL ;
    
    const debug = env.VITE_DEBUG;
    const appVersion = env.VITE_APP_VERSION;
    const linkedinClientId = env.VITE_LINKEDIN_CLIENT_ID;

    console.log(`🚀 Building for ${mode} environment`);
    console.log(`🔌 API URL: ${apiUrl}`);
    console.log(`🐞 Debug: ${debug}`);
    console.log(`📦 Version: ${appVersion}`);
    console.log(`🔹 LinkedIn Client ID: ${linkedinClientId}`);

    return {
        plugins: [
            react(),
            tsconfigPaths(),
            cssInjectedByJs(),
            viteStaticCopy({
                targets: [
                    {
                        src: 'public/*',
                        dest: ''
                    },
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
        build: {
            emptyOutDir: true,
            outDir: 'dist',
            minify: isProduction,
            sourcemap: !isProduction,
            rollupOptions: {
                input: {
                    content: resolve(__dirname, 'src/extension/content/content.js'),
                    'content-init': resolve(__dirname, 'src/extension/content/initializer.ts'),
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
                    manualChunks: undefined
                },
                preserveEntrySignatures: 'strict'
            }
        },
        resolve: {
            alias: {
                '@': resolve(__dirname, './src'),
                '@components': resolve(__dirname, './src/components')
            }
        },
        optimizeDeps: {
            include: ['react', 'react-dom']
        },
        define: {
            // IMPORTANT: Define ALL environment variables explicitly
            'process.env.NODE_ENV': JSON.stringify(mode),
            'process.env.VITE_API_URL': JSON.stringify(apiUrl),
            'process.env.VITE_DEBUG': JSON.stringify(debug),
            'process.env.VITE_APP_VERSION': JSON.stringify(appVersion),
            'process.env.VITE_LINKEDIN_CLIENT_ID': JSON.stringify(linkedinClientId),
            
            // Add any other environment variables you need
            ...Object.keys(env).reduce((acc, key) => {
                acc[`process.env.${key}`] = JSON.stringify(env[key]);
                return acc;
            }, {})
        },
        server: {
            hmr: {
                port: 3000
            }
        }
    };
});
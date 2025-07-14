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
    // Load environment variables from .env files
    // mode can be 'development' or 'production'
    const env = loadEnv(mode, process.cwd(), 'VITE_');
    
    const isProduction = mode === 'production';
    
    // Get the API URL from env
    const apiUrl = env.VITE_API_URL;
    
    // Get debug setting from env
    const debug = env.VITE_DEBUG;
    
    // Get app version from env
    const appVersion = env.VITE_APP_VERSION;
    
    console.log(`🚀 Building for ${mode} environment`);
    console.log(`🔌 API URL: ${apiUrl}`);
    console.log(`🐞 Debug: ${debug}`);
    console.log(`📦 Version: ${appVersion}`);
    console.log(`💳 Stripe: ${env.VITE_STRIPE_PUBLISHABLE_KEY ? 'Configured' : 'Not configured'}`);

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
                    background: resolve(__dirname, 'src/extension/background/background.js'),
                    popup: resolve(__dirname, 'src/extension/popup/popup.tsx'),
                    welcome: resolve(__dirname, 'src/extension/welcome/welcome.tsx'),
                    'networkInterceptor': resolve(__dirname, 'src/extension/content/networkInterceptor/index.js'),
                    'applicationInitializer': resolve(__dirname, 'src/extension/content/applicationInitializer.ts'),
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
            // Make environment variables available in the code
            'process.env.NODE_ENV': JSON.stringify(mode),
            'process.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL),
            'process.env.VITE_DEBUG': JSON.stringify(env.VITE_DEBUG),
            'process.env.VITE_APP_VERSION': JSON.stringify(env.VITE_APP_VERSION),
            'process.env.VITE_AMPLITUDE_API_KEY': JSON.stringify(env.VITE_AMPLITUDE_API_KEY),
            'process.env.VITE_LINKEDIN_CLIENT_ID': JSON.stringify(env.VITE_LINKEDIN_CLIENT_ID),
            // Stripe environment variables
            'process.env.VITE_STRIPE_PUBLISHABLE_KEY': JSON.stringify(env.VITE_STRIPE_PUBLISHABLE_KEY),
            'process.env.VITE_STRIPE_MONTHLY_PRICE_ID': JSON.stringify(env.VITE_STRIPE_MONTHLY_PRICE_ID),
            'process.env.VITE_STRIPE_YEARLY_PRICE_ID': JSON.stringify(env.VITE_STRIPE_YEARLY_PRICE_ID),
            'process.env.VITE_STRIPE_SUCCESS_URL': JSON.stringify(env.VITE_STRIPE_SUCCESS_URL),
            'process.env.VITE_STRIPE_CANCEL_URL': JSON.stringify(env.VITE_STRIPE_CANCEL_URL)
        },
        server: {
            hmr: {
                // This helps with HMR when developing
                port: 3000
            }
        }
    };
});
// vite.config.ts
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { defineConfig, loadEnv } from "file:///Users/quentinbragard/archimind/jaydai-chrome-extension-frontend/node_modules/.pnpm/vite@5.4.19_@types+node@20.17.52_lightningcss@1.30.1/node_modules/vite/dist/node/index.js";
import react from "file:///Users/quentinbragard/archimind/jaydai-chrome-extension-frontend/node_modules/.pnpm/@vitejs+plugin-react@4.5.0_vite@5.4.19_@types+node@20.17.52_lightningcss@1.30.1_/node_modules/@vitejs/plugin-react/dist/index.mjs";
import tailwindcss from "file:///Users/quentinbragard/archimind/jaydai-chrome-extension-frontend/node_modules/.pnpm/tailwindcss@3.4.17/node_modules/tailwindcss/lib/index.js";
import autoprefixer from "file:///Users/quentinbragard/archimind/jaydai-chrome-extension-frontend/node_modules/.pnpm/autoprefixer@10.4.21_postcss@8.5.4/node_modules/autoprefixer/lib/autoprefixer.js";
import { viteStaticCopy } from "file:///Users/quentinbragard/archimind/jaydai-chrome-extension-frontend/node_modules/.pnpm/vite-plugin-static-copy@1.0.6_vite@5.4.19_@types+node@20.17.52_lightningcss@1.30.1_/node_modules/vite-plugin-static-copy/dist/index.js";
import cssInjectedByJs from "file:///Users/quentinbragard/archimind/jaydai-chrome-extension-frontend/node_modules/.pnpm/vite-plugin-css-injected-by-js@3.5.2_vite@5.4.19_@types+node@20.17.52_lightningcss@1.30.1_/node_modules/vite-plugin-css-injected-by-js/dist/esm/index.js";
import tsconfigPaths from "file:///Users/quentinbragard/archimind/jaydai-chrome-extension-frontend/node_modules/.pnpm/vite-tsconfig-paths@5.1.4_typescript@5.8.3_vite@5.4.19_@types+node@20.17.52_lightningcss@1.30.1_/node_modules/vite-tsconfig-paths/dist/index.js";
var __vite_injected_original_import_meta_url = "file:///Users/quentinbragard/archimind/jaydai-chrome-extension-frontend/vite.config.ts";
var __filename = fileURLToPath(__vite_injected_original_import_meta_url);
var __dirname = dirname(__filename);
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const isProduction = mode === "production" || mode === "local";
  const apiUrl = env.VITE_API_URL || (isProduction ? "https://jaydai-api-sw5cmqbraq-uc.a.run.app/" : "http://localhost:8000");
  const debug = env.VITE_DEBUG || (!isProduction).toString();
  const appVersion = env.VITE_APP_VERSION || "1.0.0";
  console.log(`\u{1F680} Building for ${mode} environment`);
  console.log(`\u{1F50C} API URL: ${apiUrl}`);
  console.log(`\u{1F41E} Debug: ${debug}`);
  console.log(`\u{1F4E6} Version: ${appVersion}`);
  return {
    plugins: [
      react(),
      tsconfigPaths(),
      // Add this to resolve path aliases correctly
      cssInjectedByJs(),
      viteStaticCopy({
        targets: [
          {
            src: "public/*",
            dest: ""
          },
          // Copy HTML files from their source locations to the dist folder
          {
            src: "src/extension/popup/popup.html",
            dest: "",
            rename: "popup.html"
          },
          {
            src: "src/extension/welcome/welcome.html",
            dest: "",
            rename: "welcome.html"
          },
          {
            src: "_locales",
            dest: ""
          }
        ]
      })
    ],
    css: {
      postcss: {
        plugins: [
          tailwindcss,
          autoprefixer
        ]
      }
    },
    // Prevent code splitting for extension entry points
    build: {
      emptyOutDir: true,
      outDir: "dist",
      minify: isProduction,
      sourcemap: !isProduction,
      rollupOptions: {
        input: {
          content: resolve(__dirname, "src/extension/content/content.js"),
          background: resolve(__dirname, "src/extension/background/background.js"),
          popup: resolve(__dirname, "src/extension/popup/popup.tsx"),
          welcome: resolve(__dirname, "src/extension/welcome/welcome.tsx"),
          "networkInterceptor": resolve(__dirname, "src/extension/content/networkInterceptor/index.js"),
          "applicationInitializer": resolve(__dirname, "src/extension/content/applicationInitializer.ts")
          //'popup-styles': resolve(__dirname, 'src/extension/popup/popup.css'),
          //'welcome-styles': resolve(__dirname, 'src/extension/welcome/welcome.css'),
          //'content-styles': resolve(__dirname, 'src/extension/content/content.css')
        },
        output: {
          entryFileNames: "[name].js",
          chunkFileNames: "assets/[name].[hash].js",
          assetFileNames: "assets/[name].[ext]",
          manualChunks: void 0
          // Disable chunk optimization for extension entry points
        },
        preserveEntrySignatures: "strict"
        // Helps prevent tree-shaking of exports
      }
    },
    resolve: {
      alias: {
        "@": resolve(__dirname, "./src"),
        "@components": resolve(__dirname, "./src/components")
      }
    },
    // Improve handling of external dependencies
    optimizeDeps: {
      include: ["react", "react-dom"]
    },
    define: {
      // Make environment variables available in the code
      "process.env.NODE_ENV": JSON.stringify(mode),
      "process.env.VITE_API_URL": JSON.stringify(apiUrl),
      "process.env.VITE_DEBUG": JSON.stringify(debug),
      "process.env.VITE_APP_VERSION": JSON.stringify(appVersion)
    },
    server: {
      hmr: {
        // This helps with HMR when developing
        port: 3e3
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvcXVlbnRpbmJyYWdhcmQvYXJjaGltaW5kL2pheWRhaS1jaHJvbWUtZXh0ZW5zaW9uLWZyb250ZW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvcXVlbnRpbmJyYWdhcmQvYXJjaGltaW5kL2pheWRhaS1jaHJvbWUtZXh0ZW5zaW9uLWZyb250ZW5kL3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9xdWVudGluYnJhZ2FyZC9hcmNoaW1pbmQvamF5ZGFpLWNocm9tZS1leHRlbnNpb24tZnJvbnRlbmQvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkaXJuYW1lLCByZXNvbHZlIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBmaWxlVVJMVG9QYXRoIH0gZnJvbSAndXJsJztcbmltcG9ydCB7IGRlZmluZUNvbmZpZywgbG9hZEVudiB9IGZyb20gJ3ZpdGUnO1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0JztcbmltcG9ydCB0YWlsd2luZGNzcyBmcm9tICd0YWlsd2luZGNzcyc7XG5pbXBvcnQgYXV0b3ByZWZpeGVyIGZyb20gJ2F1dG9wcmVmaXhlcic7XG5pbXBvcnQgeyB2aXRlU3RhdGljQ29weSB9IGZyb20gJ3ZpdGUtcGx1Z2luLXN0YXRpYy1jb3B5JztcbmltcG9ydCBjc3NJbmplY3RlZEJ5SnMgZnJvbSAndml0ZS1wbHVnaW4tY3NzLWluamVjdGVkLWJ5LWpzJztcbmltcG9ydCB0c2NvbmZpZ1BhdGhzIGZyb20gJ3ZpdGUtdHNjb25maWctcGF0aHMnO1xuXG4vLyBDcmVhdGUgX19kaXJuYW1lIGVxdWl2YWxlbnQgZm9yIEVTIG1vZHVsZXNcbmNvbnN0IF9fZmlsZW5hbWUgPSBmaWxlVVJMVG9QYXRoKGltcG9ydC5tZXRhLnVybCk7XG5jb25zdCBfX2Rpcm5hbWUgPSBkaXJuYW1lKF9fZmlsZW5hbWUpO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiB7XG4gICAgLy8gTG9hZCBlbnZpcm9ubWVudCB2YXJpYWJsZXMgZnJvbSAuZW52IGZpbGVzXG4gICAgLy8gbW9kZSBjYW4gYmUgJ2RldmVsb3BtZW50JyBvciAncHJvZHVjdGlvbidcbiAgICBjb25zdCBlbnYgPSBsb2FkRW52KG1vZGUsIHByb2Nlc3MuY3dkKCksICdWSVRFXycpO1xuICAgIFxuICAgIGNvbnN0IGlzUHJvZHVjdGlvbiA9IG1vZGUgPT09ICdwcm9kdWN0aW9uJyB8fCBtb2RlID09PSAnbG9jYWwnO1xuICAgIFxuICAgIC8vIEdldCB0aGUgQVBJIFVSTCBmcm9tIGVudiBvciB1c2UgZGVmYXVsdCB2YWx1ZXNcbiAgICBjb25zdCBhcGlVcmwgPSBlbnYuVklURV9BUElfVVJMIHx8IChpc1Byb2R1Y3Rpb24gXG4gICAgICAgID8gJ2h0dHBzOi8vamF5ZGFpLWFwaS1zdzVjbXFicmFxLXVjLmEucnVuLmFwcC8nXG4gICAgICAgIDogJ2h0dHA6Ly9sb2NhbGhvc3Q6ODAwMCcpO1xuICAgIFxuICAgIC8vIEdldCBkZWJ1ZyBzZXR0aW5nIGZyb20gZW52IG9yIGRlZmF1bHQgYmFzZWQgb24gbW9kZVxuICAgIGNvbnN0IGRlYnVnID0gZW52LlZJVEVfREVCVUcgfHwgKCFpc1Byb2R1Y3Rpb24pLnRvU3RyaW5nKCk7XG4gICAgXG4gICAgLy8gR2V0IGFwcCB2ZXJzaW9uIGZyb20gZW52IG9yIGRlZmF1bHRcbiAgICBjb25zdCBhcHBWZXJzaW9uID0gZW52LlZJVEVfQVBQX1ZFUlNJT04gfHwgJzEuMC4wJztcbiAgICBcbiAgICBjb25zb2xlLmxvZyhgXHVEODNEXHVERTgwIEJ1aWxkaW5nIGZvciAke21vZGV9IGVudmlyb25tZW50YCk7XG4gICAgY29uc29sZS5sb2coYFx1RDgzRFx1REQwQyBBUEkgVVJMOiAke2FwaVVybH1gKTtcbiAgICBjb25zb2xlLmxvZyhgXHVEODNEXHVEQzFFIERlYnVnOiAke2RlYnVnfWApO1xuICAgIGNvbnNvbGUubG9nKGBcdUQ4M0RcdURDRTYgVmVyc2lvbjogJHthcHBWZXJzaW9ufWApO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcGx1Z2luczogW1xuICAgICAgICAgICAgcmVhY3QoKSxcbiAgICAgICAgICAgIHRzY29uZmlnUGF0aHMoKSwgLy8gQWRkIHRoaXMgdG8gcmVzb2x2ZSBwYXRoIGFsaWFzZXMgY29ycmVjdGx5XG4gICAgICAgICAgICBjc3NJbmplY3RlZEJ5SnMoKSxcbiAgICAgICAgICAgIHZpdGVTdGF0aWNDb3B5KHtcbiAgICAgICAgICAgICAgICB0YXJnZXRzOiBbXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNyYzogJ3B1YmxpYy8qJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc3Q6ICcnXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIC8vIENvcHkgSFRNTCBmaWxlcyBmcm9tIHRoZWlyIHNvdXJjZSBsb2NhdGlvbnMgdG8gdGhlIGRpc3QgZm9sZGVyXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNyYzogJ3NyYy9leHRlbnNpb24vcG9wdXAvcG9wdXAuaHRtbCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXN0OiAnJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbmFtZTogJ3BvcHVwLmh0bWwnXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNyYzogJ3NyYy9leHRlbnNpb24vd2VsY29tZS93ZWxjb21lLmh0bWwnLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGVzdDogJycsXG4gICAgICAgICAgICAgICAgICAgICAgICByZW5hbWU6ICd3ZWxjb21lLmh0bWwnXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNyYzogJ19sb2NhbGVzJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc3Q6ICcnXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICB9KVxuICAgICAgICBdLFxuICAgICAgICBjc3M6IHtcbiAgICAgICAgICAgIHBvc3Rjc3M6IHtcbiAgICAgICAgICAgICAgICBwbHVnaW5zOiBbXG4gICAgICAgICAgICAgICAgICAgIHRhaWx3aW5kY3NzLFxuICAgICAgICAgICAgICAgICAgICBhdXRvcHJlZml4ZXIsXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIC8vIFByZXZlbnQgY29kZSBzcGxpdHRpbmcgZm9yIGV4dGVuc2lvbiBlbnRyeSBwb2ludHNcbiAgICAgICAgYnVpbGQ6IHtcbiAgICAgICAgICAgIGVtcHR5T3V0RGlyOiB0cnVlLFxuICAgICAgICAgICAgb3V0RGlyOiAnZGlzdCcsXG4gICAgICAgICAgICBtaW5pZnk6IGlzUHJvZHVjdGlvbixcbiAgICAgICAgICAgIHNvdXJjZW1hcDogIWlzUHJvZHVjdGlvbixcbiAgICAgICAgICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgICAgICAgICAgICBpbnB1dDoge1xuICAgICAgICAgICAgICAgICAgICBjb250ZW50OiByZXNvbHZlKF9fZGlybmFtZSwgJ3NyYy9leHRlbnNpb24vY29udGVudC9jb250ZW50LmpzJyksXG4gICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6IHJlc29sdmUoX19kaXJuYW1lLCAnc3JjL2V4dGVuc2lvbi9iYWNrZ3JvdW5kL2JhY2tncm91bmQuanMnKSxcbiAgICAgICAgICAgICAgICAgICAgcG9wdXA6IHJlc29sdmUoX19kaXJuYW1lLCAnc3JjL2V4dGVuc2lvbi9wb3B1cC9wb3B1cC50c3gnKSxcbiAgICAgICAgICAgICAgICAgICAgd2VsY29tZTogcmVzb2x2ZShfX2Rpcm5hbWUsICdzcmMvZXh0ZW5zaW9uL3dlbGNvbWUvd2VsY29tZS50c3gnKSxcbiAgICAgICAgICAgICAgICAgICAgJ25ldHdvcmtJbnRlcmNlcHRvcic6IHJlc29sdmUoX19kaXJuYW1lLCAnc3JjL2V4dGVuc2lvbi9jb250ZW50L25ldHdvcmtJbnRlcmNlcHRvci9pbmRleC5qcycpLFxuICAgICAgICAgICAgICAgICAgICAnYXBwbGljYXRpb25Jbml0aWFsaXplcic6IHJlc29sdmUoX19kaXJuYW1lLCAnc3JjL2V4dGVuc2lvbi9jb250ZW50L2FwcGxpY2F0aW9uSW5pdGlhbGl6ZXIudHMnKSxcbiAgICAgICAgICAgICAgICAgICAgLy8ncG9wdXAtc3R5bGVzJzogcmVzb2x2ZShfX2Rpcm5hbWUsICdzcmMvZXh0ZW5zaW9uL3BvcHVwL3BvcHVwLmNzcycpLFxuICAgICAgICAgICAgICAgICAgICAvLyd3ZWxjb21lLXN0eWxlcyc6IHJlc29sdmUoX19kaXJuYW1lLCAnc3JjL2V4dGVuc2lvbi93ZWxjb21lL3dlbGNvbWUuY3NzJyksXG4gICAgICAgICAgICAgICAgICAgIC8vJ2NvbnRlbnQtc3R5bGVzJzogcmVzb2x2ZShfX2Rpcm5hbWUsICdzcmMvZXh0ZW5zaW9uL2NvbnRlbnQvY29udGVudC5jc3MnKVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgb3V0cHV0OiB7XG4gICAgICAgICAgICAgICAgICAgIGVudHJ5RmlsZU5hbWVzOiAnW25hbWVdLmpzJyxcbiAgICAgICAgICAgICAgICAgICAgY2h1bmtGaWxlTmFtZXM6ICdhc3NldHMvW25hbWVdLltoYXNoXS5qcycsXG4gICAgICAgICAgICAgICAgICAgIGFzc2V0RmlsZU5hbWVzOiAnYXNzZXRzL1tuYW1lXS5bZXh0XScsXG4gICAgICAgICAgICAgICAgICAgIG1hbnVhbENodW5rczogdW5kZWZpbmVkIC8vIERpc2FibGUgY2h1bmsgb3B0aW1pemF0aW9uIGZvciBleHRlbnNpb24gZW50cnkgcG9pbnRzXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBwcmVzZXJ2ZUVudHJ5U2lnbmF0dXJlczogJ3N0cmljdCcgLy8gSGVscHMgcHJldmVudCB0cmVlLXNoYWtpbmcgb2YgZXhwb3J0c1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgICAgICBhbGlhczoge1xuICAgICAgICAgICAgICAgICdAJzogcmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYycpLFxuICAgICAgICAgICAgICAgICdAY29tcG9uZW50cyc6IHJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMvY29tcG9uZW50cycpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIC8vIEltcHJvdmUgaGFuZGxpbmcgb2YgZXh0ZXJuYWwgZGVwZW5kZW5jaWVzXG4gICAgICAgIG9wdGltaXplRGVwczoge1xuICAgICAgICAgICAgaW5jbHVkZTogWydyZWFjdCcsICdyZWFjdC1kb20nXVxuICAgICAgICB9LFxuICAgICAgICBkZWZpbmU6IHtcbiAgICAgICAgICAgIC8vIE1ha2UgZW52aXJvbm1lbnQgdmFyaWFibGVzIGF2YWlsYWJsZSBpbiB0aGUgY29kZVxuICAgICAgICAgICAgJ3Byb2Nlc3MuZW52Lk5PREVfRU5WJzogSlNPTi5zdHJpbmdpZnkobW9kZSksXG4gICAgICAgICAgICAncHJvY2Vzcy5lbnYuVklURV9BUElfVVJMJzogSlNPTi5zdHJpbmdpZnkoYXBpVXJsKSxcbiAgICAgICAgICAgICdwcm9jZXNzLmVudi5WSVRFX0RFQlVHJzogSlNPTi5zdHJpbmdpZnkoZGVidWcpLFxuICAgICAgICAgICAgJ3Byb2Nlc3MuZW52LlZJVEVfQVBQX1ZFUlNJT04nOiBKU09OLnN0cmluZ2lmeShhcHBWZXJzaW9uKVxuICAgICAgICB9LFxuICAgICAgICBzZXJ2ZXI6IHtcbiAgICAgICAgICAgIGhtcjoge1xuICAgICAgICAgICAgICAgIC8vIFRoaXMgaGVscHMgd2l0aCBITVIgd2hlbiBkZXZlbG9waW5nXG4gICAgICAgICAgICAgICAgcG9ydDogMzAwMFxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbn0pOyJdLAogICJtYXBwaW5ncyI6ICI7QUFBa1gsU0FBUyxTQUFTLGVBQWU7QUFDblosU0FBUyxxQkFBcUI7QUFDOUIsU0FBUyxjQUFjLGVBQWU7QUFDdEMsT0FBTyxXQUFXO0FBQ2xCLE9BQU8saUJBQWlCO0FBQ3hCLE9BQU8sa0JBQWtCO0FBQ3pCLFNBQVMsc0JBQXNCO0FBQy9CLE9BQU8scUJBQXFCO0FBQzVCLE9BQU8sbUJBQW1CO0FBUjhNLElBQU0sMkNBQTJDO0FBV3pSLElBQU0sYUFBYSxjQUFjLHdDQUFlO0FBQ2hELElBQU0sWUFBWSxRQUFRLFVBQVU7QUFFcEMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE1BQU07QUFHdEMsUUFBTSxNQUFNLFFBQVEsTUFBTSxRQUFRLElBQUksR0FBRyxPQUFPO0FBRWhELFFBQU0sZUFBZSxTQUFTLGdCQUFnQixTQUFTO0FBR3ZELFFBQU0sU0FBUyxJQUFJLGlCQUFpQixlQUM5QixnREFDQTtBQUdOLFFBQU0sUUFBUSxJQUFJLGVBQWUsQ0FBQyxjQUFjLFNBQVM7QUFHekQsUUFBTSxhQUFhLElBQUksb0JBQW9CO0FBRTNDLFVBQVEsSUFBSSwwQkFBbUIsSUFBSSxjQUFjO0FBQ2pELFVBQVEsSUFBSSxzQkFBZSxNQUFNLEVBQUU7QUFDbkMsVUFBUSxJQUFJLG9CQUFhLEtBQUssRUFBRTtBQUNoQyxVQUFRLElBQUksc0JBQWUsVUFBVSxFQUFFO0FBRXZDLFNBQU87QUFBQSxJQUNILFNBQVM7QUFBQSxNQUNMLE1BQU07QUFBQSxNQUNOLGNBQWM7QUFBQTtBQUFBLE1BQ2QsZ0JBQWdCO0FBQUEsTUFDaEIsZUFBZTtBQUFBLFFBQ1gsU0FBUztBQUFBLFVBQ0w7QUFBQSxZQUNJLEtBQUs7QUFBQSxZQUNMLE1BQU07QUFBQSxVQUNWO0FBQUE7QUFBQSxVQUVBO0FBQUEsWUFDSSxLQUFLO0FBQUEsWUFDTCxNQUFNO0FBQUEsWUFDTixRQUFRO0FBQUEsVUFDWjtBQUFBLFVBQ0E7QUFBQSxZQUNJLEtBQUs7QUFBQSxZQUNMLE1BQU07QUFBQSxZQUNOLFFBQVE7QUFBQSxVQUNaO0FBQUEsVUFDQTtBQUFBLFlBQ0ksS0FBSztBQUFBLFlBQ0wsTUFBTTtBQUFBLFVBQ1Y7QUFBQSxRQUNKO0FBQUEsTUFDSixDQUFDO0FBQUEsSUFDTDtBQUFBLElBQ0EsS0FBSztBQUFBLE1BQ0QsU0FBUztBQUFBLFFBQ0wsU0FBUztBQUFBLFVBQ0w7QUFBQSxVQUNBO0FBQUEsUUFDSjtBQUFBLE1BQ0o7QUFBQSxJQUNKO0FBQUE7QUFBQSxJQUVBLE9BQU87QUFBQSxNQUNILGFBQWE7QUFBQSxNQUNiLFFBQVE7QUFBQSxNQUNSLFFBQVE7QUFBQSxNQUNSLFdBQVcsQ0FBQztBQUFBLE1BQ1osZUFBZTtBQUFBLFFBQ1gsT0FBTztBQUFBLFVBQ0gsU0FBUyxRQUFRLFdBQVcsa0NBQWtDO0FBQUEsVUFDOUQsWUFBWSxRQUFRLFdBQVcsd0NBQXdDO0FBQUEsVUFDdkUsT0FBTyxRQUFRLFdBQVcsK0JBQStCO0FBQUEsVUFDekQsU0FBUyxRQUFRLFdBQVcsbUNBQW1DO0FBQUEsVUFDL0Qsc0JBQXNCLFFBQVEsV0FBVyxtREFBbUQ7QUFBQSxVQUM1RiwwQkFBMEIsUUFBUSxXQUFXLGlEQUFpRDtBQUFBO0FBQUE7QUFBQTtBQUFBLFFBSWxHO0FBQUEsUUFDQSxRQUFRO0FBQUEsVUFDSixnQkFBZ0I7QUFBQSxVQUNoQixnQkFBZ0I7QUFBQSxVQUNoQixnQkFBZ0I7QUFBQSxVQUNoQixjQUFjO0FBQUE7QUFBQSxRQUNsQjtBQUFBLFFBQ0EseUJBQXlCO0FBQUE7QUFBQSxNQUM3QjtBQUFBLElBQ0o7QUFBQSxJQUNBLFNBQVM7QUFBQSxNQUNMLE9BQU87QUFBQSxRQUNILEtBQUssUUFBUSxXQUFXLE9BQU87QUFBQSxRQUMvQixlQUFlLFFBQVEsV0FBVyxrQkFBa0I7QUFBQSxNQUN4RDtBQUFBLElBQ0o7QUFBQTtBQUFBLElBRUEsY0FBYztBQUFBLE1BQ1YsU0FBUyxDQUFDLFNBQVMsV0FBVztBQUFBLElBQ2xDO0FBQUEsSUFDQSxRQUFRO0FBQUE7QUFBQSxNQUVKLHdCQUF3QixLQUFLLFVBQVUsSUFBSTtBQUFBLE1BQzNDLDRCQUE0QixLQUFLLFVBQVUsTUFBTTtBQUFBLE1BQ2pELDBCQUEwQixLQUFLLFVBQVUsS0FBSztBQUFBLE1BQzlDLGdDQUFnQyxLQUFLLFVBQVUsVUFBVTtBQUFBLElBQzdEO0FBQUEsSUFDQSxRQUFRO0FBQUEsTUFDSixLQUFLO0FBQUE7QUFBQSxRQUVELE1BQU07QUFBQSxNQUNWO0FBQUEsSUFDSjtBQUFBLEVBQ0o7QUFDSixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=

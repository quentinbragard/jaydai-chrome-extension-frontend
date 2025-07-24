// vite.config.ts
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { defineConfig, loadEnv } from "file:///Users/quentinbragard/archimind/jaydai-chrome-extension-frontend/node_modules/.pnpm/vite@5.4.19_@types+node@20.19.4_lightningcss@1.30.1/node_modules/vite/dist/node/index.js";
import react from "file:///Users/quentinbragard/archimind/jaydai-chrome-extension-frontend/node_modules/.pnpm/@vitejs+plugin-react@4.6.0_vite@5.4.19_@types+node@20.19.4_lightningcss@1.30.1_/node_modules/@vitejs/plugin-react/dist/index.mjs";
import replace from "file:///Users/quentinbragard/archimind/jaydai-chrome-extension-frontend/node_modules/.pnpm/@rollup+plugin-replace@6.0.2_rollup@4.44.2/node_modules/@rollup/plugin-replace/dist/es/index.js";
import tailwindcss from "file:///Users/quentinbragard/archimind/jaydai-chrome-extension-frontend/node_modules/.pnpm/tailwindcss@3.4.17/node_modules/tailwindcss/lib/index.js";
import autoprefixer from "file:///Users/quentinbragard/archimind/jaydai-chrome-extension-frontend/node_modules/.pnpm/autoprefixer@10.4.21_postcss@8.5.6/node_modules/autoprefixer/lib/autoprefixer.js";
import { viteStaticCopy } from "file:///Users/quentinbragard/archimind/jaydai-chrome-extension-frontend/node_modules/.pnpm/vite-plugin-static-copy@1.0.6_vite@5.4.19_@types+node@20.19.4_lightningcss@1.30.1_/node_modules/vite-plugin-static-copy/dist/index.js";
import cssInjectedByJs from "file:///Users/quentinbragard/archimind/jaydai-chrome-extension-frontend/node_modules/.pnpm/vite-plugin-css-injected-by-js@3.5.2_vite@5.4.19_@types+node@20.19.4_lightningcss@1.30.1_/node_modules/vite-plugin-css-injected-by-js/dist/esm/index.js";
import tsconfigPaths from "file:///Users/quentinbragard/archimind/jaydai-chrome-extension-frontend/node_modules/.pnpm/vite-tsconfig-paths@5.1.4_typescript@5.8.3_vite@5.4.19_@types+node@20.19.4_lightningcss@1.30.1_/node_modules/vite-tsconfig-paths/dist/index.js";
var __vite_injected_original_import_meta_url = "file:///Users/quentinbragard/archimind/jaydai-chrome-extension-frontend/vite.config.ts";
var __filename = fileURLToPath(__vite_injected_original_import_meta_url);
var __dirname = dirname(__filename);
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const isProduction = mode === "production";
  const apiUrl = env.VITE_API_URL;
  const debug = env.VITE_DEBUG;
  const appVersion = env.VITE_APP_VERSION;
  console.log(`\u{1F680} Building for ${mode} environment`);
  console.log(`\u{1F50C} API URL: ${apiUrl}`);
  console.log(`\u{1F41E} Debug: ${debug}`);
  console.log(`\u{1F4E6} Version: ${appVersion}`);
  console.log(`\u{1F4B3} Stripe: ${env.VITE_STRIPE_PUBLISHABLE_KEY ? "Configured" : "Not configured"}`);
  return {
    plugins: [
      react(),
      replace({
        // Remove the exact URL that caused Chrome Store rejection
        "https://cdn.amplitude.com/libs/visual-tagging-selector-1.0.0-alpha.js.gz": "",
        // Also remove any other potential Amplitude CDN URLs
        "https://cdn.amplitude.com/libs/visual-tagging-selector-1.0.0-alpha.js": "",
        "https://sr-client-cfg.amplitude.com/config": "",
        // Prevent assignment issues
        preventAssignment: true,
        // Apply to all file types
        delimiters: ["", ""]
      }),
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
      "process.env.VITE_API_URL": JSON.stringify(env.VITE_API_URL),
      "process.env.VITE_DEBUG": JSON.stringify(env.VITE_DEBUG),
      "process.env.VITE_APP_VERSION": JSON.stringify(env.VITE_APP_VERSION),
      "process.env.VITE_AMPLITUDE_API_KEY": JSON.stringify(env.VITE_AMPLITUDE_API_KEY),
      "process.env.VITE_LINKEDIN_CLIENT_ID": JSON.stringify(env.VITE_LINKEDIN_CLIENT_ID),
      // Stripe environment variables
      "process.env.VITE_STRIPE_PUBLISHABLE_KEY": JSON.stringify(env.VITE_STRIPE_PUBLISHABLE_KEY),
      "process.env.VITE_STRIPE_PLUS_MONTHLY_PRICE_ID": JSON.stringify(env.VITE_STRIPE_PLUS_MONTHLY_PRICE_ID),
      "process.env.VITE_STRIPE_PLUS_YEARLY_PRICE_ID": JSON.stringify(env.VITE_STRIPE_PLUS_YEARLY_PRICE_ID),
      "process.env.VITE_STRIPE_SUCCESS_URL": JSON.stringify(env.VITE_STRIPE_SUCCESS_URL),
      "process.env.VITE_STRIPE_CANCEL_URL": JSON.stringify(env.VITE_STRIPE_CANCEL_URL)
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvcXVlbnRpbmJyYWdhcmQvYXJjaGltaW5kL2pheWRhaS1jaHJvbWUtZXh0ZW5zaW9uLWZyb250ZW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvcXVlbnRpbmJyYWdhcmQvYXJjaGltaW5kL2pheWRhaS1jaHJvbWUtZXh0ZW5zaW9uLWZyb250ZW5kL3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9xdWVudGluYnJhZ2FyZC9hcmNoaW1pbmQvamF5ZGFpLWNocm9tZS1leHRlbnNpb24tZnJvbnRlbmQvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkaXJuYW1lLCByZXNvbHZlIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBmaWxlVVJMVG9QYXRoIH0gZnJvbSAndXJsJztcbmltcG9ydCB7IGRlZmluZUNvbmZpZywgbG9hZEVudiB9IGZyb20gJ3ZpdGUnO1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0JztcbmltcG9ydCByZXBsYWNlIGZyb20gJ0Byb2xsdXAvcGx1Z2luLXJlcGxhY2UnO1xuaW1wb3J0IHRhaWx3aW5kY3NzIGZyb20gJ3RhaWx3aW5kY3NzJztcbmltcG9ydCBhdXRvcHJlZml4ZXIgZnJvbSAnYXV0b3ByZWZpeGVyJztcbmltcG9ydCB7IHZpdGVTdGF0aWNDb3B5IH0gZnJvbSAndml0ZS1wbHVnaW4tc3RhdGljLWNvcHknO1xuaW1wb3J0IGNzc0luamVjdGVkQnlKcyBmcm9tICd2aXRlLXBsdWdpbi1jc3MtaW5qZWN0ZWQtYnktanMnO1xuaW1wb3J0IHRzY29uZmlnUGF0aHMgZnJvbSAndml0ZS10c2NvbmZpZy1wYXRocyc7XG5cbi8vIENyZWF0ZSBfX2Rpcm5hbWUgZXF1aXZhbGVudCBmb3IgRVMgbW9kdWxlc1xuY29uc3QgX19maWxlbmFtZSA9IGZpbGVVUkxUb1BhdGgoaW1wb3J0Lm1ldGEudXJsKTtcbmNvbnN0IF9fZGlybmFtZSA9IGRpcm5hbWUoX19maWxlbmFtZSk7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+IHtcbiAgICAvLyBMb2FkIGVudmlyb25tZW50IHZhcmlhYmxlcyBmcm9tIC5lbnYgZmlsZXNcbiAgICAvLyBtb2RlIGNhbiBiZSAnZGV2ZWxvcG1lbnQnIG9yICdwcm9kdWN0aW9uJ1xuICAgIGNvbnN0IGVudiA9IGxvYWRFbnYobW9kZSwgcHJvY2Vzcy5jd2QoKSwgJ1ZJVEVfJyk7XG4gICAgXG4gICAgY29uc3QgaXNQcm9kdWN0aW9uID0gbW9kZSA9PT0gJ3Byb2R1Y3Rpb24nO1xuICAgIFxuICAgIC8vIEdldCB0aGUgQVBJIFVSTCBmcm9tIGVudlxuICAgIGNvbnN0IGFwaVVybCA9IGVudi5WSVRFX0FQSV9VUkw7XG4gICAgXG4gICAgLy8gR2V0IGRlYnVnIHNldHRpbmcgZnJvbSBlbnZcbiAgICBjb25zdCBkZWJ1ZyA9IGVudi5WSVRFX0RFQlVHO1xuICAgIFxuICAgIC8vIEdldCBhcHAgdmVyc2lvbiBmcm9tIGVudlxuICAgIGNvbnN0IGFwcFZlcnNpb24gPSBlbnYuVklURV9BUFBfVkVSU0lPTjtcbiAgICBcbiAgICBjb25zb2xlLmxvZyhgXHVEODNEXHVERTgwIEJ1aWxkaW5nIGZvciAke21vZGV9IGVudmlyb25tZW50YCk7XG4gICAgY29uc29sZS5sb2coYFx1RDgzRFx1REQwQyBBUEkgVVJMOiAke2FwaVVybH1gKTtcbiAgICBjb25zb2xlLmxvZyhgXHVEODNEXHVEQzFFIERlYnVnOiAke2RlYnVnfWApO1xuICAgIGNvbnNvbGUubG9nKGBcdUQ4M0RcdURDRTYgVmVyc2lvbjogJHthcHBWZXJzaW9ufWApO1xuICAgIGNvbnNvbGUubG9nKGBcdUQ4M0RcdURDQjMgU3RyaXBlOiAke2Vudi5WSVRFX1NUUklQRV9QVUJMSVNIQUJMRV9LRVkgPyAnQ29uZmlndXJlZCcgOiAnTm90IGNvbmZpZ3VyZWQnfWApO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcGx1Z2luczogW1xuICAgICAgICAgICAgcmVhY3QoKSxcbiAgICAgICAgICAgIHJlcGxhY2Uoe1xuICAgICAgICAgICAgICAgIC8vIFJlbW92ZSB0aGUgZXhhY3QgVVJMIHRoYXQgY2F1c2VkIENocm9tZSBTdG9yZSByZWplY3Rpb25cbiAgICAgICAgICAgICAgICBcImh0dHBzOi8vY2RuLmFtcGxpdHVkZS5jb20vbGlicy92aXN1YWwtdGFnZ2luZy1zZWxlY3Rvci0xLjAuMC1hbHBoYS5qcy5nelwiOiBcIlwiLFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIEFsc28gcmVtb3ZlIGFueSBvdGhlciBwb3RlbnRpYWwgQW1wbGl0dWRlIENETiBVUkxzXG4gICAgICAgICAgICAgICAgXCJodHRwczovL2Nkbi5hbXBsaXR1ZGUuY29tL2xpYnMvdmlzdWFsLXRhZ2dpbmctc2VsZWN0b3ItMS4wLjAtYWxwaGEuanNcIjogXCJcIixcbiAgICAgICAgICAgICAgICBcImh0dHBzOi8vc3ItY2xpZW50LWNmZy5hbXBsaXR1ZGUuY29tL2NvbmZpZ1wiOiBcIlwiLFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIFByZXZlbnQgYXNzaWdubWVudCBpc3N1ZXNcbiAgICAgICAgICAgICAgICBwcmV2ZW50QXNzaWdubWVudDogdHJ1ZSxcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyBBcHBseSB0byBhbGwgZmlsZSB0eXBlc1xuICAgICAgICAgICAgICAgIGRlbGltaXRlcnM6IFsnJywgJyddXG4gICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgdHNjb25maWdQYXRocygpLCAvLyBBZGQgdGhpcyB0byByZXNvbHZlIHBhdGggYWxpYXNlcyBjb3JyZWN0bHlcbiAgICAgICAgICAgIGNzc0luamVjdGVkQnlKcygpLFxuICAgICAgICAgICAgdml0ZVN0YXRpY0NvcHkoe1xuICAgICAgICAgICAgICAgIHRhcmdldHM6IFtcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3JjOiAncHVibGljLyonLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGVzdDogJydcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgLy8gQ29weSBIVE1MIGZpbGVzIGZyb20gdGhlaXIgc291cmNlIGxvY2F0aW9ucyB0byB0aGUgZGlzdCBmb2xkZXJcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3JjOiAnc3JjL2V4dGVuc2lvbi9wb3B1cC9wb3B1cC5odG1sJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc3Q6ICcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVuYW1lOiAncG9wdXAuaHRtbCdcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3JjOiAnc3JjL2V4dGVuc2lvbi93ZWxjb21lL3dlbGNvbWUuaHRtbCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXN0OiAnJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbmFtZTogJ3dlbGNvbWUuaHRtbCdcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3JjOiAnX2xvY2FsZXMnLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGVzdDogJydcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgIH0pXG4gICAgICAgIF0sXG4gICAgICAgIGNzczoge1xuICAgICAgICAgICAgcG9zdGNzczoge1xuICAgICAgICAgICAgICAgIHBsdWdpbnM6IFtcbiAgICAgICAgICAgICAgICAgICAgdGFpbHdpbmRjc3MsXG4gICAgICAgICAgICAgICAgICAgIGF1dG9wcmVmaXhlcixcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgLy8gUHJldmVudCBjb2RlIHNwbGl0dGluZyBmb3IgZXh0ZW5zaW9uIGVudHJ5IHBvaW50c1xuICAgICAgICBidWlsZDoge1xuICAgICAgICAgICAgZW1wdHlPdXREaXI6IHRydWUsXG4gICAgICAgICAgICBvdXREaXI6ICdkaXN0JyxcbiAgICAgICAgICAgIG1pbmlmeTogaXNQcm9kdWN0aW9uLFxuICAgICAgICAgICAgc291cmNlbWFwOiAhaXNQcm9kdWN0aW9uLFxuICAgICAgICAgICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgICAgICAgICAgIGlucHV0OiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IHJlc29sdmUoX19kaXJuYW1lLCAnc3JjL2V4dGVuc2lvbi9jb250ZW50L2NvbnRlbnQuanMnKSxcbiAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZDogcmVzb2x2ZShfX2Rpcm5hbWUsICdzcmMvZXh0ZW5zaW9uL2JhY2tncm91bmQvYmFja2dyb3VuZC5qcycpLFxuICAgICAgICAgICAgICAgICAgICBwb3B1cDogcmVzb2x2ZShfX2Rpcm5hbWUsICdzcmMvZXh0ZW5zaW9uL3BvcHVwL3BvcHVwLnRzeCcpLFxuICAgICAgICAgICAgICAgICAgICB3ZWxjb21lOiByZXNvbHZlKF9fZGlybmFtZSwgJ3NyYy9leHRlbnNpb24vd2VsY29tZS93ZWxjb21lLnRzeCcpLFxuICAgICAgICAgICAgICAgICAgICAnbmV0d29ya0ludGVyY2VwdG9yJzogcmVzb2x2ZShfX2Rpcm5hbWUsICdzcmMvZXh0ZW5zaW9uL2NvbnRlbnQvbmV0d29ya0ludGVyY2VwdG9yL2luZGV4LmpzJyksXG4gICAgICAgICAgICAgICAgICAgICdhcHBsaWNhdGlvbkluaXRpYWxpemVyJzogcmVzb2x2ZShfX2Rpcm5hbWUsICdzcmMvZXh0ZW5zaW9uL2NvbnRlbnQvYXBwbGljYXRpb25Jbml0aWFsaXplci50cycpLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgb3V0cHV0OiB7XG4gICAgICAgICAgICAgICAgICAgIGVudHJ5RmlsZU5hbWVzOiAnW25hbWVdLmpzJyxcbiAgICAgICAgICAgICAgICAgICAgY2h1bmtGaWxlTmFtZXM6ICdhc3NldHMvW25hbWVdLltoYXNoXS5qcycsXG4gICAgICAgICAgICAgICAgICAgIGFzc2V0RmlsZU5hbWVzOiAnYXNzZXRzL1tuYW1lXS5bZXh0XScsXG4gICAgICAgICAgICAgICAgICAgIG1hbnVhbENodW5rczogdW5kZWZpbmVkIC8vIERpc2FibGUgY2h1bmsgb3B0aW1pemF0aW9uIGZvciBleHRlbnNpb24gZW50cnkgcG9pbnRzXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBwcmVzZXJ2ZUVudHJ5U2lnbmF0dXJlczogJ3N0cmljdCcgLy8gSGVscHMgcHJldmVudCB0cmVlLXNoYWtpbmcgb2YgZXhwb3J0c1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgICAgICBhbGlhczoge1xuICAgICAgICAgICAgICAgICdAJzogcmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYycpLFxuICAgICAgICAgICAgICAgICdAY29tcG9uZW50cyc6IHJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMvY29tcG9uZW50cycpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIC8vIEltcHJvdmUgaGFuZGxpbmcgb2YgZXh0ZXJuYWwgZGVwZW5kZW5jaWVzXG4gICAgICAgIG9wdGltaXplRGVwczoge1xuICAgICAgICAgICAgaW5jbHVkZTogWydyZWFjdCcsICdyZWFjdC1kb20nXVxuICAgICAgICB9LFxuICAgICAgICBkZWZpbmU6IHtcbiAgICAgICAgICAgIC8vIE1ha2UgZW52aXJvbm1lbnQgdmFyaWFibGVzIGF2YWlsYWJsZSBpbiB0aGUgY29kZVxuICAgICAgICAgICAgJ3Byb2Nlc3MuZW52Lk5PREVfRU5WJzogSlNPTi5zdHJpbmdpZnkobW9kZSksXG4gICAgICAgICAgICAncHJvY2Vzcy5lbnYuVklURV9BUElfVVJMJzogSlNPTi5zdHJpbmdpZnkoZW52LlZJVEVfQVBJX1VSTCksXG4gICAgICAgICAgICAncHJvY2Vzcy5lbnYuVklURV9ERUJVRyc6IEpTT04uc3RyaW5naWZ5KGVudi5WSVRFX0RFQlVHKSxcbiAgICAgICAgICAgICdwcm9jZXNzLmVudi5WSVRFX0FQUF9WRVJTSU9OJzogSlNPTi5zdHJpbmdpZnkoZW52LlZJVEVfQVBQX1ZFUlNJT04pLFxuICAgICAgICAgICAgJ3Byb2Nlc3MuZW52LlZJVEVfQU1QTElUVURFX0FQSV9LRVknOiBKU09OLnN0cmluZ2lmeShlbnYuVklURV9BTVBMSVRVREVfQVBJX0tFWSksXG4gICAgICAgICAgICAncHJvY2Vzcy5lbnYuVklURV9MSU5LRURJTl9DTElFTlRfSUQnOiBKU09OLnN0cmluZ2lmeShlbnYuVklURV9MSU5LRURJTl9DTElFTlRfSUQpLFxuICAgICAgICAgICAgLy8gU3RyaXBlIGVudmlyb25tZW50IHZhcmlhYmxlc1xuICAgICAgICAgICAgJ3Byb2Nlc3MuZW52LlZJVEVfU1RSSVBFX1BVQkxJU0hBQkxFX0tFWSc6IEpTT04uc3RyaW5naWZ5KGVudi5WSVRFX1NUUklQRV9QVUJMSVNIQUJMRV9LRVkpLFxuICAgICAgICAgICAgJ3Byb2Nlc3MuZW52LlZJVEVfU1RSSVBFX1BMVVNfTU9OVEhMWV9QUklDRV9JRCc6IEpTT04uc3RyaW5naWZ5KGVudi5WSVRFX1NUUklQRV9QTFVTX01PTlRITFlfUFJJQ0VfSUQpLFxuICAgICAgICAgICAgJ3Byb2Nlc3MuZW52LlZJVEVfU1RSSVBFX1BMVVNfWUVBUkxZX1BSSUNFX0lEJzogSlNPTi5zdHJpbmdpZnkoZW52LlZJVEVfU1RSSVBFX1BMVVNfWUVBUkxZX1BSSUNFX0lEKSxcbiAgICAgICAgICAgICdwcm9jZXNzLmVudi5WSVRFX1NUUklQRV9TVUNDRVNTX1VSTCc6IEpTT04uc3RyaW5naWZ5KGVudi5WSVRFX1NUUklQRV9TVUNDRVNTX1VSTCksXG4gICAgICAgICAgICAncHJvY2Vzcy5lbnYuVklURV9TVFJJUEVfQ0FOQ0VMX1VSTCc6IEpTT04uc3RyaW5naWZ5KGVudi5WSVRFX1NUUklQRV9DQU5DRUxfVVJMKVxuICAgICAgICB9LFxuICAgICAgICBzZXJ2ZXI6IHtcbiAgICAgICAgICAgIGhtcjoge1xuICAgICAgICAgICAgICAgIC8vIFRoaXMgaGVscHMgd2l0aCBITVIgd2hlbiBkZXZlbG9waW5nXG4gICAgICAgICAgICAgICAgcG9ydDogMzAwMFxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbn0pOyJdLAogICJtYXBwaW5ncyI6ICI7QUFBa1gsU0FBUyxTQUFTLGVBQWU7QUFDblosU0FBUyxxQkFBcUI7QUFDOUIsU0FBUyxjQUFjLGVBQWU7QUFDdEMsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sYUFBYTtBQUNwQixPQUFPLGlCQUFpQjtBQUN4QixPQUFPLGtCQUFrQjtBQUN6QixTQUFTLHNCQUFzQjtBQUMvQixPQUFPLHFCQUFxQjtBQUM1QixPQUFPLG1CQUFtQjtBQVQ4TSxJQUFNLDJDQUEyQztBQVl6UixJQUFNLGFBQWEsY0FBYyx3Q0FBZTtBQUNoRCxJQUFNLFlBQVksUUFBUSxVQUFVO0FBRXBDLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxNQUFNO0FBR3RDLFFBQU0sTUFBTSxRQUFRLE1BQU0sUUFBUSxJQUFJLEdBQUcsT0FBTztBQUVoRCxRQUFNLGVBQWUsU0FBUztBQUc5QixRQUFNLFNBQVMsSUFBSTtBQUduQixRQUFNLFFBQVEsSUFBSTtBQUdsQixRQUFNLGFBQWEsSUFBSTtBQUV2QixVQUFRLElBQUksMEJBQW1CLElBQUksY0FBYztBQUNqRCxVQUFRLElBQUksc0JBQWUsTUFBTSxFQUFFO0FBQ25DLFVBQVEsSUFBSSxvQkFBYSxLQUFLLEVBQUU7QUFDaEMsVUFBUSxJQUFJLHNCQUFlLFVBQVUsRUFBRTtBQUN2QyxVQUFRLElBQUkscUJBQWMsSUFBSSw4QkFBOEIsZUFBZSxnQkFBZ0IsRUFBRTtBQUU3RixTQUFPO0FBQUEsSUFDSCxTQUFTO0FBQUEsTUFDTCxNQUFNO0FBQUEsTUFDTixRQUFRO0FBQUE7QUFBQSxRQUVKLDRFQUE0RTtBQUFBO0FBQUEsUUFHNUUseUVBQXlFO0FBQUEsUUFDekUsOENBQThDO0FBQUE7QUFBQSxRQUc5QyxtQkFBbUI7QUFBQTtBQUFBLFFBR25CLFlBQVksQ0FBQyxJQUFJLEVBQUU7QUFBQSxNQUNyQixDQUFDO0FBQUEsTUFDSCxjQUFjO0FBQUE7QUFBQSxNQUNkLGdCQUFnQjtBQUFBLE1BQ2hCLGVBQWU7QUFBQSxRQUNYLFNBQVM7QUFBQSxVQUNMO0FBQUEsWUFDSSxLQUFLO0FBQUEsWUFDTCxNQUFNO0FBQUEsVUFDVjtBQUFBO0FBQUEsVUFFQTtBQUFBLFlBQ0ksS0FBSztBQUFBLFlBQ0wsTUFBTTtBQUFBLFlBQ04sUUFBUTtBQUFBLFVBQ1o7QUFBQSxVQUNBO0FBQUEsWUFDSSxLQUFLO0FBQUEsWUFDTCxNQUFNO0FBQUEsWUFDTixRQUFRO0FBQUEsVUFDWjtBQUFBLFVBQ0E7QUFBQSxZQUNJLEtBQUs7QUFBQSxZQUNMLE1BQU07QUFBQSxVQUNWO0FBQUEsUUFDSjtBQUFBLE1BQ0osQ0FBQztBQUFBLElBQ0w7QUFBQSxJQUNBLEtBQUs7QUFBQSxNQUNELFNBQVM7QUFBQSxRQUNMLFNBQVM7QUFBQSxVQUNMO0FBQUEsVUFDQTtBQUFBLFFBQ0o7QUFBQSxNQUNKO0FBQUEsSUFDSjtBQUFBO0FBQUEsSUFFQSxPQUFPO0FBQUEsTUFDSCxhQUFhO0FBQUEsTUFDYixRQUFRO0FBQUEsTUFDUixRQUFRO0FBQUEsTUFDUixXQUFXLENBQUM7QUFBQSxNQUNaLGVBQWU7QUFBQSxRQUNYLE9BQU87QUFBQSxVQUNILFNBQVMsUUFBUSxXQUFXLGtDQUFrQztBQUFBLFVBQzlELFlBQVksUUFBUSxXQUFXLHdDQUF3QztBQUFBLFVBQ3ZFLE9BQU8sUUFBUSxXQUFXLCtCQUErQjtBQUFBLFVBQ3pELFNBQVMsUUFBUSxXQUFXLG1DQUFtQztBQUFBLFVBQy9ELHNCQUFzQixRQUFRLFdBQVcsbURBQW1EO0FBQUEsVUFDNUYsMEJBQTBCLFFBQVEsV0FBVyxpREFBaUQ7QUFBQSxRQUNsRztBQUFBLFFBQ0EsUUFBUTtBQUFBLFVBQ0osZ0JBQWdCO0FBQUEsVUFDaEIsZ0JBQWdCO0FBQUEsVUFDaEIsZ0JBQWdCO0FBQUEsVUFDaEIsY0FBYztBQUFBO0FBQUEsUUFDbEI7QUFBQSxRQUNBLHlCQUF5QjtBQUFBO0FBQUEsTUFDN0I7QUFBQSxJQUNKO0FBQUEsSUFDQSxTQUFTO0FBQUEsTUFDTCxPQUFPO0FBQUEsUUFDSCxLQUFLLFFBQVEsV0FBVyxPQUFPO0FBQUEsUUFDL0IsZUFBZSxRQUFRLFdBQVcsa0JBQWtCO0FBQUEsTUFDeEQ7QUFBQSxJQUNKO0FBQUE7QUFBQSxJQUVBLGNBQWM7QUFBQSxNQUNWLFNBQVMsQ0FBQyxTQUFTLFdBQVc7QUFBQSxJQUNsQztBQUFBLElBQ0EsUUFBUTtBQUFBO0FBQUEsTUFFSix3QkFBd0IsS0FBSyxVQUFVLElBQUk7QUFBQSxNQUMzQyw0QkFBNEIsS0FBSyxVQUFVLElBQUksWUFBWTtBQUFBLE1BQzNELDBCQUEwQixLQUFLLFVBQVUsSUFBSSxVQUFVO0FBQUEsTUFDdkQsZ0NBQWdDLEtBQUssVUFBVSxJQUFJLGdCQUFnQjtBQUFBLE1BQ25FLHNDQUFzQyxLQUFLLFVBQVUsSUFBSSxzQkFBc0I7QUFBQSxNQUMvRSx1Q0FBdUMsS0FBSyxVQUFVLElBQUksdUJBQXVCO0FBQUE7QUFBQSxNQUVqRiwyQ0FBMkMsS0FBSyxVQUFVLElBQUksMkJBQTJCO0FBQUEsTUFDekYsaURBQWlELEtBQUssVUFBVSxJQUFJLGlDQUFpQztBQUFBLE1BQ3JHLGdEQUFnRCxLQUFLLFVBQVUsSUFBSSxnQ0FBZ0M7QUFBQSxNQUNuRyx1Q0FBdUMsS0FBSyxVQUFVLElBQUksdUJBQXVCO0FBQUEsTUFDakYsc0NBQXNDLEtBQUssVUFBVSxJQUFJLHNCQUFzQjtBQUFBLElBQ25GO0FBQUEsSUFDQSxRQUFRO0FBQUEsTUFDSixLQUFLO0FBQUE7QUFBQSxRQUVELE1BQU07QUFBQSxNQUNWO0FBQUEsSUFDSjtBQUFBLEVBQ0o7QUFDSixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=

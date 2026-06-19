import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Client-side SPA. Build output (dist/) is served by the Cloudflare assets-only Worker.
// vite-plugin-pwa (generateSW) globs the real hashed bundle at build time, so the precache
// manifest is always correct — unlike the old hand-rolled sw.js that hardcoded /app.js & /styles.css.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: false, // keep the existing public/manifest.webmanifest verbatim
      includeAssets: ["icon.svg", "favicon.ico", "apple-touch-icon.png", "fonts/**/*.woff2", "img/**/*"],
      workbox: {
        globPatterns: ["**/*.{js,css,html,woff2,svg,png,jpg,jpeg,webp,webmanifest,ico}"],
        navigateFallback: "/index.html",
        // A missing hashed asset must 404, not decode as HTML (the guard the old SW had).
        navigateFallbackDenylist: [/^\/assets\//],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
});

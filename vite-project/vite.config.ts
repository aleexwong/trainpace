import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { vitePrerenderPlugin } from "vite-prerender-plugin";

import { getAllSeoPaths } from "./src/features/seo-pages/seoPages";

// Prerendered routes for SEO
const prerenderedRoutes = [
  "/",
  "/calculator",
  "/fuel",
  "/elevationfinder",
  "/race",
  // Programmatic SEO routes
  ...getAllSeoPaths(),
  "/preview-route/boston",
  "/preview-route/nyc",
  "/preview-route/chicago",
  "/preview-route/berlin",
  "/preview-route/london",
  "/preview-route/tokyo",
  "/preview-route/sydney",
  // Blog routes
  "/blog",
  "/blog/understanding-vdot-training-paces",
  "/blog/marathon-fueling-complete-guide",
  "/blog/elevation-impact-race-strategy",
  "/blog/beginner-marathon-training-tips",
  "/blog/recovery-strategies-for-runners",
  "/blog/tempo-runs-explained",
  "/blog/running-shoes-guide",
  "/blog/half-marathon-pacing-strategy",
  "/blog/strength-training-for-runners",
  "/blog/taper-marathon-guide",
];

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    svgr(),
    vitePrerenderPlugin({
      renderTarget: "#root",
      prerenderScript: path.resolve(__dirname, "prerender.jsx"),
      additionalPrerenderRoutes: prerenderedRoutes,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    port: 5173,
  },
  ssr: {
    noExternal: ["leaflet"],
  },
  define: {
    global: "globalThis",
  },
});

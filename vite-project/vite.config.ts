import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { vitePrerenderPlugin } from "vite-prerender-plugin";

// Prerendered routes for SEO
const prerenderedRoutes = [
  "/",
  "/calculator",
  "/fuel",
  "/elevationfinder",
  "/preview-route/boston",
  "/preview-route/nyc",
  "/preview-route/chicago",
  "/preview-route/berlin",
  "/preview-route/london",
  "/preview-route/tokyo",
  "/preview-route/sydney",
  // Blog routes (manual posts)
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
  // pSEO: Race-specific training guides
  "/blog/boston-marathon-training-guide",
  "/blog/nyc-marathon-training-guide",
  "/blog/chicago-marathon-training-guide",
  "/blog/london-marathon-training-guide",
  "/blog/berlin-marathon-training-guide",
  "/blog/tokyo-marathon-training-guide",
  "/blog/sydney-marathon-training-guide",
  // pSEO: Marathon time goals
  "/blog/sub-5-00-marathon-training-guide",
  "/blog/sub-4-30-marathon-training-guide",
  "/blog/sub-4-00-marathon-training-guide",
  "/blog/sub-3-45-marathon-training-guide",
  "/blog/sub-3-30-marathon-training-guide",
  "/blog/sub-3-15-marathon-training-guide",
  "/blog/sub-3-00-marathon-training-guide",
  "/blog/sub-2-45-marathon-training-guide",
  // pSEO: Half marathon time goals
  "/blog/sub-2-30-half-marathon-training-guide",
  "/blog/sub-2-15-half-marathon-training-guide",
  "/blog/sub-2-00-half-marathon-training-guide",
  "/blog/sub-1-45-half-marathon-training-guide",
  "/blog/sub-1-30-half-marathon-training-guide",
  "/blog/sub-1-20-half-marathon-training-guide",
  // pSEO: 10K time goals
  "/blog/sub-60-00-10k-training-guide",
  "/blog/sub-55-00-10k-training-guide",
  "/blog/sub-50-00-10k-training-guide",
  "/blog/sub-45-00-10k-training-guide",
  "/blog/sub-40-00-10k-training-guide",
  "/blog/sub-35-00-10k-training-guide",
  // pSEO: 5K time goals
  "/blog/sub-30-00-5k-training-guide",
  "/blog/sub-25-00-5k-training-guide",
  "/blog/sub-22-00-5k-training-guide",
  "/blog/sub-20-00-5k-training-guide",
  "/blog/sub-18-00-5k-training-guide",
  "/blog/sub-16-00-5k-training-guide",
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

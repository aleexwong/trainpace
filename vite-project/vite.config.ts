import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { vitePrerenderPlugin } from "vite-prerender-plugin";

// Prerendered routes for SEO
const prerenderedRoutes = [
  // Core pages
  "/",
  "/calculator",
  "/fuel",
  "/elevationfinder",
  "/faq",
  "/about",
  // Marathon course previews (programmatic SEO)
  "/preview-route/boston",
  "/preview-route/nyc",
  "/preview-route/chicago",
  "/preview-route/berlin",
  "/preview-route/london",
  "/preview-route/tokyo",
  // Race distance guides (programmatic SEO)
  "/guide/5k",
  "/guide/10k",
  "/guide/half-marathon",
  "/guide/marathon",
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

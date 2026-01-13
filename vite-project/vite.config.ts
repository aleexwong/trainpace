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
  // World Marathon Majors
  "/preview-route/boston",
  "/preview-route/nyc",
  "/preview-route/chicago",
  "/preview-route/berlin",
  "/preview-route/london",
  "/preview-route/tokyo",
  "/preview-route/sydney",
  // US Popular Marathons
  "/preview-route/la",
  "/preview-route/marinecorps",
  "/preview-route/bigsur",
  "/preview-route/philadelphia",
  "/preview-route/houston",
  "/preview-route/twincities",
  "/preview-route/grandmas",
  "/preview-route/disney",
  "/preview-route/portland",
  // European Marathons
  "/preview-route/paris",
  "/preview-route/amsterdam",
  "/preview-route/valencia",
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

import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { vitePrerenderPlugin } from "vite-prerender-plugin";

import { getAllSeoPaths } from "./src/features/seo-pages/seoPages";
import blogData from "./src/data/blog-posts.json";

const blogRoutes = blogData.posts.map((post) => `/blog/${post.slug}`);

// Prerendered routes for SEO
const prerenderedRoutes = [
  "/",
  "/calculator",
  "/vdot",
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
  "/preview-route/oslo",
  // Blog routes
  "/blog",
  ...blogRoutes,
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
  build: {
    minify: "esbuild",
  },
  esbuild: {
    drop: process.env.NODE_ENV === "production" ? ["console", "debugger"] : [],
  },
  define: {
    global: "globalThis",
  },
});

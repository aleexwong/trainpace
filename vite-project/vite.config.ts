import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { vitePrerenderPlugin } from "vite-prerender-plugin";

import { getAllDocPaths } from "./src/lib/llm/page-docs";

// Prerendered routes for SEO. Shared with the Markdown mirror generator
// (scripts/generateMarkdown.ts) so every prerendered page has a .md twin and
// neither list can drift from the other — add new routes in getAllDocPaths().
const prerenderedRoutes = getAllDocPaths();

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
  build: {
    minify: "esbuild",
    rollupOptions: {
      output: {
        // vite-prerender-plugin adds prerender.jsx as a second Rollup entry in
        // the *client* build. Any module shared by that entry and the app
        // (React, blog-posts.json, ...) is then hoisted into a chunk named
        // after the prerender entry, so every visitor downloads and preloads
        // the build-only chunk (with react-dom/server inside it). Pinning the
        // shared modules to explicit chunks keeps the client graph free of it.
        manualChunks(id) {
          if (
            /node_modules\/(react|react-dom|scheduler)\//.test(id) &&
            !id.includes("react-dom/server")
          ) {
            return "react-vendor";
          }
          if (id.endsWith("src/data/blog-posts.json")) return "blog-data";
        },
      },
    },
  },
  esbuild: {
    drop: process.env.NODE_ENV === "production" ? ["console", "debugger"] : [],
  },
  define: {
    global: "globalThis",
  },
});

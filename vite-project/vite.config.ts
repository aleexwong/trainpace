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
        // React is shared by the app and prerender.jsx. Left to itself, Rollup
        // puts it in the prerender chunk, so every page in the browser had to
        // download that chunk — and with it all the build-only page copy
        // (page-docs, blog text, race guides). A separate vendor chunk keeps
        // the prerender chunk out of the browser entirely.
        manualChunks(id) {
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) {
            return "react-vendor";
          }
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

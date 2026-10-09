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
        // Without an explicit strategy, Rollup builds one shared chunk for
        // everything the client entry and prerender.jsx have in common. That
        // put react-dom/server and the whole blog corpus into a chunk every
        // page loads, because prerender.jsx is a build input that shares React
        // with the client. Splitting by library keeps server-only and
        // feature-only code out of the common path, and means a change in one
        // library no longer invalidates the cache for all the others.
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            // The blog corpus is ~155KB of JSON imported by both prerender.jsx
            // and the blog feature. Keep it out of the shared chunk so only
            // the blog routes pay for it.
            if (id.includes("data/blog-posts.json")) return "blog-data";
            return undefined;
          }
          // react-dom/server is used ONLY by prerender.jsx at build time.
          // It must never land in a chunk the browser loads.
          if (id.includes("react-dom/server") || id.includes("react-dom-server")) {
            return "server-render";
          }
          if (
            id.includes("/react/") ||
            id.includes("/react-dom/") ||
            id.includes("/react-router") ||
            id.includes("/scheduler/")
          ) {
            return "react";
          }
          if (id.includes("firebase") || id.includes("@firebase")) return "firebase";
          if (id.includes("chart.js") || id.includes("react-chartjs-2")) return "charts";
          // Everything else is left to Rollup. A catch-all "vendor" chunk here
          // produced a circular import between chunks that surfaced as
          // "Cannot access 'B' before initialization" when the prerender entry
          // ran — only split libraries with a demonstrated payoff.
          return undefined;
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

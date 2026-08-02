import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { vitePrerenderPlugin } from "vite-prerender-plugin";

// Prerendered routes come from the same list that generates sitemap.xml, so the
// two can't drift. Add crawlable routes in src/lib/seo/routes.ts, not here.
import { getPrerenderPaths } from "./src/lib/seo/routes";

const prerenderedRoutes = getPrerenderPaths();

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
    rollupOptions: {
      output: {
        // Route-level code splitting alone left Firebase and PostHog in the shared
        // entry chunk (~270 KB gzipped), which every anonymous visitor landing on a
        // prerendered SEO page had to download before hydration — for an auth SDK
        // they may never use. Splitting them out keeps the critical path small; the
        // chunks are still fetched, just in parallel and cacheable independently.
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          if (id.includes("/firebase/") || id.includes("/@firebase/")) {
            return "vendor-firebase";
          }
          if (id.includes("/posthog-js/")) {
            return "vendor-posthog";
          }
          if (id.includes("/chart.js/") || id.includes("/react-chartjs-2/")) {
            return "vendor-charts";
          }
          if (id.includes("/react-markdown/") || id.includes("/remark-") || id.includes("/micromark")) {
            return "vendor-markdown";
          }
          if (
            id.includes("/react/") ||
            id.includes("/react-dom/") ||
            id.includes("/react-router") ||
            id.includes("/scheduler/")
          ) {
            return "vendor-react";
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

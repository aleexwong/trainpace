import { defineConfig, type Plugin } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { vitePrerenderPlugin } from "vite-prerender-plugin";

import { getAllDocPaths } from "./src/lib/llm/page-docs";

// Prerendered routes for SEO. Shared with the Markdown mirror generator
// (scripts/generateMarkdown.ts) so every prerendered page has a .md twin and
// neither list can drift from the other — add new routes in getAllDocPaths().
const prerenderedRoutes = getAllDocPaths();

// Preload self-hosted font files (src/fonts.css) so they download alongside the
// CSS instead of after it. Their names are content-hashed, so the <link> tags can
// only be written once the bundle exists.
// Only Space Grotesk (22 KB, the large headings, where the swap shift is
// biggest). Measured on throttled mobile: it cuts the font-swap CLS on / from
// 0.09 to 0.02 for ~150 ms of FCP. Also preloading DM Sans (62 KB) gave no
// further CLS gain and cost another ~150 ms of FCP competing with the CSS.
function preloadFonts(prefixes: string[]): Plugin {
  return {
    name: "trainpace-preload-fonts",
    apply: "build",
    transformIndexHtml: {
      order: "post",
      handler(_html, ctx) {
        const files = Object.keys(ctx.bundle ?? {}).filter(
          (f) => f.endsWith(".woff2") && prefixes.some((p) => f.startsWith(`assets/${p}-`))
        );
        // Fail loudly: a renamed Fontsource file would otherwise just drop the preload.
        const missing = prefixes.filter((p) => !files.some((f) => f.startsWith(`assets/${p}-`)));
        if (missing.length) {
          throw new Error(`preloadFonts: no emitted .woff2 for ${missing.join(", ")} (check src/fonts.css)`);
        }
        return files.map((f) => ({
          tag: "link",
          attrs: { rel: "preload", href: `/${f}`, as: "font", type: "font/woff2", crossorigin: "" },
          injectTo: "head" as const,
        }));
      },
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    svgr(),
    preloadFonts(["space-grotesk-latin-wght-normal"]),
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
        // prerender.jsx is a build entry too. Without this, Rollup puts React in the
        // chunk it shares with prerender.jsx, together with every SEO page config
        // and page doc, and the client entry has to download all of it to get React.
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          // react-dom/server is only for prerendering — keep it out of the client.
          if (/[\\/]react-dom[\\/](server|cjs[\\/]react-dom-server)/.test(id)) return;
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom)[\\/]/.test(id)) {
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

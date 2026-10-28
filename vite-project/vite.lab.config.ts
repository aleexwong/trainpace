// Builds the hero lab (lab/frame.html + the LandingLab variants) as a
// standalone static bundle for the design-review artifact. Not part of the
// app build. Usage: npx vite build --config vite.lab.config.ts --outDir <dir>
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import loadConfig from "tailwindcss/loadConfig";

// tailwind.config.js is CommonJS in an ESM package; use Tailwind's own loader.
const baseTailwind = loadConfig(path.resolve(__dirname, "tailwind.config.js"));

export default defineConfig({
  root: path.resolve(__dirname, "lab"),
  base: "./",
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  css: {
    postcss: {
      plugins: [
        tailwindcss({
          ...baseTailwind,
          content: [
            path.resolve(__dirname, "src/**/*.{ts,tsx}"),
            path.resolve(__dirname, "lab/**/*.{html,tsx}"),
          ],
        }),
        autoprefixer(),
      ],
    },
  },
  build: {
    emptyOutDir: true,
    rollupOptions: { input: path.resolve(__dirname, "lab/frame.html") },
  },
});

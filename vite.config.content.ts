import { resolve } from "node:path";
import { defineConfig } from "vite";

const browser = process.env.BROWSER || "chrome";

export default defineConfig({
  build: {
    outDir: `dist/${browser}`,
    emptyOutDir: false,
    target: "esnext",
    minify: false,
    rollupOptions: {
      input: {
        content: resolve(__dirname, "src/app/content/content.ts"),
      },
      output: {
        entryFileNames: "app/content/content.js",
        format: "iife",
        name: "AnkiLexContentScript",
      },
    },
  },
  resolve: {
    alias: {
      "@lib": resolve(__dirname, "src/lib"),
    },
  },
});

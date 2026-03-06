import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const browser = process.env.BROWSER || "chrome";

export default defineConfig({
  root: "src",

  plugins: [tailwindcss()],

  build: {
    target: "esnext",
    outDir: `../dist/${browser}`,
    minify: false,
    emptyOutDir: false,

    rollupOptions: {
      input: {
        content: "src/app/content/content.ts",
      },

      output: {
        format: "iife",
        name: "AnkiLexContentScript",
        entryFileNames: "app/content/[name].js",
        assetFileNames: "assets/[name].[ext]",
      },
    },
  },

  resolve: {
    alias: {
      "@lib": resolve(__dirname, "src/lib"),
    },
  },
});

import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { getManifest } from "./src/manifests";

const browser = (process.env.BROWSER ?? "chrome") as "chrome" | "firefox";

export default defineConfig({
  root: "src",

  plugins: [
    tailwindcss(),
    {
      name: "generate-manifest",
      generateBundle() {
        this.emitFile({
          type: "asset",
          fileName: "manifest.json",
          source: JSON.stringify(getManifest(browser), null, 2),
        });
      },
    },
    viteStaticCopy({
      targets: [
        {
          src: "assets/icons/*",
          dest: "assets/icons",
        },
        {
          src: "_locales/**/*",
          dest: "_locales",
        },
      ],
    }),
  ],

  build: {
    target: "esnext",
    outDir: `../dist/${browser}`,
    minify: false,
    emptyOutDir: true,

    rollupOptions: {
      input: {
        background: "src/app/background/background.ts",
        frame: "src/app/content/frame.html",
        offscreen: "src/app/offscreen/offscreen.html",
        options: "src/app/options/options.html",
        popup: "src/app/popup/popup.html",
      },

      output: {
        assetFileNames: "assets/[name].[ext]",
        chunkFileNames: "assets/chunks/[name].js",
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === "frame") {
            return "app/content/frame.js";
          }
          return "app/[name]/[name].js";
        },
      },
    },
  },

  resolve: {
    alias: {
      "@lib": resolve(__dirname, "src/lib"),
    },
  },
});

import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, mergeConfig, type UserConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import type { Target } from "./src/manifests";
import { iifePlugin, manifestPlugin } from "./src/plugins";

const strategies: Record<"browser" | "zotero", (target: Target) => UserConfig> = {
  browser: (target) => ({
    plugins: [
      iifePlugin({
        entries: [
          {
            entry: "app/content/content.ts",
            name: "AnkiLexContent",
            fileName: "app/content/content.js",
            minify: false,
          },
        ],
        modules: {
          "iife:anki-card": {
            entry: "lib/anki/templates/card.ts",
            name: "AnkiCard",
            minify: true,
          },
        },
      }),
      manifestPlugin({ target }),
      viteStaticCopy({
        targets: [
          { src: "assets/icons/*", dest: "." },
          { src: "_locales/**/*", dest: "." },
        ],
      }),
    ],
    build: {
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
          entryFileNames: (chunkInfo) =>
            chunkInfo.name === "frame" ? "app/content/frame.js" : "app/[name]/[name].js",
        },
      },
    },
  }),

  zotero: (target) => ({
    plugins: [
      manifestPlugin({ target }),
      viteStaticCopy({
        targets: [{ src: "assets/icons/*", dest: "." }],
      }),
    ],
    build: {
      lib: {
        entry: "zotero/bootstrap.ts",
        formats: ["iife"],
        name: "ZoteroPlugin",
        fileName: () => "bootstrap.js",
      },
      rollupOptions: {
        output: {
          extend: true,
          footer: "var { install, uninstall, startup, shutdown } = ZoteroPlugin;",
        },
      },
    },
  }),
};

export default defineConfig(({ mode }) => {
  const target = mode as Target;

  const strategy = target === "zotero" ? strategies.zotero : strategies.browser;
  if (!strategy) {
    throw new Error(`Invalid build mode: ${mode}`);
  }

  const baseConfig: UserConfig = {
    root: "src",
    resolve: {
      alias: {
        "@assets": resolve(__dirname, "src/assets"),
        "@lib": resolve(__dirname, "src/lib"),
      },
    },
    plugins: [tailwindcss()],
    build: {
      target: "esnext",
      minify: false,
      outDir: resolve(__dirname, `dist/${target}`),
      emptyOutDir: true,
    },
  };

  return mergeConfig(baseConfig, strategy(target));
});

import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, mergeConfig, type UserConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { cssPlugin } from "./build/css";
import { iifePlugin } from "./build/iife";
import { manifestPlugin } from "./build/manifest";
import {
  chromeManifest,
  firefoxManifest,
  type Target,
  zoteroManifest,
} from "./src/platforms/manifests";

const manifestByTarget = {
  chrome: chromeManifest,
  firefox: firefoxManifest,
  zotero: zoteroManifest,
} satisfies Record<Target, unknown>;

const strategies: Record<"browser" | "zotero", (target: Target) => UserConfig> = {
  browser: (target) => ({
    plugins: [
      iifePlugin({
        entries: [
          {
            entry: "platforms/browser/content/content.ts",
            name: "OneDictContent",
            fileName: "browser/content/content.js",
            minify: false,
          },
        ],
        modules: {
          "iife:anki-card": {
            entry: "services/anki/template/card.ts",
            name: "AnkiCard",
            minify: true,
          },
        },
      }),
      manifestPlugin({ manifest: manifestByTarget[target] }),
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
          background: "platforms/browser/background/background.ts",
          frame: "platforms/browser/content/frame.html",
          offscreen: "platforms/browser/offscreen/offscreen.html",
          options: "platforms/browser/options/options.html",
          popup: "platforms/browser/popup/popup.html",
        },
        output: {
          assetFileNames: "assets/[name].[ext]",
          chunkFileNames: "assets/chunks/[name].js",
          entryFileNames: (chunkInfo) =>
            chunkInfo.name === "frame" ? "browser/content/frame.js" : "browser/[name]/[name].js",
        },
      },
    },
  }),

  zotero: (target) => ({
    plugins: [
      iifePlugin({
        modules: {
          "iife:anki-card": {
            entry: "services/anki/template/card.ts",
            name: "AnkiCard",
            minify: true,
          },
        },
      }),
      cssPlugin([{ entry: "platforms/zotero/prefs/prefs.css", fileName: "prefs/prefs.css" }]),
      manifestPlugin({ manifest: manifestByTarget[target] }),
      viteStaticCopy({
        targets: [
          { src: "assets/icons/*", dest: "." },
          {
            src: "platforms/zotero/prefs/prefs.xhtml",
            dest: "prefs",
            rename: { stripBase: true },
          },
        ],
      }),
    ],
    build: {
      lib: {
        entry: "platforms/zotero/bootstrap.ts",
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
        "@common": resolve(__dirname, "src/common"),
        "@services": resolve(__dirname, "src/services"),
        "@views": resolve(__dirname, "src/views"),
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

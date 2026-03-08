import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, mergeConfig, type UserConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { manifestPlugin, type Target } from "./src/manifests";

const strategies: Record<"app" | "content" | "zotero", (target: Target) => UserConfig> = {
  app: (target) => ({
    plugins: [
      manifestPlugin({ target }),
      viteStaticCopy({
        targets: [
          { src: "assets/icons/*", dest: "assets/icons" },
          { src: "_locales/**/*", dest: "_locales" },
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

  content: () => ({
    build: {
      rollupOptions: {
        input: { content: "src/app/content/content.ts" },
        output: {
          format: "iife",
          name: "AnkiLexContent",
          entryFileNames: "app/content/[name].js",
          assetFileNames: "assets/[name].[ext]",
        },
      },
    },
  }),

  zotero: (target) => ({
    plugins: [
      manifestPlugin({ target }),
      viteStaticCopy({
        targets: [{ src: "assets/icons/*", dest: "icons" }],
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
          footer: "var { install, startup, shutdown, uninstall } = ZoteroPlugin;",
        },
      },
    },
  }),
};

export default defineConfig(({ mode }) => {
  const [browser, rawSubTarget] = mode.split(":");
  const target = browser as Target;

  const subTarget = rawSubTarget ?? (target === "zotero" ? "zotero" : "app");
  const strategy = strategies[subTarget as keyof typeof strategies];

  if (!strategy) {
    throw new Error(`Invalid build mode: ${subTarget}`);
  }

  const baseConfig: UserConfig = {
    root: "src",
    resolve: { alias: { "@lib": resolve(__dirname, "src/lib") } },
    plugins: [tailwindcss()],
    build: {
      target: "esnext",
      minify: false,
      outDir: resolve(__dirname, `dist/${target}`),
      emptyOutDir: subTarget !== "content",
    },
  };

  return mergeConfig(baseConfig, strategy(target));
});

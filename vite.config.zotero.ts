import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { getManifest } from "./src/manifests";

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
          source: JSON.stringify(getManifest("zotero"), null, 2),
        });
      },
    },
    viteStaticCopy({
      targets: [
        {
          src: "assets/icons/*",
          dest: "icons",
        },
      ],
    }),
  ],

  build: {
    outDir: "../dist/zotero",
    minify: false,
    cssCodeSplit: false,
    emptyOutDir: true,

    lib: {
      entry: "zotero/bootstrap.ts",
      name: "ZoteroPlugin",
      formats: ["iife"],
      fileName: () => "bootstrap.js",
    },

    rollupOptions: {
      output: {
        extend: true,
        footer: `
          var install = ZoteroPlugin.install;
          var startup = ZoteroPlugin.startup;
          var shutdown = ZoteroPlugin.shutdown;
          var uninstall = ZoteroPlugin.uninstall;
        `,
      },
    },
  },

  resolve: {
    alias: {
      "@lib": resolve(__dirname, "src/lib"),
    },
  },
});

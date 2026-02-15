import { resolve } from "node:path";
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: "src/manifests/zotero.json",
          dest: ".",
          rename: "manifest.json",
        },
        {
          src: "src/assets/icons/*",
          dest: "icons",
        },
      ],
    }),
  ],
  resolve: {
    alias: {
      "@lib": resolve(__dirname, "src/lib"),
    },
  },
  build: {
    outDir: "dist/zotero",
    emptyOutDir: true,
    minify: false,
    lib: {
      entry: resolve(__dirname, "src/zotero/bootstrap.ts"),
      name: "ZoteroPlugin",
      fileName: () => "bootstrap.js",
      formats: ["iife"],
    },
    rollupOptions: {
      output: {
        extend: true, // Use existing variable if it exists
        // Simply return the exports so they are assigned to ZoteroPlugin (the 'name' option)
        footer: `
          var install = ZoteroPlugin.install;
          var startup = ZoteroPlugin.startup;
          var shutdown = ZoteroPlugin.shutdown;
          var uninstall = ZoteroPlugin.uninstall;
        `,
      },
    },
  },
});

import { resolve } from "node:path";
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

const browser = process.env.BROWSER || "chrome";

export default defineConfig({
  build: {
    outDir: `dist/${browser}`,
    emptyOutDir: true,
    target: "esnext",
    minify: false, // Easy for debugging, can be changed to true for release
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "src/app/popup/popup.html"),
        options: resolve(__dirname, "src/app/options/options.html"),
        offscreen: resolve(__dirname, "src/app/offscreen/offscreen.html"),
        frame: resolve(__dirname, "src/app/content/frame.html"),
        background: resolve(__dirname, "src/app/background/main.ts"),
        // content 将在后续脚本中单独构建
        client: resolve(__dirname, "src/app/content/css/client.scss"),
      },

      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === "background") return "app/background/main.js";
          return "app/[name]/[name].js";
        },
        chunkFileNames: "assets/[name].js",
        format: "es",

        assetFileNames: (assetInfo) => {
          const name = assetInfo.names?.[0];
          if (name?.endsWith(".css")) {
            // Keep CSS paths consistent with previous structure
            if (name.includes("client")) return "content/css/client.css";
            if (name.includes("frame")) return "content/css/frame.css";
            return "assets/[name].[ext]";
          }
          return "assets/[name].[ext]";
        },
      },
    },
  },
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: `src/manifests/${browser}.json`,
          dest: ".",
          rename: "manifest.json",
        },
        {
          src: "src/assets/**/*",
          dest: "assets",
        },
        {
          src: "src/_locales/**/*",
          dest: "_locales",
        },
      ],
    }),
  ],
  resolve: {
    alias: {
      "@lib": resolve(__dirname, "src/lib"),
    },
  },
});

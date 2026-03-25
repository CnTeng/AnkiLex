import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { build, type Plugin, type ResolvedConfig } from "vite";

interface CssEntry {
  /** Source path relative to Vite root */
  entry: string;
  /** Output path relative to outDir */
  fileName: string;
}

export function cssPlugin(entries: CssEntry[]): Plugin {
  let viteConfig: ResolvedConfig;
  let emitted = false;

  return {
    name: "vite-plugin-css-build",

    configResolved(config) {
      viteConfig = config;
    },

    async generateBundle() {
      if (emitted || entries.length === 0) return;
      emitted = true;

      for (const { entry, fileName } of entries) {
        const entryPath = path.resolve(viteConfig.root, entry);

        const result = await build({
          configFile: false,
          root: viteConfig.root,
          resolve: { alias: viteConfig.resolve.alias },
          plugins: [tailwindcss()],
          build: {
            write: false,
            rollupOptions: {
              input: entryPath,
            },
            cssMinify: false,
          },
          logLevel: "silent",
        });

        const output = Array.isArray(result) ? result[0] : result;
        const cssAsset =
          "output" in output
            ? output.output.find((o) => o.type === "asset" && String(o.fileName).endsWith(".css"))
            : null;

        if (cssAsset && "source" in cssAsset) {
          this.emitFile({
            type: "asset",
            fileName,
            source: cssAsset.source,
          });
        }
      }
    },
  };
}

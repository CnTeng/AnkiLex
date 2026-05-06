import type { Plugin } from "vite";

export function manifestPlugin({ manifest }: { manifest: unknown }): Plugin {
  return {
    name: "vite-plugin-extension-manifest",
    apply: "build",

    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "manifest.json",
        source: JSON.stringify(manifest, null, 2),
      });
    },
  };
}

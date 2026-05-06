import type { Plugin } from "vite";
import { MANIFESTS, type Target } from "../manifests";

export function manifestPlugin({ target }: { target: Target }): Plugin {
  return {
    name: "vite-plugin-extension-manifest",
    apply: "build",

    generateBundle() {
      const manifest = MANIFESTS[target];

      this.emitFile({
        type: "asset",
        fileName: "manifest.json",
        source: JSON.stringify(manifest, null, 2),
      });
    },
  };
}

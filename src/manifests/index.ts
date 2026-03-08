import type { Plugin } from "vite";
import { chromeManifest } from "./chrome";
import { firefoxManifest } from "./firefox";
import { zoteroManifest } from "./zotero";

export type Target = "chrome" | "firefox" | "zotero";

const MANIFESTS = {
  chrome: chromeManifest,
  firefox: firefoxManifest,
  zotero: zoteroManifest,
} satisfies Record<Target, unknown>;

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

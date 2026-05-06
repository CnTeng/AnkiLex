import { chromeManifest } from "./chrome";
import { firefoxManifest } from "./firefox";
import { zoteroManifest } from "./zotero";

export type Target = "chrome" | "firefox" | "zotero";

export const MANIFESTS = {
  chrome: chromeManifest,
  firefox: firefoxManifest,
  zotero: zoteroManifest,
} satisfies Record<Target, unknown>;

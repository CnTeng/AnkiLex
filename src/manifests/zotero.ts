import { author, description, name, version } from "./base";

export const zoteroManifest = {
  name,
  version,
  description,
  author,
  homepage_url: "https://github.com/cnteng/ankilex",
  icons: {
    "48": "icons/icon48.png",
    "128": "icons/icon128.png",
  },
  manifest_version: 2,
  applications: {
    zotero: {
      id: "ankilex-zotero@ankilex.com",
      strict_min_version: "7.0",
      strict_max_version: "9.0.*",
      update_url: "https://raw.githubusercontent.com/cnteng/ankilex/main/update.json",
    },
  },
};

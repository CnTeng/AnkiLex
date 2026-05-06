import { browserManifest } from "./base";

export const firefoxManifest = {
  ...browserManifest,
  background: {
    scripts: ["browser/background/background.js"],
    type: "module",
  },
  permissions: ["storage", "contextMenus", "notifications", "activeTab"],
  options_ui: {
    page: "platforms/browser/options/options.html",
    open_in_tab: true,
  },
  browser_specific_settings: {
    gecko: {
      id: "ankilex@example.com",
      strict_min_version: "109.0",
    },
  },
};

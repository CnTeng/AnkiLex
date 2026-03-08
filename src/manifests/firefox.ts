import { browserManifest } from "./base";

export const firefoxManifest = {
  ...browserManifest,
  background: {
    scripts: ["app/background/background.js"],
    type: "module",
  },
  permissions: ["storage", "contextMenus", "notifications", "activeTab"],
  options_ui: {
    page: "app/options/options.html",
    open_in_tab: true,
  },
  browser_specific_settings: {
    gecko: {
      id: "ankilex@example.com",
      strict_min_version: "109.0",
    },
  },
};

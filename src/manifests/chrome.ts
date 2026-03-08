import { browserManifest } from "./base";

export const chromeManifest = {
  ...browserManifest,
  background: {
    service_worker: "app/background/background.js",
    type: "module",
  },
  permissions: ["storage", "contextMenus", "notifications", "activeTab", "offscreen"],
  options_page: "app/options/options.html",
  minimum_chrome_version: "110.0.0.0",
};

import { browserManifest } from "./base";

export const chromeManifest = {
  ...browserManifest,
  background: {
    service_worker: "browser/background/background.js",
    type: "module",
  },
  permissions: ["storage", "contextMenus", "notifications", "activeTab", "offscreen"],
  options_page: "platforms/browser/options/options.html",
  minimum_chrome_version: "110.0.0.0",
};

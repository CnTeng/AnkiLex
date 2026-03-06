import pkg from "../../package.json";

const { version, description, author } = pkg;

const base = {
  name: "AnkiLex",
  version,
  description,
  author,
  icons: {
    "16": "assets/icons/icon16.png",
    "48": "assets/icons/icon48.png",
    "128": "assets/icons/icon128.png",
  },
};

const actionIcons = {
  "16": "assets/icons/icon16.png",
  "19": "assets/icons/icon19.png",
  "38": "assets/icons/icon38.png",
  "48": "assets/icons/icon48.png",
};

const browserBase = {
  ...base,
  manifest_version: 3,
  default_locale: "en",
  action: {
    default_popup: "app/popup/popup.html",
    default_icon: actionIcons,
  },
  host_permissions: ["http://127.0.0.1:8765/*", "http://localhost:8765/*", "https://*/*"],
  content_scripts: [
    {
      matches: ["<all_urls>"],
      js: ["app/content/content.js"],
      run_at: "document_end",
    },
  ],
  web_accessible_resources: [
    {
      resources: ["app/content/frame.html", "app/content/frame.js", "assets/*", "assets/chunks/*"],
      matches: ["<all_urls>"],
    },
  ],
};

export const chrome = {
  ...browserBase,
  background: {
    service_worker: "app/background/background.js",
    type: "module",
  },
  permissions: ["storage", "contextMenus", "notifications", "activeTab", "offscreen"],
  options_page: "app/options/options.html",
  minimum_chrome_version: "110.0.0.0",
};

export const firefox = {
  ...browserBase,
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

export const zotero = {
  name: "ankilex-zotero",
  version,
  description: "AnkiLex for Zotero: Dictionary lookup and Anki integration.",
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

export function getManifest(target: "chrome" | "firefox" | "zotero") {
  switch (target) {
    case "chrome":
      return chrome;
    case "firefox":
      return firefox;
    case "zotero":
      return zotero;
  }
}

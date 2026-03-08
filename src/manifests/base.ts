import pkg from "../../package.json";

export const { name, version, description, author } = pkg;

export const browserManifest = {
  name,
  version,
  description,
  author,
  icons: {
    "16": "assets/icons/icon16.png",
    "48": "assets/icons/icon48.png",
    "128": "assets/icons/icon128.png",
  },
  manifest_version: 3,
  default_locale: "en",
  action: {
    default_popup: "app/popup/popup.html",
    default_icon: {
      "16": "assets/icons/icon16.png",
      "19": "assets/icons/icon19.png",
      "38": "assets/icons/icon38.png",
      "48": "assets/icons/icon48.png",
    },
  },
  host_permissions: [
    "http://127.0.0.1:8765/*",
    "http://localhost:8765/*",
    "http://*/*",
    "https://*/*",
  ],
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

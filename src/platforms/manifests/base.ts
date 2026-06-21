import pkg from "../../../package.json";

export const { name, version, description, author } = pkg;

export const browserManifest = {
  name,
  version,
  description,
  author,
  icons: {
    "16": "assets/icons/icon16.png",
    "32": "assets/icons/icon32.png",
    "48": "assets/icons/icon48.png",
    "96": "assets/icons/icon96.png",
    "128": "assets/icons/icon128.png",
  },
  manifest_version: 3,
  default_locale: "en",
  action: {
    default_icon: {
      "16": "assets/icons/icon16.png",
      "24": "assets/icons/icon24.png",
      "32": "assets/icons/icon32.png",
    },
    default_popup: "platforms/browser/popup/popup.html",
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
      js: ["browser/content/content.js"],
      run_at: "document_end",
    },
  ],
  web_accessible_resources: [
    {
      resources: [
        "platforms/browser/content/frame.html",
        "browser/content/frame.js",
        "assets/*",
        "assets/chunks/*",
      ],
      matches: ["<all_urls>"],
    },
  ],
};

// Core logic for Zotero plugin
// This will eventually import shared logic from src/lib/dictionary.ts and providers

export class ZoteroContentScript {
  constructor() {
    // Initialize listeners for Zotero PDF reader text selection
  }

  async lookup(text) {
    // Use shared dictionary providers here
    // We will need to adapt the browser-extension providers to work in Zotero environment (fetch/XHR might need adjustment if using Zotero's internal net APIs, though standard fetch usually works in Zotero 7)
    console.log("Looking up:", text);
  }
}

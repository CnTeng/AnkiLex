import type { DictionaryResult, IDictionaryProvider, LookupOptions } from "../models";

export abstract class DictionaryProvider implements IDictionaryProvider {
  abstract get id(): string;
  abstract get name(): string;
  get supportedLanguages() {
    return ["en"];
  }

  abstract lookup(word: string, options?: LookupOptions): Promise<DictionaryResult>;

  async isAvailable(): Promise<boolean> {
    return true;
  }

  protected async parseHtml(html: string): Promise<unknown> {
    if (this.isFirefoxBg()) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      return this.parseDocument(doc);
    }

    if (this.isChromeOffscreen()) {
      await this.ensureOffscreen();
      return new Promise((resolve) => {
        chrome.runtime.sendMessage(
          {
            action: "parse-html",
            html,
            id: this.id,
          },
          (response) => {
            console.log("Received offscreen response:", response);
            if (chrome.runtime.lastError) {
              console.error("Offscreen error:", chrome.runtime.lastError);
              resolve(null);
              return;
            }
            resolve(response?.results || null);
          },
        );
      });
    }

    if (this.isNodeEnv()) {
      const { JSDOM } = require("jsdom");
      const dom = new JSDOM(html);
      return this.parseDocument(dom.window.document);
    }

    return null;
  }

  protected isNodeEnv(): boolean {
    return typeof process !== "undefined" && !!process.versions?.node;
  }

  protected isFirefoxBg(): boolean {
    return typeof DOMParser !== "undefined" && typeof chrome !== "undefined" && !chrome.offscreen;
  }

  protected isChromeOffscreen(): boolean {
    return typeof chrome !== "undefined" && !!chrome.offscreen;
  }

  private async ensureOffscreen() {
    const offscreenUrl = chrome.runtime.getURL("src/app/offscreen/offscreen.html");
    const existingContexts = await chrome.runtime.getContexts({
      contextTypes: ["OFFSCREEN_DOCUMENT"],
      documentUrls: [offscreenUrl],
    });

    if (existingContexts.length > 0) {
      return;
    }

    await chrome.offscreen.createDocument({
      url: "src/app/offscreen/offscreen.html",
      reasons: ["DOM_PARSER"],
      justification: "Parse dictionary HTML content",
    });
  }

  parseDocument(_doc: Document): unknown {
    return [];
  }
}

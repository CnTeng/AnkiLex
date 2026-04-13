import type { DictionaryEntry, IDictionaryProvider } from "@lib/model";

const REQUEST_TIMEOUT_MS = 10_000;

export abstract class DictionaryProvider implements IDictionaryProvider {
  abstract get id(): string;
  abstract get name(): string;
  abstract get supportedLanguages(): string[];

  abstract lookup(word: string): Promise<DictionaryEntry | null>;
  abstract parseDocument(doc: Document): DictionaryEntry | null;

  protected async fetchWithTimeout(url: string): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timeoutId));
  }

  protected async parseHtml(html: string): Promise<DictionaryEntry | null> {
    if (this.isZotero() || this.isFirefoxBg()) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      return this.parseDocument(doc);
    }

    if (this.isChromeOffscreen()) {
      await this.ensureOffscreen();
      return new Promise((resolve) => {
        let settled = false;
        const timeoutId = setTimeout(() => {
          if (settled) return;
          settled = true;
          resolve(null);
        }, REQUEST_TIMEOUT_MS);

        chrome.runtime.sendMessage(
          {
            action: "parse-html",
            html,
            id: this.id,
          },
          (response) => {
            if (settled) return;
            settled = true;
            clearTimeout(timeoutId);
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

    return null;
  }

  protected isZotero(): boolean {
    return typeof Zotero !== "undefined";
  }

  protected isFirefoxBg(): boolean {
    return typeof DOMParser !== "undefined" && typeof chrome !== "undefined" && !chrome.offscreen;
  }

  protected isChromeOffscreen(): boolean {
    return typeof chrome !== "undefined" && !!chrome.offscreen;
  }

  private async ensureOffscreen() {
    const offscreenUrl = chrome.runtime.getURL("app/offscreen/offscreen.html");
    const existingContexts = await chrome.runtime.getContexts({
      contextTypes: ["OFFSCREEN_DOCUMENT"],
      documentUrls: [offscreenUrl],
    });

    if (existingContexts.length > 0) {
      return;
    }

    await chrome.offscreen.createDocument({
      url: "app/offscreen/offscreen.html",
      reasons: ["DOM_PARSER"],
      justification: "Parse dictionary HTML content",
    });
  }
}

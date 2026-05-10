import type { DictionaryEntry, IDictionaryProvider } from "@common/types";
import { parseWithDom, parseWithOffscreen } from "./parser";

const REQUEST_TIMEOUT_MS = 10_000;

export abstract class DictionaryProvider implements IDictionaryProvider {
  abstract get id(): string;
  abstract get name(): string;
  abstract get supportedLanguages(): string[];

  abstract lookup(word: string): Promise<DictionaryEntry | null>;
  abstract parseDocument(doc: Document): DictionaryEntry | null;

  protected async fetchWithTimeout(url: string): Promise<Response> {
    let timeoutId: ReturnType<typeof setTimeout>;
    return Promise.race([
      fetch(url),
      new Promise<Response>((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error(`Request timed out after ${REQUEST_TIMEOUT_MS}ms`)),
          REQUEST_TIMEOUT_MS,
        );
      }),
    ]).finally(() => clearTimeout(timeoutId));
  }

  protected async parseHtml(html: string): Promise<DictionaryEntry | null> {
    const parser =
      typeof chrome !== "undefined" && chrome.offscreen ? parseWithOffscreen : parseWithDom;

    return parser(html, this.id).catch((_) => {
      return null;
    });
  }
}

import type { DictionaryEntry } from "@lib/model";
import { getDictionaryProvider } from "./registry";

const OFFSCREEN_PORT = "offscreen";
const OFFSCREEN_DOCUMENT = "app/offscreen/offscreen.html";
const PARSE_TIMEOUT_MS = 10_000;

export type HtmlParser = (html: string, providerId: string) => Promise<DictionaryEntry | null>;

export const parseWithDom: HtmlParser = async (html, providerId) => {
  const provider = getDictionaryProvider(providerId);
  if (!provider) return null;

  return provider.parseDocument(new DOMParser().parseFromString(html, "text/html"));
};

async function ensureOffscreenDocument() {
  const offscreenUrl = chrome.runtime.getURL(OFFSCREEN_DOCUMENT);
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: [offscreenUrl],
  });

  if (existingContexts.length > 0) {
    return;
  }

  await chrome.offscreen.createDocument({
    url: OFFSCREEN_DOCUMENT,
    reasons: ["DOM_PARSER"],
    justification: "Parse dictionary HTML content",
  });
}

export const parseWithOffscreen: HtmlParser = async (html, providerId) => {
  await ensureOffscreenDocument();

  return new Promise((resolve) => {
    let settled = false;
    const requestId = crypto.randomUUID();
    const port = chrome.runtime.connect({ name: OFFSCREEN_PORT });
    const timeoutId = setTimeout(() => {
      if (settled) return;
      settled = true;
      port.disconnect();
      resolve(null);
    }, PARSE_TIMEOUT_MS);

    port.onMessage.addListener(
      (response: { requestId?: string; results: DictionaryEntry | null }) => {
        if (settled || response.requestId !== requestId) return;
        settled = true;
        clearTimeout(timeoutId);
        port.disconnect();
        resolve(response.results);
      },
    );

    port.onDisconnect.addListener(() => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      if (chrome.runtime.lastError) {
        console.error("Offscreen port error:", chrome.runtime.lastError);
      }
      resolve(null);
    });

    port.postMessage({ html, providerId, requestId });
  });
};

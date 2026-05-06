import { dictionary } from "@services/dict";
import type { DictionaryEntry } from "@common/model";

type ParseHtmlMessage = {
  html: string;
  providerId: string;
  requestId?: string;
};

async function parseHtml(message: ParseHtmlMessage): Promise<DictionaryEntry | null> {
  const provider = dictionary.getProvider(message.providerId);

  if (!provider) return null;

  return provider.parseDocument(new DOMParser().parseFromString(message.html, "text/html"));
}

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "offscreen") return;

  port.onMessage.addListener((message: ParseHtmlMessage) => {
    parseHtml(message)
      .then((results) => port.postMessage({ requestId: message.requestId, results }))
      .catch((error: Error) => {
        console.error("Parse error:", error);
        port.postMessage({ requestId: message.requestId, results: null });
      });
  });
});

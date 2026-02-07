import type { DictionaryProvider } from "../../lib/dictionary";
import { YoudaoDictionary } from "../../lib/dictionary";

const providers: Record<string, DictionaryProvider> = {
  youdao: new YoudaoDictionary(),
};

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "parse-html") {
    console.log("Offscreen received parse-html request for provider:", message.id);
    handleParseHtml(message.html, message.id)
      .then((results) => sendResponse({ results }))
      .catch((error) => {
        console.error("Parse error:", error);
        sendResponse({ results: [] });
      });

    return true;
  }
});

async function handleParseHtml(html: string, providerId: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const provider = providers[providerId];
  if (provider) {
    return provider.parseDocument(doc);
  } else {
    return [];
  }
}

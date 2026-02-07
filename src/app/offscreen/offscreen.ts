import { dictionary } from "../../lib/dictionary";

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
  const provider = dictionary.getProvider(providerId);
  if (!provider) {
    return [];
  }

  const doc = new DOMParser().parseFromString(html, "text/html");
  return provider.parseDocument(doc);
}

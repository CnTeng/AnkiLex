/**
 * Background Service Worker
 */

import { dictionary } from "@lib/dictionary";
import { dispatchAction } from "@lib/message";
import { settings } from "@lib/settings";

// Register dictionary providers
chrome.runtime.onInstalled.addListener(async () => {
  dictionary.registerAll();
  await setupContextMenu();
});

dictionary.registerAll();

async function setupContextMenu() {
  const s = await settings.get();
  if (!s.showContextMenu) return;

  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "ankilex-lookup",
      title: 'Look up "%s" in AnkiLex',
      contexts: ["selection"],
    });
  });
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  dispatchAction(message.action, message.data)
    .then(sendResponse)
    .catch((error) => {
      console.error("Action handler error:", error);
      sendResponse({ error: error.message });
    });
  return true;
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const selectedText = info.selectionText?.trim();
  if (!selectedText || !tab?.id) return;

  if (info.menuItemId === "ankilex-lookup") {
    chrome.tabs.sendMessage(tab.id, {
      action: "show-lookup",
      data: { word: selectedText },
    });
  }
});

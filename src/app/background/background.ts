import { listenRPC } from "@lib/rpc";
import { allHandlers } from "@lib/rpc/handlers";
import { settings } from "@lib/settings";

chrome.runtime.onInstalled.addListener(async () => {
  await setupContextMenu();
});

listenRPC(allHandlers); // Listen for all RPC calls with the inferred handlers

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

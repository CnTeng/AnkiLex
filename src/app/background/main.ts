/**
 * Background Service Worker
 */

import { anki } from "../../lib/anki";
import { dictionary } from "../../lib/dictionary";
import type { AnkiLexSettings, AnkiNote, DictionaryEntry } from "../../lib/model";
import { settings } from "../../lib/settings";

// Register dictionary providers
chrome.runtime.onInstalled.addListener(async () => {
  dictionary.registerAll();
  await setupContextMenu();
});

dictionary.registerAll();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then(sendResponse)
    .catch((error) => {
      console.error("Message handler error:", error);
      sendResponse({ error: error.message });
    });
  return true;
});

async function handleMessage(
  message: { action: string; data: Record<string, unknown> },
  _sender: chrome.runtime.MessageSender,
) {
  const { action, data } = message;

  switch (action) {
    case "lookup": {
      const { languageDictionaries } = await settings.get();
      const lang = "en";
      const providerId = languageDictionaries[lang];
      const result = await dictionary.lookup(data.word as string, providerId);
      return result;
    }

    case "get-dictionaries":
      return {
        dictionaries: dictionary.getProviders(),
      };

    case "anki-check":
      return { available: await anki.isAvailable() };

    case "anki-get-decks":
      return { decks: await anki.getDecks() };

    case "anki-get-note-types":
      return { noteTypes: await anki.getNoteTypes() };

    case "anki-get-fields":
      return { fields: await anki.getFields(data.modelName as string) };

    case "anki-add-note":
      return { noteId: await anki.addNote(data.note as AnkiNote) };

    case "anki-create-note-from-result":
      return {
        noteId: await anki.createNoteFromResult(
          data.result as DictionaryEntry,
          {
            ...(data.options as object),
            context: data.context as string,
          },
          data.defIndex as number, // Pass optional definition index
        ),
      };

    case "settings-get":
      return { settings: await settings.get() };

    case "settings-update":
      return { settings: await settings.update(data.partial as Partial<AnkiLexSettings>) };

    case "settings-reset":
      return { settings: await settings.reset() };

    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

async function setupContextMenu() {
  const s = await settings.get();
  if (!s.contextMenuEnabled) return;

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

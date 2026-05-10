import type { DictionaryEntry } from "@common/types";
import { ANKI_MODEL_NAME } from "./builtin";
import { getDecks } from "./deck";
import { checkModel, syncModel } from "./model";
import { createNoteFromEntry } from "./note";
import { createAnkiRequest } from "./request";

export type AnkiClient = {
  getDecks: () => Promise<string[]>;
  syncTemplate: () => Promise<void>;
  createNote: (deckName: string, entry: DictionaryEntry) => Promise<void>;
};

export function createAnkiClient(baseUrl: string): AnkiClient {
  const request = createAnkiRequest(baseUrl);

  return {
    getDecks: () => getDecks(request),
    syncTemplate: () => syncModel(request),
    createNote: (deckName, entry) =>
      checkModel(request, ANKI_MODEL_NAME).then(() =>
        createNoteFromEntry(request, deckName, entry),
      ),
  };
}

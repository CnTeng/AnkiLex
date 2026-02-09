import { ACTION, type ActionMap, type DictionaryEntry } from "@lib/model";

type Action = keyof ActionMap;

async function sendAction<A extends Action>(
  action: A,
  data?: ActionMap[A]["request"],
): Promise<ActionMap[A]["response"]> {
  const message = data === undefined ? { action } : { action, data };
  const response = await chrome.runtime.sendMessage(message);

  if (response && typeof response === "object" && "error" in response) {
    throw new Error((response as { error: string }).error);
  }

  return response as ActionMap[A]["response"];
}

export const api = {
  dictionary: {
    lookup(word: string): Promise<DictionaryEntry | null> {
      return sendAction(ACTION.DICTIONARY_LOOKUP, { word });
    },

    getProviders() {
      return sendAction(ACTION.DICTIONARY_GET_PROVIDERS);
    },
  },

  settings: {
    get() {
      return sendAction(ACTION.SETTINGS_GET);
    },

    update(partial: Partial<import("@lib/model").AnkiLexSettings>) {
      return sendAction(ACTION.SETTINGS_UPDATE, { partial });
    },

    reset() {
      return sendAction(ACTION.SETTINGS_RESET);
    },
  },

  anki: {
    check() {
      return sendAction(ACTION.ANKI_CHECK);
    },

    getDecks() {
      return sendAction(ACTION.ANKI_GET_DECKS);
    },

    getNoteTypes() {
      return sendAction(ACTION.ANKI_GET_NOTE_TYPES);
    },

    getFields(modelName: string) {
      return sendAction(ACTION.ANKI_GET_FIELDS, { modelName });
    },

    addNote(note: import("@lib/model").AnkiNote) {
      return sendAction(ACTION.ANKI_ADD_NOTE, { note });
    },

    createNoteFromResult({
      result,
      defIndex,
      context,
      options,
    }: {
      result: DictionaryEntry;
      defIndex?: number;
      context?: string;
      options?: Record<string, unknown>;
    }) {
      return sendAction(ACTION.ANKI_CREATE_NOTE_FROM_RESULT, {
        result,
        defIndex,
        context: context ?? "",
        options: options ?? {},
      });
    },
  },
};

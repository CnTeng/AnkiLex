import type { AnkiNote, DictionaryEntry } from ".";

export const ACTION = {
  DICTIONARY_LOOKUP: "dictionary-lookup",
  DICTIONARY_GET_PROVIDERS: "dictionary-get-providers",

  ANKI_CHECK: "anki-check",
  ANKI_GET_DECKS: "anki-get-decks",
  ANKI_GET_NOTE_TYPES: "anki-get-note-types",
  ANKI_GET_FIELDS: "anki-get-fields",
  ANKI_ADD_NOTE: "anki-add-note",
  ANKI_CREATE_NOTE_FROM_RESULT: "anki-create-note-from-result",

  SETTINGS_GET: "settings-get",
  SETTINGS_UPDATE: "settings-update",
  SETTINGS_RESET: "settings-reset",
} as const;

export interface ActionMap {
  [ACTION.DICTIONARY_LOOKUP]: {
    request: { word: string };
    response: DictionaryEntry | null;
  };

  [ACTION.DICTIONARY_GET_PROVIDERS]: {
    request: undefined;
    response: { providers: { id: string; name: string }[] };
  };

  [ACTION.ANKI_CHECK]: {
    request: undefined;
    response: { available: boolean };
  };

  [ACTION.ANKI_GET_DECKS]: {
    request: undefined;
    response: { decks: string[] };
  };

  [ACTION.ANKI_GET_NOTE_TYPES]: {
    request: undefined;
    response: { noteTypes: string[] };
  };

  [ACTION.ANKI_GET_FIELDS]: {
    request: { modelName: string };
    response: { fields: string[] };
  };

  [ACTION.ANKI_ADD_NOTE]: {
    request: { note: AnkiNote };
    response: { noteId: number };
  };

  [ACTION.ANKI_CREATE_NOTE_FROM_RESULT]: {
    request: { result: unknown; options: object; context: string; defIndex?: number };
    response: { noteId: number };
  };

  [ACTION.SETTINGS_GET]: {
    request: undefined;
    response: import("./settings").AnkiLexSettings;
  };

  [ACTION.SETTINGS_UPDATE]: {
    request: { partial: Partial<import("./settings").AnkiLexSettings> };
    response: import("./settings").AnkiLexSettings;
  };

  [ACTION.SETTINGS_RESET]: {
    request: undefined;
    response: import("./settings").AnkiLexSettings;
  };
}

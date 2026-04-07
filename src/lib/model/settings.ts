export const STORAGE_KEY = "extensions.ankilex.settings";

export interface AnkiLexSettings {
  // Dictionary settings
  dictionaryProviders: Record<string, string>; // e.g. { 'en': 'youdao', 'jp': '...'}

  // Anki settings
  ankiConnectUrl: string;
  ankiDefaultDeck: string;
  ankiDefaultNoteType: string;
  ankiFieldMap: Record<string, string>;
}

export const DEFAULT_SETTINGS: AnkiLexSettings = {
  dictionaryProviders: {
    en: "youdao",
    zh: "zdic",
  },

  ankiConnectUrl: "http://127.0.0.1:8765",
  ankiDefaultDeck: "Default",
  ankiDefaultNoteType: "Basic",
  ankiFieldMap: {
    word: "word",
    definition: "definition",
    examples: "examples",
  },
};

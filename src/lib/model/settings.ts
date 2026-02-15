export const STORAGE_KEY = "extensions.ankilex.settings";

export interface AnkiLexSettings {
  // Dictionary settings
  dictionaryProviders: Record<string, string>; // e.g. { 'en': 'youdao', 'jp': '...'}

  // Anki settings
  ankiConnectUrl: string;
  ankiDefaultDeck: string;
  ankiDefaultNoteType: string;
  ankiFieldMap: Record<string, string>;

  // UI settings
  popupWidth: number;
  popupHeight: number;
  theme: "light" | "dark" | "auto";

  // Behavior settings
  autoLookup: boolean;
  showContextMenu: boolean;
}

export const DEFAULT_SETTINGS: AnkiLexSettings = {
  dictionaryProviders: {
    en: "youdao",
  },

  ankiConnectUrl: "http://127.0.0.1:8765",
  ankiDefaultDeck: "Default",
  ankiDefaultNoteType: "Basic",
  ankiFieldMap: {
    Front: "word",
    Back: "definition",
  },

  popupWidth: 400,
  popupHeight: 600,
  theme: "auto",

  autoLookup: true,
  showContextMenu: true,
};

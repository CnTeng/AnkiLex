export interface AnkiLexSettings {
  // Dictionary settings
  languageDictionaries: Record<string, string>; // e.g. { 'en': 'youdao', 'jp': '...'}

  // Anki settings
  ankiConnectUrl: string;
  defaultDeck: string;
  defaultNoteType: string;
  fieldMappings: Record<string, string>;

  // UI settings
  popupWidth: number;
  popupHeight: number;
  theme: "light" | "dark" | "auto";

  // Behavior settings
  autoLookup: boolean;
  contextMenuEnabled: boolean;
}

// Storage Keys
export const StorageKeys = {
  SETTINGS: "ankilex_settings",
  HISTORY: "ankilex_history",
  FAVORITES: "ankilex_favorites",
} as const;

// Default Settings
export const DEFAULT_SETTINGS: AnkiLexSettings = {
  languageDictionaries: {
    en: "youdao",
  },
  ankiConnectUrl: "http://127.0.0.1:8765",
  defaultDeck: "Default",
  defaultNoteType: "Basic",
  fieldMappings: {
    Front: "word",
    Back: "definition",
  },
  popupWidth: 400,
  popupHeight: 600,
  theme: "auto",
  autoLookup: true,
  contextMenuEnabled: true,
};

import { storage } from "./storage";

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

export const settings = {
  async get(): Promise<AnkiLexSettings> {
    const stored = await storage.get<Partial<AnkiLexSettings>>(StorageKeys.SETTINGS);

    // Merge with defaults to ensure all fields exist, especially new ones like languageDictionaries
    // This handles migration from old settings versions automatically
    const settings = { ...DEFAULT_SETTINGS, ...(stored || {}) };

    // Double check specific complex objects to ensure they are not undefined if partial stored data is missing them
    if (!settings.languageDictionaries) {
      settings.languageDictionaries = DEFAULT_SETTINGS.languageDictionaries;
    }

    return settings as AnkiLexSettings;
  },

  async update(partial: Partial<AnkiLexSettings>): Promise<AnkiLexSettings> {
    const current = await this.get();
    const updated = { ...current, ...partial };
    await storage.set(StorageKeys.SETTINGS, updated);
    return updated;
  },

  async reset(): Promise<AnkiLexSettings> {
    await storage.set(StorageKeys.SETTINGS, DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  },
};

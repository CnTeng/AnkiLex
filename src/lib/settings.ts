import { type AnkiLexSettings, DEFAULT_SETTINGS, StorageKeys } from "./model";
import { storage } from "./storage";

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

import { type AnkiLexSettings, DEFAULT_SETTINGS, STORAGE_KEY } from "./model";
import { storage } from "./storage";

export const settings = {
  async get(): Promise<AnkiLexSettings> {
    const stored = await storage.get<Partial<AnkiLexSettings>>(STORAGE_KEY);
    return { ...DEFAULT_SETTINGS, ...(stored || {}) };
  },

  async update(partial: Partial<AnkiLexSettings>): Promise<AnkiLexSettings> {
    const current = await this.get();
    const updated = { ...current, ...partial };
    await storage.set(STORAGE_KEY, updated);
    return updated;
  },

  async reset(): Promise<AnkiLexSettings> {
    await storage.set(STORAGE_KEY, DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  },
};

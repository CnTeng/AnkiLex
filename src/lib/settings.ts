import { DEFAULT_USER_SETTINGS, STORAGE_KEY, type UserSettings } from "./model";
import { storage } from "./storage";

export const useSettings = {
  async get(): Promise<UserSettings> {
    const settings = await storage.get<UserSettings>(STORAGE_KEY);
    if (settings == null) return structuredClone(DEFAULT_USER_SETTINGS);

    return settings;
  },

  async set(settings: UserSettings): Promise<void> {
    return await storage.set(STORAGE_KEY, settings);
  },

  async reset(): Promise<void> {
    return storage.remove(STORAGE_KEY);
  },
};

export type Value = string | number | boolean | object | Array<unknown> | null;

const isZotero = typeof Zotero !== "undefined" && typeof Zotero.Prefs !== "undefined";

export const storage = {
  async get<T = Value>(key: string): Promise<T | null> {
    if (isZotero) {
      const raw = Zotero.Prefs.get(key);
      if (raw == null) return null;
      if (typeof raw !== "string") return raw as T;
      try {
        return JSON.parse(raw) as T;
      } catch {
        return raw as T;
      }
    }

    const result = await chrome.storage.sync.get(key);
    return (result[key] as T) ?? null;
  },

  async set(key: string, value: Value): Promise<void> {
    if (isZotero) {
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        Zotero.Prefs.set(key, value);
      } else {
        Zotero.Prefs.set(key, JSON.stringify(value));
      }
      return;
    }

    await chrome.storage.sync.set({ [key]: value });
  },

  async remove(key: string): Promise<void> {
    if (isZotero) {
      Zotero.Prefs.clear(key);
      return;
    }

    await chrome.storage.sync.remove(key);
  },
};

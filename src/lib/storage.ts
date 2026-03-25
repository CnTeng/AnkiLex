export type Value = string | number | boolean | object | Array<unknown> | null;

interface StorageAdapter {
  get<T = Value>(key: string): Promise<T | null>;
  set(key: string, value: Value): Promise<void>;
  remove(key: string): Promise<void>;
}

const zoteroStorage: StorageAdapter = {
  async get<T = Value>(key: string): Promise<T | null> {
    const raw = Zotero.Prefs.get(key);
    if (raw == null) return null;
    if (typeof raw !== "string") return raw as T;

    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as T;
    }
  },

  async set(key: string, value: Value): Promise<void> {
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      Zotero.Prefs.set(key, value);
      return;
    }

    Zotero.Prefs.set(key, JSON.stringify(value));
  },

  async remove(key: string): Promise<void> {
    Zotero.Prefs.clear(key);
  },
};

const chromeStorage: StorageAdapter = {
  async get<T = Value>(key: string): Promise<T | null> {
    const result = await chrome.storage.sync.get(key);
    return (result[key] as T) ?? null;
  },

  async set(key: string, value: Value): Promise<void> {
    await chrome.storage.sync.set({ [key]: value });
  },

  async remove(key: string): Promise<void> {
    await chrome.storage.sync.remove(key);
  },
};

const isZotero = typeof Zotero !== "undefined" && typeof Zotero.Prefs !== "undefined";
const storageAdapter = isZotero ? zoteroStorage : chromeStorage;

export const storage = {
  async get<T = Value>(key: string): Promise<T | null> {
    return storageAdapter.get<T>(key);
  },

  async set(key: string, value: Value): Promise<void> {
    await storageAdapter.set(key, value);
  },

  async remove(key: string): Promise<void> {
    await storageAdapter.remove(key);
  },
};

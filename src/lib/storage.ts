/**
 * Storage Wrapper supporting both Chrome Extension and Zotero Plugin environments.
 */

declare const Zotero: { debug: (msg: string) => void; [key: string]: unknown };
declare const chrome: {
  storage: {
    local: {
      get: (keys: string[], callback: (result: Record<string, unknown>) => void) => void;
      set: (items: Record<string, unknown>, callback: () => void) => void;
      remove: (key: string, callback: () => void) => void;
      clear: (callback: () => void) => void;
    };
  };
  runtime: {
    lastError?: unknown;
  };
};

const memoryStorage: Record<string, unknown> = {};

export const storage = {
  async get<T>(key: string): Promise<T | null> {
    if (typeof Zotero !== "undefined") {
      return (memoryStorage[key] as T) || null;
    } else if (chrome?.storage?.local) {
      return new Promise((resolve) => {
        chrome.storage.local.get([key], (result: Record<string, unknown>) => {
          resolve((result[key] as T) || null);
        });
      });
    }

    console.warn("Storage: No supported storage backend found (Zotero or Chrome). Returning null.");
    return null;
  },

  async set<T>(key: string, value: T): Promise<void> {
    if (typeof Zotero !== "undefined") {
      // Zotero Environment
      memoryStorage[key] = value;
      return Promise.resolve();
    } else if (chrome?.storage?.local) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ [key]: value }, () => {
          resolve();
        });
      });
    }
    console.warn("Storage: No supported storage backend found. Value not saved.");
    return Promise.resolve();
  },

  async remove(key: string): Promise<void> {
    if (typeof Zotero !== "undefined") {
      delete memoryStorage[key];
      return Promise.resolve();
    } else if (chrome?.storage?.local) {
      return new Promise((resolve) => {
        chrome.storage.local.remove(key, () => {
          resolve();
        });
      });
    }
    return Promise.resolve();
  },

  async clear(): Promise<void> {
    if (typeof Zotero !== "undefined") {
      for (const k in memoryStorage) {
        if (Object.hasOwn(memoryStorage, k)) {
          delete memoryStorage[k];
        }
      }
      return Promise.resolve();
    } else if (chrome?.storage?.local) {
      return new Promise((resolve) => {
        chrome.storage.local.clear(() => {
          resolve();
        });
      });
    }
    return Promise.resolve();
  },
};

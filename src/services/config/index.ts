import type {
  AnkiConfig,
  ConfigChangeEvent,
  DictionaryConfig,
  ProviderConfig,
  UserConfig,
} from "@common/types";
import { normalizeAnkiConfig } from "./anki";
import { CONFIG_STORAGE_KEY } from "./builtin";
import {
  createProvider,
  normalizeDictionaryConfig,
  removeProvider,
  reorderProvider,
  updateProvider,
} from "./dict";
import { emitConfigChange, onDidChange as onConfigDidChange } from "./event";
import { storage } from "./storage";

function normalizeUserConfig(cfg?: unknown): UserConfig {
  const config = cfg && typeof cfg === "object" ? (cfg as Record<string, unknown>) : {};

  return {
    dictionary: normalizeDictionaryConfig(config.dictionary),
    anki: normalizeAnkiConfig(config.anki),
  };
}

async function getUserConfig(): Promise<UserConfig> {
  return normalizeUserConfig(await storage.get<UserConfig>(CONFIG_STORAGE_KEY));
}

async function resetUserConfig(): Promise<UserConfig> {
  return updateUserConfig(async () => {
    await storage.remove(CONFIG_STORAGE_KEY);
    return getUserConfig();
  });
}

async function updateUserConfig(
  update: (oldConfig: UserConfig) => Promise<UserConfig> | UserConfig,
): Promise<UserConfig> {
  const oldConfig = await getUserConfig();
  const newConfig = await update(oldConfig);
  if (!storage.hasChangeEvents) emitConfigChange(oldConfig, newConfig);
  return newConfig;
}

async function updateConfigSection<K extends keyof UserConfig>(
  key: K,
  update: (config: UserConfig[K]) => UserConfig[K],
): Promise<void> {
  await updateUserConfig(async (oldConfig) => {
    const newConfig = {
      ...oldConfig,
      [key]: update(oldConfig[key]),
    };
    await storage.set(CONFIG_STORAGE_KEY, newConfig);
    return newConfig;
  });
}

export const config = {
  get: getUserConfig,
  reset: resetUserConfig,
  onDidChange: (listener: (event: ConfigChangeEvent) => void) =>
    onConfigDidChange(normalizeUserConfig, listener),

  anki: {
    get: () => getUserConfig().then((config) => config.anki),
    onDidChange: (listener: (ankiConfig: AnkiConfig) => void) =>
      onConfigDidChange(normalizeUserConfig, (event) => {
        if (event.changedKeys.includes("anki")) listener(event.newConfig.anki);
      }),
    update: (ankiConfig: AnkiConfig) => updateConfigSection("anki", () => ankiConfig),
  },

  dictionary: {
    get: () => getUserConfig().then((config) => config.dictionary),
    onDidChange: (listener: (dictionaryConfig: DictionaryConfig) => void) =>
      onConfigDidChange(normalizeUserConfig, (event) => {
        if (event.changedKeys.includes("dictionary")) listener(event.newConfig.dictionary);
      }),
    createProvider: (providerConfig: ProviderConfig) =>
      updateConfigSection("dictionary", (dictionaryConfig) =>
        createProvider(dictionaryConfig, providerConfig),
      ),
    updateProvider: (providerId: string, patch: Partial<ProviderConfig>) =>
      updateConfigSection("dictionary", (dictionaryConfig) =>
        updateProvider(dictionaryConfig, providerId, patch),
      ),
    removeProvider: (providerId: string) =>
      updateConfigSection("dictionary", (dictionaryConfig) =>
        removeProvider(dictionaryConfig, providerId),
      ),
    reorderProvider: (providerId: string, targetIndex: number) =>
      updateConfigSection("dictionary", (dictionaryConfig) =>
        reorderProvider(dictionaryConfig, providerId, targetIndex),
      ),
  },
};

import {
  CONFIG_STORAGE_KEY,
  DEFAULT_USER_CONFIG,
  type ConfigChangeEvent,
  type UserConfig,
} from "@common/model";
import { storage } from "./storage";

const listeners = new Set<(event: ConfigChangeEvent) => void>();

function getValueAtPath(value: unknown, path: string) {
  return path.split(".").reduce<unknown>((current, segment) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[segment];
  }, value);
}

function createConfigChangeEvent(
  previousConfig: UserConfig,
  currentConfig: UserConfig,
): ConfigChangeEvent {
  return {
    currentConfig,
    previousConfig,
    affects: (path: string) =>
      JSON.stringify(getValueAtPath(previousConfig, path)) !==
      JSON.stringify(getValueAtPath(currentConfig, path)),
  };
}

function emitConfigChange(previousConfig: UserConfig, currentConfig: UserConfig) {
  const event = createConfigChangeEvent(previousConfig, currentConfig);
  for (const listener of listeners) listener(event);
}

function cloneDefaultDictionaryConfig(): UserConfig["dictionary"] {
  return Object.fromEntries(
    Object.entries(DEFAULT_USER_CONFIG.dictionary).map(([languageCode, config]) => [
      languageCode,
      { ...config, providers: [...config.providers] },
    ]),
  );
}

function normalizeConfig(
  cfg?: (Partial<UserConfig> & { languages?: UserConfig["dictionary"] }) | null,
): UserConfig {
  return {
    dictionary: cfg?.dictionary ?? cfg?.languages ?? cloneDefaultDictionaryConfig(),
    anki: {
      connectUrl: cfg?.anki?.connectUrl ?? DEFAULT_USER_CONFIG.anki.connectUrl,
      noteType: cfg?.anki?.noteType ?? DEFAULT_USER_CONFIG.anki.noteType,
      fieldMap: cfg?.anki?.fieldMap
        ? { ...cfg.anki.fieldMap }
        : { ...DEFAULT_USER_CONFIG.anki.fieldMap },
    },
  };
}

export const config = {
  onDidChange(listener: (event: ConfigChangeEvent) => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  async getLanguageCodes(): Promise<string[]> {
    const cfg = await this.get();
    return Object.entries(cfg.dictionary)
      .filter(([, cfg]) => cfg.providers.length > 0)
      .map(([code]) => code);
  },

  async get(): Promise<UserConfig> {
    const cfg = await storage.get<UserConfig>(CONFIG_STORAGE_KEY);
    return normalizeConfig(cfg);
  },

  async set(cfg: UserConfig): Promise<void> {
    const previousConfig = await this.get();
    const currentConfig = normalizeConfig(cfg);
    await storage.set(CONFIG_STORAGE_KEY, currentConfig);
    emitConfigChange(previousConfig, currentConfig);
  },

  async reset(): Promise<void> {
    const previousConfig = await this.get();
    await storage.remove(CONFIG_STORAGE_KEY);
    emitConfigChange(previousConfig, await this.get());
  },
};

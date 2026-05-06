import { Event } from "@common/event";
import {
  CONFIG_STORAGE_KEY,
  type ConfigChangeEvent,
  DEFAULT_USER_CONFIG,
  type UserConfig,
} from "@common/model";
import { createConfigChangeEvent } from "@services/config/change-event";
import { storage } from "./storage";

const didChange = new Event<ConfigChangeEvent>();

function emitConfigChange(previousConfig: UserConfig, currentConfig: UserConfig) {
  didChange.emit(createConfigChangeEvent(previousConfig, currentConfig));
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
    return didChange.on(listener);
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

import type { AnkiConfig, DictionaryConfig, UserConfig } from "@common/types";

export const CONFIG_STORAGE_KEY = "extensions.onedict.config";
export const CONFIG_KEYS = ["dictionary", "anki"] as const satisfies Array<keyof UserConfig>;

export const DEFAULT_DICT_CONFIG = [
  { provider: "youdao", deck: "Default" },
  { provider: "jisho", deck: "Default" },
  { provider: "zdic", deck: "Default" },
] as const satisfies DictionaryConfig;

export const DEFAULT_ANKI_CONFIG = {
  connectUrl: "http://127.0.0.1:8765",
} as const satisfies AnkiConfig;

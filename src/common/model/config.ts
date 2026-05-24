export const CONFIG_STORAGE_KEY = "extensions.ankilex.config";

export interface AnkiConfig {
  connectUrl: string;
  noteType: string;
}

export interface LanguageConfig {
  provider: string;
  deck: string;
}

export type DictionaryConfig = Record<string, LanguageConfig>;

export interface UserConfig {
  dictionary: DictionaryConfig;
  anki: AnkiConfig;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface AnkiState {
  deckOptions: SelectOption[];
  noteType: string;
  noteTypeOptions: SelectOption[];
}

export const DEFAULT_DICTIONARY_CONFIG = {
  en: { provider: "youdao", deck: "Default" },
  ja: { provider: "jisho", deck: "Default" },
  zh: { provider: "zdic", deck: "Default" },
} satisfies DictionaryConfig;

export const DEFAULT_ANKI_CONFIG = {
  connectUrl: "http://127.0.0.1:8765",
  noteType: "Basic",
} satisfies AnkiConfig;

export const DEFAULT_USER_CONFIG = {
  dictionary: DEFAULT_DICTIONARY_CONFIG,
  anki: DEFAULT_ANKI_CONFIG,
} satisfies UserConfig;

export const EMPTY_DICTIONARY_CONFIG: LanguageConfig = {
  provider: "",
  deck: "",
};

export function getDictionaryConfig(
  dictionaryConfig: DictionaryConfig,
  languageCode: string,
): LanguageConfig {
  return dictionaryConfig[languageCode] ?? EMPTY_DICTIONARY_CONFIG;
}

export function patchDictionaryConfig(
  dictionaryConfig: DictionaryConfig,
  languageCode: string,
  patch: Partial<LanguageConfig>,
): DictionaryConfig {
  const current = getDictionaryConfig(dictionaryConfig, languageCode);
  return {
    ...dictionaryConfig,
    [languageCode]: {
      ...current,
      ...patch,
    },
  };
}

export function setDictionaryLanguageConfig(
  dictionaryConfig: DictionaryConfig,
  languageCode: string,
  patch: Partial<LanguageConfig>,
): DictionaryConfig {
  return patchDictionaryConfig(dictionaryConfig, languageCode, patch);
}

export function removeDictionaryLanguage(
  dictionaryConfig: DictionaryConfig,
  languageCode: string,
): DictionaryConfig {
  const next = { ...dictionaryConfig };
  delete next[languageCode];
  return next;
}

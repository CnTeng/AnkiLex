export const CONFIG_STORAGE_KEY = "extensions.ankilex.config";

export interface AnkiConfig {
  connectUrl: string;
  noteType: string;
  fieldMap: Record<string, string>;
}

export interface LanguageConfig {
  providers: string[];
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
  fieldNames: string[];
}

export const DEFAULT_DICTIONARY_CONFIG = {
  en: { providers: ["youdao"], deck: "Default" },
  ja: { providers: ["jisho"], deck: "Default" },
  zh: { providers: ["zdic"], deck: "Default" },
} satisfies DictionaryConfig;

export const DEFAULT_ANKI_CONFIG = {
  connectUrl: "http://127.0.0.1:8765",
  noteType: "Basic",
  fieldMap: {
    word: "word",
    definition: "definition",
    examples: "examples",
  },
} satisfies AnkiConfig;

export const DEFAULT_USER_CONFIG = {
  dictionary: DEFAULT_DICTIONARY_CONFIG,
  anki: DEFAULT_ANKI_CONFIG,
} satisfies UserConfig;

export const EMPTY_DICTIONARY_CONFIG: LanguageConfig = {
  providers: [],
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

export function addDictionaryProvider(
  dictionaryConfig: DictionaryConfig,
  languageCode: string,
  provider: string,
  deck: string,
): DictionaryConfig {
  const current = getDictionaryConfig(dictionaryConfig, languageCode);
  return patchDictionaryConfig(dictionaryConfig, languageCode, {
    deck,
    providers:
      provider && !current.providers.includes(provider)
        ? [...current.providers, provider]
        : current.providers,
  });
}

export function removeDictionaryProvider(
  dictionaryConfig: DictionaryConfig,
  languageCode: string,
  provider: string,
): DictionaryConfig {
  const current = getDictionaryConfig(dictionaryConfig, languageCode);
  return patchDictionaryConfig(dictionaryConfig, languageCode, {
    providers: current.providers.filter((item) => item !== provider),
  });
}

export function removeDictionaryLanguage(
  dictionaryConfig: DictionaryConfig,
  languageCode: string,
): DictionaryConfig {
  const next = { ...dictionaryConfig };
  delete next[languageCode];
  return next;
}

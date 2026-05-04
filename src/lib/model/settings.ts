export const STORAGE_KEY = "extensions.ankilex.settings";

export interface AnkiSettings {
  connectUrl: string;
  noteType: string;
  fieldMap: Record<string, string>;
}

export interface LanguageSetting {
  providers: string[];
  deck: string;
}

export type LanguageSettings = Record<string, LanguageSetting>;

export interface UserSettings {
  languages: LanguageSettings;
  anki: AnkiSettings;
}

export const DEFAULT_LANGUAGE_SETTINGS = {
  en: { providers: ["youdao"], deck: "Default" },
  ja: { providers: ["jisho"], deck: "Default" },
  zh: { providers: ["zdic"], deck: "Default" },
} satisfies LanguageSettings;

export const DEFAULT_ANKI_SETTINGS = {
  connectUrl: "http://127.0.0.1:8765",
  noteType: "Basic",
  fieldMap: {
    word: "word",
    definition: "definition",
    examples: "examples",
  },
} satisfies AnkiSettings;

export const DEFAULT_USER_SETTINGS = {
  languages: DEFAULT_LANGUAGE_SETTINGS,
  anki: DEFAULT_ANKI_SETTINGS,
} satisfies UserSettings;

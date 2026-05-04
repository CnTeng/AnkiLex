import { dictionary } from "@lib/dictionary";
import type { Context, LanguageSettings } from "@lib/model";
import { useSettings } from "@lib/settings";
import type { DictionaryRow } from "@lib/ui/settings";
import { eld } from "eld/medium";

function enabledLanguages(languages: LanguageSettings): string[] {
  return Object.entries(languages)
    .filter(([, settings]) => settings.providers.length > 0)
    .map(([code]) => code);
}

function detectCjkLanguage(text: string, languages: string[]): string | null {
  const languageSet = new Set(languages);
  if (/\p{Script=Han}/u.test(text) && languageSet.has("zh")) return "zh";
  if (/[\p{Script=Hiragana}\p{Script=Katakana}]/u.test(text) && languageSet.has("ja")) return "ja";
  if (/\p{Script=Hangul}/u.test(text) && languageSet.has("ko")) return "ko";
  return null;
}

function detectLanguage(word: string, languages: string[], fallback?: string): string | null {
  const languageSet = new Set(languages);
  const result = eld.detect(word);
  if (result.isReliable() && languageSet.has(result.language)) return result.language;

  const [language] =
    Object.entries(result.getScores())
      .filter(([code]) => languageSet.has(code))
      .sort(([, a], [, b]) => b - a)[0] ?? [];
  if (language) return language;

  const cjkLanguage = detectCjkLanguage(word, languages);
  if (cjkLanguage) return cjkLanguage;

  return fallback?.split("-")[0]?.trim() || null;
}

function dictionaryRows(selected: Record<string, string[]>): DictionaryRow[] {
  return dictionary.getLanguageCodes().map((languageCode) => ({
    languageCode,
    displayName: `${dictionary.getLanguageName(languageCode)} (${languageCode})`,
    providers: [
      { value: "", label: "(None)" },
      ...dictionary
        .getProvidersForLanguage(languageCode)
        .map((provider) => ({ value: provider.id, label: provider.name })),
    ],
    selectedProviders: selected[languageCode] || [],
    selectedAnkiDeck: "",
  }));
}

export const dictionaryHandlers = {
  lookup: async (data: { word: string; language?: string; context?: Context }) => {
    const currentSettings = await useSettings.get();
    const languages = enabledLanguages(currentSettings.languages);

    const language = data.language || detectLanguage(data.word, languages, data.context?.lang);
    if (!language) return null;

    const providerIds = currentSettings.languages[language]?.providers ?? [];
    if (providerIds.length === 0) return null;

    const result = await dictionary.lookupWithFallback(data.word, providerIds);
    if (!result) return null;

    result.language = language;
    if (data.context?.context) result.context = data.context.context;
    return result;
  },

  getRows: async (data: { selected: Record<string, { providers: string[]; deck: string }> }) =>
    dictionaryRows(
      Object.fromEntries(
        Object.entries(data.selected).map(([languageCode, languageSetting]) => [
          languageCode,
          languageSetting.providers,
        ]),
      ),
    ).map((row) => ({
      ...row,
      selectedAnkiDeck: data.selected[row.languageCode]?.deck || "",
    })),

  getEnabledLanguages: async () => {
    const currentSettings = await useSettings.get();
    return enabledLanguages(currentSettings.languages).map((code) => ({
      code,
      name: dictionary.getLanguageName(code),
    }));
  },
};

import { dictionary } from "@lib/dictionary";
import type { Context } from "@lib/model";
import { settings } from "@lib/settings";
import type { DictionaryRow } from "@lib/ui/settings";
import { eld } from "eld/medium";

function enabledLanguages(providers: Record<string, string>): string[] {
  return Object.entries(providers)
    .filter(([, id]) => id)
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

function dictionaryRows(selected: Record<string, string>): DictionaryRow[] {
  return dictionary.getLanguageCodes().map((languageCode) => ({
    languageCode,
    displayName: `${dictionary.getLanguageName(languageCode)} (${languageCode})`,
    providers: [
      { value: "", label: "(None)" },
      ...dictionary
        .getProvidersForLanguage(languageCode)
        .map((provider) => ({ value: provider.id, label: provider.name })),
    ],
    selectedProvider: selected[languageCode] || "",
  }));
}

export const dictionaryHandlers = {
  lookup: async (data: { word: string; language?: string; context?: Context }) => {
    const { dictionaryProviders } = await settings.get();
    const languages = enabledLanguages(dictionaryProviders);

    const language = data.language || detectLanguage(data.word, languages, data.context?.lang);
    if (!language) return null;

    const providerId = dictionaryProviders[language];
    if (!providerId) return null;

    const result = await dictionary.lookup(data.word, providerId);
    if (!result) return null;

    if (data.context?.context) result.context = data.context.context;
    return result;
  },
  getRows: async (data: { selected: Record<string, string> }) => dictionaryRows(data.selected),
  getEnabledLanguages: async () => {
    const { dictionaryProviders } = await settings.get();
    return enabledLanguages(dictionaryProviders).map((code) => ({
      code,
      name: dictionary.getLanguageName(code),
    }));
  },
};

import { dictionary } from "@lib/dictionary";
import { settings } from "@lib/settings";
import type { DictionaryRow } from "@lib/view/settings";
import { eld } from "eld/medium";

function detectLanguage(word: string, fallback?: string): string | null {
  const result = eld.detect(word);
  if (result.isReliable()) return result.language;

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
  lookup: async (data: { word: string; fallbackLanguage?: string }) => {
    const language = detectLanguage(data.word, data.fallbackLanguage);
    if (!language) return null;

    const { dictionaryProviders } = await settings.get();
    const providerId = dictionaryProviders[language];
    if (!providerId) return null;

    return dictionary.lookup(data.word, providerId);
  },
  getRows: async (data: { selected: Record<string, string> }) => dictionaryRows(data.selected),
};

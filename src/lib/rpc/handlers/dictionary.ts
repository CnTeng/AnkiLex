import { dictionary } from "@lib/dictionary";
import { settings } from "@lib/settings";
import type { DictionaryRow } from "@lib/view/settings";

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
  lookup: async (data: { word: string }) => {
    const { dictionaryProviders } = await settings.get();
    return dictionary.lookup(data.word, dictionaryProviders);
  },
  getRows: async (data: { selected: Record<string, string> }) => dictionaryRows(data.selected),
};

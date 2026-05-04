import type { DictionaryEntry, DictionaryProviderInfo } from "@lib/model";
import { getDictionaryProvider, listDictionaryProviders } from "./registry";
import "./providers/jisho";
import "./providers/youdao";
import "./providers/zdic";

const languageDisplayNames = new Intl.DisplayNames(["en"], {
  type: "language",
});

function listProviderInfos(): DictionaryProviderInfo[] {
  return listDictionaryProviders().map((provider) => ({
    id: provider.id,
    name: provider.name,
    supportedLanguages: provider.supportedLanguages,
  }));
}

export const dictionary = {
  getProvider(id: string) {
    return getDictionaryProvider(id);
  },

  getLanguageName(languageCode: string): string {
    return languageDisplayNames.of(languageCode) ?? languageCode.toUpperCase();
  },

  getLanguageCodes(): string[] {
    const infos = listProviderInfos();
    const codes = new Set(infos.flatMap((provider) => provider.supportedLanguages));
    return [...codes].filter(Boolean).sort((a, b) => a.localeCompare(b));
  },

  getProvidersForLanguage(languageCode: string): DictionaryProviderInfo[] {
    return listProviderInfos().filter((provider) =>
      provider.supportedLanguages.includes(languageCode),
    );
  },

  async lookup(word: string, providerId: string): Promise<DictionaryEntry | null> {
    const provider = getDictionaryProvider(providerId);
    if (!provider) return null;
    return provider.lookup(word);
  },

  async lookupWithFallback(word: string, providerIds: string[]): Promise<DictionaryEntry | null> {
    for (const providerId of providerIds) {
      const result = await this.lookup(word, providerId).catch((error: Error) => {
        console.warn(`[Dictionary Lookup Error] ${providerId}:`, error);
        return null;
      });
      if (result) return result;
    }
    return null;
  },
};

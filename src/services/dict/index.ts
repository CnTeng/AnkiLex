import type { DictionaryEntry, DictionaryProviderInfo } from "@common/types";
import { getDictionaryProvider, listDictionaryProviders } from "./registry";
import "./providers/jisho";
import "./providers/youdao";
import "./providers/zdic";

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

  getProviders(): DictionaryProviderInfo[] {
    return listProviderInfos();
  },

  async lookup(word: string, providerId: string): Promise<DictionaryEntry | null> {
    const provider = getDictionaryProvider(providerId);
    if (!provider) return null;
    return provider.lookup(word);
  },

  async lookupWithFallback(word: string, providerIds: string[]): Promise<DictionaryEntry | null> {
    for (const providerId of providerIds) {
      const result = await this.lookup(word, providerId).catch((_) => {
        return null;
      });
      if (result) return result;
    }
    return null;
  },
};

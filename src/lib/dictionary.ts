import type { DictionaryResult, IDictionaryProvider, LookupOptions } from "./models";
import { settings } from "./settings";

const providers: Map<string, IDictionaryProvider> = new Map();

export const dictionary = {
  register(provider: IDictionaryProvider) {
    providers.set(provider.id, provider);
  },

  getProvider(id: string) {
    return providers.get(id);
  },

  getAllProviders() {
    return Array.from(providers.values()).map((p) => ({
      id: p.id,
      name: p.name,
    }));
  },

  async lookup(
    word: string,
    dictionaryId: string,
    options?: LookupOptions,
  ): Promise<DictionaryResult | null> {
    const provider = providers.get(dictionaryId);
    if (!provider) return null;
    return provider.lookup(word, options);
  },

  async lookupEnabled(word: string, options?: LookupOptions): Promise<DictionaryResult[]> {
    const s = await settings.get();
    const lang = options?.sourceLanguage || "en"; // Default to English if not specified
    const providerId = s.languageDictionaries[lang];

    if (!providerId) {
      // Fallback: if no specific provider for this language, try English or just return empty
      // Or maybe check if we have a default/fallback mechanism
      return [];
    }

    const result = await this.lookup(word, providerId, options);
    return result ? [result] : [];
  },
};

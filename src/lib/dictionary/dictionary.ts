import type { DictionaryEntry, IDictionaryProvider, LookupOptions } from "../model";
import { settings } from "../settings";
import { YoudaoDictionary } from "./providers";

const providers: Map<string, IDictionaryProvider> = new Map();

export const dictionary = {
  register(provider: IDictionaryProvider) {
    providers.set(provider.id, provider);
  },

  registerDictionaries() {
    dictionary.register(new YoudaoDictionary());
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
  ): Promise<DictionaryEntry | null> {
    const provider = providers.get(dictionaryId);
    if (!provider) return null;
    return provider.lookup(word, options);
  },

  async lookupEnabled(word: string, options?: LookupOptions): Promise<DictionaryEntry[]> {
    const { languageDictionaries } = await settings.get();
    const lang = options?.sourceLanguage ?? "en";
    const providerId = languageDictionaries[lang];

    if (!providerId) return [];

    const result = await this.lookup(word, providerId, options);
    return result ? [result] : [];
  },
};

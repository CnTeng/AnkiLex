import type { DictionaryEntry, IDictionaryProvider } from "../model";
import { YoudaoDictionary } from "./providers";

const providers: Map<string, IDictionaryProvider> = new Map();

function register(provider: IDictionaryProvider) {
  providers.set(provider.id, provider);
}

export const dictionary = {
  registerAll() {
    register(new YoudaoDictionary());
  },

  getProvider(id: string): IDictionaryProvider | undefined {
    return providers.get(id);
  },

  getProviders() {
    return Array.from(providers.values()).map((p) => ({
      id: p.id,
      name: p.name,
    }));
  },

  async lookup(word: string, dictionaryId: string): Promise<DictionaryEntry | null> {
    const provider = providers.get(dictionaryId);
    if (!provider) return null;
    return provider.lookup(word);
  },
};

dictionary.registerAll();

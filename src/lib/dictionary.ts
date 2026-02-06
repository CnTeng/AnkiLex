import { YoudaoDictionary } from "./providers";
import { settings } from "./settings";

const providers: Map<string, IDictionaryProvider> = new Map();

export interface DictionaryEntry {
  word: string;
  provider: string;
  definitions: Definition[];
  pronunciations: Pronunciation[];
  metadata?: Record<string, unknown>;
}

export interface Definition {
  partOfSpeech?: string;
  text: string;
  examples?: Example[];
}

export interface Example {
  text: string;
  translation?: string;
}

export interface Pronunciation {
  text?: string;
  audioUrl?: string;
  type?: string; // 'uk', 'us', 'jp', etc.
}

export interface LookupOptions {
  sourceLanguage?: string;
  targetLanguage?: string;
}

export interface IDictionaryProvider {
  readonly id: string;
  readonly name: string;
  readonly supportedLanguages: string[];

  lookup(word: string, options?: LookupOptions): Promise<DictionaryEntry | null>;
}

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

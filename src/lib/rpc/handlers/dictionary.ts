import { dictionary } from "@lib/dictionary";
import { settings } from "@lib/settings";

function resolveProviderId(language: string, preferredId?: string): string | null {
  if (preferredId && dictionary.getProvider(preferredId)) {
    return preferredId;
  }
  const providers = dictionary.getProviders();
  return providers.length > 0 ? providers[0].id : null;
}

export const dictionaryHandlers = {
  lookup: async (data: { word: string }) => {
    const { dictionaryProviders: languageDictionaries } = await settings.get();
    const lang = "en";
    const providerId = resolveProviderId(lang, languageDictionaries[lang]);
    if (!providerId) return null;
    return dictionary.lookup(data.word, providerId);
  },
  getProviders: async () => ({ providers: dictionary.getProviders() }),
};

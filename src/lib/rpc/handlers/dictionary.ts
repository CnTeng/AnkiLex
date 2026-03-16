import { dictionary } from "@lib/dictionary";
import { settings } from "@lib/settings";
import { eld } from "eld/medium";

export const dictionaryHandlers = {
  lookup: async (data: { word: string }) => {
    const { dictionaryProviders } = await settings.get();

    const res = eld.detect(data.word);
    const lang = res.isReliable() ? res.language : "en";

    const providerId =
      dictionaryProviders[lang] && dictionary.getProvider(dictionaryProviders[lang])
        ? dictionaryProviders[lang]
        : (dictionary.getProviders()[0]?.id ?? null);
    if (!providerId) return null;

    return dictionary.lookup(data.word, providerId);
  },

  getProviders: async () => ({ providers: dictionary.getProviders() }),
};

import type { DictionaryEntry, DictionaryProviderInfo } from "@lib/model";
import { eld } from "eld/medium";
import { getDictionaryProvider, listDictionaryProviders } from "./registry";
import "./youdao";
import "./zdic";

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

function resolveProviderId(
  providerInfos: DictionaryProviderInfo[],
  languageCode: string,
  preferredProviderId?: string | null,
): string | null {
  if (preferredProviderId) {
    const preferredProvider = getDictionaryProvider(preferredProviderId);
    if (preferredProvider?.supportedLanguages.includes(languageCode)) return preferredProviderId;
  }

  return (
    providerInfos.find((provider) => provider.supportedLanguages.includes(languageCode))?.id ??
    providerInfos[0]?.id ??
    null
  );
}

function detectLanguage(word: string): string {
  const result = eld.detect(word);
  return result.isReliable() ? result.language : "en";
}

async function lookupWithProviderId(
  word: string,
  dictionaryId: string,
): Promise<DictionaryEntry | null> {
  const provider = getDictionaryProvider(dictionaryId);
  if (!provider) return null;
  return provider.lookup(word);
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

  async lookup(
    word: string,
    providersByLanguage: Record<string, string> = {},
  ): Promise<DictionaryEntry | null> {
    const languageCode = detectLanguage(word);
    const providerId = resolveProviderId(
      listProviderInfos(),
      languageCode,
      providersByLanguage[languageCode],
    );
    if (!providerId) return null;
    return lookupWithProviderId(word, providerId);
  },
};

import type {
  Context,
  DictionaryConfig,
  DictionaryEntry,
  DictionaryProviderInfo,
  IAnkiService,
  IConfigService,
  IDictionaryService,
  ProviderConfig,
} from "@common/types";
import { type AnkiClient, createAnkiClient } from "@services/anki";
import { config as configService } from "@services/config";
import { dictionary } from "@services/dict";
import { eld } from "eld/medium";

function detectCjkLanguage(text: string, languages: string[]): string | null {
  const languageSet = new Set(languages);
  if (/\p{Script=Han}/u.test(text) && languageSet.has("zh")) return "zh";
  if (/\p{Script=Hiragana}\p{Script=Katakana}/u.test(text) && languageSet.has("ja")) return "ja";
  if (/\p{Script=Hangul}/u.test(text) && languageSet.has("ko")) return "ko";
  return null;
}

function detectLanguage(word: string, languages: string[], fallback?: string): string | null {
  const languageSet = new Set(languages);
  const result = eld.detect(word);
  if (result.isReliable() && languageSet.has(result.language)) return result.language;

  const [language] =
    Object.entries(result.getScores())
      .filter(([code]) => languageSet.has(code))
      .sort(([, a], [, b]) => b - a)[0] ?? [];
  if (language) return language;

  const cjkLanguage = detectCjkLanguage(word, languages);
  if (cjkLanguage) return cjkLanguage;

  return fallback?.split("-")[0]?.trim() || null;
}

function resolveSelectedLanguage(language: string | undefined, languages: string[]) {
  const normalizedLanguage = language?.split("-")[0]?.trim();
  if (!normalizedLanguage) return null;
  return languages.includes(normalizedLanguage) ? normalizedLanguage : null;
}

function resolveConfiguredProvider(language: string, dictionaryConfig: DictionaryConfig) {
  return dictionaryConfig.filter(
    (config) =>
      !!config.provider &&
      dictionary.getProvider(config.provider)?.supportedLanguages.includes(language),
  );
}

function resolveLookupLanguage(word: string, context: Context | undefined, languages: string[]) {
  return (
    resolveSelectedLanguage(context?.lang, languages) ??
    detectLanguage(word, languages, context?.lang)
  );
}

function resolveLookupProviders(
  context: Context | undefined,
  language: string | null,
  dictionaryConfig: DictionaryConfig,
) {
  const selectedProvider = context?.provider?.trim();
  if (selectedProvider) {
    return [
      {
        provider: selectedProvider,
        deck: "",
      } satisfies ProviderConfig,
    ];
  }

  if (!language) return [];
  return resolveConfiguredProvider(language, dictionaryConfig);
}

function getProviderRule(
  dictionaryConfig: DictionaryConfig,
  providerId: string | undefined,
  language: string | undefined,
) {
  if (!providerId) return null;

  return (
    dictionaryConfig.find(
      (config) =>
        config.provider === providerId &&
        (!language ||
          dictionary.getProvider(config.provider)?.supportedLanguages.includes(language)),
    ) ??
    dictionaryConfig.find((config) => config.provider === providerId) ??
    null
  );
}

class LocalDictionaryService implements IDictionaryService {
  constructor(private readonly configService: IConfigService) {}

  async getProviders(): Promise<DictionaryProviderInfo[]> {
    return dictionary.getProviders();
  }

  async lookup(word: string, context?: Context): Promise<DictionaryEntry | null> {
    const userConfig = await this.configService.get();
    const languages = [
      ...new Set(
        userConfig.dictionary.flatMap(
          (config) => dictionary.getProvider(config.provider)?.supportedLanguages ?? [],
        ),
      ),
    ];
    const language = resolveLookupLanguage(word, context, languages);
    const lookupProviders = resolveLookupProviders(context, language, userConfig.dictionary);
    const providerIds = lookupProviders.map((config) => config.provider).filter(Boolean);
    if (providerIds.length === 0) return null;

    const result = await dictionary.lookupWithFallback(word, providerIds);
    if (!result) return null;

    if (language) result.metadata.language = language;
    if (context?.context) result.context = context.context;
    return result;
  }
}

class LocalAnkiService implements IAnkiService {
  constructor(private readonly configService: IConfigService) {}

  private async getAnki(): Promise<AnkiClient> {
    const userConfig = await this.configService.get();
    return createAnkiClient(userConfig.anki.connectUrl);
  }

  async createNote(result: DictionaryEntry): Promise<void> {
    const userConfig = await this.configService.get();
    const providerRule = getProviderRule(
      userConfig.dictionary,
      result.metadata.providerId,
      result.metadata.language,
    );
    if (!providerRule?.deck) return;

    await (await this.getAnki()).createNote(providerRule.deck, result);
  }

  async getDecks(): Promise<string[]> {
    return this.getAnki().then((anki) => anki.getDecks());
  }

  async syncTemplate(): Promise<void> {
    await (await this.getAnki()).syncTemplate();
  }
}

export class LocalPlatformServices {
  readonly config: IConfigService = configService;
  readonly dictionary = new LocalDictionaryService(this.config);
  readonly anki: IAnkiService = new LocalAnkiService(this.config);
}

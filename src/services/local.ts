import type {
  AnkiModel,
  ConfigChangeEvent,
  Context,
  DictionaryEntry,
  DictionaryLanguageInfo,
  IAnkiService,
  IConfigService,
  IDictionaryService,
  UserConfig,
} from "@common/model";
import {
  type AnkiConnectEnv,
  addNoteFromEntry,
  createModel as createAnkiModel,
  deckNames,
  modelNames,
  updateModel as updateAnkiModel,
} from "@services/anki";
import { config } from "@services/config";
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

function resolveProviderLanguage(providerId: string, languages: string[]) {
  return dictionary
    .getProvider(providerId)
    ?.supportedLanguages.find((language) => languages.includes(language));
}

function resolveProviderSelectedLanguage(
  providerId: string,
  language: string | undefined,
  languages: string[],
) {
  const selectedLanguage = resolveSelectedLanguage(language, languages);
  if (!selectedLanguage) return null;

  const supportedLanguages = dictionary.getProvider(providerId)?.supportedLanguages ?? [];
  return supportedLanguages.includes(selectedLanguage) ? selectedLanguage : null;
}

function resolveConfiguredProvider(
  word: string,
  context: Context | undefined,
  userConfig: UserConfig,
  languages: string[],
) {
  const resolvedLanguage =
    resolveSelectedLanguage(context?.lang, languages) ??
    detectLanguage(word, languages, context?.lang);
  if (!resolvedLanguage) return null;

  return {
    providerId: userConfig.dictionary[resolvedLanguage]?.provider ?? null,
    language: resolvedLanguage,
  };
}

function resolveLookupTarget(
  word: string,
  context: Context | undefined,
  userConfig: UserConfig,
  languages: string[],
) {
  const selectedProvider = context?.provider?.trim();
  if (!selectedProvider) return resolveConfiguredProvider(word, context, userConfig, languages);

  return {
    providerId: selectedProvider,
    language:
      resolveProviderSelectedLanguage(selectedProvider, context?.lang, languages) ??
      resolveProviderLanguage(selectedProvider, languages) ??
      detectLanguage(word, languages, context?.lang),
  };
}

class LocalConfigService implements IConfigService {
  onDidChange(listener: (event: ConfigChangeEvent) => void) {
    return config.onDidChange(listener);
  }

  async get(): Promise<UserConfig> {
    return config.get();
  }

  async set(userConfig: UserConfig): Promise<void> {
    await config.set(userConfig);
  }

  async update(partial: Partial<UserConfig>): Promise<void> {
    const current = await config.get();
    await config.set({
      dictionary: partial.dictionary ?? current.dictionary,
      anki: partial.anki ?? current.anki,
    });
  }

  async reset(): Promise<UserConfig> {
    await config.reset();
    return config.get();
  }

  async getLanguageCodes(): Promise<string[]> {
    return config.getLanguageCodes();
  }
}

class LocalDictionaryService implements IDictionaryService {
  constructor(private readonly configService: IConfigService) {}

  async getLanguages(): Promise<DictionaryLanguageInfo[]> {
    return dictionary.getLanguages();
  }

  async lookup(word: string, context?: Context): Promise<DictionaryEntry | null> {
    const userConfig = await this.configService.get();
    const languages = await this.configService.getLanguageCodes();
    const target = resolveLookupTarget(word, context, userConfig, languages);
    if (!target?.providerId) return null;

    const result = await dictionary.lookup(word, target.providerId);
    if (!result) return null;

    if (target.language) result.language = target.language;
    if (context?.context) result.context = context.context;
    return result;
  }
}

class LocalAnkiService implements IAnkiService {
  constructor(private readonly configService: IConfigService) {}

  private async getEnv(): Promise<AnkiConnectEnv> {
    const userConfig = await this.configService.get();
    return { baseUrl: userConfig.anki.connectUrl, fetch };
  }

  async addNote(result: DictionaryEntry): Promise<unknown> {
    const userConfig = await this.configService.get();
    if (!result.language) return undefined;

    const languageConfig = userConfig.dictionary[result.language];
    if (!languageConfig) return undefined;

    return addNoteFromEntry(
      { baseUrl: userConfig.anki.connectUrl, fetch },
      languageConfig.deck,
      userConfig.anki.noteType,
      result,
    );
  }

  async getDecks(): Promise<string[]> {
    return this.getEnv().then((env) => deckNames(env));
  }

  async getModels(): Promise<string[]> {
    return this.getEnv().then((env) => modelNames(env));
  }

  async createModel(model: AnkiModel): Promise<void> {
    await createAnkiModel(await this.getEnv(), model);
  }

  async updateModel(model: AnkiModel): Promise<void> {
    await updateAnkiModel(await this.getEnv(), model);
  }
}

export class LocalPlatformServices {
  readonly config = new LocalConfigService();
  readonly dictionary = new LocalDictionaryService(this.config);
  readonly anki: IAnkiService = new LocalAnkiService(this.config);
}

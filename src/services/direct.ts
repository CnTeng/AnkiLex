import { AnkiClient } from "@services/anki";
import { config } from "@services/config";
import { dictionary } from "@services/dict";
import type {
  AnkiModel,
  ConfigChangeEvent,
  DictionaryEntry,
  DictionaryLanguageInfo,
  DictionaryLookupParams,
  IAnkiService,
  IConfigService,
  IDictionaryService,
  PlatformServices,
  UserConfig,
} from "@common/model";
import { ANKI_DEFAULT_MODEL_NAME } from "@common/model";
import { eld } from "eld/medium";

function detectCjkLanguage(text: string, languages: string[]): string | null {
  const languageSet = new Set(languages);
  if (/\p{Script=Han}/u.test(text) && languageSet.has("zh")) return "zh";
  if (/[\p{Script=Hiragana}\p{Script=Katakana}]/u.test(text) && languageSet.has("ja")) return "ja";
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

async function createClient() {
  const userConfig = await config.get();
  return new AnkiClient(userConfig.anki.connectUrl);
}

class DirectConfigService implements IConfigService {
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

class DirectDictionaryService implements IDictionaryService {
  constructor(private readonly configService: IConfigService) {}

  async getLanguages(): Promise<DictionaryLanguageInfo[]> {
    return dictionary.getLanguages();
  }

  async lookup({
    word,
    language,
    context,
  }: DictionaryLookupParams): Promise<DictionaryEntry | null> {
    const userConfig = await this.configService.get();
    const languages = await this.configService.getLanguageCodes();
    const resolvedLanguage = language || detectLanguage(word, languages, context?.lang);
    if (!resolvedLanguage) return null;

    const providerIds = userConfig.dictionary[resolvedLanguage]?.providers ?? [];
    if (providerIds.length === 0) return null;

    const result = await dictionary.lookupWithFallback(word, providerIds);
    if (!result) return null;

    result.language = resolvedLanguage;
    if (context?.context) result.context = context.context;
    return result;
  }
}

class DirectAnkiService implements IAnkiService {
  constructor(
    private readonly configService: IConfigService,
    private readonly getDefaultModel: () => AnkiModel,
  ) {}

  async addNote(result: DictionaryEntry): Promise<unknown> {
    const userConfig = await this.configService.get();
    if (!result.language) return undefined;

    const languageConfig = userConfig.dictionary[result.language];
    if (!languageConfig) return undefined;

    const client = new AnkiClient(userConfig.anki.connectUrl);
    return client.addNoteFromEntry(
      languageConfig.deck,
      userConfig.anki.noteType,
      userConfig.anki.fieldMap,
      result,
    );
  }

  async getDecks(): Promise<string[]> {
    return createClient().then((client) => client.getDeckNames());
  }

  async getModels(): Promise<string[]> {
    return createClient().then((client) => client.getModelNames());
  }

  async getModelFields(modelName: string): Promise<string[]> {
    return createClient().then((client) => client.getModelFieldNames(modelName));
  }

  async syncModel(): Promise<void> {
    const client = await createClient();
    const model = this.getDefaultModel();
    const models = await client.getModelNames();

    if (models.includes(ANKI_DEFAULT_MODEL_NAME)) {
      await client.updateModel(model);
      return;
    }

    await client.createModel(model);
  }
}

export function createDirectPlatformServices({
  getDefaultModel,
}: {
  getDefaultModel: () => AnkiModel;
}): PlatformServices {
  const configService = new DirectConfigService();
  return {
    config: configService,
    dictionary: new DirectDictionaryService(configService),
    anki: new DirectAnkiService(configService, getDefaultModel),
  };
}

import type { AnkiConfig, DictionaryConfig, ProviderConfig, UserConfig } from "./config";
import type { Context } from "./context";
import type { DictionaryEntry, DictionaryProviderInfo } from "./dict";

export interface ConfigChangeEvent {
  oldConfig: UserConfig;
  newConfig: UserConfig;
  changedKeys: Array<keyof UserConfig>;
}

export interface IAnkiConfigService {
  get(): Promise<AnkiConfig>;
  onDidChange(listener: (config: AnkiConfig) => void): () => void;
  update(ankiConfig: AnkiConfig): Promise<void>;
}

export interface IDictionaryConfigService {
  get(): Promise<DictionaryConfig>;
  onDidChange(listener: (config: DictionaryConfig) => void): () => void;
  createProvider(providerConfig: ProviderConfig): Promise<void>;
  updateProvider(providerId: string, patch: Partial<ProviderConfig>): Promise<void>;
  removeProvider(providerId: string): Promise<void>;
  reorderProvider(providerId: string, targetIndex: number): Promise<void>;
}

export interface IConfigService {
  get(): Promise<UserConfig>;
  reset(): Promise<UserConfig>;
  onDidChange(listener: (event: ConfigChangeEvent) => void): () => void;
  anki: IAnkiConfigService;
  dictionary: IDictionaryConfigService;
}

export interface IDictionaryService {
  getProviders(): Promise<DictionaryProviderInfo[]>;
  lookup(word: string, context?: Context): Promise<DictionaryEntry | null>;
}

export interface IAnkiService {
  createNote(result: DictionaryEntry): Promise<void>;
  getDecks(): Promise<string[]>;
  syncTemplate(): Promise<void>;
}

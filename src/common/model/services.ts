import type { AnkiModel } from "./anki";
import type { UserConfig } from "./config";
import type { Context } from "./context";
import type { DictionaryEntry, DictionaryLanguageInfo } from "./dictionary";

export interface ConfigChangeEvent {
  currentConfig: UserConfig;
  previousConfig: UserConfig;
  affects(path: string): boolean;
}

export interface IConfigService {
  onDidChange(listener: (event: ConfigChangeEvent) => void): () => void;
  get(): Promise<UserConfig>;
  set(config: UserConfig): Promise<void>;
  update(partial: Partial<UserConfig>): Promise<void>;
  reset(): Promise<UserConfig>;
  getLanguageCodes(): Promise<string[]>;
}

export interface IDictionaryService {
  getLanguages(): Promise<DictionaryLanguageInfo[]>;
  lookup(word: string, context?: Context): Promise<DictionaryEntry | null>;
}

export interface IAnkiService {
  addNote(result: DictionaryEntry): Promise<unknown>;
  getDecks(): Promise<string[]>;
  getModels(): Promise<string[]>;
  getModelFields(modelName: string): Promise<string[]>;
  createModel(model: AnkiModel): Promise<void>;
  updateModel(model: AnkiModel): Promise<void>;
}

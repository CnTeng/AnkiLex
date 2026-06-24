export interface IDictionaryProvider {
  readonly id: string;
  readonly name: string;
  readonly supportedLanguages: string[];

  lookup(word: string): Promise<DictionaryEntry | null>;
  parseDocument(doc: Document): DictionaryEntry | null;
}

export interface DictionaryProviderInfo {
  id: string;
  name: string;
  supportedLanguages: string[];
}

export interface DictionaryEntry {
  word: string;
  definitions: Definition[];
  pronunciations: Pronunciation[];
  metadata: Metadata;
  context?: string;
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

export interface Metadata extends Record<string, unknown> {
  providerId: string;
  providerName: string;
  language?: string;
  tags?: string[];
  frequency?: number;
}

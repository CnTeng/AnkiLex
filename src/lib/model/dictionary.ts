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

export interface DictionaryLookupRequest {
  word: string;
  providerId: string;
}

export interface DictionaryEntry {
  word: string;
  provider: string;
  definitions: Definition[];
  pronunciations: Pronunciation[];
  metadata?: Record<string, unknown>;
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

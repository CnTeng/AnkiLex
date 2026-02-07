export interface IDictionaryProvider {
  readonly id: string;
  readonly name: string;
  readonly supportedLanguages: string[];

  lookup(word: string, options?: LookupOptions): Promise<DictionaryEntry | null>;
}

export interface DictionaryEntry {
  word: string;
  provider: string;
  definitions: Definition[];
  pronunciations: Pronunciation[];
  metadata?: Record<string, unknown>;
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

export interface LookupOptions {
  sourceLanguage?: string;
  targetLanguage?: string;
}

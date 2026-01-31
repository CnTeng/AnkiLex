/**
 * Core data models for AnkiLex Browser Extension
 * Following Bitwarden-style architecture
 */

// Dictionary Models
export interface DictionaryResult {
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

// Anki Models
export interface AnkiNote {
  deckName: string;
  modelName: string;
  fields: Record<string, string>;
  tags?: string[];
  audio?: AnkiMedia[];
  picture?: AnkiMedia[];
}

export interface AnkiMedia {
  url?: string;
  filename?: string;
  data?: string;
  fields?: string[];
}

export interface AnkiConnectResponse<T = unknown> {
  result: T;
  error: string | null;
}

// Settings Models
export interface AnkiLexSettings {
  // Dictionary settings
  languageDictionaries: Record<string, string>; // e.g. { 'en': 'youdao', 'jp': '...'}

  // Anki settings
  ankiConnectUrl: string;
  defaultDeck: string;
  defaultNoteType: string;
  fieldMappings: Record<string, string>;

  // UI settings
  popupWidth: number;
  popupHeight: number;
  theme: "light" | "dark" | "auto";

  // Behavior settings
  autoLookup: boolean;
  contextMenuEnabled: boolean;
}

// Dictionary Provider Interface
export interface IDictionaryProvider {
  readonly id: string;
  readonly name: string;
  readonly supportedLanguages: string[];

  lookup(word: string, options?: LookupOptions): Promise<DictionaryResult>;
  isAvailable(): Promise<boolean>;
}

export interface LookupOptions {
  sourceLanguage?: string;
  targetLanguage?: string;
  includeAudio?: boolean;
}

// Storage Keys
export const StorageKeys = {
  SETTINGS: "ankilex_settings",
  HISTORY: "ankilex_history",
  FAVORITES: "ankilex_favorites",
} as const;

// Default Settings
export const DEFAULT_SETTINGS: AnkiLexSettings = {
  languageDictionaries: {
    en: "youdao",
  },
  ankiConnectUrl: "http://127.0.0.1:8765",
  defaultDeck: "Default",
  defaultNoteType: "Basic",
  fieldMappings: {
    Front: "word",
    Back: "definition",
  },
  popupWidth: 400,
  popupHeight: 600,
  theme: "auto",
  autoLookup: true,
  contextMenuEnabled: true,
};

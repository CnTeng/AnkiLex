export interface AnkiModelTemplate {
  Name: string;
  Front: string;
  Back: string;
}

export interface AnkiModel {
  modelName: string;
  inOrderFields: string[];
  css: string;
  cardTemplates: AnkiModelTemplate[];
}

export interface AnkiMedia {
  url?: string;
  filename?: string;
  fields?: string[];
}

export interface AnkiNote {
  deckName: string;
  modelName: string;
  fields: Record<string, string>;
  tags?: string[];
  audio?: AnkiMedia[];
  picture?: AnkiMedia[];
}

export const ANKI_DEFAULT_MODEL_NAME = "Anki-Lex Modern";

export const ANKI_DEFAULT_MODEL_FIELDS = [
  "word",
  "pronunciations",
  "audio",
  "definition",
  "examples",
  "context",
  "provider",
  "metadata",
  "data",
] as const;

export interface AnkiConnectRequest {
  action: string;
  version: number;
  params: Record<string, unknown>;
}

export interface AnkiConnectResponse<T> {
  result: T;
  error: string | null;
}

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

export const ANKI_DEFAULT_MODEL_FIELDS: string[] = [
  "word",
  "pronunciations",
  "audio",
  "definition",
  "examples",
  "context",
  "provider",
  "metadata",
  "data",
];

export function guessAnkiModelField(fieldName: string) {
  const lowered = fieldName.toLowerCase();
  return ANKI_DEFAULT_MODEL_FIELDS.find((fieldId) => lowered.includes(fieldId));
}

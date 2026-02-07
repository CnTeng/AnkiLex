export const DEFAULT_ANKI_URL = "http://127.0.0.1:8765";

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

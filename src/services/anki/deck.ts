import type { AnkiRequest } from "./request";

export function getDecks(request: AnkiRequest): Promise<string[]> {
  return request<string[]>("deckNames");
}

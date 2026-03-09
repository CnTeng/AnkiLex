import type { AnkiNote } from "@lib/model";
import { invoke } from "./client";

export async function isAvailable(): Promise<boolean> {
  try {
    await invoke<number>("version");
    return true;
  } catch (e) {
    console.warn("AnkiConnect check failed:", e);
    return false;
  }
}

export async function addNote(note: AnkiNote): Promise<number> {
  return invoke<number>("addNote", { note });
}

export async function findNotes(query: string): Promise<number[]> {
  return invoke<number[]>("findNotes", { query });
}

export async function getDecks(): Promise<string[]> {
  return invoke<string[]>("deckNames");
}

export async function getModels(): Promise<string[]> {
  return invoke<string[]>("modelNames");
}

export async function getModelFields(modelName: string): Promise<string[]> {
  return invoke<string[]>("modelFieldNames", { modelName });
}

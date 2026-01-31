import type { AnkiConnectResponse, AnkiNote, DictionaryResult } from "./models";
import { settings } from "./settings";

const DEFAULT_ANKI_URL = "http://127.0.0.1:8765";

async function invoke<T>(action: string, params: Record<string, unknown> = {}): Promise<T> {
  const currentSettings = await settings.get();
  const url = currentSettings.ankiConnectUrl || DEFAULT_ANKI_URL;

  try {
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify({ action, version: 6, params }),
    });

    if (!response.ok) {
      throw new Error(`AnkiConnect request failed: ${response.statusText}`);
    }

    const json: AnkiConnectResponse<T> = await response.json();
    if (json.error) {
      throw new Error(json.error);
    }

    return json.result;
  } catch (error: unknown) {
    if (error instanceof Error && error.message?.includes("Failed to fetch")) {
      throw new Error(
        "Could not connect to Anki. Please check if Anki is running and AnkiConnect is installed.",
      );
    }
    throw error;
  }
}

export const anki = {
  async isAvailable(): Promise<boolean> {
    try {
      await invoke("version");
      return true;
    } catch (e) {
      console.warn("AnkiConnect check failed:", e);
      return false;
    }
  },

  async getDecks(): Promise<string[]> {
    return invoke<string[]>("deckNames");
  },

  async getNoteTypes(): Promise<string[]> {
    return invoke<string[]>("modelNames");
  },

  async getFields(modelName: string): Promise<string[]> {
    return invoke<string[]>("modelFieldNames", { modelName });
  },

  async addNote(note: AnkiNote): Promise<number> {
    return invoke<number>("addNote", { note });
  },

  async createNoteFromResult(
    result: DictionaryResult,
    options?: { deck?: string; noteType?: string; context?: string },
    defIndex?: number,
  ): Promise<number> {
    const currentSettings = await settings.get();

    const note: AnkiNote = {
      deckName: options?.deck || currentSettings.defaultDeck,
      modelName: options?.noteType || currentSettings.defaultNoteType,
      fields: {},
      tags: ["ankilex"],
    };

    // Determine which definitions to use
    // If defIndex is provided, use only that definition
    // Otherwise, use all definitions (legacy behavior or full-word add)
    const definitionsToUse =
      typeof defIndex === "number" && result.definitions[defIndex]
        ? [result.definitions[defIndex]]
        : result.definitions;

    // Simple mapping logic
    Object.entries(currentSettings.fieldMappings).forEach(([ankiField, lexField]) => {
      if (lexField === "word") note.fields[ankiField] = result.word;
      if (lexField === "context") note.fields[ankiField] = options?.context || "";
      if (lexField === "definition") {
        note.fields[ankiField] = definitionsToUse
          .map((d) => {
            let html = "";
            if (d.partOfSpeech) html += `<b>(${d.partOfSpeech})</b> `;
            html += d.text;
            // Add examples if available
            if (d.examples && d.examples.length > 0) {
              html += "<ul>";
              d.examples.forEach((ex) => {
                html += `<li>${ex.text}${ex.translation ? ` - <span style="color:#666">${ex.translation}</span>` : ""}</li>`;
              });
              html += "</ul>";
            }
            return html;
          })
          .join("<hr>"); // Separator if multiple definitions
      }

      // We could add more specific fields here later, e.g.
      // if (lexField === 'audio') ...
      // if (lexField === 'ipa') ...
    });

    return this.addNote(note);
  },
};

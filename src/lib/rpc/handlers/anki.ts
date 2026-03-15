import { anki } from "@lib/anki";
import type { AnkiNote, DictionaryEntry } from "@lib/model";

export const ankiHandlers = {
  check: async () => ({ available: await anki.isAvailable() }),
  getDecks: async () => ({ decks: await anki.getDecks() }),
  getModels: async () => ({ noteTypes: await anki.getModels() }),
  getModelFields: async (data: { modelName: string }) => ({
    fields: await anki.getModelFields(data.modelName),
  }),
  addNote: async (data: { note: AnkiNote }) => ({ noteId: await anki.addNote(data.note) }),
  createNoteFromResult: async (data: {
    result: DictionaryEntry;
    options: Record<string, unknown>;
    context: string;
    defIndex?: number;
  }) => {
    const result = await anki.createNoteFromResult(
      data.result,
      {
        ...data.options,
        context: data.context,
      },
      data.defIndex,
    );
    return { noteId: Array.isArray(result) ? result[0] : result };
  },
  setupDefaultModel: async () => anki.setupDefaultModel(),
};

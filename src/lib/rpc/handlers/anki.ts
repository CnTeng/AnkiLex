import { anki, applyLexFieldGuesses, LEX_FIELD_OPTIONS } from "@lib/anki";
import type { AnkiNote, DictionaryEntry } from "@lib/model";
import type { FieldMappingRow } from "@lib/ui/settings";

function fieldMappingRows(fields: string[], current: Record<string, string>): FieldMappingRow[] {
  const mapped = applyLexFieldGuesses(fields, current);
  return fields.map((fieldName) => ({
    fieldName,
    options: LEX_FIELD_OPTIONS,
    selectedValue: mapped[fieldName] || "",
  }));
}

export const ankiHandlers = {
  check: () => anki.isAvailable(),
  getDecks: () => anki.getDecks(),
  getModels: () => anki.getModels(),
  getModelFields: (data: { modelName: string }) => anki.getModelFields(data.modelName),
  getFieldMappingRows: async (data: { noteType: string; currentMap: Record<string, string> }) => {
    if (!data.noteType) return null;
    const fields = await anki.getModelFields(data.noteType);
    if (fields.length === 0) return null;
    return fieldMappingRows(fields, data.currentMap);
  },
  addNote: (data: { note: AnkiNote }) => anki.addNote(data.note),
  createNoteFromResult: (data: {
    result: DictionaryEntry;
    options: Record<string, unknown>;
    defIndex?: number;
  }) => anki.createNoteFromResult(data.result, { ...data.options }, data.defIndex),
  setupDefaultModel: () => anki.setupDefaultModel(),
};

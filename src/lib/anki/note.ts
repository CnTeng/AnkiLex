import type { AnkiNote, Definition, DictionaryEntry, Pronunciation } from "@lib/model";
import { settings } from "@lib/settings";
import { addNote } from "./api";

function formatDefinitions(definitions: Definition[]): string {
  if (!definitions || definitions.length === 0) return "";
  return definitions
    .map((def) => (def.partOfSpeech ? `[${def.partOfSpeech}] ${def.text}` : def.text))
    .join("\n");
}

function formatExamples(definitions: Definition[]): string {
  const lines: string[] = [];
  for (const def of definitions) {
    if (!def.examples || def.examples.length === 0) continue;
    for (const ex of def.examples) {
      if (!ex.text) continue;
      const translation = ex.translation ? ` :: ${ex.translation}` : "";
      lines.push(`${ex.text}${translation}`);
    }
  }
  return lines.join("\n");
}

function formatPronunciations(pronunciations: Pronunciation[]): string {
  const lines: string[] = [];
  for (const pr of pronunciations) {
    if (!pr.text) continue;
    const label = pr.type ? `${pr.type}: ` : "";
    lines.push(`${label}${pr.text}`);
  }
  return lines.join("\n");
}

function formatMetadata(metadata?: Record<string, unknown>): string {
  if (!metadata) return "";
  const lines: string[] = [];
  for (const [key, value] of Object.entries(metadata)) {
    if (value == null) continue;
    const rendered = Array.isArray(value) ? value.join(", ") : String(value);
    lines.push(`${key}: ${rendered}`);
  }
  return lines.join("\n");
}

/**
 * Builds an AnkiNote object from a dictionary entry
 */
export async function buildNote(
  result: DictionaryEntry,
  options?: { deck?: string; noteType?: string },
  defIndex?: number,
): Promise<AnkiNote> {
  const currentSettings = await settings.get();

  const note: AnkiNote = {
    deckName: options?.deck || currentSettings.ankiDefaultDeck,
    modelName: options?.noteType || currentSettings.ankiDefaultNoteType,
    fields: {},
    tags: ["ankilex"],
  };

  const definitionsToUse =
    typeof defIndex === "number" && result.definitions[defIndex]
      ? [result.definitions[defIndex]]
      : result.definitions;

  Object.entries(currentSettings.ankiFieldMap).forEach(([ankiField, lexField]) => {
    switch (lexField) {
      case "word":
        note.fields[ankiField] = result.word;
        break;
      case "context":
        note.fields[ankiField] = result.context || "";
        break;
      case "definition":
        note.fields[ankiField] = formatDefinitions(definitionsToUse);
        break;
      case "examples":
        note.fields[ankiField] = formatExamples(definitionsToUse);
        break;
      case "audio": {
        const audioItems = result.pronunciations.filter((p) => p.audioUrl);
        if (audioItems.length > 0) {
          if (!note.audio) note.audio = [];
          for (const item of audioItems) {
            const label = item.type ? `_${item.type}` : "";
            const timestamp = Date.now();
            const filename = `ankilex_${result.word}${label}_${timestamp}.mp3`;
            note.audio.push({
              url: item.audioUrl,
              filename,
              fields: [ankiField],
            });
          }
        }
        break;
      }
      case "pronunciations": {
        note.fields[ankiField] = formatPronunciations(result.pronunciations);
        break;
      }
      case "provider":
        note.fields[ankiField] = result.provider;
        break;
      case "metadata":
        note.fields[ankiField] = formatMetadata(result.metadata);
        break;
      case "data":
        note.fields[ankiField] = JSON.stringify({
          ...result,
          definitions: definitionsToUse,
        });
        break;
    }
  });

  return note;
}

export async function createNoteFromResult(
  result: DictionaryEntry,
  options?: { deck?: string; noteType?: string; context?: string },
  defIndex?: number,
): Promise<number | number[]> {
  const note = await buildNote(result, options, defIndex);
  return addNote(note);
}

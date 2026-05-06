import type {
  AnkiModel,
  AnkiNote,
  Definition,
  DictionaryEntry,
  Pronunciation,
} from "@common/model";

function formatDefinitions(definitions: Definition[]): string {
  if (definitions.length === 0) return "";
  return definitions
    .map((def) => (def.partOfSpeech ? `[${def.partOfSpeech}] ${def.text}` : def.text))
    .join("\n");
}

function formatExamples(definitions: Definition[]): string {
  return definitions
    .flatMap((def) =>
      (def.examples ?? [])
        .filter((example) => example.text)
        .map((example) =>
          example.translation ? `${example.text} :: ${example.translation}` : example.text,
        ),
    )
    .join("\n");
}

function formatPronunciations(pronunciations: Pronunciation[]): string {
  return pronunciations
    .filter((pronunciation) => pronunciation.text)
    .map((pronunciation) =>
      pronunciation.type ? `${pronunciation.type}: ${pronunciation.text}` : pronunciation.text,
    )
    .join("\n");
}

function formatMetadata(metadata?: Record<string, unknown>): string {
  if (!metadata) return "";
  return Object.entries(metadata)
    .filter(([, value]) => value != null)
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : String(value)}`)
    .join("\n");
}

export function createNoteFromEntry(
  deckName: string,
  model: AnkiModel,
  fieldMap: Record<string, string>,
  result: DictionaryEntry,
): AnkiNote {
  const note: AnkiNote = {
    deckName,
    modelName: model.modelName,
    fields: {},
    tags: ["ankilex"],
  };

  for (const fieldName of model.inOrderFields) {
    const mappedField = fieldMap[fieldName];
    if (!mappedField) {
      note.fields[fieldName] = "";
      continue;
    }

    switch (mappedField) {
      case "word":
        note.fields[fieldName] = result.word;
        break;
      case "context":
        note.fields[fieldName] = result.context || "";
        break;
      case "definition":
        note.fields[fieldName] = formatDefinitions(result.definitions);
        break;
      case "examples":
        note.fields[fieldName] = formatExamples(result.definitions);
        break;
      case "audio": {
        const audioItems = result.pronunciations.filter((pronunciation) => pronunciation.audioUrl);
        if (audioItems.length === 0) break;

        note.audio = audioItems.map((item) => {
          const label = item.type ? `_${item.type}` : "";
          const timestamp = Date.now();
          return {
            url: item.audioUrl,
            filename: `ankilex_${result.word}${label}_${timestamp}.mp3`,
            fields: [fieldName],
          };
        });
        break;
      }
      case "pronunciations":
        note.fields[fieldName] = formatPronunciations(result.pronunciations);
        break;
      case "provider":
        note.fields[fieldName] = result.provider;
        break;
      case "metadata":
        note.fields[fieldName] = formatMetadata(result.metadata);
        break;
      case "data":
        note.fields[fieldName] = JSON.stringify(result);
        break;
    }
  }

  return note;
}

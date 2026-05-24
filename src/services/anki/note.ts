import type {
  AnkiModel,
  AnkiNote,
  Definition,
  DictionaryEntry,
  Pronunciation,
} from "@common/model";

type AudioPronunciation = Pronunciation & { audioUrl: string };
type NoteModel = Pick<AnkiModel, "modelName" | "inOrderFields">;

export function createNoteFromEntry(
  deckName: string,
  model: NoteModel,
  entry: DictionaryEntry,
): AnkiNote {
  const audioItems = entry.pronunciations.filter(hasAudioUrl);

  return {
    deckName,
    modelName: model.modelName,
    fields: {
      ...Object.fromEntries(model.inOrderFields.map((fieldName) => [fieldName, ""])),
      word: entry.word,
      context: entry.context || "",
      definition: formatDefinitions(entry.definitions),
      examples: formatExamples(entry.definitions),
      pronunciations: formatPronunciations(entry.pronunciations),
      provider: entry.provider,
      metadata: formatMetadata(entry.metadata),
      data: JSON.stringify(entry),
    },
    tags: ["ankilex"],
    ...(audioItems.length > 0 ? { audio: createAudioItems(entry.word, audioItems) } : {}),
  };
}

function formatDefinitions(definitions: Definition[]) {
  return definitions
    .map((definition) =>
      definition.partOfSpeech ? `[${definition.partOfSpeech}] ${definition.text}` : definition.text,
    )
    .join("\n");
}

function formatExamples(definitions: Definition[]) {
  return definitions
    .flatMap((definition) =>
      (definition.examples ?? [])
        .filter((example) => example.text)
        .map((example) =>
          example.translation ? `${example.text} :: ${example.translation}` : example.text,
        ),
    )
    .join("\n");
}

function formatPronunciations(pronunciations: Pronunciation[]) {
  return pronunciations
    .filter((pronunciation) => pronunciation.text)
    .map((pronunciation) =>
      pronunciation.type ? `${pronunciation.type}: ${pronunciation.text}` : pronunciation.text,
    )
    .join("\n");
}

function formatMetadata(metadata?: Record<string, unknown>) {
  if (!metadata) return "";
  return Object.entries(metadata)
    .filter(([, value]) => value != null)
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : String(value)}`)
    .join("\n");
}

function hasAudioUrl(pronunciation: Pronunciation): pronunciation is AudioPronunciation {
  return Boolean(pronunciation.audioUrl);
}

function createAudioItems(word: string, pronunciations: AudioPronunciation[]) {
  const timestamp = Date.now();
  return pronunciations.map((pronunciation) => ({
    url: pronunciation.audioUrl,
    filename: `ankilex_${word}${pronunciation.type ? `_${pronunciation.type}` : ""}_${timestamp}.mp3`,
    fields: ["audio"],
  }));
}

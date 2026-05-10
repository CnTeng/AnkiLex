import type { AnkiNote, Definition, DictionaryEntry, Pronunciation } from "@common/types";
import { ANKI_AUDIO_FILENAME_PREFIX, ANKI_MODEL_NAME, ANKI_TAG } from "./builtin";
import type { AnkiRequest } from "./request";

function createDefinitionField(definitions: Definition[]) {
  return definitions
    .map((definition) =>
      definition.partOfSpeech ? `[${definition.partOfSpeech}] ${definition.text}` : definition.text,
    )
    .join("\n");
}

function createExamplesField(definitions: Definition[]) {
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

function createPronunciationsField(pronunciations: Pronunciation[]) {
  return pronunciations
    .filter((pronunciation) => pronunciation.text)
    .map((pronunciation) =>
      pronunciation.type ? `${pronunciation.type}: ${pronunciation.text}` : pronunciation.text,
    )
    .join("\n");
}

function createMetadataField(metadata?: Record<string, unknown>) {
  if (!metadata) return "";
  return Object.entries(metadata)
    .filter(([, value]) => value != null)
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : String(value)}`)
    .join("\n");
}

function createAudioItems(word: string, pronunciations: Pronunciation[]) {
  const timestamp = Date.now();
  return pronunciations.flatMap((pronunciation) => {
    if (!pronunciation.audioUrl) return [];
    return {
      url: pronunciation.audioUrl,
      filename: `${ANKI_AUDIO_FILENAME_PREFIX}_${word}${pronunciation.type ? `_${pronunciation.type}` : ""}_${timestamp}.mp3`,
      fields: ["audio"],
    };
  });
}

function createAnkiNote(deckName: string, modelName: string, entry: DictionaryEntry): AnkiNote {
  const audio = createAudioItems(entry.word, entry.pronunciations);

  return {
    deckName,
    modelName,
    fields: {
      word: entry.word,
      context: entry.context || "",
      definition: createDefinitionField(entry.definitions),
      examples: createExamplesField(entry.definitions),
      pronunciations: createPronunciationsField(entry.pronunciations),
      provider: entry.provider,
      metadata: createMetadataField(entry.metadata),
      data: JSON.stringify(entry),
    },
    tags: [ANKI_TAG],
    ...(audio.length > 0 ? { audio } : {}),
  };
}

async function createNote(request: AnkiRequest, note: AnkiNote): Promise<void> {
  await request<number>("addNote", { note });
}

export async function createNoteFromEntry(
  request: AnkiRequest,
  deckName: string,
  entry: DictionaryEntry,
): Promise<void> {
  await createNote(request, createAnkiNote(deckName, ANKI_MODEL_NAME, entry));
}

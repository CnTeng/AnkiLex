import type { AnkiNote, Definition, DictionaryEntry, Example, Pronunciation } from "@common/types";
import {
  ANKI_AUDIO_FILENAME_PREFIX,
  ANKI_MODEL_NAME,
  ANKI_TAG,
  ANKI_TEMPLATE_VERSION,
} from "./builtin";
import type { AnkiRequest } from "./request";

function serializeField(value: string | undefined, json: false): string;
function serializeField(value: unknown | undefined, json?: true): string;
function serializeField(value: unknown | undefined, json = true): string {
  if (value === undefined) return "";
  return json ? JSON.stringify(value, null, 2) : String(value);
}

function createDefinitionFields(definition?: Definition): {
  definition: Omit<Definition, "examples"> | undefined;
  examples: Example[] | undefined;
} {
  if (!definition) return { definition: undefined, examples: undefined };
  const { examples, ...value } = definition;
  return { definition: value, examples };
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
  const { definition, examples } = createDefinitionFields(entry.definitions[0]);

  return {
    deckName,
    modelName,
    fields: {
      word: serializeField(entry.word, false),
      definition: serializeField(definition),
      examples: serializeField(examples),
      pronunciations: serializeField(entry.pronunciations),
      metadata: serializeField(entry.metadata),
      context: serializeField(entry.context, false),
      version: serializeField(ANKI_TEMPLATE_VERSION),
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

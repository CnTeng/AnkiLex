import { anki } from "@lib/anki";
import { dictionary } from "@lib/dictionary";
import { ACTION, type ActionMap } from "@lib/model";
import { settings } from "@lib/settings";

type Action = keyof ActionMap;

type Handler<A extends Action> = (
  req: ActionMap[A]["request"],
) => Promise<ActionMap[A]["response"]>;

const handlers: { [K in Action]?: Handler<K> } = {
  [ACTION.ANKI_CHECK]: async () => {
    return { available: await anki.isAvailable() };
  },

  [ACTION.ANKI_GET_DECKS]: async () => {
    return { decks: await anki.getDecks() };
  },

  [ACTION.ANKI_GET_NOTE_TYPES]: async () => {
    return { noteTypes: await anki.getNoteTypes() };
  },

  [ACTION.ANKI_GET_FIELDS]: async (data) => {
    return { fields: await anki.getFields((data as { modelName: string }).modelName) };
  },

  [ACTION.ANKI_ADD_NOTE]: async (data) => {
    return { noteId: await anki.addNote((data as { note: import("@lib/model").AnkiNote }).note) };
  },

  [ACTION.ANKI_CREATE_NOTE_FROM_RESULT]: async (data) => {
    const req = data as {
      result: unknown;
      options: object;
      context: string;
      defIndex?: number;
    };
    return {
      noteId: await anki.createNoteFromResult(
        req.result as import("@lib/model").DictionaryEntry,
        {
          ...req.options,
          context: req.context,
        },
        req.defIndex, // Pass optional definition index
      ),
    };
  },

  [ACTION.DICTIONARY_LOOKUP]: async (data) => {
    const { dictionaryProviders: languageDictionaries } = await settings.get();
    const lang = "en";
    const providerId = languageDictionaries[lang];
    return await dictionary.lookup(data.word as string, providerId);
  },

  [ACTION.DICTIONARY_GET_PROVIDERS]: async () => {
    return { providers: dictionary.getProviders() };
  },

  [ACTION.SETTINGS_GET]: async () => {
    return await settings.get();
  },

  [ACTION.SETTINGS_UPDATE]: async (data) => {
    return await settings.update(
      (data as { partial: Partial<import("@lib/model").AnkiLexSettings> }).partial,
    );
  },

  [ACTION.SETTINGS_RESET]: async () => {
    return await settings.reset();
  },
};

export async function dispatchAction(action: Action, data: unknown) {
  console.log(`Dispatching action: ${handlers} with data:`);
  const handler = handlers[action] as Handler<typeof action> | undefined;
  if (!handler) {
    throw new Error(`No handler for action: ${action}`);
  }
  return handler(data as ActionMap[typeof action]["request"]);
}

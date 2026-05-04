import { AnkiClient } from "@lib/anki";
import { ANKI_DEFAULT_MODEL } from "@lib/anki/templates";
import { ANKI_DEFAULT_MODEL_NAME, type DictionaryEntry } from "@lib/model";
import { useSettings } from "@lib/settings";

async function createClient() {
  const settings = await useSettings.get();
  return new AnkiClient(settings.anki.connectUrl);
}

export const ankiHandlers = {
  check: async () =>
    createClient().then((client) => {
      return client
        .getVersion()
        .then(() => true)
        .catch(() => false);
    }),

  getDecks: async () => createClient().then((client) => client.getDeckNames()),

  getModels: async () => createClient().then((client) => client.getModelNames()),

  getModelFields: async (data: { modelName: string }) =>
    createClient().then((client) => client.getModelFieldNames(data.modelName)),

  addNote: async (data: { result: DictionaryEntry }) => {
    const settings = await useSettings.get();

    const client = new AnkiClient(settings.anki.connectUrl);

    if (!data.result.language) return undefined;
    const langSettings = settings.languages[data.result.language];
    if (!langSettings) return undefined;

    return client.addNoteFromEntry(
      langSettings.deck,
      settings.anki.noteType,
      settings.anki.fieldMap,
      data.result,
    );
  },

  syncModel: async () => {
    const client = await createClient();

    const models = await client.getModelNames();
    if (models.includes(ANKI_DEFAULT_MODEL_NAME)) {
      await client.updateModel(ANKI_DEFAULT_MODEL);
    } else {
      await client.createModel(ANKI_DEFAULT_MODEL);
    }
  },
};

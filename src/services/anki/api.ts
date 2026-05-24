import type { AnkiModel, AnkiModelTemplate, AnkiNote, DictionaryEntry } from "@common/model";
import { ANKI_DEFAULT_MODEL_FIELDS } from "@common/model";
import { ANKI_TEMPLATE_MARKER } from "@views/dictionary/templates";
import { type AnkiConnectEnv, invoke, request } from "./connect";
import { createNoteFromEntry } from "./note";

type NoteModel = Pick<AnkiModel, "modelName" | "inOrderFields">;

export function deckNames(env: AnkiConnectEnv) {
  return invoke<string[]>(env, request("deckNames"));
}

export function modelNames(env: AnkiConnectEnv) {
  return invoke<string[]>(env, request("modelNames"));
}

export function createModel(env: AnkiConnectEnv, model: AnkiModel) {
  return invoke<null>(env, request("createModel", { ...model }));
}

export async function updateModel(env: AnkiConnectEnv, model: AnkiModel) {
  const currentFields = await modelFieldNames(env, model.modelName);
  const nextFields = new Set(model.inOrderFields);

  for (const fieldName of model.inOrderFields.filter((field) => !currentFields.includes(field))) {
    await invoke<null>(env, request("modelFieldAdd", { modelName: model.modelName, fieldName }));
  }

  for (const fieldName of currentFields.filter((field) => !nextFields.has(field))) {
    await invoke<null>(env, request("modelFieldRemove", { modelName: model.modelName, fieldName }));
  }

  for (const [index, fieldName] of model.inOrderFields.entries()) {
    await invoke<null>(
      env,
      request("modelFieldReposition", { modelName: model.modelName, fieldName, index }),
    );
  }

  await updateModelStyling(env, model.modelName, model.css);
  await updateModelTemplates(env, model.modelName, model.cardTemplates);
}

export function addNote(env: AnkiConnectEnv, note: AnkiNote) {
  return invoke<number>(env, request("addNote", { note }));
}

export async function addNoteFromEntry(
  env: AnkiConnectEnv,
  deckName: string,
  modelName: string,
  entry: DictionaryEntry,
) {
  return addNote(env, createNoteFromEntry(deckName, await getCheckedModel(env, modelName), entry));
}

async function getCheckedModel(env: AnkiConnectEnv, modelName: string): Promise<NoteModel> {
  const model = {
    modelName,
    inOrderFields: await modelFieldNames(env, modelName),
  };

  const fields = new Set(model.inOrderFields);
  if (ANKI_DEFAULT_MODEL_FIELDS.some((fieldName) => !fields.has(fieldName))) {
    throw new Error("Current note type is outdated. Please run Setup Template and try again.");
  }

  const styling = await invoke<{ css: string }>(env, request("modelStyling", { modelName }));
  if (!styling.css.includes(ANKI_TEMPLATE_MARKER)) {
    throw new Error("Current note type is outdated. Please run Setup Template and try again.");
  }

  return model;
}

function modelFieldNames(env: AnkiConnectEnv, modelName: string) {
  return invoke<string[]>(env, request("modelFieldNames", { modelName }));
}

function updateModelStyling(env: AnkiConnectEnv, modelName: string, css: string) {
  return invoke<null>(env, request("updateModelStyling", { model: { name: modelName, css } }));
}

function updateModelTemplates(
  env: AnkiConnectEnv,
  modelName: string,
  templates: AnkiModelTemplate[],
) {
  return invoke<null>(
    env,
    request("updateModelTemplates", {
      model: {
        name: modelName,
        templates: Object.fromEntries(
          templates.map(({ Name, Front, Back }) => [Name, { Front, Back }]),
        ),
      },
    }),
  );
}

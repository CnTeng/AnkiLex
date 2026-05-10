import type { AnkiModel, AnkiModelTemplate } from "@common/types";
import {
  ANKI_MODEL_FIELDS,
  ANKI_MODEL_NAME,
  ANKI_MODEL_STYLE,
  ANKI_TEMPLATE_MARKER,
} from "./builtin";
import type { AnkiRequest } from "./request";
import { ANKI_MODEL_TEMPLATE } from "./template";

export async function checkModel(request: AnkiRequest, modelName: string): Promise<void> {
  assertDefaultFields(await getModelFields(request, modelName));
  assertTemplateMarker((await getModelStyling(request, modelName)).css);
}

export async function syncModel(request: AnkiRequest): Promise<void> {
  const model = {
    modelName: ANKI_MODEL_NAME,
    inOrderFields: [...ANKI_MODEL_FIELDS],
    css: ANKI_MODEL_STYLE,
    cardTemplates: [ANKI_MODEL_TEMPLATE],
  } satisfies AnkiModel;

  await ((await getModels(request)).includes(model.modelName)
    ? updateModel(request, model)
    : createModel(request, model));
}

function getModels(request: AnkiRequest): Promise<string[]> {
  return request<string[]>("modelNames");
}

async function createModel(request: AnkiRequest, model: AnkiModel): Promise<void> {
  await request<void>("createModel", { ...model });
}

async function updateModel(request: AnkiRequest, model: AnkiModel): Promise<void> {
  const currentFields = await getModelFields(request, model.modelName);
  await addMissingModelFields(request, model.modelName, currentFields, model.inOrderFields);
  await removeExtraModelFields(request, model.modelName, currentFields, model.inOrderFields);
  await repositionModelFields(request, model.modelName, model.inOrderFields);

  await updateModelStyling(request, model.modelName, model.css);
  await updateModelTemplates(request, model.modelName, model.cardTemplates);
}

function getModelFields(request: AnkiRequest, modelName: string): Promise<string[]> {
  return request<string[]>("modelFieldNames", { modelName });
}

function getModelStyling(request: AnkiRequest, modelName: string): Promise<{ css: string }> {
  return request<{ css: string }>("modelStyling", { modelName });
}

function assertDefaultFields(fields: string[]): void {
  const fieldSet = new Set(fields);
  if (ANKI_MODEL_FIELDS.every((fieldName) => fieldSet.has(fieldName))) return;
  throw new Error("Current note type is missing required fields. Please run Setup Template.");
}

function assertTemplateMarker(css: string): void {
  if (css.includes(ANKI_TEMPLATE_MARKER)) return;
  throw new Error(
    "Current note type template was not created by Anki-Lex. Please run Setup Template.",
  );
}

async function addMissingModelFields(
  request: AnkiRequest,
  modelName: string,
  currentFields: string[],
  nextFields: string[],
): Promise<void> {
  const currentFieldSet = new Set(currentFields);
  for (const fieldName of nextFields.filter((field) => !currentFieldSet.has(field))) {
    await request<void>("modelFieldAdd", { modelName, fieldName });
  }
}

async function removeExtraModelFields(
  request: AnkiRequest,
  modelName: string,
  currentFields: string[],
  nextFields: string[],
): Promise<void> {
  const nextFieldSet = new Set(nextFields);
  for (const fieldName of currentFields.filter((field) => !nextFieldSet.has(field))) {
    await request<void>("modelFieldRemove", { modelName, fieldName });
  }
}

async function repositionModelFields(
  request: AnkiRequest,
  modelName: string,
  fields: string[],
): Promise<void> {
  for (const [index, fieldName] of fields.entries()) {
    await request<void>("modelFieldReposition", { modelName, fieldName, index });
  }
}

function updateModelStyling(request: AnkiRequest, modelName: string, css: string): Promise<void> {
  return request<void>("updateModelStyling", { model: { name: modelName, css } });
}

function updateModelTemplates(
  request: AnkiRequest,
  modelName: string,
  templates: AnkiModelTemplate[],
): Promise<void> {
  return request<void>("updateModelTemplates", {
    model: {
      name: modelName,
      templates: Object.fromEntries(
        templates.map(({ Name, Front, Back }) => [Name, { Front, Back }]),
      ),
    },
  });
}

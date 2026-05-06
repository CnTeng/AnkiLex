import type {
  AnkiConnectRequest,
  AnkiConnectResponse,
  AnkiModel,
  AnkiModelTemplate,
  AnkiNote,
  DictionaryEntry,
} from "@common/model";

import { createNoteFromEntry } from "./note";

export class AnkiClient {
  constructor(private readonly url: string) {}

  private async invoke<T>(action: string, params: Record<string, unknown> = {}): Promise<T> {
    const request: AnkiConnectRequest = {
      action,
      version: 6,
      params,
    };

    const response = await fetch(this.url, {
      method: "POST",
      body: JSON.stringify(request),
    }).catch(() => {
      throw new Error(
        "Could not connect to Anki. Please check if Anki is running and AnkiConnect is installed.",
      );
    });

    if (!response.ok) {
      throw new Error(`AnkiConnect request failed: ${response.statusText}`);
    }

    const payload: unknown = await response.json();
    const { result, error }: AnkiConnectResponse<T> = payload as AnkiConnectResponse<T>;
    if (error) {
      throw new Error(error);
    }

    return result;
  }

  async getVersion(): Promise<number> {
    return this.invoke<number>("version");
  }

  async addNote(note: AnkiNote): Promise<number> {
    return this.invoke<number>("addNote", { note });
  }

  async addNoteFromEntry(
    deckName: string,
    modelName: string,
    fieldMap: Record<string, string>,
    result: DictionaryEntry,
  ): Promise<number> {
    const model = await this.getModel(modelName);
    const note = createNoteFromEntry(deckName, model, fieldMap, result);

    return this.addNote(note);
  }

  async findNotes(query: string): Promise<number[]> {
    return this.invoke<number[]>("findNotes", { query });
  }

  async getDeckNames(): Promise<string[]> {
    return this.invoke<string[]>("deckNames");
  }

  async createModel(model: AnkiModel): Promise<void> {
    await this.invoke<null>("createModel", { ...model });
  }

  async getModelNames(): Promise<string[]> {
    return this.invoke<string[]>("modelNames");
  }

  async getModel(modelName: string): Promise<AnkiModel> {
    const fields = await this.getModelFieldNames(modelName);
    return {
      modelName,
      inOrderFields: fields,
      css: "",
      cardTemplates: [],
    };
  }

  async getModelFieldNames(modelName: string): Promise<string[]> {
    return this.invoke<string[]>("modelFieldNames", { modelName });
  }

  async updateModel(model: AnkiModel): Promise<void> {
    const defaultFields = new Set<string>(model.inOrderFields);
    const existingFields = await this.getModelFieldNames(model.modelName);

    for (const field of model.inOrderFields.filter((field) => !existingFields.includes(field))) {
      await this.addModelField(model.modelName, field);
    }

    for (const field of existingFields.filter((field) => !defaultFields.has(field))) {
      await this.removeModelField(model.modelName, field);
    }

    for (const [index, field] of model.inOrderFields.entries()) {
      await this.repositionModelField(model.modelName, field, index);
    }

    await this.updateModelStyling(model.modelName, model.css);
    await this.updateModelTemplates(model.modelName, model.cardTemplates);
  }

  private async addModelField(modelName: string, fieldName: string, index?: number): Promise<void> {
    await this.invoke<null>("modelFieldAdd", { modelName, fieldName, index });
  }

  private async removeModelField(modelName: string, fieldName: string): Promise<void> {
    await this.invoke<null>("modelFieldRemove", { modelName, fieldName });
  }

  private async repositionModelField(
    modelName: string,
    fieldName: string,
    index: number,
  ): Promise<void> {
    await this.invoke<null>("modelFieldReposition", {
      modelName,
      fieldName,
      index,
    });
  }

  private async updateModelStyling(modelName: string, css: string): Promise<void> {
    await this.invoke<null>("updateModelStyling", {
      model: { name: modelName, css },
    });
  }

  private async updateModelTemplates(
    modelName: string,
    templates: AnkiModelTemplate[],
  ): Promise<void> {
    await this.invoke<null>("updateModelTemplates", {
      model: {
        name: modelName,
        templates: Object.fromEntries(
          templates.map(({ Name, Front, Back }) => [Name, { Front, Back }]),
        ),
      },
    });
  }
}

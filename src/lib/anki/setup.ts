import { settings } from "@lib/settings";
import { getModelFields, getModels } from "./api";
import { invoke } from "./client";
import { back as BACK_TEMPLATE, front as FRONT_TEMPLATE, css as MODERN_STYLE } from "./templates";

export async function setupDefaultModel(): Promise<void> {
  const modelName = "Anki-Lex Modern";
  const models = await getModels();
  const isUpdate = models.includes(modelName);

  const inOrderFields = [
    "word",
    "pronunciations",
    "audio",
    "definition",
    "examples",
    "context",
    "provider",
    "metadata",
    "data",
  ];

  if (isUpdate) {
    const existingFields = await getModelFields(modelName);
    for (const field of inOrderFields) {
      if (!existingFields.includes(field)) {
        await invoke<null>("modelFieldAdd", { modelName, fieldName: field });
      }
    }

    await invoke<null>("updateModelStyling", {
      model: { name: modelName, css: MODERN_STYLE },
    });

    await invoke<null>("updateModelTemplates", {
      model: {
        name: modelName,
        templates: {
          "Card 1": { Front: FRONT_TEMPLATE, Back: BACK_TEMPLATE },
        },
      },
    });
  } else {
    await invoke<null>("createModel", {
      modelName,
      inOrderFields,
      css: MODERN_STYLE,
      cardTemplates: [
        {
          Name: "Card 1",
          Front: FRONT_TEMPLATE,
          Back: BACK_TEMPLATE,
        },
      ],
    });
  }

  // Automatically update settings
  await settings.update({
    ankiDefaultNoteType: modelName,
    ankiFieldMap: {
      word: "word",
      pronunciations: "pronunciations",
      audio: "audio",
      definition: "definition",
      examples: "examples",
      context: "context",
      provider: "provider",
      metadata: "metadata",
      data: "data",
    },
  });
}

import { DEFAULT_SETTINGS } from "@lib/model";
import { rpc } from "@lib/rpc";
import { cn } from "tailwind-variants";
import { AnkiSection } from "./anki";
import { DictionarySection } from "./dict";
import { createActions, createStatus, type SettingsStatusElement } from "./elements";

export interface SettingsViewOptions {
  doc?: Document;
}

function showError(status: SettingsStatusElement, message: string, error: unknown) {
  status.show(`${message}: ${error instanceof Error ? error.message : String(error)}`, "error");
}

export function SettingsView({ doc = document }: SettingsViewOptions = {}): HTMLDivElement {
  const container = doc.createElement("div");

  const draft = { ...DEFAULT_SETTINGS };
  const status = createStatus(doc);
  const dict = DictionarySection(doc, draft);
  const anki = AnkiSection(doc, draft, status);

  const save = () =>
    rpc.settings
      .update({ partial: draft })
      .then(() => {
        status.show("Settings saved successfully!", "success");
      })
      .catch((error) => {
        showError(status, "Error saving settings", error);
      });

  const reset = () => {
    if (!confirm("Are you sure you want to reset all settings to defaults?"))
      return Promise.resolve();
    return rpc.settings
      .reset()
      .then(async (settings) => {
        Object.assign(draft, settings);
        dict.render(
          await rpc.dictionary.getRows({
            selected: draft.dictionaryProviders,
          }),
        );
        anki.render({
          ankiConnectUrl: draft.ankiConnectUrl,
          ankiDefaultDeck: draft.ankiDefaultDeck,
          ankiDefaultNoteType: draft.ankiDefaultNoteType,
          fieldMappingRows: await rpc.anki.getFieldMappingRows({
            noteType: draft.ankiDefaultNoteType,
            currentMap: draft.ankiFieldMap,
          }),
        });
      })
      .then(() => {
        status.show("Settings reset to defaults.", "success");
      })
      .catch((error) => {
        showError(status, "Failed to reset settings", error);
      });
  };

  // Assemble
  const sections = doc.createElement("div");
  sections.className = cn("space-y-10 p-8") as string;
  sections.append(dict.element, anki.element);

  container.append(sections, createActions(doc, status, { save, reset }));

  // Load initial settings
  void rpc.settings
    .get()
    .then(async (settings) => {
      Object.assign(draft, settings);
      dict.render(
        await rpc.dictionary.getRows({
          selected: draft.dictionaryProviders,
        }),
      );
      anki.render({
        ankiConnectUrl: draft.ankiConnectUrl,
        ankiDefaultDeck: draft.ankiDefaultDeck,
        ankiDefaultNoteType: draft.ankiDefaultNoteType,
        fieldMappingRows: await rpc.anki.getFieldMappingRows({
          noteType: draft.ankiDefaultNoteType,
          currentMap: draft.ankiFieldMap,
        }),
      });
    })
    .catch((error) => {
      showError(status, "Failed to load settings", error);
    });

  return container;
}

export type { DictionaryRow, FieldMappingRow } from "./types";

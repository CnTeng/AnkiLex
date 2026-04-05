import { Button, Icon, Input, Select } from "@lib/components";
import type { AnkiLexSettings } from "@lib/model";
import { rpc } from "@lib/rpc";
import { RefreshCw, Shield } from "lucide";
import { cn } from "tailwind-variants";
import {
  createFormField,
  createSectionHeading,
  type SettingsStatusElement,
  setSelectOptions,
} from "./elements";
import type { FieldMappingRow } from "./types";

export interface AnkiSectionResult {
  element: HTMLElement;
  render: (values: {
    ankiConnectUrl: string;
    ankiDefaultDeck: string;
    ankiDefaultNoteType: string;
    fieldMappingRows: FieldMappingRow[] | null;
  }) => void;
}

function stringOptions(values: string[]) {
  return values.map((value) => ({ value, label: value }));
}

function createControlRow(doc: Document, children: HTMLElement[]) {
  const row = doc.createElement("div");
  row.className = cn("flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center") as string;
  row.append(...children);
  return row;
}

function createFieldMapping(doc: Document) {
  const element = doc.createElement("div");
  element.className = cn("mb-6 hidden") as string;

  const details = doc.createElement("details");
  details.className = cn("group") as string;

  const summary = doc.createElement("summary");
  summary.className = cn(
    "text-muted-foreground hover:text-foreground mb-4 flex cursor-pointer list-none items-center gap-2 text-sm font-medium transition-colors",
  ) as string;

  const arrow = doc.createElement("span");
  arrow.className = cn("transition-transform group-open:rotate-90") as string;
  arrow.textContent = "▸";
  summary.append(arrow, doc.createTextNode(" Advanced: Field Mapping"));

  const content = doc.createElement("div");
  content.className = cn("border-border bg-muted space-y-3 rounded-lg border p-4") as string;

  details.append(summary, content);
  element.append(details);

  return {
    element,
    content,
    show: (visible: boolean) => element.classList.toggle("hidden", !visible),
  };
}

function renderFieldMappingRows(
  doc: Document,
  fieldMapping: ReturnType<typeof createFieldMapping>,
  draft: AnkiLexSettings,
  rows: FieldMappingRow[] | null,
) {
  if (!rows) {
    fieldMapping.show(false);
    fieldMapping.content.replaceChildren();
    draft.ankiFieldMap = {};
    return;
  }

  // Sync draft from rendered rows
  draft.ankiFieldMap = Object.fromEntries(
    rows.filter((row) => row.selectedValue).map((row) => [row.fieldName, row.selectedValue]),
  );

  fieldMapping.show(true);
  fieldMapping.content.replaceChildren(
    ...rows.map((row) => {
      const select = Select({
        doc,
        options: row.options,
        value: row.selectedValue,
        onChange: (value) => {
          if (value) {
            draft.ankiFieldMap[row.fieldName] = value;
          } else {
            delete draft.ankiFieldMap[row.fieldName];
          }
        },
      });
      return createFormField(doc, row.fieldName, {
        children: select as HTMLElement,
        layout: "inline",
      });
    }),
  );
}

export function AnkiSection(
  doc: Document,
  draft: AnkiLexSettings,
  status: SettingsStatusElement,
): AnkiSectionResult {
  const section = doc.createElement("section");
  section.append(createSectionHeading(doc, Shield, "Anki"));

  const content = doc.createElement("div");
  content.className = cn("space-y-6") as string;

  // AnkiConnect URL
  const urlInput = Input({
    doc,
    id: "anki-url",
    placeholder: "http://127.0.0.1:8765",
    onChange: (value) => {
      draft.ankiConnectUrl = value;
    },
  });
  content.append(
    createFormField(doc, "AnkiConnect URL", {
      htmlFor: "anki-url",
      help: "Requires the AnkiConnect add-on to be installed and running in Anki.",
      children: urlInput,
      layout: "inline",
    }),
  );

  // Default Deck
  const deckSelect = Select({
    doc,
    id: "default-deck",
    options: [{ value: "Default", label: "Default" }],
    value: "Default",
    onChange: (value) => {
      draft.ankiDefaultDeck = value;
    },
  });
  const refreshButton = Button({
    doc,
    title: "Refresh Decks/Models",
    icon: Icon({
      doc,
      iconNode: RefreshCw,
      customAttrs: { width: 16, height: 16 },
    }),
    variant: "outline",
    size: "icon",
  });
  refreshButton.classList.add("h-10", "w-10");
  content.append(
    createFormField(doc, "Default Deck", {
      htmlFor: "default-deck",
      children: createControlRow(doc, [deckSelect as HTMLElement, refreshButton]),
      layout: "inline",
    }),
  );

  // Default Note Type
  const noteTypeSelect = Select({
    doc,
    id: "default-note-type",
    options: [{ value: "Basic", label: "Basic" }],
    value: "Basic",
    onChange: (value) => {
      draft.ankiDefaultNoteType = value;
    },
  });
  const setupButton = Button({
    doc,
    label: "Setup or Update Template",
    title: "Create or upgrade the optimized Anki-Lex Modern note type in Anki",
    variant: "outline",
    size: "default",
  });
  setupButton.classList.add("shrink-0");
  content.append(
    createFormField(doc, "Default Note Type", {
      htmlFor: "default-note-type",
      children: createControlRow(doc, [noteTypeSelect as HTMLElement, setupButton]),
      layout: "inline",
    }),
  );

  // Field Mapping
  const fieldMapping = createFieldMapping(doc);
  content.append(fieldMapping.element);
  section.append(content);

  function showError(message: string, error: unknown) {
    status.show(`${message}: ${error instanceof Error ? error.message : String(error)}`, "error");
  }

  function render(values: {
    ankiConnectUrl: string;
    ankiDefaultDeck: string;
    ankiDefaultNoteType: string;
    fieldMappingRows: FieldMappingRow[] | null;
  }) {
    urlInput.value = values.ankiConnectUrl;
    draft.ankiConnectUrl = values.ankiConnectUrl;

    setSelectOptions(
      doc,
      deckSelect,
      [{ value: values.ankiDefaultDeck, label: values.ankiDefaultDeck }],
      values.ankiDefaultDeck,
    );
    draft.ankiDefaultDeck = values.ankiDefaultDeck;

    setSelectOptions(
      doc,
      noteTypeSelect,
      [
        {
          value: values.ankiDefaultNoteType,
          label: values.ankiDefaultNoteType,
        },
      ],
      values.ankiDefaultNoteType,
    );
    draft.ankiDefaultNoteType = values.ankiDefaultNoteType;

    renderFieldMappingRows(doc, fieldMapping, draft, values.fieldMappingRows);
  }

  const refresh = () => {
    status.show("Connecting to Anki...", "info");
    return Promise.all([rpc.anki.getDecks(), rpc.anki.getModels()])
      .then(async ([decks, models]) => {
        setSelectOptions(
          doc,
          deckSelect,
          stringOptions(decks.length > 0 ? decks : ["Default"]),
          deckSelect.select.value,
        );
        draft.ankiDefaultDeck = deckSelect.select.value;

        setSelectOptions(
          doc,
          noteTypeSelect,
          stringOptions(models.length > 0 ? models : ["Basic"]),
          noteTypeSelect.select.value,
        );
        draft.ankiDefaultNoteType = noteTypeSelect.select.value;

        renderFieldMappingRows(
          doc,
          fieldMapping,
          draft,
          await rpc.anki.getFieldMappingRows({
            noteType: draft.ankiDefaultNoteType,
            currentMap: draft.ankiFieldMap,
          }),
        );
      })
      .then(() => {
        status.show("Anki connection successful!", "success");
      })
      .catch((error) => {
        showError("Failed to connect to Anki", error);
      });
  };

  const setupTemplate = () => {
    status.show("Processing Anki template...", "info");
    return rpc.anki
      .setupDefaultModel()
      .then(() => refresh())
      .then(() => {
        status.show("Anki template is up to date!", "success");
      })
      .catch((error) => {
        showError("Processing failed", error);
      });
  };

  // Wire internal events
  refreshButton.addEventListener("click", () => void refresh());
  noteTypeSelect.select.addEventListener("change", () => {
    void rpc.anki
      .getFieldMappingRows({
        noteType: draft.ankiDefaultNoteType,
        currentMap: draft.ankiFieldMap,
      })
      .then((rows) => {
        renderFieldMappingRows(doc, fieldMapping, draft, rows);
      })
      .catch((error) => {
        showError("Failed to load field mapping", error);
      });
  });
  setupButton.addEventListener("click", () => void setupTemplate());

  return { element: section, render };
}

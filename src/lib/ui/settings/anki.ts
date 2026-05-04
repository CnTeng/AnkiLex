import {
  ANKI_DEFAULT_MODEL_FIELDS,
  guessAnkiModelField,
  type UserSettings,
} from "@lib/model";
import { rpc } from "@lib/rpc";
import { Button, Icon, Input, Select } from "@lib/ui/components";
import { RefreshCw, Shield } from "lucide";
import { cn } from "tailwind-variants";
import {
  createFormField,
  createSectionHeading,
  type SettingsStatusElement,
  setSelectOptions,
} from "./elements";

export interface AnkiSectionResult {
  element: HTMLElement;
  render: (values: { connectUrl: string; noteType: string }) => Promise<void>;
}

const VALID_LEX_FIELDS = new Set(ANKI_DEFAULT_MODEL_FIELDS);
const LEX_FIELD_OPTIONS = [
  { value: "", label: "(None)" },
  { value: "word", label: "Word/Expression" },
  { value: "definition", label: "Definition" },
  { value: "examples", label: "Examples" },
  { value: "pronunciations", label: "Pronunciations" },
  { value: "provider", label: "Provider" },
  { value: "metadata", label: "Metadata" },
  { value: "audio", label: "Audio" },
  { value: "context", label: "Original Context" },
  { value: "data", label: "Full JSON Data" },
];

function stringOptions(values: string[]) {
  return values.map((value) => ({ value, label: value }));
}

function getValidFieldMap(
  fields: string[],
  currentMap: Record<string, string>,
): Record<string, string> {
  const validFields = new Set(fields);
  const nextMap: Record<string, string> = {};

  Object.entries(currentMap).forEach(([fieldName, mappedField]) => {
    if (!validFields.has(fieldName)) return;
    if (!VALID_LEX_FIELDS.has(mappedField)) return;
    nextMap[fieldName] = mappedField;
  });

  return nextMap;
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

async function renderFieldMapping(
  doc: Document,
  fieldMapping: ReturnType<typeof createFieldMapping>,
  draft: UserSettings,
  noteType: string,
) {
  if (!noteType) {
    fieldMapping.show(false);
    fieldMapping.content.replaceChildren();
    return;
  }

  const fields = await rpc.anki.getModelFields({ modelName: noteType });
  if (fields.length === 0) {
    fieldMapping.show(false);
    fieldMapping.content.replaceChildren();
    return;
  }

  const currentMap = getValidFieldMap(fields, draft.anki.fieldMap ?? {});
  const nextMap: Record<string, string> = {};

  fieldMapping.show(true);
  fieldMapping.content.replaceChildren(
    ...fields.map((fieldName) => {
      const selectedValue = currentMap[fieldName] || guessAnkiModelField(fieldName) || "";
      if (selectedValue) nextMap[fieldName] = selectedValue;

      const select = Select({
        doc,
        options: LEX_FIELD_OPTIONS,
        value: selectedValue,
        onChange: (value) => {
          if (value) {
            draft.anki.fieldMap[fieldName] = value;
          } else {
            delete draft.anki.fieldMap[fieldName];
          }
        },
      });

      return createFormField(doc, fieldName, {
        children: select as HTMLElement,
        layout: "inline",
      });
    }),
  );

  draft.anki.fieldMap = nextMap;
}

export function AnkiSection(
  doc: Document,
  draft: UserSettings,
  status: SettingsStatusElement,
  onDeckOptionsChange: (decks: string[]) => void,
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
      draft.anki.connectUrl = value;
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
    createFormField(doc, "AnkiConnect URL", {
      htmlFor: "anki-url",
      children: createControlRow(doc, [urlInput, refreshButton]),
      layout: "inline",
    }),
  );

  // Note Type
  const noteTypeSelect = Select({
    doc,
    id: "default-note-type",
    options: [{ value: "Basic", label: "Basic" }],
    value: "Basic",
    onChange: (value) => {
      draft.anki.noteType = value;
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
    createFormField(doc, "Note Type", {
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

  function showWarning(message: string, error: unknown) {
    status.show(`${message}: ${error instanceof Error ? error.message : String(error)}`, "warning");
  }

  async function render(values: { connectUrl: string; noteType: string }) {
    urlInput.value = values.connectUrl;
    draft.anki.connectUrl = values.connectUrl;

    setSelectOptions(
      doc,
      noteTypeSelect,
      [
        {
          value: values.noteType,
          label: values.noteType,
        },
      ],
      values.noteType,
    );
    draft.anki.noteType = values.noteType;

    await renderFieldMapping(doc, fieldMapping, draft, values.noteType);
  }

  const refresh = () => {
    status.show("Connecting to Anki...", "info");
    return Promise.all([rpc.anki.getDecks(), rpc.anki.getModels()])
      .then(async ([decks, models]) => {
        onDeckOptionsChange(decks.length > 0 ? decks : ["Default"]);

        setSelectOptions(
          doc,
          noteTypeSelect,
          stringOptions(models.length > 0 ? models : ["Basic"]),
          noteTypeSelect.select.value,
        );
        draft.anki.noteType = noteTypeSelect.select.value;

        await renderFieldMapping(doc, fieldMapping, draft, draft.anki.noteType);
      })
      .then(() => {
        status.show("Anki connection successful!", "success");
      })
      .catch((error) => {
        showWarning("Failed to connect to Anki", error);
      });
  };

  const setupTemplate = () => {
    status.show("Processing Anki template...", "info");
    return rpc.anki
      .syncModel()
      .then(() => refresh())
      .then(() => {
        status.show("Anki template is up to date!", "success");
      })
      .catch((error) => {
        showError("Processing failed", error);
      });
  };

  refreshButton.addEventListener("click", () => void refresh());
  noteTypeSelect.select.addEventListener("change", () => {
    void renderFieldMapping(doc, fieldMapping, draft, draft.anki.noteType).catch((error) => {
      showError("Failed to load field mapping", error);
    });
  });
  setupButton.addEventListener("click", () => void setupTemplate());

  return { element: section, render };
}

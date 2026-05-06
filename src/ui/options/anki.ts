import type { AnkiConfig, AnkiState, IAnkiService, SelectOption } from "@lib/model";
import { guessAnkiModelField, normalizeAnkiFieldMap } from "@lib/model";
import { Icon } from "@ui/components";
import { RefreshCw } from "lucide";
import { cn } from "tailwind-variants";
import {
  createFormField,
  createSectionIntro,
  setSelectOptions,
  type StatusLevel,
} from "./elements";

export interface AnkiOptionsDependencies {
  doc?: Document;
  ankiService: IAnkiService;
  getConfig: () => AnkiConfig;
  setConfig: (ankiConfig: AnkiConfig) => Promise<void>;
  setAnkiState: (ankiState: AnkiState, ankiConfig?: AnkiConfig) => void;
  getAnkiState: () => AnkiState;
  showStatus: (level: StatusLevel, message: string) => void;
}

const LEX_FIELD_OPTIONS: SelectOption[] = [
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

function mergeAnkiConfig(ankiConfig: AnkiConfig, ankiState: AnkiState): AnkiConfig {
  return {
    ...ankiConfig,
    noteType: ankiState.noteType,
    fieldMap: normalizeAnkiFieldMap(ankiState.fieldNames, ankiConfig.fieldMap),
  };
}

function ensureCurrentOption(options: SelectOption[], value: string) {
  if (!value || options.some((option) => option.value === value)) return options;
  return [{ value, label: value }, ...options];
}

function createControlRow(doc: Document, children: HTMLElement[]) {
  const row = doc.createElement("div");
  row.className = cn("flex min-w-0 flex-col gap-2 md:flex-row md:items-center") as string;
  row.append(...children);
  return row;
}

export class AnkiOptions {
  readonly element: HTMLElement;

  private readonly doc: Document;
  private readonly ankiService: IAnkiService;
  private readonly getConfigValue: () => AnkiConfig;
  private readonly setConfigValue: (ankiConfig: AnkiConfig) => Promise<void>;
  private readonly applyAnkiState: (ankiState: AnkiState, ankiConfig?: AnkiConfig) => void;
  private readonly getAnkiStateValue: () => AnkiState;
  private readonly showStatus: (level: StatusLevel, message: string) => void;

  private readonly urlInput: HTMLInputElement;
  private readonly refreshButton: HTMLButtonElement;
  private readonly noteTypeSelect: HTMLSelectElement;
  private readonly setupButton: HTMLButtonElement;
  private readonly fieldMappingElement: HTMLDivElement;
  private readonly fieldMappingContent: HTMLDivElement;

  constructor({
    doc = document,
    ankiService,
    getConfig,
    setConfig,
    setAnkiState,
    getAnkiState,
    showStatus,
  }: AnkiOptionsDependencies) {
    this.doc = doc;
    this.ankiService = ankiService;
    this.getConfigValue = getConfig;
    this.setConfigValue = setConfig;
    this.applyAnkiState = setAnkiState;
    this.getAnkiStateValue = getAnkiState;
    this.showStatus = showStatus;

    const section = this.doc.createElement("section");
    section.className = cn("p-0") as string;
    section.append(
      createSectionIntro(
        this.doc,
        "Anki",
        "Connect to Anki, choose the target note type, and map model fields for generated notes.",
      ),
    );

    const content = this.doc.createElement("div");
    content.className = cn("space-y-6") as string;

    this.urlInput = this.doc.createElement("input");
    this.urlInput.id = "anki-url";
    this.urlInput.placeholder = "http://127.0.0.1:8765";
    this.urlInput.className = cn("input w-full") as string;

    this.refreshButton = this.doc.createElement("button");
    this.refreshButton.type = "button";
    this.refreshButton.title = "Refresh Decks/Models";
    this.refreshButton.className = cn("btn btn-outline w-full md:w-auto") as string;
    this.refreshButton.append(
      Icon({
        doc: this.doc,
        iconNode: RefreshCw,
        customAttrs: { width: 16, height: 16 },
      }),
      this.doc.createTextNode("Refresh"),
    );

    this.noteTypeSelect = this.doc.createElement("select");
    this.noteTypeSelect.id = "default-note-type";
    this.noteTypeSelect.className = cn("select w-full") as string;
    this.noteTypeSelect.style.colorScheme = "light dark";

    this.setupButton = this.doc.createElement("button");
    this.setupButton.type = "button";
    this.setupButton.title = "Create or upgrade the optimized Anki-Lex Modern note type in Anki";
    this.setupButton.className = cn("btn btn-outline w-full md:w-auto md:shrink-0") as string;
    this.setupButton.append(this.doc.createTextNode("Setup or Update Template"));

    const fieldMapping = this.createFieldMapping();
    this.fieldMappingElement = fieldMapping.element;
    this.fieldMappingContent = fieldMapping.content;

    content.append(
      createFormField(this.doc, "AnkiConnect URL", {
        htmlFor: "anki-url",
        children: createControlRow(this.doc, [this.urlInput, this.refreshButton]),
        layout: "inline",
      }),
      createFormField(this.doc, "Note Type", {
        htmlFor: "default-note-type",
        children: createControlRow(this.doc, [this.noteTypeSelect, this.setupButton]),
        layout: "inline",
      }),
      this.fieldMappingElement,
    );

    section.append(content);
    this.element = section;

    this.registerListeners();
    this.render();
  }

  render() {
    const ankiConfig = this.getConfigValue();
    const ankiState = this.getAnkiStateValue();
    const mergedConfig = mergeAnkiConfig(ankiConfig, ankiState);

    this.urlInput.value = mergedConfig.connectUrl;
    setSelectOptions(
      this.doc,
      this.noteTypeSelect,
      ensureCurrentOption(ankiState.noteTypeOptions, mergedConfig.noteType),
      mergedConfig.noteType,
    );

    this.renderFieldMapping(mergedConfig, ankiState);
  }

  private registerListeners() {
    this.urlInput.addEventListener("input", () => {
      void this.setConfigValue({
        ...this.getConfigValue(),
        connectUrl: this.urlInput.value,
      }).catch((error) => {
        this.showActionError("Failed to save AnkiConnect URL", error);
      });
    });

    this.refreshButton.addEventListener("click", () => {
      void this.refreshAnkiState();
    });

    this.noteTypeSelect.addEventListener("change", () => {
      void this.selectNoteType(this.noteTypeSelect.value);
    });

    this.setupButton.addEventListener("click", () => {
      void this.syncTemplate();
    });
  }

  private createFieldMapping() {
    const element = this.doc.createElement("div");
    element.className = cn("mb-6 hidden") as string;

    const details = this.doc.createElement("details");
    details.className = cn("group") as string;

    const summary = this.doc.createElement("summary");
    summary.className = cn(
      "text-base-content/70 hover:text-base-content mb-4 flex cursor-pointer list-none items-center gap-2 text-sm font-medium transition-colors",
    ) as string;

    const arrow = this.doc.createElement("span");
    arrow.className = cn("transition-transform group-open:rotate-90") as string;
    arrow.textContent = "▸";
    summary.append(arrow, this.doc.createTextNode(" Advanced: Field Mapping"));

    const content = this.doc.createElement("div");
    content.className = cn("border-base-300 space-y-3 border-t pt-4") as string;

    details.append(summary, content);
    element.append(details);
    return { element, content };
  }

  private renderFieldMapping(ankiConfig: AnkiConfig, ankiState: AnkiState) {
    const { fieldNames } = ankiState;
    if (fieldNames.length === 0) {
      this.fieldMappingElement.classList.add("hidden");
      this.fieldMappingContent.replaceChildren();
      return;
    }

    this.fieldMappingElement.classList.remove("hidden");
    const normalizedFieldMap = normalizeAnkiFieldMap(fieldNames, ankiConfig.fieldMap);

    this.fieldMappingContent.replaceChildren(
      ...fieldNames.map((fieldName) => {
        const select = this.doc.createElement("select");
        select.className = cn("select w-full") as string;
        select.style.colorScheme = "light dark";
        setSelectOptions(
          this.doc,
          select,
          LEX_FIELD_OPTIONS,
          normalizedFieldMap[fieldName] || guessAnkiModelField(fieldName) || "",
        );
        select.addEventListener("change", () => {
          void this.updateFieldMapping(fieldName, select.value);
        });

        return createFormField(this.doc, fieldName, {
          children: select,
          layout: "inline",
        });
      }),
    );
  }

  private async updateFieldMapping(fieldName: string, value: string) {
    const ankiConfig = this.getConfigValue();
    const nextFieldMap = { ...ankiConfig.fieldMap };
    if (value) nextFieldMap[fieldName] = value;
    else delete nextFieldMap[fieldName];

    await this.setConfigValue({
      ...ankiConfig,
      fieldMap: nextFieldMap,
    }).catch((error) => {
      this.showActionError("Failed to save field mapping", error);
    });
  }

  private async selectNoteType(noteType: string) {
    const currentConfig = this.getConfigValue();
    const fieldNames = await this.ankiService.getModelFields(noteType).catch((error) => {
      this.showActionError("Failed to load field mapping", error);
      throw error;
    });

    const nextAnkiState = {
      ...this.getAnkiStateValue(),
      noteType,
      fieldNames,
    };
    const nextConfig = {
      ...currentConfig,
      noteType,
      fieldMap: normalizeAnkiFieldMap(fieldNames, currentConfig.fieldMap),
    };

    this.applyAnkiState(nextAnkiState, nextConfig);
    await this.setConfigValue(nextConfig).catch((error) => {
      this.showActionError("Failed to save note type", error);
    });
  }

  private async refreshAnkiState() {
    this.refreshButton.disabled = true;
    this.refreshButton.classList.add("loading");
    this.showStatus("info", "Connecting to Anki...");

    try {
      const nextAnkiState = await this.loadAnkiState(this.getConfigValue());
      this.applyAnkiState(nextAnkiState);
      this.showStatus("success", "Anki connection successful!");
    } catch (error) {
      this.showStatus(
        "warning",
        `Failed to connect to Anki: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      this.refreshButton.disabled = false;
      this.refreshButton.classList.remove("loading");
    }
  }

  private async syncTemplate() {
    this.setupButton.disabled = true;
    this.setupButton.classList.add("loading");
    this.showStatus("info", "Processing Anki template...");

    try {
      const ankiConfig = this.getConfigValue();
      await this.ankiService.syncModel(ankiConfig);
      const nextAnkiState = await this.loadAnkiState(ankiConfig);
      this.applyAnkiState(nextAnkiState);
      this.showStatus("success", "Anki template is up to date!");
    } catch (error) {
      this.showStatus(
        "error",
        `Processing failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      this.setupButton.disabled = false;
      this.setupButton.classList.remove("loading");
    }
  }

  private async loadAnkiState(ankiConfig: AnkiConfig): Promise<AnkiState> {
    const [decks, models] = await Promise.all([
      this.ankiService.getDecks().catch(() => []),
      this.ankiService.getModels().catch(() => []),
    ]);
    const noteTypeOptions = (models.length > 0 ? models : [ankiConfig.noteType || "Basic"]).map(
      (value) => ({ value, label: value }),
    );
    const noteType = noteTypeOptions.some((option) => option.value === ankiConfig.noteType)
      ? ankiConfig.noteType
      : (noteTypeOptions[0]?.value ?? ankiConfig.noteType);

    return {
      deckOptions: decks.map((value) => ({ value, label: value })),
      noteType,
      noteTypeOptions,
      fieldNames: await this.ankiService.getModelFields(noteType).catch(() => []),
    };
  }

  private showActionError(message: string, error: unknown) {
    this.showStatus(
      "error",
      `${message}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

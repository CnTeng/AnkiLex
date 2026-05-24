import type { AnkiConfig, AnkiState, SelectOption } from "@common/model";
import { createButton, createInput, createSelect, Icon, setButtonLoading } from "@views/components";
import { RefreshCw } from "lucide";
import { cn } from "tailwind-variants";
import { FormField, SectionIntro, SelectOptions, type StatusLevel } from "./elements";

export interface AnkiOptionsDependencies {
  container: HTMLElement;
  getConfig: () => AnkiConfig;
  setConfig: (ankiConfig: AnkiConfig) => Promise<void>;
  setAnkiState: (ankiState: AnkiState, ankiConfig?: AnkiConfig) => void;
  getAnkiState: () => AnkiState;
  showStatus: (level: StatusLevel, message: string) => void;
  loadAnkiState: (ankiConfig: AnkiConfig) => Promise<AnkiState>;
  syncTemplate: () => Promise<AnkiState>;
}

export class AnkiOptions {
  readonly element: HTMLElement;

  private readonly document: Document;
  private readonly getConfigValue: () => AnkiConfig;
  private readonly setConfigValue: (ankiConfig: AnkiConfig) => Promise<void>;
  private readonly applyAnkiState: (ankiState: AnkiState, ankiConfig?: AnkiConfig) => void;
  private readonly getAnkiStateValue: () => AnkiState;
  private readonly showStatus: (level: StatusLevel, message: string) => void;
  private readonly loadAnkiStateValue: (ankiConfig: AnkiConfig) => Promise<AnkiState>;
  private readonly syncTemplateValue: () => Promise<AnkiState>;

  private readonly urlInput: HTMLInputElement;
  private readonly refreshButton: HTMLButtonElement;
  private readonly noteTypeSelect: HTMLSelectElement;
  private readonly setupButton: HTMLButtonElement;

  constructor({
    container,
    getConfig,
    setConfig,
    setAnkiState,
    getAnkiState,
    showStatus,
    loadAnkiState,
    syncTemplate,
  }: AnkiOptionsDependencies) {
    this.document = container.ownerDocument;
    this.getConfigValue = getConfig;
    this.setConfigValue = setConfig;
    this.applyAnkiState = setAnkiState;
    this.getAnkiStateValue = getAnkiState;
    this.showStatus = showStatus;
    this.loadAnkiStateValue = loadAnkiState;
    this.syncTemplateValue = syncTemplate;

    this.element = this.document.createElement("section");
    this.element.className = cn("space-y-4") as string;

    this.urlInput = createInput({
      doc: this.document,
      id: "anki-url",
      placeholder: "http://127.0.0.1:8765",
    });

    this.refreshButton = createButton({
      doc: this.document,
      title: "Refresh Decks/Models",
      variant: "outline",
      className: "w-full sm:w-auto",
    });
    this.refreshButton.append(
      new Icon({
        doc: this.document,
        iconNode: RefreshCw,
        customAttrs: { width: 16, height: 16 },
      }).element,
      this.document.createTextNode("Refresh"),
    );

    this.noteTypeSelect = this.createSelect("default-note-type");

    this.setupButton = createButton({
      doc: this.document,
      title: "Create or upgrade the optimized Anki-Lex Modern note type in Anki",
      variant: "outline",
      className: "w-full text-left whitespace-normal sm:max-w-64 sm:justify-self-start",
    });
    this.setupButton.append(this.document.createTextNode("Setup Template"));

    this.renderStructure();

    this.registerListeners();
    this.render();
    container.append(this.element);
  }

  render() {
    const ankiConfig = this.getConfigValue();
    const ankiState = this.getAnkiStateValue();

    this.urlInput.value = ankiConfig.connectUrl;
    new SelectOptions(
      this.document,
      this.noteTypeSelect,
      this.ensureCurrentOption(ankiState.noteTypeOptions, ankiState.noteType),
      ankiState.noteType,
    ).render();
  }

  private renderStructure() {
    const content = this.document.createElement("div");
    content.className = cn("space-y-6") as string;
    content.append(
      new FormField(this.document, "AnkiConnect URL", {
        htmlFor: "anki-url",
        children: this.renderControlRow([this.urlInput, this.refreshButton]),
        layout: "inline",
      }).element,
      new FormField(this.document, "Note Type", {
        htmlFor: "default-note-type",
        children: this.renderControlRow([this.noteTypeSelect, this.setupButton]),
        layout: "inline",
        help: "Use the built-in template unless you already maintain your own note type.",
      }).element,
    );

    this.element.append(
      new SectionIntro(
        this.document,
        "Anki",
        "Connect to Anki and choose the note type for generated cards.",
      ).element,
      content,
    );
  }

  private renderControlRow(children: HTMLElement[]) {
    const row = this.document.createElement("div");
    row.className = cn("flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center") as string;
    row.append(...children);
    return row;
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

  private createSelect(id?: string) {
    return createSelect({ doc: this.document, id });
  }

  private async selectNoteType(noteType: string) {
    const currentConfig = this.getConfigValue();
    const nextAnkiState = {
      ...this.getAnkiStateValue(),
      noteType,
    };
    const nextConfig = {
      ...currentConfig,
      noteType,
    };

    this.applyAnkiState(nextAnkiState, nextConfig);
    await this.setConfigValue(nextConfig).catch((error) => {
      this.showActionError("Failed to save note type", error);
    });
  }

  private async refreshAnkiState() {
    setButtonLoading(this.refreshButton, true);
    this.showStatus("info", "Connecting to Anki...");

    await this.loadAnkiStateValue(this.getConfigValue())
      .then((nextAnkiState) => {
        this.applyAnkiState(nextAnkiState);
        this.showStatus("success", "Anki connection successful!");
      })
      .catch((error) => {
        this.showStatus(
          "warning",
          `Failed to connect to Anki: ${error instanceof Error ? error.message : String(error)}`,
        );
      })
      .finally(() => {
        setButtonLoading(this.refreshButton, false);
      });
  }

  private async syncTemplate() {
    setButtonLoading(this.setupButton, true);
    this.showStatus("info", "Processing Anki template...");

    await this.syncTemplateValue()
      .then((nextAnkiState) => {
        this.applyAnkiState(nextAnkiState);
        this.showStatus("success", "Anki template is up to date!");
      })
      .catch((error) => {
        this.showStatus(
          "error",
          `Processing failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      })
      .finally(() => {
        setButtonLoading(this.setupButton, false);
      });
  }

  private showActionError(message: string, error: unknown) {
    this.showStatus(
      "error",
      `${message}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  private ensureCurrentOption(options: SelectOption[], value: string) {
    if (!value || options.some((option) => option.value === value)) return options;
    return [{ value, label: value }, ...options];
  }
}

import {
  getDictionaryConfig,
  type DictionaryConfig,
  type DictionaryLanguageInfo,
  patchDictionaryConfig,
  removeDictionaryLanguage,
  setDictionaryLanguageConfig,
  type SelectOption,
} from "@common/model";
import { createButton, createSelect } from "@views/components";
import { cn } from "tailwind-variants";
import { FormField, SectionIntro } from "./elements";

export interface DictionaryOptionsDependencies {
  container: HTMLElement;
  getDictionaryConfig: () => DictionaryConfig;
  setDictionaryConfig: (dictionaryConfig: DictionaryConfig) => Promise<void>;
  getDictionaryLanguages: () => DictionaryLanguageInfo[];
  getDeckOptions: () => SelectOption[];
}

export class DictionaryOptions {
  readonly element: HTMLElement;

  private readonly document: Document;
  private readonly getDictionaryConfigValue: () => DictionaryConfig;
  private readonly setDictionaryConfigValue: (dictionaryConfig: DictionaryConfig) => Promise<void>;
  private readonly getDictionaryLanguagesValue: () => DictionaryLanguageInfo[];
  private readonly getDeckOptionsValue: () => SelectOption[];
  private readonly rulesBody: HTMLDivElement;
  private readonly addLanguageSelect: HTMLSelectElement;
  private readonly addButton: HTMLButtonElement;

  constructor({
    container,
    getDictionaryConfig,
    setDictionaryConfig,
    getDictionaryLanguages,
    getDeckOptions,
  }: DictionaryOptionsDependencies) {
    this.document = container.ownerDocument;
    this.getDictionaryConfigValue = getDictionaryConfig;
    this.setDictionaryConfigValue = setDictionaryConfig;
    this.getDictionaryLanguagesValue = getDictionaryLanguages;
    this.getDeckOptionsValue = getDeckOptions;

    this.element = this.document.createElement("section");
    this.element.className = cn("space-y-4") as string;

    this.rulesBody = this.document.createElement("div");
    this.rulesBody.className = cn("space-y-2") as string;

    this.addLanguageSelect = this.createSelect();
    this.addButton = createButton({
      doc: this.document,
      variant: "outline",
      className: "w-full sm:w-auto",
    });
    this.addButton.append(this.document.createTextNode("Add Language"));

    this.renderStructure();
    this.registerListeners();
    this.render();
    container.append(this.element);
  }

  render() {
    const dictionaryLanguages = this.getDictionaryLanguagesValue();
    const dictionaryConfig = this.getDictionaryConfigValue();
    const enabledLanguages = dictionaryLanguages.filter((language) => {
      const config = getDictionaryConfig(dictionaryConfig, language.code);
      return !!config.provider;
    });

    this.renderAddLanguageOptions(dictionaryLanguages, enabledLanguages);
    this.renderRuleRows(enabledLanguages, dictionaryConfig);
  }

  private renderStructure() {
    const addLanguageRow = this.renderAddLanguageRow();
    addLanguageRow.classList.remove("mb-6");

    const card = this.document.createElement("div");
    card.className = cn("border-border bg-muted/20 rounded-xl border p-4") as string;
    card.append(this.rulesBody);

    this.element.append(
      new SectionIntro(this.document, "Dictionary", "Pick a provider and deck for each language.")
        .element,
      addLanguageRow,
      card,
    );
  }

  private renderAddLanguageRow() {
    const controls = this.document.createElement("div");
    controls.className = cn("flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center") as string;
    controls.append(this.addLanguageSelect, this.addButton);

    const field = new FormField(this.document, "Language", {
      children: controls,
      layout: "inline",
    }).element;
    return field;
  }

  private renderAddLanguageOptions(
    dictionaryLanguages: DictionaryLanguageInfo[],
    enabledLanguages: DictionaryLanguageInfo[],
  ) {
    const enabled = new Set(enabledLanguages.map((language) => language.code));
    const availableLanguages = dictionaryLanguages.filter(
      (language) => !enabled.has(language.code),
    );

    this.addLanguageSelect.replaceChildren(
      ...(availableLanguages.length > 0
        ? availableLanguages
        : [{ code: "", name: "All languages already added", providers: [] }]
      ).map((language) => {
        const option = this.document.createElement("option");
        option.value = language.code;
        option.textContent = this.getLanguageLabel(language);
        return option;
      }),
    );
    this.addLanguageSelect.disabled = availableLanguages.length === 0;
    this.addButton.disabled = availableLanguages.length === 0;
    this.addButton.textContent = "Add";
  }

  private renderRuleRows(
    enabledLanguages: DictionaryLanguageInfo[],
    dictionaryConfig: DictionaryConfig,
  ) {
    if (enabledLanguages.length === 0) {
      const empty = this.document.createElement("p");
      empty.className = cn("text-muted-foreground text-sm") as string;
      empty.textContent = "No languages added.";
      this.rulesBody.replaceChildren(empty);
      return;
    }

    const rows = this.document.createElement("div");
    rows.className = cn("space-y-2") as string;
    rows.append(
      this.createRulesHeader(),
      ...enabledLanguages.map((language) => this.createRuleRow(language, dictionaryConfig)),
    );
    this.rulesBody.replaceChildren(rows);
  }

  private createRulesHeader() {
    const row = this.document.createElement("div");
    row.className = cn(
      "text-muted-foreground hidden px-4 text-xs font-medium uppercase md:grid md:grid-cols-[minmax(0,160px)_minmax(0,1fr)_minmax(0,1fr)_auto] md:gap-3",
    ) as string;

    ["Language", "Provider", "Deck", ""].forEach((text) => {
      const cell = this.document.createElement("div");
      cell.textContent = text;
      row.append(cell);
    });

    return row;
  }

  private createRuleRow(language: DictionaryLanguageInfo, dictionaryConfig: DictionaryConfig) {
    const config = getDictionaryConfig(dictionaryConfig, language.code);
    const row = this.document.createElement("div");
    row.className = cn(
      "bg-background/80 grid gap-3 rounded-lg p-3 md:grid-cols-[minmax(0,160px)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center",
    ) as string;

    const removeButton = createButton({
      doc: this.document,
      title: `Remove ${language.name}`,
      variant: "ghost",
      className: "text-destructive w-full md:w-auto",
    });
    removeButton.append(this.document.createTextNode("Remove"));
    removeButton.addEventListener("click", () => {
      void this.removeLanguage(language.code);
    });

    const languageField = this.renderStaticField("Language", this.getLanguageLabel(language));
    const providerField = this.renderControlField(
      "Provider",
      this.createProviderSelect(language, config.provider),
    );
    const deckField = this.renderControlField(
      "Deck",
      this.createDeckSelect(language.code, config.deck),
    );

    row.append(languageField, providerField, deckField, removeButton);
    return row;
  }

  private renderStaticField(label: string, value: string) {
    const field = this.document.createElement("div");
    field.className = cn("space-y-1") as string;

    const labelElement = this.document.createElement("p");
    labelElement.className = cn(
      "text-muted-foreground text-xs font-medium uppercase md:hidden",
    ) as string;
    labelElement.textContent = label;

    const valueElement = this.document.createElement("div");
    valueElement.className = cn(
      "text-foreground min-h-11 px-1 py-2.5 text-sm font-medium",
    ) as string;
    valueElement.textContent = value;

    field.append(labelElement, valueElement);
    return field;
  }

  private renderControlField(label: string, control: HTMLElement) {
    const field = this.document.createElement("div");
    field.className = cn("space-y-1") as string;

    const labelElement = this.document.createElement("p");
    labelElement.className = cn(
      "text-muted-foreground text-xs font-medium uppercase md:hidden",
    ) as string;
    labelElement.textContent = label;

    field.append(labelElement, control);
    return field;
  }

  private createProviderSelect(language: DictionaryLanguageInfo, selectedValue: string) {
    const select = this.createSelect();
    this.setSelectOptions(
      select,
      language.providers.map((provider) => ({
        value: provider.id,
        label: provider.name,
      })),
      selectedValue || language.providers[0]?.id || "",
    );
    select.addEventListener("change", () => {
      void this.updateLanguage(language.code, { provider: select.value });
    });
    return select;
  }

  private createDeckSelect(languageCode: string, selectedValue: string) {
    const select = this.createSelect();
    this.setSelectOptions(
      select,
      [
        { value: "", label: "No deck" },
        ...this.getDeckOptionsValue().filter((option) => option.value),
      ],
      selectedValue,
    );
    select.addEventListener("change", () => {
      void this.updateLanguage(languageCode, { deck: select.value });
    });
    return select;
  }

  private registerListeners() {
    this.addButton.addEventListener("click", () => {
      void this.addLanguage();
    });
  }

  private getLanguageLabel(language: Pick<DictionaryLanguageInfo, "code" | "name">) {
    if (!language.code) return language.name;
    return `${language.name} (${language.code})`;
  }

  private createSelect() {
    return createSelect({ doc: this.document });
  }

  private setSelectOptions(select: HTMLSelectElement, options: SelectOption[], value: string) {
    select.replaceChildren(
      ...options.map((option) => {
        const element = this.document.createElement("option");
        element.value = option.value;
        element.textContent = option.label;
        return element;
      }),
    );
    select.value = options.some((option) => option.value === value)
      ? value
      : (options[0]?.value ?? "");
  }

  private async addLanguage() {
    const languageCode = this.addLanguageSelect.value;
    if (!languageCode) return;

    const language = this.getDictionaryLanguagesValue().find((item) => item.code === languageCode);
    if (!language) return;

    await this.setDictionaryConfigValue(
      patchDictionaryConfig(this.getDictionaryConfigValue(), languageCode, {
        provider: language.providers[0]?.id ?? "",
      }),
    );
  }

  private async updateLanguage(languageCode: string, patch: { provider?: string; deck?: string }) {
    await this.setDictionaryConfigValue(
      setDictionaryLanguageConfig(this.getDictionaryConfigValue(), languageCode, patch),
    );
  }

  private async removeLanguage(languageCode: string) {
    await this.setDictionaryConfigValue(
      removeDictionaryLanguage(this.getDictionaryConfigValue(), languageCode),
    );
  }
}

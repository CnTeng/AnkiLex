import {
  addDictionaryProvider,
  type DictionaryConfig,
  type DictionaryLanguageInfo,
  getDictionaryConfig,
  removeDictionaryLanguage,
  removeDictionaryProvider,
  type SelectOption,
} from "@common/model";
import { cn } from "tailwind-variants";
import { createSectionIntro, setSelectOptions } from "./elements";

export interface DictionaryOptionsDependencies {
  doc?: Document;
  getDictionaryConfig: () => DictionaryConfig;
  setDictionaryConfig: (dictionaryConfig: DictionaryConfig) => Promise<void>;
  getDictionaryLanguages: () => DictionaryLanguageInfo[];
  getDeckOptions: () => SelectOption[];
}

function toLanguageLabel(language: DictionaryLanguageInfo): string {
  return `${language.name} (${language.code})`;
}

function findProviderLabel(language: DictionaryLanguageInfo, providerId: string): string {
  return language.providers.find((provider) => provider.id === providerId)?.name ?? providerId;
}

function createField(doc: Document, label: string, control: HTMLElement): HTMLElement {
  const field = doc.createElement("div");
  field.className = cn("space-y-1") as string;
  const labelEl = doc.createElement("p");
  labelEl.className = cn("text-[11px] uppercase") as string;
  labelEl.textContent = label;

  field.append(labelEl, control);
  return field;
}

export class DictionaryOptions {
  readonly element: HTMLElement;

  private readonly doc: Document;
  private readonly getDictionaryConfigValue: () => DictionaryConfig;
  private readonly setDictionaryConfigValue: (dictionaryConfig: DictionaryConfig) => Promise<void>;
  private readonly getDictionaryLanguagesValue: () => DictionaryLanguageInfo[];
  private readonly getDeckOptionsValue: () => SelectOption[];
  private readonly configBody: HTMLDivElement;
  private readonly languageSelect: HTMLSelectElement;
  private readonly providerSelect: HTMLSelectElement;
  private readonly deckSelect: HTMLSelectElement;

  constructor({
    doc = document,
    getDictionaryConfig,
    setDictionaryConfig,
    getDictionaryLanguages,
    getDeckOptions,
  }: DictionaryOptionsDependencies) {
    this.doc = doc;
    this.getDictionaryConfigValue = getDictionaryConfig;
    this.setDictionaryConfigValue = setDictionaryConfig;
    this.getDictionaryLanguagesValue = getDictionaryLanguages;
    this.getDeckOptionsValue = getDeckOptions;

    const section = this.doc.createElement("section");
    section.className = "p-0";

    const content = this.doc.createElement("div");
    content.className = cn("space-y-3") as string;
    const composer = this.doc.createElement("div");
    composer.className = cn("grid items-end gap-3 md:grid-cols-2 xl:grid-cols-4") as string;

    this.configBody = this.doc.createElement("div");
    this.configBody.className = cn("max-h-72 divide-y overflow-y-auto border-t") as string;

    this.languageSelect = this.doc.createElement("select");
    this.languageSelect.className = "select w-full";
    this.languageSelect.style.colorScheme = "light dark";

    this.providerSelect = this.doc.createElement("select");
    this.providerSelect.className = this.languageSelect.className;
    this.providerSelect.style.colorScheme = "light dark";

    this.deckSelect = this.doc.createElement("select");
    this.deckSelect.className = this.languageSelect.className;
    this.deckSelect.style.colorScheme = "light dark";

    const addButton = this.doc.createElement("button");
    addButton.type = "button";
    addButton.className = "btn btn-outline w-full lg:min-w-28";
    addButton.append(this.doc.createTextNode("Add"));
    addButton.addEventListener("click", () => {
      void this.addProvider();
    });

    this.languageSelect.addEventListener("change", () => this.render());

    composer.append(
      createField(this.doc, "Language", this.languageSelect),
      createField(this.doc, "Provider", this.providerSelect),
      createField(this.doc, "Deck", this.deckSelect),
      createField(this.doc, " ", addButton),
    );

    content.append(composer, this.configBody);
    section.append(
      createSectionIntro(
        this.doc,
        "Dictionary",
        "Choose which providers and decks are used for each language you want to look up.",
      ),
      content,
    );

    this.element = section;
    this.render();
  }

  render() {
    const dictionaryLanguages = this.getDictionaryLanguagesValue();
    const dictionaryConfig = this.getDictionaryConfigValue();
    const deckOptions = [
      { value: "", label: "No deck" },
      ...this.getDeckOptionsValue().filter((o) => o.value),
    ];

    setSelectOptions(
      this.doc,
      this.languageSelect,
      dictionaryLanguages.map((language) => ({
        value: language.code,
        label: toLanguageLabel(language),
      })),
      this.languageSelect.value || dictionaryLanguages[0]?.code || "",
    );

    const languageCode = this.languageSelect.value || dictionaryLanguages[0]?.code || "";
    const language = dictionaryLanguages.find((item) => item.code === languageCode);
    const providerOptions =
      language?.providers.map((provider) => ({ value: provider.id, label: provider.name })) ?? [];

    setSelectOptions(
      this.doc,
      this.providerSelect,
      providerOptions.length > 0
        ? providerOptions
        : [{ value: "", label: "No providers available" }],
      this.providerSelect.value || providerOptions[0]?.value || "",
    );

    setSelectOptions(
      this.doc,
      this.deckSelect,
      deckOptions,
      getDictionaryConfig(dictionaryConfig, languageCode).deck,
    );

    const items = dictionaryLanguages
      .filter((languageItem) => {
        const config = getDictionaryConfig(dictionaryConfig, languageItem.code);
        return !!config.deck || config.providers.length > 0;
      })
      .map((languageItem) => this.createLanguageItem(languageItem, dictionaryConfig));

    if (items.length === 0) {
      const empty = this.doc.createElement("p");
      empty.className = cn("px-3 py-2 text-xs") as string;
      empty.textContent = "No language options yet.";
      this.configBody.replaceChildren(empty);
      return;
    }

    this.configBody.replaceChildren(...items);
  }

  private createLanguageItem(language: DictionaryLanguageInfo, dictionaryConfig: DictionaryConfig) {
    const config = getDictionaryConfig(dictionaryConfig, language.code);
    const item = this.doc.createElement("div");
    item.className = cn(
      "flex flex-col gap-3 px-3 py-3 lg:grid lg:grid-cols-12 lg:items-center lg:gap-3",
    ) as string;

    const languageName = this.doc.createElement("div");
    languageName.className = cn("truncate text-sm lg:col-span-3") as string;
    languageName.textContent = toLanguageLabel(language);

    const deckText = this.doc.createElement("div");
    deckText.className = cn("w-fit text-xs lg:col-span-2") as string;
    deckText.textContent = config.deck || "(No deck)";

    const providers = this.doc.createElement("div");
    providers.className = cn("flex flex-wrap gap-1.5 lg:col-span-6") as string;
    if (config.providers.length === 0) {
      const empty = this.doc.createElement("p");
      empty.className = cn("text-xs") as string;
      empty.textContent = "No providers selected.";
      providers.append(empty);
    } else {
      for (const providerId of config.providers) {
        providers.append(this.createProviderChip(language, providerId, dictionaryConfig));
      }
    }

    const removeBtn = this.doc.createElement("button");
    removeBtn.type = "button";
    removeBtn.title = "Remove language option";
    removeBtn.className = "btn btn-ghost btn-circle btn-xs self-start lg:justify-self-end";
    removeBtn.append(this.doc.createTextNode("×"));
    removeBtn.addEventListener("click", () => {
      void this.setDictionaryConfigValue(removeDictionaryLanguage(dictionaryConfig, language.code));
    });

    item.append(languageName, deckText, providers, removeBtn);
    return item;
  }

  private createProviderChip(
    language: DictionaryLanguageInfo,
    providerId: string,
    dictionaryConfig: DictionaryConfig,
  ) {
    const chip = this.doc.createElement("div");
    chip.className = cn("badge badge-outline badge-sm gap-1") as string;
    const text = this.doc.createElement("span");
    text.className = cn("text-xs") as string;
    text.textContent = findProviderLabel(language, providerId);

    const removeBtn = this.doc.createElement("button");
    removeBtn.type = "button";
    removeBtn.title = "Remove provider";
    removeBtn.className = "btn btn-ghost btn-circle btn-xs";
    removeBtn.append(this.doc.createTextNode("×"));
    removeBtn.addEventListener("click", () => {
      void this.setDictionaryConfigValue(
        removeDictionaryProvider(dictionaryConfig, language.code, providerId),
      );
    });

    chip.append(text, removeBtn);
    return chip;
  }

  private async addProvider() {
    const languageCode =
      this.languageSelect.value || this.getDictionaryLanguagesValue()[0]?.code || "";
    const provider = this.providerSelect.value;
    const deck = this.deckSelect.value;
    if (!languageCode || !provider) return;

    await this.setDictionaryConfigValue(
      addDictionaryProvider(this.getDictionaryConfigValue(), languageCode, provider, deck),
    );
  }
}

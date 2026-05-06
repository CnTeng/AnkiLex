import { Event } from "@common/event";
import type { DictionaryEntry, IConfigService, IDictionaryService } from "@common/model";
import { Icon } from "@views/components";
import { Search } from "lucide";
import { cn } from "tailwind-variants";

export interface SearchBarOptions {
  doc?: Document;
  configService: IConfigService;
  dictionaryService: IDictionaryService;
}

export class SearchBar {
  readonly element: HTMLDivElement;

  private readonly doc: Document;
  private readonly configService: IConfigService;
  private readonly dictionaryService: IDictionaryService;

  private readonly eventController = new AbortController();
  private readonly didSubmitSearch = new Event<
    Promise<DictionaryEntry | null>,
    Promise<void> | void
  >();

  private searchInput: HTMLInputElement | undefined;
  private langSelect: HTMLSelectElement | undefined;
  private readonly unsubscribeConfigChange: () => void;

  private languages: string[] = [];
  private selectedLanguage = "";

  constructor({ doc = document, configService, dictionaryService }: SearchBarOptions) {
    this.doc = doc;
    this.configService = configService;
    this.dictionaryService = dictionaryService;

    this.element = this.doc.createElement("div");
    this.element.className = cn("w-full p-2") as string;

    this.renderInputRow(this.element);

    this.registerListeners();
    this.unsubscribeConfigChange = this.configService.onDidChange((e) => {
      if (!e.affects("dictionary")) return;
      void this.updateLanguages();
    });

    void this.updateLanguages();
  }

  dispose() {
    this.eventController.abort();
    this.didSubmitSearch.clear();
    this.unsubscribeConfigChange();
  }

  onDidSubmitSearch(listener: (result: Promise<DictionaryEntry | null>) => Promise<void> | void) {
    return this.didSubmitSearch.on(listener);
  }

  focus() {
    if (!this.searchInput) return;
    this.searchInput.focus();
  }

  private renderInputRow(container: HTMLElement) {
    const row = this.doc.createElement("div");
    row.className = cn("input flex") as string;

    this.renderSearchIcon(row);
    this.renderInput(row);
    this.renderLangSelect(row);

    container.append(row);
  }

  private renderSearchIcon(container: HTMLElement): void {
    const icon = Icon({
      doc: this.doc,
      iconNode: Search,
      className: cn("text-base-content/80 my-auto me-3 size-4 shrink-0"),
    });

    container.append(icon);
  }

  private renderInput(container: HTMLElement): void {
    this.searchInput = this.doc.createElement("input");
    this.searchInput.className = cn("grow") as string;
    this.searchInput.type = "text";
    this.searchInput.required = true;
    this.searchInput.placeholder = "Search";
    this.searchInput.autocomplete = "off";

    container.append(this.searchInput);
  }

  private renderLangSelect(container: HTMLElement): void {
    this.langSelect = this.doc.createElement("select");
    this.langSelect.className = cn("select ms-2 w-20 ps-2 pe-7") as string;

    container.append(this.langSelect);
  }

  private renderLangSelectOptions() {
    if (!this.langSelect || !this.searchInput) return;
    this.langSelect.replaceChildren(
      ...["", ...this.languages].map((lang) => {
        const option = this.doc.createElement("option");

        option.value = lang;
        option.textContent = lang ? lang.toUpperCase() : "🌐";

        return option;
      }),
    );
    this.langSelect.value = this.selectedLanguage;
  }

  private registerListeners() {
    if (!this.searchInput || !this.langSelect) return;
    const { searchInput, langSelect } = this;
    searchInput.addEventListener(
      "keydown",
      (event: KeyboardEvent) => {
        if (event.key !== "Enter") return;
        void this.submit();
      },
      { signal: this.eventController.signal },
    );

    langSelect.addEventListener(
      "change",
      () => {
        this.selectedLanguage = langSelect.value;
      },
      { signal: this.eventController.signal },
    );
  }

  private async updateLanguages(): Promise<void> {
    this.languages = await this.configService.getLanguageCodes();
    this.selectedLanguage = this.languages.includes(this.selectedLanguage)
      ? this.selectedLanguage
      : "";
    this.renderLangSelectOptions();
  }

  private async submit() {
    if (!this.searchInput || !this.langSelect) return;
    if (this.searchInput.disabled || this.langSelect.disabled) return;

    const word = this.searchInput.value.trim();
    if (!word) return;

    this.searchInput.disabled = true;
    this.langSelect.disabled = true;

    const result = this.dictionaryService.lookup(
      word,
      this.selectedLanguage ? { context: "", lang: this.selectedLanguage } : undefined,
    );
    await Promise.all([
      ...this.didSubmitSearch.emit(result).map((value) => Promise.resolve(value)),
      result.catch(() => undefined),
    ]).finally(() => {
      if (this.searchInput) this.searchInput.disabled = false;
      if (this.langSelect) this.langSelect.disabled = false;
    });
  }
}

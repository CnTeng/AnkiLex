import type { DictionaryEntry, IConfigService, IDictionaryService } from "@common/model";
import { Icon } from "@ui/components";
import { ChevronDown, Search } from "lucide";
import pLimit from "p-limit";
import { cn } from "tailwind-variants";

export interface SearchBarOptions {
  doc?: Document;
  configService: IConfigService;
  dictionaryService: IDictionaryService;
}

function normalizeLanguages(languages: string[]) {
  return [...new Set(languages.map((language) => language.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
}

function createOption(doc: Document, value: string, text: string) {
  const option = doc.createElement("option");
  option.value = value;
  option.textContent = text;
  return option;
}

export class SearchBar {
  readonly element: HTMLDivElement;

  private readonly doc: Document;
  private readonly configService: IConfigService;
  private readonly dictionaryService: IDictionaryService;
  private readonly runSearch = pLimit(1);
  private readonly eventController = new AbortController();
  private readonly submitListeners = new Set<
    (result: Promise<DictionaryEntry | null>) => Promise<void> | void
  >();

  private readonly searchInput: HTMLInputElement;
  private readonly langSelect: HTMLSelectElement;
  private readonly statusText: HTMLDivElement;
  private readonly unsubscribeConfigChange: () => void;

  private languages: string[] = [];
  private selectedLanguage = "";
  private loading = false;

  constructor({ doc = document, configService, dictionaryService }: SearchBarOptions) {
    this.doc = doc;
    this.configService = configService;
    this.dictionaryService = dictionaryService;

    this.element = this.doc.createElement("div");
    this.element.className = cn("w-full p-2") as string;

    const card = this.renderWidget();
    const inputRow = this.renderInputRow();
    this.searchInput = this.renderInput();
    this.langSelect = this.renderLanguageSelect();
    this.statusText = this.renderStatus();

    inputRow.append(
      this.renderSearchIcon(),
      this.searchInput,
      this.renderDivider(),
      this.renderActionBar(),
    );
    card.append(this.renderTitle(), inputRow, this.statusText);
    this.element.append(card);

    this.registerListeners();
    this.unsubscribeConfigChange = this.configService.onDidChange((event) => {
      if (!event.affects("dictionary")) return;
      void this.loadLanguages();
    });
    this.render();
    void this.loadLanguages();
  }

  dispose() {
    this.eventController.abort();
    this.submitListeners.clear();
    this.unsubscribeConfigChange();
  }

  onDidSubmitSearch(listener: (result: Promise<DictionaryEntry | null>) => Promise<void> | void) {
    this.submitListeners.add(listener);
    return () => this.submitListeners.delete(listener);
  }

  focus() {
    this.searchInput.focus();
  }

  setValue(value: string) {
    this.searchInput.value = value;
  }

  private renderWidget() {
    const card = this.doc.createElement("div");
    card.className = cn(
      "border-base-300 bg-base-100 text-base-content rounded-md border px-2 py-1.5",
    ) as string;
    return card;
  }

  private renderTitle() {
    const title = this.doc.createElement("div");
    title.className = cn(
      "text-base-content/55 px-1 pb-1 text-[10px] font-medium uppercase",
    ) as string;
    title.textContent = "Search";
    return title;
  }

  private renderInputRow() {
    const row = this.doc.createElement("div");
    row.className = cn("flex min-w-0 items-center") as string;
    return row;
  }

  private renderSearchIcon() {
    const iconWrapper = this.doc.createElement("div");
    iconWrapper.className = cn(
      "text-base-content/65 flex h-7 w-7 shrink-0 items-center justify-center",
    ) as string;
    iconWrapper.append(
      Icon({
        doc: this.doc,
        iconNode: Search,
        className: cn("size-4 shrink-0"),
      }),
    );
    return iconWrapper;
  }

  private renderInput() {
    const input = this.doc.createElement("input");
    input.className = cn(
      "placeholder:text-base-content/45 min-w-0 grow bg-transparent px-1 text-sm outline-none",
    ) as string;
    input.type = "text";
    input.required = true;
    input.placeholder = "Search";
    input.autocomplete = "off";
    return input;
  }

  private renderDivider() {
    const divider = this.doc.createElement("div");
    divider.className = cn("bg-base-300 mx-1 h-5 w-px shrink-0 opacity-70") as string;
    return divider;
  }

  private renderActionBar() {
    const actions = this.doc.createElement("div");
    actions.className = cn("relative flex shrink-0 items-center") as string;
    actions.append(this.langSelect, this.renderChevron());
    return actions;
  }

  private renderLanguageSelect() {
    const select = this.doc.createElement("select");
    select.className = cn(
      "text-base-content/80 h-7 appearance-none bg-transparent ps-2 pe-4 text-[11px] font-medium uppercase outline-none",
    ) as string;
    select.ariaLabel = "Language";
    return select;
  }

  private renderChevron() {
    const chevron = this.doc.createElement("div");
    chevron.className = cn("pointer-events-none absolute inset-e-0") as string;
    chevron.append(
      Icon({
        doc: this.doc,
        iconNode: ChevronDown,
        className: cn("size-3.5 opacity-70"),
      }),
    );
    return chevron;
  }

  private renderStatus() {
    const status = this.doc.createElement("div");
    status.className = cn("text-base-content/55 px-1 pt-1 text-[10px]") as string;
    return status;
  }

  private registerListeners() {
    this.searchInput.addEventListener(
      "keydown",
      (event: KeyboardEvent) => {
        if (event.key !== "Enter") return;
        void this.submit();
      },
      { signal: this.eventController.signal },
    );

    this.langSelect.addEventListener(
      "change",
      () => {
        this.selectedLanguage = this.langSelect.value;
        this.render();
      },
      { signal: this.eventController.signal },
    );
  }

  private async loadLanguages() {
    const languages = await this.configService.getLanguageCodes();
    this.setLanguages(languages ?? []);
  }

  private setLanguages(languages: string[]) {
    const nextLanguages = normalizeLanguages(languages);
    this.languages = nextLanguages;
    this.selectedLanguage = nextLanguages.includes(this.selectedLanguage)
      ? this.selectedLanguage
      : "";
    this.render();
  }

  private render() {
    this.langSelect.replaceChildren(
      createOption(this.doc, "", "ALL"),
      ...this.languages.map((language) => createOption(this.doc, language, language.toUpperCase())),
    );
    this.langSelect.value = this.selectedLanguage;
    this.searchInput.disabled = this.loading;
    this.langSelect.disabled = this.loading;
    this.statusText.textContent = this.loading
      ? "Searching..."
      : this.selectedLanguage
        ? `Enter to search in ${this.selectedLanguage.toUpperCase()}`
        : "Enter to search";
  }

  private async submit() {
    const word = this.searchInput.value.trim();
    if (!word) return;

    this.runSearch.clearQueue();
    await this.runSearch(async () => {
      this.loading = true;
      this.render();

      try {
        const result = this.dictionaryService.lookup(
          word,
          this.selectedLanguage ? { context: "", lang: this.selectedLanguage } : undefined,
        );
        await Promise.all([
          ...[...this.submitListeners].map((listener) => Promise.resolve(listener(result))),
          result.catch(() => undefined),
        ]);
      } finally {
        this.loading = false;
        this.render();
      }
    });
  }
}

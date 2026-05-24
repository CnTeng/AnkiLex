import { Event } from "@common/event";
import type { DictionaryEntry, IDictionaryService } from "@common/model";
import { buttonStyles, Icon } from "@views/components";
import { Search, Settings } from "lucide";
import { cn } from "tailwind-variants";

export interface SearchBarOptions {
  container: HTMLElement;
  dictionaryService: IDictionaryService;
}

export interface SearchSubmission {
  word: string;
  result: Promise<DictionaryEntry | null>;
}

export class SearchBar {
  private readonly document: Document;
  private readonly element: HTMLDivElement;
  private readonly dictionaryService: IDictionaryService;

  private readonly eventController = new AbortController();
  private readonly didSubmitSearch = new Event<SearchSubmission, Promise<void> | void>();

  private searchInput: HTMLInputElement | undefined;

  constructor({ container, dictionaryService }: SearchBarOptions) {
    this.document = container.ownerDocument;
    this.dictionaryService = dictionaryService;

    this.element = this.document.createElement("div");
    this.element.className = cn("border-border bg-background w-full border-b px-3 py-2") as string;

    this.render(this.element);
    container.append(this.element);

    this.registerListeners();
  }

  dispose() {
    this.eventController.abort();
    this.didSubmitSearch.clear();
  }

  onDidSubmitSearch(listener: (submission: SearchSubmission) => Promise<void> | void) {
    return this.didSubmitSearch.on(listener);
  }

  focus() {
    if (!this.searchInput) return;
    this.searchInput.focus();
  }

  private render(container: HTMLElement) {
    const row = this.document.createElement("div");
    row.className = cn(
      "border-border bg-muted focus-within:border-ring focus-within:ring-ring/20 grid w-full grid-cols-[32px_minmax(0,1fr)_32px] items-center rounded-full border shadow-sm transition-all focus-within:ring-2",
    ) as string;

    this.renderSearchIcon(row);
    this.renderInput(row);
    this.renderSettingsButton(row);

    container.append(row);
  }

  private renderSearchIcon(container: HTMLElement): void {
    const wrapper = this.document.createElement("span");
    wrapper.className = cn("text-muted-foreground flex items-center justify-center") as string;

    const icon = new Icon({
      doc: this.document,
      iconNode: Search,
      customAttrs: { width: 16, height: 16 },
    }).element;

    wrapper.append(icon);
    container.append(wrapper);
  }

  private renderInput(container: HTMLElement): void {
    this.searchInput = this.document.createElement("input");
    this.searchInput.className = cn(
      "text-foreground placeholder:text-muted-foreground w-full border-none bg-transparent px-2 py-1.5 text-sm shadow-none outline-none hover:border-transparent focus-visible:border-transparent focus-visible:shadow-none",
    ) as string;
    this.searchInput.type = "text";
    this.searchInput.required = true;
    this.searchInput.placeholder = "Search ...";
    this.searchInput.autocomplete = "off";

    container.append(this.searchInput);
  }

  private renderSettingsButton(container: HTMLElement): void {
    const button = this.document.createElement("button");
    button.type = "button";
    button.title = "Settings";
    button.className = cn(
      buttonStyles({ variant: "ghost", size: "iconSm" }),
      "text-muted-foreground hover:text-foreground",
    ) as string;
    button.append(
      new Icon({
        doc: this.document,
        iconNode: Settings,
        customAttrs: { width: 16, height: 16 },
      }).element,
    );
    button.addEventListener("click", () => {
      void chrome.runtime.openOptionsPage();
    });
    container.append(button);
  }

  private registerListeners() {
    if (!this.searchInput) return;
    const { searchInput } = this;
    searchInput.addEventListener(
      "keydown",
      (event: KeyboardEvent) => {
        if (event.key !== "Enter") return;
        void this.submit();
      },
      { signal: this.eventController.signal },
    );
  }

  private async submit() {
    if (!this.searchInput) return;
    if (this.searchInput.disabled) return;

    const word = this.searchInput.value.trim();
    if (!word) return;

    this.searchInput.disabled = true;
    const result = this.dictionaryService.lookup(word);
    const submission = { word, result };
    await Promise.all([
      ...this.didSubmitSearch.emit(submission).map((value) => Promise.resolve(value)),
      result.catch(() => undefined),
    ]).finally(() => {
      if (this.searchInput) this.searchInput.disabled = false;
    });
  }
}

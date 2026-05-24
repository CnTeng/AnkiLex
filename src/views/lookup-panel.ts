import type {
  Context,
  DictionaryEntry,
  DictionaryProviderInfo,
  DictionaryLanguageInfo,
  IAnkiService,
  IConfigService,
  IDictionaryService,
} from "@common/model";
import { DropdownButton, Editor, Icon, type IconOptions } from "@views/components";
import { DictionaryEntry as DictionaryEntrySection } from "@views/dictionary/entry";
import { LoaderCircle, SearchX, TriangleAlert } from "lucide";
import { cn } from "tailwind-variants";

interface LookupRequest {
  word: string;
  context?: Context;
}

interface LookupState extends LookupRequest {
  selectedLanguage: string;
  selectedProvider: string;
}

export interface LookupPanelOptions {
  container: HTMLElement;
  className?: string;
  ankiService?: IAnkiService;
  configService?: IConfigService;
  dictionaryService?: IDictionaryService;
}

export class LookupPanel {
  private readonly document: Document;
  private readonly element: HTMLDivElement;
  private readonly header: HTMLDivElement | undefined;
  private readonly headerWord: HTMLHeadingElement | undefined;
  private readonly content: HTMLDivElement;
  private readonly ankiService?: IAnkiService;
  private readonly configService?: IConfigService;
  private readonly dictionaryService?: IDictionaryService;
  private readonly providerDropdown: DropdownButton | undefined;
  private currentLoadId = 0;
  private providerLoading = false;
  private currentRequest: LookupState | undefined;
  private dictionaryLanguages: DictionaryLanguageInfo[] = [];
  private providerOptions: DictionaryProviderInfo[] = [];

  constructor({
    container,
    className,
    ankiService,
    configService,
    dictionaryService,
  }: LookupPanelOptions) {
    this.document = container.ownerDocument;
    this.ankiService = ankiService;
    this.configService = configService;
    this.dictionaryService = dictionaryService;

    this.element = this.document.createElement("div");
    this.element.className = className ?? cn("flex min-h-0 flex-1 flex-col") ?? "";

    if (this.configService && this.dictionaryService) {
      this.header = this.document.createElement("div");
      this.header.className = cn(
        "border-border/80 bg-background/95 flex items-center justify-between gap-3 border-b px-4 py-3",
      ) as string;
      this.header.hidden = true;

      this.headerWord = this.document.createElement("h2");
      this.headerWord.className = cn(
        "text-foreground min-w-0 truncate text-[1.1rem] leading-none font-semibold tracking-tight",
      ) as string;

      this.providerDropdown = new DropdownButton({
        doc: this.document,
        title: "Lookup provider",
        onSelect: (value) => {
          void this.reloadWithProvider(value);
        },
      });

      this.header.append(this.headerWord, this.providerDropdown.element);
      this.element.append(this.header);

      void this.updateProviderOptions();
    }

    this.content = this.document.createElement("div");
    this.content.className = cn("flex min-h-0 flex-1 flex-col") as string;
    this.element.append(this.content);

    container.append(this.element);

    this.showLoading();
  }

  load(entryPromise: Promise<DictionaryEntry | null>, request?: LookupRequest) {
    this.showLoading();
    this.currentLoadId += 1;
    const loadId = this.currentLoadId;
    if (request) {
      this.currentRequest = this.createLookupState(request);
      this.renderHeader();
      this.renderProviderControl();
    }
    this.setProviderDisabled(true);

    return entryPromise
      .then((entry) => {
        if (loadId !== this.currentLoadId) return;

        if (entry) {
          this.syncRequestWithEntry(entry);
          this.renderHeader();
          this.renderProviderControl();
        }

        if (!entry) {
          this.renderHeader();
          this.showEmpty();
          return;
        }

        this.content.replaceChildren(this.createContent(entry));
      })
      .catch((error) => {
        if (loadId !== this.currentLoadId) return;
        this.renderHeader();
        this.showError(error instanceof Error ? error.message : String(error));
      })
      .finally(() => {
        if (loadId !== this.currentLoadId) return;
        this.setProviderDisabled(false);
      });
  }

  private createContent(entry: DictionaryEntry) {
    const container = this.document.createElement("div");
    container.className = cn("flex h-0 flex-1 flex-col overflow-hidden") as string;
    container.append(this.renderScrollArea(entry), this.renderEditorWrapper(entry));
    return container;
  }

  private renderScrollArea(entry: DictionaryEntry) {
    const scrollArea = this.document.createElement("div");
    scrollArea.className = cn("h-0 flex-1 overflow-y-auto px-4 py-3") as string;
    new DictionaryEntrySection({
      container: scrollArea,
      entry,
      ankiService: this.ankiService,
    });
    return scrollArea;
  }

  private renderEditorWrapper(entry: DictionaryEntry) {
    const editorWrapper = this.document.createElement("div");
    editorWrapper.className = cn("border-border/80 bg-muted/80 shrink-0 border-t") as string;

    const editor = new Editor({
      ownerDocument: this.document,
      className: cn("h-[20%] min-h-24") as string,
      placeholder: "Context / Note (Markdown supported)...",
    });
    editor.setContent(entry.context ?? "");
    editorWrapper.append(editor.element);

    return editorWrapper;
  }

  private showLoading(message = "Looking up...") {
    this.showStatus({
      message,
      iconNode: LoaderCircle,
      iconClassName: "animate-spin",
      containerClassName: cn(
        "text-foreground/80 flex flex-col items-center justify-center gap-3 py-8",
      ) as string,
      textClassName: cn("text-foreground animate-pulse text-sm") as string,
    });
  }

  private showEmpty(message = "Looking up...") {
    this.showStatus({
      message,
      iconNode: SearchX,
      containerClassName: cn(
        "text-foreground/80 flex flex-col items-center justify-center gap-3 py-8",
      ) as string,
      textClassName: cn("text-foreground text-sm") as string,
    });
  }

  private showError(message = "Something went wrong") {
    this.showStatus({
      message,
      iconNode: TriangleAlert,
      containerClassName: "flex flex-col items-center justify-center gap-3 py-8",
      textClassName: cn("text-destructive text-sm") as string,
    });
  }

  private showStatus({
    message,
    iconNode,
    iconClassName,
    containerClassName,
    textClassName,
  }: {
    message: string;
    iconNode: IconOptions["iconNode"];
    iconClassName?: string;
    containerClassName: string;
    textClassName: string;
  }) {
    const container = this.document.createElement("div");
    container.className = containerClassName;

    const icon = this.document.createElement("div");
    icon.replaceChildren(
      new Icon({
        doc: this.document,
        iconNode,
        customAttrs: iconClassName ? { class: iconClassName } : undefined,
      }).element,
    );

    const text = this.document.createElement("p");
    text.className = textClassName;
    text.textContent = message;

    container.append(icon, text);
    this.content.replaceChildren(container);
  }

  private async updateProviderOptions() {
    if (!this.configService || !this.dictionaryService || !this.providerDropdown) return;

    const [languageCodes, languages] = await Promise.all([
      this.configService.getLanguageCodes(),
      this.dictionaryService.getLanguages(),
    ]);
    this.dictionaryLanguages = languages.filter((language) =>
      languageCodes.includes(language.code),
    );
    this.providerOptions = [
      ...new Map(
        this.dictionaryLanguages
          .flatMap((language) => language.providers)
          .map((provider) => [provider.id, provider]),
      ).values(),
    ];
    this.renderProviderControl();
  }

  private createLookupState(request: LookupRequest): LookupState {
    const previousRequest = this.currentRequest;
    const isSameWord = previousRequest?.word === request.word;
    return {
      ...request,
      selectedLanguage: isSameWord
        ? (previousRequest?.selectedLanguage ?? "")
        : this.normalizeLanguageCode(request.context?.lang),
      selectedProvider: isSameWord
        ? (previousRequest?.selectedProvider ?? "")
        : (request.context?.provider?.trim() ?? ""),
    };
  }

  private syncRequestWithEntry(entry: DictionaryEntry) {
    if (!this.currentRequest) return;
    this.currentRequest.selectedLanguage = entry.language ?? this.currentRequest.selectedLanguage;
    this.currentRequest.selectedProvider = entry.provider ?? this.currentRequest.selectedProvider;
  }

  private normalizeLanguageCode(language: string | undefined) {
    return language?.split("-")[0]?.trim() ?? "";
  }

  private renderHeader() {
    if (!this.header || !this.headerWord || !this.currentRequest) return;
    this.header.hidden = false;
    this.headerWord.textContent = this.currentRequest.word;
  }

  private renderProviderControl() {
    if (!this.providerDropdown || !this.currentRequest) return;

    const { providerDropdown, currentRequest, providerOptions } = this;

    const selectedProvider = providerOptions.find(
      ({ id }) => id === currentRequest.selectedProvider,
    );
    const fallbackProvider = providerOptions.find(({ id }) => id === this.getDefaultProviderId());
    providerDropdown.setLabel(
      selectedProvider?.name ?? fallbackProvider?.name ?? providerOptions[0]?.name ?? "Provider",
    );
    providerDropdown.setDisabled(this.providerLoading || providerOptions.length <= 1);
    providerDropdown.setOptions(
      providerOptions.map(({ id, name }) => ({ value: id, label: name })),
      selectedProvider?.id ?? "",
    );
  }

  private getDefaultProviderId() {
    if (this.currentRequest?.selectedLanguage) {
      const providerId = this.dictionaryLanguages.find(
        (language) => language.code === this.currentRequest?.selectedLanguage,
      )?.providers[0]?.id;
      if (providerId) return providerId;
    }

    return this.providerOptions[0]?.id ?? "";
  }

  private setProviderDisabled(disabled: boolean) {
    this.providerLoading = disabled;
    this.renderProviderControl();
  }

  private async reloadWithProvider(selectedProvider: string) {
    if (!this.currentRequest || !this.dictionaryService) return;

    this.currentRequest.selectedProvider = selectedProvider;
    const context = selectedProvider
      ? {
          context: this.currentRequest.context?.context ?? "",
          lang: this.currentRequest.selectedLanguage || this.currentRequest.context?.lang || "",
          provider: selectedProvider,
        }
      : this.currentRequest.context;
    await this.load(this.dictionaryService.lookup(this.currentRequest.word, context), {
      word: this.currentRequest.word,
      context: this.currentRequest.context,
    });
  }
}

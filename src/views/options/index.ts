import { Event } from "@common/event";
import type { IAnkiService, IConfigService, IDictionaryService } from "@common/types";
import { cn } from "tailwind-variants";
import { AnkiOptions } from "./anki";
import { DictionaryOptions } from "./dict";
import { OptionsFooter } from "./footer";

export class OptionsPage {
  private readonly container: HTMLElement;
  private readonly document: Document;
  private readonly element: HTMLDivElement;
  private readonly configService: IConfigService;
  private readonly dictionaryService: IDictionaryService;
  private readonly ankiService: IAnkiService;

  private footer!: OptionsFooter;
  private dictionaryOptions!: DictionaryOptions;
  private ankiOptions!: AnkiOptions;

  private readonly didChangeDecks = new Event<void>();

  constructor({
    container,
    configService,
    dictionaryService,
    ankiService,
  }: {
    container: HTMLElement;
    configService: IConfigService;
    dictionaryService: IDictionaryService;
    ankiService: IAnkiService;
  }) {
    this.container = container;
    this.document = container.ownerDocument;
    this.configService = configService;
    this.dictionaryService = dictionaryService;
    this.ankiService = ankiService;

    this.element = this.document.createElement("div");
    this.element.className = "text-foreground";

    this.container.replaceChildren(
      OptionsPage.createStateMessage(this.document, "Loading options..."),
    );
    void this.load().catch((error) => {
      this.showLoadError(error);
    });
  }

  private async load() {
    this.renderStructure();
    this.container.replaceChildren(this.element);
  }

  dispose() {
    this.dictionaryOptions?.dispose();
    this.ankiOptions?.dispose();
    this.didChangeDecks.clear();
  }

  private renderStructure() {
    const frame = this.document.createElement("div");
    frame.className = cn(
      "border-border bg-background w-full overflow-hidden rounded-lg border shadow-xs",
    ) as string;

    const sections = this.document.createElement("div");
    sections.className = cn("space-y-10 px-4 py-6 sm:px-6") as string;

    this.dictionaryOptions = new DictionaryOptions({
      container: sections,
      ankiService: this.ankiService,
      configService: this.configService.dictionary,
      didChangeDecks: this.didChangeDecks,
      dictionaryService: this.dictionaryService,
    });

    this.ankiOptions = new AnkiOptions({
      container: sections,
      ankiService: this.ankiService,
      configService: this.configService.anki,
      didChangeDecks: this.didChangeDecks,
      showStatus: (level, message) => this.footer.status.show(message, level),
    });

    frame.append(sections);
    this.footer = new OptionsFooter(frame);
    this.footer.setResetAction(() => this.reset());
    this.element.append(frame);
  }

  private async reset() {
    if (
      !this.document.defaultView?.confirm("Are you sure you want to reset all options to defaults?")
    ) {
      return;
    }

    await this.configService
      .reset()
      .then(() => {
        this.footer.status.show("Options reset to defaults.", "success");
      })
      .catch((error) => {
        this.footer.status.show(
          `Failed to reset options: ${error instanceof Error ? error.message : String(error)}`,
          "error",
        );
      });
  }

  private showLoadError(error: unknown) {
    this.container.replaceChildren(
      OptionsPage.createStateMessage(
        this.document,
        error instanceof Error ? error.message : String(error),
      ),
    );
  }

  private static createStateMessage(doc: Document, message: string) {
    const element = doc.createElement("div");
    element.className = cn("p-4 text-sm") as string;
    element.textContent = message;
    return element;
  }
}

import type { DictionaryEntry } from "@common/types";
import { cn } from "tailwind-variants";
import {
  DictionaryContextSection,
  DictionaryDefinitionsSection,
  DictionaryHeaderSection,
  DictionaryMetadataSection,
  DictionaryPronunciationsSection,
} from "./sections";

export interface AnkiCardFrontOptions {
  container: HTMLElement;
  entry: DictionaryEntry;
  soundLinks?: HTMLAnchorElement[];
}

export class AnkiCardFront {
  private readonly document: Document;
  private readonly element: HTMLDivElement;
  private readonly entry: DictionaryEntry;
  private readonly soundLinks: HTMLAnchorElement[];

  constructor({ container, entry, soundLinks = [] }: AnkiCardFrontOptions) {
    this.document = container.ownerDocument;
    this.entry = entry;
    this.soundLinks = soundLinks;

    this.element = this.document.createElement("div");
    this.element.className = cn("mx-auto max-w-[600px] p-5 pt-10") as string;

    this.render();
    container.append(this.element);
  }

  private render() {
    const header = new DictionaryHeaderSection({
      container: this.element,
      word: this.entry.word,
      provider: this.entry.provider,
    }).element;
    header.className = cn("mb-4 flex items-baseline justify-center gap-3") as string;

    const metadataSection = new DictionaryMetadataSection({
      container: this.element,
      metadata: this.entry.metadata,
    });
    const metadata = metadataSection.isEmpty ? null : metadataSection.element;
    if (metadata) metadata.className = cn("mb-4 flex justify-center") as string;

    const pronunciationsSection = new DictionaryPronunciationsSection({
      container: this.element,
      pronunciations: this.entry.pronunciations,
      soundLinks: this.soundLinks,
    });
    const pronunciations = pronunciationsSection.isEmpty ? null : pronunciationsSection.element;
    if (pronunciations) {
      pronunciations.className = cn(
        "text-foreground/60 flex justify-center gap-6 text-[1rem]",
      ) as string;
    }

    const contextSection = new DictionaryContextSection({
      container: this.element,
      context: this.entry.context,
    });
    const context = contextSection.isEmpty ? null : contextSection.element;
  }
}

export interface AnkiCardBackOptions {
  container: HTMLElement;
  entry: DictionaryEntry;
}

export class AnkiCardBack {
  private readonly document: Document;
  private readonly element: HTMLDivElement;
  private readonly entry: DictionaryEntry;

  constructor({ container, entry }: AnkiCardBackOptions) {
    this.document = container.ownerDocument;
    this.entry = entry;

    this.element = this.document.createElement("div");
    this.element.className = cn("mx-auto max-w-[600px] p-5 pt-0 text-left") as string;

    this.render();
    container.append(this.element);
  }

  private render() {
    const cardContainer = this.document.createElement("div");
    cardContainer.id = "ankilex-definitions";
    this.element.append(cardContainer);

    const definitionsSection = new DictionaryDefinitionsSection({
      container: cardContainer,
      definitions: this.entry.definitions,
      showAddButton: false,
      toggleTranslation: true,
    });
    if (definitionsSection.isEmpty) return;
    definitionsSection.element.classList.add("text-foreground", "leading-relaxed");
  }
}

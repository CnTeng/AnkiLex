import type { Metadata } from "@common/types";
import { Icon } from "@views/components";
import { Star } from "lucide";
import { cn } from "tailwind-variants";

const FREQUENCY_STAR_COUNT = 5;
const metadataBadgeClass = cn(
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
  "bg-secondary text-secondary-foreground border-[color-mix(in_srgb,var(--border)_70%,transparent)]",
) as string;

export interface DictionaryMetadataSectionOptions {
  container: HTMLElement | DocumentFragment;
  metadata: Metadata;
}

export class DictionaryMetadataSection {
  readonly element: HTMLDivElement;
  readonly isEmpty: boolean;

  private readonly document: Document;
  private readonly metadata: Metadata;

  constructor({ container, metadata }: DictionaryMetadataSectionOptions) {
    this.document = container.ownerDocument ?? document;
    this.metadata = metadata;

    this.element = this.document.createElement("div");
    this.element.className = cn("mb-2.5 flex items-center gap-3") as string;

    const tags = this.metadata.tags ?? [];
    const frequency = this.metadata.frequency ?? 0;
    this.isEmpty = tags.length === 0 && frequency === 0;

    if (this.isEmpty) return;
    this.render(tags, frequency);
    container.append(this.element);
  }

  private render(tags: string[], frequency: number) {
    const frequencyElement = this.createFrequency(frequency);
    const tagsElement = this.createTags(tags);

    if (frequencyElement) this.element.append(frequencyElement);
    if (tagsElement) this.element.append(tagsElement);
  }

  private createFrequency(frequency: number): HTMLDivElement | null {
    if (frequency <= 0) return null;

    const container = this.document.createElement("div");
    container.className = cn("flex items-center gap-0.5") as string;

    for (let i = 0; i < FREQUENCY_STAR_COUNT; i++) {
      container.append(
        new Icon({
          doc: this.document,
          iconNode: Star,
          customAttrs: {
            class: cn(
              "h-4 w-4",
              i < frequency ? "text-warning fill-current" : "text-muted-foreground",
            ),
          },
        }).element,
      );
    }

    return container;
  }

  private createTags(tags: string[]): HTMLDivElement | null {
    if (tags.length === 0) return null;

    const container = this.document.createElement("div");
    container.className = cn("flex flex-wrap gap-1") as string;

    tags.forEach((tag) => {
      const badge = this.document.createElement("span");
      badge.className = metadataBadgeClass;
      badge.textContent = tag;
      container.append(badge);
    });

    return container;
  }
}

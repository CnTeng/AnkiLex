import type { DictionaryEntry } from "@lib/model";
import { cn } from "tailwind-variants";
import {
  createContextElement,
  createDefinitionsElement,
  createHeaderElement,
  createMetadataElement,
  createPronunciationsElement,
} from "./elements";

interface AnkiCardProps {
  doc: Document;
  entry: DictionaryEntry;
}

interface AnkiCardFrontProps extends AnkiCardProps {
  soundLinks?: HTMLAnchorElement[];
}

export function AnkiCardFront({ doc, entry, soundLinks = [] }: AnkiCardFrontProps): HTMLDivElement {
  const container = doc.createElement("div");
  container.className = cn("mx-auto max-w-[600px] p-5 pt-10") as string;

  const header = createHeaderElement(doc, entry.word, entry.provider);
  header.className = cn("mb-4 flex items-baseline justify-center gap-3") as string;

  const metadata = createMetadataElement(doc, entry.metadata);
  if (metadata) metadata.className = cn("mb-4 flex justify-center") as string;

  const pronunciations = createPronunciationsElement(doc, entry.pronunciations, {
    soundLinks,
  });
  if (pronunciations) {
    pronunciations.className = cn(
      "text-muted-foreground flex justify-center gap-6 font-sans text-[1rem]",
    ) as string;
  }
  const context = entry.context ? createContextElement(doc, entry.context) : null;

  container.append(header);
  if (metadata) container.append(metadata);
  if (pronunciations) container.append(pronunciations);
  if (context) container.append(context);

  return container;
}

export function AnkiCardBack({ doc, entry }: AnkiCardProps): HTMLDivElement {
  const container = doc.createElement("div");
  container.className = cn("mx-auto max-w-[600px] p-5 pt-0 text-left") as string;

  const cardContainer = doc.createElement("div");
  cardContainer.id = "ankilex-definitions";

  const definitions = createDefinitionsElement(doc, entry.definitions, {
    showAddButton: false,
    toggleTranslation: true,
  });
  if (definitions) {
    definitions.classList.add("text-foreground", "leading-relaxed");
    cardContainer.append(definitions);
  }

  container.append(cardContainer);
  return container;
}

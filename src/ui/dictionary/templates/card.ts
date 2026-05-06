import type { DictionaryEntry } from "@lib/model";
import { cn } from "tailwind-variants";
import {
  createContext,
  createDefinitions,
  createHeader,
  createMetadata,
  createPronunciations,
} from "../sections";

function AnkiCardFront({
  doc,
  entry,
  soundLinks = [],
}: {
  doc: Document;
  entry: DictionaryEntry;
  soundLinks?: HTMLAnchorElement[];
}): HTMLDivElement {
  const container = doc.createElement("div");
  container.className = cn("mx-auto max-w-[600px] p-5 pt-10") as string;

  const header = createHeader(doc, entry.word, entry.provider);
  header.className = cn("mb-4 flex items-baseline justify-center gap-3") as string;

  const metadata = createMetadata(doc, entry.metadata);
  if (metadata) metadata.className = cn("mb-4 flex justify-center") as string;

  const pronunciations = createPronunciations(doc, entry.pronunciations, {
    soundLinks,
  });
  if (pronunciations) {
    pronunciations.className = cn(
      "text-base-content/60 flex justify-center gap-6 text-[1rem]",
    ) as string;
  }
  const context = entry.context ? createContext(doc, entry.context) : null;

  container.append(header);
  if (metadata) container.append(metadata);
  if (pronunciations) container.append(pronunciations);
  if (context) container.append(context);

  return container;
}

function AnkiCardBack({ doc, entry }: { doc: Document; entry: DictionaryEntry }): HTMLDivElement {
  const container = doc.createElement("div");
  container.className = cn("mx-auto max-w-[600px] p-5 pt-0 text-left") as string;

  const cardContainer = doc.createElement("div");
  cardContainer.id = "ankilex-definitions";

  const definitions = createDefinitions(doc, entry.definitions, {
    showAddButton: false,
    toggleTranslation: true,
  });
  if (definitions) {
    definitions.classList.add("text-base-content", "leading-relaxed");
    cardContainer.append(definitions);
  }

  container.append(cardContainer);
  return container;
}

const getData = (): DictionaryEntry | null => {
  const el = document.getElementById("raw-data");
  if (!el?.textContent) return null;
  try {
    return JSON.parse(el.textContent);
  } catch (_) {
    return null;
  }
};

export const initAnkiFront = () => {
  const entry = getData();
  const root = document.getElementById("ankilex-front-root");
  if (entry && root) {
    const rawAudio = document.getElementById("raw-audio");
    const soundLinks = rawAudio
      ? (Array.from(rawAudio.querySelectorAll(".soundLink")) as HTMLAnchorElement[])
      : [];

    const view = AnkiCardFront({ doc: document, entry, soundLinks });
    root.replaceChildren(view);
  }
};

export const initAnkiBack = () => {
  const entry = getData();
  const root = document.getElementById("ankilex-back-root");
  if (entry && root) {
    const view = AnkiCardBack({ doc: document, entry });
    root.replaceChildren(view);
  }
};

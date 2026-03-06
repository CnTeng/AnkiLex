import { Badge, Button, Icon } from "@lib/components";
import type { Definition, DictionaryEntry, Example, Pronunciation } from "@lib/model";
import { Play, Plus, Star } from "lucide";
import { cn } from "tailwind-variants";

const FREQUENCY_STAR_COUNT = 5;

type DictionaryViewOptions = {
  doc?: Document;
  entry: DictionaryEntry;
  showAddButton?: boolean;
};

export function DictionaryView({
  doc = document,
  entry,
  showAddButton = true,
}: DictionaryViewOptions): HTMLDivElement {
  const container = doc.createElement("div");
  const { word, provider, metadata, pronunciations, definitions } = entry;

  const fragment = doc.createDocumentFragment();

  const components = [
    createHeaderElement(doc, word, provider),
    createMetadataElement(doc, metadata),
    createPronunciationsElement(doc, pronunciations),
    createDefinitionsElement(doc, definitions, showAddButton),
  ];

  for (const component of components) {
    if (component) fragment.append(component);
  }

  container.append(fragment);
  return container;
}

function createHeaderElement(doc: Document, word: string, provider: string): HTMLDivElement {
  const header = doc.createElement("div");
  header.className = cn("mb-2 flex items-center justify-between") as string;

  const wordElement = doc.createElement("h2");
  wordElement.className = cn("text-foreground text-2xl font-bold") as string;
  wordElement.textContent = word;

  const providerElement = doc.createElement("span");
  providerElement.className = cn(
    "text-muted-foreground px-2 py-0.5 text-xs font-medium uppercase",
  ) as string;
  providerElement.textContent = provider;

  header.append(wordElement, providerElement);
  return header;
}

function createMetadataElement(
  doc: Document,
  metadata?: Record<string, unknown>,
): HTMLDivElement | null {
  if (!metadata) return null;

  const tags = (metadata.tags as string[]) || [];
  const frequency = (metadata.frequency as number) || 0;

  if (tags.length === 0 && frequency === 0) return null;

  const container = doc.createElement("div");
  container.className = cn("mb-2 flex items-center gap-3") as string;

  const frequencyElement = createFrequencyStarsElement(doc, frequency);
  const tagsElement = createTagsElement(doc, tags);

  if (frequencyElement) container.append(frequencyElement);
  if (tagsElement) container.append(tagsElement);

  return container;
}

function createFrequencyStarsElement(doc: Document, frequency: number): HTMLDivElement | null {
  if (frequency <= 0) return null;

  const container = doc.createElement("div");
  container.className = cn("flex items-center gap-0.5") as string;

  for (let i = 0; i < FREQUENCY_STAR_COUNT; i++) {
    const starIcon = Icon({
      doc,
      iconNode: Star,
      customAttrs: {
        class: cn("h-4 w-4", i < frequency ? "text-warning fill-current" : "text-muted-foreground"),
      },
    });
    container.append(starIcon);
  }

  return container;
}

function createTagsElement(doc: Document, tags: string[]): HTMLDivElement | null {
  if (tags.length === 0) return null;

  const container = doc.createElement("div");
  container.className = cn("flex flex-wrap gap-1.5") as string;

  for (const tag of tags) {
    const badge = Badge({ doc, label: tag });
    container.append(badge);
  }

  return container;
}

function createPronunciationsElement(
  doc: Document,
  pronunciations: Pronunciation[],
): HTMLDivElement | null {
  if (!pronunciations || pronunciations.length === 0) return null;

  const container = doc.createElement("div");
  container.className = cn("mb-2 flex flex-wrap gap-4") as string;

  for (const { type, text, audioUrl } of pronunciations) {
    const item = doc.createElement("div");
    item.className = cn("flex items-center gap-2") as string;

    if (type) {
      const typeElement = doc.createElement("span");
      typeElement.className = cn(
        "text-muted-foreground text-xs leading-6 font-semibold uppercase",
      ) as string;
      typeElement.textContent = type;
      item.append(typeElement);
    }

    if (text) {
      const textElement = doc.createElement("span");
      textElement.className = cn("text-foreground font-mono text-sm leading-6") as string;
      textElement.textContent = text;
      item.append(textElement);
    }

    if (audioUrl) {
      const audio = document.createElement("audio");
      audio.src = audioUrl;

      const audioButton = Button({
        doc,
        size: "icon-xs",
        icon: Icon({ doc, iconNode: Play }),
        onClick: (e) => {
          e.stopPropagation();
          audio.currentTime = 0;
          audio.play();
        },
      });

      item.append(audioButton);
    }

    container.append(item);
  }

  return container;
}

function createDefinitionsElement(
  doc: Document,
  definitions: Definition[],
  showAddButton: boolean,
): HTMLDivElement | null {
  if (!definitions || definitions.length === 0) return null;

  const container = doc.createElement("div");
  container.className = cn("divide-border flex flex-col divide-y") as string;

  for (let i = 0; i < definitions.length; i++) {
    const element = createDefinitionElement(doc, definitions[i], i, showAddButton);
    container.append(element);
  }

  return container.children.length > 0 ? container : null;
}

function createDefinitionElement(
  doc: Document,
  definition: Definition,
  index: number,
  showAddButton: boolean,
): HTMLDivElement {
  const container = doc.createElement("div");
  container.className = cn("flex flex-col gap-1 py-4 first:pt-2 last:pb-2") as string;

  const headerRow = doc.createElement("div");
  headerRow.className = cn("flex flex-1 items-center justify-between gap-1") as string;

  const content = createDefinitionContentElement(doc, definition);
  headerRow.append(content);

  if (showAddButton) {
    const addButton = Button({
      doc,
      size: "icon",
      title: "Add to Anki",
      icon: Icon({ doc, iconNode: Plus }),
    });
    addButton.setAttribute("data-def-index", index.toString());
    headerRow.append(addButton);
  }

  container.append(headerRow);

  const examples = createExamplesElement(doc, definition.examples);
  if (examples) container.append(examples);

  return container;
}

function createDefinitionContentElement(doc: Document, definition: Definition): HTMLDivElement {
  const container = doc.createElement("div");
  container.className = cn("leading-relaxed") as string;

  if (definition.partOfSpeech) {
    const posElement = doc.createElement("span");
    posElement.className = cn(
      "text-muted-foreground mr-2 font-serif text-xs font-medium italic",
    ) as string;
    posElement.textContent = definition.partOfSpeech;
    container.append(posElement);
  }

  const textElement = doc.createElement("span");
  textElement.className = cn("text-foreground text-sm leading-relaxed") as string;
  textElement.textContent = definition.text;
  container.append(textElement);

  return container;
}

function createExamplesElement(doc: Document, examples?: Example[]): HTMLUListElement | null {
  if (!examples || examples.length === 0) return null;

  const list = doc.createElement("ul");
  list.className = cn("mt-2 list-disc flex-col space-y-2 pl-3") as string;

  for (const example of examples) {
    const item = createExampleItemElement(doc, example);
    list.append(item);
  }

  return list.children.length > 0 ? list : null;
}

function createExampleItemElement(doc: Document, example: Example): HTMLLIElement {
  const item = doc.createElement("li");
  item.className = cn("text-muted-foreground text-sm") as string;

  const textElement = doc.createElement("span");
  textElement.textContent = example.text;
  item.append(textElement);

  if (example.translation) {
    const translationElement = doc.createElement("span");
    translationElement.className = cn("ml-1") as string;
    translationElement.textContent = ` ${example.translation}`;
    item.append(translationElement);
  }

  return item;
}

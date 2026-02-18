import { Badge, Button } from "@lib/components";
import type { Definition, DictionaryEntry, Example, Pronunciation } from "@lib/model";
import { createElement, Play, Plus, Star } from "lucide";
import { cn, cx } from "tailwind-variants";

interface DictionaryEntryProps {
  entry: DictionaryEntry;
  showAddButton?: boolean;
  doc?: Document;
}

export const DictionaryEntryUI = ({
  entry,
  showAddButton = true,
  doc = document,
}: DictionaryEntryProps): DocumentFragment => {
  const fragment = doc.createDocumentFragment();

  const components = [
    renderHeader(doc, entry),
    // renderMetadata(doc, entry),
    // renderPronunciations(doc, entry),
    renderDefinitions(doc, entry, showAddButton),
  ];

  components.filter(Boolean).forEach((component) => {
    if (component) fragment.append(component);
  });

  return fragment;
};

function renderHeader(doc: Document, entry: DictionaryEntry): HTMLDivElement {
  const header = doc.createElement("div");
  header.className = cx("mb-2 flex items-center justify-between") ?? "";

  const word = doc.createElement("h2");
  word.className = cx("text-foreground text-2xl font-bold") ?? "";
  word.textContent = entry.word;

  const provider = doc.createElement("span");
  provider.className = cx("text-muted-foreground px-2 py-0.5 text-xs font-medium uppercase") ?? "";
  provider.textContent = entry.provider;

  header.append(word, provider);
  return header;
}

function renderMetadata(doc: Document, entry: DictionaryEntry): HTMLDivElement | null {
  if (!entry.metadata) return null;

  const tags = (entry.metadata.tags as string[]) || [];
  const frequency = (entry.metadata.frequency as number) || 0;

  if (tags.length === 0 && frequency === 0) return null;

  const container = doc.createElement("div");
  container.className = cx("mb-2 flex items-center gap-3") ?? "";

  const frequencyElement = renderFrequencyStars(doc, frequency);
  const tagsElement = renderTags(doc, tags);

  if (frequencyElement) container.append(frequencyElement);
  if (tagsElement) container.append(tagsElement);

  return container;
}

function renderFrequencyStars(doc: Document, frequency: number): HTMLDivElement | null {
  if (frequency <= 0) return null;

  const container = doc.createElement("div");
  container.className = cx("flex items-center gap-0.5") ?? "";

  const STAR_COUNT = 5;
  for (let i = 0; i < STAR_COUNT; i++) {
    const starIcon = createElement(Star);

    starIcon.setAttribute(
      "class",
      cn("h-4 w-4", i < frequency ? "text-warning fill-current" : "text-muted-foreground") ?? "",
    );

    container.append(starIcon);
  }

  return container;
}

function renderTags(doc: Document, tags: string[]): HTMLDivElement | null {
  if (tags.length === 0) return null;

  const container = doc.createElement("div");
  container.className = cx("flex flex-wrap gap-1.5") ?? "";

  tags.forEach((tag) => {
    const badge = Badge({ label: tag, variant: "secondary" });
    container.append(badge);
  });

  return container;
}

function renderPronunciations(doc: Document, entry: DictionaryEntry): HTMLDivElement | null {
  const pronunciations = entry.pronunciations;
  // if (!pronunciations || pronunciations.length === 0) return null;

  const container = doc.createElement("div");
  container.className = cx("mb-2 flex flex-wrap gap-4") ?? "";

  pronunciations.forEach((pronunciation) => {
    const element = renderSinglePronunciation(doc, pronunciation);
    if (element) container.append(element);
  });

  return container.children.length > 0 ? container : null;
}

function renderSinglePronunciation(
  doc: Document,
  pronunciation: Pronunciation,
): HTMLDivElement | null {
  const container = doc.createElement("div");
  container.className = cx("flex items-center gap-2") ?? "";

  if (pronunciation.type) {
    const pronType = doc.createElement("span");
    pronType.className = cx("text-muted-foreground text-xs font-semibold uppercase") ?? "";
    pronType.textContent = pronunciation.type;
    container.append(pronType);
  }

  if (pronunciation.text) {
    const pronText = doc.createElement("span");
    pronText.className = cx("text-foreground font-mono text-sm") ?? "";
    pronText.textContent = pronunciation.text;
    container.append(pronText);
  }

  if (pronunciation.audioUrl) {
    const audio = doc.createElement("audio");
    audio.src = pronunciation.audioUrl;

    const audioBtn = Button({
      variant: "ghost",
      size: "icon-xs",
      icon: createElement(Play),
      onClick: (e) => {
        e.stopPropagation();
        audio.currentTime = 0;
        audio.play();
      },
    });

    container.append(audioBtn);
  }

  return container;
}

function renderDefinitions(
  doc: Document,
  entry: DictionaryEntry,
  showAddButton: boolean,
): HTMLDivElement | null {
  if (!entry.definitions || entry.definitions.length === 0) return null;

  const container = doc.createElement("div");
  container.className = cx("divide-border flex flex-col divide-y") ?? "";

  entry.definitions.forEach((definition, defIndex) => {
    const element = renderDefinition(doc, definition, defIndex, showAddButton);
    if (element) container.append(element);
  });

  return container.children.length > 0 ? container : null;
}

function renderDefinition(
  doc: Document,
  definition: Definition,
  defIndex: number,
  showAddButton: boolean,
): HTMLDivElement {
  const container = doc.createElement("div");
  container.className = cx("flex flex-col gap-1 py-4 first:pt-2 last:pb-2") ?? "";

  const headerRow = doc.createElement("div");
  headerRow.className = cx("flex flex-1 items-center justify-between gap-1") ?? "";

  const mainContent = renderDefinitionContent(doc, definition);
  headerRow.append(mainContent);

  if (showAddButton) {
    const addButton = Button({
      variant: "ghost",
      size: "icon",
      title: "Add to Anki",
      icon: createElement(Plus),
    });
    addButton.setAttribute("data-def-index", defIndex.toString());
    headerRow.append(addButton);
  }

  container.append(headerRow);

  const examples = renderExamples(doc, definition.examples);
  if (examples) container.append(examples);

  return container;
}

function renderDefinitionContent(doc: Document, definition: Definition): HTMLDivElement {
  const container = doc.createElement("div");
  container.className = cx("leading-relaxed") ?? "";

  if (definition.partOfSpeech) {
    const posTag = doc.createElement("span");
    posTag.className = cx("text-muted-foreground mr-2 font-serif text-xs font-medium italic") ?? "";
    posTag.textContent = definition.partOfSpeech;
    container.append(posTag);
  }

  const defText = doc.createElement("span");
  defText.className = cx("text-foreground text-sm leading-relaxed") ?? "";
  defText.textContent = definition.text;
  container.append(defText);

  return container;
}

function renderExamples(doc: Document, examples?: Array<Example>): HTMLUListElement | null {
  if (!examples || examples.length === 0) return null;

  const ul = doc.createElement("ul");
  ul.className = cx("mt-2 list-disc flex-col space-y-2 pl-3") ?? "";

  examples.forEach((example) => {
    const element = renderSingleExample(doc, example);
    if (element) ul.append(element);
  });

  return ul.children.length > 0 ? ul : null;
}

function renderSingleExample(doc: Document, example: Example): HTMLLIElement {
  const container = doc.createElement("li");
  container.className = cx("text-muted-foreground text-sm") ?? "";

  const textNode = doc.createElement("span");
  textNode.textContent = example.text;
  container.appendChild(textNode);

  if (example.translation) {
    const translationSpan = doc.createElement("span");
    translationSpan.textContent = ` ${example.translation}`;
    translationSpan.className = cx("ml-1") ?? "";
    container.append(translationSpan);
  }

  return container;
}

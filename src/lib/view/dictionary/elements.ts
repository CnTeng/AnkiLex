import { Badge, Button, buttonVariants, Icon, Markdown } from "@lib/components";
import type { Definition, Example, Pronunciation } from "@lib/model";
import { Check, Play, Plus, Star, X } from "lucide";
import { cn } from "tailwind-variants";

const FREQUENCY_STAR_COUNT = 5;

export function createHeaderElement(doc: Document, word: string, provider: string): HTMLDivElement {
  const header = doc.createElement("div");
  header.className = cn("mb-2 flex items-center justify-between") as string;

  const left = doc.createElement("div");
  left.className = cn("flex items-baseline gap-2") as string;

  const wordElement = doc.createElement("h2");
  wordElement.className = cn("text-foreground text-2xl font-bold") as string;
  wordElement.textContent = word;

  const providerElement = doc.createElement("span");
  providerElement.className = cn(
    "text-muted-foreground px-2 py-0.5 text-xs font-medium uppercase opacity-80",
  ) as string;
  providerElement.textContent = provider;

  left.append(wordElement, providerElement);
  header.append(left);

  return header;
}

export function createContextElement(doc: Document, context?: string): HTMLDivElement | null {
  if (!context || context.trim() === "") return null;

  const container = doc.createElement("div");
  container.className = cn("mt-4 text-left") as string;

  const label = doc.createElement("div");
  label.className = cn(
    "text-muted-foreground mb-2 ml-1 text-[0.7rem] font-bold tracking-widest uppercase",
  ) as string;
  label.textContent = "Context";

  const content = doc.createElement("div");
  content.className = cn(
    "bg-secondary/40 text-foreground border-border/40 rounded-xl border p-4 text-[0.9rem] leading-relaxed italic shadow-sm",
  ) as string;
  content.append(Markdown({ ownerDocument: doc, text: context.trim() }));

  container.append(label, content);
  return container;
}

export function createMetadataElement(
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

export function createFrequencyStarsElement(
  doc: Document,
  frequency: number,
): HTMLDivElement | null {
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

export function createTagsElement(doc: Document, tags: string[]): HTMLDivElement | null {
  if (tags.length === 0) return null;

  const container = doc.createElement("div");
  container.className = cn("flex flex-wrap gap-1.5") as string;

  for (const tag of tags) {
    const badge = Badge({ doc, label: tag });
    container.append(badge);
  }

  return container;
}

export function createPronunciationsElement(
  doc: Document,
  pronunciations: Pronunciation[],
  options: { soundLinks?: HTMLAnchorElement[] } = {},
): HTMLDivElement | null {
  if (!pronunciations || pronunciations.length === 0) return null;

  const container = doc.createElement("div");
  container.className = cn("mb-2 flex flex-wrap gap-4") as string;

  pronunciations.forEach(({ type, text, audioUrl }, index) => {
    const item = doc.createElement("div");
    item.className = cn("flex items-center gap-2") as string;

    if (type) {
      const typeElement = doc.createElement("span");
      typeElement.className = cn(
        "text-muted-foreground text-xs font-semibold uppercase opacity-70",
      ) as string;
      typeElement.textContent = type;
      item.append(typeElement);
    }

    if (text) {
      const textElement = doc.createElement("span");
      textElement.className = cn("text-foreground font-mono text-sm") as string;
      textElement.textContent = text;
      item.append(textElement);
    }

    const link =
      options.soundLinks?.[index] ||
      (options.soundLinks && pronunciations.length === 1 ? options.soundLinks[0] : undefined);

    if (link) {
      const anchor = link.cloneNode(true) as HTMLAnchorElement;
      const icon = Icon({ doc, iconNode: Play });
      anchor.replaceChildren(icon);
      anchor.className = buttonVariants({ size: "icon-xs", variant: "ghost" });
      item.append(anchor);
    } else if (audioUrl) {
      const audio = doc.createElement("audio");
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
  });

  return container;
}

export interface CreateDefinitionOptions {
  showAddButton?: boolean;
  onAddClick?: (index?: number) => void;
  toggleTranslation?: boolean;
}

export function createDefinitionsElement(
  doc: Document,
  definitions: Definition[],
  options: CreateDefinitionOptions = {},
): HTMLDivElement | null {
  if (!definitions || definitions.length === 0) return null;

  const container = doc.createElement("div");
  container.className = cn("divide-border flex flex-col divide-y") as string;

  for (let i = 0; i < definitions.length; i++) {
    const element = createDefinitionElement(doc, definitions[i], i, options);
    container.append(element);
  }

  return container.children.length > 0 ? container : null;
}

export function createDefinitionElement(
  doc: Document,
  definition: Definition,
  index: number,
  options: CreateDefinitionOptions = {},
): HTMLDivElement {
  const container = doc.createElement("div");

  const baseClass = "flex flex-1 flex-col gap-1 py-4 first:pt-2 last:pb-2";

  if (options.toggleTranslation) {
    container.dataset.state = "closed";
    container.setAttribute("role", "button");

    container.className = cn(baseClass, "group cursor-pointer outline-none") as string;

    container.onclick = (e) => {
      e.stopPropagation();
      const isClosed = container.dataset.state === "closed";
      container.dataset.state = isClosed ? "open" : "closed";
    };
  } else {
    container.className = baseClass;
  }

  const headerRow = doc.createElement("div");
  headerRow.className = cn("flex flex-1 items-center justify-between gap-1") as string;

  const content = createDefinitionContentElement(doc, definition);
  headerRow.append(content);

  if (options.showAddButton) {
    const addButton = createAnkiAddButton({
      doc,
      index,
      onAddClick: options.onAddClick,
    });
    headerRow.append(addButton);
  }

  container.append(headerRow);

  const examples = createExamplesElement(doc, definition.examples);
  if (examples) container.append(examples);

  return container;
}

type AddButtonState = "idle" | "loading" | "success" | "error";

const addButtonStateClasses: Record<Exclude<AddButtonState, "idle">, string[]> = {
  loading: ["opacity-70", "cursor-wait"],
  success: ["text-emerald-600", "hover:text-emerald-700"],
  error: ["text-rose-600", "hover:text-rose-700"],
};

function createAnkiAddButton({
  doc,
  index,
  onAddClick,
}: {
  doc: Document;
  index: number;
  onAddClick?: (index?: number) => void | Promise<void>;
}): HTMLButtonElement {
  const addButton = Button({
    doc,
    size: "icon",
    title: "Add to Anki",
    icon: Icon({ doc, iconNode: Plus }),
    variant: "ghost",
  });
  addButton.setAttribute("data-def-index", index.toString());

  const contentEl = addButton.firstElementChild as HTMLDivElement | null;
  const setContent = (node: Node) => {
    if (!contentEl) return;
    contentEl.replaceChildren(node);
  };
  const setState = (state: AddButtonState) => {
    addButton.dataset.state = state;
    addButton.classList.remove(...addButtonStateClasses.loading);
    addButton.classList.remove(...addButtonStateClasses.success);
    addButton.classList.remove(...addButtonStateClasses.error);
    addButton.disabled = state === "loading";

    if (state === "loading") {
      const spinner = doc.createElement("span");
      spinner.className =
        "h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent";
      addButton.classList.add(...addButtonStateClasses.loading);
      setContent(spinner);
      return;
    }

    if (state === "success") {
      addButton.classList.add(...addButtonStateClasses.success);
      setContent(Icon({ doc, iconNode: Check }));
      return;
    }

    if (state === "error") {
      addButton.classList.add(...addButtonStateClasses.error);
      setContent(Icon({ doc, iconNode: X }));
      return;
    }

    setContent(Icon({ doc, iconNode: Plus }));
  };

  setState("idle");

  addButton.addEventListener("click", async (e) => {
    e.stopPropagation();
    if (!onAddClick) return;
    if (addButton.dataset.state === "loading") return;

    try {
      setState("loading");
      await onAddClick(index);
      setState("success");
    } catch (error) {
      console.error("Failed to add to Anki", error);
      setState("error");
    }
  });

  return addButton;
}

export function createDefinitionContentElement(
  doc: Document,
  definition: Definition,
): HTMLDivElement {
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

export function createExamplesElement(
  doc: Document,
  examples?: Example[],
): HTMLUListElement | null {
  if (!examples || examples.length === 0) return null;

  const list = doc.createElement("ul");
  list.className = cn("mt-2 list-disc flex-col space-y-2 pl-3") as string;

  for (const example of examples) {
    const item = createExampleItemElement(doc, example);
    list.append(item);
  }

  return list.children.length > 0 ? list : null;
}

export function createExampleItemElement(doc: Document, example: Example): HTMLLIElement {
  const item = doc.createElement("li");
  item.className = cn("text-muted-foreground text-sm") as string;

  const textElement = doc.createElement("span");
  textElement.textContent = example.text;
  item.append(textElement);

  if (example.translation) {
    const translationElement = doc.createElement("span");
    translationElement.className = cn(
      "ml-1",
      "group-data-[state=closed]:bg-secondary",
      "group-data-[state=closed]:text-transparent!",
      "group-data-[state=closed]:select-none",
      "group-data-[state=closed]:rounded",
      "group-data-[state=closed]:px-1",
      "group-data-[state=closed]:py-0.5",
    ) as string;
    translationElement.textContent = ` ${example.translation}`;
    item.append(translationElement);
  }

  return item;
}

import type { Definition, DictionaryEntry, Pronunciation } from "@lib/model";

export class DictionaryEntryRenderer {
  constructor(
    private entry: DictionaryEntry,
    private showAddButton: boolean = true,
  ) { }

  render(doc: Document): DocumentFragment {
    const fragment = doc.createDocumentFragment();

    const components = [
      this.renderHeader(doc),
      this.renderMetadata(doc),
      this.renderPronunciations(doc),
      this.renderDefinitions(doc),
    ];

    components.filter(Boolean).forEach((component) => {
      if (component) fragment.appendChild(component);
    });

    return fragment;
  }

  private renderHeader(doc: Document): HTMLDivElement {
    const header = doc.createElement("div");
    header.className = "result-header";

    const wordElement = doc.createElement("h2");
    wordElement.className = "word";
    wordElement.textContent = this.entry.word;

    const providerElement = doc.createElement("span");
    providerElement.className = "provider";
    providerElement.textContent = this.entry.provider;

    header.appendChild(wordElement);
    header.appendChild(providerElement);

    return header;
  }

  private renderMetadata(doc: Document): HTMLDivElement | null {
    if (!this.entry.metadata) return null;

    const tags = (this.entry.metadata.tags as string[]) || [];
    const frequency = (this.entry.metadata.frequency as number) || 0;

    if (tags.length === 0 && frequency === 0) return null;

    const metadata = doc.createElement("div");
    metadata.className = "metadata";

    const frequencyElement = this.renderFrequencyStars(doc, frequency);
    const tagsElement = this.renderTags(doc, tags);

    if (frequencyElement) metadata.appendChild(frequencyElement);
    if (tagsElement) metadata.appendChild(tagsElement);

    return metadata;
  }

  private renderFrequencyStars(doc: Document, frequency: number): HTMLDivElement | null {
    if (frequency <= 0) return null;

    const container = doc.createElement("div");
    container.className = "frequency-stars";
    container.setAttribute("aria-label", "Frequency");

    for (let i = 0; i < 5; i++) {
      const isActive = i < frequency;
      const starIcon = doc.createElement("span");
      starIcon.className = `icon ${isActive ? "star-filled" : "star"}${isActive ? " active" : ""}`;
      container.appendChild(starIcon);
    }

    return container;
  }

  private renderTags(doc: Document, tags: string[]): HTMLDivElement | null {
    if (tags.length === 0) return null;

    const container = doc.createElement("div");
    container.className = "tags-list";

    tags.forEach((tag) => {
      const tagElement = doc.createElement("span");
      tagElement.className = "meta-tag";
      tagElement.textContent = tag;
      container.appendChild(tagElement);
    });

    return container;
  }

  private renderPronunciations(doc: Document): HTMLDivElement | null {
    const pronunciations = this.entry.pronunciations;
    if (!pronunciations || pronunciations.length === 0) return null;

    const container = doc.createElement("div");
    container.className = "pronunciations";

    pronunciations.forEach((pronunciation) => {
      const element = this.renderSinglePronunciation(doc, pronunciation);
      if (element) container.appendChild(element);
    });

    return container.children.length > 0 ? container : null;
  }

  private renderSinglePronunciation(
    doc: Document,
    pronunciation: Pronunciation,
  ): HTMLDivElement | null {
    const container = doc.createElement("div");
    container.className = "pronunciation-item";

    if (pronunciation.type) {
      const pronType = doc.createElement("span");
      pronType.className = "pron-type";
      pronType.textContent = pronunciation.type;
      container.appendChild(pronType);
    }

    if (pronunciation.text) {
      const pronText = doc.createElement("span");
      pronText.className = "pron-text";
      pronText.textContent = pronunciation.text;
      container.appendChild(pronText);
    }

    if (pronunciation.audioUrl) {
      container.appendChild(this.renderAudioButton(doc, pronunciation.audioUrl));
    }

    return container;
  }

  private renderAudioButton(doc: Document, audioUrl: string): HTMLButtonElement {
    const button = doc.createElement("button");
    button.className = "play-audio";
    button.setAttribute("data-url", audioUrl);
    button.setAttribute("aria-label", "Play audio");

    const icon = doc.createElement("span");
    icon.className = "icon audio";

    button.appendChild(icon);
    return button;
  }

  private renderDefinitions(doc: Document): HTMLDivElement | null {
    if (!this.entry.definitions || this.entry.definitions.length === 0) return null;

    const container = doc.createElement("div");
    container.className = "definitions-grid";

    this.entry.definitions.forEach((definition, defIndex) => {
      const element = this.renderDefinition(doc, definition, defIndex);
      if (element) container.appendChild(element);
    });

    return container.children.length > 0 ? container : null;
  }

  private renderDefinition(
    doc: Document,
    definition: Definition,
    defIndex: number,
  ): HTMLDivElement {
    const card = doc.createElement("div");
    card.className = "definition-card";

    const contentWrapper = doc.createElement("div");
    contentWrapper.className = "definition-content-wrapper";

    const mainContent = doc.createElement("div");
    mainContent.className = "definition-main";

    const definitionContent = this.renderDefinitionContent(doc, definition);
    definitionContent.forEach((component) => {
      mainContent.appendChild(component);
    });

    contentWrapper.appendChild(mainContent);

    if (this.showAddButton) {
      const addButton = this.renderAddAnkiButton(doc, defIndex);
      contentWrapper.appendChild(addButton);
    }

    card.appendChild(contentWrapper);

    const examples = this.renderExamples(doc, definition.examples);
    if (examples) {
      card.appendChild(examples);
    }

    return card;
  }

  private renderDefinitionContent(doc: Document, definition: Definition): HTMLElement[] {
    const components: HTMLElement[] = [];

    if (definition.partOfSpeech) {
      const posTag = doc.createElement("span");
      posTag.className = "pos-tag";
      posTag.textContent = definition.partOfSpeech;
      components.push(posTag);
    }

    const defText = doc.createElement("span");
    defText.className = "def-text";
    defText.textContent = definition.text;
    components.push(defText);

    return components;
  }

  private renderAddAnkiButton(doc: Document, defIndex: number): HTMLButtonElement {
    const button = doc.createElement("button");
    button.className = "add-anki-mini-btn";
    button.setAttribute("data-def-index", defIndex.toString());
    button.setAttribute("title", "Add to Anki");

    const icon = doc.createElement("span");
    icon.className = "icon plus";

    button.appendChild(icon);
    return button;
  }

  private renderExamples(
    doc: Document,
    examples?: Array<string | { text: string; translation?: string }>,
  ): HTMLDivElement | null {
    if (!examples || examples.length === 0) return null;

    const container = doc.createElement("div");
    container.className = "examples";

    examples.forEach((example) => {
      const element = this.renderSingleExample(doc, example);
      if (element) container.appendChild(element);
    });

    return container.children.length > 0 ? container : null;
  }

  private renderSingleExample(
    doc: Document,
    example: string | { text: string; translation?: string },
  ): HTMLDivElement {
    const container = doc.createElement("div");
    container.className = "example-item";

    const text = typeof example === "string" ? example : example.text;
    const translation =
      typeof example === "object" && example.translation ? example.translation : "";

    const textNode = doc.createTextNode(text);
    container.appendChild(textNode);

    if (translation) {
      const translationSpan = doc.createElement("span");
      translationSpan.textContent = ` ${translation}`;
      translationSpan.style.opacity = "0.7";
      translationSpan.style.fontSize = "0.9em";
      container.appendChild(translationSpan);
    }

    return container;
  }
}

export function renderDictionaryEntry(
  doc: Document,
  result: DictionaryEntry,
  showAddButton: boolean = true,
): DocumentFragment {
  const renderer = new DictionaryEntryRenderer(result, showAddButton);
  return renderer.render(doc);
}

export function attachAudioListeners(container: Element) {
  const playButtons = container.querySelectorAll(".play-audio");
  playButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const url = btn.getAttribute("data-url");
      if (url) {
        const audio = document.createElement("audio");
        audio.src = url;
        audio.play();
      }
    });
  });
}

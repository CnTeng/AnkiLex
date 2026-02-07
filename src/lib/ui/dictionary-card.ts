import type { Definition, DictionaryEntry, Pronunciation } from "../model";

export class DictionaryEntryRenderer {
  constructor(
    private entry: DictionaryEntry,
    private showAddButton: boolean = true,
  ) { }

  render(): DocumentFragment {
    const fragment = document.createDocumentFragment();

    const components = [
      this.renderHeader(),
      this.renderMetadata(),
      this.renderPronunciations(),
      this.renderDefinitions(),
    ];

    components.filter(Boolean).forEach((component) => {
      if (component) fragment.appendChild(component);
    });

    return fragment;
  }

  private renderHeader(): HTMLDivElement {
    const header = document.createElement("div");
    header.className = "result-header";

    const wordElement = document.createElement("h2");
    wordElement.className = "word";
    wordElement.textContent = this.entry.word;

    const providerElement = document.createElement("span");
    providerElement.className = "provider";
    providerElement.textContent = this.entry.provider;

    header.appendChild(wordElement);
    header.appendChild(providerElement);

    return header;
  }

  private renderMetadata(): HTMLDivElement | null {
    if (!this.entry.metadata) return null;

    const tags = (this.entry.metadata.tags as string[]) || [];
    const frequency = (this.entry.metadata.frequency as number) || 0;

    if (tags.length === 0 && frequency === 0) return null;

    const metadata = document.createElement("div");
    metadata.className = "metadata";

    const frequencyElement = this.renderFrequencyStars(frequency);
    const tagsElement = this.renderTags(tags);

    if (frequencyElement) metadata.appendChild(frequencyElement);
    if (tagsElement) metadata.appendChild(tagsElement);

    return metadata;
  }

  private renderFrequencyStars(frequency: number): HTMLDivElement | null {
    if (frequency <= 0) return null;

    const container = document.createElement("div");
    container.className = "frequency-stars";
    container.setAttribute("aria-label", "Frequency");

    for (let i = 0; i < 5; i++) {
      const isActive = i < frequency;
      const starIcon = document.createElement("span");
      starIcon.className = `icon ${isActive ? "star-filled" : "star"}${isActive ? " active" : ""}`;
      container.appendChild(starIcon);
    }

    return container;
  }

  private renderTags(tags: string[]): HTMLDivElement | null {
    if (tags.length === 0) return null;

    const container = document.createElement("div");
    container.className = "tags-list";

    tags.forEach((tag) => {
      const tagElement = document.createElement("span");
      tagElement.className = "meta-tag";
      tagElement.textContent = tag;
      container.appendChild(tagElement);
    });

    return container;
  }

  private renderPronunciations(): HTMLDivElement | null {
    const pronunciations = this.entry.pronunciations;
    if (!pronunciations || pronunciations.length === 0) return null;

    const container = document.createElement("div");
    container.className = "pronunciations";

    pronunciations.forEach((pronunciation) => {
      const element = this.renderSinglePronunciation(pronunciation);
      if (element) container.appendChild(element);
    });

    return container.children.length > 0 ? container : null;
  }

  private renderSinglePronunciation(pronunciation: Pronunciation): HTMLDivElement | null {
    const container = document.createElement("div");
    container.className = "pronunciation-item";

    if (pronunciation.type) {
      const pronType = document.createElement("span");
      pronType.className = "pron-type";
      pronType.textContent = pronunciation.type;
      container.appendChild(pronType);
    }

    if (pronunciation.text) {
      const pronText = document.createElement("span");
      pronText.className = "pron-text";
      pronText.textContent = pronunciation.text;
      container.appendChild(pronText);
    }

    if (pronunciation.audioUrl) {
      container.appendChild(this.renderAudioButton(pronunciation.audioUrl));
    }

    return container;
  }

  private renderAudioButton(audioUrl: string): HTMLButtonElement {
    const button = document.createElement("button");
    button.className = "play-audio";
    button.setAttribute("data-url", audioUrl);
    button.setAttribute("aria-label", "Play audio");

    const icon = document.createElement("span");
    icon.className = "icon audio";

    button.appendChild(icon);
    return button;
  }

  private renderDefinitions(): HTMLDivElement | null {
    if (!this.entry.definitions || this.entry.definitions.length === 0) return null;

    const container = document.createElement("div");
    container.className = "definitions-grid";

    this.entry.definitions.forEach((definition, defIndex) => {
      const element = this.renderDefinition(definition, defIndex);
      if (element) container.appendChild(element);
    });

    return container.children.length > 0 ? container : null;
  }

  private renderDefinition(definition: Definition, defIndex: number): HTMLDivElement {
    const card = document.createElement("div");
    card.className = "definition-card";

    const contentWrapper = document.createElement("div");
    contentWrapper.className = "definition-content-wrapper";

    const mainContent = document.createElement("div");
    mainContent.className = "definition-main";

    const definitionContent = this.renderDefinitionContent(definition);
    definitionContent.forEach((component) => {
      mainContent.appendChild(component);
    });

    contentWrapper.appendChild(mainContent);

    if (this.showAddButton) {
      const addButton = this.renderAddAnkiButton(defIndex);
      contentWrapper.appendChild(addButton);
    }

    card.appendChild(contentWrapper);

    const examples = this.renderExamples(definition.examples);
    if (examples) {
      card.appendChild(examples);
    }

    return card;
  }

  private renderDefinitionContent(definition: Definition): HTMLElement[] {
    const components: HTMLElement[] = [];

    if (definition.partOfSpeech) {
      const posTag = document.createElement("span");
      posTag.className = "pos-tag";
      posTag.textContent = definition.partOfSpeech;
      components.push(posTag);
    }

    const defText = document.createElement("span");
    defText.className = "def-text";
    defText.textContent = definition.text;
    components.push(defText);

    return components;
  }

  private renderAddAnkiButton(defIndex: number): HTMLButtonElement {
    const button = document.createElement("button");
    button.className = "add-anki-mini-btn";
    button.setAttribute("data-def-index", defIndex.toString());
    button.setAttribute("title", "Add to Anki");

    const icon = document.createElement("span");
    icon.className = "icon plus";

    button.appendChild(icon);
    return button;
  }

  private renderExamples(
    examples?: Array<string | { text: string; translation?: string }>,
  ): HTMLDivElement | null {
    if (!examples || examples.length === 0) return null;

    const container = document.createElement("div");
    container.className = "examples";

    examples.forEach((example) => {
      const element = this.renderSingleExample(example);
      if (element) container.appendChild(element);
    });

    return container.children.length > 0 ? container : null;
  }

  private renderSingleExample(
    example: string | { text: string; translation?: string },
  ): HTMLDivElement {
    const container = document.createElement("div");
    container.className = "example-item";

    const text = typeof example === "string" ? example : example.text;
    const translation =
      typeof example === "object" && example.translation ? example.translation : "";

    const textNode = document.createTextNode(text);
    container.appendChild(textNode);

    if (translation) {
      const translationSpan = document.createElement("span");
      translationSpan.textContent = ` ${translation}`;
      translationSpan.style.opacity = "0.7";
      translationSpan.style.fontSize = "0.9em";
      container.appendChild(translationSpan);
    }

    return container;
  }
}

export function renderDictionaryEntry(
  result: DictionaryEntry,
  showAddButton: boolean = true,
): DocumentFragment {
  const renderer = new DictionaryEntryRenderer(result, showAddButton);
  return renderer.render();
}

export function attachAudioListeners(container: Element) {
  const playButtons = container.querySelectorAll(".play-audio");
  playButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const url = btn.getAttribute("data-url");
      if (url) {
        const audio = new Audio(url);
        audio.play().catch((err) => console.error("Audio playback failed", err));
      }
    });
  });
}

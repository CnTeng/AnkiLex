import type { DictionaryEntry, IAnkiService } from "@common/model";
import { createDefinitions, createHeader, createMetadata, createPronunciations } from "./sections";

export class DictionaryEntryView {
  readonly element: HTMLDivElement;

  private readonly doc: Document;
  private readonly entry: DictionaryEntry;
  private readonly showAddButton: boolean;
  private readonly ankiService?: IAnkiService;

  constructor({
    doc = document,
    entry,
    showAddButton = true,
    ankiService,
  }: {
    doc?: Document;
    entry: DictionaryEntry;
    showAddButton?: boolean;
    ankiService?: IAnkiService;
  }) {
    this.doc = doc;
    this.entry = entry;
    this.showAddButton = showAddButton;
    this.ankiService = ankiService;
    this.element = this.doc.createElement("div");
    this.render();
  }

  private render() {
    const { word, provider, metadata, pronunciations, definitions } = this.entry;
    const fragment = this.doc.createDocumentFragment();

    const components = [
      createHeader(this.doc, word, provider),
      createMetadata(this.doc, metadata),
      createPronunciations(this.doc, pronunciations),
      createDefinitions(this.doc, definitions, {
        showAddButton: this.showAddButton,
        onAddClick: async (index) => this.addDefinitionToAnki(index),
      }),
    ];

    for (const component of components) {
      if (component) fragment.append(component);
    }

    this.element.replaceChildren(fragment);
  }

  private async addDefinitionToAnki(index?: number) {
    if (!this.ankiService) return;
    if (typeof index !== "number") return;
    const definition = this.entry.definitions[index];
    if (!definition) return;

    await this.ankiService.addNote({
      ...this.entry,
      definitions: [definition],
    });
  }
}

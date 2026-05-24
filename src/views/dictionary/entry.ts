import type { DictionaryEntry as DictionaryEntryData, IAnkiService } from "@common/model";
import {
  DictionaryDefinitionsSection,
  DictionaryMetadataSection,
  DictionaryPronunciationsSection,
} from "./sections";

export interface DictionaryEntryOptions {
  container: HTMLElement;
  entry: DictionaryEntryData;
  showAddButton?: boolean;
  ankiService?: IAnkiService;
}

export class DictionaryEntry {
  private readonly document: Document;
  private readonly element: HTMLDivElement;
  private readonly entry: DictionaryEntryData;
  private readonly showAddButton: boolean;
  private readonly ankiService?: IAnkiService;

  constructor({ container, entry, showAddButton = true, ankiService }: DictionaryEntryOptions) {
    this.document = container.ownerDocument;
    this.entry = entry;
    this.showAddButton = showAddButton;
    this.ankiService = ankiService;
    this.element = this.document.createElement("div");
    this.render();
    container.append(this.element);
  }

  private render() {
    const { metadata, pronunciations, definitions } = this.entry;
    const fragment = this.document.createDocumentFragment();

    [
      new DictionaryMetadataSection({ container: fragment, metadata }),
      new DictionaryPronunciationsSection({ container: fragment, pronunciations }),
      new DictionaryDefinitionsSection({
        container: fragment,
        definitions,
        showAddButton: this.showAddButton,
        onAddClick: async (index) => this.addDefinitionToAnki(index),
      }),
    ];

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

import type { DictionaryEntry } from "@lib/model";
import {
  createDefinitionsElement,
  createHeaderElement,
  createMetadataElement,
  createPronunciationsElement,
} from "./elements";

export interface DictionaryViewOptions {
  doc?: Document;
  entry: DictionaryEntry;
  showAddButton?: boolean;
  onAddClick?: (index?: number) => void;
}

export function DictionaryView({
  doc = document,
  entry,
  showAddButton = true,
  onAddClick,
}: DictionaryViewOptions): HTMLDivElement {
  const container = doc.createElement("div");
  const { word, provider, metadata, pronunciations, definitions } = entry;

  const fragment = doc.createDocumentFragment();

  const components = [
    createHeaderElement(doc, word, provider),
    createMetadataElement(doc, metadata),
    createPronunciationsElement(doc, pronunciations),
    createDefinitionsElement(doc, definitions, { showAddButton, onAddClick }),
  ];

  for (const component of components) {
    if (component) fragment.append(component);
  }

  container.append(fragment);
  return container;
}

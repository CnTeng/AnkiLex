import type { DictionaryEntry } from "@lib/model";
import { rpc } from "@lib/rpc";
import { createDefinitions, createHeader, createMetadata, createPronunciations } from "./sections";

export function EntryView({
  doc = document,
  entry,
  showAddButton = true,
}: {
  doc?: Document;
  entry: DictionaryEntry;
  showAddButton?: boolean;
}): HTMLDivElement {
  const container = doc.createElement("div");
  const { word, provider, metadata, pronunciations, definitions } = entry;

  const fragment = doc.createDocumentFragment();

  const components = [
    createHeader(doc, word, provider),
    createMetadata(doc, metadata),
    createPronunciations(doc, pronunciations),
    createDefinitions(doc, definitions, {
      showAddButton,
      onAddClick: async (index) => {
        if (typeof index !== "number") return;
        await rpc.anki.createNoteFromResult({
          result: entry,
          defIndex: index,
          options: {},
        });
      },
    }),
  ];

  for (const component of components) {
    if (component) fragment.append(component);
  }

  container.append(fragment);
  return container;
}

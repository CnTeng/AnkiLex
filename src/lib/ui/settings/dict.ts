import type { AnkiLexSettings } from "@lib/model";
import { Select } from "@lib/ui/components";
import { Book } from "lucide";
import { cn } from "tailwind-variants";
import { createFormField, createSectionHeading } from "./elements";
import type { DictionaryRow } from "./types";

export interface DictionarySectionResult {
  element: HTMLElement;
  render: (rows: DictionaryRow[]) => void;
}

export function DictionarySection(doc: Document, draft: AnkiLexSettings): DictionarySectionResult {
  const section = doc.createElement("section");
  section.append(createSectionHeading(doc, Book, "Dictionary"));

  const content = doc.createElement("div");
  content.className = cn("space-y-6") as string;

  const list = doc.createElement("div");
  list.className = cn("max-h-72 space-y-1 overflow-x-hidden overflow-y-auto") as string;

  content.append(
    createFormField(doc, "Dictionary Languages", {
      help: "Choose a dictionary for each registered language.",
      children: list as HTMLElement,
    }),
  );
  section.append(content);

  function render(rows: DictionaryRow[]) {
    list.replaceChildren(
      ...rows.map((row) => {
        const select = Select({
          doc,
          options: row.providers,
          value: row.selectedProvider,
          onChange: (value) => {
            draft.dictionaryProviders[row.languageCode] = value;
          },
        });
        return createFormField(doc, row.displayName, {
          children: select as HTMLElement,
          layout: "inline",
        });
      }),
    );
  }

  return { element: section, render };
}

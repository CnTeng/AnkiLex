import { Editor } from "@lib/components";
import type { DictionaryEntry } from "@lib/model";
import { cn } from "tailwind-variants";
import { DictionaryView } from "./dictionary";

type DictionaryPanelOptions = {
  doc?: Document;
  entry: DictionaryEntry;
  showAddButton?: boolean;
  context?: string;
};

export function DictionaryPanel({
  doc = document,
  entry,
  showAddButton = true,
  context = "",
}: DictionaryPanelOptions) {
  const container = doc.createElement("div");
  container.className = cn("flex h-0 flex-1 flex-col overflow-hidden") as string;

  const scrollArea = doc.createElement("div");
  scrollArea.className = cn("h-0 flex-1 overflow-y-auto px-4 py-4") as string;
  scrollArea.append(DictionaryView({ doc, entry, showAddButton }));

  const editorWrapper = doc.createElement("div");
  editorWrapper.className = cn("border-border bg-muted shrink-0 border-t") as string;

  const editor = Editor({
    ownerDocument: doc,
    className: cn("h-[20%] min-h-24") as string,
    placeholder: "Context / Note (Markdown supported)...",
  });
  editor.setContent(context);

  editorWrapper.append(editor.element);
  container.append(scrollArea, editorWrapper);

  return {
    element: container,
    getContext: editor.getContent,
    setContext: editor.setContent,
  };
}

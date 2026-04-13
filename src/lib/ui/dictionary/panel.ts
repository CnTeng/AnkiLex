import type { DictionaryEntry } from "@lib/model";
import { Editor, StateSwitch } from "@lib/ui/components";
import { cn } from "tailwind-variants";
import { EntryView } from "./entry";
import { EmptyState, ErrorState, LoadingState } from "./status";

type DictionaryState = "loading" | "empty" | "error" | "content";

export function DictionaryPanel({
  doc = document,
  className,
}: {
  doc?: Document;
  className?: string;
}) {
  const states = new Map<DictionaryState, HTMLElement>([
    ["loading", LoadingState({ doc })],
    ["empty", EmptyState({ doc })],
    ["error", ErrorState({ doc })],
  ]);

  const stateSwitch = StateSwitch({
    doc,
    className,
    states,
    initial: "loading",
  });
  let currentLoadId = 0;

  const load = (entry: Promise<DictionaryEntry | null>) => {
    stateSwitch.setState("loading");
    currentLoadId += 1;
    const loadId = currentLoadId;

    return entry
      .then((result) => {
        if (loadId !== currentLoadId) return;

        if (!result) {
          stateSwitch.setState("empty");
          return;
        }

        const panel = createContentPanel({ doc, entry: result });
        stateSwitch.setState("content", panel.element);
        return panel;
      })
      .catch(() => {
        if (loadId !== currentLoadId) return;
        stateSwitch.setState("error");
      });
  };

  return {
    element: stateSwitch.element,
    load,
  };
}

function createContentPanel({
  doc,
  entry,
  showAddButton,
}: {
  doc: Document;
  entry: DictionaryEntry;
  showAddButton?: boolean;
}) {
  const container = doc.createElement("div");
  container.className = cn("flex h-0 flex-1 flex-col overflow-hidden") as string;

  const scrollArea = doc.createElement("div");
  scrollArea.className = cn("h-0 flex-1 overflow-y-auto px-4 py-4") as string;
  scrollArea.append(EntryView({ doc, entry, showAddButton }));

  const editorWrapper = doc.createElement("div");
  editorWrapper.className = cn("border-border bg-muted shrink-0 border-t") as string;

  const editor = Editor({
    ownerDocument: doc,
    className: cn("h-[20%] min-h-24") as string,
    placeholder: "Context / Note (Markdown supported)...",
  });
  editor.setContent(entry.context ?? "");

  editorWrapper.append(editor.element);
  container.append(scrollArea, editorWrapper);

  return {
    element: container,
    getContext: editor.getContent,
    setContext: editor.setContent,
  };
}

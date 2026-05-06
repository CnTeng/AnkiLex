import type { DictionaryEntry, IAnkiService } from "@common/model";
import { Editor } from "@ui/components";
import { cn } from "tailwind-variants";
import { DictionaryEntryView } from "./entry";
import { DictionaryStatusView } from "./status";

export class DictionaryContentView {
  readonly element: HTMLDivElement;

  private readonly doc: Document;
  private readonly entryView: DictionaryEntryView;

  constructor({
    doc,
    entry,
    ankiService,
    showAddButton = true,
  }: {
    doc: Document;
    entry: DictionaryEntry;
    ankiService?: IAnkiService;
    showAddButton?: boolean;
  }) {
    this.doc = doc;
    this.entryView = new DictionaryEntryView({ doc, entry, ankiService, showAddButton });

    this.element = this.doc.createElement("div");
    this.element.className = cn("flex h-0 flex-1 flex-col overflow-hidden") as string;

    const scrollArea = this.doc.createElement("div");
    scrollArea.className = cn("h-0 flex-1 overflow-y-auto px-3 py-3") as string;
    scrollArea.append(this.entryView.element);

    const editorWrapper = this.doc.createElement("div");
    editorWrapper.className = cn("border-base-300 shrink-0 border-t px-3 py-2") as string;

    const editor = Editor({
      ownerDocument: this.doc,
      className: cn("border-base-300 h-[18%] min-h-22 border px-3 py-2 shadow-none") as string,
      placeholder: "Context / Note (Markdown supported)...",
    });
    editor.setContent(entry.context ?? "");
    editorWrapper.append(editor.element);

    this.element.append(scrollArea, editorWrapper);
  }
}

export class DictionaryPanel {
  readonly element: HTMLDivElement;

  private readonly doc: Document;
  private readonly ankiService?: IAnkiService;
  private readonly statusView: DictionaryStatusView;
  private currentLoadId = 0;

  constructor({
    doc = document,
    className,
    ankiService,
  }: {
    doc?: Document;
    className?: string;
    ankiService?: IAnkiService;
  }) {
    this.doc = doc;
    this.ankiService = ankiService;
    this.element = this.doc.createElement("div");
    this.element.className = className ?? cn("flex min-h-0 flex-1 flex-col") ?? "";
    this.statusView = new DictionaryStatusView(this.doc);
    this.showStatus();
  }

  load(entryPromise: Promise<DictionaryEntry | null>) {
    this.showStatus();
    this.currentLoadId += 1;
    const loadId = this.currentLoadId;

    return entryPromise
      .then((entry) => {
        if (loadId !== this.currentLoadId) return;
        if (!entry) {
          this.statusView.showEmpty();
          this.showStatus();
          return;
        }

        const contentView = new DictionaryContentView({
          doc: this.doc,
          entry,
          ankiService: this.ankiService,
        });
        this.element.replaceChildren(contentView.element);
        return contentView;
      })
      .catch((error) => {
        if (loadId !== this.currentLoadId) return;
        this.statusView.showError(error instanceof Error ? error.message : String(error));
        this.showStatus();
      });
  }

  private showStatus() {
    this.element.replaceChildren(this.statusView.element);
  }
}

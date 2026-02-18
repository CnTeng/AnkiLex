import { Editor, type EditorInstance } from "@lib/components";
import { theme } from "@lib/theme";
import "tiny-markdown-editor/dist/tiny-mde.min.css";
import { DictionaryEntryUI } from "@lib/ui";
import { cx } from "tailwind-variants";

let app: HTMLDivElement;
let resultsContainer: HTMLDivElement;
let editor: EditorInstance;

document.addEventListener("mousedown", (e) => {
  e.stopPropagation();
});

async function init() {
  await theme.init();

  app = document.createElement("div");
  app.className =
    cx(
      "bg-background text-foreground flex h-[600px] min-h-0 flex-col overflow-hidden duration-300 ease-out",
    ) ?? "";

  document.body.append(app);

  resultsContainer = document.createElement("div");
  resultsContainer.className = cx("flex min-h-0 flex-1 flex-col overflow-hidden p-0") ?? "";

  editor = Editor({
    placeholder: "Captured sentence or notes (Markdown supported)...",
    className: cx("h-[120px] flex-none") ?? "",
  });

  app.append(resultsContainer);

  window.addEventListener("message", (event) => {
    const { action, data } = event.data;

    if (action === "update") {
      const newContext = data?.context ? data.context : "";
      if (editor) editor.setContent(newContext);

      if (data.result) {
        resultsContainer.innerHTML = "";
        const cardWrapper = document.createElement("div");
        cardWrapper.className = cx("min-h-0 flex-1 overflow-y-auto p-4") ?? "";
        cardWrapper.append(
          DictionaryEntryUI({
            entry: data.result,
            showAddButton: true,
          }),
        );

        resultsContainer.append(cardWrapper);
        resultsContainer.append(editor.element);
        resultsContainer.scrollTop = 0;

        app.classList.add("expanded");
      }
    }
  });

  if (resultsContainer) {
    resultsContainer.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      const btn = target.closest(".add-anki-mini-btn") as HTMLElement;

      if (btn) {
        e.stopPropagation();
        const defIndex = parseInt(btn.dataset.defIndex || "0", 10);

        // Capture CURRENT context note value
        const currentContext = editor ? editor.getContent() : "";

        // Send message to parent
        parent.postMessage(
          {
            action: "add-to-anki",
            defIndex: defIndex,
            context: currentContext,
          },
          "*",
        );
      }
    });
  }
}

void init();

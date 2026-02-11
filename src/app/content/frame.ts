import "tiny-markdown-editor/dist/tiny-mde.min.css";
import {
  getEditorContent,
  initEditor,
  renderResult,
  setButtonError,
  setButtonLoading,
  setButtonSuccess,
  setEditorContent,
  type UIContext,
} from "@lib/ui";

const resultsContainer = document.getElementById("results-container") as HTMLDivElement;
const contextSection = document.getElementById("context-section") as HTMLDivElement;
const contextNoteArea = document.getElementById("context-note") as HTMLTextAreaElement;

const ui: UIContext = {
  resultsContainer,
  contextSection,
  contextNoteArea,
};

// Stop propagation of mousedown to prevent host page from seeing it
document.addEventListener("mousedown", (e) => {
  e.stopPropagation();
});

// We need to initialize the editor early
initEditor(contextNoteArea, "Captured sentence or notes (Markdown supported)...");

window.addEventListener("message", (event) => {
  const { action, data } = event.data;

  if (action === "update") {
    // 1. Update Context Editor
    if (contextSection && contextNoteArea) {
      contextSection.style.display = "flex";

      const newContext = data?.context ? data.context : "";
      setEditorContent(newContext);
    }

    // 2. Update Result
    if (data.result) {
      renderResult(data.result, ui);
    }
  } else if (action === "anki-added") {
    // Success State
    const button = resultsContainer.querySelector(
      `.add-anki-mini-btn[data-def-index="${event.data.defIndex}"]`,
    ) as HTMLButtonElement;

    if (button) {
      setButtonSuccess(button);
    }
  } else if (action === "anki-error") {
    // Error State
    const button = resultsContainer.querySelector(
      `.add-anki-mini-btn[data-def-index="${event.data.defIndex}"]`,
    ) as HTMLButtonElement;

    if (button) {
      setButtonError(button, event.data.error);
    }
  }
});

// Event Delegation for "Add to Anki" buttons
if (resultsContainer) {
  resultsContainer.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const btn = target.closest(".add-anki-mini-btn") as HTMLElement;

    if (btn) {
      e.stopPropagation();
      const defIndex = parseInt(btn.dataset.defIndex || "0", 10);

      // Show loading state
      setButtonLoading(btn as HTMLButtonElement);

      // Capture CURRENT context note value
      const currentContext = getEditorContent(contextNoteArea);

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

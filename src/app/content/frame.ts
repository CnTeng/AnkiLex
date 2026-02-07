import "tiny-markdown-editor/dist/tiny-mde.min.css";
import { attachAudioListeners } from "../../lib/ui/dictionary-card";
import {
  getEditorContent,
  initEditor,
  renderResult,
  setEditorContent,
  type UIContext,
} from "../../lib/ui/ui-shared";

// DOM Elements
const contextSection = document.getElementById("context-section") as HTMLDivElement;
const contextNoteArea = document.getElementById("context-note") as HTMLTextAreaElement;
const resultsContainer = document.getElementById("results-container") as HTMLDivElement;
// Remove manual toolbar as EasyMDE handles it
const markdownToolbar = document.querySelector(".markdown-toolbar") as HTMLDivElement;
if (markdownToolbar) markdownToolbar.style.display = "none";

// UI Context for shared functions
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
    // We now expect raw result from content.ts
    if (data.result) {
      renderResult(data.result, ui);
    } else if (data.html) {
      // Legacy fallback (should not be reached if content.ts is updated)
      resultsContainer.innerHTML = data.html;
      attachAudioListeners(resultsContainer);
    }
  } else if (action === "anki-added") {
    // Success State
    const button = resultsContainer.querySelector(
      `.add-anki-mini-btn[data-def-index="${event.data.defIndex}"]`,
    ) as HTMLButtonElement;

    if (button) {
      button.classList.remove("spinning");
      button.classList.add("success");
      button.style.color = "var(--adw-success)";
      button.style.borderColor = "var(--adw-success)";
      button.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
      `;

      setTimeout(() => {
        button.disabled = false;
        button.innerHTML = `<span class="icon plus"></span>`;
        button.style.color = "";
        button.style.borderColor = "";
        button.classList.remove("success");
      }, 2000);
    }
  } else if (action === "anki-error") {
    // Error State
    const button = resultsContainer.querySelector(
      `.add-anki-mini-btn[data-result-index="${event.data.index}"][data-def-index="${event.data.defIndex}"]`,
    ) as HTMLButtonElement;

    if (button) {
      button.classList.remove("spinning");
      button.classList.add("error");
      button.style.color = "var(--adw-error)";
      button.style.borderColor = "var(--adw-error)";
      button.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
      button.title = event.data.error;

      setTimeout(() => {
        button.disabled = false;
        button.innerHTML = `<span class="icon plus"></span>`;
        button.style.color = "";
        button.style.borderColor = "";
        button.classList.remove("error");
      }, 3000);
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
      (btn as HTMLButtonElement).disabled = true;
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"></path></svg>`;
      btn.classList.add("spinning");

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

import { CommandBar, Editor } from "tiny-markdown-editor";
import type { DictionaryResult } from "../models";
import { attachAudioListeners, generateResultCardHtml } from "./card-renderer";

export interface UIContext {
  resultsContainer: HTMLElement;
  contextSection: HTMLElement;
  contextNoteArea: HTMLTextAreaElement;
  emptyState?: HTMLElement;
  errorState?: HTMLElement;
  errorMessage?: HTMLElement;
  loadingState?: HTMLElement;
  addToAnkiBtn?: HTMLButtonElement; // Only for Popup, not Frame
}

let tinyMDE: Editor | null = null;
let commandBar: CommandBar | null = null;

/**
 * Initialize the EasyMDE editor in a compact mode
 */
export function initEditor(
  textarea: HTMLTextAreaElement,
  placeholder: string = "Context / Note...",
): Editor | null {
  if (!textarea) return null;

  // Create a container for the toolbar if it doesn't exist
  let toolbarContainer = textarea.parentElement?.querySelector(".tinymde-toolbar") as HTMLElement;
  if (!toolbarContainer) {
    toolbarContainer = document.createElement("div");
    toolbarContainer.className = "tinymde-toolbar";
    textarea.parentElement?.insertBefore(toolbarContainer, textarea);
  }

  tinyMDE = new Editor({
    textarea: textarea,
    placeholder: placeholder,
  });

  commandBar = new CommandBar({
    element: toolbarContainer,
    editor: tinyMDE,
    commands: [
      "bold",
      "italic",
      "strikethrough",
      "|",
      "ul",
      "ol",
      "|",
      "blockquote",
      "code",
      "|",
      "insertLink",
    ],
  });

  return tinyMDE;
}

/**
 * Update the editor content safely
 */
export function setEditorContent(content: string) {
  if (tinyMDE) {
    tinyMDE.setContent(content);
  }
}

/**
 * Get current editor content
 */
export function getEditorContent(fallbackTextarea?: HTMLTextAreaElement): string {
  if (tinyMDE) {
    return tinyMDE.getContent();
  }
  return fallbackTextarea ? fallbackTextarea.value : "";
}

/**
 * Render the entire results list
 */
export function renderResults(results: DictionaryResult[], ui: UIContext) {
  const { resultsContainer, emptyState, errorState, loadingState, addToAnkiBtn } = ui;

  // 1. Reset States
  if (emptyState) emptyState.classList.add("hidden");
  if (errorState) errorState.classList.add("hidden");
  if (loadingState) loadingState.classList.add("hidden");

  // Show Add to Anki button (Popup only)
  if (addToAnkiBtn) {
    addToAnkiBtn.classList.remove("hidden");
  }

  // 2. Clear & Render
  resultsContainer.innerHTML = "";
  results.forEach((result, index) => {
    const card = document.createElement("div");
    card.className = "ankilex-note"; // Use shared class name
    // For Popup, we might need a wrapper, but let's try to unify styles.
    // Frame uses .ankilex-note, Popup used .result-card.
    // We should migrate Popup SCSS to use .ankilex-note too.

    // Check if we are in Frame or Popup to decide if we show mini-buttons
    // Frame always shows mini-buttons. Popup shows them too now?
    // The previous popup logic had a global "Add to Anki" button, but frame had per-definition buttons.
    // Let's stick to the per-definition buttons for consistency if possible, OR keep them separate.
    // For now, we use the shared renderer which adds buttons by default.
    card.innerHTML = generateResultCardHtml(result, index, true);
    attachAudioListeners(card);
    resultsContainer.appendChild(card);
  });

  resultsContainer.scrollTop = 0;
}

/**
 * Show error state
 */
export function showError(message: string, ui: UIContext) {
  const {
    resultsContainer,
    emptyState,
    errorState,
    errorMessage,
    loadingState,
    contextSection,
    addToAnkiBtn,
  } = ui;

  if (emptyState) emptyState.classList.add("hidden");
  if (loadingState) loadingState.classList.add("hidden");
  resultsContainer.innerHTML = "";

  // Hide context section on error
  if (contextSection) contextSection.style.display = "none";
  if (addToAnkiBtn) addToAnkiBtn.classList.add("hidden");

  if (errorMessage) errorMessage.textContent = message;
  if (errorState) errorState.classList.remove("hidden");
}

/**
 * Show loading state
 */
export function showLoading(ui: UIContext) {
  const { resultsContainer, emptyState, errorState, loadingState, contextSection, addToAnkiBtn } =
    ui;

  if (emptyState) emptyState.classList.add("hidden");
  if (errorState) errorState.classList.add("hidden");
  resultsContainer.innerHTML = "";

  if (contextSection) contextSection.style.display = "none";
  if (addToAnkiBtn) addToAnkiBtn.classList.add("hidden");

  if (loadingState) loadingState.classList.remove("hidden");
}

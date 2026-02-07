import { CommandBar, Editor } from "tiny-markdown-editor";
import type { DictionaryEntry } from "../model";
import { attachAudioListeners, renderDictionaryEntry } from "./dictionary-card";

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
const commandBar: CommandBar | null = null;

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

  const commandBar = new CommandBar({
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
 * Render a single result
 */
export function renderResult(result: DictionaryEntry, ui: UIContext) {
  const { resultsContainer, emptyState, errorState, loadingState, addToAnkiBtn } = ui;

  if (emptyState) emptyState.classList.add("hidden");
  if (errorState) errorState.classList.add("hidden");
  if (loadingState) loadingState.classList.add("hidden");

  if (addToAnkiBtn) {
    addToAnkiBtn.classList.remove("hidden");
  }

  resultsContainer.innerHTML = "";

  const card = document.createElement("div");
  card.className = "ankilex-note";

  // Always pass index 0 for single result mode
  const cardContent = renderDictionaryEntry(result, true);
  card.appendChild(cardContent);

  attachAudioListeners(card);
  resultsContainer.appendChild(card);

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

import type { DictionaryEntry } from "../model";
import { attachAudioListeners, renderDictionaryEntry } from "./dictionary";

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

  // Remove wrapper div, append directly to results container (which is now flex column)
  // This unifies the structure with how popup/frame expect to layout items
  const cardContent = renderDictionaryEntry(result, true);
  resultsContainer.appendChild(cardContent);

  attachAudioListeners(resultsContainer);

  resultsContainer.scrollTop = 0;
}

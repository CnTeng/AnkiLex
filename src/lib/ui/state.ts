import type { UIContext } from "./context";

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

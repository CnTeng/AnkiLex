/**
 * Popup UI Script
 * Vanilla TypeScript - no frameworks
 * Simple DOM manipulation like backend templating
 */

import { api } from "@lib/api";
import type { DictionaryEntry } from "@lib/model";
import "tiny-markdown-editor/dist/tiny-mde.min.css";
import {
  getEditorContent,
  initEditor,
  renderResult,
  setButtonError,
  setButtonLoading,
  setButtonSuccess,
  setEditorContent,
  showError,
  showLoading,
  type UIContext,
} from "@lib/ui";

// DOM elements
const searchInput = document.getElementById("search-input") as HTMLInputElement;
const loading = document.getElementById("loading") as HTMLDivElement;
const resultsContainer = document.getElementById("results-container") as HTMLDivElement;
const contextSection = document.getElementById("context-section") as HTMLDivElement;
const contextNoteArea = document.getElementById("context-note") as HTMLTextAreaElement;
const emptyState = document.getElementById("empty-state") as HTMLDivElement;
const errorState = document.getElementById("error-state") as HTMLDivElement;
const errorMessage = document.getElementById("error-message") as HTMLParagraphElement;
const settingsBtn = document.getElementById("settings-btn") as HTMLButtonElement;

// UI Context for shared functions
const ui: UIContext = {
  resultsContainer,
  contextSection,
  contextNoteArea,
  emptyState,
  errorState,
  errorMessage,
  loadingState: loading,
};

// State
let currentResult: DictionaryEntry | null = null;

/**
 * Initialize popup
 */
async function init() {
  // Initialize Editor immediately but hidden
  initEditor(contextNoteArea);

  // Check URL params for pre-filled word
  const urlParams = new URLSearchParams(window.location.search);
  const word = urlParams.get("word");

  if (word?.trim()) {
    searchInput.value = word;
    expandPopup(); // Immediately expand if pre-filled
    await performSearch(word);
  }

  // Event listeners
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  });

  // Event delegation for Add to Anki buttons
  resultsContainer.addEventListener("click", handleResultsContainerClick);
  settingsBtn.addEventListener("click", handleOpenSettings);

  // Focus search input
  searchInput.focus();
}

/**
 * Handle clicks within results container
 */
function handleResultsContainerClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  const btn = target.closest(".add-anki-mini-btn") as HTMLElement;

  if (btn) {
    e.stopPropagation();
    const defIndex = parseInt(btn.dataset.defIndex || "0", 10);
    handleAddToAnki(defIndex, btn as HTMLButtonElement);
  }
}

/**
 * Helper to expand popup
 */
function expandPopup() {
  document.body.classList.add("expanded");
}

/**
 * Handle search button click
 */
async function handleSearch() {
  const word = searchInput.value.trim();
  if (!word) {
    return;
  }

  expandPopup();
  await performSearch(word);
}

/**
 * Perform search via background script
 */
async function performSearch(word: string) {
  showLoading(ui);

  try {
    const result = await api.dictionary.lookup(word);

    if (!result) {
      showError("No results found", ui);
      return;
    }

    currentResult = result;

    // Render results
    renderResult(currentResult, ui);

    // Show context editor when results are found
    if (contextSection) {
      contextSection.style.display = "flex";
      setEditorContent(""); // Reset or set context if we had it
    }
  } catch (error) {
    console.error("Search error:", error);
    showError("Failed to perform search", ui);
  }
}

/**
 * Handle add to Anki button click
 */
async function handleAddToAnki(defIndex: number, btn: HTMLButtonElement) {
  const result = currentResult;
  if (!result) {
    return;
  }

  // Visual feedback on button
  setButtonLoading(btn);

  try {
    // Capture context note
    const contextNote = getEditorContent(contextNoteArea);

    // We need to send the specific definition to add
    const response = await api.anki.createNoteFromResult({
      result,
      defIndex,
      context: contextNote,
    });

    if (response.noteId) {
      setButtonSuccess(btn);
    } else {
      throw new Error("No noteId returned");
    }
  } catch (error) {
    console.error("Add to Anki error:", error);
    setButtonError(btn);
  }
}

/**
 * Handle settings button click
 */
function handleOpenSettings() {
  // Open settings page
  chrome.runtime.openOptionsPage();
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

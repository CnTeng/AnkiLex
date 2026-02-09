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
  setEditorContent,
  showError,
  showLoading,
  type UIContext,
} from "@lib/ui/ui-shared";

// DOM elements
const searchInput = document.getElementById("search-input") as HTMLInputElement;
const loading = document.getElementById("loading") as HTMLDivElement;
const resultsContainer = document.getElementById("results-container") as HTMLDivElement;
const contextSection = document.getElementById("context-section") as HTMLDivElement;
const contextNoteArea = document.getElementById("context-note") as HTMLTextAreaElement;
const emptyState = document.getElementById("empty-state") as HTMLDivElement;
const errorState = document.getElementById("error-state") as HTMLDivElement;
const errorMessage = document.getElementById("error-message") as HTMLParagraphElement;
const addToAnkiBtn = document.getElementById("add-to-anki-btn") as HTMLButtonElement;
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
  addToAnkiBtn,
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
  // Ignore resultIndex as we only have one result now
  const result = currentResult;
  if (!result) {
    return;
  }

  // Visual feedback on button

  const originalContent = btn.innerHTML;
  btn.disabled = true;
  // Spinner icon
  btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"></path></svg>`;
  btn.classList.add("spinning");

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
      // Success checkmark
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
      btn.style.color = "var(--adw-success)";
      btn.style.borderColor = "var(--adw-success)";

      // Reset after delay
      setTimeout(() => {
        btn.innerHTML = originalContent;
        btn.disabled = false;
        btn.classList.remove("spinning");
        btn.style.color = "";
        btn.style.borderColor = "";
      }, 2000);
    } else {
      throw new Error("No noteId returned");
    }
  } catch (error) {
    console.error("Add to Anki error:", error);
    // Error X icon
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
    btn.style.color = "var(--adw-error)";
    btn.style.borderColor = "var(--adw-error)";

    setTimeout(() => {
      btn.innerHTML = originalContent;
      btn.disabled = false;
      btn.classList.remove("spinning");
      btn.style.color = "";
      btn.style.borderColor = "";
    }, 2000);
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

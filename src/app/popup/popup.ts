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

const searchInput = document.getElementById("search-input") as HTMLInputElement;
const settingsBtn = document.getElementById("settings-btn") as HTMLButtonElement;

const loading = document.getElementById("loading") as HTMLDivElement;
const resultsContainer = document.getElementById("results-container") as HTMLDivElement;

const contextSection = document.getElementById("context-section") as HTMLDivElement;
const contextNoteArea = document.getElementById("context-note") as HTMLTextAreaElement;

const emptyState = document.getElementById("empty-state") as HTMLDivElement;
const errorState = document.getElementById("error-state") as HTMLDivElement;
const errorMessage = document.getElementById("error-message") as HTMLParagraphElement;

const ui: UIContext = {
  resultsContainer,
  contextSection,
  contextNoteArea,
  emptyState,
  errorState,
  errorMessage,
  loadingState: loading,
};

let currentResult: DictionaryEntry | null = null;
let isSearching = false;

async function init() {
  initEditor(contextNoteArea);

  searchInput.addEventListener("keydown", handleSearchWord);
  settingsBtn.addEventListener("click", handleOpenSettings);
  resultsContainer.addEventListener("click", handleResultsClick);

  searchInput.focus();
}

function handleSearchWord(e: KeyboardEvent) {
  if (e.key !== "Enter") return;

  const word = searchInput.value.trim();
  if (!word || isSearching) return;

  document.body.classList.add("expanded");
  performSearch(word);
}

function handleOpenSettings() {
  chrome.runtime.openOptionsPage();
}

function handleResultsClick(e: MouseEvent) {
  const btn = (e.target as HTMLElement).closest(".add-anki-mini-btn") as HTMLButtonElement | null;

  if (!btn) return;

  e.stopPropagation();

  const defIndex = Number(btn.dataset.defIndex ?? 0);
  handleAddToAnki(defIndex, btn);
}

async function performSearch(word: string) {
  isSearching = true;
  showLoading(ui);

  try {
    const result = await api.dictionary.lookup(word);
    if (!result) {
      showError("No results found", ui);
      return;
    }
    currentResult = result;

    renderResult(result, ui);
    contextSection.style.display = "flex";
    setEditorContent("");
  } catch (error) {
    console.error("Search error:", error);
    showError("Failed to perform search", ui);
  } finally {
    isSearching = false;
  }
}

async function handleAddToAnki(defIndex: number, btn: HTMLButtonElement) {
  if (!currentResult) return;

  setButtonLoading(btn);

  try {
    const contextNote = getEditorContent(contextNoteArea);

    const response = await api.anki.createNoteFromResult({
      result: currentResult,
      defIndex,
      context: contextNote,
    });

    if (!response?.noteId) {
      throw new Error("Invalid response");
    }

    setButtonSuccess(btn);
  } catch (error) {
    console.error("Add to Anki error:", error);
    setButtonError(btn);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  void init();
}

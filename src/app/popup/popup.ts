import { api } from "@lib/api";
import { Editor, type EditorInstance } from "@lib/components";
import { theme } from "@lib/theme";
import "tiny-markdown-editor/dist/tiny-mde.min.css";
import {
  createEmpty,
  createError,
  createLoading,
  DictionaryEntryUI,
  SearchBar,
  StateView,
  type StateViewInstance,
} from "@lib/ui";
import { cx } from "tailwind-variants";

let app: HTMLDivElement;
let stateView: StateViewInstance;
let resultsContainer: HTMLDivElement;
let editor: EditorInstance;

async function init() {
  await theme.init();

  app = document.createElement("div");
  app.className =
    cx(
      "bg-background text-foreground flex h-12 min-h-0 flex-col overflow-hidden transition-[height] duration-300 ease-out data-[state=expanded]:h-[600px]",
    ) ?? "";
  app.dataset.state = "collapsed";

  document.body.append(app);

  const searchBar = SearchBar({
    onSettingsClick: () => chrome.runtime.openOptionsPage(),
    onSearch: async (word) => {
      // let CSS handle expanded height via #app.expanded
      if (app) {
        app.classList.add("expanded");
      }
      await performSearch(word);
    },
  });

  app.append(searchBar.container);

  searchBar.input.addEventListener("input", (e) => {
    const val = (e.currentTarget as HTMLInputElement).value.trim();
    if (!val && app) app.classList.remove("expanded");
  });

  resultsContainer = document.createElement("div");
  resultsContainer.className = cx("flex min-h-0 flex-1 flex-col overflow-hidden p-0") ?? "";

  editor = Editor({
    placeholder: "Context / Note (Markdown supported)...",
    className: cx("h-[120px] flex-none") ?? "",
  });

  stateView = StateView({
    empty: createEmpty(),
    loading: createLoading(),
    error: createError(),
    content: resultsContainer,
  });

  app.append(stateView.element);

  searchBar.input.focus();
}

async function performSearch(word: string) {
  stateView?.setState("loading");

  try {
    const result = await api.dictionary.lookup(word);

    if (!result) {
      stateView?.setState("error", "No results found");
      return;
    }

    resultsContainer.innerHTML = "";

    const cardWrapper = document.createElement("div");
    cardWrapper.className = cx("min-h-0 flex-1 overflow-y-auto p-4") ?? "";
    cardWrapper.append(
      DictionaryEntryUI({
        entry: result,
        showAddButton: true,
      }),
    );

    resultsContainer.append(cardWrapper);
    resultsContainer.append(editor.element);
    resultsContainer.scrollTop = 0;

    stateView?.setState("content");

    app.dataset.state = "expanded";
    editor?.setContent("");
  } catch (error) {
    console.error("Search error:", error);
    stateView?.setState("error", "Failed to perform search");
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  void init();
}

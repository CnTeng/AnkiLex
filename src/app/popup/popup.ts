import { api } from "@lib/api";
import {
  DictionaryPanel,
  EmptyView,
  ErrorView,
  LoadingView,
  SearchBar,
  ViewSwitch,
} from "@lib/view";
import { cx } from "tailwind-variants";

async function init() {
  const app = document.createElement("div");
  app.className =
    cx(
      "bg-background text-foreground flex h-12 min-h-0 flex-col overflow-hidden transition-[height] duration-300 ease-out data-[state=expanded]:h-[480px]",
    ) ?? "";
  app.dataset.state = "collapsed";

  document.body.append(app);

  const stateView = ViewSwitch({
    className: cx("flex min-h-0 flex-1 flex-col"),
    states: new Map([
      ["loading", LoadingView({})],
      ["empty", EmptyView({})],
      ["error", ErrorView({})],
    ]),
    initial: "loading",
  });

  const searchBar = SearchBar({
    onSettingsClick: () => chrome.runtime.openOptionsPage(),
    onSearch: async (word) => {
      stateView.setState("loading");
      api.dictionary
        .lookup(word)
        .then((result) => {
          if (!result) {
            stateView.setState("empty");
            return;
          }

          const panel = DictionaryPanel({
            entry: result,
            showAddButton: true,
          });

          stateView.setState("content", panel.element);
          app.dataset.state = "expanded";
        })
        .catch((error) => {
          console.error("Search error:", error);
          stateView.setState("error");
        });
    },
  });

  app.append(searchBar.container, stateView.element);

  searchBar.input.focus();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  void init();
}

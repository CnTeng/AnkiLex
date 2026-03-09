import { rpc } from "@lib/rpc";
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
      rpc.dictionary
        .lookup({ word })
        .then((result) => {
          if (!result) {
            stateView.setState("empty");
            return;
          }

          let panel: ReturnType<typeof DictionaryPanel> | null = null;
          const onAddClick = async (index?: number) => {
            if (typeof index !== "number") return;
            if (!panel) return;
            const context = panel.getContext();
            await rpc.anki.createNoteFromResult({
              result,
              defIndex: index,
              options: {},
              context,
            });
          };

          panel = DictionaryPanel({
            entry: result,
            showAddButton: true,
            onAddClick,
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

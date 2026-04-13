import { rpc } from "@lib/rpc";
import { DictionaryPanel } from "@lib/ui";
import { SearchBar } from "@lib/ui/search-bar";
import { cx } from "tailwind-variants";

async function init() {
  const app = document.createElement("div");
  app.className =
    cx(
      "bg-background text-foreground flex h-12 min-h-0 flex-col overflow-hidden transition-[height] duration-300 ease-out data-[state=expanded]:h-[480px]",
    ) ?? "";
  app.dataset.state = "collapsed";

  document.body.append(app);

  const stateView = DictionaryPanel({
    className: cx("flex min-h-0 flex-1 flex-col"),
  });

  const searchBar = SearchBar({
    onSearch: async (word, language) => {
      app.dataset.state = "expanded";

      stateView.load(rpc.dictionary.lookup({ word, language })).then(() => {
        app.dataset.state = "expanded";
      });
    },
  });

  rpc.dictionary.getEnabledLanguages().then(searchBar.setLanguages);

  app.append(searchBar.container, stateView.element);

  searchBar.input.focus();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  void init();
}

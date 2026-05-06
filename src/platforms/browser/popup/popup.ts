import { createChromePlatformServices } from "@services";
import { DictionaryPanel } from "@ui/dictionary";
import { SearchBar } from "@ui/search-bar";
import { cx } from "tailwind-variants";

async function init() {
  const services = createChromePlatformServices();
  const app = document.createElement("div");
  app.className =
    cx(
      "bg-base-100 text-base-content border-base-300 flex h-16 min-h-0 flex-col border transition-[height] duration-200 ease-out data-[state=expanded]:h-[460px]",
    ) ?? "";
  app.dataset.state = "collapsed";

  document.body.append(app);

  const stateView = new DictionaryPanel({
    className: cx("flex min-h-0 flex-1 flex-col overflow-hidden"),
    ankiService: services.anki,
  });

  const searchBar = new SearchBar({
    dictionaryService: services.dictionary,
    configService: services.config,
  });
  searchBar.onDidSubmitSearch(async (result) => {
    app.dataset.state = "expanded";

    await stateView.load(result);
  });

  app.append(searchBar.element, stateView.element);

  searchBar.focus();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  void init();
}

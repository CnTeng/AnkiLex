import { BrowserPlatformServices } from "@services";
import { DictionaryPanel } from "@views/dictionary";
import { SearchBar } from "@views/search-bar";
import { cx } from "tailwind-variants";

async function init() {
  const services = new BrowserPlatformServices();
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
    configService: services.config,
    dictionaryService: services.dictionary,
  });
  searchBar.onDidSubmitSearch(async (result) => {
    app.dataset.state = "expanded";
    await stateView.load(result);
  });

  app.append(searchBar.element, stateView.element);

  searchBar.focus();

  return () => {
    searchBar.dispose();
  };
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    void init().then((dispose) => {
      window.addEventListener("pagehide", dispose, { once: true });
    });
  });
} else {
  void init().then((dispose) => {
    window.addEventListener("pagehide", dispose, { once: true });
  });
}

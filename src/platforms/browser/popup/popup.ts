import { BrowserPlatformServices } from "@services";
import { LookupPanel } from "@views/lookup-panel";
import { SearchBar } from "@views/search-bar";
import { cx } from "tailwind-variants";

async function init() {
  const services = new BrowserPlatformServices();
  const app = document.createElement("div");
  app.className =
    cx(
      "bg-background/96 text-foreground border-border/60 flex h-12 min-h-0 flex-col overflow-hidden border shadow-[0_10px_30px_rgb(0_0_0/0.10)] backdrop-blur-sm transition-[height] duration-300 ease-out data-[state=expanded]:h-[480px]",
    ) ?? "";
  app.dataset.state = "collapsed";

  document.body.append(app);

  const searchBar = new SearchBar({
    container: app,
    dictionaryService: services.dictionary,
  });

  const stateView = new LookupPanel({
    container: app,
    className: cx("flex min-h-0 flex-1 flex-col overflow-hidden"),
    ankiService: services.anki,
    configService: services.config.dictionary,
    dictionaryService: services.dictionary,
  });

  searchBar.onDidSubmitSearch(async ({ word, result }) => {
    app.dataset.state = "expanded";
    await stateView.load(result, { word });
  });

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

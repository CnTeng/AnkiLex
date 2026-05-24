import type { Context } from "@common/model";
import { BrowserPlatformServices } from "@services";
import { LookupPanel } from "@views/lookup-panel";
import { cx } from "tailwind-variants";

function init() {
  const services = new BrowserPlatformServices();
  const app = document.createElement("div");
  app.className =
    cx("bg-background text-foreground flex h-full min-h-0 flex-col overflow-hidden") ?? "";

  document.body.append(app);

  const stateView = new LookupPanel({
    container: app,
    className: cx("flex h-0 flex-1 flex-col"),
    ankiService: services.anki,
    configService: services.config,
    dictionaryService: services.dictionary,
  });

  window.addEventListener("message", (event) => {
    if (event.data?.action === "lookup") {
      const { word, context } = (event.data?.data ?? {}) as {
        word?: string;
        context?: Context;
      };
      if (!word) return;

      stateView.load(services.dictionary.lookup(word, context), { word, context });
    }
  });
}

void init();

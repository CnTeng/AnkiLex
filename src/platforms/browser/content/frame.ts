import type { Context } from "@common/model";
import { createChromePlatformServices } from "@services";
import { DictionaryPanel } from "@ui/dictionary";
import { cx } from "tailwind-variants";

function init() {
  const services = createChromePlatformServices();
  const app = document.createElement("div");
  app.className =
    cx("bg-base-100 text-base-content flex h-full min-h-0 flex-col overflow-hidden") ?? "";

  document.body.append(app);

  const stateView = new DictionaryPanel({
    className: cx("flex h-0 flex-1 flex-col"),
    ankiService: services.anki,
  });
  app.append(stateView.element);

  window.addEventListener("message", (event) => {
    if (event.data?.action === "lookup") {
      const { word, context } = (event.data?.data ?? {}) as {
        word?: string;
        context?: Context;
      };
      if (!word) return;

      stateView.load(services.dictionary.lookup({ word, context }));
    }
  });
}

void init();

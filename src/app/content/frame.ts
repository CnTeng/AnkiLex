import type { Context } from "@lib/model";
import { rpc } from "@lib/rpc";
import { DictionaryPanel } from "@lib/ui";
import { cx } from "tailwind-variants";

function init() {
  const app = document.createElement("div");
  app.className =
    cx("bg-background text-foreground flex h-full min-h-0 flex-col overflow-hidden") ?? "";

  document.body.append(app);

  const stateView = DictionaryPanel({
    className: cx("flex h-0 flex-1 flex-col"),
  });
  app.append(stateView.element);

  window.addEventListener("message", (event) => {
    if (event.data?.action === "lookup") {
      const { word, context } = (event.data?.data ?? {}) as {
        word?: string;
        context?: Context;
      };
      if (!word) return;

      stateView.load(rpc.dictionary.lookup({ word, context }));
    }
  });
}

void init();

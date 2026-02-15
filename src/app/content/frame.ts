import { DictionaryPanel, EmptyView, ErrorView, LoadingView, ViewSwitch } from "@lib/view";
import { cx } from "tailwind-variants";

async function init() {
  const app = document.createElement("div");
  app.className =
    cx("bg-background text-foreground flex h-full min-h-0 flex-col overflow-hidden") ?? "";

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
  app.append(stateView.element);

  window.addEventListener("message", (event) => {
    const { action, data } = event.data;

    if (action !== "update") return;

    stateView.setState("loading");

    if (!data.result) {
      stateView.setState("empty");
      return;
    }

    const panel = DictionaryPanel({
      entry: data.result,
      showAddButton: true,
      context: data?.context ?? "",
    });

    stateView.setState("content", panel.element);
  });
}

void init();

import { rpc } from "@lib/rpc";
import { DictionaryPanel, EmptyView, ErrorView, LoadingView, ViewSwitch } from "@lib/view";
import { cx } from "tailwind-variants";

async function init() {
  const app = document.createElement("div");
  app.className =
    cx("bg-background text-foreground flex h-full min-h-0 flex-col overflow-hidden") ?? "";

  document.body.append(app);

  const stateView = ViewSwitch({
    className: cx("flex h-0 flex-1 flex-col"),
    states: new Map([
      ["loading", LoadingView({})],
      ["empty", EmptyView({})],
      ["error", ErrorView({})],
    ]),
    initial: "loading",
  });
  app.append(stateView.element);

  window.addEventListener("message", async (event) => {
    const { action, data } = event.data;

    if (action !== "update") return;

    stateView.setState("loading");

    if (!data.result) {
      stateView.setState("empty");
      return;
    }

    const render = () => {
      const panel = DictionaryPanel({
        entry: data.result,
        showAddButton: true,
        context: data?.context ?? "",
        onAddClick: async (index) => {
          if (typeof index !== "number") return;

          try {
            const context = panel.getContext();
            await rpc.anki.createNoteFromResult({
              result: data.result,
              defIndex: index,
              options: {},
              context,
            });

            render();
          } catch (error) {
            console.error("Failed to add to Anki", error);
            alert(
              `Failed to add to Anki: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw error;
          }
        },
      });

      stateView.setState("content", panel.element);
    };

    render();
  });
}

void init();

import { dictionary } from "@lib/dictionary";
import { DictionaryPanel, ErrorView, LoadingView, ViewSwitch } from "@lib/view";
import popupStyle from "./popup.css?inline";

export function registerReaderInitializer() {
  Zotero.Reader.registerEventListener("renderTextSelectionPopup", (event) => {
    const { doc, params, append } = event;

    const popup = doc.querySelector(".selection-popup") as HTMLDivElement;
    popup.style.maxWidth = "none";

    popup.addEventListener(
      "keydown",
      (e) => {
        if (e.key === "Backspace" || e.key === "Delete") {
          e.stopPropagation();
        }
      },
      { capture: true },
    );

    const expression = params.annotation.text.trim();

    const container = doc.createElement("div");
    container.className = "anki-lex-popup";

    const style = doc.createElement("style");
    style.textContent = popupStyle;
    container.append(style);

    const stateView = ViewSwitch({
      doc,
      className: "min-h-0 flex-1 flex flex-col",
      states: new Map([
        ["loading", LoadingView({ doc })],
        ["error", ErrorView({ doc })],
      ]),
      initial: "loading",
    });

    container.append(stateView.element);
    append(container);

    dictionary
      .lookup(expression, "youdao")
      .then((entry) => {
        if (entry) {
          const panel = DictionaryPanel({
            doc,
            entry,
            showAddButton: false,
          });
          stateView.setState("content", panel.element);
        }
      })
      .catch((error) => {
        Zotero.log(`Failed to fetch dictionary entry: ${error}`);
        stateView.setState("error");
      });
  });
}

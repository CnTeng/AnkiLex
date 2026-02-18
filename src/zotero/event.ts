import { dictionary } from "@lib/dictionary";
import { DictionaryEntryUI } from "@lib/ui";
import { cx } from "tailwind-variants";
import "./popup.css";

export function registerReaderInitializer() {
  Zotero.Reader.registerEventListener("renderTextSelectionPopup", (event) => {
    const { doc, params, append } = event;

    if (!doc.getElementById("tw-style")) {
      const style = doc.createElement("style");
      style.id = "tw-style";
      doc.head.appendChild(style);
    }

    const expression = params.annotation.text.trim();

    const container = doc.createElement("div");
    container.className = cx("tw-root bg-background text-foreground p-4") ?? "";

    const style = doc.createElement("style");
    style.id = "tw-style";
    container.append(style);

    const loading = doc.createElement("div");
    loading.textContent = "Loading...";
    loading.style.padding = "10px";
    container.append(loading);

    append(container);

    const cardWrapper = doc.createElement("div");
    cardWrapper.className = cx("h-[600px] min-h-0 flex-1 overflow-y-auto p-4") ?? "";

    dictionary
      .lookup(expression, "youdao")
      .then((entry) => {
        container.removeChild(loading);
        if (entry) {
          cardWrapper.append(
            DictionaryEntryUI({
              entry: entry,
              showAddButton: false,
              doc,
            }),
          );
          container.append(cardWrapper);
        } else {
          const notFound = doc.createElement("div");
          notFound.textContent = "No definition found.";
          notFound.style.padding = "10px";
          container.append(notFound);
        }
      })
      .catch((error) => {
        Zotero.log(`Error during lookup`);
        Zotero.log(error);
        const errorDiv = doc.createElement("div");
        errorDiv.textContent = "Error loading definition.";
        errorDiv.style.color = "red";
        errorDiv.style.padding = "10px";
        container.appendChild(errorDiv);
      });
  });
}

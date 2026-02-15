import { dictionary } from "@lib/dictionary";
import { attachAudioListeners, renderDictionaryEntry } from "@lib/ui";
import popupStyle from "./popup.scss?inline";

export function registerReaderInitializer() {
  Zotero.Reader.registerEventListener("renderTextSelectionPopup", (event) => {
    const { doc, params, append } = event;

    const popup = doc.querySelector(".selection-popup") as HTMLDivElement;
    popup.style.maxWidth = "none";

    const expression = params.annotation.text.trim();

    const container = doc.createElement("div");
    container.className = "anki-lex-popup";

    const style = doc.createElement("style");
    style.textContent = popupStyle;
    container.appendChild(style);

    const loading = doc.createElement("div");
    loading.textContent = "Loading...";
    loading.style.padding = "10px";
    container.appendChild(loading);

    append(container);

    dictionary
      .lookup(expression, "youdao")
      .then((entry) => {
        container.removeChild(loading);
        if (entry) {
          const content = renderDictionaryEntry(doc, entry, false);
          container.appendChild(content);
          attachAudioListeners(container);
        } else {
          const notFound = doc.createElement("div");
          notFound.textContent = "No definition found.";
          notFound.style.padding = "10px";
          container.appendChild(notFound);
        }
      })
      .catch((error) => {
        container.removeChild(loading);
        Zotero.log(`Error during lookup: ${error}`);
        const errorDiv = doc.createElement("div");
        errorDiv.textContent = "Error loading definition.";
        errorDiv.style.color = "red";
        errorDiv.style.padding = "10px";
        container.appendChild(errorDiv);
      });
  });
}

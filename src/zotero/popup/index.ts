import { extractContext } from "@lib/context";
import { dictionary } from "@lib/dictionary";
import { DictionaryPanel, ErrorView, LoadingView, ViewSwitch } from "@lib/view";
import popupStyle from "./popup.css?inline";

const handler = (event: _ZoteroTypes.Reader.EventParams<"renderTextSelectionPopup">) => {
  const { reader, doc, params, append } = event;
  const popup = doc.querySelector(".selection-popup") as HTMLDivElement;
  popup.style.maxWidth = "none";

  const expression = params.annotation.text.trim();

  const readerWindow = reader?._iframeWindow?.[0];
  const range = readerWindow?.getSelection?.()?.getRangeAt(0);
  const context = extractContext(range);

  const container = doc.createElement("div");
  container.className = "anki-lex-popup label-popup";

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
          entry: { ...entry, context: context ?? "" },
          showAddButton: false,
          context: context ?? "",
        });
        stateView.setState("content", panel.element);
      }
    })
    .catch((error) => {
      Zotero.log(`Failed to fetch dictionary entry: ${error}`);
      stateView.setState("error");
    });
};

let registeredPluginId: string | null = null;

export function registerPopup(pluginId: string) {
  if (registeredPluginId) return;
  Zotero.Reader.registerEventListener("renderTextSelectionPopup", handler, pluginId);
  registeredPluginId = pluginId;
}

export function unregisterPopup() {
  if (!registeredPluginId) return;

  Zotero.Reader.unregisterEventListener("renderTextSelectionPopup", handler);

  const readerWithPluginCleanup = Zotero.Reader as typeof Zotero.Reader & {
    _unregisterEventListenerByPluginID?: (pluginId: string) => void;
  };
  readerWithPluginCleanup._unregisterEventListenerByPluginID?.(registeredPluginId);
  registeredPluginId = null;
}

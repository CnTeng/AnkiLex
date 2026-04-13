import { extractContext } from "@lib/context";
import { rpc } from "@lib/rpc";
import { DictionaryPanel } from "@lib/ui";
import { cx } from "tailwind-variants";
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

  const stateView = DictionaryPanel({
    doc,
    className: cx("flex min-h-0 flex-1 flex-col"),
  });

  container.append(stateView.element);
  append(container);

  stateView.load(rpc.dictionary.lookup({ word: expression, context: context ?? undefined }));
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

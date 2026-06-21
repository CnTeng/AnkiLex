import { extractContext } from "@common/context";
import { LocalPlatformServices } from "@services";
import { LookupPanel } from "@views/lookup-panel";
import { cx } from "tailwind-variants";
import popupStyle from "./popup.css?inline";

const handler = (event: _ZoteroTypes.Reader.EventParams<"renderTextSelectionPopup">) => {
  const services = new LocalPlatformServices();
  const { reader, doc, params, append } = event;
  const popup = doc.querySelector(".selection-popup") as HTMLDivElement;
  popup.style.maxWidth = "none";

  const expression = params.annotation.text.trim();

  const readerWindow = reader?._iframeWindow?.[0];
  const selection = readerWindow?.getSelection?.();
  const range = selection?.rangeCount ? selection.getRangeAt(0) : undefined;
  const context = extractContext(range);

  const container = doc.createElement("div");
  container.className = "onedict-popup label-popup";

  const style = doc.createElement("style");
  style.textContent = popupStyle;
  container.append(style);

  const stateView = new LookupPanel({
    container,
    className: cx("flex min-h-0 flex-1 flex-col"),
    ankiService: services.anki,
    configService: services.config.dictionary,
    dictionaryService: services.dictionary,
  });

  append(container);

  stateView.load(services.dictionary.lookup(expression, context ?? undefined), {
    word: expression,
    context: context ?? undefined,
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

import { dictionary } from "@lib/dictionary";
import { registerPopup, unregisterPopup } from "./popup";

Object.defineProperty(globalThis, "document", {
  configurable: true,
  get: () => Zotero.getMainWindow().document,
});

export function install() {}

export function uninstall() {
  unregisterPopup();
}

export async function startup(
  params: { id: string; version: string; rootURI: string },
  _reason: number,
) {
  dictionary.registerAll();
  registerPopup(params.id);
}

export function shutdown() {
  unregisterPopup();
}

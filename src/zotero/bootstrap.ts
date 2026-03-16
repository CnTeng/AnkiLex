import { dictionary } from "@lib/dictionary";
import { registerPlugin, unregisterPlugin } from "./event";

Object.defineProperty(globalThis, "document", {
  configurable: true,
  get: () => Zotero.getMainWindow().document,
});

export function install() {}

export function uninstall() {
  unregisterPlugin();
}

export async function startup(
  params: { id: string; version: string; rootURI: string },
  _reason: number,
) {
  dictionary.registerAll();
  registerPlugin(params.id);
}

export function shutdown() {
  unregisterPlugin();
}

import { dictionary } from "@lib/dictionary";
import { registerReaderInitializer } from "./event";

Object.defineProperty(globalThis, "document", {
  configurable: true,
  get: () => Zotero.getMainWindow().document,
});

function log(msg: string) {
  Zotero.log(`Anki Lex: ${msg}`);
}

export function install() {
  log("Installed 2.0");
}

export async function startup(
  _params: { id: string; version: string; rootURI: string },
  _reason: number,
) {
  log("Starting 2.0");

  dictionary.registerAll();
  registerReaderInitializer();
}

export function onMainWindowLoad(win: Window) {
  log("Main window loaded 2.0");
}

export function onMainWindowUnload(win: Window) {
  log("Main window unloaded 2.0");
}

export function shutdown() {
  log("Shutting down 2.0");
}

export function uninstall() {
  log("Uninstalled 2.0");
}

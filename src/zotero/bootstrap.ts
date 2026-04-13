import { registerPopup, unregisterPopup } from "./popup";
import { mountPrefs, registerPrefs, unregisterPrefs } from "./prefs";

Object.defineProperty(globalThis, "document", {
  configurable: true,
  get: () => Zotero.getMainWindow().document,
});

type ZoteroWithAnkiLex = typeof Zotero & {
  AnkiLex?: {
    mountPrefs: (doc: Document) => void;
  };
};

const zoteroWithAnkiLex = Zotero as ZoteroWithAnkiLex;

function registerGlobals(): void {
  zoteroWithAnkiLex.AnkiLex = { mountPrefs };
}

function unregisterGlobals(): void {
  delete zoteroWithAnkiLex.AnkiLex;
}

export function install() {}

export function uninstall() {
  unregisterPopup();
  unregisterPrefs();
  unregisterGlobals();
}

export async function startup(
  params: { id: string; version: string; rootURI: string },
  _reason: number,
) {
  await Zotero.initializationPromise;

  registerGlobals();
  registerPopup(params.id);
  await registerPrefs(params.id).catch((error) => {
    Zotero.logError(error);
    Zotero.log(`Failed to register AnkiLex preferences pane: ${String(error)}`);
  });
}

export async function onMainWindowLoad(params: {
  id: string;
  version: string;
  rootURI: string;
  window: Window;
}) {
  await Zotero.initializationPromise;
  registerGlobals();

  await registerPrefs(params.id).catch((error) => {
    Zotero.logError(error);
    Zotero.log(`Failed to register AnkiLex preferences pane on window load: ${String(error)}`);
  });
}

export function shutdown() {
  unregisterPopup();
  unregisterPrefs();
  unregisterGlobals();
}

import { OptionsPage } from "@ui/options";
import { LocalPlatformServices } from "@services";

let registeredPaneId: string | null = null;

export function mountPrefs(doc: Document) {
  const root = doc.getElementById("ankilex-prefpane-main");
  if (!root) return;

  const services = new LocalPlatformServices();

  const view = doc.defaultView as Window & { __ankiLexPrefsPage__?: OptionsPage | null };
  view.__ankiLexPrefsPage__?.dispose();
  void OptionsPage.create({
    doc,
    root,
    configService: services.config,
    dictionaryService: services.dictionary,
    ankiService: services.anki,
  }).then((page) => {
    view.__ankiLexPrefsPage__ = page;
  });
}

export async function registerPrefs(pluginId: string) {
  if (registeredPaneId) return;
  registeredPaneId = await Zotero.PreferencePanes.register({
    pluginID: pluginId,
    id: "ankilex-prefpane",
    label: "AnkiLex",
    image: "assets/icons/icon48.png",
    src: "prefs/prefs.xhtml",
    stylesheets: ["prefs/prefs.css"],
  });
}

export function unregisterPrefs() {
  if (!registeredPaneId) return;
  Zotero.PreferencePanes.unregister(registeredPaneId);
  registeredPaneId = null;
}

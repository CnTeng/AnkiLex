import { LocalPlatformServices } from "@services";
import { OptionsPage } from "@views/options";

let registeredPaneId: string | null = null;

export function mountPrefs(doc: Document) {
  const root = doc.getElementById("onedict-prefpane-main");
  if (!root) return;

  const services = new LocalPlatformServices();

  const view = doc.defaultView as Window & { __oneDictPrefsPage__?: OptionsPage | null };
  view.__oneDictPrefsPage__?.dispose();
  view.__oneDictPrefsPage__ = new OptionsPage({
    container: root,
    configService: services.config,
    dictionaryService: services.dictionary,
    ankiService: services.anki,
  });
}

export async function registerPrefs(pluginId: string) {
  if (registeredPaneId) return;
  registeredPaneId = await Zotero.PreferencePanes.register({
    pluginID: pluginId,
    id: "onedict-prefpane",
    label: "One dictionary",
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

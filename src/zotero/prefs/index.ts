import { SettingsView } from "@lib/ui";

let registeredPaneId: string | null = null;

export function mountPrefs(doc: Document) {
  const root = doc.getElementById("ankilex-prefpane-main");
  if (!root) return;
  root.replaceChildren(SettingsView({ doc }));
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

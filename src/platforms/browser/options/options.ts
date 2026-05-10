import { BrowserPlatformServices } from "@services";
import { OptionsPage } from "@views/options";

const root = document.createElement("div");
root.className = "min-h-screen";

document.body.append(root);

const services = new BrowserPlatformServices();
const page = new OptionsPage({
  container: root,
  configService: services.config,
  dictionaryService: services.dictionary,
  ankiService: services.anki,
});

window.addEventListener("pagehide", () => page.dispose(), { once: true });

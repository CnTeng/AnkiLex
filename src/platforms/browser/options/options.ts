import { OptionsPage } from "@views/options";
import { BrowserPlatformServices } from "@services";
import { cn } from "tailwind-variants";

const root = document.createElement("div");
root.className = cn(
  "border-border bg-background mx-auto my-10 max-w-4xl overflow-hidden rounded-xl border shadow-lg",
) as string;

document.body.append(root);

const services = new BrowserPlatformServices();
void OptionsPage.create({
  container: root,
  configService: services.config,
  dictionaryService: services.dictionary,
  ankiService: services.anki,
}).then((page) => {
  window.addEventListener("pagehide", () => page.dispose(), { once: true });
});

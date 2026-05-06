import { OptionsPage } from "@ui/options";
import { BrowserPlatformServices } from "@services";
import { cn } from "tailwind-variants";

const root = document.createElement("div");
root.className = cn(
  "bg-base-100 border-base-300 mx-auto min-h-screen w-full max-w-5xl overflow-hidden shadow-none sm:my-4 sm:min-h-0 sm:rounded-xl sm:border sm:shadow-sm lg:my-8",
) as string;

document.body.append(root);

const services = new BrowserPlatformServices();
void OptionsPage.create({
  root,
  configService: services.config,
  dictionaryService: services.dictionary,
  ankiService: services.anki,
});

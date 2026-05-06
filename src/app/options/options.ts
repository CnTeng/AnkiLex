import { OptionsPage } from "@ui/options";
import { createChromePlatformServices } from "@services";
import { cn } from "tailwind-variants";

const root = document.createElement("div");
root.className = cn(
  "bg-base-100 border-base-300 mx-auto min-h-screen w-full max-w-5xl overflow-hidden shadow-none sm:my-4 sm:min-h-0 sm:rounded-xl sm:border sm:shadow-sm lg:my-8",
) as string;

document.body.append(root);

void OptionsPage.create({ root, services: createChromePlatformServices() });

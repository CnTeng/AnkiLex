import { SettingsView } from "@lib/view/settings";
import { cn } from "tailwind-variants";

const root = document.createElement("div");
root.className = cn(
  "border-border bg-background mx-auto my-10 max-w-4xl overflow-hidden rounded-xl border shadow-xl",
) as string;

root.append(SettingsView());
document.body.append(root);

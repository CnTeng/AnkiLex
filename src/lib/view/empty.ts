import { Icon } from "@lib/components";
import { SearchX } from "lucide";
import { cx } from "tailwind-variants";

export function EmptyView({
  doc = document,
  message = "Looking up...",
}: {
  doc?: Document;
  message?: string;
}): HTMLDivElement {
  const container = doc.createElement("div");
  container.className = cx("flex flex-col items-center justify-center gap-3 py-8") ?? "";

  const spinner = Icon({
    doc: doc,
    iconNode: SearchX,
  });

  const text = doc.createElement("p");
  text.className = cx("text-foreground text-sm") ?? "";
  text.textContent = message;

  container.append(spinner, text);
  return container;
}

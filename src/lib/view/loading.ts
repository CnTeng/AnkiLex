import { Icon } from "@lib/components";
import { LoaderCircle } from "lucide";
import { cx } from "tailwind-variants";

export function LoadingView({
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
    iconNode: LoaderCircle,
    customAttrs: {
      class: "animate-spin",
    },
  });

  const text = doc.createElement("p");
  text.className = cx("text-foreground animate-pulse text-sm") ?? "";
  text.textContent = message;

  container.append(spinner, text);
  return container;
}

import { Icon } from "@lib/components";
import { TriangleAlert } from "lucide";
import { cx } from "tailwind-variants";

export function ErrorView({
  doc = document,
  message = "Something went wrong",
}: {
  doc?: Document;
  message?: string;
}): HTMLDivElement {
  const container = doc.createElement("div");
  container.className = cx("flex flex-col items-center justify-center gap-3 py-8") ?? "";

  const icon = Icon({
    doc: doc,
    iconNode: TriangleAlert,
    customAttrs: {
      class: "text-destructive",
    },
  });

  const text = doc.createElement("p");
  text.className = cx("text-destructive text-sm") ?? "";
  text.textContent = message;

  container.append(icon, text);
  return container;
}

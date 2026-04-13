import { Icon } from "@lib/ui/components";
import { LoaderCircle, SearchX, TriangleAlert } from "lucide";
import { cn } from "tailwind-variants";

const CONTAINER_CLASS = cn("flex flex-col items-center justify-center gap-3 py-8") as string;

export function LoadingState({
  doc = document,
  message = "Looking up...",
}: {
  doc?: Document;
  message?: string;
}): HTMLDivElement {
  const container = doc.createElement("div");
  container.className = CONTAINER_CLASS;

  const icon = Icon({
    doc,
    iconNode: LoaderCircle,
    customAttrs: { class: "animate-spin" },
  });

  const text = doc.createElement("p");
  text.className = cn("text-foreground animate-pulse text-sm") as string;
  text.textContent = message;

  container.append(icon, text);
  return container;
}

export function EmptyState({
  doc = document,
  message = "Looking up...",
}: {
  doc?: Document;
  message?: string;
}): HTMLDivElement {
  const container = doc.createElement("div");
  container.className = CONTAINER_CLASS;

  const icon = Icon({ doc, iconNode: SearchX });

  const text = doc.createElement("p");
  text.className = cn("text-foreground text-sm") as string;
  text.textContent = message;

  container.append(icon, text);
  return container;
}

export function ErrorState({
  doc = document,
  message = "Something went wrong",
}: {
  doc?: Document;
  message?: string;
}): HTMLDivElement {
  const container = doc.createElement("div");
  container.className = CONTAINER_CLASS;

  const icon = Icon({
    doc,
    iconNode: TriangleAlert,
    customAttrs: { class: "text-destructive" },
  });

  const text = doc.createElement("p");
  text.className = cn("text-destructive text-sm") as string;
  text.textContent = message;

  container.append(icon, text);
  return container;
}

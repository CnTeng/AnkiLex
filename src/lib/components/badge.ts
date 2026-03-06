import { cn } from "tailwind-variants";

const BADGE_CLASS = cn(
  "bg-secondary text-secondary-foreground inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap",
) as string;

export interface BadgeProps {
  doc?: Document;
  label?: string;
}

export function Badge({ doc = document, label }: BadgeProps): HTMLSpanElement {
  const span = doc.createElement("span");
  span.className = BADGE_CLASS;
  if (label) span.textContent = label;
  return span;
}

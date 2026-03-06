import { tv, type VariantProps } from "tailwind-variants";

export const buttonVariants = tv({
  base: "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors outline-none select-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  variants: {
    variant: {
      ghost: "hover:bg-muted hover:text-foreground",
      outline:
        "border-input bg-background text-muted-foreground hover:bg-muted hover:text-foreground border",
      primary: "bg-blue-600 text-white shadow-sm hover:bg-blue-700",
      "destructive-ghost": "text-destructive hover:bg-destructive/10",
    },
    size: {
      default: "h-10 px-4 py-2",
      icon: "size-8",
      "icon-xs": "size-6 rounded-[min(var(--radius-md),10px)] [&_svg:not([class*='size-'])]:size-3",
    },
  },
  defaultVariants: {
    variant: "ghost",
    size: "icon",
  },
});

interface ButtonProps extends VariantProps<typeof buttonVariants> {
  doc?: Document;
  title?: string;
  label?: string;
  icon?: SVGElement;
  onClick?: (e: MouseEvent) => void;
}

export function Button({
  doc = document,
  title,
  label,
  icon,
  onClick,
  ...variants
}: ButtonProps): HTMLButtonElement {
  const btn = doc.createElement("button");
  btn.className = buttonVariants(variants);
  btn.type = "button";
  if (title) btn.title = title;

  if (icon) {
    const iconWrapper = doc.createElement("span");
    iconWrapper.append(icon);
    btn.append(iconWrapper);
  }

  if (label) {
    const labelSpan = doc.createElement("span");
    labelSpan.textContent = label;
    btn.append(labelSpan);
  }

  if (onClick) {
    btn.addEventListener("click", onClick);
  }

  return btn;
}

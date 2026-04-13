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
  onClick?: (e: MouseEvent) => void | Promise<void>;
  loading?: boolean;
  disabled?: boolean;
}

export function Button({
  doc = document,
  title,
  label,
  icon,
  onClick,
  loading = false,
  disabled = false,
  ...variants
}: ButtonProps): HTMLButtonElement {
  const btn = doc.createElement("button");
  btn.className = buttonVariants(variants);
  btn.type = "button";
  if (title) btn.title = title;
  if (disabled || loading) btn.disabled = true;

  const content = doc.createElement("div");
  content.className = "flex items-center justify-center gap-2";

  if (loading) {
    const spinner = doc.createElement("span");
    spinner.className =
      "h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent";
    content.append(spinner);
  } else if (icon) {
    const iconWrapper = doc.createElement("span");
    iconWrapper.append(icon);
    content.append(iconWrapper);
  }

  if (label) {
    const labelSpan = doc.createElement("span");
    labelSpan.textContent = label;
    content.append(labelSpan);
  }

  btn.append(content);

  if (onClick && !loading && !disabled) {
    btn.addEventListener("click", (e) => {
      const result = onClick(e);
      if (result instanceof Promise) {
        btn.disabled = true;
        btn.classList.add("opacity-50");
        void result.finally(() => {
          btn.disabled = false;
          btn.classList.remove("opacity-50");
        });
      }
    });
  }

  return btn;
}

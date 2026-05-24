import { tv } from "tailwind-variants";

export const buttonStyles = tv({
  base: "inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-[background-color,border-color,color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-55",
  variants: {
    variant: {
      outline:
        "border-input bg-background text-muted-foreground hover:bg-muted/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring focus-visible:ring-1",
      ghost:
        "text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-ring border-transparent bg-transparent focus-visible:ring-1",
    },
    size: {
      default: "",
      iconSm: "h-8 min-h-8 w-8 rounded-full p-0",
      iconXs: "h-6 min-h-6 w-6 rounded-full p-0",
    },
  },
  defaultVariants: {
    variant: "outline",
    size: "default",
  },
});

const previousDisabledState = new WeakMap<HTMLButtonElement, boolean>();

type ButtonOptions = {
  doc?: Document;
  title?: string;
  className?: string;
  variant?: "outline" | "ghost";
  size?: "default" | "iconSm" | "iconXs";
};

export function createButton({
  doc = document,
  title,
  className,
  variant,
  size,
}: ButtonOptions = {}) {
  const button = doc.createElement("button");
  button.type = "button";
  if (title) button.title = title;
  button.className = buttonStyles({ variant, size, className });
  return button;
}

export function setButtonLoading(button: HTMLButtonElement, loading: boolean) {
  const existingSpinner = button.querySelector("[data-role='spinner']");

  if (loading) {
    if (!previousDisabledState.has(button)) previousDisabledState.set(button, button.disabled);
    button.disabled = true;
    button.classList.add("relative", "text-transparent");

    if (existingSpinner) return;

    const spinner = button.ownerDocument.createElement("span");
    spinner.dataset.role = "spinner";
    spinner.className =
      "pointer-events-none absolute inset-0 m-auto h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent";
    button.append(spinner);
    return;
  }

  button.disabled = previousDisabledState.get(button) ?? false;
  previousDisabledState.delete(button);
  button.classList.remove("relative", "text-transparent");
  existingSpinner?.remove();
}

import { cn, tv, type VariantProps } from "tailwind-variants";

export const inputVariants = tv({
  base: "border-adwaita-light-4 text-adwaita-dark-4 placeholder:text-adwaita-light-5 focus-visible:ring-adwaita-blue-3 dark:border-adwaita-dark-2 dark:bg-adwaita-dark-3 dark:text-adwaita-light-1 dark:placeholder:text-adwaita-dark-1 dark:focus-visible:ring-offset-adwaita-dark-3 flex h-9 w-full rounded-md border bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-white focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
  variants: {
    variant: {
      default: "",
      error: "border-adwaita-red-3 focus-visible:ring-adwaita-red-3",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface InputProps extends VariantProps<typeof inputVariants> {
  type?: string;
  placeholder?: string;
  value?: string;
  className?: string;
  onChange?: (value: string) => void;
  onKeyDown?: (event: KeyboardEvent) => void;
  disabled?: boolean;
}

export const Input = (props: InputProps): HTMLInputElement => {
  const input = document.createElement("input");
  input.type = props.type || "text";

  input.className = cn(inputVariants({ variant: props.variant }), props.className) || "";

  if (props.placeholder) input.placeholder = props.placeholder;
  if (props.value) input.value = props.value;
  if (props.disabled) input.disabled = true;

  if (props.onChange) {
    const handler = props.onChange;
    input.addEventListener("input", (e) => handler((e.target as HTMLInputElement).value));
  }

  if (props.onKeyDown) {
    input.addEventListener("keydown", props.onKeyDown);
  }

  return input;
};

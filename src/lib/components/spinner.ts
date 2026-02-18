import { cn, tv, type VariantProps } from "tailwind-variants";

export const spinnerVariants = tv({
  base: "text-adwaita-dark-3 dark:text-adwaita-light-3 inline-block animate-spin rounded-full border-solid border-current border-e-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]",
  variants: {
    size: {
      sm: "h-4 w-4 border-2",
      md: "h-6 w-6 border-[3px]",
      lg: "h-8 w-8 border-[3px]",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export interface SpinnerProps extends VariantProps<typeof spinnerVariants> {
  className?: string;
}

export const Spinner = (props: SpinnerProps): HTMLDivElement => {
  const div = document.createElement("div");

  div.className = cn(spinnerVariants({ size: props.size }), props.className) || "";

  div.setAttribute("role", "status");

  const span = document.createElement("span");
  span.className =
    "!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]";
  span.textContent = "Loading...";

  div.appendChild(span);

  return div;
};

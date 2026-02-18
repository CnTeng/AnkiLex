import { tv, type VariantProps } from "tailwind-variants";

export const cardVariants = tv({
  slots: {
    root: "text-card-foreground group/card flex flex-col gap-4 overflow-hidden rounded-xl py-4 text-sm",
    content: "px-4",
  },

  variants: {
    variant: {
      default: {
        root: "bg-card ring-foreground/10 ring-1",
      },
      ghost: {
        root: "bg-transparent ring-0",
      },
    },
  },

  defaultVariants: {
    variant: "default",
  },
});

export interface CardProps extends VariantProps<typeof cardVariants> {
  className?: string;
  children?: Node | Node[];
}

export function Card({ className, children, ...variants }: CardProps): HTMLDivElement {
  const { root } = cardVariants(variants);

  const div = document.createElement("div");
  div.className = root({ className: className });
  div.replaceChildren(...(children ? (Array.isArray(children) ? children : [children]) : []));

  return div;
}

export function CardContent({ className, children, ...variants }: CardProps): HTMLDivElement {
  const { content } = cardVariants(variants);

  const div = document.createElement("div");
  div.className = content({ className: className });
  div.replaceChildren(...(children ? (Array.isArray(children) ? children : [children]) : []));

  return div;
}

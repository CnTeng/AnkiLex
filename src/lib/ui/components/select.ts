import { ChevronDown } from "lucide";
import { cn, tv } from "tailwind-variants";
import { Icon } from "./icon";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  doc?: Document;
  id?: string;
  title?: string;
  variant?: "default" | "ghost";
  wrapperClassName?: string;
  className?: string;
  chevronClassName?: string;
  options?: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
}

const selectStyles = tv({
  base: "text-foreground placeholder:text-muted-foreground flex w-full appearance-none transition-all outline-none disabled:cursor-not-allowed disabled:opacity-50",
  variants: {
    variant: {
      default:
        "border-input bg-background focus-visible:ring-ring h-10 rounded-md border px-3 py-2 pr-10 text-sm focus-visible:border-transparent focus-visible:ring-2 focus-visible:outline-none",
      ghost:
        "hover:text-foreground h-8 min-w-0 cursor-pointer rounded-full border-none border-transparent bg-transparent py-1 pr-8 pl-3 text-xs font-medium shadow-none ring-0 hover:border-transparent hover:ring-0 focus:border-transparent focus:ring-0 focus-visible:border-transparent focus-visible:ring-0",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const CHEVRON_CLASS = cn(
  "text-muted-foreground pointer-events-none absolute inset-y-0 right-3 flex items-center",
) as string;

export function Select({
  doc = document,
  id,
  title,
  variant,
  wrapperClassName,
  className,
  chevronClassName,
  options = [],
  value,
  onChange,
}: SelectProps): SelectElement {
  const wrapper = doc.createElement("div") as SelectElement;
  wrapper.className = cn("relative w-full", wrapperClassName) as string;

  const select = doc.createElement("select");
  select.className = cn(selectStyles({ variant }), className) as string;
  select.style.setProperty("-moz-appearance", "none");
  select.style.setProperty("background-image", "none");
  select.style.color = "var(--foreground)";
  select.style.backgroundColor = variant === "ghost" ? "transparent" : "var(--background)";
  select.style.colorScheme = "light dark";

  if (id) select.id = id;
  if (title) select.title = title;

  function setOptions(opts: SelectOption[]) {
    const selectedValue = select.value || value;
    select.replaceChildren();
    for (const opt of opts) {
      const option = doc.createElement("option");
      option.className = "bg-background text-foreground";
      option.value = opt.value;
      option.textContent = opt.label;
      option.style.backgroundColor = "var(--background)";
      option.style.color = "var(--foreground)";
      if (opt.value === selectedValue) option.selected = true;
      select.append(option);
    }
    if (!selectedValue) return;
    if (opts.some((opt) => opt.value === selectedValue)) select.value = selectedValue;
  }

  setOptions(options);

  if (onChange) {
    const handler = onChange;
    select.addEventListener("change", (e) => handler((e.target as HTMLSelectElement).value));
  }

  const chevron = Icon({
    doc,
    iconNode: ChevronDown,
    customAttrs: {
      width: 16,
      height: 16,
    },
  });
  const chevronWrapper = doc.createElement("span");
  chevronWrapper.className = cn(CHEVRON_CLASS, chevronClassName) as string;
  chevronWrapper.append(chevron);

  wrapper.append(select, chevronWrapper);
  wrapper.select = select;
  wrapper.setOptions = setOptions;

  return wrapper;
}

export interface SelectElement extends HTMLDivElement {
  select: HTMLSelectElement;
  setOptions: (options: SelectOption[]) => void;
}

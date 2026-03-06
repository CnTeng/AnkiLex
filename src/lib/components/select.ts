import { ChevronDown, createElement } from "lucide";
import { cn } from "tailwind-variants";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  doc?: Document;
  id?: string;
  className?: string;
  options?: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
}

const SELECT_CLASS = cn(
  "border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring flex h-10 w-full appearance-none items-center justify-between rounded-md border px-3 py-2 pr-10 text-sm transition-all focus:border-transparent focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
) as string;

const CHEVRON_CLASS = cn(
  "text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2",
) as string;

export function Select({
  doc = document,
  id,
  className,
  options = [],
  value,
  onChange,
}: SelectProps): SelectElement {
  const wrapper = doc.createElement("div") as SelectElement;
  wrapper.className = cn("relative w-full") as string;

  const select = doc.createElement("select");
  select.className = SELECT_CLASS;

  if (id) select.id = id;
  if (className) select.classList.add(...className.split(" "));

  for (const opt of options) {
    const option = doc.createElement("option");
    option.value = opt.value;
    option.textContent = opt.label;
    if (opt.value === value) option.selected = true;
    select.append(option);
  }

  if (value !== undefined) select.value = value;

  if (onChange) {
    const handler = onChange;
    select.addEventListener("change", (e) => handler((e.target as HTMLSelectElement).value));
  }

  const chevron = createElement(ChevronDown, {
    width: 16,
    height: 16,
  }) as unknown as Element;
  const chevronWrapper = doc.createElement("span");
  chevronWrapper.className = CHEVRON_CLASS;
  chevronWrapper.append(chevron);

  wrapper.append(select, chevronWrapper);
  wrapper.select = select;

  return wrapper;
}

export interface SelectElement extends HTMLDivElement {
  select: HTMLSelectElement;
}

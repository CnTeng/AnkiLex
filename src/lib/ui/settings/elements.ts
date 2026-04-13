import { Button, Icon, type SelectElement } from "@lib/ui/components";
import { RotateCcw, Save } from "lucide";
import { cn } from "tailwind-variants";
import type { SelectOption, StatusLevel } from "./types";

export interface SettingsStatusElement {
  element: Element;
  show: (message: string, level: StatusLevel) => void;
}

export function createSectionHeading(
  doc: Document,
  iconNode: Parameters<typeof Icon>[0]["iconNode"],
  title: string,
) {
  const heading = doc.createElement("h2");
  heading.className = cn(
    "border-primary/10 text-info mb-6 flex items-center gap-3 border-b-2 pb-2 text-lg font-semibold",
  ) as string;
  heading.append(
    Icon({ doc, iconNode, customAttrs: { width: 20, height: 20 } }),
    doc.createTextNode(title),
  );
  return heading;
}

export function createFormField(
  doc: Document,
  label: string,
  opts?: {
    htmlFor?: string;
    help?: string;
    children?: HTMLElement | HTMLElement[];
    layout?: "stacked" | "inline";
  },
) {
  const wrapper = doc.createElement("div");
  wrapper.className = cn(
    opts?.layout === "inline"
      ? "mb-6 min-w-0 gap-2 md:grid md:grid-cols-[minmax(120px,220px)_minmax(0,1fr)] md:items-start md:gap-x-4"
      : "mb-6",
  ) as string;

  const labelEl = doc.createElement("label");
  labelEl.className = cn(
    opts?.layout === "inline"
      ? "text-foreground min-w-0 pt-2 text-sm font-medium wrap-break-word"
      : "text-foreground mb-2 block text-sm font-medium",
  ) as string;
  labelEl.textContent = label;
  if (opts?.htmlFor) labelEl.htmlFor = opts.htmlFor;
  wrapper.append(labelEl);

  const content = doc.createElement("div");
  content.className = cn("w-full min-w-0") as string;

  if (opts?.children) {
    const children = Array.isArray(opts.children) ? opts.children : [opts.children];
    content.append(...children);
  }

  if (opts?.help) {
    const help = doc.createElement("p");
    help.className = cn("text-muted-foreground mt-1.5 text-xs") as string;
    help.textContent = opts.help;
    content.append(help);
  }

  wrapper.append(content);

  return wrapper;
}

export function setSelectOptions(
  doc: Document,
  selectEl: SelectElement,
  options: SelectOption[],
  value: string,
) {
  selectEl.select.replaceChildren(
    ...options.map((option) => {
      const opt = doc.createElement("option");
      opt.value = option.value;
      opt.textContent = option.label;
      return opt;
    }),
  );
  selectEl.select.value = options.some((option) => option.value === value)
    ? value
    : (options[0]?.value ?? "");
}

export function createStatus(doc: Document): SettingsStatusElement {
  const colors: Record<StatusLevel, string> = {
    success: "text-green-600",
    error: "text-red-600",
    info: "text-blue-600",
  };
  let hideTimer: ReturnType<typeof setTimeout> | null = null;

  const element = doc.createElement("div");
  element.className = cn(
    "text-muted-foreground translate-y-2 text-sm font-medium opacity-0 transition-all",
  ) as string;

  return {
    element,
    show: (message, level) => {
      element.textContent = message;
      element.classList.remove(...Object.values(colors), "opacity-0", "translate-y-2");
      element.classList.add(colors[level], "opacity-100", "translate-y-0");

      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        element.classList.remove("opacity-100", "translate-y-0");
        element.classList.add("opacity-0", "translate-y-2");
      }, 3000);
    },
  };
}

export function createActions(
  doc: Document,
  status: SettingsStatusElement,
  actions: { save: () => Promise<void>; reset: () => Promise<void> },
) {
  const footer = doc.createElement("div");
  footer.className = cn(
    "border-border bg-muted flex items-center justify-between border-t px-8 py-6",
  ) as string;

  const resetButton = Button({
    doc,
    variant: "destructive-ghost",
    size: "default",
    label: "Reset Defaults",
    title: "Reset all settings to default",
    icon: Icon({
      doc,
      iconNode: RotateCcw,
      customAttrs: { width: 16, height: 16 },
    }),
    onClick: () => actions.reset(),
  });
  const saveButton = Button({
    doc,
    variant: "primary",
    size: "default",
    label: "Save Changes",
    icon: Icon({ doc, iconNode: Save, customAttrs: { width: 16, height: 16 } }),
    onClick: () => actions.save(),
  });

  const footerRight = doc.createElement("div");
  footerRight.className = cn("flex items-center gap-4") as string;
  footerRight.append(status.element, saveButton);
  footer.append(resetButton, footerRight);
  return footer;
}

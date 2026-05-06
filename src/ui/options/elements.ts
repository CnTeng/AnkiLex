import type { SelectOption } from "@lib/model";
import { Icon } from "@ui/components";
import { cn } from "tailwind-variants";

export type StatusLevel = "success" | "error" | "info" | "warning";

export interface OptionsStatusElement {
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
    "mb-6 flex items-center gap-3 border-b pb-2 text-lg font-semibold",
  ) as string;
  heading.append(
    Icon({ doc, iconNode, customAttrs: { width: 20, height: 20 } }),
    doc.createTextNode(title),
  );
  return heading;
}

export function createSectionTitle(doc: Document, title: string) {
  const heading = doc.createElement("h2");
  heading.className = cn("mb-5 text-lg font-semibold") as string;
  heading.textContent = title;
  return heading;
}

export function createSectionIntro(doc: Document, title: string, description: string) {
  const wrapper = doc.createElement("div");
  wrapper.className = cn("mb-5 space-y-1") as string;
  const heading = createSectionTitle(doc, title);
  heading.classList.remove("mb-5");

  const text = doc.createElement("p");
  text.className = cn("text-sm") as string;
  text.textContent = description;
  wrapper.append(heading, text);
  return wrapper;
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
      ? "mb-5 min-w-0 gap-2 md:grid md:grid-cols-[minmax(140px,220px)_minmax(0,1fr)] md:items-start md:gap-x-4"
      : "mb-6",
  ) as string;

  const labelEl = doc.createElement("label");
  labelEl.className = cn(
    opts?.layout === "inline" ? "min-w-0 pt-2 text-sm wrap-break-word" : "mb-2 block text-sm",
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
    help.className = cn("mt-1 text-xs") as string;
    help.textContent = opts.help;
    content.append(help);
  }

  wrapper.append(content);

  return wrapper;
}

export function setSelectOptions(
  doc: Document,
  selectEl: HTMLSelectElement,
  options: SelectOption[],
  value: string,
) {
  selectEl.replaceChildren(
    ...options.map((option) => {
      const opt = doc.createElement("option");
      opt.value = option.value;
      opt.textContent = option.label;
      return opt;
    }),
  );
  selectEl.value = options.some((option) => option.value === value)
    ? value
    : (options[0]?.value ?? "");
}

export function createStatus(doc: Document): OptionsStatusElement {
  const colors: Record<StatusLevel, string[]> = {
    success: ["alert-success"],
    error: ["alert-error"],
    info: ["alert-info"],
    warning: ["alert-warning"],
  };
  let hideTimer: ReturnType<typeof setTimeout> | null = null;

  const element = doc.createElement("div");
  element.className = cn(
    "alert hidden translate-y-2 text-sm opacity-0 transition-all sm:max-w-md",
  ) as string;

  return {
    element,
    show: (message, level) => {
      element.textContent = message;
      element.classList.remove(
        ...Object.values(colors).flat(),
        "hidden",
        "opacity-0",
        "translate-y-2",
      );
      element.classList.add(...colors[level], "opacity-100", "translate-y-0");

      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        element.classList.remove("opacity-100", "translate-y-0");
        element.classList.add("opacity-0", "translate-y-2");
        setTimeout(() => element.classList.add("hidden"), 150);
      }, 3000);
    },
  };
}

export function createStatusMessage(doc: Document, level: StatusLevel, message: string) {
  const element = doc.createElement("div");
  element.className = ["alert text-sm transition-all", `alert-${level}`].join(" ");
  element.textContent = message;
  return element;
}

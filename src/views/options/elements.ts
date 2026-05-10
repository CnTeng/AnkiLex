import type { SelectOption } from "@common/types";
import { cn } from "tailwind-variants";

export type StatusLevel = "success" | "error" | "info" | "warning";

const alertVariantClasses: Record<StatusLevel, string> = {
  success:
    "border-[color:color-mix(in_srgb,var(--success)_45%,var(--border))] bg-[color:color-mix(in_srgb,var(--success)_12%,var(--background))] text-[var(--success)]",
  error:
    "border-[color:color-mix(in_srgb,var(--destructive)_45%,var(--border))] bg-[color:color-mix(in_srgb,var(--destructive)_12%,var(--background))] text-[var(--destructive)]",
  info: "border-[color:color-mix(in_srgb,var(--info)_45%,var(--border))] bg-[color:color-mix(in_srgb,var(--info)_12%,var(--background))] text-[var(--info)]",
  warning:
    "border-[color:color-mix(in_srgb,var(--warning)_45%,var(--border))] bg-[color:color-mix(in_srgb,var(--warning)_12%,var(--background))] text-[var(--warning)]",
};

type SettingsRowOptions = {
  htmlFor?: string;
  description?: string;
  children: HTMLElement | HTMLElement[];
};

export class SectionIntro {
  readonly element: HTMLDivElement;

  constructor(
    private readonly doc: Document,
    private readonly title: string,
    private readonly description: string,
  ) {
    this.element = this.doc.createElement("div");
    this.render();
  }

  private render() {
    const heading = this.doc.createElement("h2");
    heading.className = cn("text-foreground text-xl font-semibold") as string;
    heading.textContent = this.title;

    const text = this.doc.createElement("p");
    text.className = cn("text-muted-foreground text-sm") as string;
    text.textContent = this.description;

    this.element.className = cn("space-y-1") as string;
    this.element.append(heading, text);
  }
}

export class SettingsGroup {
  readonly element: HTMLDivElement;

  constructor(
    private readonly doc: Document,
    rows: HTMLElement[],
  ) {
    this.element = this.doc.createElement("div");
    this.element.className = cn("border-border divide-border divide-y rounded-md border") as string;
    this.element.append(...rows);
  }
}

export class SettingsRow {
  readonly element: HTMLDivElement;

  constructor(
    private readonly doc: Document,
    private readonly label: string,
    private readonly options: SettingsRowOptions,
  ) {
    this.element = this.doc.createElement("div");
    this.render();
  }

  private render() {
    this.element.className = cn(
      "grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(220px,320px)] sm:items-center",
    ) as string;
    this.element.append(this.renderText(), this.renderContent());
  }

  private renderText() {
    const wrapper = this.doc.createElement("div");
    wrapper.className = cn("min-w-0 space-y-1") as string;

    const labelElement = this.doc.createElement("label");
    labelElement.className = cn("text-foreground text-sm font-medium") as string;
    labelElement.textContent = this.label;
    if (this.options.htmlFor) labelElement.htmlFor = this.options.htmlFor;

    wrapper.append(labelElement);

    if (this.options.description) {
      const description = this.doc.createElement("p");
      description.className = cn("text-muted-foreground text-sm") as string;
      description.textContent = this.options.description;
      wrapper.append(description);
    }

    return wrapper;
  }

  private renderContent() {
    const content = this.doc.createElement("div");
    content.className = cn("min-w-0") as string;
    content.append(
      ...(Array.isArray(this.options.children) ? this.options.children : [this.options.children]),
    );
    return content;
  }
}

export class SelectOptions {
  constructor(
    private readonly doc: Document,
    private readonly selectElement: HTMLSelectElement,
    private readonly options: SelectOption[],
    private readonly value: string,
  ) {}

  render() {
    this.selectElement.replaceChildren(
      ...this.options.map((option) => {
        const element = this.doc.createElement("option");
        element.value = option.value;
        element.textContent = option.label;
        return element;
      }),
    );
    this.selectElement.value = this.options.some((option) => option.value === this.value)
      ? this.value
      : (this.options[0]?.value ?? "");
  }
}

export class OptionsStatus {
  readonly element: HTMLDivElement;

  private hideTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly doc: Document) {
    this.element = this.doc.createElement("div");
    this.element.className = cn(
      "text-muted-foreground hidden translate-y-2 text-sm font-medium opacity-0 transition-all sm:max-w-md",
    ) as string;
  }

  show(message: string, level: StatusLevel) {
    this.element.textContent = message;
    this.element.classList.remove(
      ...Object.values(alertVariantClasses).flatMap((value) => value.split(" ")),
      "hidden",
      "opacity-0",
      "translate-y-2",
    );
    this.element.classList.add(
      ...alertVariantClasses[level].split(" "),
      "opacity-100",
      "translate-y-0",
    );

    if (this.hideTimer) clearTimeout(this.hideTimer);
    this.hideTimer = setTimeout(() => {
      this.element.classList.remove("opacity-100", "translate-y-0");
      this.element.classList.add("opacity-0", "translate-y-2");
      setTimeout(() => this.element.classList.add("hidden"), 150);
    }, 3000);
  }
}

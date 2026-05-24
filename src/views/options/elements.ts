import type { SelectOption } from "@common/model";
import { Icon, type IconOptions } from "@views/components";
import { cn } from "tailwind-variants";

export type StatusLevel = "success" | "error" | "info" | "warning";

const alertBaseClass = cn("rounded-[14px] border px-3 py-2 text-sm transition-all") as string;

const alertVariantClasses: Record<StatusLevel, string> = {
  success:
    "border-[color:color-mix(in_srgb,var(--success)_45%,var(--border))] bg-[color:color-mix(in_srgb,var(--success)_12%,var(--background))] text-[var(--success)]",
  error:
    "border-[color:color-mix(in_srgb,var(--destructive)_45%,var(--border))] bg-[color:color-mix(in_srgb,var(--destructive)_12%,var(--background))] text-[var(--destructive)]",
  info: "border-[color:color-mix(in_srgb,var(--info)_45%,var(--border))] bg-[color:color-mix(in_srgb,var(--info)_12%,var(--background))] text-[var(--info)]",
  warning:
    "border-[color:color-mix(in_srgb,var(--warning)_45%,var(--border))] bg-[color:color-mix(in_srgb,var(--warning)_12%,var(--background))] text-[var(--warning)]",
};

type FormFieldOptions = {
  htmlFor?: string;
  help?: string;
  children?: HTMLElement | HTMLElement[];
  layout?: "stacked" | "inline";
};

export class SectionHeading {
  readonly element: HTMLHeadingElement;

  constructor(
    private readonly doc: Document,
    private readonly iconNode: IconOptions["iconNode"],
    private readonly title: string,
  ) {
    this.element = this.doc.createElement("h2");
    this.render();
  }

  private render() {
    this.element.className = cn(
      "border-primary/10 text-info mb-6 flex items-center gap-3 border-b-2 pb-2 text-lg font-semibold",
    ) as string;
    this.element.append(
      new Icon({ doc: this.doc, iconNode: this.iconNode, customAttrs: { width: 20, height: 20 } })
        .element,
      this.doc.createTextNode(this.title),
    );
  }
}

export class SectionTitle {
  readonly element: HTMLHeadingElement;

  constructor(
    private readonly doc: Document,
    private readonly title: string,
  ) {
    this.element = this.doc.createElement("h2");
    this.render();
  }

  private render() {
    this.element.className = cn("text-foreground text-xl font-semibold") as string;
    this.element.textContent = this.title;
  }
}

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
    const heading = new SectionTitle(this.doc, this.title).element;
    heading.classList.remove("mb-5");

    const text = this.doc.createElement("p");
    text.className = cn("text-muted-foreground text-sm") as string;
    text.textContent = this.description;

    this.element.className = cn("mb-5 space-y-1") as string;
    this.element.append(heading, text);
  }
}

export class FormField {
  readonly element: HTMLDivElement;

  constructor(
    private readonly doc: Document,
    private readonly label: string,
    private readonly options: FormFieldOptions = {},
  ) {
    this.element = this.doc.createElement("div");
    this.render();
  }

  private render() {
    this.element.className = cn(
      this.options.layout === "inline"
        ? "mb-6 min-w-0 gap-2 md:grid md:grid-cols-[minmax(120px,220px)_minmax(0,1fr)] md:items-start md:gap-x-4"
        : "mb-6",
    ) as string;

    this.element.append(this.renderLabel(), this.renderContent());
  }

  private renderLabel() {
    const labelElement = this.doc.createElement("label");
    labelElement.className = cn(
      this.options.layout === "inline"
        ? "text-foreground min-w-0 pt-2 text-sm font-medium wrap-break-word"
        : "text-foreground mb-2 block text-sm font-medium",
    ) as string;
    labelElement.textContent = this.label;
    if (this.options.htmlFor) labelElement.htmlFor = this.options.htmlFor;
    return labelElement;
  }

  private renderContent() {
    const content = this.doc.createElement("div");
    content.className = cn("w-full min-w-0") as string;

    if (this.options.children) {
      const children = Array.isArray(this.options.children)
        ? this.options.children
        : [this.options.children];
      content.append(...children);
    }

    if (this.options.help) {
      const help = this.doc.createElement("p");
      help.className = cn("text-muted-foreground mt-1.5 text-xs") as string;
      help.textContent = this.options.help;
      content.append(help);
    }

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

export class StatusMessage {
  readonly element: HTMLDivElement;

  constructor(
    private readonly doc: Document,
    private readonly level: StatusLevel,
    private readonly message: string,
  ) {
    this.element = this.doc.createElement("div");
    this.render();
  }

  private render() {
    this.element.className = cn(alertBaseClass, alertVariantClasses[this.level]) as string;
    this.element.textContent = this.message;
  }
}

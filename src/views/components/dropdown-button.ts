import { cn } from "tailwind-variants";
import { buttonStyles } from "./button";

export interface DropdownButtonOption {
  value: string;
  label: string;
}

export interface DropdownButtonOptions {
  doc?: Document;
  title?: string;
  buttonClassName?: string;
  menuClassName?: string;
  optionClassName?: string;
  onSelect?: (value: string) => void;
}

export class DropdownButton {
  readonly element: HTMLDivElement;
  readonly button: HTMLButtonElement;

  private readonly menu: HTMLDivElement;
  private readonly optionClassName?: string;
  private readonly onSelect?: (value: string) => void;

  constructor({
    doc = document,
    title,
    buttonClassName,
    menuClassName,
    optionClassName,
    onSelect,
  }: DropdownButtonOptions = {}) {
    this.optionClassName = optionClassName;
    this.onSelect = onSelect;

    this.element = doc.createElement("div");
    this.element.className = cn("relative shrink-0") as string;

    this.button = doc.createElement("button");
    this.button.type = "button";
    if (title) this.button.title = title;
    this.button.className = cn(
      buttonStyles({ variant: "ghost" }),
      "text-muted-foreground hover:text-foreground h-8 min-h-8 rounded-full px-3 py-1 text-xs font-medium",
      buttonClassName,
    ) as string;

    this.menu = doc.createElement("div");
    this.menu.className = cn(
      "border-border bg-background absolute top-full right-0 z-20 mt-2 hidden min-w-52 overflow-hidden rounded-xl border p-1 shadow-lg",
      menuClassName,
    ) as string;

    this.button.addEventListener("click", () => this.toggle());
    doc.addEventListener("mousedown", this.handleDocumentMouseDown);

    this.element.append(this.button, this.menu);
  }

  setLabel(label: string) {
    this.button.textContent = label;
  }

  setDisabled(disabled: boolean) {
    this.button.disabled = disabled;
    if (disabled) this.hide();
  }

  setOptions(options: DropdownButtonOption[], selectedValue = "") {
    this.menu.replaceChildren(
      ...options.map(({ value, label }) => {
        const option = this.button.ownerDocument.createElement("button");
        option.type = "button";
        option.className = cn(
          "hover:bg-muted text-foreground flex w-full items-center rounded-lg px-3 py-2 text-left text-sm",
          value === selectedValue ? "bg-muted font-medium" : "",
          this.optionClassName,
        ) as string;
        option.textContent = label;
        option.addEventListener("click", () => {
          this.hide();
          this.onSelect?.(value);
        });
        return option;
      }),
    );
  }

  hide() {
    this.menu.classList.add("hidden");
  }

  private toggle() {
    if (this.button.disabled) return;
    this.menu.classList.toggle("hidden");
  }

  private readonly handleDocumentMouseDown = (event: MouseEvent) => {
    if (event.composedPath().includes(this.element)) return;
    this.hide();
  };
}

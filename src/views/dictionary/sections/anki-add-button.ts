import { buttonStyles, Icon } from "@views/components";
import { Check, Plus, X } from "lucide";

type DefinitionButtonState = "idle" | "loading" | "success" | "error";

const ADD_BUTTON_STATE_CLASSES: Record<Exclude<DefinitionButtonState, "idle">, string[]> = {
  loading: ["opacity-70", "cursor-wait"],
  success: [
    "bg-[color-mix(in_srgb,var(--success)_18%,var(--background))]",
    "text-[var(--success)]",
  ],
  error: [
    "bg-[color-mix(in_srgb,var(--destructive)_18%,var(--background))]",
    "text-[var(--destructive)]",
  ],
};

export interface AnkiAddButtonOptions {
  container: HTMLElement | DocumentFragment;
  index: number;
  onAddClick?: (index?: number) => void | Promise<void>;
}

export class AnkiAddButton {
  readonly element: HTMLButtonElement;

  private readonly document: Document;
  private readonly index: number;
  private readonly onAddClick?: (index?: number) => void | Promise<void>;

  constructor({ container, index, onAddClick }: AnkiAddButtonOptions) {
    this.document = container.ownerDocument ?? document;
    this.index = index;
    this.onAddClick = onAddClick;

    this.element = this.document.createElement("button");
    this.element.type = "button";
    this.element.title = "Add to Anki";
    this.element.className = `${buttonStyles({ variant: "ghost", size: "iconSm" })} text-foreground/60`;
    this.element.setAttribute("data-def-index", this.index.toString());

    this.setState("idle");
    this.registerListeners();
    container.append(this.element);
  }

  private registerListeners() {
    this.element.addEventListener("click", async (event) => {
      event.stopPropagation();
      if (!this.onAddClick) return;
      if (this.element.dataset.state === "loading") return;

      try {
        this.setState("loading");
        await this.onAddClick(this.index);
        this.setState("success");
      } catch {
        this.setState("error");
      }
    });
  }

  private setContent(node: Node) {
    this.element.replaceChildren(node);
  }

  private setState(state: DefinitionButtonState) {
    this.element.dataset.state = state;
    this.element.classList.remove(...ADD_BUTTON_STATE_CLASSES.loading);
    this.element.classList.remove(...ADD_BUTTON_STATE_CLASSES.success);
    this.element.classList.remove(...ADD_BUTTON_STATE_CLASSES.error);
    this.element.disabled = state === "loading";

    if (state === "loading") {
      const spinner = this.document.createElement("span");
      spinner.className =
        "h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent";
      this.element.classList.add(...ADD_BUTTON_STATE_CLASSES.loading);
      this.setContent(spinner);
      return;
    }

    if (state === "success") {
      this.element.classList.add(...ADD_BUTTON_STATE_CLASSES.success);
      this.setContent(new Icon({ doc: this.document, iconNode: Check }).element);
      return;
    }

    if (state === "error") {
      this.element.classList.add(...ADD_BUTTON_STATE_CLASSES.error);
      this.setContent(new Icon({ doc: this.document, iconNode: X }).element);
      return;
    }

    this.setContent(new Icon({ doc: this.document, iconNode: Plus }).element);
  }
}

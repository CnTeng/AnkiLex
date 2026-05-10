import {
  autoUpdate,
  computePosition,
  type Middleware,
  type Placement,
  type ReferenceElement,
} from "@floating-ui/dom";

type PopoverOptions = {
  icon: SVGElement;
  placement: Placement;
  middleware?: Middleware[];
};

export class Popover {
  readonly button: HTMLButtonElement;
  readonly popover: HTMLDivElement;

  private readonly placement: Placement;
  private readonly middleware?: Middleware[];
  private reference: ReferenceElement | null = null;
  private cleanup: (() => void) | null = null;

  constructor({ icon, placement, middleware }: PopoverOptions) {
    this.placement = placement;
    this.middleware = middleware;

    this.button = document.createElement("button");
    this.button.type = "button";
    this.button.append(icon);
    this.button.style.position = "absolute";
    this.button.style.display = "none";
    this.button.style.zIndex = "2147483647";

    this.popover = document.createElement("div");
    this.popover.style.position = "absolute";
    this.popover.popover = "auto";
    this.popover.style.zIndex = "2147483647";

    this.button.popoverTargetElement = this.popover;
    this.button.popoverTargetAction = "toggle";

    this.registerListeners();
  }

  show(newReference: ReferenceElement) {
    this.reference = newReference;
    this.updateButtonPosition();
    this.button.style.display = "";
  }

  hide() {
    this.button.style.display = "none";
  }

  destroy() {
    this.stopAutoUpdate();
    document.removeEventListener("mousedown", this.handleOutsideClick);
    this.button.remove();
    this.popover.remove();
  }

  private registerListeners() {
    document.addEventListener("mousedown", this.handleOutsideClick);
    this.button.addEventListener("click", () => this.hide());
    this.popover.addEventListener("beforetoggle", (e) => {
      if (e.newState !== "open") return;
      this.updatePopoverPosition();
      this.startAutoUpdate();
    });
    this.popover.addEventListener("toggle", (e) => {
      if (e.newState === "closed") {
        this.stopAutoUpdate();
        this.setChildrenVisibility(false);
        return;
      }

      requestAnimationFrame(() => {
        this.setChildrenVisibility(true);
      });
    });
  }

  private readonly handleOutsideClick = (event: MouseEvent) => {
    const path = event.composedPath();
    if (path.includes(this.button) || path.includes(this.popover)) return;
    this.hide();
  };

  private setPosition(element: HTMLElement, x: number, y: number) {
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
  }

  private updatePosition(element: HTMLElement) {
    if (!this.reference) return;

    computePosition(this.reference, element, {
      placement: this.placement,
      middleware: this.middleware,
      strategy: "absolute",
    }).then(({ x, y }) => {
      this.setPosition(element, x, y);
    });
  }

  private setChildrenVisibility(visible: boolean) {
    for (const child of this.popover.children) {
      (child as HTMLElement).style.visibility = visible ? "" : "hidden";
    }
  }

  private updateButtonPosition() {
    this.updatePosition(this.button);
  }

  private updatePopoverPosition() {
    this.updatePosition(this.popover);
  }

  private startAutoUpdate() {
    if (!this.reference) return;

    this.cleanup?.();
    this.cleanup = autoUpdate(this.reference, this.popover, () => this.updatePopoverPosition());
  }

  private stopAutoUpdate() {
    this.cleanup?.();
    this.cleanup = null;
  }
}

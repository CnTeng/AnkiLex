import { createButton, Icon, setButtonLoading } from "@views/components";
import { RotateCcw } from "lucide";
import { cn } from "tailwind-variants";
import { OptionsStatus } from "./elements";

export class OptionsFooter {
  readonly element: HTMLDivElement;
  readonly status: OptionsStatus;

  private readonly document: Document;
  private readonly resetButton: HTMLButtonElement;
  private resetAction: (() => Promise<void>) | null = null;

  constructor(container: HTMLElement | DocumentFragment) {
    this.document = container.ownerDocument ?? document;
    this.status = new OptionsStatus(this.document);

    this.element = this.document.createElement("div");
    this.element.className = cn(
      "border-border bg-muted/40 mt-8 flex flex-col gap-3 border-t px-8 py-6 sm:flex-row sm:items-center sm:justify-between",
    ) as string;

    this.resetButton = this.renderResetButton();
    this.element.append(this.resetButton, this.renderMeta());
    this.registerListeners();
    container.append(this.element);
  }

  setResetAction(action: () => Promise<void>) {
    this.resetAction = action;
  }

  private renderResetButton() {
    const button = createButton({
      doc: this.document,
      title: "Reset all options to default",
      variant: "ghost",
      className: "text-destructive w-full sm:w-auto",
    });
    button.append(
      new Icon({
        doc: this.document,
        iconNode: RotateCcw,
        customAttrs: { width: 16, height: 16 },
      }).element,
      this.document.createTextNode("Reset Defaults"),
    );
    return button;
  }

  private renderMeta() {
    const hint = this.document.createElement("p");
    hint.className = cn("text-muted-foreground text-xs") as string;
    hint.textContent =
      "Changes are saved automatically. Use reset only if you want to restore all defaults.";

    const footerRight = this.document.createElement("div");
    footerRight.className = cn(
      "flex w-full flex-col items-start gap-2 sm:w-auto sm:items-end",
    ) as string;
    footerRight.append(hint, this.status.element);
    return footerRight;
  }

  private registerListeners() {
    this.resetButton.addEventListener("click", () => {
      if (!this.resetAction) return;

      setButtonLoading(this.resetButton, true);
      void this.resetAction().finally(() => {
        setButtonLoading(this.resetButton, false);
      });
    });
  }
}

import { Icon } from "@ui/components";
import { RotateCcw } from "lucide";
import { cn } from "tailwind-variants";
import { createStatus, type OptionsStatusElement } from "./elements";

export class OptionsFooter {
  readonly element: HTMLDivElement;
  readonly status: OptionsStatusElement;

  private readonly resetButton: HTMLButtonElement;
  private resetAction: (() => Promise<void>) | null = null;

  constructor(doc: Document) {
    this.status = createStatus(doc);

    this.element = doc.createElement("div");
    this.element.className = cn(
      "flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between",
    ) as string;

    const hint = doc.createElement("p");
    hint.className = cn("text-xs") as string;
    hint.textContent =
      "Changes are saved automatically. Use reset only if you want to restore all defaults.";

    this.resetButton = doc.createElement("button");
    this.resetButton.type = "button";
    this.resetButton.title = "Reset all options to default";
    this.resetButton.className = "btn btn-ghost w-full sm:w-auto";
    this.resetButton.append(
      Icon({
        doc,
        iconNode: RotateCcw,
        customAttrs: { width: 16, height: 16 },
      }),
      doc.createTextNode("Reset Defaults"),
    );
    this.resetButton.addEventListener("click", () => {
      if (!this.resetAction) return;

      this.resetButton.disabled = true;
      this.resetButton.classList.add("loading");
      void this.resetAction().finally(() => {
        this.resetButton.disabled = false;
        this.resetButton.classList.remove("loading");
      });
    });

    const footerRight = doc.createElement("div");
    footerRight.className = cn(
      "flex w-full flex-col items-start gap-2 sm:w-auto sm:items-end",
    ) as string;
    footerRight.append(hint, this.status.element);
    this.element.append(this.resetButton, footerRight);
  }

  setResetAction(action: () => Promise<void>) {
    this.resetAction = action;
  }
}

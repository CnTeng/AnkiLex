import { Icon } from "@ui/components";
import { LoaderCircle, SearchX, TriangleAlert } from "lucide";
import { cn } from "tailwind-variants";

const CONTAINER_CLASS = cn("flex flex-col items-center justify-center gap-3 py-8") as string;

export class DictionaryStatusView {
  readonly element: HTMLDivElement;

  private readonly doc: Document;
  private readonly text: HTMLParagraphElement;

  constructor(doc: Document) {
    this.doc = doc;
    this.element = this.doc.createElement("div");
    this.text = this.doc.createElement("p");
    this.showLoading();
  }

  showLoading(message = "Looking up...") {
    this.element.className = `${CONTAINER_CLASS} text-base-content/80`;
    const icon = Icon({
      doc: this.doc,
      iconNode: LoaderCircle,
      customAttrs: { class: "animate-spin" },
    });
    this.text.className = cn("text-base-content animate-pulse text-sm") as string;
    this.text.textContent = message;
    this.element.replaceChildren(icon, this.text);
  }

  showEmpty(message = "Looking up...") {
    this.element.className = `${CONTAINER_CLASS} text-base-content/80`;
    const icon = Icon({ doc: this.doc, iconNode: SearchX });
    this.element.replaceChildren(icon, this.text);
    this.text.className = cn("text-base-content text-sm") as string;
    this.text.textContent = message;
  }

  showError(message = "Something went wrong") {
    this.element.className = `${CONTAINER_CLASS} rounded-lg border border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300`;
    const icon = Icon({ doc: this.doc, iconNode: TriangleAlert });
    this.element.replaceChildren(icon, this.text);
    this.text.className = cn("text-sm") as string;
    this.text.textContent = message;
  }
}

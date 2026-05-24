import { tokenize } from "@common/tokenizer";
import { cn } from "tailwind-variants";

const MARKDOWN_TAGS = {
  bold: "strong",
  italic: "em",
  strike: "s",
  code: "code",
} as const;

export interface DictionaryContextSectionOptions {
  container: HTMLElement | DocumentFragment;
  context?: string;
}

export class DictionaryContextSection {
  readonly element: HTMLDivElement;
  readonly isEmpty: boolean;

  private readonly document: Document;
  private readonly context?: string;

  constructor({ container, context }: DictionaryContextSectionOptions) {
    this.document = container.ownerDocument ?? document;
    this.context = context;

    this.element = this.document.createElement("div");
    this.element.className = cn("mt-3.5 text-left") as string;
    this.isEmpty = !this.context || this.context.trim() === "";

    if (this.isEmpty) return;
    this.render();
    container.append(this.element);
  }

  private render() {
    const label = this.document.createElement("div");
    label.className = cn(
      "text-muted-foreground mb-1.5 ml-1 text-[0.68rem] font-bold tracking-[0.14em] uppercase",
    ) as string;
    label.textContent = "Context";

    const contentElement = this.document.createElement("div");
    contentElement.className = cn(
      "bg-secondary/35 text-foreground border-border/35 rounded-xl border px-4 py-3 text-[0.9rem] leading-relaxed italic shadow-sm",
    ) as string;
    contentElement.append(this.renderMarkdown(this.context!.trim()));

    this.element.append(label, contentElement);
  }

  private renderMarkdown(text: string) {
    const fragment = this.document.createDocumentFragment();

    text.split("\n").forEach((line, lineIndex) => {
      if (lineIndex > 0) fragment.append(this.document.createElement("br"));
      tokenize(line).forEach((token) => {
        this.appendMarkdownToken(fragment, token);
      });
    });

    return fragment;
  }

  private appendMarkdownToken(
    fragment: DocumentFragment,
    token: ReturnType<typeof tokenize>[number],
  ) {
    if (token.type === "marker") return;

    if (token.type === "text") {
      fragment.append(this.document.createTextNode(token.value));
      return;
    }

    const element = this.document.createElement(MARKDOWN_TAGS[token.type] ?? "span");
    if (token.type === "code") {
      element.className = cn(
        "bg-muted text-foreground rounded-sm px-1 font-mono text-[0.85em]",
      ) as string;
    }
    element.textContent = token.value;
    fragment.append(element);
  }
}

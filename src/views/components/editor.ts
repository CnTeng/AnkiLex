import { type TokenType, tokenize } from "@common/tokenizer";
import { cn } from "tailwind-variants";

type EditorOptions = {
  ownerDocument?: Document;
  className?: string;
  placeholder?: string;
};

type LineDiff = {
  start: number;
  deleteCount: number;
  insert: string[];
};

const TOKEN_STYLES: Record<TokenType, string> = {
  text: "",
  marker: cn("text-foreground/50") as string,
  code: cn("bg-muted text-foreground rounded-sm px-1") as string,
  bold: cn("underline decoration-2 underline-offset-2") as string,
  italic: cn("underline decoration-dotted underline-offset-2") as string,
  strike: cn("line-through") as string,
};

export class Editor {
  readonly element: HTMLDivElement;

  private readonly ownerDocument: Document;
  private readonly placeholder: string;
  private readonly highlight: HTMLDivElement;
  private readonly placeholderEl: HTMLDivElement;
  private readonly textarea: HTMLTextAreaElement;
  private readonly lineCache: { text: string; el: HTMLElement }[] = [];

  constructor({ ownerDocument = document, className, placeholder = "" }: EditorOptions) {
    this.ownerDocument = ownerDocument;
    this.placeholder = placeholder;

    this.element = this.ownerDocument.createElement("div");
    this.element.className = cn("relative overflow-hidden", className) as string;

    this.highlight = this.ownerDocument.createElement("div");
    this.highlight.className = cn(
      "tab-2 pointer-events-none absolute inset-0 overflow-auto p-3 font-mono text-sm leading-6",
    ) as string;
    this.highlight.setAttribute("aria-hidden", "true");

    this.placeholderEl = this.ownerDocument.createElement("div");
    this.placeholderEl.className = cn(
      "tab-2 text-foreground/45 pointer-events-none absolute inset-0 p-3 font-mono text-sm leading-6",
    ) as string;

    this.textarea = this.ownerDocument.createElement("textarea");
    this.textarea.className = cn(
      "tab-2 absolute inset-0 h-full w-full resize-none border-0 bg-transparent p-3 font-mono text-sm leading-6 text-transparent outline-none",
    ) as string;
    this.textarea.spellcheck = false;
    this.textarea.autocomplete = "off";
    this.textarea.style.webkitTextFillColor = "transparent";

    this.element.append(this.highlight, this.placeholderEl, this.textarea);

    this.registerListeners();
    this.render();
  }

  setContent(value: string) {
    this.textarea.value = value ?? "";
    this.render();
  }

  getContent() {
    return this.textarea.value;
  }

  private registerListeners() {
    this.textarea.addEventListener("input", () => this.render());
    this.textarea.addEventListener("scroll", () => this.syncScroll());
  }

  private syncScroll() {
    this.highlight.scrollTop = this.textarea.scrollTop;
    this.highlight.scrollLeft = this.textarea.scrollLeft;
  }

  private renderPlaceholder() {
    this.placeholderEl.textContent = this.textarea.value ? "" : this.placeholder;
  }

  private deleteLines(start: number, deleteCount: number) {
    for (let i = 0; i < deleteCount; i++) {
      this.highlight.removeChild(this.lineCache[start].el);
      this.lineCache.splice(start, 1);
    }
  }

  private insertLines(start: number, lines: string[]) {
    lines.forEach((text, i) => {
      const el = createLineElement(this.ownerDocument, text);
      this.highlight.insertBefore(el, this.highlight.children[start + i] ?? null);
      this.lineCache.splice(start + i, 0, { text, el });
    });
  }

  private render() {
    const newLines = this.textarea.value.split("\n");
    const oldLines = this.lineCache.map((line) => line.text);
    const diff = diffLines(oldLines, newLines);

    this.deleteLines(diff.start, diff.deleteCount);
    this.insertLines(diff.start, diff.insert);
    this.renderPlaceholder();
    this.syncScroll();
  }
}

function diffLines(oldLines: string[], newLines: string[]): LineDiff {
  let start = 0;
  let endOld = oldLines.length - 1;
  let endNew = newLines.length - 1;

  while (start <= endOld && start <= endNew && oldLines[start] === newLines[start]) start++;
  while (endOld >= start && endNew >= start && oldLines[endOld] === newLines[endNew]) {
    endOld--;
    endNew--;
  }

  return {
    start,
    deleteCount: endOld - start + 1,
    insert: newLines.slice(start, endNew + 1),
  };
}

function createLineElement(ownerDocument: Document, line: string) {
  const div = ownerDocument.createElement("div");
  div.className = cn("wrap-break-word whitespace-pre-wrap") as string;

  for (const token of tokenize(line)) {
    const span = ownerDocument.createElement("span");
    span.className = TOKEN_STYLES[token.type];
    span.textContent = token.value;
    div.append(span);
  }

  return div;
}

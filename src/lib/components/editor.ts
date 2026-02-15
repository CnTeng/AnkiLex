import { cn } from "tailwind-variants";
import { type TokenType, tokenize } from "./tokenizer";

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
  marker: cn("text-muted-foreground") as string,
  code: cn("bg-muted text-foreground rounded-sm px-1") as string,
  bold: cn("underline decoration-2 underline-offset-2") as string,
  italic: cn("underline decoration-dotted underline-offset-2") as string,
  strike: cn("line-through") as string,
};

export function Editor({ ownerDocument = document, className, placeholder = "" }: EditorOptions) {
  const lineCache: { text: string; el: HTMLElement }[] = [];

  const root = ownerDocument.createElement("div");
  root.className = cn("relative overflow-hidden", className) as string;

  const highlight = ownerDocument.createElement("div");
  highlight.className = cn(
    "tab-2 pointer-events-none absolute inset-0 overflow-auto p-3 font-mono text-sm leading-6",
  ) as string;
  highlight.setAttribute("aria-hidden", "true");

  const placeholderEl = ownerDocument.createElement("div");
  placeholderEl.className = cn(
    "tab-2 text-muted-foreground pointer-events-none absolute inset-0 p-3 font-mono text-sm leading-6",
  ) as string;

  const textarea = ownerDocument.createElement("textarea");
  textarea.className = cn(
    "caret-foreground tab-2 absolute inset-0 h-full w-full resize-none border-0 bg-transparent p-3 font-mono text-sm leading-6 text-transparent outline-none",
  ) as string;
  textarea.spellcheck = false;
  textarea.autocomplete = "off";
  textarea.style.webkitTextFillColor = "transparent";

  root.append(highlight, placeholderEl, textarea);

  const syncScroll = () => {
    highlight.scrollTop = textarea.scrollTop;
    highlight.scrollLeft = textarea.scrollLeft;
  };

  const render = () => {
    const newLines = textarea.value.split("\n");
    const oldLines = lineCache.map((c) => c.text);
    const diff = diffLines(oldLines, newLines);

    for (let i = 0; i < diff.deleteCount; i++) {
      highlight.removeChild(lineCache[diff.start].el);
      lineCache.splice(diff.start, 1);
    }

    diff.insert.forEach((text, i) => {
      const el = createLineElement(ownerDocument, text);
      highlight.insertBefore(el, highlight.children[diff.start + i] ?? null);
      lineCache.splice(diff.start + i, 0, { text, el });
    });

    placeholderEl.textContent = textarea.value ? "" : placeholder;
    syncScroll();
  };

  textarea.addEventListener("input", render);
  textarea.addEventListener("scroll", syncScroll);
  render();

  return {
    element: root,
    setContent(v: string) {
      textarea.value = v ?? "";
      render();
    },
    getContent: () => textarea.value,
  };
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
  div.className = cn("break-words whitespace-pre-wrap") as string;

  for (const token of tokenize(line)) {
    const span = ownerDocument.createElement("span");
    span.className = TOKEN_STYLES[token.type];
    span.textContent = token.value;
    div.append(span);
  }

  return div;
}

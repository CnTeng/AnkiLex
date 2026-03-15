import { tokenize } from "./tokenizer";

type MarkdownOptions = {
  ownerDocument?: Document;
  text: string;
  codeClassName?: string;
};

const MARKDOWN_TAGS: Partial<Record<ReturnType<typeof tokenize>[number]["type"], string>> = {
  bold: "strong",
  italic: "em",
  strike: "s",
  code: "code",
};

export function Markdown({
  ownerDocument = document,
  text,
  codeClassName = "bg-muted text-foreground rounded-sm px-1 font-mono text-[0.85em]",
}: MarkdownOptions): DocumentFragment {
  const fragment = ownerDocument.createDocumentFragment();
  const lines = text.split("\n");

  lines.forEach((line, lineIndex) => {
    if (lineIndex > 0) fragment.append(ownerDocument.createElement("br"));
    for (const token of tokenize(line)) {
      if (token.type === "marker") continue;

      if (token.type === "text") {
        fragment.append(ownerDocument.createTextNode(token.value));
        continue;
      }

      const el = ownerDocument.createElement(MARKDOWN_TAGS[token.type] ?? "span");
      if (token.type === "code") {
        el.className = codeClassName;
      }
      el.textContent = token.value;
      fragment.append(el);
    }
  });

  return fragment;
}

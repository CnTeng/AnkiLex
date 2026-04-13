export type TokenType = "text" | "code" | "bold" | "italic" | "strike" | "marker";

export type Token = {
  type: TokenType;
  value: string;
};

type Pattern = {
  marker: string;
  type: TokenType;
  allowNested: boolean;
};

const PATTERNS: Pattern[] = [
  { marker: "`", type: "code", allowNested: false },
  { marker: "**", type: "bold", allowNested: true },
  { marker: "~~", type: "strike", allowNested: true },
  { marker: "*", type: "italic", allowNested: true },
];

/**
 * Tokenizes markdown-like inline syntax into a flat list of tokens.
 * Supports nested formatting (e.g., **bold *italic* text**).
 */
export function tokenize(text: string, parentType?: TokenType): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  let textBuffer = "";

  const flushTextBuffer = () => {
    if (textBuffer) {
      tokens.push({ type: parentType ?? "text", value: textBuffer });
      textBuffer = "";
    }
  };

  while (i < text.length) {
    let matched = false;

    for (const { marker, type, allowNested } of PATTERNS) {
      if (!text.startsWith(marker, i)) continue;

      const contentStart = i + marker.length;
      const closingIndex = text.indexOf(marker, contentStart);
      if (closingIndex === -1) continue;

      flushTextBuffer();

      const content = text.slice(contentStart, closingIndex);

      tokens.push({ type: "marker", value: marker });
      if (allowNested) {
        tokens.push(...tokenize(content, type));
      } else {
        tokens.push({ type, value: content });
      }
      tokens.push({ type: "marker", value: marker });

      i = closingIndex + marker.length;
      matched = true;
      break;
    }

    if (!matched) {
      textBuffer += text[i++];
    }
  }

  flushTextBuffer();
  return tokens;
}

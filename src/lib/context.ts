import { eld } from "eld/medium";
import { getSentenceBoundaries } from "sentencex-ts";

const blockSelector =
  "p, div, li, blockquote, h1, h2, h3, h4, h5, h6, section, article, main, header, footer";

const textLayerSelector = ".textLayer, .page, .pdfViewer, [data-page-number], iframe, frame";

type Mapping = { text: string; s: number; e: number };

function closestFromStart(range: Range, selector: string): Element | null {
  const node = range.startContainer;
  const el = node.nodeType === 1 ? (node as Element) : node.parentElement;

  return el?.closest(selector) ?? null;
}

function getDom(node: Node): { doc: Document; view: Window } | null {
  const doc = node.ownerDocument;
  const view = doc?.defaultView;

  if (!doc || !view) return null;
  return { doc, view };
}

function findTextEdge(node: Node, side: "start" | "end"): Text | null {
  const dom = getDom(node);
  if (!dom) return null;

  const walker = dom.doc.createTreeWalker(node, dom.view.NodeFilter.SHOW_TEXT);

  if (side === "start") {
    return walker.nextNode() as Text | null;
  }

  let current = walker.nextNode() as Text | null;
  if (!current) return null;

  for (let next = walker.nextNode() as Text | null; next; next = walker.nextNode() as Text | null) {
    current = next;
  }

  return current;
}

function resolveBaseNode(node: Node, offset: number, side: "start" | "end"): Node {
  if (node.nodeType !== 1) return node;

  const el = node as Element;

  if (side === "start") {
    return el.childNodes[offset] ?? node;
  }

  return el.childNodes[Math.max(offset - 1, 0)] ?? node;
}

function resolveTextEdge(node: Node, offset: number, side: "start" | "end"): [Text, number] | null {
  const dom = getDom(node);
  if (!dom) return null;

  if (node.nodeType === dom.view.Node.TEXT_NODE) {
    return [node as Text, offset];
  }

  const base = resolveBaseNode(node, offset, side);
  const text =
    base.nodeType === dom.view.Node.TEXT_NODE ? (base as Text) : findTextEdge(base, side);

  if (!text) return null;

  const pos = side === "start" ? 0 : (text.nodeValue?.length ?? 0);
  return [text, pos];
}

function normalizeRange(range: Range): Range | null {
  const start = resolveTextEdge(range.startContainer, range.startOffset, "start");
  if (!start) return null;

  const end = resolveTextEdge(range.endContainer, range.endOffset, "end");
  if (!end) return null;

  const r = range.cloneRange();
  r.setStart(start[0], start[1]);
  r.setEnd(end[0], end[1]);

  return r;
}

function mapRange(root: Node, range: Range): Mapping | null {
  if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) {
    return null;
  }

  const doc = root.ownerDocument;
  if (!doc) return null;

  const full = doc.createRange();
  full.selectNodeContents(root);

  const text = full.toString();
  if (!text) return null;

  const part = doc.createRange();
  part.selectNodeContents(root);

  part.setEnd(range.startContainer, range.startOffset);
  const s = part.toString().length;

  part.setEnd(range.endContainer, range.endOffset);
  const e = part.toString().length;

  if (s > e) return null;

  return { text, s, e };
}

function mapText(root: Node, range: Range): Mapping | null {
  if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) {
    return null;
  }

  const doc = root.ownerDocument;
  const view = doc?.defaultView;

  if (!doc || !view) return null;

  const it = doc.createNodeIterator(root, view.NodeFilter.SHOW_TEXT);

  let text = "";
  let pos = 0;

  let s: number | undefined;
  let e: number | undefined;

  for (let n = it.nextNode(); n; n = it.nextNode()) {
    const v = n.nodeValue ?? "";

    if (n === range.startContainer) s = pos + range.startOffset;
    if (n === range.endContainer) e = pos + range.endOffset;

    text += v;
    pos += v.length;
  }

  if (s === undefined || e === undefined || s > e) {
    return null;
  }

  return { text, s, e };
}

function findSentence(text: string, s: number, e: number, lang: string): Mapping | null {
  const bounds = getSentenceBoundaries(lang, text);

  for (const b of bounds) {
    let start = b.startIndex;
    let end = b.endIndex;

    const seg = text.slice(start, end);

    start += seg.match(/^\s*/)?.[0].length ?? 0;
    end -= seg.match(/\s*$/)?.[0].length ?? 0;

    if (end <= start) continue;

    if (start <= s && end >= e) {
      return {
        text: text.slice(start, end),
        s: s - start,
        e: e - start,
      };
    }
  }

  return null;
}

function boldRange(text: string, s: number, e: number): string | null {
  const sel = text.slice(s, e);
  if (!sel.trim()) return null;

  const start = s + (sel.length - sel.trimStart().length);
  const end = e - (sel.length - sel.trimEnd().length);
  if (start >= end) return null;

  return `${text.slice(0, start)}**${text.slice(start, end)}**${text.slice(end)}`;
}

function cleanText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function detectLanguage(text: string): string | null {
  const r = eld.detect(text);
  if (!r.isReliable()) return null;
  return r.language;
}

export function extractContext(range: Range | undefined, lang?: string): string | null {
  if (!range || range.collapsed) {
    return null;
  }

  let mapped: Mapping | null;

  if (closestFromStart(range, textLayerSelector)) {
    const normalized = normalizeRange(range);
    if (!normalized) return null;

    const root = closestFromStart(normalized, blockSelector) || normalized.commonAncestorContainer;
    mapped = mapText(root, normalized);
  } else {
    const root = closestFromStart(range, blockSelector) || range.commonAncestorContainer;
    mapped = mapRange(root, range);
  }

  if (!mapped) return null;

  const language = lang?.split("-")[0] || detectLanguage(mapped.text);
  if (!language) return null;

  const sentence = findSentence(mapped.text, mapped.s, mapped.e, language);
  if (!sentence) return null;

  const bold = boldRange(sentence.text, sentence.s, sentence.e);
  if (!bold) return null;

  return cleanText(bold);
}

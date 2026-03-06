function detectLocale(): string | undefined {
  return document.documentElement.lang?.split("-")[0] || navigator.language?.split("-")[0];
}

export function extractSentence(range: Range, word: string): string | null {
  const el =
    (range.startContainer.nodeType === Node.TEXT_NODE
      ? range.startContainer.parentElement
      : (range.startContainer as Element)) ?? null;

  const block = el?.closest("p, div, li, blockquote");
  if (!block) return null;

  const text = block.textContent ?? "";
  const seg = new Intl.Segmenter(detectLocale(), { granularity: "sentence" });

  const sentences =
    [...seg.segment(text)].map((s) => s.segment).find((s) => s.includes(word)) || text;

  return sentences.trim();
}

export function boldWordInSentence(sentence: string, word: string): string {
  const index = sentence.indexOf(word);
  if (index === -1) return sentence;
  return `${sentence.slice(0, index)}**${word}**${sentence.slice(index + word.length)}`;
}

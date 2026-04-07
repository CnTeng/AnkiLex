import type { Definition, DictionaryEntry, Example, Pronunciation } from "@lib/model";
import { DictionaryProvider } from "./provider";
import { registerDictionaryProvider } from "./registry";

export class ZdicDictionary extends DictionaryProvider {
  private readonly baseUrl = "https://www.zdic.net/hans";

  get id() {
    return "zdic";
  }

  get name() {
    return "Zdic Chinese Dictionary";
  }

  get supportedLanguages() {
    return ["zh"];
  }

  async lookup(word: string): Promise<DictionaryEntry | null> {
    const url = `${this.baseUrl}/${encodeURIComponent(word)}`;
    const response = await fetch(url);
    if (!response.ok)
      throw new Error(`Failed to lookup from Zdic: HTTP error! status: ${response.status}`);

    return this.parseHtml(await response.text());
  }

  public parseDocument(doc: Document): DictionaryEntry | null {
    const titleContainer = doc.querySelector(".entry_title");
    if (!titleContainer) return null;

    const basicContainer = doc.querySelector(".jbjs");
    if (!basicContainer) return null;

    const detailedContainer = doc.querySelector(".xxjs");

    return {
      word: this.parseWord(basicContainer),
      provider: this.name,
      definitions: detailedContainer
        ? this.parseDetailedDefinitions(detailedContainer)
        : this.parseBasicDefinitions(basicContainer),
      pronunciations: this.parsePronunciations(titleContainer),
    };
  }

  private parseWord(container: Element): string {
    return container.querySelector(".orth")?.textContent?.trim() || "";
  }

  private parseBasicDefinitions(container: Element): Definition[] {
    const definitions: Definition[] = [];

    container.querySelectorAll("ol .gycd-item").forEach((defNode) => {
      const text = defNode.querySelector(".gc_sy")?.textContent?.trim() || "";
      if (!text) return;

      const examples: Example[] = [];

      defNode.querySelectorAll(".gc_lz, .gc_yy").forEach((exampleNode) => {
        const exampleText = exampleNode.textContent?.trim();
        if (!exampleText) return;
        examples.push({ text: exampleText });
      });

      definitions.push({
        partOfSpeech: "国语辞典",
        text,
        examples: examples.length > 0 ? examples : undefined,
      });
    });

    return definitions;
  }

  private parseDetailedDefinitions(content: Element): Definition[] {
    const norm = (text?: string | null) =>
      text
        ?.replace(/\s+/g, " ")
        .replace(/([，。；：！？])\s+/g, "$1")
        .trim() || "";

    const definitions: Definition[] = [];
    const curDef: Definition = { text: "" };

    const flush = () => {
      if (!curDef.text) return;
      definitions.push({ ...curDef });
      curDef.text = "";
      curDef.examples = undefined;
    };

    content.querySelectorAll("p").forEach((p) => {
      const part = p.querySelector(".xx_cx")?.textContent?.trim();
      if (part) {
        flush();
        curDef.partOfSpeech = part;
        return;
      }

      const text = norm(p.textContent);
      if (!text) return;

      if (p.querySelector(".cino")) {
        flush();
        curDef.text = text;
        return;
      }

      if (p.querySelector(".diczx1, .diczx2, .diczx3")) {
        if (!curDef.examples) curDef.examples = [];
        curDef.examples.push({ text });
      }
    });

    flush();
    return definitions;
  }

  private parsePronunciations(container: Element): Pronunciation[] {
    const norm = (text?: string | null) => text?.trim().replace(/\s+/g, " ") || "";
    const pronunciations: Pronunciation[] = [];

    container.querySelectorAll(".z_py p").forEach((row) => {
      const text = norm(row.querySelector(".z_d")?.textContent);
      if (!text) return;

      const audio = row.querySelector<HTMLElement>("[data-src-mp3]")?.dataset.srcMp3;
      pronunciations.push({
        type: "pinyin",
        text,
        audioUrl: audio ? `https:${audio}` : undefined,
      });
    });

    if (!pronunciations.length) {
      const text = norm(container.querySelector(".dicpy")?.textContent);
      if (text) pronunciations.push({ type: "pinyin", text });
    }

    return pronunciations;
  }
}

registerDictionaryProvider(new ZdicDictionary());

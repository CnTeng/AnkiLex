import type { Definition, DictionaryResult, Example, Pronunciation } from "../models";
import { DictionaryProvider } from "./base";

export class YoudaoDictionary extends DictionaryProvider {
  get id() {
    return "youdao";
  }
  get name() {
    return "Collins (via Youdao)";
  }

  async lookup(word: string): Promise<DictionaryResult> {
    const url = `https://dict.youdao.com/w/${encodeURIComponent(word)}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      const data = (await this.parseHtml(html)) as {
        definitions?: Definition[];
        pronunciations?: Pronunciation[];
        tags?: string[];
        stars?: number;
      };

      const result: DictionaryResult = {
        word,
        provider: this.name,
        definitions: data?.definitions || [],
        pronunciations: data?.pronunciations || [],
        metadata: {},
      };

      if (data?.tags && data.tags.length > 0) {
        result.metadata = { ...result.metadata, tags: data.tags };
      }

      if (data?.stars !== undefined && data.stars > 0) {
        result.metadata = { ...result.metadata, frequency: data.stars };
      }

      return result;
    } catch (e) {
      console.error("Youdao lookup failed:", e);
      return { word, provider: this.name, definitions: [], pronunciations: [] };
    }
  }

  public parseDocument(doc: Document): {
    definitions?: Definition[];
    pronunciations?: Pronunciation[];
    tags?: string[];
    stars?: number;
  } {
    const collinsContainer = doc.querySelector("#collinsResult");

    const definitions =
      this.parseCollinsDefinitions(collinsContainer) ?? this.parsePhraseDefinitions(doc);
    const { stars, tags } = this.parseStarsAndTags(collinsContainer);
    const pronunciations = this.parsePronunciations(doc);

    return {
      definitions,
      pronunciations,
      tags,
      stars,
    };
  }

  private parseCollinsDefinitions(container: Element | null): Definition[] {
    const definitions: Definition[] = [];

    if (!container) return definitions;
    const defNodes = container.querySelectorAll(".ol li");
    if (defNodes.length === 0) return definitions;

    defNodes.forEach((defNode) => {
      const transNode = defNode.querySelector(".collinsMajorTrans p");
      if (!transNode) return;

      const posNode = transNode.querySelector(".additional");
      const pos = posNode?.textContent?.trim() || "";

      let fullText = transNode.textContent?.trim() || "";
      if (pos && fullText.startsWith(pos)) {
        fullText = fullText.substring(pos.length).trim();
      }

      const exampleLis = defNode.querySelectorAll(".exampleLists");
      const examples: Example[] = [];
      exampleLis.forEach((ex) => {
        const pTags = ex.querySelectorAll("p");
        if (pTags.length >= 2) {
          const en = pTags[0].textContent?.trim();
          const cn = pTags[1].textContent?.trim();
          if (en) examples.push({ text: en, translation: cn });
        }
      });

      definitions.push({
        partOfSpeech: pos,
        text: fullText,
        examples: examples,
      });
    });

    return definitions;
  }

  private parsePhraseDefinitions(doc: Document): Definition[] {
    const definitions: Definition[] = [];

    const container = doc.querySelector("#phrsListTab .trans-container");
    if (!container) return definitions;

    container.querySelectorAll("ul li").forEach((el) => {
      const text = el.textContent?.trim() || "";
      const match = text.match(/^([a-z]+\.)\s*(.*)$/i);

      if (match) {
        definitions.push({
          partOfSpeech: match[1],
          text: match[2],
        });
      } else {
        definitions.push({ text });
      }
    });

    return definitions;
  }

  private parseStarsAndTags(container: Element | null): {
    stars: number;
    tags: string[];
  } {
    let stars = 0;
    const tags: string[] = [];

    if (!container) return { stars, tags };

    const starNode = container.querySelector("h4 .star");
    const match = starNode?.className.match(/star(\d+)/);
    if (match) stars = parseInt(match[1], 10);

    const rankNode = container.querySelector("h4 .rank");
    if (rankNode?.textContent) {
      tags.push(...rankNode.textContent.split(" ").filter(Boolean));
    }

    return { stars, tags };
  }

  private parsePronunciations(doc: Document): Pronunciation[] {
    const pronunciations: Pronunciation[] = [];

    const keyword = doc.querySelector("#phrsListTab .wordbook-js .keyword")?.textContent?.trim();
    const containers = doc.querySelectorAll(".baav .pronounce, .wordbook-js .pronounce");
    const parse = (el: Element, type: "uk" | "us") => {
      const span = el.querySelector(".phonetic");
      if (span?.textContent) {
        pronunciations.push({
          text: span.textContent.trim(),
          type,
          audioUrl: `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(keyword || "")}&type=${type === "us" ? 2 : 1}`,
        });
      }
    };

    if (containers.length >= 2) {
      parse(containers[0], "uk");
      parse(containers[1], "us");
    } else if (containers.length === 1) {
      parse(containers[0], "uk");
    }

    return pronunciations;
  }
}

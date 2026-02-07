import type { Definition, DictionaryEntry, Example, Pronunciation } from "../../model";
import { DictionaryProvider } from "./base";

export class YoudaoDictionary extends DictionaryProvider {
  get id() {
    return "youdao";
  }
  get name() {
    return "Collins (via Youdao)";
  }
  get supportedLanguages() {
    return ["en"];
  }

  async lookup(word: string): Promise<DictionaryEntry | null> {
    const url = `https://dict.youdao.com/w/${encodeURIComponent(word)}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      const entry = await this.parseHtml(html);

      return entry ? { ...entry, word } : null;
    } catch (e) {
      throw new Error(
        `Failed to fetch definition from Youdao: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  public parseDocument(doc: Document): DictionaryEntry | null {
    const container = doc.querySelector("#collinsResult");
    if (!container) return null;

    return {
      word: "",
      provider: this.name,
      definitions: this.parseCollinsDefinitions(container) ?? this.parsePhraseDefinitions(doc),
      pronunciations: this.parsePronunciations(doc),
      metadata: this.parseMetadata(container),
    };
  }

  private parseCollinsDefinitions(container: Element): Definition[] {
    const definitions: Definition[] = [];
    const defNodes = container.querySelectorAll(".ol li");

    defNodes.forEach((defNode) => {
      const transNode = defNode.querySelector(".collinsMajorTrans p");
      if (!transNode) return;

      const posNode = transNode.querySelector(".additional");
      const pos = posNode?.textContent?.trim() || "";

      let fullText = transNode.textContent?.trim() || "";
      if (pos && fullText.startsWith(pos)) {
        fullText = fullText.substring(pos.length).trim();
      }

      const examples: Example[] = [];
      const exampleLis = defNode.querySelectorAll(".exampleLists");

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

  private parseMetadata(container: Element): Record<string, unknown> {
    const metadata: Record<string, unknown> = {};

    const starNode = container.querySelector("h4 .star");
    const match = starNode?.className.match(/star(\d+)/);
    if (match) {
      metadata.frequency = parseInt(match[1], 10);
    }

    const rankNode = container.querySelector("h4 .rank");
    if (rankNode?.textContent) {
      metadata.tags = rankNode.textContent.split(" ").filter(Boolean);
    }

    return metadata;
  }
}

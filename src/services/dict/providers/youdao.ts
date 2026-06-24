import type { Definition, DictionaryEntry, Example, Pronunciation } from "@common/types";
import { DictionaryProvider } from "../provider";
import { registerDictionaryProvider } from "../registry";

const normalize = (text?: string | null) => text?.replace(/\s+/g, " ").trim() || "";

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
    let url = `https://dict.youdao.com/w/${encodeURIComponent(word)}`;

    try {
      let response = await this.fetchWithTimeout(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      let entry = await this.parseHtml(html);

      if (!entry && word !== word.toLowerCase()) {
        url = `https://dict.youdao.com/w/${encodeURIComponent(word.toLowerCase())}`;
        response = await this.fetchWithTimeout(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const lowerHtml = await response.text();
        entry = await this.parseHtml(lowerHtml);
      }

      return entry;
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
      word: this.parseWord(container),
      definitions: this.parseCollinsDefinitions(container) ?? this.parsePhraseDefinitions(doc),
      pronunciations: this.parsePronunciations(doc),
      metadata: {
        ...this.parseMetadata(container),
        providerId: this.id,
        providerName: this.name,
      },
    };
  }

  private parseWord(container: Element): string {
    const keyword = container.querySelector("h4 .title");
    return normalize(keyword?.textContent);
  }

  private parseCollinsDefinitions(container: Element): Definition[] {
    const definitions: Definition[] = [];
    const defNodes = container.querySelectorAll(".ol li");

    defNodes.forEach((defNode) => {
      const transNode = defNode.querySelector(".collinsMajorTrans p");
      if (!transNode) return;

      const posNode = transNode.querySelector(".additional");
      const pos = normalize(posNode?.textContent);

      let fullText = normalize(transNode.textContent);
      if (pos && fullText.startsWith(pos)) {
        fullText = normalize(fullText.substring(pos.length));
      }

      const examples: Example[] = [];
      const exampleLis = defNode.querySelectorAll(".exampleLists");

      exampleLis.forEach((ex) => {
        const pTags = ex.querySelectorAll("p");
        if (pTags.length >= 2) {
          const en = normalize(pTags[0].textContent);
          const cn = normalize(pTags[1].textContent);
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
      const text = normalize(el.textContent);
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

    const keyword = normalize(doc.querySelector("#phrsListTab .wordbook-js .keyword")?.textContent);
    const containers = doc.querySelectorAll(".baav .pronounce, .wordbook-js .pronounce");
    const parse = (el: Element, type: "uk" | "us") => {
      const span = el.querySelector(".phonetic");
      const text = normalize(span?.textContent);
      if (text) {
        pronunciations.push({
          text,
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
      metadata.tags = normalize(rankNode.textContent).split(" ").filter(Boolean);
    }

    return metadata;
  }
}

registerDictionaryProvider(new YoudaoDictionary());

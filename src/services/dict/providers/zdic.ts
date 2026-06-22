import type { Definition, DictionaryEntry, Example, Pronunciation } from "@common/types";
import { DictionaryProvider } from "../provider";
import { registerDictionaryProvider } from "../registry";

export class ZdicDictionary extends DictionaryProvider {
  private readonly baseUrl = "https://zdic.net/hans";

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
    const response = await this.fetchWithTimeout(url);
    if (!response.ok)
      throw new Error(`Failed to lookup from Zdic: HTTP error! status: ${response.status}`);

    return this.parseHtml(await response.text());
  }

  public parseDocument(doc: Document): DictionaryEntry | null {
    const container = doc.querySelector("#gyjs");
    if (!container) return null;

    return {
      word: this.parseWord(container),
      provider: this.name,
      definitions: this.parseDefinitions(container),
      pronunciations: this.parsePronunciations(container),
    };
  }

  private parseWord(container: Element): string {
    return container.querySelector(".gy-reading__char")?.textContent?.trim() || "";
  }

  private parseDefinitions(container: Element): Definition[] {
    const definitions: Definition[] = [];

    const normalize = (text?: string | null) =>
      text
        ?.replace(/\s+/g, " ")
        .replace(/([，。；：！？])\s+/g, "$1")
        .trim() || "";

    const parseSense = (sense: Element, partOfSpeech?: string) => {
      const text = normalize(sense.querySelector(".gy-sense__def")?.textContent);
      if (!text) return;

      const examples: Example[] = [];
      sense.querySelectorAll(".gy-sense__eg-text, .gy-sense__cit-item").forEach((exampleNode) => {
        const exampleText = normalize(exampleNode.textContent);
        if (!exampleText) return;
        examples.push({ text: exampleText });
      });

      definitions.push({
        partOfSpeech,
        text,
        examples: examples.length > 0 ? examples : undefined,
      });
    };

    container.querySelectorAll(".gy-pos").forEach((section) => {
      const partOfSpeech = normalize(section.querySelector(".gy-pos__badge")?.textContent);
      section.querySelectorAll(".gy-sense").forEach((sense) => {
        parseSense(sense, partOfSpeech || undefined);
      });
    });

    if (definitions.length > 0) return definitions;

    container.querySelectorAll(".gy-sense").forEach((sense) => {
      parseSense(sense, undefined);
    });

    return definitions;
  }

  private parsePronunciations(container: Element): Pronunciation[] {
    const pronunciations: Pronunciation[] = [];

    container.querySelectorAll(".gy-reading__py").forEach((row) => {
      const text = row.firstChild?.textContent?.trim().replace(/\s+/g, " ") || "";
      if (!text || pronunciations.some((pronunciation) => pronunciation.text === text)) return;

      const audios = row.nextElementSibling?.getAttribute("data-audio")?.split(",").filter(Boolean);

      pronunciations.push({
        type: "pinyin",
        text,
        audioUrl: audios?.length === 1 ? `https:${audios[0]}` : undefined,
      });
    });

    return pronunciations;
  }
}

registerDictionaryProvider(new ZdicDictionary());

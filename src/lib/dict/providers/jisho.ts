import type { Definition, DictionaryEntry, Pronunciation } from "@lib/model";
import { DictionaryProvider } from "../provider";
import { registerDictionaryProvider } from "../registry";

interface JishoResponse {
  data: JishoEntry[];
}

interface JishoEntry {
  slug: string;
  tags: string[];
  jlpt: string[];
  japanese: JishoJapanese[];
  senses: JishoSense[];
}

interface JishoJapanese {
  word?: string;
  reading?: string;
}

interface JishoSense {
  english_definitions: string[];
  parts_of_speech: string[];
}

function normalizeAudioUrl(url: string): string {
  return url.startsWith("//") ? `https:${url}` : url;
}

export class JishoDictionary extends DictionaryProvider {
  private readonly baseUrl = "https://jisho.org/api/v1/search/words";
  private readonly wordBaseUrl = "https://jisho.org/word";

  get id() {
    return "jisho";
  }

  get name() {
    return "Jisho Japanese Dictionary";
  }

  get supportedLanguages() {
    return ["ja"];
  }

  async lookup(word: string): Promise<DictionaryEntry | null> {
    const response = await this.fetchWithTimeout(
      `${this.baseUrl}?keyword=${encodeURIComponent(word)}`,
    );
    if (!response.ok)
      throw new Error(`Failed to lookup from Jisho: HTTP error! status: ${response.status}`);

    const json: unknown = await response.json();
    const result = this.parseResponse(json as JishoResponse);
    if (!result) return null;

    const [audioUrl] = await this.lookupAudioUrls(result.word);
    if (!audioUrl) return result;

    return {
      ...result,
      pronunciations:
        result.pronunciations.length > 0
          ? result.pronunciations.map((p, i) => (i === 0 ? { ...p, audioUrl } : p))
          : [{ type: "ja", audioUrl }],
    };
  }

  public parseDocument(): DictionaryEntry | null {
    return null;
  }

  private parseResponse(payload: JishoResponse): DictionaryEntry | null {
    const item = payload.data?.find((entry) => this.parseDefinitions(entry).length > 0);
    if (!item) return null;

    const first = item.japanese[0];
    const word = first?.word?.trim() || first?.reading?.trim() || item.slug?.trim();
    if (!word) return null;

    return {
      word,
      provider: this.name,
      definitions: this.parseDefinitions(item),
      pronunciations: this.parsePronunciations(item),
      metadata: this.parseMetadata(item),
    };
  }

  private parseDefinitions(item: JishoEntry): Definition[] {
    return (item.senses ?? []).flatMap((sense) => {
      const text = sense.english_definitions
        ?.map((d) => d.trim())
        .filter(Boolean)
        .join("; ");
      if (!text) return [];

      const partOfSpeech = sense.parts_of_speech
        ?.map((p) => p.trim())
        .filter(Boolean)
        .join(", ");

      return [{ partOfSpeech: partOfSpeech || undefined, text }];
    });
  }

  private parsePronunciations(item: JishoEntry): Pronunciation[] {
    const seen = new Set<string>();
    return (item.japanese ?? []).flatMap((entry) => {
      const text = entry.reading?.trim() || entry.word?.trim() || "";
      if (!text || seen.has(text)) return [];
      seen.add(text);
      return [{ type: "ja", text }];
    });
  }

  private async lookupAudioUrls(word: string): Promise<string[]> {
    return this.fetchWithTimeout(`${this.wordBaseUrl}/${encodeURIComponent(word)}`)
      .then((response) => (response.ok ? response.text() : ""))
      .then((html) => this.parseAudioUrls(html))
      .catch(() => []);
  }

  private parseAudioUrls(html: string): string[] {
    if (!html) return [];

    if (typeof DOMParser !== "undefined") {
      const doc = new DOMParser().parseFromString(html, "text/html");
      return this.uniqueAudioUrls(
        Array.from(doc.querySelectorAll(".concept_light-status audio source[src]")).map(
          (source) => source.getAttribute("src") || "",
        ),
      );
    }

    return this.uniqueAudioUrls(
      Array.from(html.matchAll(/<audio\b[\s\S]*?<\/audio>/gi)).flatMap(([audio]) =>
        Array.from(audio.matchAll(/<source\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)).map(
          ([, url]) => url,
        ),
      ),
    );
  }

  private uniqueAudioUrls(urls: string[]): string[] {
    return Array.from(new Set(urls.map(normalizeAudioUrl).filter(Boolean))).sort((a, b) => {
      const aIsMp3 = a.includes(".mp3");
      const bIsMp3 = b.includes(".mp3");
      return aIsMp3 === bIsMp3 ? 0 : aIsMp3 ? -1 : 1;
    });
  }

  private parseMetadata(item: JishoEntry): Record<string, unknown> | undefined {
    const metadata: Record<string, unknown> = {};
    const tags = [...(item.tags ?? []), ...(item.jlpt ?? [])].filter(Boolean);
    if (tags.length > 0) metadata.tags = tags;
    return Object.keys(metadata).length > 0 ? metadata : undefined;
  }
}

registerDictionaryProvider(new JishoDictionary());

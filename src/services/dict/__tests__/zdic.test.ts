import { describe, expect, it } from "vitest";
import { ZdicDictionary } from "../providers/zdic";

const LIVE_TEST_TIMEOUT_MS = 15000;

async function lookupLiveWord(word: string) {
  const html = await fetch(`https://zdic.net/hans/${encodeURIComponent(word)}`).then((response) =>
    response.text(),
  );
  const doc = new DOMParser().parseFromString(html, "text/html");
  return new ZdicDictionary().parseDocument(doc);
}

describe("zdic dictionary", () => {
  it(
    "parses a live word entry",
    async () => {
      const entry = await lookupLiveWord("词典");

      expect(entry).not.toBeNull();
      expect(entry?.word).toBe("词典");
      expect(entry?.provider).toBe("Zdic Chinese Dictionary");
      expect(entry?.pronunciations).toEqual([{ type: "pinyin", text: "cí diǎn" }]);
      expect(entry?.definitions).toEqual([
        {
          partOfSpeech: undefined,
          text: "一种工具书。参见「辞典」条。",
          examples: undefined,
        },
      ]);
    },
    LIVE_TEST_TIMEOUT_MS,
  );

  it(
    "parses a live single-character entry",
    async () => {
      const entry = await lookupLiveWord("才");

      expect(entry).not.toBeNull();
      expect(entry?.word).toBe("才");
      expect(entry?.pronunciations).toEqual([
        {
          type: "pinyin",
          text: "cái",
          audioUrl: "https://img.zdic.net/audio/zd/py/c%C3%A1i.mp3",
        },
      ]);
      expect(entry?.definitions?.[0]).toEqual({
        partOfSpeech: "名",
        text: "天赋的能力、禀性。",
        examples: [
          {
            text: "《孟子·告子上》：「富岁子弟多赖，凶岁子弟多暴，非天之降 才 尔殊也。」",
          },
        ],
      });
      expect(entry?.definitions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            partOfSpeech: "副",
            text: "方、始。",
          }),
        ]),
      );
    },
    LIVE_TEST_TIMEOUT_MS,
  );
});

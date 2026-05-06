import { describe, expect, it } from "vitest";
import { ZdicDictionary } from "../providers/zdic";

const LIVE_TEST_TIMEOUT_MS = 15000;

async function lookupLiveWord(word: string) {
  const html = await fetch(`https://www.zdic.net/hans/${encodeURIComponent(word)}`).then(
    (response) => response.text(),
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
          partOfSpeech: "国语辞典",
          text: "一种工具书。参见「辞典」条。",
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
      expect(entry?.pronunciations).toEqual(
        expect.arrayContaining([
          {
            type: "pinyin",
            text: "cái",
            audioUrl: "https://img.zdic.net/audio/zd/py/cái.mp3",
          },
          {
            type: "pinyin",
            text: "suì",
            audioUrl: "https://img.zdic.net/audio/zd/py/suì.mp3",
          },
        ]),
      );
      expect(entry?.definitions?.[0]).toEqual({
        partOfSpeech: "形",
        text: "(1) (象形。甲骨文字形，上面一横表示土地，下面象草木的茎(嫩芽)刚刚出土，其枝叶尚未出土的样子。本义:草木初生)",
      });
      expect(entry?.definitions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            partOfSpeech: "名",
            text: "(1) 才力;才能 [ability]",
          }),
        ]),
      );
    },
    LIVE_TEST_TIMEOUT_MS,
  );
});

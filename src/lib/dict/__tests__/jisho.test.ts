import { describe, expect, it } from "vitest";
import { JishoDictionary } from "../providers/jisho";

const LIVE_TEST_TIMEOUT_MS = 15000;

async function lookupLiveWord(word: string) {
  return new JishoDictionary().lookup(word);
}

describe("jisho dictionary", () => {
  it(
    "parses a live word entry",
    async () => {
      const entry = await lookupLiveWord("食べる");

      expect(entry).not.toBeNull();
      expect(entry?.word).toBe("食べる");
      expect(entry?.provider).toBe("Jisho Japanese Dictionary");
      expect(entry?.pronunciations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: "ja",
            text: "たべる",
          }),
        ]),
      );
      expect(entry?.pronunciations.some((pronunciation) => pronunciation.audioUrl)).toBe(true);
      expect(entry?.definitions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            text: expect.stringContaining("eat"),
          }),
        ]),
      );
    },
    LIVE_TEST_TIMEOUT_MS,
  );
});

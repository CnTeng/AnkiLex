import { describe, expect, it } from "vitest";
import { CollinsDictionary } from "../collins";

describe("CollinsDictionary", () => {
  it("should fetch definitions from Youdao (Collins)", async () => {
    const provider = new CollinsDictionary();
    const result = await provider.lookup("read");

    console.log("Collins Result:", JSON.stringify(result, null, 2));

    expect(result.word).toBe("read");
    expect(result.definitions.length).toBeGreaterThan(0);
    expect(result.definitions[0].text).toBeTruthy();
  }, 15000);
});

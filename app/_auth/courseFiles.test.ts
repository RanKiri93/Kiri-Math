import { describe, expect, it } from "vitest";
import { parseByteRange } from "./courseFiles";

describe("single PDF byte ranges", () => {
  it.each([
    ["bytes=2-5", 10, { start: 2, end: 5 }],
    ["bytes=8-", 10, { start: 8, end: 9 }],
    ["bytes=-3", 10, { start: 7, end: 9 }],
    ["bytes=0-99", 10, { start: 0, end: 9 }],
    [null, 10, null],
    ["bytes=10-", 10, "invalid"],
    ["bytes=4-2", 10, "invalid"],
    ["bytes=0-1,4-5", 10, "invalid"],
  ] as const)("parses %s", (header, size, expected) => expect(parseByteRange(header, size)).toEqual(expected));
});

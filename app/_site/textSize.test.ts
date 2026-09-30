import { describe, expect, it } from "vitest";
import {
  DEFAULT_TEXT_SIZE_INDEX,
  TEXT_SIZE_LEVELS,
  TEXT_SIZE_STORAGE_KEY,
  clampTextSizeIndex,
  textSizeBootScript,
  textSizeValue,
} from "./textSize";

function runBoot(stored: string | null | (() => never)) {
  const style: { fontSize?: string } = {};
  const localStorage = {
    getItem: (key: string) => {
      if (typeof stored === "function") stored();
      return key === TEXT_SIZE_STORAGE_KEY ? stored : null;
    },
  };
  new Function("localStorage", "document", textSizeBootScript)(localStorage, { documentElement: { style } });
  return style.fontSize;
}

describe("text size preference", () => {
  it("keeps the CSS default in step with the default level", () => {
    expect(TEXT_SIZE_LEVELS[DEFAULT_TEXT_SIZE_INDEX]).toBe(106.25);
  });

  it("clamps stored and computed values into the level range", () => {
    expect(clampTextSizeIndex("3")).toBe(3);
    expect(clampTextSizeIndex(99)).toBe(TEXT_SIZE_LEVELS.length - 1);
    expect(clampTextSizeIndex(-4)).toBe(0);
    expect(clampTextSizeIndex(null)).toBe(DEFAULT_TEXT_SIZE_INDEX);
    expect(clampTextSizeIndex("large")).toBe(DEFAULT_TEXT_SIZE_INDEX);
    expect(clampTextSizeIndex("1.5")).toBe(DEFAULT_TEXT_SIZE_INDEX);
    expect(textSizeValue(0)).toBe("100%");
  });

  it("boot script applies only valid, non-default stored levels and survives storage errors", () => {
    expect(runBoot("3")).toBe(`${TEXT_SIZE_LEVELS[3]}%`);
    expect(runBoot(String(DEFAULT_TEXT_SIZE_INDEX))).toBeUndefined();
    expect(runBoot(null)).toBeUndefined();
    expect(runBoot("42")).toBeUndefined();
    expect(runBoot("abc")).toBeUndefined();
    expect(runBoot(() => { throw new Error("blocked"); })).toBeUndefined();
  });
});

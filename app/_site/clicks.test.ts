import { describe, expect, it } from "vitest";
import { isPlainLeftClick, type ClickLike } from "./clicks";

const plain: ClickLike = {
  defaultPrevented: false,
  button: 0,
  metaKey: false,
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
};

describe("isPlainLeftClick", () => {
  it("accepts an unmodified primary click", () => {
    expect(isPlainLeftClick(plain)).toBe(true);
  });

  it.each([
    ["already handled", { defaultPrevented: true }],
    ["middle button", { button: 1 }],
    ["right button", { button: 2 }],
    ["meta", { metaKey: true }],
    ["ctrl", { ctrlKey: true }],
    ["shift", { shiftKey: true }],
    ["alt", { altKey: true }],
  ] as const)("rejects a %s click", (_name, patch) => {
    expect(isPlainLeftClick({ ...plain, ...patch })).toBe(false);
  });
});

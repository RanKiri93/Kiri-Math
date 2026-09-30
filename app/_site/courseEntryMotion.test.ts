import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startCourseEntryMotion } from "./courseEntryMotion";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

type MockAnimation = { finished: Promise<void>; cancel: ReturnType<typeof vi.fn>; done: () => void };

function setup(compact = false) {
  const animations: MockAnimation[] = [];
  const element = (rect = { left: 10, top: 20, width: 100, height: 80 }) => {
    const node = {
      getBoundingClientRect: vi.fn(() => rect),
      animate: vi.fn<(frames: Keyframe[], options: KeyframeAnimationOptions) => MockAnimation>(() => {
        const pending = deferred<void>();
        const cancel = vi.fn(() => pending.reject(new Error("cancelled")));
        const animation = { finished: pending.promise, cancel, done: () => pending.resolve() };
        animations.push(animation);
        return animation;
      }),
    };
    return node as unknown as HTMLElement & typeof node;
  };
  const overlay = element();
  const paper = element();
  const art = element({ left: 30, top: 40, width: 200, height: 160 });
  const heading = element();
  const navigate = vi.fn();
  const finish = vi.fn();
  const motion = startCourseEntryMotion({ overlay, paper, art, heading, source: { left: 0, top: 0, width: 50, height: 40 }, compact, navigate, finish });
  return { animations, overlay, paper, art, heading, navigate, finish, motion };
}

async function settle() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

describe("course entry motion", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => { vi.runOnlyPendingTimers(); vi.useRealTimers(); });

  it("dispatches navigation once exactly at 120ms without waiting for animations", async () => {
    const { navigate } = setup();
    await vi.advanceTimersByTimeAsync(119);
    expect(navigate).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(navigate).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(500);
    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it("uses 420ms desktop and 300ms compact travel with source-to-destination geometry", () => {
    const desktop = setup();
    expect(desktop.art.animate.mock.calls[0][0]).toEqual([
      { transform: "translate(-30px, -40px) scale(0.25, 0.25)" },
      { transform: "none" },
    ]);
    expect(desktop.art.animate.mock.calls[0][1]).toMatchObject({ duration: 420 });
    const compact = setup(true);
    expect(compact.art.animate.mock.calls[0][1]).toMatchObject({ duration: 300 });
    expect(compact.art.animate.mock.calls[0][0]).toEqual(desktop.art.animate.mock.calls[0][0]);
  });

  it("navigates exactly once at 120ms, then reveals only after arrival and heading identification", async () => {
    const { animations, navigate, finish, motion, overlay } = setup();
    motion.reveal();
    await vi.advanceTimersByTimeAsync(119);
    expect(navigate).not.toHaveBeenCalled();
    animations[1].done();
    animations[2].done();
    await settle();
    // The destination has committed, so arrival may start the exit without
    // waiting for the nominal route-start timer.
    expect(overlay.animate).toHaveBeenCalledTimes(1);
    expect(overlay.animate.mock.calls[0][1]).toMatchObject({ duration: 200 });
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(finish).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(navigate).toHaveBeenCalledTimes(1);
    animations[3].done();
    await settle();
    expect(finish).toHaveBeenCalledTimes(1);
  });

  it("reveal requested after arrival exits immediately; slow routes do not hold beyond the 1800ms cap", async () => {
    const first = setup();
    first.animations[1].done(); first.animations[2].done();
    await settle();
    first.motion.reveal();
    await settle();
    expect(first.overlay.animate).toHaveBeenCalledTimes(1);
    expect(first.overlay.animate.mock.calls[0][1]).toMatchObject({ duration: 200 });

    const slow = setup();
    await vi.advanceTimersByTimeAsync(1799);
    expect(slow.navigate).toHaveBeenCalledTimes(1);
    expect(slow.overlay.animate).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(slow.overlay.animate).toHaveBeenCalledTimes(1);
    expect(slow.overlay.animate.mock.calls[0][1]).toMatchObject({ duration: 160 });
    slow.animations[3].done(); await settle();
    expect(slow.finish).toHaveBeenCalledTimes(1);
  });

  it("skip is immediate, idempotent against repeated skip/reveal, and dispatches navigation once", async () => {
    const { animations, overlay, navigate, finish, motion } = setup();
    motion.skip(); motion.skip(); motion.reveal();
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(overlay.animate).toHaveBeenCalledTimes(1);
    expect(overlay.animate.mock.calls[0][1]).toMatchObject({ duration: 100 });
    animations[3].done(); await settle();
    expect(finish).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1800);
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(overlay.animate).toHaveBeenCalledTimes(1);
  });

  it("cancel clears timers and stops pending animation completion from dispatching navigation or finish", async () => {
    const { animations, navigate, finish, motion } = setup();
    motion.cancel();
    expect(animations.slice(0, 3).every((animation) => animation.cancel.mock.calls.length === 1)).toBe(true);
    await vi.advanceTimersByTimeAsync(2000);
    animations[1].done(); animations[2].done(); await settle();
    motion.reveal(); motion.skip(); await settle();
    expect(navigate).not.toHaveBeenCalled();
    expect(finish).not.toHaveBeenCalled();
  });

  it("clears the cap timer after normal completion", async () => {
    const { animations, motion, navigate, finish } = setup();
    motion.reveal();
    await vi.advanceTimersByTimeAsync(120);
    animations[1].done(); animations[2].done(); await settle();
    animations[3].done(); await settle();
    expect(finish).toHaveBeenCalledTimes(1);
    // Final opacity stays applied until the portal's unmount cleanup, avoiding a flash.
    expect(animations.every((animation) => animation.cancel.mock.calls.length === 0)).toBe(true);
    await vi.advanceTimersByTimeAsync(2000);
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(finish).toHaveBeenCalledTimes(1);
    motion.cancel();
    expect(animations.every((animation) => animation.cancel.mock.calls.length === 1)).toBe(true);
  });

  it("still completes if creating the exit animation fails", async () => {
    const { motion, overlay, navigate, finish } = setup();
    overlay.animate.mockImplementationOnce(() => { throw new Error("animation unavailable"); });
    motion.skip();
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(finish).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
    motion.cancel();
    await settle();
  });

  it("cancels existing animations when heading animation creation throws", () => {
    const animations: Array<{ cancel: ReturnType<typeof vi.fn> }> = [];
    const makeElement = (throws = false) => ({
      getBoundingClientRect: vi.fn(() => ({ left: 0, top: 0, width: 1, height: 1 })),
      animate: vi.fn(() => {
        if (throws) throw new Error("unsupported");
        const animation = { finished: new Promise<void>(() => {}), cancel: vi.fn() };
        animations.push(animation);
        return animation;
      }),
    }) as unknown as HTMLElement;
    const paper = makeElement();
    const art = makeElement();
    const heading = makeElement(true);
    const overlay = makeElement();
    expect(() => startCourseEntryMotion({ overlay, paper, art, heading, source: { left: 0, top: 0, width: 1, height: 1 }, compact: false, navigate: vi.fn(), finish: vi.fn() })).toThrow("unsupported");
    expect(animations).toHaveLength(2);
    expect(animations.every(({ cancel }) => cancel.mock.calls.length === 1)).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });
});

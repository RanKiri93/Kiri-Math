/** A short, interruptible handoff, independent of React and route fetching. */
export type CourseEntryMotion = {
  reveal: () => void;
  skip: () => void;
  cancel: () => void;
};

type MotionOptions = {
  overlay: HTMLElement;
  paper: HTMLElement;
  art: HTMLElement;
  heading: HTMLElement;
  source: Pick<DOMRect, "left" | "top" | "width" | "height">;
  compact: boolean;
  navigate: () => void;
  finish: () => void;
};

export function startCourseEntryMotion({ overlay, paper, art, heading, source, compact, navigate, finish }: MotionOptions): CourseEntryMotion {
  const animations: Animation[] = [];
  const timers: ReturnType<typeof setTimeout>[] = [];
  let cancelled = false;
  let navigated = false;
  let exiting = false;

  function animate(element: HTMLElement, frames: Keyframe[], options: KeyframeAnimationOptions) {
    const animation = element.animate(frames, { fill: "both", ...options });
    animations.push(animation);
    // Cancellation is expected during back/forward, repeated clicks and unmounts.
    return animation.finished.catch(() => {});
  }

  function navigateOnce() {
    if (cancelled || navigated) return;
    navigated = true;
    navigate();
  }

  function cancel() {
    cancelled = true;
    timers.forEach(clearTimeout);
    animations.forEach((animation) => animation.cancel());
  }

  function exit(duration: number) {
    if (cancelled || exiting) return;
    exiting = true;
    navigateOnce();
    const complete = () => {
      if (cancelled) return;
      cancelled = true;
      timers.forEach(clearTimeout);
      // Keep the transparent final frame until React unmounts the portal. Cancelling
      // here would briefly restore an opaque overlay before that render commits.
      finish();
    };
    try {
      void animate(overlay, [{ opacity: 1 }, { opacity: 0 }], { duration, easing: "ease-out" }).then(complete);
    } catch {
      complete();
    }
  }

  try {
    const destination = art.getBoundingClientRect();
    const transform = `translate(${source.left - destination.left}px, ${source.top - destination.top}px) scale(${source.width / destination.width}, ${source.height / destination.height})`;
    const travel = compact ? 300 : 420;
    void animate(paper, [{ opacity: 0 }, { opacity: 1 }], { duration: 120, easing: "ease-out" });
    const arrived = animate(art, [{ transform }, { transform: "none" }], {
      duration: travel,
      easing: "cubic-bezier(0.22, 0.75, 0.25, 1)",
    });
    const identified = animate(heading, [
      { opacity: 0, transform: "translateY(5px)" },
      { opacity: 1, transform: "none" },
    ], { duration: 240, delay: compact ? 60 : 120, easing: "ease-out" });
    const cover = art.firstElementChild as HTMLElement | null;
    if (cover) {
      // Let the card's paper merge into the page as the intact illustration moves.
      void animate(cover, [
        { backgroundColor: "var(--paper-deep)", borderColor: "var(--line)" },
        { backgroundColor: "transparent", borderColor: "transparent" },
      ], { duration: travel, easing: "ease-out" });
    }
    const settled = Promise.all([arrived, identified]);

    // Conceal the route swap before requesting it, while the cover is still moving.
    // Prefetch already began on hover/focus/touch, not after the animation finishes.
    timers.push(setTimeout(navigateOnce, 120));
    // Slow/failed navigation must not leave a blocking or indefinite splash screen.
    timers.push(setTimeout(() => exit(160), 1800));
    return {
      reveal: () => { void settled.then(() => exit(200)); },
      skip: () => exit(100),
      cancel,
    };
  } catch (error) {
    cancel();
    throw error;
  }
}

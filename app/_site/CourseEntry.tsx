"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { isPlainLeftClick } from "./clicks";

const EXPAND_MS = 450;
const DRAW_AT_MS = 300;
const NAVIGATE_AT_MS = 1500;
const REDUCED_FADE_MS = 150;

type CardRect = { top: number; left: number; width: number; height: number };

type Run = { rect: CardRect; reduced: boolean };

export function CourseEntry({
  href,
  title,
  cover,
  className,
  children,
}: {
  href: string;
  title: string;
  cover: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const prefetched = useRef(false);
  const left = useRef(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [run, setRun] = useState<Run | null>(null);

  function prefetch() {
    if (prefetched.current) return;
    prefetched.current = true;
    try {
      void router.prefetch(href);
    } catch {
      // Prefetch is an optimization. The click still navigates.
    }
  }

  const leave = useCallback(() => {
    if (left.current) return;
    left.current = true;
    try {
      router.push(href);
    } catch {
      window.location.assign(href);
    }
  }, [href, router]);

  useEffect(() => {
    if (!run) return;
    const overlay = overlayRef.current;
    document.documentElement.classList.add("course-transition-open");
    const timers: number[] = [];
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") leave();
    };
    window.addEventListener("keydown", onKey);

    if (run.reduced) {
      overlay?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: REDUCED_FADE_MS, easing: "ease", fill: "forwards" });
      timers.push(window.setTimeout(leave, REDUCED_FADE_MS));
    } else if (overlay) {
      const top = run.rect.top;
      const right = window.innerWidth - (run.rect.left + run.rect.width);
      const bottom = window.innerHeight - (run.rect.top + run.rect.height);
      const leftInset = run.rect.left;
      overlay.animate(
        [
          { clipPath: `inset(${top}px ${right}px ${bottom}px ${leftInset}px round 8px)` },
          { clipPath: "inset(0px round 0px)" },
        ],
        { duration: EXPAND_MS, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", fill: "forwards" },
      );
      timers.push(window.setTimeout(() => overlay.classList.add("is-drawing"), DRAW_AT_MS));
      timers.push(window.setTimeout(leave, NAVIGATE_AT_MS));
    }

    return () => {
      document.documentElement.classList.remove("course-transition-open");
      window.removeEventListener("keydown", onKey);
      for (const timer of timers) window.clearTimeout(timer);
    };
  }, [run, leave]);

  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    if (!isPlainLeftClick(event) || run) return;
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    setRun({
      rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
      reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    });
  }

  const clip =
    run && !run.reduced
      ? `inset(${run.rect.top}px ${window.innerWidth - (run.rect.left + run.rect.width)}px ${window.innerHeight - (run.rect.top + run.rect.height)}px ${run.rect.left}px round 8px)`
      : undefined;
  const titleStyle: CSSProperties | undefined = run
    ? run.rect.left >= 420
      ? { top: 0, bottom: 0, left: 0, width: Math.max(0, run.rect.left - 28) }
      : { top: run.rect.top + (run.rect.width * 300) / 480 + 36, left: 24, right: 24 }
    : undefined;

  return (
    <>
      <a className={className} href={href} onClick={onClick} onPointerEnter={prefetch} onFocus={prefetch}>
        {run ? null : cover}
        {children}
      </a>
      {run
        ? createPortal(
            <div
              ref={overlayRef}
              className="course-entry-overlay"
              aria-hidden="true"
              onClick={leave}
              style={run.reduced ? { opacity: 0 } : { clipPath: clip }}
            >
              <div className="course-entry-art" style={{ top: run.rect.top, left: run.rect.left, width: run.rect.width }}>
                {cover}
              </div>
              <p className="course-entry-title" style={titleStyle}>
                {title}
              </p>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

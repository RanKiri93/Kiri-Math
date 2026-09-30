"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { isPlainLeftClick } from "./clicks";
import { startCourseEntryMotion, type CourseEntryMotion } from "./courseEntryMotion";

type Entry = {
  href: string;
  from: string;
  title: string;
  code: string;
  cover: HTMLElement;
  rect: DOMRect;
  keyboard: boolean;
};

function entryLink(target: EventTarget | null) {
  if (!(target instanceof Element)) return null;
  const link = target.closest<HTMLAnchorElement>("a[data-course-entry]");
  if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) return null;
  return link.origin === window.location.origin ? link : null;
}

/** Lives in the root layout so the cover can dissolve AFTER the destination commits.
 * Only annotated, available dashboard course links participate; all links retain hrefs.
 */
export function CourseEntry({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [entry, setEntry] = useState<Entry | null>(null);
  const active = useRef(false);
  const prefetched = useRef(new Set<string>());
  const overlayRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const artRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const motion = useRef<CourseEntryMotion | null>(null);

  function prefetch(target: EventTarget | null) {
    const link = entryLink(target);
    if (!link || prefetched.current.has(link.href)) return;
    prefetched.current.add(link.href);
    try {
      void router.prefetch(link.pathname);
    } catch {
      // Prefetch is optional; a normal navigation remains available.
    }
  }

  useLayoutEffect(() => {
    if (!entry) return;
    const overlay = overlayRef.current!;
    const art = artRef.current!;
    // Clone decorative art only, never an interactive card or its accessible text.
    // The original stays in place, preserving the dashboard's geometry throughout.
    art.replaceChildren(entry.cover);
    const navigate = () => {
      try { router.push(entry.href); }
      catch { window.location.assign(entry.href); }
    };
    const finish = () => {
      active.current = false;
      setEntry(null);
      if (entry.keyboard && window.location.pathname === entry.href && document.activeElement === document.body) {
        const heading = document.querySelector<HTMLElement>("main h1");
        if (heading) {
          const tabIndex = heading.getAttribute("tabindex");
          heading.tabIndex = -1;
          heading.focus({ preventScroll: true });
          // Removing tabindex while focused sends focus back to body in Chromium.
          heading.addEventListener("blur", () => {
            if (tabIndex === null) heading.removeAttribute("tabindex");
            else heading.setAttribute("tabindex", tabIndex);
          }, { once: true });
        }
      }
    };
    try {
      motion.current = startCourseEntryMotion({
        overlay,
        paper: paperRef.current!,
        art,
        heading: headingRef.current!,
        source: entry.rect,
        compact: window.matchMedia("(max-width: 820px)").matches,
        navigate,
        finish,
      });
    } catch {
      // An unavailable animation API must never strand navigation behind a cover.
      navigate();
      finish();
    }
    const skip = () => motion.current?.skip();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.key === "Tab") skip();
    };
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", skip);
    window.addEventListener("pagehide", skip);
    preference.addEventListener("change", skip);
    return () => {
      motion.current?.cancel();
      motion.current = null;
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", skip);
      window.removeEventListener("pagehide", skip);
      preference.removeEventListener("change", skip);
    };
  }, [entry, router]);

  useEffect(() => {
    if (!entry || pathname === entry.from) return;
    // Pathname updates with the new React tree, not when navigation is requested.
    // Authentication redirects and unrelated navigations need no identification beat.
    if (pathname === entry.href) motion.current?.reveal();
    else motion.current?.skip();
  }, [entry, pathname]);

  function onClick(event: MouseEvent<HTMLDivElement>) {
    if (active.current) {
      motion.current?.skip();
      if (isPlainLeftClick(event) && entryLink(event.target)) event.preventDefault();
      return;
    }
    const link = entryLink(event.target);
    if (!link || !isPlainLeftClick(event)) return;
    prefetch(link);
    // Reduced motion and older browsers keep immediate, ordinary link navigation.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !Element.prototype.animate) return;
    const cover = link.querySelector<HTMLElement>(".course-card-art");
    const title = link.querySelector("h2")?.textContent;
    if (!cover || !title) return;
    const rect = cover.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    event.preventDefault();
    active.current = true;
    setEntry({
      href: link.pathname,
      from: pathname,
      title,
      code: link.querySelector(".course-card-code")?.textContent ?? "",
      cover: cover.cloneNode(true) as HTMLElement,
      rect,
      keyboard: event.detail === 0,
    });
  }

  return (
    <>
      <div className="course-entry-root" onClick={onClick} onPointerOver={(event) => prefetch(event.target)} onFocus={(event) => prefetch(event.target)}>
        {children}
      </div>
      {entry ? createPortal(
        <div ref={overlayRef} className="course-entry-overlay" aria-hidden="true" dir="rtl">
          <div ref={paperRef} className="course-entry-paper" />
          <div className="course-entry-scene">
            <div ref={artRef} className="course-entry-art" />
            <div ref={headingRef} className="course-entry-heading">
              <span className="course-entry-code" dir="ltr">{entry.code}</span>
              <p className="course-entry-title">{entry.title}</p>
            </div>
          </div>
        </div>, document.body,
      ) : null}
    </>
  );
}

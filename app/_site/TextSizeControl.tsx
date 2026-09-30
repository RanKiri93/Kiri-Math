"use client";

import { useSyncExternalStore } from "react";
import {
  DEFAULT_TEXT_SIZE_INDEX,
  TEXT_SIZE_LEVELS,
  TEXT_SIZE_STORAGE_KEY,
  clampTextSizeIndex,
  textSizeValue,
} from "./textSize";

// The root element's inline font size is the source of truth: the boot script in the root
// layout sets it before paint, and this control changes it.
const listeners = new Set<() => void>();

function currentIndex() {
  const index = TEXT_SIZE_LEVELS.findIndex((_, i) => textSizeValue(i) === document.documentElement.style.fontSize);
  return index === -1 ? DEFAULT_TEXT_SIZE_INDEX : index;
}

function applyToRoot(index: number) {
  const root = document.documentElement;
  if (index === DEFAULT_TEXT_SIZE_INDEX) root.style.removeProperty("font-size");
  else root.style.fontSize = textSizeValue(index);
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Keep other open tabs in step with a change made here.
  const onStorage = (event: StorageEvent) => {
    if (event.key === TEXT_SIZE_STORAGE_KEY) applyToRoot(clampTextSizeIndex(event.newValue));
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function setTextSize(next: number) {
  const index = clampTextSizeIndex(next);
  applyToRoot(index);
  try {
    if (index === DEFAULT_TEXT_SIZE_INDEX) window.localStorage.removeItem(TEXT_SIZE_STORAGE_KEY);
    else window.localStorage.setItem(TEXT_SIZE_STORAGE_KEY, String(index));
  } catch {
    // Storage unavailable: the size still applies to this page.
  }
}

/** Floating A−/A+ control on every page. */
export function TextSizeControl() {
  const index = useSyncExternalStore(subscribe, currentIndex, () => DEFAULT_TEXT_SIZE_INDEX);

  return (
    <div className="text-size-control" role="group" aria-label="גודל טקסט">
      <button
        type="button"
        className="text-size-button"
        onClick={() => setTextSize(index - 1)}
        disabled={index <= 0}
        aria-label="הקטנת הטקסט"
        title="הקטנת הטקסט"
      >
        <span aria-hidden="true">א−</span>
      </button>
      <button
        type="button"
        className="text-size-button larger"
        onClick={() => setTextSize(index + 1)}
        disabled={index >= TEXT_SIZE_LEVELS.length - 1}
        aria-label="הגדלת הטקסט"
        title="הגדלת הטקסט"
      >
        <span aria-hidden="true">א+</span>
      </button>
    </div>
  );
}

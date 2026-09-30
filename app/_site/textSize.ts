/**
 * Reader text-size preference. The root font size scales every rem-based size on the site.
 * This is a display preference only; it is the one value the site keeps in localStorage.
 */

/** Root font sizes, in percent of the browser's own default. */
export const TEXT_SIZE_LEVELS = [100, 106.25, 112.5, 118.75, 125, 131.25] as const;
export const DEFAULT_TEXT_SIZE_INDEX = 1;
export const TEXT_SIZE_STORAGE_KEY = "kiri-math:text-size";

export function clampTextSizeIndex(value: unknown): number {
  const index = typeof value === "string" && /^\d+$/.test(value) ? Number(value) : typeof value === "number" ? value : NaN;
  if (!Number.isInteger(index)) return DEFAULT_TEXT_SIZE_INDEX;
  return Math.min(TEXT_SIZE_LEVELS.length - 1, Math.max(0, index));
}

export function textSizeValue(index: number): string {
  return `${TEXT_SIZE_LEVELS[clampTextSizeIndex(index)]}%`;
}

/**
 * Inline script for <head>: applies a stored choice before first paint so the page never
 * flashes at the default size. Storage can throw (private mode, blocked site data), so it is guarded.
 */
export const textSizeBootScript = `(function(){try{var v=localStorage.getItem(${JSON.stringify(TEXT_SIZE_STORAGE_KEY)});var l=${JSON.stringify(TEXT_SIZE_LEVELS)};if(v!==null&&/^\\d+$/.test(v)&&+v<l.length&&+v!==${DEFAULT_TEXT_SIZE_INDEX}){document.documentElement.style.fontSize=l[+v]+"%";}}catch(e){}})();`;

/**
 * View windows and probe limits of the supremum-test activity. Pure TypeScript, no React.
 * A window only changes what is drawn: the mathematical domain of an example never changes.
 */
import type { PlotWindow } from './sequencePlot';
import { SUP_EXAMPLES, type SupExample, type SupExampleId } from './supremumExamples';

/** Selectable windows per example; the first is the example's `defaultView`. The narrow ones
 * reach the peaks at 1/n and 2/n (n up to 64) and the E3 peak near 1. */
export const SUP_VIEWS: Record<SupExampleId, PlotWindow[]> = {
  E1: [{ left: 0, right: 6 }, { left: 0, right: 2 }, { left: 0, right: 0.5 }, { left: 0, right: 0.1 }],
  E1p: [{ left: 0, right: 6 }, { left: 0, right: 2 }],
  E2: [{ left: 0, right: 6 }, { left: 0, right: 2 }, { left: 0, right: 0.5 }, { left: 0, right: 0.1 }],
  E3: [{ left: 0, right: 1 }, { left: 0.5, right: 1 }, { left: 0.9, right: 1 }, { left: 0.98, right: 1 }],
  E3p: [{ left: 0, right: 1 }, { left: 0, right: 0.5 }, { left: 0.25, right: 0.5 }],
};

/** The largest probe value offered for a half-line domain (the slider and number box stop here). */
export const SUP_PROBE_CAP = 100;

/** Finite probe bounds of an example's domain. */
export function probeBounds(ex: SupExample): { min: number; max: number } {
  return { min: ex.domain.left, max: Math.min(ex.domain.right, SUP_PROBE_CAP) };
}

/** The part of the domain shown in the window: where the probe slider moves. */
export function probeSliderBounds(ex: SupExample, view: PlotWindow): { min: number; max: number } {
  const b = probeBounds(ex);
  const min = Math.max(b.min, view.left);
  const max = Math.min(b.max, view.right);
  return min <= max ? { min, max } : b;
}

/** Keeps a probe inside the domain and the window. */
export function clampProbe(ex: SupExample, view: PlotWindow, x: number): number {
  const { min, max } = probeSliderBounds(ex, view);
  return Math.min(max, Math.max(min, x));
}

export function defaultViewIndex(id: SupExampleId): number {
  const dv = SUP_EXAMPLES[id].defaultView;
  const i = SUP_VIEWS[id].findIndex((v) => v.left === dv.left && v.right === dv.right);
  return i < 0 ? 0 : i;
}

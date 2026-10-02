"use client";

import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";
import type { ProofSection } from "../math/guidedSteps";
import { MathInlineText } from "./MathInlineText";
import { MathText } from "./MathText";

function ExampleFormula({ latex }: { latex: string }) {
  return <div className="supremum-proof-formula" dir="ltr">
    <MathText block math={latex} />
  </div>;
}

/** A complete, concise proof: the example's formula, then its labelled sections in order. */
export function ProofContent({ formulaLatex, sections }: { formulaLatex: string; sections: readonly ProofSection[] }) {
  return <>
    <ExampleFormula latex={formulaLatex} />
    <ol className="supremum-proof-sections">
      {sections.map((section, index) => <li key={index}>
        <h3><MathInlineText text={section.heading} /></h3>
        <p><MathInlineText text={section.body} /></p>
        {section.display && <MathText block math={section.display} />}
      </li>)}
    </ol>
  </>;
}

/** A short prose summary of an example: its formula, then paragraphs with inline $...$ math. */
export function SummaryContent({ formulaLatex, paragraphs }: { formulaLatex: string; paragraphs: readonly string[] }) {
  return <>
    <ExampleFormula latex={formulaLatex} />
    <div className="guided-summary">
      {paragraphs.map((text, index) => <p key={index}><MathInlineText text={text} /></p>)}
    </div>
  </>;
}

/**
 * Pop-up shown when a guided example is finished: a model proof (supremum activity) or a summary
 * (continuity activity) of the whole example. A native modal <dialog> (focus trap, Escape, focus
 * return), like the notes reader. Closing keeps the student on the example; the primary action
 * continues to the next example or the finish view.
 */
export function GuidedProofDialog({ kicker, title, lead, children, open, nextLabel, onNext, secondaryNext, onClose }: {
  /** Small line above the title, e.g. "סיכום דוגמה 1". */
  kicker: string;
  title: string;
  lead?: string;
  children?: ReactNode;
  open: boolean;
  nextLabel: string;
  onNext: () => void;
  /** A second way on, e.g. to an optional example while the primary action finishes the activity. */
  secondaryNext?: { label: string; onClick: () => void };
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    else if (!open && element.open) element.close();
  }, [open]);
  const close = () => dialog.current?.close();
  // A click on the backdrop targets the dialog itself; the panel fills the dialog's box.
  const closeOnBackdrop = (event: MouseEvent<HTMLDialogElement>) => { if (event.target === event.currentTarget) close(); };
  return <dialog ref={dialog} className="supremum-proof-dialog" aria-labelledby="supremum-proof-title" onClose={onClose} onClick={closeOnBackdrop}>
    {open && <div className="supremum-proof-panel">
      <header className="sample-modal-header">
        <div>
          <span>{kicker}</span>
          <h2 id="supremum-proof-title">{title}</h2>
        </div>
        <button type="button" className="icon-button" aria-label="סגירה" onClick={close}>×</button>
      </header>
      {lead && <p className="supremum-proof-lead">{lead}</p>}
      {children}
      <div className="supremum-proof-actions">
        <button type="button" className="panel-action secondary" onClick={close}>חזרה לדוגמה</button>
        {secondaryNext && <button type="button" className="panel-action secondary" onClick={() => { close(); secondaryNext.onClick(); }}>{secondaryNext.label}</button>}
        <button type="button" className="panel-action" onClick={() => { close(); onNext(); }}>{nextLabel}</button>
      </div>
    </div>}
  </dialog>;
}

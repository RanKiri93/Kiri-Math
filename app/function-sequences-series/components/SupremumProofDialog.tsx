"use client";

import { SUP_EXAMPLES, type SupExampleId } from "../math/supremumExamples";
import { SUP_FULL_PROOFS } from "../math/supremumProofs";
import { GuidedProofDialog, ProofContent } from "./GuidedProofDialog";

const formulaOf = (id: SupExampleId) => `${SUP_EXAMPLES[id].fnLatex},\\quad x\\in ${SUP_EXAMPLES[id].domainLatex}`;

/** A supremum example's complete, concise proof (`SUP_FULL_PROOFS`). */
export function FullProofContent({ id }: { id: SupExampleId }) {
  return <ProofContent formulaLatex={formulaOf(id)} sections={SUP_FULL_PROOFS[id].sections} />;
}

/** The full-proof pop-up of a finished supremum example. */
export function SupremumProofDialog({ id, position, ...rest }: {
  id: SupExampleId;
  position: number;
  open: boolean;
  nextLabel: string;
  onNext: () => void;
  onClose: () => void;
}) {
  return <GuidedProofDialog kicker={`סיכום דוגמה ${position}`} title="הוכחה מלאה ותמציתית"
    lead="כך אפשר לכתוב את כל הטיעון של הדוגמה כהוכחה אחת: רק העובדות הדרושות, לפי הסדר שבו עבדתם." {...rest}>
    <FullProofContent id={id} />
  </GuidedProofDialog>;
}

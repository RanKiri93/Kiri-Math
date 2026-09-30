import { EPS, betaConstraintOptions, realPairDomainOptions } from "../constants";
import { formatAlphaConstraintLatex, formatBetaConstraintLatex, formatRealPairDomainLatex } from "../math/affinePolynomial";
import { behaviorInfinityLatex } from "../math/reconstructionBehavior";
import {
  formatComplexPairEquationFamilyLatex,
  formatComplexPairExpandedPolynomialLatex,
  formatComplexPairFactoredPolynomialLatex,
  formatTwoRealRootsEquationFamilyLatex,
  formatTwoRealRootsExpandedPolynomialLatex,
  formatTwoRealRootsFactoredPolynomialLatex,
} from "../math/twoParameterFormatting";
import type {
  BetaConstraint,
  LambdaConstraint,
  RealPairDomain,
  ReconstructionBehaviorCondition,
  ReconstructionQuestion,
  StageStatus,
} from "../types";
import { LambdaConstraintInput } from "./ReconstructionInputs";
import { MathText } from "./MathText";

export type TwoParameterActivePart = "real" | "complex";

type BranchResult = { isCorrect: boolean; message: string } | null;

type ReconstructionTwoParameterConclusionProps = {
  question: ReconstructionQuestion;
  activePart: TwoParameterActivePart;
  realPairDomain: RealPairDomain | null;
  complexAlphaConstraint: LambdaConstraint | null;
  complexBetaConstraint: BetaConstraint | null;
  realBranchStatus: StageStatus;
  complexBranchStatus: StageStatus;
  realBranchResult: BranchResult;
  complexBranchResult: BranchResult;
  disabled: boolean;
  onActivePartChange: (part: TwoParameterActivePart) => void;
  onRealPairDomainChange: (value: RealPairDomain) => void;
  onComplexAlphaChange: (value: LambdaConstraint) => void;
  onComplexBetaChange: (value: BetaConstraint) => void;
  onCheckRealBranch: () => void;
  onCheckComplexBranch: () => void;
  onRevealRealBranch: () => void;
  onRevealComplexBranch: () => void;
};

function BehaviorConditionBanner({ behavior }: { behavior: ReconstructionBehaviorCondition }) {
  const infinityLatex = behaviorInfinityLatex(behavior);

  if (behavior === "none" || !infinityLatex) {
    return (
      <div className="reconstruction-behavior-banner" dir="rtl">
        <span>לא נתון תנאי נוסף על התנהגות הפתרונות.</span>
      </div>
    );
  }

  const prefix =
    behavior === "bounded-plus-infinity" || behavior === "bounded-minus-infinity"
      ? "נכון שכל פתרונות המשוואה חסומים כאשר"
      : "נכון שכל פתרונות המשוואה שואפים לאפס כאשר";

  return (
    <div className="reconstruction-behavior-banner" dir="rtl">
      <span>
        {prefix}{" "}
        <span className="stability-inline-math">
          <MathText math={infinityLatex} />
        </span>
        .
      </span>
    </div>
  );
}

function branchProgressLabel(status: StageStatus): string {
  if (status === "correct") {
    return "הושלם";
  }
  if (status === "revealed") {
    return "הושלם (בעזרה)";
  }
  if (status === "incorrect") {
    return "יש לתקן";
  }
  return "טרם הושלם";
}

function isBranchResolved(status: StageStatus): boolean {
  return status === "correct" || status === "revealed";
}

export function ReconstructionTwoParameterConclusion({
  question,
  activePart,
  realPairDomain,
  complexAlphaConstraint,
  complexBetaConstraint,
  realBranchStatus,
  complexBranchStatus,
  realBranchResult,
  complexBranchResult,
  disabled,
  onActivePartChange,
  onRealPairDomainChange,
  onComplexAlphaChange,
  onComplexBetaChange,
  onCheckRealBranch,
  onCheckComplexBranch,
  onRevealRealBranch,
  onRevealComplexBranch,
}: ReconstructionTwoParameterConclusionProps) {
  if (question.analysis.kind !== "two-parameter") {
    return null;
  }

  const analysis = question.analysis;
  const mu = analysis.forcedRealRoot;
  const isZeroCollisionBoundedness =
    (question.behaviorCondition === "bounded-plus-infinity" ||
      question.behaviorCondition === "bounded-minus-infinity") &&
    Math.abs(mu) < EPS;
  const completedCount =
    Number(isBranchResolved(realBranchStatus)) + Number(isBranchResolved(complexBranchStatus));

  return (
    <div className="reconstruction-family-stage reconstruction-two-parameter-dual">
      <p className="activity-hint">
        מאחר שמקדמי המשוואה ממשיים, שני השורשים החסרים יכולים להיות שני שורשים ממשיים, שיכולים
        גם להיות שווים, או זוג שורשים מרוכבים צמודים ולא־ממשיים. השלימו את תנאי הפרמטרים בשתי
        הצורות.
      </p>
      <p className="reconstruction-two-param-progress" dir="rtl">
        {completedCount} מתוך 2 הושלמו
      </p>
      <details className="intro-expansion">
        <summary>רמז</summary>
        <p>
          אחרי הגורם הליניארי המוכרח <MathText math={"(r-\\mu)"} /> נותר גורם ריבועי מנורמל
          חופשי. זה הגורם שיש לסווג.
        </p>
        <p>
          מקדמים ממשיים מחייבים פיצול לשני מקרים, והם בדיוק שתי הצורות: פיצול מעל{" "}
          <MathText math={"\\mathbb{R}"} /> כ־<MathText
            math={"p_{\\mathrm{real}}(r)=(r-\\mu)(r-\\lambda_1)(r-\\lambda_2)"}
          />, כולל <MathText math={"\\lambda_1=\\lambda_2"} />; או אי־פריק מעל{" "}
          <MathText math={"\\mathbb{R}"} /> כ־<MathText
            math={"p_{\\mathrm{complex}}(r)=(r-\\mu)\\bigl((r-\\alpha)^2+\\beta^2\\bigr)"}
          />. שני המקרים אפשריים; יש להשלים את שתי הצורות.
        </p>
        <p>
          הפעילו את תנאי ההתנהגות על השורשים החופשיים בכל מקרה בנפרד. בממשיים: כל{" "}
          <MathText math={"e^{\\lambda x}"} /> (או <MathText math={"x e^{\\lambda x}"} /> אם
          השורשים החופשיים מתלכדים) צריך לקיים את התנאי הנתון. במרוכבים:{" "}
          <MathText math={"e^{\\alpha x}\\cos(\\beta x)"} />,{" "}
          <MathText math={"e^{\\alpha x}\\sin(\\beta x)"} />; הגדילה כאשר{" "}
          <MathText math={"x\\to\\pm\\infty"} /> נקבעת לפי <MathText math={"\\alpha"} />, לא
          לפי <MathText math={"|\\beta|"} />. אם שורש חופשי נופל על שורש קיים, הריבוי עולה —
          בדקו אם זה עדיין מקיים תנאי חסימות.
        </p>
        {isZeroCollisionBoundedness ? (
          <p>
            בדקו מה יקרה לריבוי של השורש <MathText math={"0"} /> אם שני השורשים החופשיים
            מתאפסים.
          </p>
        ) : null}
      </details>
      <div className="reconstruction-two-param-tabs" role="tablist" aria-label="שתי צורות ההשלמה">
        <button
          type="button"
          role="tab"
          aria-selected={activePart === "real"}
          className={`reconstruction-two-param-tab${activePart === "real" ? " is-active" : ""}`}
          disabled={disabled}
          onClick={() => onActivePartChange("real")}
        >
          <span className="reconstruction-two-param-tab-title">שני שורשים ממשיים</span>
          <span className="reconstruction-two-param-tab-status">{branchProgressLabel(realBranchStatus)}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activePart === "complex"}
          className={`reconstruction-two-param-tab${activePart === "complex" ? " is-active" : ""}`}
          disabled={disabled}
          onClick={() => onActivePartChange("complex")}
        >
          <span className="reconstruction-two-param-tab-title">זוג שורשים מרוכבים צמודים</span>
          <span className="reconstruction-two-param-tab-status">
            {branchProgressLabel(complexBranchStatus)}
          </span>
        </button>
      </div>

      {activePart === "real" ? (
        <div className="reconstruction-two-param-panel" role="tabpanel">
          <p className="reconstruction-family-text">
            נסמן את השורשים החסרים ב-<MathText math={"\\lambda_1,\\lambda_2"} />. הם יכולים להיות
            שונים או שווים.
          </p>
          <div className="reconstruction-family-formula reconstruction-family-formula-scroll">
            <MathText block math={formatTwoRealRootsFactoredPolynomialLatex(mu)} />
          </div>
          <div className="reconstruction-family-formula reconstruction-family-formula-scroll">
            <MathText block math={formatTwoRealRootsExpandedPolynomialLatex(mu)} />
          </div>
          <div className="reconstruction-family-formula reconstruction-family-formula-scroll">
            <MathText block math={formatTwoRealRootsEquationFamilyLatex(mu)} />
          </div>
          <BehaviorConditionBanner behavior={question.behaviorCondition} />
          <p className="reconstruction-family-question" id="real-pair-domain-question">
            השלימו את התנאים על שני השורשים הממשיים החסרים.
          </p>
          <div
            className="lambda-option-list"
            role="radiogroup"
            aria-labelledby="real-pair-domain-question"
          >
            {realPairDomainOptions.map((option) => (
              <label
                key={option.value}
                className={`lambda-option-card ${realPairDomain === option.value ? "is-selected" : ""}`}
              >
                <input
                  type="radio"
                  name="real-pair-domain"
                  value={option.value}
                  checked={realPairDomain === option.value}
                  disabled={disabled || isBranchResolved(realBranchStatus)}
                  onChange={() => onRealPairDomainChange(option.value)}
                />
                <div className="lambda-option-content">
                  <span className="lambda-option-math">
                    <MathText variant="compact" math={option.latex} />
                  </span>
                </div>
              </label>
            ))}
          </div>
          {realBranchResult && !realBranchResult.isCorrect ? (
            <p className="stage-feedback">{realBranchResult.message}</p>
          ) : null}
          {realBranchResult?.isCorrect ? (
            <p className="stage-success">התנאים על שני השורשים הממשיים החסרים נכונים.</p>
          ) : null}
          {isBranchResolved(realBranchStatus) ? (
            <div className="reconstruction-summary reconstruction-family-summary">
              <p className="intro-equation">
                <MathText block math={formatRealPairDomainLatex(analysis.realPairDomain)} />
              </p>
            </div>
          ) : null}
          <div className="practice-actions">
            <button
              type="button"
              className="panel-action"
              disabled={disabled || isBranchResolved(realBranchStatus)}
              onClick={onCheckRealBranch}
            >
              בדיקת השלמה — שני שורשים ממשיים
            </button>
            <button
              type="button"
              className="panel-action secondary"
              disabled={disabled || isBranchResolved(realBranchStatus)}
              onClick={onRevealRealBranch}
            >
              הצג תשובה לחלק זה
            </button>
          </div>
        </div>
      ) : (
        <div className="reconstruction-two-param-panel" role="tabpanel">
          <p className="reconstruction-family-text">
            נסמן את השורשים החסרים ב-<MathText math={"\\alpha\\pm i\\beta"} />, כאשר{" "}
            <MathText math={"\\beta\\ne0"} />.
          </p>
          <div className="reconstruction-family-formula reconstruction-family-formula-scroll">
            <MathText block math={formatComplexPairFactoredPolynomialLatex(mu)} />
          </div>
          <div className="reconstruction-family-formula reconstruction-family-formula-scroll">
            <MathText block math={formatComplexPairExpandedPolynomialLatex(mu)} />
          </div>
          <div className="reconstruction-family-formula reconstruction-family-formula-scroll">
            <MathText block math={formatComplexPairEquationFamilyLatex(mu)} />
          </div>
          <BehaviorConditionBanner behavior={question.behaviorCondition} />
          <p className="reconstruction-family-question" id="complex-pair-domain-question">
            השלימו את התנאים על הפרמטרים של הזוג המרוכב.
          </p>
          <div className="reconstruction-two-param-rows">
            <div className="reconstruction-two-param-row">
              <span className="reconstruction-two-param-label">
                <MathText variant="standard" math={"\\alpha"} />
              </span>
              <LambdaConstraintInput
                value={complexAlphaConstraint}
                disabled={disabled || isBranchResolved(complexBranchStatus)}
                labelledBy="complex-pair-domain-question"
                onChange={onComplexAlphaChange}
              />
            </div>
            <div className="reconstruction-two-param-row">
              <span className="reconstruction-two-param-label">
                <MathText variant="standard" math={"\\beta"} />
              </span>
              <div className="lambda-option-list" role="radiogroup" aria-label="תנאי על beta">
                {betaConstraintOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`lambda-option-card ${complexBetaConstraint === option.value ? "is-selected" : ""}`}
                  >
                    <input
                      type="radio"
                      name="beta-constraint"
                      value={option.value}
                      checked={complexBetaConstraint === option.value}
                      disabled={disabled || isBranchResolved(complexBranchStatus)}
                      onChange={() => onComplexBetaChange(option.value)}
                    />
                    <div className="lambda-option-content">
                      <div className="lambda-option-title">{option.label}</div>
                      <span className="lambda-option-math">
                        <MathText variant="compact" math={option.latex} />
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
          {complexBranchResult && !complexBranchResult.isCorrect ? (
            <p className="stage-feedback">{complexBranchResult.message}</p>
          ) : null}
          {complexBranchResult?.isCorrect ? (
            <p className="stage-success">התנאים על הפרמטרים של הזוג המרוכב נכונים.</p>
          ) : null}
          {isBranchResolved(complexBranchStatus) ? (
            <div className="reconstruction-summary reconstruction-family-summary">
              <p className="intro-equation">
                <MathText block math={formatAlphaConstraintLatex(analysis.complexPairDomain.alphaConstraint)} />
                {" , "}
                <MathText block math={formatBetaConstraintLatex()} />
              </p>
            </div>
          ) : null}
          <div className="practice-actions">
            <button
              type="button"
              className="panel-action"
              disabled={disabled || isBranchResolved(complexBranchStatus)}
              onClick={onCheckComplexBranch}
            >
              בדיקת השלמה — זוג מרוכב צמוד
            </button>
            <button
              type="button"
              className="panel-action secondary"
              disabled={disabled || isBranchResolved(complexBranchStatus)}
              onClick={onRevealComplexBranch}
            >
              הצג תשובה לחלק זה
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

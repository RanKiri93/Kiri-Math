"use client";

import { useMemo, useState } from "react";
import {
  buildHomogeneousEquationFromBasis,
  type EquationFromBasisResult,
} from "../math/equationFromBasis";
import { parseFormula } from "../math/formulaParser";
import { DisplayMath, MathText } from "./MathText";

const validityNote =
  "המשוואה המתקבלת תקפה בתחום שבו הוורונסקיאן רציף ואינו מתאפס.";

type FormulaField = {
  value: string;
  parseError?: string;
};

export function EquationAssemblerActivity() {
  const [y1, setY1] = useState<FormulaField>({ value: "" });
  const [y2, setY2] = useState<FormulaField>({ value: "" });
  const [result, setResult] = useState<EquationFromBasisResult | null>(null);

  const preview1 = useLivePreview(y1.value);
  const preview2 = useLivePreview(y2.value);

  function updateY1(value: string) {
    setY1({ value });
    setResult(null);
  }

  function updateY2(value: string) {
    setY2({ value });
    setResult(null);
  }

  function handleBuild() {
    const nextY1 = validateField(y1.value);
    const nextY2 = validateField(y2.value);
    setY1(nextY1);
    setY2(nextY2);
    if (nextY1.parseError || nextY2.parseError) {
      setResult(null);
      return;
    }
    setResult(buildHomogeneousEquationFromBasis([nextY1.value, nextY2.value]));
  }

  return (
    <div className="fundamental-activity-grid" aria-label="הרכבת המשוואה ממערכת יסודית">
      <aside className="control-panel practice-panel">
        <section className="panel-section">
          <div className="section-heading">מעבדה</div>
          <p className="activity-hint">
            הזינו שתי פונקציות. אם ניתן להשתמש בהן כמערכת יסודית של משוואה ליניארית הומוגנית
            מסדר שני, המעבדה תרכיב את המשוואה המנורמלת המתאימה.
          </p>
        </section>

        <section className="panel-section">
          <div className="section-heading">תחביר קלט</div>
          <p className="activity-hint">
            כתבו ביטוי ב־x עם כפל מפורש, למשל <code>3*x</code>, <code>exp(-3*x)</code>,{" "}
            <code>ln(x)</code>, <code>sqrt(x+1)</code>, <code>sin(x)*cos(x)</code>.
          </p>
        </section>
      </aside>

      <main className="practice-main fundamental-activity-main">
        <article className="practice-question-card">
          <p className="course-kicker">מעבדה · הרכבת המשוואה</p>
          <h2>הרכבת המשוואה ממערכת יסודית</h2>
          <p>
            הזינו שתי פונקציות. אם ניתן להשתמש בהן כמערכת יסודית של משוואה ליניארית הומוגנית
            מסדר שני, המעבדה תרכיב את המשוואה המנורמלת המתאימה.
          </p>

          <div className="formula-answer-card equation-assembler-inputs">
            <FormulaInput
              id="assembler-y1"
              label="y_1(x)="
              value={y1.value}
              preview={preview1}
              error={y1.parseError}
              onChange={updateY1}
              placeholder="exp(x)"
            />
            <FormulaInput
              id="assembler-y2"
              label="y_2(x)="
              value={y2.value}
              preview={preview2}
              error={y2.parseError}
              onChange={updateY2}
              placeholder="x*exp(x)"
            />

            <div className="practice-actions">
              <button className="panel-action" type="button" onClick={handleBuild}>
                הרכבת המשוואה
              </button>
            </div>

            {result?.status === "success" ? (
              <section className="panel-section quiz-feedback correct assembler-equation-hero">
                <strong>המשוואה המתקבלת</strong>
                <DisplayMath latex={result.equationLatex} />
              </section>
            ) : null}
          </div>
        </article>
      </main>

      <aside className="analysis-panel practice-feedback-panel fundamental-side-panel">
        <AssemblerResult result={result} />
      </aside>
    </div>
  );
}

function FormulaInput({
  id,
  label,
  value,
  preview,
  error,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  preview?: string;
  error?: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="equation-assembler-formula-block">
      <label className="formula-input-label" htmlFor={id}>
        <MathText math={label} variant="standard" />
        <input
          id={id}
          dir="ltr"
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
        />
      </label>
      <div className="formula-preview" aria-live="polite">
        <span>תצוגה מקדימה</span>
        {preview ? (
          <DisplayMath latex={`${label.replace("=", "")}=${preview}`} />
        ) : (
          <p>הקלידו ביטוי תקין להצגה.</p>
        )}
      </div>
      {error ? <p className="activity-hint assembler-parse-error">{error}</p> : null}
    </div>
  );
}

function AssemblerResult({ result }: { result: EquationFromBasisResult | null }) {
  if (!result) {
    return (
      <section className="panel-section quiz-feedback">
        <strong>ממתינים להרכבה</strong>
        <p>הזינו שתי פונקציות ולחצו על &quot;הרכבת המשוואה&quot;.</p>
      </section>
    );
  }

  if (result.status === "parseError") {
    return (
      <section className="panel-section quiz-feedback wrong">
        <strong>שגיאת קלט</strong>
        <p>
          לא הצלחנו לקרוא את הביטוי של{" "}
          <MathText math={`y_${result.index + 1}`} />. בדקו סוגריים ופונקציות ונסו שוב.
        </p>
      </section>
    );
  }

  if (result.status === "degenerateWronskian") {
    return (
      <section className="panel-section quiz-feedback wrong">
        <strong>אין מערכת יסודית</strong>
        <p>
          הוורונסקיאן של הפונקציות שהוזנו מתאפס זהותית, ולכן הן אינן יכולות לשמש מערכת יסודית
          של משוואה ליניארית הומוגנית מסדר שני מן הצורה המבוקשת.
        </p>
        <div className="feedback-verification">
          <span>הוורונסקיאן</span>
          <DisplayMath latex={result.wronskianLatex} />
        </div>
      </section>
    );
  }

  if (result.status === "inconclusive" || result.status === "invalidOrder") {
    return (
      <section className="panel-section quiz-feedback wrong">
        <strong>לא הצלחנו להשלים את החישוב</strong>
        <p>
          הפונקציות נקלטו בהצלחה, אך המערכת לא הצליחה להשלים ולאמת את החישוב הסימבולי בצורה
          אמינה. נסו לכתוב את הפונקציות בצורה פשוטה יותר.
        </p>
      </section>
    );
  }

  const qLatex = result.coefficientLatex[0];
  const pLatex = result.coefficientLatex[1];

  return (
    <>
      <section className="panel-section">
        <div className="section-heading">מקדמי המשוואה</div>
        <div className="feedback-verification">
          <DisplayMath latex={`p(x)=${pLatex}`} />
          <DisplayMath latex={`q(x)=${qLatex}`} />
        </div>
      </section>

      <section className="panel-section">
        <div className="section-heading">הוורונסקיאן</div>
        <DisplayMath latex={result.wronskianLatex} />
      </section>

      <section className="panel-section">
        <div className="section-heading">הפתרון הכללי</div>
        <DisplayMath latex={result.generalSolutionLatex} />
      </section>

      <section className="panel-section">
        <p className="activity-hint">{validityNote}</p>
      </section>
    </>
  );
}

function useLivePreview(value: string): string | undefined {
  return useMemo(() => {
    if (!value.trim()) return undefined;
    try {
      return parseFormula(value).latex;
    } catch {
      return undefined;
    }
  }, [value]);
}

function validateField(value: string): FormulaField {
  if (!value.trim()) {
    return { value, parseError: "יש להזין ביטוי." };
  }
  try {
    parseFormula(value);
    return { value };
  } catch {
    return { value, parseError: "לא הצלחנו לקרוא את הביטוי. בדקו סוגריים ופונקציות." };
  }
}

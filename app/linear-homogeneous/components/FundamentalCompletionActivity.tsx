"use client";

import { type ReactNode, useMemo, useState } from "react";
import { parseFormula } from "../math/formulaParser";
import {
  type AnswerVerificationResult,
  verifyFundamentalCompletionAnswer,
} from "../math/fundamentalCompletionVerifier";
import {
  type FundamentalCompletionDifficulty,
  generateFundamentalCompletionQuestion,
} from "../practice/fundamentalCompletionGenerator";
import { type FundamentalCompletionQuestion } from "../practice/fundamentalCompletionQuestions";
import { DisplayMath, MathText } from "./MathText";

type HintMethod = "abel" | "reduction";
type PracticeDifficulty = FundamentalCompletionDifficulty | "mixed";

type QuizSessionStats = {
  answered: number;
  correct: number;
  currentStreak: number;
  bestStreak: number;
};

const emptyResult: AnswerVerificationResult = { state: "idle" };
const emptyQuizStats: QuizSessionStats = {
  answered: 0,
  correct: 0,
  currentStreak: 0,
  bestStreak: 0,
};
const activitySeed = 0x104136;

const difficultyOptions: PracticeDifficulty[] = ["easy", "medium", "advanced", "mixed"];
const difficultyLabels: Record<PracticeDifficulty, string> = {
  easy: "קל",
  medium: "בינוני",
  advanced: "קשה",
  mixed: "מעורב",
};
const difficultySeedStep: Record<PracticeDifficulty, number> = {
  easy: 101,
  medium: 211,
  advanced: 307,
  mixed: 419,
};

const feedbackCopy: Record<
  AnswerVerificationResult["state"],
  { title: string; body: ReactNode; tone: string }
> = {
  idle: {
    title: "ממתינים לבדיקה",
    body: (
      <>
        הזינו מועמד ל־
        <MathText math="y_2(x)" />
        , ואז לחצו על בדיקה.
      </>
    ),
    tone: "",
  },
  parseError: {
    title: "לא הצלחנו לקרוא את הביטוי",
    body: "בדקו סוגריים, חזקות ושמות של פונקציות ונסו שוב.",
    tone: "wrong",
  },
  domainError: {
    title: "בעיה בתחום ההגדרה",
    body: "לא ניתן לאמת את הביטוי על הקטע הנתון. בדקו את תחום ההגדרה של הפונקציה.",
    tone: "wrong",
  },
  notSolution: {
    title: "עדיין לא פתרון",
    body: "הפונקציה שהוזנה אינה פתרון של המשוואה.",
    tone: "wrong",
  },
  solutionButDependent: {
    title: "פתרון תלוי",
    body: "מצאתם פתרון של המשוואה, אך הוא תלוי ליניארית בפתרון הנתון. לכן שני הפתרונות עדיין אינם מהווים מערכת יסודית.",
    tone: "wrong",
  },
  correct: {
    title: "נכון",
    body: "הפונקציה שהזנתם היא פתרון של המשוואה ובלתי־תלויה ליניארית בפתרון הנתון, ולכן שני הפתרונות מהווים מערכת יסודית על הקטע.",
    tone: "correct",
  },
  inconclusive: {
    title: "לא הצלחנו לאמת חד־משמעית",
    body: "נסו לכתוב את הביטוי בצורה פשוטה יותר.",
    tone: "wrong",
  },
};

function createQuestionState(
  attempt: number,
  number: number,
  difficulty: PracticeDifficulty,
  recentSignatures: string[] = [],
) {
  const question = generateFundamentalCompletionQuestion({
    seed: activitySeed,
    attempt,
    difficulty,
    excludeSignatures: recentSignatures,
  });
  return {
    attempt,
    number,
    recentSignatures,
    completed: false,
    question,
  };
}

function recordQuestionStarted(stats: QuizSessionStats): QuizSessionStats {
  return { ...stats, answered: stats.answered + 1 };
}

function recordIndependentCompletion(stats: QuizSessionStats): QuizSessionStats {
  const currentStreak = stats.currentStreak + 1;
  return {
    answered: stats.answered,
    correct: stats.correct + 1,
    currentStreak,
    bestStreak: Math.max(stats.bestStreak, currentStreak),
  };
}

function recordAbandonedQuestion(stats: QuizSessionStats): QuizSessionStats {
  return { ...stats, currentStreak: 0 };
}

export function FundamentalCompletionActivity() {
  const [difficulty, setDifficulty] = useState<PracticeDifficulty>("mixed");
  const [stats, setStats] = useState(() => recordQuestionStarted(emptyQuizStats));
  const [questionState, setQuestionState] = useState(() => createQuestionState(0, 1, "mixed"));
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<AnswerVerificationResult>(emptyResult);
  const [hintMethod, setHintMethod] = useState<HintMethod>("abel");
  const [visibleHints, setVisibleHints] = useState(0);

  const question = questionState.question;
  const preview = useMemo(() => {
    if (!answer.trim()) return undefined;
    try {
      return parseFormula(answer).latex;
    } catch {
      return undefined;
    }
  }, [answer]);

  function clearAnswerOnly() {
    setAnswer("");
    setResult(emptyResult);
    setVisibleHints(0);
    setHintMethod("abel");
  }

  function beginQuestion({
    seedStep,
    nextDifficulty = difficulty,
    abandonIncomplete = false,
  }: {
    seedStep: number;
    nextDifficulty?: PracticeDifficulty;
    abandonIncomplete?: boolean;
  }) {
    if (abandonIncomplete && !questionState.completed) {
      setStats((current) => recordAbandonedQuestion(current));
    }

    setDifficulty(nextDifficulty);
    setQuestionState((current) => {
      const recentSignatures = [
        current.question.signature ?? current.question.id,
        ...current.recentSignatures,
      ].slice(0, 5);
      const nextAttempt = current.attempt + seedStep;
      return createQuestionState(nextAttempt, current.number + 1, nextDifficulty, recentSignatures);
    });
    clearAnswerOnly();
    setStats((current) => recordQuestionStarted(current));
  }

  function handleAnswerChange(value: string) {
    setAnswer(value);
    if (!questionState.completed) {
      setResult(emptyResult);
    }
  }

  function handleCheck() {
    const next = verifyFundamentalCompletionAnswer(question, answer);
    setResult(next);
    if (next.state === "correct" && !questionState.completed) {
      setQuestionState((current) => ({ ...current, completed: true }));
      setStats((current) => recordIndependentCompletion(current));
    }
  }

  function showNextHint() {
    const maxHints = question.hints[hintMethod].length;
    setVisibleHints((current) => Math.min(current + 1, maxHints));
  }

  const accuracy =
    stats.answered === 0 ? 0 : Math.round((100 * stats.correct) / stats.answered);

  return (
    <div className="fundamental-activity-grid" aria-label="השלמה למערכת יסודית">
      <aside className="control-panel practice-panel">
        <section className="panel-section">
          <div className="section-heading">שאלה</div>
          <div className="fundamental-question-meta">
            <strong>שאלה {questionState.number}</strong>
            <span>
              {difficultyLabels[difficulty]}
              {difficulty === "mixed" && question.difficulty
                ? ` · ${difficultyLabels[question.difficulty]}`
                : ""}
            </span>
          </div>
        </section>

        <section className="panel-section">
          <div className="section-heading">רמת קושי</div>
          <div className="segmented-control">
            {difficultyOptions.map((option) => (
              <button
                key={option}
                className={difficulty === option ? "selected" : ""}
                type="button"
                onClick={() =>
                  beginQuestion({
                    seedStep: difficultySeedStep[option],
                    nextDifficulty: option,
                    abandonIncomplete: true,
                  })
                }
              >
                {difficultyLabels[option]}
              </button>
            ))}
          </div>
        </section>

        <section className="panel-section">
          <div className="section-heading">התקדמות</div>
          <div className="quiz-stats" aria-label="סטטיסטיקת תרגול">
            <span>שאלות: {stats.answered}</span>
            <span>נפתרו: {stats.correct}</span>
            <span>דיוק: {accuracy}%</span>
            <span>רצף: {stats.currentStreak}</span>
            <span>שיא רצף: {stats.bestStreak}</span>
          </div>
          <button
            type="button"
            className="panel-action"
            onClick={() => beginQuestion({ seedStep: 1, abandonIncomplete: true })}
          >
            שאלה חדשה
          </button>
          <button type="button" className="panel-action secondary" onClick={clearAnswerOnly}>
            איפוס תשובה
          </button>
          <button
            type="button"
            className="panel-action secondary"
            onClick={() => {
              setStats(recordQuestionStarted(emptyQuizStats));
              clearAnswerOnly();
              setQuestionState((current) => ({ ...current, completed: false }));
            }}
          >
            איפוס מעקב
          </button>
        </section>

        <section className="panel-section">
          <div className="section-heading">תחביר קלט</div>
          <p className="activity-hint">
            כתבו ביטוי ב־x עם כפל מפורש, למשל <code>3*x</code>, <code>exp(-3*x)</code>,{" "}
            <code>e^(-3*x)</code>, <code>ln(x)</code>, <code>sqrt(x+1)</code>,{" "}
            <code>sin(x)*cos(x)</code>.
          </p>
        </section>
      </aside>

      <main className="practice-main fundamental-activity-main">
        <article className="practice-question-card">
          <p className="course-kicker">
            תרגול · השלמה למערכת יסודית · {difficultyLabels[difficulty]}
          </p>
          <h2>השלמה למערכת יסודית</h2>
          <p>
            נתונה משוואה ליניארית הומוגנית מסדר שני ופתרון אחד שלה. מצאו פתרון נוסף כך ששני
            הפתרונות יהוו מערכת יסודית על הקטע הנתון.
          </p>

          <QuestionData question={question} />

          <div className="formula-answer-card">
            <label className="formula-input-label" htmlFor="fundamental-y2-input">
              <MathText math="y_2(x)=" variant="standard" />
              <input
                id="fundamental-y2-input"
                dir="ltr"
                type="text"
                value={answer}
                onChange={(event) => handleAnswerChange(event.target.value)}
                placeholder="exp(-3*x)"
                autoComplete="off"
                spellCheck={false}
              />
            </label>

            <div className="formula-preview" aria-live="polite">
              <span>תצוגה מקדימה</span>
              {preview ? <DisplayMath latex={`y_2(x)=${preview}`} /> : <p>הקלידו ביטוי תקין להצגה.</p>}
            </div>

            <div className="practice-actions">
              <button className="panel-action" type="button" onClick={handleCheck}>
                בדיקה
              </button>
              <button
                className="panel-action secondary"
                type="button"
                onClick={() => beginQuestion({ seedStep: 1, abandonIncomplete: false })}
                disabled={!questionState.completed}
              >
                שאלה הבאה
              </button>
            </div>
          </div>
        </article>
      </main>

      <aside className="analysis-panel practice-feedback-panel fundamental-side-panel">
        <Feedback result={result} />

        <section className="panel-section fundamental-hints">
          <div className="section-heading">רמזים</div>
          <div className="segmented-control">
            <button
              className={hintMethod === "abel" ? "selected" : ""}
              type="button"
              onClick={() => {
                setHintMethod("abel");
                setVisibleHints(0);
              }}
            >
              דרך נוסחת אבל
            </button>
            <button
              className={hintMethod === "reduction" ? "selected" : ""}
              type="button"
              onClick={() => {
                setHintMethod("reduction");
                setVisibleHints(0);
              }}
            >
              דרך הצבה <MathText math="y=vy_1" />
            </button>
          </div>

          <button className="panel-action secondary" type="button" onClick={showNextHint}>
            רמז
          </button>

          <div className="hint-step-list" aria-live="polite">
            {question.hints[hintMethod].slice(0, visibleHints).map((hint, index) => (
              <section className="calculation-card" key={`${hint.title}-${index}`}>
                <strong>{hint.title}</strong>
                {hint.text ? <p>{hint.text}</p> : null}
                {hint.latex ? <DisplayMath latex={hint.latex} /> : null}
              </section>
            ))}
            {visibleHints === 0 ? <p className="activity-hint">בחרו דרך ולחצו על רמז.</p> : null}
          </div>
        </section>
      </aside>
    </div>
  );
}

function QuestionData({ question }: { question: FundamentalCompletionQuestion }) {
  return (
    <div className="fundamental-given-data">
      <section>
        <span>המשוואה</span>
        <DisplayMath latex={question.equationLatex} />
      </section>
      <section>
        <span>פתרון נתון</span>
        <DisplayMath latex={question.knownSolutionLatex} />
      </section>
      <section>
        <span>הקטע</span>
        <DisplayMath latex={question.intervalLatex} />
      </section>
    </div>
  );
}

function Feedback({ result }: { result: AnswerVerificationResult }) {
  const copy = feedbackCopy[result.state];
  const className = ["panel-section", "quiz-feedback", copy.tone].filter(Boolean).join(" ");

  return (
    <section className={className} aria-live="polite">
      <strong>{copy.title}</strong>
      <p>{copy.body}</p>
      {result.residualLatex ? (
        <div className="feedback-verification">
          <span>בדיקת האופרטור</span>
          <DisplayMath latex={`L[y_2](x)=${result.residualLatex}`} />
        </div>
      ) : null}
      {result.wronskianLatex && result.state !== "solutionButDependent" ? (
        <div className="feedback-verification">
          <span>בדיקת וורונסקיאן</span>
          <DisplayMath latex={`W[y_1,y_2](x)=${result.wronskianLatex}`} />
        </div>
      ) : null}
      {result.state === "solutionButDependent" ? (
        <div className="feedback-verification">
          <span>בדיקת וורונסקיאן</span>
          <DisplayMath latex="W[y_1,y_2](x)=0" />
        </div>
      ) : null}
    </section>
  );
}

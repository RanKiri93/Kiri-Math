"use client";

import { useState } from "react";
import { OdeModuleBreadcrumbs } from "../ode/OdeModuleBreadcrumbs";
import { ConstantCoefficientsEulerIntro } from "./components/ConstantCoefficientsEulerIntro";
import { EquationAssemblerActivity } from "./components/EquationAssemblerActivity";
import { PracticeHub } from "./components/PracticeHub";
import type { EulerActivityTab } from "./types";

export function ConstantCoefficientsEulerModule() {
  const [activeTab, setActiveTab] = useState<EulerActivityTab>("intro");

  return (
    <main className="app-shell" dir="rtl">
      <header className="topbar">
        <div>
          <OdeModuleBreadcrumbs moduleId="constant-coefficients-euler" />
          <h1>משוואות במקדמים קבועים ומשוואות אוילר</h1>
        </div>
        <nav aria-label="לשוניות המודול">
          <button
            className={`module-pill ${activeTab === "intro" ? "active" : ""}`}
            type="button"
            onClick={() => setActiveTab("intro")}
          >
            מבוא
          </button>
          <button
            className={`module-pill ${activeTab === "equation-assembler" ? "active" : ""}`}
            type="button"
            onClick={() => setActiveTab("equation-assembler")}
          >
            הרכבת המשוואה
          </button>
          <button
            className={`module-pill ${activeTab === "equation-practice" ? "active" : ""}`}
            type="button"
            onClick={() => setActiveTab("equation-practice")}
          >
            תרגול
          </button>
        </nav>
      </header>

      {activeTab === "intro" ? (
        <ConstantCoefficientsEulerIntro />
      ) : activeTab === "equation-assembler" ? (
        <EquationAssemblerActivity />
      ) : (
        <PracticeHub />
      )}
    </main>
  );
}

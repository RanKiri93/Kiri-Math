"use client";

import { useState } from "react";
import { OdeModuleBreadcrumbs } from "../ode/OdeModuleBreadcrumbs";
import { EquationAssemblerActivity } from "./components/EquationAssemblerActivity";
import { LinearHomogeneousIntro } from "./components/LinearHomogeneousIntro";
import { PracticePlaceholder } from "./components/PracticePlaceholder";
import { WronskianPlaceholder } from "./components/WronskianPlaceholder";
import type { LinearHomogeneousTab } from "./types";

export function LinearHomogeneousModule() {
  const [activeTab, setActiveTab] = useState<LinearHomogeneousTab>("intro");

  return (
    <main className="app-shell" dir="rtl">
      <header className="topbar">
        <div>
          <OdeModuleBreadcrumbs moduleId="linear-homogeneous" />
          <h1>משוואות ליניאריות הומוגניות</h1>
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
            className={`module-pill ${activeTab === "wronskian" ? "active" : ""}`}
            type="button"
            onClick={() => setActiveTab("wronskian")}
          >
            וורונסקיאן
          </button>
          <button
            className={`module-pill ${activeTab === "practice" ? "active" : ""}`}
            type="button"
            onClick={() => setActiveTab("practice")}
          >
            תרגול
          </button>
        </nav>
      </header>

      {activeTab === "intro" ? (
        <LinearHomogeneousIntro />
      ) : activeTab === "equation-assembler" ? (
        <EquationAssemblerActivity />
      ) : activeTab === "wronskian" ? (
        <WronskianPlaceholder />
      ) : (
        <PracticePlaceholder />
      )}
    </main>
  );
}

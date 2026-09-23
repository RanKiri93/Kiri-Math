"use client";

import { useState } from "react";
import { OdeModuleBreadcrumbs } from "../ode/OdeModuleBreadcrumbs";
import { FunctionSequencesSection } from "./components/FunctionSequencesSection";
import { FunctionSequencesSeriesIntro } from "./components/FunctionSequencesSeriesIntro";
import { FunctionSeriesSection } from "./components/FunctionSeriesSection";
import { PowerSeriesSection } from "./components/PowerSeriesSection";
import { TaylorSeriesSection } from "./components/TaylorSeriesSection";
import type { FunctionSequencesSeriesTab } from "./types";

const TABS: { id: FunctionSequencesSeriesTab; label: string }[] = [
  { id: "intro", label: "מבוא" },
  { id: "function-sequences", label: "סדרות פונקציות" },
  { id: "function-series", label: "טורי פונקציות" },
  { id: "power-series", label: "טורי חזקות" },
  { id: "taylor-series", label: "טורי טיילור" },
];

function renderActiveTab(tab: FunctionSequencesSeriesTab) {
  switch (tab) {
    case "intro":
      return <FunctionSequencesSeriesIntro />;
    case "function-sequences":
      return <FunctionSequencesSection />;
    case "function-series":
      return <FunctionSeriesSection />;
    case "power-series":
      return <PowerSeriesSection />;
    case "taylor-series":
      return <TaylorSeriesSection />;
  }
}

export function FunctionSequencesSeriesModule() {
  const [activeTab, setActiveTab] = useState<FunctionSequencesSeriesTab>("intro");

  return (
    <main className="app-shell" dir="rtl">
      <header className="topbar module-page-topbar">
        <div>
          <OdeModuleBreadcrumbs moduleId="function-sequences-series" />
          <h1>סדרות וטורי פונקציות</h1>
        </div>
        <nav aria-label="לשוניות המודול">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`module-pill ${activeTab === tab.id ? "active" : ""}`}
              type="button"
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      {renderActiveTab(activeTab)}
    </main>
  );
}

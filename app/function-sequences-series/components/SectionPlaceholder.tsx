import type { ReactNode } from "react";

export type PlannedActivity = {
  title: string;
  detail: ReactNode;
};

type SectionPlaceholderProps = {
  ariaLabel: string;
  kicker?: string;
  title: string;
  description: ReactNode;
  plannedActivities: PlannedActivity[];
};

export function SectionPlaceholder({
  ariaLabel,
  kicker = "בקרוב",
  title,
  description,
  plannedActivities,
}: SectionPlaceholderProps) {
  return (
    <div className="module-intro-page" aria-label={ariaLabel}>
      <article className="module-intro-card module-intro-content">
        <p className="course-kicker">{kicker}</p>
        <h2>{title}</h2>
        {description}

        <div className="panel-section planned-activities">
          <div className="section-heading">פעילויות מתוכננות</div>
          <ol className="intro-numbered-list">
            {plannedActivities.map((activity) => (
              <li key={activity.title}>
                <strong>{activity.title}.</strong> {activity.detail}
              </li>
            ))}
          </ol>
        </div>

        <div className="embedded-placeholder">
          <span>פעילות אינטראקטיבית</span>
          <strong>בבנייה</strong>
        </div>
      </article>
    </div>
  );
}

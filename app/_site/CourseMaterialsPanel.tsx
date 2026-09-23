import type { CourseDefinition } from "./courseModel";
import { NotesReader } from "./NotesReader";

export function CourseMaterialsPanel({ course }: { course: CourseDefinition }) {
  return (
    <section className="course-panel">
      <header className="course-panel-header">
        <h1>חומר הקורס</h1>
        <p className="course-panel-lead">
          הרשימות המלאות של הקורס, לפי פרקים וסעיפים. בחירת סעיף בתוכן העניינים פותחת את הרשימות בעמוד שלו.
        </p>
      </header>

      <div className="resource-grid">
        {course.resources.map((resource) => (
          <a
            key={resource.id}
            className="resource-card"
            href={resource.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            <strong>{resource.title}</strong>
            <span>{resource.description}</span>
            <small>PDF · נפתח בלשונית חדשה</small>
          </a>
        ))}
      </div>

      <NotesReader course={course} />
    </section>
  );
}

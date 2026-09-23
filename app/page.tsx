import { BrandWordmark } from "./_site/BrandWordmark";
import { CourseCard } from "./_site/CourseCard";
import { courses } from "./courses";

export default function Home() {
  return (
    <main className="app-shell dashboard" dir="rtl">
      <header className="dashboard-header">
        <BrandWordmark />
      </header>

      <section className="dashboard-hero">
        <h1>הקורסים שלי</h1>
        <p>בחרו קורס כדי להיכנס לרשימות, לפרקים ולפעילויות האינטראקטיביות.</p>
      </section>

      <section className="dashboard-course-grid" aria-label="הקורסים שלי">
        {courses.map((course) => (
          <CourseCard key={course.slug} course={course} />
        ))}
      </section>
    </main>
  );
}

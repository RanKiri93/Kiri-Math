import { BrandWordmark } from "./_site/BrandWordmark";
import { CourseCard } from "./_site/CourseCard";
import { courses } from "./courses";
import { getCurrentUser } from "./_auth/server";
import { AccountBar } from "./_auth/AccountBar";
import { isCourseSlug } from "./_auth/model";

export default async function Home() {
  const user = await getCurrentUser();
  const heading = user ? "הקורסים שלי" : "הקורסים באתר";
  return (
    <main className="app-shell dashboard" dir="rtl">
      <header className="dashboard-header dashboard-header-auth">
        <BrandWordmark />
        <AccountBar user={user} />
      </header>

      <section className="dashboard-hero">
        <h1>{heading}</h1>
        <p>בחרו קורס כדי להיכנס לרשימות, לפרקים ולפעילויות האינטראקטיביות.</p>
      </section>

      <section className="dashboard-course-grid" aria-label={heading}>
        {courses.map((course) => (
          <CourseCard key={course.slug} course={course} access={!user ? "guest" : isCourseSlug(course.slug) && user.courses.includes(course.slug) ? "available" : "locked"} />
        ))}
      </section>
    </main>
  );
}

import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "../_auth/server";
import { isCourseSlug } from "../_auth/model";

export default async function AccessRequiredPage({ searchParams }: { searchParams: Promise<{ course?: string | string[] }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const params = await searchParams;
  const course = typeof params.course === "string" && isCourseSlug(params.course) ? params.course : null;
  if (course && user.courses.includes(course)) redirect(`/${course}`);
  return <main className="app-shell auth-page" dir="rtl"><section className="auth-panel access-panel">
    <h1>הקורס עדיין לא זמין</h1>
    <p>הגישה לקורס זה טרם נרשמה לחשבונכם. רישום הגישה לאחר הרכישה מתבצע ידנית.</p>
    <p>לבירור רכישה או גישה לקורס שכבר רכשתם, פנו למנהל האתר.</p>
    <Link className="panel-action auth-back-button" href="/" prefetch={false}>מעבר לקורסים שלי</Link>
  </section></main>;
}

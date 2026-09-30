import { redirect } from "next/navigation";
import Link from "next/link";
import { LoginForm } from "../_auth/LoginForm";
import { getCurrentUser } from "../_auth/server";
import { safeNextPath } from "../_auth/http";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const user = await getCurrentUser();
  if (user) redirect("/");
  const params = await searchParams;
  const next = safeNextPath(typeof params.next === "string" ? params.next : undefined);
  return <main className="app-shell auth-page" dir="rtl"><section className="auth-panel">
    <Link className="auth-back" href="/" prefetch={false}>מעבר לקורסים שלי</Link>
    <h1>התחברות</h1>
    <p>התחברו כדי להיכנס לקורסים הזמינים בחשבונכם.</p>
    <LoginForm next={next} />
  </section></main>;
}

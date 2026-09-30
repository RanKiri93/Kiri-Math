import type { SessionUser } from "./model";

export function AccountBar({ user }: { user: SessionUser | null }) {
  return user ? (
    <div className="account-bar">
      <span>שלום, <bdi>{user.username}</bdi></span>
      <form action="/api/auth/logout" method="post"><button type="submit" className="account-action">יציאה</button></form>
    </div>
  ) : <a className="account-action" href="/login">התחברות</a>;
}

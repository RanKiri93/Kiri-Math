"use client";

import { useState, type FormEvent } from "react";

type ErrorKind = "invalid" | "limited" | "unavailable" | "request";
const messages: Record<ErrorKind, string> = {
  invalid: "שם המשתמש או הסיסמה אינם נכונים.",
  limited: "בוצעו ניסיונות התחברות רבים מדי. נסו שוב מאוחר יותר.",
  unavailable: "שירות ההתחברות אינו זמין כרגע. נסו שוב מאוחר יותר.",
  request: "לא ניתן להשלים את ההתחברות כרגע. נסו שוב מאוחר יותר.",
};

export function LoginForm({ next }: { next: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<ErrorKind | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: form.get("username"), password: form.get("password"), next }),
      });
      if (response.ok) {
        const result: unknown = await response.json();
        if (typeof result === "object" && result !== null && "redirect" in result && typeof result.redirect === "string") {
          window.location.assign(result.redirect);
          return;
        }
      }
      const payload: unknown = await response.json().catch(() => null);
      const kind = typeof payload === "object" && payload !== null && "error" in payload ? payload.error : null;
      setError(kind === "invalid" || kind === "limited" || kind === "unavailable" ? kind : "request");
    } catch {
      setError("request");
    } finally {
      setPending(false);
    }
  }

  return <form className="login-form" onSubmit={submit}>
    <label>שם משתמש<input name="username" type="text" dir="ltr" autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={40} required disabled={pending} /></label>
    <label>סיסמה<input name="password" type="password" dir="ltr" autoComplete="current-password" maxLength={128} required disabled={pending} /></label>
    {error && <p className="login-error" role="alert">{messages[error]}</p>}
    <button className="panel-action" type="submit" disabled={pending}>{pending ? "מתחברים…" : "התחברות"}</button>
  </form>;
}

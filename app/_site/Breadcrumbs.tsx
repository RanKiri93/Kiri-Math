import Link from "next/link";
import type { Crumb } from "./courseModel";

export function Breadcrumbs({ items }: { items: readonly Crumb[] }) {
  return (
    <nav className="site-breadcrumbs" aria-label="מיקום באתר">
      <ol>
        {items.map((item) => (
          <li key={`${item.label}-${item.href ?? "current"}`}>
            {item.href ? (
              <Link href={item.href}>
                <bdi>{item.label}</bdi>
              </Link>
            ) : (
              <span aria-current="page">
                <bdi>{item.label}</bdi>
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

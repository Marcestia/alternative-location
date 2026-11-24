"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string; badge?: number };

const icons: Record<string, string> = {
  "/admin": "◫",
  "/admin/demandes": "↗",
  "/admin/reservations": "▦",
  "/admin/stock": "◇",
  "/admin/clients": "◎",
  "/admin/emails": "▤",
  "/admin/factures": "▤",
  "/admin/performance": "↗",
  "/admin/rapports": "▥",
  "/admin/indicateurs": "▥",
  "/admin/nettoyage": "✧",
  "/admin/parametres": "⚙",
};

export default function AdminNavigation({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="admin-navigation" aria-label="Administration">
      {items.map((item) => {
        const active =
          item.href === "/admin"
            ? pathname === item.href
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={active ? "is-active" : ""}
            aria-current={active ? "page" : undefined}
          >
            <span className="admin-nav-icon link-decoration" aria-hidden="true">
              {icons[item.href]}
            </span>
            <span>{item.label}</span>
            {item.badge !== undefined && item.badge > 0 ? (
              <span className="admin-nav-badge">{item.badge}</span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

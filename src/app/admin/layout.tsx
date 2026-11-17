import { privatePageMetadata } from "@/lib/seo";

import Link from "next/link";
import { adminLogout } from "@/app/actions/auth";
import { prisma } from "@/lib/prisma";
import {
  ContactStatus,
  InvoiceStatus,
  ReservationStatus,
} from "@/generated/prisma";
import AutoRefresh from "@/components/AutoRefresh";
import AdminNavigation from "@/components/AdminNavigation";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Script from "next/script";

export const metadata = privatePageMetadata;

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const store = await cookies();
  const token = store.get("al_admin")?.value;
  const adminToken = process.env.ADMIN_TOKEN ?? "change-me";
  if (!token || token !== adminToken) {
    redirect("/login");
  }

  const [
    newDemandes,
    quoteReceived,
    quotePending,
    newReservations,
    newInvoices,
  ] = await Promise.all([
    prisma.contactRequest.count({ where: { status: ContactStatus.NEW } }),
    prisma.contactRequest.count({
      where: { status: ContactStatus.QUOTE_RECEIVED },
    }),
    prisma.contactRequest.count({
      where: { status: ContactStatus.PENDING },
    }),
    prisma.reservation.count({
      where: { status: ReservationStatus.CONFIRMED },
    }),
    prisma.invoice.count({ where: { status: InvoiceStatus.DRAFT } }),
  ]);

  const demandesBadge = newDemandes + quoteReceived + quotePending;

  const navItems = [
    { label: "Accueil", href: "/admin" },
    {
      label: "Demandes",
      href: "/admin/demandes",
      badge: demandesBadge,
    },
    {
      label: "Réservations",
      href: "/admin/reservations",
      badge: newReservations,
    },
    { label: "Stock", href: "/admin/stock" },
    { label: "Clients", href: "/admin/clients" },
    {
      label: "Factures",
      href: "/admin/factures",
      badge: newInvoices,
    },
    { label: "Performance", href: "/admin/performance" },
    { label: "Rapports", href: "/admin/rapports" },
    { label: "Nettoyage", href: "/admin/nettoyage" },
    { label: "Paramètres", href: "/admin/parametres" },
  ];

  return (
    <div className="admin-shell">
      <AutoRefresh intervalMs={30000} />
      <Script id="admin-loading" strategy="afterInteractive">
        {`
          document.addEventListener('submit', (event) => {
            const form = event.target;
            if (!(form instanceof HTMLFormElement)) return;
            const button = form.querySelector('button[type=\"submit\"]');
            if (!(button instanceof HTMLButtonElement)) return;
            button.disabled = true;
            if (!button.classList.contains('is-loading')) {
              button.classList.add('is-loading');
            }
            if (!button.classList.contains('text-white')) {
              button.setAttribute('data-variant', 'light');
            }
          });
        `}
      </Script>
      <div className="admin-grid">
        <aside className="admin-sidebar">
          <Link
            href="/admin"
            className="admin-brand"
            aria-label="Alternative Location — Tableau de bord"
          >
            <span>alternative.</span>
            <small>VOTRE ESPACE ENTREPRISE</small>
          </Link>
          <AdminNavigation items={navItems} />
          <div className="admin-sidebar-bottom">
            <Link href="/" className="admin-site-link">
              Voir le site public ↗
            </Link>
            <form action={adminLogout}>
              <button className="admin-logout" type="submit">
                Se déconnecter
              </button>
            </form>
          </div>
        </aside>
        <div className="admin-content">
          <div className="admin-topbar">
            <span>Alternative Location / Gestion</span>
            <span className="admin-status">Espace entreprise</span>
          </div>
          <div className="admin-actions-scope space-y-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

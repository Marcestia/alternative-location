import Link from "next/link";
import { adminLogout } from "@/app/actions/auth";
import { prisma } from "@/lib/prisma";
import {
  ContactStatus,
  InvoiceStatus,
  ReservationStatus,
} from "@/generated/prisma";
import AutoRefresh from "@/components/AutoRefresh";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Script from "next/script";

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
    pendingReviews,
  ] = await Promise.all([
      prisma.contactRequest.count({ where: { status: ContactStatus.NEW } }),
      prisma.contactRequest.count({
        where: { status: ContactStatus.QUOTE_RECEIVED },
      }),
      prisma.contactRequest.count({
        where: { status: ContactStatus.PENDING },
      }),
      prisma.reservation.count({ where: { status: ReservationStatus.CONFIRMED } }),
      prisma.invoice.count({ where: { status: InvoiceStatus.DRAFT } }),
      prisma.review.count({ where: { status: "PENDING" } }),
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
    { label: "Avis", href: "/admin/avis", badge: pendingReviews },
    { label: "Clients", href: "/admin/clients" },
    {
      label: "Factures",
      href: "/admin/factures",
      badge: newInvoices,
    },
    { label: "Performance", href: "/admin/performance" },
    { label: "Nettoyage", href: "/admin/nettoyage" },
    { label: "Paramètres", href: "/admin/parametres" },
  ];

  return (
    <div className="min-h-screen bg-[color:var(--background)]">
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
      <div className="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 gap-6 px-6 py-8 lg:grid-cols-[240px_1fr]">
        <aside className="h-fit rounded-3xl border border-black/5 bg-white/80 p-6 shadow-[0_15px_30px_rgba(22,18,14,0.08)]">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
              Espace entreprise
            </p>
            <h2 className="text-2xl font-semibold">Alternative Location</h2>
          </div>
          <nav className="space-y-2 text-sm font-medium">
            {navItems.map((item) => (
              <Link
                key={item.href}
                className="flex items-center justify-between rounded-2xl px-4 py-2 text-[color:var(--muted)] transition hover:bg-[color:var(--surface)] hover:text-[color:var(--ink)]"
                href={item.href}
              >
                <span>{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <span className="rounded-full bg-[color:var(--accent)] px-2 py-0.5 text-[10px] font-semibold text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>
          <form action={adminLogout} className="mt-6">
            <button
              className="w-full rounded-2xl border border-black/10 px-4 py-2 text-xs font-semibold text-[color:var(--muted)] hover:border-black/20"
              type="submit"
            >
              Se déconnecter
            </button>
          </form>
        </aside>
        <div className="admin-actions-scope space-y-6">{children}</div>
      </div>
    </div>
  );
}

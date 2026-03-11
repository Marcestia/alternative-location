import { prisma } from "@/lib/prisma";
import { InvoiceStatus, QuoteStatus, ReservationStatus } from "@/generated/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const formatEuro = (value: number) =>
  value.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default async function PerformancePage() {
  const [
    totalReservations,
    upcomingReservations,
    totalQuotesSubmitted,
    totalQuotesAccepted,
    invoicesPaidCount,
    revenueInvoices,
    revenueQuotes,
    topItems,
    paidInvoicesForYearlyRevenue,
  ] = await Promise.all([
    prisma.reservation.count({ where: { status: ReservationStatus.CONFIRMED } }),
    prisma.reservation.count({
      where: { status: ReservationStatus.CONFIRMED, startDate: { gte: new Date() } },
    }),
    prisma.quote.count({ where: { status: QuoteStatus.SUBMITTED } }),
    prisma.quote.count({ where: { status: QuoteStatus.ACCEPTED } }),
    prisma.invoice.count({ where: { status: InvoiceStatus.PAID } }),
    prisma.invoice.aggregate({
      _sum: { totalAmountCents: true },
      where: { status: InvoiceStatus.PAID },
    }),
    prisma.quote.aggregate({
      _sum: { totalAmountCents: true },
      where: { status: QuoteStatus.ACCEPTED },
    }),
    prisma.reservationItem.groupBy({
      by: ["itemId"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
    prisma.invoice.findMany({
      where: { status: InvoiceStatus.PAID },
      select: { issueDate: true, totalAmountCents: true },
    }),
  ]);

  const topItemIds = topItems.map((entry) => entry.itemId);
  const topItemDetails = await prisma.item.findMany({
    where: { id: { in: topItemIds } },
  });
  const topItemsWithNames = topItems.map((entry) => {
    const item = topItemDetails.find((detail) => detail.id === entry.itemId);
    return {
      name: item?.name || "Article",
      qty: entry._sum.quantity || 0,
    };
  });

  const revenuePaid = (revenueInvoices._sum.totalAmountCents || 0) / 100;
  const revenuePotential = (revenueQuotes._sum.totalAmountCents || 0) / 100;
  const conversionRate =
    totalQuotesSubmitted > 0
      ? Math.round((totalQuotesAccepted / totalQuotesSubmitted) * 100)
      : 0;
  const avgInvoice = invoicesPaidCount > 0 ? revenuePaid / invoicesPaidCount : 0;

  const yearlyTotalsMap = new Map<string, number>();
  paidInvoicesForYearlyRevenue.forEach((invoice) => {
    const year = String(invoice.issueDate.getFullYear());
    yearlyTotalsMap.set(year, (yearlyTotalsMap.get(year) || 0) + invoice.totalAmountCents);
  });
  const yearlyRevenue = Array.from(yearlyTotalsMap.entries())
    .sort((a, b) => Number(b[0]) - Number(a[0]))
    .map(([year, totalCents]) => ({
      year,
      total: totalCents / 100,
    }));

  const kpis = [
    { label: "Reservations confirmees", value: totalReservations },
    { label: "Reservations a venir", value: upcomingReservations },
    { label: "Devis acceptes", value: totalQuotesAccepted },
    { label: "Taux de conversion", value: `${conversionRate}%` },
    { label: "CA facture paye", value: `${formatEuro(revenuePaid)} EUR` },
    { label: "Panier moyen", value: `${formatEuro(avgInvoice)} EUR` },
  ];

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-black/5 bg-white/80 p-8 shadow-[0_15px_30px_rgba(22,18,14,0.08)]">
        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
          Performance
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Tableau de bord</h1>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          Vue rapide des performances commerciales et operationnelles.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {kpis.map((stat) => (
          <div
            key={stat.label}
            className="rounded-3xl border border-black/5 bg-white/80 p-5 shadow-[0_18px_30px_rgba(30,25,20,0.06)]"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
              {stat.label}
            </p>
            <p className="mt-3 text-2xl font-semibold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-3xl border border-black/5 bg-white/80 p-6">
          <h2 className="text-xl font-semibold">Chiffre d'affaires</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-[color:var(--surface)] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                Factures payees
              </p>
              <p className="mt-2 text-lg font-semibold">
                {formatEuro(revenuePaid)} EUR
              </p>
            </div>
            <div className="rounded-2xl bg-[color:var(--surface)] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                Devis acceptes
              </p>
              <p className="mt-2 text-lg font-semibold">
                {formatEuro(revenuePotential)} EUR
              </p>
            </div>
          </div>
          <p className="mt-4 text-xs text-[color:var(--muted)]">
            CA factures payees = chiffre d'affaires confirme. Devis acceptes = potentiel.
          </p>
        </div>

        <div className="rounded-3xl border border-black/5 bg-[color:var(--surface-2)] p-6">
          <h2 className="text-xl font-semibold">Top materiel loue</h2>
          {topItemsWithNames.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-black/10 bg-white/70 p-6 text-sm text-[color:var(--muted)]">
              Pas encore de donnees.
            </div>
          ) : (
            <ul className="mt-4 space-y-3 text-sm">
              {topItemsWithNames.map((item) => (
                <li
                  key={item.name}
                  className="rounded-2xl bg-white/80 px-4 py-3"
                >
                  {item.name} — {item.qty} unites
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-black/5 bg-white/80 p-6">
        <h2 className="text-xl font-semibold">CA par annee</h2>
        {yearlyRevenue.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-black/10 bg-[color:var(--surface)] p-6 text-sm text-[color:var(--muted)]">
            Pas encore de donnees.
          </div>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {yearlyRevenue.map((entry) => (
              <div
                key={entry.year}
                className="rounded-2xl bg-[color:var(--surface)] px-4 py-3"
              >
                <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                  {entry.year}
                </p>
                <p className="mt-2 text-lg font-semibold">
                  {formatEuro(entry.total)} EUR
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
